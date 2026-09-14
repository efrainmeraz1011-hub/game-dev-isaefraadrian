/**
 * R7 · Damage control.
 *
 * R7.1 Damage runs in four independent layers [§1.9:254]: structural hull,
 *      local condition, hazards, and stability. A ship with hull remaining can
 *      still founder or capsize.
 * R7.2 Work is done by teams in rooms, and rooms are small [§1.8:220].
 *      STUB OPEN-04: no rooms exist yet, so step 1 charges the work in hours
 *      and teams rather than placing anyone.
 * R7.4 Material repair needs material [§6.5:1517]. Containment without parts is
 *      possible; restoration is not.
 */
import { CONFIG } from "../config.ts";
import { support } from "../content.ts";
import { log } from "../log.ts";
import { activeTeams, type RunState } from "../state.ts";
import type { Hazard } from "../types.ts";
import { hurtTeams } from "./r5-recovery.ts";
import { advanceHours } from "./r9-time.ts";

export function addHazard(s: RunState, h: Hazard): void {
  s.hazards.push(h);
  log(s, "hazard", `${h.kind}: ${h.note}`, { severity: h.severity });
}

/**
 * The stabilization test [§1.9:287]. Ordinary campaign travel needs all six.
 * They appear as one status with reasons, which is what this returns.
 */
export function stabilizationBlockers(s: RunState): string[] {
  const reasons: string[] = [];
  if (s.hazards.some((h) => h.kind === "fire")) reasons.push("an active fire");
  if (s.hazards.some((h) => h.kind === "breach")) reasons.push("ongoing water ingress");
  if (s.hazards.some((h) => h.kind === "flooding")) reasons.push("uncontained flooding");
  if (s.conditions.stability < 15) reasons.push("stability reserve below 15");
  if (activeTeams(s).some((t) => t.health < CONFIG.crew.retreatHealth)) {
    reasons.push("a team still taking hazard damage");
  }
  return reasons;
}

export function isStable(s: RunState): boolean {
  return stabilizationBlockers(s).length === 0;
}

/**
 * One round of damage-control work. Teams do the work and the hazard hurts them
 * while they do it [R7.3]. Parts cap what can be restored [R7.4].
 */
export function workHazards(s: RunState, useParts: boolean): { cleared: number; hours: number } {
  if (s.hazards.length === 0) return { cleared: 0, hours: 0 };
  const teams = activeTeams(s).length;
  if (teams === 0) return { cleared: 0, hours: 0 };

  // R7.2 · Three tokens per room producing 1.0 / 1.6 / 2.0. With no rooms yet,
  // the same diminishing return is applied to the whole crew.
  const pump = support(s.supportId).pump ?? 1;
  const work = [0, 1.0, 1.6, 2.0][Math.min(3, teams)] * pump;
  const hours = 1;
  advanceHours(s, hours);

  let cleared = 0;
  for (const h of [...s.hazards]) {
    const parts = useParts && s.stocks.parts > 0 ? 1 : 0;
    if (parts) s.stocks.parts -= 1;
    // Containment without parts is possible; restoration is not [R7.4].
    const progress = work * 18 * (parts ? 1.6 : 0.7);
    h.severity -= progress;
    if (h.severity <= 0) {
      s.hazards.splice(s.hazards.indexOf(h), 1);
      cleared++;
    }
  }
  // R7.3 · Fire, smoke and rising water damage the team's shared health.
  hurtTeams(s, 6 * s.hazards.length, "fighting a hazard");
  if (cleared > 0) log(s, "damage-control", `Cleared ${cleared} hazard(s)`, { cleared, hours });
  return { cleared, hours };
}

/** Hazards left unattended keep working on the ship [§1.9:285]. */
export function hazardsAdvance(s: RunState, hours: number): void {
  for (const h of s.hazards) {
    if (h.kind === "fire") {
      s.conditions.hull = Math.max(0, s.conditions.hull - 0.6 * hours);
      h.severity = Math.min(100, h.severity + 3 * hours);
    }
    if (h.kind === "breach" || h.kind === "flooding") {
      s.conditions.stability = Math.max(0, s.conditions.stability - 1.5 * hours);
    }
  }
  if (s.hazards.length > 0) hurtTeams(s, 1.5 * hours, "hazard exposure");
}

/** Field repair reaches 70% of system condition and no further [§1.9:283, R7.4]. */
export function fieldRepair(
  s: RunState,
  system: "propulsion" | "sensors" | "fireControl",
): boolean {
  const ceiling = CONFIG.economy.fieldRepairCeiling;
  if (s.conditions[system] >= ceiling) return false;
  if (s.stocks.parts < 1) return false;
  s.stocks.parts -= 1;
  s.conditions[system] = Math.min(ceiling, s.conditions[system] + 0.2);
  advanceHours(s, 2);
  log(s, "repair", `Field repair on ${system} to ${(s.conditions[system] * 100).toFixed(0)}%`);
  return true;
}
