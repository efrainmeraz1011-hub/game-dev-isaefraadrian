/**
 * R6 · Detection and emissions.
 *
 * R6.2 Every sensor and every weapon has eligible targets and nothing else.
 *      Eligibility precedes accuracy [§1.11:343]. Radar does not see a
 *      submerged submarine; a surface shell does not hit one. Accuracy cannot
 *      repair ineligibility, which is why this check runs before any roll.
 * R6.3 Searching actively announces you [§1.15:500]. Charged as a threat
 *      impulse in r1-resources.applySpend.
 */
import type { RunState } from "../state.ts";

export type EnemyKind = "surface" | "armored" | "submarine" | "air" | "shore";

/** Which deck weapons may engage this target at all [R6.2]. */
export function eligibleMounts(deck: string, kind: EnemyKind): string[] {
  switch (kind) {
    case "submarine":
      // Guns and torpedoes cannot reach a submerged boat. Depth charges do,
      // and they are not a deck mount [R12].
      return [];
    case "air":
      // The AA battery answers aircraft. Main guns with a dual-purpose mount
      // would too, and no equipment catalog says which are (OPEN-10).
      return [];
    case "shore":
      // Fixed, accurate, cannot be sunk, only suppressed [EVENTS.md P19].
      return deck.split("").filter((w) => w !== "T");
    default:
      return deck.split("");
  }
}

/** True when the ship has any answer to this target at all [R12.14, §1.12:364]. */
export function hasAnyAnswer(s: RunState, kind: EnemyKind): boolean {
  switch (kind) {
    case "submarine":
      return s.stocks.depth > 0;
    case "air":
      return s.stocks.aa > 0;
    default:
      return eligibleMounts(s.deck, kind).length > 0 &&
        (s.stocks.shell > 0 || s.stocks.torpedo > 0);
  }
}

/** Sensor quality, which sets how much of the enemy the player sees before committing. */
export function sensorQuality(s: RunState, kind: EnemyKind): number {
  const powered = s.conditions.sensors;
  if (kind === "submarine") {
    return powered *
      (s.modules.includes("sonar_2") ? 1.0 : s.modules.includes("sonar_1") ? 0.7 : 0.25);
  }
  return powered *
    (s.modules.includes("radar_2") ? 1.0 : s.modules.includes("radar_1") ? 0.75 : 0.4);
}
