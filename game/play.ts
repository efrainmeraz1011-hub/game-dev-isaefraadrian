/**
 * Play one run in the terminal.
 *
 *   deno task play
 *   deno task play --seed 4242 --hull reinforced --pattern heavy
 *
 * Step 2 replaces this with a canvas [BUILD.md section 4], and the point of the
 * sim/ui boundary is that it will do so without touching a line under sim/.
 * This file only reads state and prints it, exactly as ui/main.ts will.
 *
 * It will feel like a board game. That is correct for now.
 */
import { describeFight, packageOf } from "./sim/encounter.ts";
import { eventById } from "./sim/events.ts";
import { debrief } from "./sim/resolution.ts";
import { apply, legalActions } from "./sim/run.ts";
import { capacityFor } from "./sim/rules/r1-resources.ts";
import { activeTeams, createRun, currentSector, type RunState } from "./sim/state.ts";
import { type Action, type Faction, STOCK_KEYS } from "./sim/types.ts";
import { HULLS, PATTERNS } from "./sim/content.ts";
import type { DifficultyName } from "./sim/config.ts";

/**
 * Deno's prompt() returns null whenever stdin is not a terminal, which makes a
 * run impossible to drive from a script or a pipe. This reads lines either way,
 * so `printf '1\n2\n' | deno task play` replays a sequence of decisions.
 */
const decoder = new TextDecoder();
const encoder = new TextEncoder();
let stdinBuffer = "";

function readLine(promptText: string): string | null {
  Deno.stdout.writeSync(encoder.encode(promptText));
  while (!stdinBuffer.includes("\n")) {
    const chunk = new Uint8Array(1024);
    const n = Deno.stdin.readSync(chunk);
    if (n === null || n === 0) {
      const rest = stdinBuffer;
      stdinBuffer = "";
      return rest.length > 0 ? rest : null;
    }
    stdinBuffer += decoder.decode(chunk.subarray(0, n));
  }
  const i = stdinBuffer.indexOf("\n");
  const line = stdinBuffer.slice(0, i);
  stdinBuffer = stdinBuffer.slice(i + 1);
  return line;
}

const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const OFF = "\x1b[0m";

function statusBlock(s: RunState): string {
  const sec = currentSector(s);
  const layers = sec.layers.length;
  const head =
    `${sec.name} · sector ${s.sectorIndex + 1}/6 · layer ${
      Math.max(0, s.layerIndex + 1)
    }/${layers}` +
    ` · hour ${Math.round(s.hours)} (day ${Math.floor(s.hours / 24) + 1})`;

  const hull = `hull ${Math.round(s.conditions.hull)}/${s.conditions.hullMax}`;
  const cond = `stability ${Math.round(s.conditions.stability)}  morale ${s.morale.toFixed(2)}` +
    `  threat ${Math.round(s.threat)}`;

  const stocks = STOCK_KEYS
    .filter((k) => capacityFor(s, k) > 0)
    .map((k) => `${k} ${Math.round(s.stocks[k])}/${capacityFor(s, k)}`)
    .join("  ");

  const crew = activeTeams(s)
    .map((t) => `${t.name.split(" ")[0]}${t.health < 100 ? ` ${Math.round(t.health)}%` : ""}`)
    .join(", ");
  const away = s.teams.filter((t) => t.detachedUntilNode !== null).length;
  const lost = s.teams.filter((t) => t.lost).length;

  const kit = `Scrap ${Math.round(s.scrap)}  upgrades ${s.upgrades}  speed ${s.speedMode}` +
    `  ${s.readiness === "condition_i" ? "general quarters" : "war cruising"}`;

  const hazards = s.hazards.length > 0
    ? `\n${BOLD}running:${OFF} ${
      s.hazards.map((h) => `${h.kind} (${Math.round(h.severity)})`).join(", ")
    }`
    : "";

  return [
    `${BOLD}${head}${OFF}`,
    `${hull}  ${cond}`,
    `${DIM}${stocks}${OFF}`,
    `teams: ${crew || "none aboard"}${away ? ` · ${away} detached` : ""}${
      lost ? ` · ${lost} lost` : ""
    }`,
    `${DIM}${kit}${OFF}${hazards}`,
  ].join("\n");
}

function scene(s: RunState): string {
  switch (s.state) {
    case "EVENT": {
      const ev = s.pendingEventId ? eventById(s.pendingEventId) : undefined;
      if (!ev) return "";
      return `\n${BOLD}${ev.id} · ${ev.title}${OFF}\n${DIM}${ev.family} · ${ev.shape}${OFF}`;
    }
    case "ENCOUNTER":
    case "FINAL_OPERATION": {
      const f = s.pendingFight;
      if (!f) return "";
      const pkg = packageOf(f);
      const share = Math.round((f.enemyHp / f.enemyHpMax) * 100);
      return `\n${BOLD}${describeFight(f)}${OFF}\n${DIM}${pkg.kind} · ${
        Math.round(f.enemyHp)
      } hull (${share}%)${OFF}`;
    }
    case "PORT":
      return `\n${BOLD}In port${OFF}\n${DIM}nothing here costs time until you commit it [§1.5:143]${OFF}`;
    case "STABILIZATION":
      return `\n${BOLD}Not stable${OFF}`;
    default:
      return "";
  }
}

/**
 * Only the selectable actions take a number, so what the player types always
 * maps to something they can do. A gated option stays on screen with its
 * requirement named, because that is what teaches them what to buy
 * [EVENTS.md section 4]; it just has no number.
 */
function render(enabled: Action[], blocked: Action[]): string {
  const lines = enabled.map((a, i) => {
    const head = `  ${String(i + 1).padStart(2)}) ${a.label}`;
    const preview = (a.preview ?? []).map((p) => `        ${DIM}${p}${OFF}`).join("\n");
    return preview ? `${head}\n${preview}` : head;
  });
  for (const a of blocked) {
    lines.push(`  ${DIM}  · ${a.label} — ${a.reason}${OFF}`);
  }
  return lines.join("\n");
}

function main() {
  const args = Deno.args;
  const flag = (name: string, fallback: string) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : fallback;
  };
  const seed = Number(flag("seed", String(Math.floor(Math.random() * 1e6))));
  const hullId = flag("hull", "flexible");
  const pattern = flag("pattern", "mixed");

  const s = createRun({
    seed,
    faction: flag("faction", "american") as Faction,
    hullId,
    pattern,
    supportId: flag("support", "control"),
    loadoutId: flag("loadout", "escort"),
    difficulty: flag("difficulty", "normal") as DifficultyName,
  });

  const h = HULLS.find((x) => x.id === hullId)!;
  console.log(
    `\n${BOLD}Seed ${seed}${OFF} · ${s.faction} · ${h.name} · ${
      PATTERNS[pattern]?.name ?? pattern
    }`,
  );
  // Shown before commit [§2.1:663]: the final boss objective, the ship's actual
  // strengths and weaknesses, and starting supply endurance.
  console.log(
    `${DIM}The final operation will be ${s.boss.name}. Every run is a seed: quote it in a bug.${OFF}`,
  );

  let lastLines: string[] = [];
  while (s.lifecycle === "ACTIVE") {
    const actions = legalActions(s);
    const enabled = actions.filter((a) => a.enabled);
    const blocked = actions.filter((a) => !a.enabled);
    console.log("\n" + "─".repeat(76));
    console.log(statusBlock(s));
    console.log(scene(s));
    for (const l of lastLines) console.log(`  ${l}`);
    console.log("");
    console.log(render(enabled, blocked));

    const answer = readLine("\n> ")?.trim() ?? "q";
    if (answer === "q") {
      console.log("Suspended. No time passed [§1.4:102].");
      return;
    }
    const pick = enabled[Number(answer) - 1];
    if (!pick) {
      lastLines = [`pick a number from 1 to ${enabled.length}, or q to suspend`];
      continue;
    }
    lastLines = apply(s, pick.id);
  }

  const d = debrief(s);
  console.log("\n" + "═".repeat(76));
  console.log(`${BOLD}${d.outcome.toUpperCase()}${OFF} — ${d.reason}`);
  console.log(
    `${d.faction} · ${d.build} · sector ${d.sectorsReached} · ${d.hours}h · ${d.nodesVisited} nodes · seed ${d.seed}`,
  );
  console.log(
    `boss ${d.bossArchetype}, phase ${d.bossPhaseReached + 1}, destroyed: ${d.bossDestroyed}`,
  );
  console.log(`teams lost: ${d.teamsLost.join(", ") || "none"}`);
  console.log(`ended with ${d.scrap} Scrap, ${d.upgrades} upgrades`);
  console.log(`modules: ${d.modules.join(", ")}`);
  console.log(
    `\n${BOLD}what happened${OFF} ${DIM}(walked from the log, not written [R10.4])${OFF}`,
  );
  for (const t of d.timeline) console.log("  " + t);
  console.log("═".repeat(76));
}

if (import.meta.main) main();
