/**
 * The run log. The debrief reconstructs the cause-and-effect chain by walking
 * these entries, not by reading authored strings [R10.4, §4.6:1250].
 *
 * It takes a structural shape rather than RunState so that state, campaign and
 * the rules can all log without importing each other.
 */
import type { LogEntry } from "./types.ts";

export interface LogTarget {
  hours: number;
  sectorIndex: number;
  layerIndex: number;
  log: LogEntry[];
}

export function log(
  s: LogTarget,
  kind: string,
  text: string,
  facts?: Record<string, number | string | boolean>,
): void {
  s.log.push({
    hours: Math.round(s.hours * 10) / 10,
    sector: s.sectorIndex + 1,
    layer: s.layerIndex + 1,
    kind,
    text,
    facts,
  });
}
