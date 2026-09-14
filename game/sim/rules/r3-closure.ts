/**
 * R3 · Material condition of closure.
 *
 * STUB OPEN-04: closure is a property of fittings between compartments, and no
 * compartment graph exists for any hull. Step 4 builds this against the
 * placeholder in content/hull-placeholder.json. Until then the control is not
 * offered, because offering a control that changes nothing teaches a lie.
 *
 * R3.1 Two-condition ships close in two steps: Baker and Able [S295 §22-10].
 * R3.2 Closing up slows your own crew [period, unsourced].
 * R3.4 Closure limits the spread. It does not undo the water [§1.9:265].
 */
export type Closure = "baker" | "able";

export function spreadFactor(_closure: Closure): number {
  // STUB OPEN-04: returns 1 until fittings exist to close.
  return 1;
}

export function movementPenalty(_closure: Closure): number {
  // STUB OPEN-04: R3.2 is unsourced and has no compartment graph to slow anyone across.
  return 0;
}
