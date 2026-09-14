/**
 * Four separate random streams: map, events, combat, rewards [§3.4:1139].
 *
 * The stream state is saved, not only the seed [BUILD.md section 7], so a run
 * reloaded mid-sector draws the same next number it would have drawn.
 *
 * Cosmetic effects never draw from a gameplay stream. There are no cosmetic
 * effects yet; when there are, they get their own stream and not one of these.
 */

export type StreamName = "map" | "events" | "combat" | "rewards";
export const STREAM_NAMES: StreamName[] = ["map", "events", "combat", "rewards"];

/** mulberry32. One uint32 of state, which is the whole point: it serializes. */
export class Stream {
  state: number;

  constructor(state: number) {
    this.state = state >>> 0;
  }

  /** Uniform in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [0, n). */
  int(n: number): number {
    return Math.floor(this.next() * n);
  }

  float(lo: number, hi: number): number {
    return lo + this.next() * (hi - lo);
  }

  pick<T>(xs: readonly T[]): T {
    if (xs.length === 0) throw new Error("pick from an empty list");
    return xs[this.int(xs.length)];
  }

  /** Weighted pick. Zero-weight entries are ineligible and never selected [§6.5:1525]. */
  weighted<T>(xs: readonly T[], weight: (x: T) => number): T {
    const ws = xs.map(weight);
    const total = ws.reduce((a, b) => a + b, 0);
    if (total <= 0) throw new Error("weighted pick with no eligible entries");
    let r = this.next() * total;
    for (let i = 0; i < xs.length; i++) {
      r -= ws[i];
      if (r <= 0) return xs[i];
    }
    return xs[xs.length - 1];
  }

  /**
   * A child stream deterministic in this stream's seed and a label, drawing
   * nothing from the parent. A fight that lasts longer therefore cannot reroll
   * a later situation, which is the property [§3.4:1139] is asking for.
   */
  fork(label: string): Stream {
    return new Stream(mix(this.state, label));
  }
}

function mix(seed: number, label: string): number {
  let h = (seed ^ 0x9e3779b9) >>> 0;
  for (let i = 0; i < label.length; i++) {
    h = Math.imul(h ^ label.charCodeAt(i), 0x01000193) >>> 0;
  }
  h ^= h >>> 16;
  return h >>> 0;
}

export class Streams {
  map: Stream;
  events: Stream;
  combat: Stream;
  rewards: Stream;

  constructor(seed: number) {
    this.map = new Stream(mix(seed, "map"));
    this.events = new Stream(mix(seed, "events"));
    this.combat = new Stream(mix(seed, "combat"));
    this.rewards = new Stream(mix(seed, "rewards"));
  }

  /** The saved form. Restoring this resumes every stream exactly where it was. */
  snapshot(): Record<StreamName, number> {
    return {
      map: this.map.state,
      events: this.events.state,
      combat: this.combat.state,
      rewards: this.rewards.state,
    };
  }

  restore(s: Record<StreamName, number>): void {
    this.map.state = s.map;
    this.events.state = s.events;
    this.combat.state = s.combat;
    this.rewards.state = s.rewards;
  }
}

/** Turn a user-typed seed into a number. A blank seed is not a valid run [§2.1:663]. */
export function seedFrom(text: string): number {
  if (/^\d+$/.test(text)) return Number(text) >>> 0;
  return mix(0, text);
}
