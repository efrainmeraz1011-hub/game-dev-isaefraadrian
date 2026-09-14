/**
 * R5 · Boats, recovery, and people in the water.
 *
 * R5.3 A detached crew leaves the ship's own roster for the duration, so its
 *      station is unmanned under R2.5. That is the whole cost of a rescue, and
 *      it is the same cost for a boarding party, a prize crew and a salvage
 *      party: one mechanic with different durations [R5.4].
 * R5.4 is why this file is short. Build it once.
 */
import { log } from "../log.ts";
import { activeTeams, type RunState } from "../state.ts";
import type { Team } from "../types.ts";

/** Detach a team for a number of nodes. It comes back on its own [R5.4]. */
export function detachTeam(s: RunState, nodes: number): Team | null {
  const pool = activeTeams(s);
  // Never leave the ship with nothing manned [§1.8:233].
  if (pool.length <= 1) return null;
  const team = pool[pool.length - 1];
  team.detachedUntilNode = s.nodesVisited + nodes;
  log(s, "crew", `${team.name} detached for ${nodes} nodes`, { team: team.name });
  return team;
}

/** Called on arrival at each node: a detached team returns when its time is up. */
export function returnDetachedTeams(s: RunState): void {
  for (const t of s.teams) {
    if (t.detachedUntilNode !== null && s.nodesVisited >= t.detachedUntilNode) {
      t.detachedUntilNode = null;
      log(s, "crew", `${t.name} back aboard`, { team: t.name });
    }
  }
}

/** Lost for the run. No individual casualty rolls, no bleeding timers [§1.8:224]. */
export function loseTeam(s: RunState, cause: string): Team | null {
  const pool = activeTeams(s).length > 0 ? activeTeams(s) : s.teams.filter((t) => !t.lost);
  if (pool.length === 0) return null;
  const team = pool[pool.length - 1];
  team.lost = true;
  team.detachedUntilNode = null;
  team.health = 0;
  log(s, "crew", `${team.name} lost: ${cause}`, { team: team.name, lost: true });
  s.flags.add("team_lost_recently");
  return team;
}

/** Hazards damage the people fighting them [R7.3]. Zero health is a loss, for the run. */
export function hurtTeams(s: RunState, points: number, cause: string): void {
  for (const t of activeTeams(s)) {
    t.health = Math.max(0, t.health - points);
    if (t.health === 0) {
      t.lost = true;
      log(s, "crew", `${t.name} lost: ${cause}`, { team: t.name, lost: true });
      s.flags.add("team_lost_recently");
    }
  }
}

/** Losing all teams ends the run once the current step resolves [§1.8:233]. */
export function allTeamsLost(s: RunState): boolean {
  return s.teams.every((t) => t.lost);
}
