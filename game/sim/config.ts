/**
 * Every magnitude in the game, in one file.
 *
 * STUB OPEN-E1 / OPEN-02 / OPEN-05 / OPEN-09 / OPEN-13. Nothing below is
 * researched. The numbers marked [bm] are the balance model's candidate
 * configuration (balance_model/MODEL.md, selected after 354,816 simulated
 * campaigns of a different and simpler model). They are here because a run
 * of obviously wrong numbers would say nothing about whether the flow works,
 * and they are named so they can never pass as design.
 */

export const CONFIG = {
  /** Six sectors, then the boss [§2.2:673]. */
  sectors: 6,
  /** 4 to 6 decision layers per sector, 2 to 4 alternatives each [§1.5:128]. */
  layersPerSector: [4, 6] as [number, number],
  alternativesPerLayer: [2, 4] as [number, number],

  /** Speed modes [§2.12:953, R1.3]. */
  speed: {
    economy: { speed: 0.80, fuel: 0.85 },
    cruise: { speed: 1.00, fuel: 1.00 },
    flank: { speed: 1.25, fuel: 1.60 },
  },

  /** Threat [§6.5:1455]. Thresholds at 30/60/85 [§1.6:151]; OPEN-05 says what they do. */
  threat: {
    perHour: 2,
    conspicuousDeparture: 3,
    loudEngagement: 4,
    carryover: 0.25,
    thresholds: [30, 60, 85],
    /** STUB OPEN-05: interception chance per threshold band. */
    interceptionChance: [0.02, 0.07, 0.15, 0.26],
    /** STUB OPEN-05: enemy package strength multiplier per band. */
    strengthByBand: [1.0, 1.08, 1.18, 1.30],
    /** STUB OPEN-05: port service price multiplier per band. */
    portPriceByBand: [1.0, 1.1, 1.25, 1.45],
  },

  /** Rations burn one unit per active team per campaign day [R9.2, §1.10:321]. */
  rations: { perTeamPerDay: 1, shortageMoralePerDay: 0.02, shortageFloor: 0.85 },

  /** Morale is one ship-wide multiplier, bounded [R9.4, §6.5:1475]. */
  morale: { min: 0.85, max: 1.10, start: 1.0 },

  /** Crew [§1.2:78, §1.8:224]. */
  crew: { startTeams: 6, capTeams: 7, warnHealth: 25, retreatHealth: 20 },

  /** Enemy growth per sector [bm candidate]. */
  enemy: { hpGrowth: 0.16, dpsGrowth: 0.10, boss: { hpGrowth: 0, dpsGrowth: 0 } },

  /** The single-roll exchange. Step 1 only; step 3 replaces it with the 0.1s tick. */
  fight: {
    /** The balance model's guard on an unresolved engagement, in simulated seconds. */
    maxSeconds: 420,
    /** Luck band applied to the exchange [bm: 0.8 + 0.4 x u]. */
    luck: [0.80, 1.20] as [number, number],
    /** Withdrawal costs this share of the damage a full engagement would have. */
    withdrawalShare: 0.45,
    /** Chance a won fight still leaves a hazard for stabilization [§1.9:285]. */
    hazardChance: 0.35,
    /** Chance a fight costs a team outright, scaled by how badly it went. */
    teamLossBase: 0.04,
    evasionCap: 0.28,
  },

  /** Economy [bm candidate]. */
  economy: {
    startingScrap: 30,
    rewardScale: 0.75,
    upgradeBase: 40,
    upgradeStep: 0.18,
    /**
     * [bm] caps upgrades at eight and sends every third to defence. Step 1 has
     * one counter and spends it all on offence, because the defensive half is
     * the equipment tier and branch system, which is OPEN-10 and has no catalog.
     */
    upgradeCap: 8,
    /** A service yard restores at most this share of maximum hull [bm port_repair]. */
    portRepairCeiling: 0.85,
    /** Scrap per hull point at a yard. STUB OPEN-08: no price table exists. */
    repairPerHullPoint: 0.45,
    /** Field repair reaches 70% of system condition and no further [§1.9:283]. */
    fieldRepairCeiling: 0.70,
    /** Buy prices exceed resale [§2.11:883]. */
    resaleFraction: 0.55,
    prices: {
      fuel: 0.25,
      shell: 0.07,
      aa: 0.07,
      torpedo: 1.6,
      depth: 0.8,
      rations: 0.8,
      parts: 0.9,
      medical: 1.1,
      flares: 0.5,
      smoke: 0.6,
    } as Record<string, number>,
  },

  /** Starting stocks, before hull ammunition factor [bm SUPPLY_TARGET]. */
  supplyTarget: {
    fuel: 72,
    shell: 150,
    aa: 75,
    torpedo: 10,
    depth: 16,
    rations: 10,
    parts: 8,
    medical: 6,
    flares: 4,
    smoke: 3,
  } as Record<string, number>,

  capacities: { cargo: 8, accommodation: 4, hangar: 0 },

  /**
   * What the ship can hold, where it is not the hull's own figure. Fuel comes
   * from the hull and the support package; ammunition scales with the hull's
   * ammunition factor. These two do not [bm capabilities()].
   */
  stockCapacity: { rations: 16, parts: 14 } as Record<string, number>,

  /** Repetition control [§5.4:1308, EVENTS.md section 5]. */
  repetition: {
    maxConsecutiveCombat: 3,
    maxConsecutiveEmpty: 2,
    arrivalDamageCooldown: 3,
    noveltyWeight: 0.6,
  },

  /** STUB OPEN-02: difficulty is referenced everywhere and enumerated nowhere. */
  difficulty: {
    easy: { enemy: 0.85, reserves: 1.15, rewards: 1.15 },
    normal: { enemy: 1.00, reserves: 1.00, rewards: 1.00 },
    hard: { enemy: 1.15, reserves: 0.90, rewards: 0.90 },
  } as Record<string, { enemy: number; reserves: number; rewards: number }>,
};

export type DifficultyName = keyof typeof CONFIG.difficulty;

/** Which threat band a value falls in: 0 below 30, 1 below 60, 2 below 85, else 3. */
export function threatBand(threat: number): number {
  const t = CONFIG.threat.thresholds;
  if (threat < t[0]) return 0;
  if (threat < t[1]) return 1;
  if (threat < t[2]) return 2;
  return 3;
}
