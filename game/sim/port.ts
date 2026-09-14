/**
 * S09 PORT.
 *
 * Time does not advance during shopping [§1.5:143]. Cart edits are previews.
 * Committed services advance time. Stock is generated once per port instance
 * and saved: reopening tabs changes none of it [§2.11:843 step 2].
 *
 * STUB OPEN-08: no port inventory, no price table, no service capacity numbers
 * exist. Prices come from balance_model's PRICES and the upgrade escalation in
 * its purchase policy.
 */
import { CONFIG } from "./config.ts";
import { moduleDef, MODULES } from "./content.ts";
import { log } from "./log.ts";
import { capacityFor, round } from "./rules/r1-resources.ts";
import { advanceHours } from "./rules/r9-time.ts";
import { currentNode, type RunState } from "./state.ts";
import { type Action, STOCK_KEYS, type StockKey } from "./types.ts";
import { threatBand } from "./config.ts";

/** Threat raises port service costs [§1.6:151]. STUB OPEN-05 supplies the deltas. */
function priceFactor(s: RunState): number {
  return CONFIG.threat.portPriceByBand[threatBand(s.threat)];
}

export function stockPrice(s: RunState, key: StockKey): number {
  return (CONFIG.economy.prices[key] ?? 1) * priceFactor(s);
}

/** What this port will sell. Generated once and held on the node [§2.11:843]. */
export function services(s: RunState): string[] {
  return currentNode(s)?.services ?? ["replenishment"];
}

export function portActions(s: RunState): Action[] {
  const svc = services(s);
  const actions: Action[] = [];

  if (svc.includes("replenishment")) {
    for (const key of STOCK_KEYS) {
      const cap = capacityFor(s, key);
      const want = Math.ceil(cap - s.stocks[key]);
      if (want <= 0) continue;
      const unit = stockPrice(s, key);
      const affordable = Math.min(want, Math.floor(s.scrap / unit));
      const cost = Math.ceil(affordable * unit);
      actions.push({
        id: `buy_${key}`,
        kind: "buy_stock",
        label: `Top up ${key} (+${affordable} of ${want} short)`,
        enabled: affordable > 0,
        reason: affordable > 0
          ? undefined
          : `insufficient Scrap, needs ${Math.ceil(unit)}, have ${round(s.scrap)}`,
        preview: [
          `Scrap -${cost} → ${round(s.scrap - cost)}`,
          `${key} → ${round(Math.min(cap, s.stocks[key] + affordable))} of ${cap}`,
        ],
        payload: { key, amount: affordable, cost },
      });
    }
  }

  if (svc.includes("repair")) {
    // A service yard restores at most 85% of maximum hull [bm port_repair], and
    // never erases earlier losses [§4.2:1200].
    const ceiling = s.conditions.hullMax * CONFIG.economy.portRepairCeiling;
    const want = Math.max(0, ceiling - s.conditions.hull);
    const cost = Math.ceil(want * CONFIG.economy.repairPerHullPoint * priceFactor(s));
    actions.push({
      id: "repair_hull",
      kind: "repair",
      label: `Repair hull to ${Math.round(ceiling)} (+${Math.round(want)})`,
      enabled: want > 1 && s.scrap >= cost,
      reason: want <= 1
        ? "already at the yard ceiling"
        : s.scrap < cost
        ? `insufficient Scrap, needs ${cost}, have ${round(s.scrap)}`
        : undefined,
      preview: [`Scrap -${cost} → ${round(s.scrap - cost)}`, "4h", `hull → ${Math.round(ceiling)}`],
      payload: { amount: want, cost },
    });
  }

  if (svc.includes("equipment") && s.upgrades < CONFIG.economy.upgradeCap) {
    // Upgrades escalate: each one costs 18% of the base more than the last [bm].
    const cost = Math.ceil(
      CONFIG.economy.upgradeBase * (1 + CONFIG.economy.upgradeStep * s.upgrades) * priceFactor(s),
    );
    actions.push({
      id: "buy_upgrade",
      kind: "upgrade",
      label: `Upgrade the battery (offense +${Math.round(CONFIG.economy.upgradeStep * 100)}%)`,
      enabled: s.scrap >= cost,
      reason: s.scrap >= cost
        ? undefined
        : `insufficient Scrap, needs ${cost}, have ${round(s.scrap)}`,
      preview: [`Scrap -${cost} → ${round(s.scrap - cost)}`, "6h", `upgrades → ${s.upgrades + 1}`],
      payload: { cost },
    });

    for (const m of MODULES) {
      if (m.price <= 0 || s.modules.includes(m.id)) continue;
      if (m.requires && !s.modules.includes(m.requires)) continue;
      const price = Math.ceil(m.price * priceFactor(s));
      actions.push({
        id: `buy_${m.id}`,
        kind: "buy_module",
        label: `Fit ${m.name}`,
        enabled: s.scrap >= price,
        reason: s.scrap >= price
          ? undefined
          : `insufficient Scrap, needs ${price}, have ${round(s.scrap)}`,
        preview: [`Scrap -${price} → ${round(s.scrap - price)}`, "3h"],
        payload: { moduleId: m.id, cost: price },
      });
    }
  }

  // At zero Scrap the player can still sell surplus and leave [§2.11:887].
  const sellable = STOCK_KEYS.filter((k) => s.stocks[k] > capacityFor(s, k) * 0.7 && k !== "fuel");
  for (const key of sellable) {
    const amount = Math.floor(s.stocks[key] * 0.25);
    const paid = Math.floor(amount * stockPrice(s, key) * CONFIG.economy.resaleFraction);
    if (amount <= 0 || paid <= 0) continue;
    actions.push({
      id: `sell_${key}`,
      kind: "sell_stock",
      label: `Sell ${amount} ${key}`,
      enabled: true,
      preview: [
        `Scrap +${paid} → ${round(s.scrap + paid)}`,
        `${key} → ${round(s.stocks[key] - amount)}`,
      ],
      payload: { key, amount, paid },
    });
  }

  actions.push({
    id: "leave_port",
    kind: "leave_port",
    label: "Cast off",
    enabled: true,
    preview: ["stock and completed services stay depleted [§2.11:843 step 7]"],
  });
  return actions;
}

export function applyPortAction(s: RunState, action: Action): string[] {
  const p = action.payload ?? {};
  switch (action.kind) {
    case "buy_stock": {
      const key = p.key as StockKey;
      s.scrap -= p.cost as number;
      s.stocks[key] = Math.min(capacityFor(s, key), s.stocks[key] + (p.amount as number));
      advanceHours(s, 1);
      log(s, "port", `Bought ${p.amount} ${key} for ${p.cost}`, { scrap: -(p.cost as number) });
      return [`${key} → ${round(s.stocks[key])}`];
    }
    case "sell_stock": {
      const key = p.key as StockKey;
      s.stocks[key] -= p.amount as number;
      s.scrap += p.paid as number;
      log(s, "port", `Sold ${p.amount} ${key} for ${p.paid}`, { scrap: p.paid as number });
      return [`Scrap → ${round(s.scrap)}`];
    }
    case "repair": {
      s.scrap -= p.cost as number;
      s.conditions.hull = Math.min(
        s.conditions.hullMax * CONFIG.economy.portRepairCeiling,
        s.conditions.hull + (p.amount as number),
      );
      // A yard can also put the systems back past the field ceiling.
      s.conditions.propulsion = Math.min(1, s.conditions.propulsion + 0.3);
      s.conditions.sensors = Math.min(1, s.conditions.sensors + 0.3);
      advanceHours(s, 4);
      log(s, "port", `Repaired to hull ${Math.round(s.conditions.hull)}`);
      return [`hull → ${Math.round(s.conditions.hull)}`];
    }
    case "upgrade": {
      s.scrap -= p.cost as number;
      s.upgrades++;
      advanceHours(s, 6);
      log(s, "port", `Battery upgrade ${s.upgrades}`);
      return [`offense → +${Math.round(CONFIG.economy.upgradeStep * s.upgrades * 100)}%`];
    }
    case "buy_module": {
      s.scrap -= p.cost as number;
      s.modules.push(p.moduleId as string);
      advanceHours(s, 3);
      const def = moduleDef(p.moduleId as string);
      log(s, "port", `Fitted ${def?.name ?? p.moduleId}`);
      return [`fitted ${def?.name ?? p.moduleId}`];
    }
    default:
      return [];
  }
}
