/**
 * R2 · Readiness, and the cost of being ready.
 *
 * R2.1 A destroyer has two readiness conditions, not three [S295 §22-8].
 * R2.2 Readiness is not closure. Two controls, two costs [S295 §22-9].
 * R2.4 Holding Condition I accrues fatigue [S292 para. 400]. The captain who
 *      runs at general quarters through a quiet sector arrives at the dangerous
 *      one with a tired crew.
 * R2.5 A station at reduced manning produces reduced output, not zero
 *      [S293 ch. 2]. That is the staffing factor at §6.5:1468.
 */
import { CONFIG } from "../config.ts";
import { activeTeams, type RunState } from "../state.ts";
import { clampMorale } from "./r9-time.ts";

/** STUB OPEN-16: no station list exists, so this is teams against a nominal six. */
export function staffingFactor(s: RunState): number {
  const manned = activeTeams(s).length;
  const want = CONFIG.crew.startTeams;
  const base = Math.min(1, manned / want);
  // R2.5: reduced manning is reduced output, never zero, down to a one-man mode.
  return 0.35 + 0.65 * base;
}

/** R2.3 · Going to stations takes time. A contact met in transit is fought partly manned. */
export function readinessResponse(s: RunState): { multiplier: number; note: string } {
  if (s.readiness === "condition_i") {
    return { multiplier: 1.0, note: "at general quarters" };
  }
  return { multiplier: 0.82, note: "war cruising: some stations still closing up" };
}

/** R2.4 · Fatigue is the price of holding Condition I. Charged per hour held. */
export function accrueFatigue(s: RunState, hours: number): void {
  if (s.readiness !== "condition_i") return;
  s.morale = clampMorale(s.morale - 0.0015 * hours);
}

/** Average crew health, which feeds the health work factor at §6.5:1464. */
export function healthWorkFactor(s: RunState): number {
  const pool = activeTeams(s);
  if (pool.length === 0) return 0;
  const avg = pool.reduce((a, t) => a + t.health, 0) / pool.length / 100;
  return 0.5 + 0.5 * avg;
}
