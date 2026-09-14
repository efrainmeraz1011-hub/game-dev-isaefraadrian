/**
 * R12 · Hunting a submarine.
 *
 * Nearly all of R12 is [period] and unsourced. The step-1 fight is one roll, so
 * the mechanic R12 actually turns on, dead time between the last good bearing
 * and the drop [R12.5], has nowhere to live yet: it is a tactical-clock problem
 * and belongs to step 5. What survives here are the three facts the single roll
 * can honestly represent.
 *
 * R12.2 Speed is the price of hearing [§1.12:361]. Going fast hears nothing.
 * R12.9 Your own explosions blind you: a miss costs the contact you had.
 * R12.14 No ASW capability is never a dead end [§1.12:364].
 */
import type { RunState } from "../state.ts";
import { effectiveSpeed } from "./r4-handling.ts";
import { sensorQuality } from "./r6-detection.ts";

/** R12.2 · Own-ship noise degrades the set as speed rises. */
export function sonarAtSpeed(s: RunState): number {
  const speed = effectiveSpeed(s);
  if (speed >= 1.15) return 0.15;
  if (speed >= 1.0) return 0.55;
  return 1.0;
}

/**
 * The share of a submarine's hull a depth-charge attack can actually reach.
 * STUB OPEN-09: the real answer is R12.5's dead time and R12.7's depth guess,
 * and step 1 has no clock to run either on.
 */
export function aswEffectiveness(s: RunState): number {
  if (s.stocks.depth <= 0) return 0;
  // Centred on 1.0: the sonar fit and own speed move a destroyer's ASW output
  // by tens of percent, not by a factor of three. Attacking with a bad set is
  // worse, never futile, which is R12.14 read as a number.
  const quality = sensorQuality(s, "submarine") * sonarAtSpeed(s);
  const ahead = s.modules.includes("sonar_2") ? 1.25 : 1.0;
  return Math.min(1.5, 0.70 + 0.50 * quality) * ahead;
}

/**
 * R12.13 · You usually do not know whether you killed it. A hunt that ends
 * without wreckage resolves as contact lost, and the boat becomes a pursuit
 * flag rather than a rematch spawner [§1.12:365].
 */
export function ambiguousResult(s: RunState): boolean {
  return s.streams.combat.next() < 0.45;
}
