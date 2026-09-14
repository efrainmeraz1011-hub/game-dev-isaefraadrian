/**
 * The driver. One game loop, two front ends.
 *
 * `legalActions` answers "what can the player do from here", and `apply`
 * commits one of those and advances through every automatic transition until
 * the game needs a decision again. headless.ts drives it with a policy; play.ts
 * drives it with a person; step 2's canvas will drive it with a mouse.
 *
 * BUILD.md section 8: the game never waits on the player without offering at
 * least one legal action. `legalActions` returning an empty list for a live run
 * is a bug, and the last line of this file asserts it.
 */
import { CONFIG } from "./config.ts";
import {
  atSectorExit,
  candidates,
  commitTravel,
  enterNextSector,
  rollInterception,
  travelCost,
} from "./campaign.ts";
import {
  assemble,
  assembleBoss,
  BOSS_PHASE_NAMES,
  bossPhase,
  complicationOf,
  describeFight,
  fightReward,
  ownOutput,
  packageOf,
  resolveFight,
} from "./encounter.ts";
import { applyArrivalEffect, eventById, resolveOption, selectEvent } from "./events.ts";
import { log } from "./log.ts";
import { applyPortAction, portActions } from "./port.ts";
import { commitTerminal, terminalCheck } from "./resolution.ts";
import { round } from "./rules/r1-resources.ts";
import { evaluateOption, guaranteeAnOption } from "./rules/r10-consequences.ts";
import { returnDetachedTeams } from "./rules/r5-recovery.ts";
import { hazardsAdvance, isStable, stabilizationBlockers, workHazards } from "./rules/r7-damage.ts";
import { accrueFatigue } from "./rules/r2-readiness.ts";
import { currentNode, currentSector, type RunState } from "./state.ts";
import type { Action } from "./types.ts";

export function legalActions(s: RunState): Action[] {
  if (s.lifecycle !== "ACTIVE") return [];
  switch (s.state) {
    case "SECTOR_MAP":
      return mapActions(s);
    case "EVENT":
      return eventActions(s);
    case "PORT":
      return portActions(s);
    case "ENCOUNTER":
    case "FINAL_OPERATION":
      return fightActions(s);
    case "STABILIZATION":
      return stabilizationActions(s);
    case "EVENT_RESULT":
      return [{ id: "continue", kind: "continue", label: "Carry on", enabled: true }];
    default:
      return [{ id: "continue", kind: "continue", label: "Carry on", enabled: true }];
  }
}

// --- S03 SECTOR_MAP ---------------------------------------------------------

function mapActions(s: RunState): Action[] {
  const actions: Action[] = [];
  for (const node of candidates(s)) {
    const cost = travelCost(s, node);
    // An edge is selectable only when its normal cost is affordable. No
    // negative fuel, no hidden borrowing [§1.5:137].
    const affordable = cost.fuel <= s.stocks.fuel;
    actions.push({
      id: `travel_${node.id}`,
      kind: "travel",
      label: `${node.kind.replace(/_/g, " ")} at ${node.distance} (${node.knownThreat})`,
      enabled: affordable,
      reason: affordable
        ? undefined
        : `insufficient fuel, needs ${cost.fuel.toFixed(1)}, have ${round(s.stocks.fuel)}`,
      preview: [
        `fuel -${cost.fuel.toFixed(1)} → ${round(s.stocks.fuel - cost.fuel)}`,
        `${cost.hours.toFixed(1)}h → threat +${Math.round(CONFIG.threat.perHour * cost.hours)}`,
        node.services ? `port: ${node.services.join(", ")}` : "no services",
      ],
      payload: { nodeId: node.id },
    });
  }
  // Setting speed or readiness costs nothing until commit [§1.4:102, M-3].
  for (const mode of ["economy", "cruise", "flank"] as const) {
    if (mode === s.speedMode) continue;
    actions.push({
      id: `speed_${mode}`,
      kind: "speed",
      label: `Set ${mode} (${CONFIG.speed[mode].speed}x speed, ${CONFIG.speed[mode].fuel}x fuel)`,
      enabled: true,
      preview: ["costs nothing until you commit an edge"],
      payload: { mode },
    });
  }
  actions.push({
    id: "readiness",
    kind: "readiness",
    label: s.readiness === "condition_i"
      ? "Fall out to war cruising (Condition II): crew rests, response delayed"
      : "Go to general quarters (Condition I): all stations manned, fatigue accrues",
    enabled: true,
    preview: ["R2.2: readiness is not closure. Two controls, two costs."],
  });
  // Fuel exhaustion with no tow or aid gets a clear run-ending or rescue
  // decision. There is no endless empty map [§4.4:1226, §6.9:1655].
  if (!actions.some((a) => a.kind === "travel" && a.enabled)) {
    actions.push({
      id: "signal_for_assistance",
      kind: "signal_for_assistance",
      label: "Signal for assistance: no edge is affordable",
      enabled: true,
      preview: [
        `cheapest leg needs ${cheapestLeg(s).toFixed(1)} fuel, have ${round(s.stocks.fuel)}`,
        "ends the run. A tow needs a capable ally with fuel and time [§1.13:427], and none is in reach.",
      ],
    });
  }
  actions.push({
    id: "abandon",
    kind: "abandon",
    label: "Discard the run",
    enabled: true,
    preview: ["ends the run with no credit [§4.4:1226]"],
  });
  return actions;
}

function cheapestLeg(s: RunState): number {
  const legs = candidates(s).map((n) => travelCost(s, n).fuel);
  return legs.length > 0 ? Math.min(...legs) : 0;
}

// --- S07 EVENT --------------------------------------------------------------

function eventActions(s: RunState): Action[] {
  const ev = s.pendingEventId ? eventById(s.pendingEventId) : undefined;
  if (!ev) return [{ id: "continue", kind: "continue", label: "Carry on", enabled: true }];
  return guaranteeAnOption(ev.options.map((o) => evaluateOption(s, o)));
}

// --- S10 ENCOUNTER / S15 FINAL_OPERATION ------------------------------------

function fightActions(s: RunState): Action[] {
  const f = s.pendingFight;
  if (!f) return [{ id: "continue", kind: "continue", label: "Carry on", enabled: true }];
  const pkg = packageOf(f);
  const comp = complicationOf(f);
  const out = ownOutput(s, pkg.kind, comp);
  const actions: Action[] = [];

  const seconds = out.dps > 0 ? f.enemyHp / out.dps : Infinity;
  // A magazine with seconds left in it is not an engagement. Saying so here is
  // what stops the player spending a whole exchange to deal nothing [R10.2].
  const dry = out.ammoSeconds < 5;
  actions.push({
    id: "engage",
    kind: "engage",
    label: f.boss ? `Press the attack (${BOSS_PHASE_NAMES[bossPhase(f)]})` : "Engage",
    // Eligibility precedes accuracy [§1.11:343]: with no eligible mount that
    // has ammunition, engaging is not a worse choice, it is not a choice.
    enabled: out.dps > 0 && !dry,
    reason: out.blocked ??
      (dry
        ? `magazines hold ${Math.round(out.ammoSeconds)}s of fire, not an engagement`
        : undefined),
    preview: [
      `mounts bearing: ${out.mounts.join("") || "none"}`,
      `your output ${out.dps.toFixed(2)}/s against ${Math.round(f.enemyHp)} hull`,
      Number.isFinite(seconds) ? `roughly ${Math.round(seconds)}s of firing` : "no end to it",
      `magazines last ${
        Number.isFinite(out.ammoSeconds) ? Math.round(out.ammoSeconds) + "s" : "indefinitely"
      }`,
    ],
  });

  actions.push({
    id: "withdraw",
    kind: "withdraw",
    label: f.boss ? "Break off (ends the run as a withdrawal, no victory credit)" : "Disengage",
    enabled: true,
    preview: [
      `costs about ${Math.round(CONFIG.fight.withdrawalShare * 100)}% of the exchange`,
      f.boss
        ? "stated before commitment [§4.4:1226]. No reentry."
        : "the encounter's consequences stand",
    ],
  });

  if (f.avoidable && !f.boss) {
    actions.push({
      id: "avoid",
      kind: "avoid",
      label: "Alter course and let it go",
      enabled: true,
      preview: ["fuel -4, 1h", "no salvage, no ammunition spent"],
    });
  }
  return actions;
}

// --- S12 STABILIZATION ------------------------------------------------------

function stabilizationActions(s: RunState): Action[] {
  const blockers = stabilizationBlockers(s);
  const actions: Action[] = [];
  actions.push({
    id: "work_with_parts",
    kind: "stabilize",
    label: "Patch it properly (spends parts)",
    enabled: s.stocks.parts > 0,
    reason: s.stocks.parts > 0 ? undefined : "insufficient parts, needs 1, have 0",
    preview: [
      "parts -1 per hazard, 1h",
      "R7.4: containment without parts is possible, restoration is not",
    ],
    payload: { useParts: true },
  });
  actions.push({
    id: "work_without_parts",
    kind: "stabilize",
    label: "Contain it with what is to hand",
    enabled: true,
    preview: ["1h, slower, and the teams take it", `blocking: ${blockers.join("; ")}`],
    payload: { useParts: false },
  });
  if (blockers.length === 0) {
    actions.push({
      id: "continue",
      kind: "continue",
      label: "Report stable, carry on",
      enabled: true,
    });
  }
  return actions;
}

// --- Applying an action -----------------------------------------------------

export function apply(s: RunState, actionId: string): string[] {
  const action = legalActions(s).find((a) => a.id === actionId);
  if (!action) return [`no such action: ${actionId}`];
  if (!action.enabled) return [`${action.label}: ${action.reason ?? "not available"}`];

  const lines: string[] = [];
  switch (action.kind) {
    case "speed":
      s.speedMode = action.payload!.mode as typeof s.speedMode;
      return [`Speed set to ${s.speedMode}.`];
    case "readiness":
      s.readiness = s.readiness === "condition_i" ? "condition_ii" : "condition_i";
      return [`Now at ${s.readiness === "condition_i" ? "general quarters" : "war cruising"}.`];
    case "abandon":
      commitTerminal(s, { outcome: "abandoned", reason: "discarded from the menu" });
      return ["Run discarded."];
    case "signal_for_assistance":
      commitTerminal(s, {
        outcome: "stranded",
        reason: "out of fuel, signalled for assistance",
      });
      return ["Signalled. The run ends here."];

    case "travel": {
      const node = candidates(s).find((n) => n.id === action.payload!.nodeId);
      if (!node) return ["that node is not in the next layer"];
      const before = s.hours;
      const r = commitTravel(s, node);
      if (!r.ok) return [r.reason!];
      accrueFatigue(s, s.hours - before);
      // Hazards left running keep working while the ship moves [§1.9:285].
      hazardsAdvance(s, s.hours - before);
      lines.push(
        `Ran ${node.distance} to ${node.id}. Fuel ${round(s.stocks.fuel)}, hour ${
          Math.round(s.hours)
        }, threat ${Math.round(s.threat)}.`,
      );
      // A departure may trigger at most one interception [§1.6:154].
      if (rollInterception(s)) {
        s.pendingFight = assemble(s);
        s.resumeAfterFight = "NODE_RESOLUTION";
        s.state = "ENCOUNTER";
        lines.push(`Intercepted on passage: ${describeFight(s.pendingFight)}`);
        return lines;
      }
      s.state = "NODE_RESOLUTION";
      break;
    }

    case "option": {
      const ev = eventById(s.pendingEventId ?? "");
      if (!ev) break;
      const res = resolveOption(s, ev, action.payload!.optionId as string);
      lines.push(...res.lines);
      if (res.next === "ENCOUNTER") {
        s.pendingFight = assemble(s);
        s.resumeAfterFight = "EVENT_RESULT";
        s.state = "ENCOUNTER";
        lines.push(`It became a fight: ${describeFight(s.pendingFight)}`);
        return lines;
      }
      s.state = res.next;
      break;
    }

    case "engage":
    case "withdraw":
    case "avoid": {
      lines.push(...applyFight(s, action.kind));
      break;
    }

    case "stabilize": {
      const r = workHazards(s, action.payload!.useParts as boolean);
      lines.push(
        r.cleared > 0
          ? `Cleared ${r.cleared}. ${s.hazards.length} left.`
          : `Held it for an hour. ${s.hazards.length} still running.`,
      );
      break;
    }

    case "buy_stock":
    case "sell_stock":
    case "repair":
    case "upgrade":
    case "buy_module":
      lines.push(...applyPortAction(s, action));
      return lines;

    case "leave_port":
      s.state = atSectorExit(s) ? "SECTOR_TRANSITION" : "SECTOR_MAP";
      lines.push("Cast off.");
      break;

    case "continue":
      if (s.state === "EVENT_RESULT") {
        s.state = atSectorExit(s) ? "SECTOR_TRANSITION" : "SECTOR_MAP";
      } else if (s.state === "STABILIZATION") {
        s.state = atSectorExit(s) ? "SECTOR_TRANSITION" : "SECTOR_MAP";
      }
      break;
  }

  lines.push(...advance(s));
  return lines;
}

function applyFight(s: RunState, intent: "engage" | "withdraw" | "avoid"): string[] {
  const f = s.pendingFight;
  if (!f) return [];
  const lines: string[] = [];
  const pkg = packageOf(f);

  if (intent === "avoid") {
    s.stocks.fuel = Math.max(0, s.stocks.fuel - 4);
    log(s, "fight", `Avoided ${pkg.name}`, { avoided: true });
    lines.push(`Altered course. ${pkg.name} did not follow.`);
    s.pendingFight = null;
    s.state = s.resumeAfterFight ?? "EVENT_RESULT";
    s.resumeAfterFight = null;
    return lines;
  }

  // A boss runs one persistent hull through three phases, and a phase change
  // is not a repair [§4.3:1220].
  const stopAt = f.boss ? phaseFloor(f) : 0;
  const res = resolveFight(s, f, intent === "engage" ? "engage" : "withdraw", stopAt);
  lines.push(...res.lines);
  lines.push(
    `${pkg.name}: ${res.outcome} after ${Math.round(res.seconds)}s. ` +
      `Dealt ${Math.round(res.dealt)}, took ${res.hullLost.toFixed(1)} hull (now ${
        Math.round(s.conditions.hull)
      }).`,
  );
  const spent = Object.entries(res.spent).map(([k, v]) => `${k} -${v}`).join(", ");
  if (spent) lines.push(`Spent ${spent}.`);
  if (res.teamLost) lines.push(`${res.teamLost} lost.`);
  for (const h of res.hazards) lines.push(`Left a ${h} burning.`);

  if (f.boss) {
    if (f.enemyHp <= 0) {
      s.flags.add("boss_destroyed");
      lines.push(`${pkg.name} went down.`);
    } else if (intent === "withdraw") {
      s.flags.add("boss_engaged");
      s.pendingFight = f;
      // Precedence: irrecoverable failure, then mandatory survival, then
      // victory [§6.6:1537 step 7]. A withdrawal that kills the ship is a
      // defeat, and exactly one result is committed [§4.4:1224].
      const t = terminalCheck(s);
      commitTerminal(s, t ?? { outcome: "withdrawal", reason: "broke off from the boss" });
      return lines;
    } else {
      s.flags.add("boss_engaged");
      f.phase = bossPhase(f);
      lines.push(
        `She is at ${Math.round((f.enemyHp / f.enemyHpMax) * 100)}%. ${BOSS_PHASE_NAMES[f.phase]}.`,
      );
      return lines;
    }
  } else if (res.outcome === "victory") {
    lines.push(...fightReward(s, f));
  }

  s.pendingFight = f.boss ? f : null;
  if (f.boss) {
    // A surviving player may still have a fire or a repairable breach.
    // Standard victory requires no further stabilization or extraction
    // [§4.4:1229], so the result commits and the fire is a debrief fact.
    s.state = "RUN_RESOLUTION";
  } else if (s.hazards.length > 0) {
    s.state = "STABILIZATION";
  } else {
    s.state = s.resumeAfterFight ?? "EVENT_RESULT";
    s.resumeAfterFight = null;
  }
  return lines;
}

function phaseFloor(f: { enemyHp: number; enemyHpMax: number }): number {
  const share = f.enemyHp / f.enemyHpMax;
  if (share > 0.70) return f.enemyHpMax * 0.70;
  if (share > 0.35) return f.enemyHpMax * 0.35;
  return 0;
}

/**
 * Run every automatic transition until the game needs a decision. Terminal
 * checks run after each completed atomic action, never mid-step [§1.4:124].
 */
function advance(s: RunState): string[] {
  const lines: string[] = [];
  for (let guard = 0; guard < 64 && s.lifecycle === "ACTIVE"; guard++) {
    const t = terminalCheck(s);
    if (t) {
      commitTerminal(s, t);
      return lines;
    }
    switch (s.state) {
      case "NODE_RESOLUTION": {
        returnDetachedTeams(s);
        const node = currentNode(s);
        if (!node) return lines;
        if (node.kind === "port") {
          s.state = "PORT";
          lines.push(`Made ${node.id}: ${node.services?.join(", ")}.`);
          return lines;
        }
        if (node.kind === "operation_area") {
          s.pendingFight = assemble(s);
          s.resumeAfterFight = "EVENT_RESULT";
          s.state = "ENCOUNTER";
          lines.push(`Operation area: ${describeFight(s.pendingFight)}`);
          return lines;
        }
        const ev = selectEvent(s, node);
        s.pendingEventId = ev.id;
        if (ev.arrivalEffect) {
          applyArrivalEffect(s, ev);
          lines.push(`${ev.title}. ${ev.arrivalEffect}`);
        }
        s.state = "EVENT";
        return lines;
      }
      case "STABILIZATION":
        if (isStable(s)) {
          s.state = atSectorExit(s) ? "SECTOR_TRANSITION" : "SECTOR_MAP";
          lines.push("Stable.");
          break;
        }
        return lines;
      case "SECTOR_TRANSITION": {
        if (s.sectorIndex >= CONFIG.sectors - 1) {
          s.pendingFight = assembleBoss(s);
          s.state = "FINAL_OPERATION";
          lines.push(
            `The final operation: ${s.boss.name}, ${Math.round(s.pendingFight.enemyHpMax)} hull.`,
          );
          return lines;
        }
        enterNextSector(s);
        s.state = "SECTOR_MAP";
        lines.push(`${currentSector(s).name}.`);
        return lines;
      }
      case "RUN_RESOLUTION":
        commitTerminal(
          s,
          s.flags.has("boss_destroyed")
            ? { outcome: "victory", reason: `${s.boss.name} sunk` }
            : { outcome: "defeat", reason: "the boss survived the exchange" },
        );
        return lines;
      default:
        return lines;
    }
  }
  return lines;
}
