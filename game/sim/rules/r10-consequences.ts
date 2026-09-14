/**
 * R10 · How consequences are produced. The architectural rule.
 *
 * R10.1 An action declares only what it spends. No `closes` field, no prose
 *       about aircraft. The option does not know what else the ship wanted to
 *       do with that fuel, and it should not have to.
 * R10.2 The engine computes what is now impossible. "Launch strike:
 *       insufficient fuel, needs 12, have 7." That sentence is the consequence,
 *       and it was never written by hand.
 * R10.3 The preview shows the spend and the projected remainder [§1.16:536].
 *       Not the full downstream chain, which is unreadable. The resource and
 *       the number.
 *
 * Every option in every one of the 72 events goes through this one function.
 */
import { moduleDef } from "../content.ts";
import { activeTeams, type RunState } from "../state.ts";
import type { Action, EventOption, Requirement, Spend } from "../types.ts";
import { STOCK_KEYS } from "../types.ts";
import { capacityFor, round, shortfalls } from "./r1-resources.ts";

/** Requirements that are not met, each naming itself [EVENTS.md section 4]. */
export function unmetRequirements(s: RunState, req: Requirement, gateText?: string): string[] {
  const out: string[] = [];
  if (req.module && !s.modules.includes(req.module)) {
    const def = moduleDef(req.module);
    out.push(`needs ${def?.name ?? req.module}`);
  }
  if (req.stock) {
    for (const [k, v] of Object.entries(req.stock)) {
      const have = s.stocks[k as keyof typeof s.stocks] ?? 0;
      if (have < (v as number)) out.push(`needs ${v} ${k}, have ${round(have)}`);
    }
  }
  if (req.flag && !s.flags.has(req.flag)) out.push(`needs ${req.flag.replace(/_/g, " ")}`);
  if (req.teams && activeTeams(s).length < req.teams) {
    out.push(`needs ${req.teams} active teams, have ${activeTeams(s).length}`);
  }
  if (req.teamSlot && s.teams.filter((t) => !t.lost).length >= s.capacities.activeTeams) {
    out.push(`needs an empty active slot, all ${s.capacities.activeTeams} are taken`);
  }
  if (req.accommodation) {
    const free = s.capacities.accommodation - s.accommodationUsed;
    if (free < req.accommodation) {
      out.push(`needs ${req.accommodation} accommodation, have ${free}`);
    }
  }
  if (req.cargo) {
    const free = s.capacities.cargo - s.cargoUsed;
    if (free < req.cargo) out.push(`needs ${req.cargo} cargo space, have ${free}`);
  }
  if (req.sectorFrom && s.sectorIndex + 1 < req.sectorFrom) {
    out.push(`not before sector ${req.sectorFrom}`);
  }
  if (req.unmodelled) {
    // A gate the first playable does not model. It says so instead of pretending.
    out.push(`needs ${req.unmodelled} (not modelled in step 1)`);
  }
  if (out.length === 0 && gateText && Object.keys(req).length === 0) out.push(`needs ${gateText}`);
  return out;
}

/** R10.3 · The cost, and what the stock will be afterward. Nothing further down the chain. */
export function previewLines(s: RunState, spend: Spend, special: string[] = []): string[] {
  const lines: string[] = [];
  for (const k of STOCK_KEYS) {
    const v = spend[k as keyof Spend] as number | undefined;
    if (!v) continue;
    const after = Math.max(0, s.stocks[k] - v);
    lines.push(`${k} -${v} → ${round(after)} of ${capacityFor(s, k)}`);
  }
  if (spend.hours) lines.push(`${spend.hours}h → hour ${round(s.hours + spend.hours)}`);
  if (spend.scrap) lines.push(`Scrap -${spend.scrap} → ${round(s.scrap - spend.scrap)}`);
  if (spend.cargo) {
    lines.push(`cargo -${spend.cargo} → ${s.capacities.cargo - s.cargoUsed - spend.cargo} free`);
  }
  if (spend.accommodation) {
    const free = s.capacities.accommodation - s.accommodationUsed - spend.accommodation;
    lines.push(`accommodation -${spend.accommodation} → ${free} free`);
  }
  if (spend.morale) lines.push(`morale ${spend.morale > 0 ? "+" : ""}${spend.morale / 100}`);
  if (spend.threat) lines.push(`threat +${spend.threat} → ${Math.round(s.threat + spend.threat)}`);
  if (spend.emissions) lines.push(`transmits: threat +${2 * spend.emissions}`);
  if (spend.standing) lines.push(`standing ${spend.standing}`);
  if (spend.detachTeams) lines.push(`${spend.detachTeams} team detached, its station unmanned`);
  if (spend.loseTeams) lines.push(`${spend.loseTeams} team gone for the run`);
  if (spend.hull) lines.push(`hull -${spend.hull} → ${round(s.conditions.hull - spend.hull)}`);
  if (spend.stability) {
    lines.push(`stability ${spend.stability} → ${round(s.conditions.stability + spend.stability)}`);
  }
  if (spend.routeLayers) lines.push(`gives up ${spend.routeLayers} route layer`);
  for (const sp of special) lines.push(specialPreview(s, sp));
  if (lines.length === 0) lines.push("costs nothing but the time already spent getting here");
  return lines;
}

function specialPreview(s: RunState, name: string): string {
  switch (name) {
    case "parts_share":
      return `half your parts: ${Math.floor(s.stocks.parts / 2)} of ${round(s.stocks.parts)}`;
    case "stores_share":
      return "a quarter of one stock, drawn from what you actually carry";
    case "all_depth_charges":
      return `all ${round(s.stocks.depth)} depth charges`;
    case "battery_ammunition":
      return `40% of the shell magazine: ${Math.ceil(s.stocks.shell * 0.4)}`;
    case "contaminated_fuel":
      return `20% of the fuel: ${Math.ceil(s.stocks.fuel * 0.2)}`;
    case "clean_reserve_only":
      return "30% of remaining range";
    case "aviation_fuel":
      return "the aviation fuel (no aviation fit in step 1)";
    default:
      return name;
  }
}

/**
 * Turn one event option into an Action. This is the only place an option
 * becomes something a player can or cannot do.
 */
export function evaluateOption(s: RunState, opt: EventOption): Action {
  const special = (opt as EventOption & { special?: string[] }).special ?? [];
  const unmet = unmetRequirements(s, opt.requires, opt.gateText);
  const short = shortfalls(s, opt.spend, special);
  const reasons = [
    ...unmet,
    ...short.map((f) => `insufficient ${f.resource}, needs ${f.needs}, have ${f.has}`),
  ];
  return {
    id: opt.id,
    kind: "option",
    label: opt.label,
    enabled: reasons.length === 0,
    reason: reasons.length ? reasons.join("; ") : undefined,
    preview: previewLines(s, opt.spend, special),
    payload: { optionId: opt.id },
  };
}

/**
 * The anti-softlock guarantee [§5.3:1297]: at least one eligible option or an
 * explicit terminal decision exists in every event state. No random event may
 * offer only a disabled button.
 */
export function guaranteeAnOption(actions: Action[]): Action[] {
  if (actions.some((a) => a.enabled)) return actions;
  return [
    ...actions,
    {
      id: "withdraw_from_the_situation",
      kind: "option",
      label: "Leave it and carry on",
      enabled: true,
      preview: ["costs nothing but the time already spent getting here"],
      payload: { optionId: "__fallback" },
    },
  ];
}
