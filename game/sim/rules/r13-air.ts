/**
 * R13 · Air attack. The most common way a destroyer died.
 *
 * R13.1 Anti-aircraft fire is layered in three bands [S89 p. 150, S95]. Losing
 *       one band leaves a hole at a specific range, not a general penalty.
 *       STUB OPEN-10: no equipment catalog names which mount covers which band,
 *       so step 1 has one AA stock and one module tier.
 * R13.9 AA ammunition burns faster than anything else [§1.10:294]. At zero that
 *       battery cannot fire at all, which is the arithmetic that matters here.
 * R13.11 Manoeuvre is a defence and it costs fuel [R1.3].
 */
import type { RunState } from "../state.ts";

/** What the AA battery can do against an incoming strike. */
export function aaEffectiveness(s: RunState): number {
  if (s.stocks.aa <= 0) return 0;
  const tier = s.modules.includes("aa_2") ? 1.35 : s.modules.includes("aa_1") ? 1.0 : 0.55;
  return tier * (0.6 + 0.4 * s.conditions.fireControl);
}

/** R13.9 · Sustained close-range fire empties magazines quickly. */
export function aaBurn(seconds: number, effectiveness: number): number {
  return Math.round(seconds * 0.06 * Math.max(0.4, effectiveness));
}

/**
 * R13.4 · A near miss is not a miss [S28 p. 176, S26 p. 407]. Bombs that do not
 * land square still spring plates and start flooding, so an air attack that
 * "missed" can still put a ship into damage control.
 */
export function nearMissHazardChance(): number {
  return 0.30;
}
