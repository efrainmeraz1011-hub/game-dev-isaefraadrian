/**
 * R9 · Time, watches, and endurance.
 *
 * R9.1 Time only moves when the player commits [§1.4:102]. Reading the map,
 * planning and opening a menu cost nothing, which is enforced by nobody calling
 * advanceHours from an inspect action.
 */
import { CONFIG } from "../config.ts";
import { log } from "../log.ts";
import type { RunState } from "../state.ts";

/** R9.2 · Hours feed threat and burn rations [§6.5:1455, §1.10:321]. */
export function advanceHours(s: RunState, hours: number): void {
  if (hours <= 0) return;
  const before = s.hours;
  s.hours += hours;
  const days = Math.floor(s.hours / 24) - Math.floor(before / 24);
  if (days <= 0) return;

  const teams = s.teams.filter((t) => !t.lost).length;
  const want = days * teams * CONFIG.rations.perTeamPerDay;
  const got = Math.min(want, s.stocks.rations);
  s.stocks.rations -= got;

  if (got < want) {
    // R9.3 · Shortage accumulates and does not reset. Nothing clears it but food.
    s.morale = clampMorale(s.morale - CONFIG.rations.shortageMoralePerDay * days);
    log(s, "rations", `Short ${(want - got).toFixed(0)} rations`, {
      morale: Math.round(s.morale * 100) / 100,
      shortfall: Math.round(want - got),
    });
  }
}

/** R9.4 · Morale multiplies everything, and is bounded [§6.5:1475]. */
export function clampMorale(v: number): number {
  return Math.max(CONFIG.morale.min, Math.min(CONFIG.morale.max, v));
}

export function raiseThreat(s: RunState, points: number): void {
  s.threat = Math.max(0, Math.min(100, s.threat + points));
}
