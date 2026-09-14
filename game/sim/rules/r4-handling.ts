/**
 * R4 · Ship handling.
 *
 * R4.2 Speed buys evasion, stopping forfeits it [§6.5:1485]. The target-manoeuvre
 *      term falls toward zero as own speed falls, so a stopped ship is hit at
 *      the attacker's unmodified accuracy. This is why the rescue question is
 *      dangerous rather than sentimental.
 * R4.4 Sea state governs what the ship can do [§6.4:1425].
 */
import { CONFIG } from "../config.ts";
import { hull, support } from "../content.ts";
import type { RunState } from "../state.ts";
import type { SpeedMode } from "../types.ts";

/** Own speed right now, including what damage has taken off it [R4.1]. */
export function effectiveSpeed(s: RunState, mode: SpeedMode = s.speedMode): number {
  const condition = 0.6 + 0.4 * s.conditions.propulsion;
  return hull(s.hullId).speed * CONFIG.speed[mode].speed * condition;
}

/**
 * R4.2 · The target-manoeuvre term. A stopped ship gets none of it, and no
 * amount of armour or defensive fit puts it back.
 */
export function evasion(s: RunState, mode: SpeedMode = s.speedMode): number {
  if (mode === ("stop" as SpeedMode)) return 0;
  const speed = effectiveSpeed(s, mode);
  const defensive = support(s.supportId).armor ? 0.03 : 0;
  return Math.max(0, Math.min(CONFIG.fight.evasionCap, 0.10 + (speed - 1) * 0.32 + defensive));
}

/** Armour as a share of damage turned away [§6.5:1493]. Capped so nothing is immune. */
export function armor(s: RunState): number {
  return Math.min(0.45, hull(s.hullId).armor + (support(s.supportId).armor ?? 0));
}
