/**
 * Play N runs with no browser and print the spread of outcomes.
 *
 *   deno task run 200
 *   deno task run 200 --policy cautious --seed 9000
 *   deno task run 1 --seed 4242 --trace
 *
 * This is the whole point of the sim/ui boundary: two hundred runs in a few
 * seconds, long before any art exists [BUILD.md section 2]. Every run is a
 * seed, so every bug report is a seed [BUILD.md section 7].
 */
import { CONFIG } from "./sim/config.ts";
import { HULLS, PATTERNS } from "./sim/content.ts";
import { debrief } from "./sim/resolution.ts";
import { apply, legalActions } from "./sim/run.ts";
import { createRun, type RunState } from "./sim/state.ts";
import { capacityFor } from "./sim/rules/r1-resources.ts";
import type { Action, Faction, StockKey, TerminalOutcome } from "./sim/types.ts";

type Policy = "cautious" | "balanced" | "aggressive";

/** A coarse forecast, exactly as much as the interface actually shows a player. */
function choose(s: RunState, actions: Action[], policy: Policy): Action {
  const usable = actions.filter((a) => a.enabled);
  if (usable.length === 0) return actions[0];

  const travel = usable.filter((a) => a.kind === "travel");
  if (travel.length > 0) {
    const risk = (a: Action) => {
      const label = a.label;
      const threat = label.includes("contested")
        ? 1.0
        : label.includes("patrolled")
        ? 0.6
        : label.includes("unknown")
        ? 0.75
        : 0.2;
      const distance = Number(label.match(/at ([\d.]+)/)?.[1] ?? 10) / 14;
      return policy === "cautious"
        ? -(threat * 1.2 + distance)
        : policy === "aggressive"
        ? threat - distance * 0.4
        : -(threat * 0.7 + distance * 0.8);
    };
    // A port is worth reaching when the tanks are getting low.
    const hurt = s.conditions.hull < s.conditions.hullMax * 0.75;
    const repairPort = travel.find((a) => (a.preview ?? []).some((p) => p.includes("repair")));
    if (hurt && repairPort) return repairPort;
    const lowFuel = s.stocks.fuel < 40;
    const port = travel.find((a) => (a.preview ?? []).some((p) => p.startsWith("port:")));
    if (lowFuel && port) return port;
    return travel.reduce((best, a) => (risk(a) > risk(best) ? a : best));
  }

  const port = usable.filter((a) =>
    ["buy_stock", "repair", "upgrade", "buy_module", "sell_stock", "leave_port"].includes(a.kind)
  );
  if (port.length > 0) return portPolicy(s, port);

  // R2.4: general quarters costs rest, so it is worth holding only when a
  // contact is likely. Threat past the first threshold, or the last sector.
  const readiness = usable.find((a) => a.kind === "readiness");
  if (readiness) {
    const wantGQ = s.threat >= 30 || s.sectorIndex >= 5;
    if (wantGQ !== (s.readiness === "condition_i")) return readiness;
  }

  const fight = usable.find((a) => a.kind === "engage");
  if (fight) {
    const avoid = usable.find((a) => a.kind === "avoid");
    const withdraw = usable.find((a) => a.kind === "withdraw");
    const hurt = s.conditions.hull < s.conditions.hullMax * (policy === "aggressive" ? 0.22 : 0.42);
    if (hurt && avoid) return avoid;
    if (hurt && withdraw && policy === "cautious") return withdraw;
    return fight;
  }

  const signal = usable.find((a) => a.kind === "signal_for_assistance");
  if (signal) return signal;

  const stabilize = usable.find((a) => a.kind === "stabilize" && a.payload?.useParts === true);
  if (stabilize) return stabilize;

  // Prefer an option that spends something over one that spends nothing, but
  // not when the stock it spends is the one running out.
  const options = usable.filter((a) => a.kind === "option");
  if (options.length > 0) {
    const score = (a: Action) => {
      const p = (a.preview ?? []).join(" ");
      let v = 0;
      if (p.includes("costs nothing")) v -= 0.4;
      if (/fuel -/.test(p) && s.stocks.fuel < 35) v -= 2;
      if (/hours/.test(p) || /→ hour/.test(p)) v -= 0.25;
      if (/rations -/.test(p) && s.stocks.rations < 4) v -= 2;
      if (/team detached/.test(p)) v -= 0.6;
      if (/gone for the run/.test(p)) v -= 4;
      if (/threat \+/.test(p)) v -= policy === "cautious" ? 0.8 : 0.3;
      if (/hull -/.test(p)) v -= 1.2;
      if (/cargo -/.test(p)) v += 0.7;
      return v + (policy === "aggressive" ? 0.5 : 0);
    };
    return options.reduce((best, a) => (score(a) > score(best) ? a : best));
  }

  return usable[0];
}

function portPolicy(s: RunState, actions: Action[]): Action {
  // Replenishment and recovery before offence, in that order, the way the
  // balance model's purchase policy runs. A competent player buys plates and
  // ammunition before a bigger gun.
  const find = (id: string) => actions.find((a) => a.id === id);
  const below = (key: StockKey, share: number) => s.stocks[key] < capacityFor(s, key) * share;

  const fuel = find("buy_fuel");
  if (fuel && below("fuel", 0.5)) return fuel;

  const repair = actions.find((a) => a.kind === "repair");
  if (repair && s.conditions.hull < s.conditions.hullMax * 0.8) return repair;

  if (fuel && below("fuel", 0.85)) return fuel;
  for (const key of ["rations", "parts", "medical"] as StockKey[]) {
    const a = find(`buy_${key}`);
    if (a && below(key, 0.7)) return a;
  }
  // Ammunition, including the torpedoes that are the only thing on this deck
  // that goes through armour.
  for (const key of ["torpedo", "shell", "depth", "aa"] as StockKey[]) {
    const a = find(`buy_${key}`);
    if (a && below(key, 0.8)) return a;
  }

  const upgrade = actions.find((a) => a.kind === "upgrade");
  // The preparation service before the final operation [§4.2:1200]: at the last
  // sector there is nothing left to save for.
  const lastSector = s.sectorIndex >= 5;
  if (upgrade && (lastSector || s.scrap > 70)) return upgrade;

  const sensor = actions.find((a) => a.id === "buy_radar_2" || a.id === "buy_sonar_2");
  if (sensor && s.scrap > 140) return sensor;

  return actions.find((a) => a.kind === "leave_port")!;
}

export function playOne(
  seed: number,
  opts: {
    policy: Policy;
    hull: string;
    pattern: string;
    support: string;
    faction: Faction;
    trace?: boolean;
  },
) {
  const s = createRun({
    seed,
    faction: opts.faction,
    hullId: opts.hull,
    pattern: opts.pattern,
    supportId: opts.support,
    loadoutId: "escort",
    difficulty: "normal",
  });

  let steps = 0;
  let hullAtBoss: number | null = null;
  while (s.lifecycle === "ACTIVE" && steps < 4000) {
    if (hullAtBoss === null && s.state === "FINAL_OPERATION") hullAtBoss = s.conditions.hull;
    const actions = legalActions(s);
    if (actions.length === 0) {
      // BUILD.md section 8: the game never waits without a legal action.
      throw new Error(`no legal action in ${s.state} (seed ${seed}, step ${steps})`);
    }
    const pick = choose(s, actions, opts.policy);
    const from = s.state;
    const lines = apply(s, pick.id);
    if (opts.trace) {
      console.log(`\n[${from}] ${pick.label}`);
      for (const l of lines) console.log(`   ${l}`);
    }
    steps++;
  }
  if (s.lifecycle === "ACTIVE") {
    s.lifecycle = "TERMINAL_PENDING";
    s.outcome = "abandoned";
    s.outcomeReason = `step limit reached in ${s.state}`;
  }
  s.lifecycle = "ARCHIVED";
  return { state: s, report: debrief(s), steps, hullAtBoss };
}

function main() {
  const args = [...Deno.args];
  const flag = (name: string, fallback: string) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : fallback;
  };
  const trace = args.includes("--trace");
  const count = Number(args.find((a) => /^\d+$/.test(a)) ?? 200);
  const policy = flag("policy", "balanced") as Policy;
  const baseSeed = Number(flag("seed", "1000"));
  const hullId = flag("hull", "flexible");
  const pattern = flag("pattern", "mixed");
  const supportId = flag("support", "control");
  const faction = flag("faction", "american") as Faction;

  const outcomes = new Map<TerminalOutcome, number>();
  const reasons = new Map<string, number>();
  const sectors: number[] = [];
  const hours: number[] = [];
  const nodes: number[] = [];
  const endFuel: number[] = [];
  const endScrap: number[] = [];
  const portsUsed: number[] = [];
  const upgrades: number[] = [];
  const fights: number[] = [];
  const repairs: number[] = [];
  const hullLostPerFight: number[] = [];
  const teamsLost: number[] = [];
  const hullAtBoss: number[] = [];
  const income: number[] = [];
  const t0 = performance.now();

  for (let i = 0; i < count; i++) {
    const { report, state, hullAtBoss: hb } = playOne(baseSeed + i, {
      policy,
      hull: hullId,
      pattern,
      support: supportId,
      faction,
      trace: trace && count === 1,
    });
    outcomes.set(report.outcome, (outcomes.get(report.outcome) ?? 0) + 1);
    reasons.set(report.reason, (reasons.get(report.reason) ?? 0) + 1);
    sectors.push(report.sectorsReached);
    hours.push(report.hours);
    nodes.push(report.nodesVisited);
    endFuel.push(Math.round(state.stocks.fuel));
    endScrap.push(Math.round(state.scrap));
    portsUsed.push(state.log.filter((e) => e.kind === "port").length);
    upgrades.push(report.upgrades);
    const fl = state.log.filter((e) => e.kind === "fight" && e.facts?.hullLost !== undefined);
    fights.push(fl.length);
    for (const e of fl) hullLostPerFight.push(e.facts!.hullLost as number);
    repairs.push(
      state.log.filter((e) => e.kind === "port" && e.text.startsWith("Repaired")).length,
    );
    teamsLost.push(report.teamsLost.length);
    if (hb !== null) hullAtBoss.push(Math.round(hb));
    income.push(state.log.reduce((a, e) => a + Math.max(0, (e.facts?.scrap as number) ?? 0), 0));
    if (trace && count === 1) printDebrief(report);
  }

  const ms = performance.now() - t0;
  console.log(
    `\n${count} runs · ${hullId}/${
      PATTERNS[pattern]?.deck ?? pattern
    }/${supportId} · ${policy} · seeds ${baseSeed}..${baseSeed + count - 1} · ${ms.toFixed(0)}ms`,
  );
  console.log("-".repeat(72));
  for (const [outcome, n] of [...outcomes].sort((a, b) => b[1] - a[1])) {
    const pct = ((n / count) * 100).toFixed(1).padStart(5);
    console.log(`${outcome.padEnd(12)} ${String(n).padStart(4)}  ${pct}%  ${bar(n / count)}`);
  }
  console.log("-".repeat(72));
  console.log(
    `sector reached  mean ${mean(sectors).toFixed(2)}  median ${median(sectors)}  ${
      histogram(sectors, 1, CONFIG.sectors)
    }`,
  );
  console.log(`campaign hours  mean ${mean(hours).toFixed(0)}  median ${median(hours)}`);
  console.log(`nodes visited   mean ${mean(nodes).toFixed(1)}  median ${median(nodes)}`);
  console.log(
    `fuel at end     mean ${mean(endFuel).toFixed(1)}   scrap at end mean ${
      mean(endScrap).toFixed(0)
    }`,
  );
  console.log(
    `port purchases  mean ${mean(portsUsed).toFixed(1)}   upgrades mean ${
      mean(upgrades).toFixed(2)
    }   repairs mean ${mean(repairs).toFixed(2)}`,
  );
  console.log(
    `fights per run  mean ${mean(fights).toFixed(1)}   hull lost per fight mean ${
      mean(hullLostPerFight).toFixed(1)
    }   teams lost mean ${mean(teamsLost).toFixed(2)}`,
  );
  console.log(`Scrap income    mean ${mean(income).toFixed(0)}`);
  console.log(
    `reached the boss  ${hullAtBoss.length} runs, hull on arrival mean ${
      mean(hullAtBoss).toFixed(0)
    }  median ${median(hullAtBoss)}`,
  );
  console.log("\nhow runs ended:");
  for (const [reason, n] of [...reasons].sort((a, b) => b[1] - a[1]).slice(0, 8)) {
    console.log(`  ${String(n).padStart(4)}  ${reason}`);
  }
}

function printDebrief(d: ReturnType<typeof debrief>) {
  console.log("\n" + "=".repeat(72));
  console.log(`DEBRIEF  ${d.outcome.toUpperCase()} — ${d.reason}`);
  console.log(
    `seed ${d.seed} · ${d.faction} · ${d.build} · sector ${d.sectorsReached} · ${d.hours}h · ${d.nodesVisited} nodes`,
  );
  console.log(
    `boss ${d.bossArchetype}, phase ${d.bossPhaseReached + 1}, destroyed: ${d.bossDestroyed}`,
  );
  console.log(`teams lost: ${d.teamsLost.join(", ") || "none"}`);
  console.log(
    `spent: ${
      Object.entries(d.suppliesSpent).map(([k, v]) => `${k} ${Math.round(v)}`).join(", ") ||
      "nothing logged"
    }`,
  );
  console.log(
    `ended with ${d.scrap} Scrap, ${d.upgrades} upgrades, modules ${d.modules.join(", ")}`,
  );
  console.log("\ntimeline:");
  for (const t of d.timeline) console.log("  " + t);
  console.log("=".repeat(72));
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] ?? 0;
const bar = (frac: number) => "█".repeat(Math.round(frac * 32));

function histogram(xs: number[], lo: number, hi: number): string {
  const counts: number[] = [];
  for (let v = lo; v <= hi; v++) counts.push(xs.filter((x) => x === v).length);
  return counts.map((c, i) => `${i + lo}:${c}`).join(" ");
}

if (import.meta.main) {
  // Referenced so a bad hull id fails loudly at startup rather than silently.
  if (!HULLS.length) throw new Error("no hulls in content");
  main();
}
