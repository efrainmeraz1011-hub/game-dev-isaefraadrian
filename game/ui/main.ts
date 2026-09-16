/// <reference lib="dom" />
/** Fixed command deck. All decisions are existing simulation Action ids. */
import { HULLS, LOADOUTS, moduleDef, PATTERNS, SUPPORT, WEAPONS } from "../sim/content.ts";
import { packageOf } from "../sim/encounter.ts";
import { type Debrief, debrief } from "../sim/resolution.ts";
import { capacityFor } from "../sim/rules/r1-resources.ts";
import { apply, legalActions } from "../sim/run.ts";
import { activeTeams, createRun, currentSector, type RunState } from "../sim/state.ts";
import { type Faction, STOCK_KEYS, type StockKey } from "../sim/types.ts";
import { loadSprites, Surface } from "./draw.ts";
import { drawChart } from "./map.ts";
import { type Box, drawDebrief, drawPanel } from "./panels.ts";
import { C, F, hullColour, threatColour } from "./theme.ts";

const WIDTH = 1280;
const HEIGHT = 720;
const FACTIONS: Faction[] = ["american", "british", "german", "japanese"];
const STOCK_ICONS: Record<StockKey, string> = {
  fuel: "fuel",
  shell: "shells",
  aa: "aa",
  torpedo: "torpedoes",
  depth: "depth_charges",
  parts: "parts",
  medical: "medical",
  rations: "rations",
  flares: "flares",
  smoke: "smoke",
};
const STOCK_NAMES: Record<StockKey, string> = {
  fuel: "FUEL",
  shell: "SHELLS",
  aa: "AA",
  torpedo: "TORPS",
  depth: "DEPTH",
  parts: "PARTS",
  medical: "MEDICAL",
  rations: "RATIONS",
  flares: "FLARES",
  smoke: "SMOKE",
};
const WEAPON_ART: Record<string, string> = {
  R: "weapon_rapid",
  H: "weapon_heavy",
  E: "weapon_explosive",
  T: "weapon_torpedo",
};
const setup = {
  faction: "american" as Faction,
  hullId: "flexible",
  pattern: "mixed",
  supportId: "control",
  loadoutId: "escort",
  seed: Math.floor(Math.random() * 1_000_000),
};
// A shareable seed starts a reproducible patrol without exposing mutable game state.
const linkedSeed = new URLSearchParams(location.search).get("seed");
if (linkedSeed && /^\d{1,6}$/.test(linkedSeed)) setup.seed = Number(linkedSeed);

let screen: "setup" | "run" | "debrief" = "setup";
let run: RunState | null = null;
let report: Debrief | null = null;
let lines: string[] = [];
let scroll = 0;
let overflow = 0;
let chartOpen = false;
let assetsFailed = false;
let scrollBox: Box | null = null;

const canvas = document.getElementById("stage") as HTMLCanvasElement;
const viewport = document.getElementById("viewport")!;
const controls = document.getElementById("controls")!;
const announcement = document.getElementById("announcement")!;
const ctx = canvas.getContext("2d")!;
const g = new Surface(ctx);
const buttons = new Map<string, HTMLButtonElement>();
canvas.width = WIDTH;
canvas.height = HEIGHT;

/** Preserve a single layout; whole desktop pixels whenever the viewport allows it. */
function resize(): void {
  const available = Math.min(globalThis.innerWidth / WIDTH, globalThis.innerHeight / HEIGHT);
  const scale = available >= 1 ? Math.floor(available) : available;
  viewport.style.width = `${WIDTH * scale}px`;
  viewport.style.height = `${HEIGHT * scale}px`;
  draw();
}

function draw(): void {
  ctx.imageSmoothingEnabled = false;
  g.begin(WIDTH, HEIGHT);
  scrollBox = null;
  overflow = 0;
  if (screen === "setup") drawSetup();
  else if (screen === "debrief" && report) {
    heading("PATROL DEBRIEF", "DESTROYER / CAMPAIGN RECORD");
    scrollBox = { x: 24, y: 96, w: 1232, h: 600 };
    overflow = drawDebrief(g, report, scrollBox, scroll);
  } else if (run) drawRun(run);
  if (assetsFailed) {
    g.text("Some artwork could not load. Reload to retry.", 24, 715, {
      font: F.small,
      colour: C.warn,
    });
  }
  syncControls();
  syncReadout();
}

function heading(title: string, subtitle: string): void {
  g.text(subtitle, 32, 32, { font: F.label, colour: C.port });
  g.text(title, 32, 67, { font: "600 28px system-ui, sans-serif" });
  g.line(32, 82, 1248, 82, C.panelEdge);
}

function button(
  id: string,
  label: string,
  x: number,
  y: number,
  w: number,
  h = 36,
  selected = false,
  enabled = true,
  accessible = label,
): void {
  const hover = enabled && g.hit(x, y, w, h, id, accessible);
  g.frame(
    !enabled
      ? "button_disabled"
      : hover
      ? "button_hover"
      : selected
      ? "button_selected"
      : "button_normal",
    x,
    y,
    w,
    h,
  );
  g.text(label, x + w / 2, y + Math.floor(h / 2) + 4, {
    font: F.small,
    colour: enabled ? C.ink : C.inkDim,
    align: "center",
  });
}

function choices(
  title: string,
  prefix: string,
  items: { id: string; name: string }[],
  selected: string,
  y: number,
): void {
  g.text(title, 44, y, { font: F.label, colour: C.inkDim });
  const width = Math.floor((652 - (items.length - 1) * 8) / items.length);
  items.forEach((item, i) =>
    button(
      `${prefix}:${item.id}`,
      item.name,
      44 + i * (width + 8),
      y + 12,
      width,
      36,
      item.id === selected,
    )
  );
}

function drawSetup(): void {
  heading("PREPARE YOUR DESTROYER", "SIX SECTORS / ONE FINAL OPERATION");
  g.frame("panel_base", 24, 100, 694, 506);
  choices(
    "01 / NAVY",
    "faction",
    FACTIONS.map((id) => ({ id, name: titleCase(id) })),
    setup.faction,
    128,
  );
  choices("02 / HULL", "hull", HULLS, setup.hullId, 210);
  choices(
    "03 / DECK BATTERY",
    "pattern",
    Object.entries(PATTERNS).map(([id, p]) => ({ id, name: p.deck })),
    setup.pattern,
    292,
  );
  g.text(PATTERNS[setup.pattern].name, 44, 365, { font: F.small, colour: C.inkDim });
  choices("04 / SUPPORT PACKAGE", "support", SUPPORT, setup.supportId, 402);
  choices("05 / STARTING EQUIPMENT", "loadout", LOADOUTS, setup.loadoutId, 496);

  g.frame("panel_contact", 732, 100, 524, 506);
  const hull = HULLS.find((h) => h.id === setup.hullId)!;
  g.text(`${titleCase(setup.faction)} / ${hull.name}`, 754, 133, { font: F.title });
  g.text("DESTROYER", 754, 156, { font: F.label, colour: C.port });
  sea({ x: 748, y: 176, w: 492, h: 218 });
  // The first exterior is shared by the mechanical hull archetypes.
  g.sprite("player_destroyer", 740, 150, 512, 256);
  const stats = [
    ["HULL", `${hull.hp}`, "hull"],
    ["ARMOR", `${Math.round(hull.armor * 100)}%`, "parts"],
    ["SPEED", `${hull.speed.toFixed(2)}x`, "engine"],
    ["FUEL BASE", `${hull.fuelCapacity}`, "fuel"],
  ];
  stats.forEach(([label, value, icon], i) => {
    const x = 754 + i * 122;
    g.sprite(`icon_${icon}`, x, 408, 32, 32);
    g.text(label, x + 38, 420, { font: F.label, colour: C.inkDim });
    g.text(value, x + 38, 441, { font: F.monoBig });
  });
  const fit = LOADOUTS.find((l) => l.id === setup.loadoutId)!;
  g.text("FITTED FOR THIS PATROL", 754, 478, { font: F.label, colour: C.port });
  g.wrapped(fit.modules.map((id) => moduleDef(id)?.name ?? id).join(" · "), 754, 502, 472, {
    font: F.body,
    colour: C.ink,
    lineHeight: 22,
  });
  g.text("Supplies carry forward between sectors.", 754, 576, { font: F.small, colour: C.inkDim });

  g.frame("panel_base", 24, 620, 1232, 76);
  g.text("PATROL SEED", 44, 644, { font: F.label, colour: C.inkDim });
  g.text(String(setup.seed), 44, 670, { font: F.monoBig });
  button("reroll", "New seed", 174, 638, 112);
  g.text("Same ship, seed, and decisions replay the same patrol.", 310, 661, {
    font: F.small,
    colour: C.inkDim,
  });
  button("begin", "BEGIN PATROL", 1030, 636, 206, 44, true);
}

function sea(box: Box): void {
  g.clipped(box.x, box.y, box.w, box.h, () => {
    g.rect(box.x, box.y, box.w, box.h, C.sea);
    for (let row = 0; row < Math.ceil(box.h / 32); row++) {
      const y = box.y + row * 32 + 16;
      for (let col = 0; col < Math.ceil(box.w / 128); col++) {
        const x = box.x + col * 128 + (row % 2) * 48;
        g.line(x, y, x + 34, y, C.waterLine);
      }
    }
  });
}

function drawRun(s: RunState): void {
  const actions = legalActions(s);
  drawHud(s);
  drawShip(s);
  drawContact(s);
  scrollBox = { x: 824, y: 296, w: 444, h: 326 };
  overflow = drawPanel(g, s, actions, lines, scrollBox, scroll);
  drawBottom(s);
  g.frame("panel_base", 824, 630, 444, 78);
  button("ui:chart", "SECTOR CHART", 838, 642, 170, 42, chartOpen);
  g.text("SECTOR", 1028, 652, { font: F.label, colour: C.inkDim });
  g.text(`${s.sectorIndex + 1} / ${s.sectors.length}`, 1028, 676, { font: F.monoBig });
  g.text("VISITED", 1150, 652, { font: F.label, colour: C.inkDim });
  g.text(String(s.nodesVisited), 1150, 676, { font: F.monoBig });
  if (chartOpen) {
    // A modal owns input as well as drawing; the command deck cannot be clicked through it.
    g.hits.length = 0;
    g.rect(0, 0, WIDTH, HEIGHT, C.scrim);
    g.frame("panel_dialog", 32, 72, 1216, 584);
    g.text("PLOT YOUR COURSE", 54, 109, { font: F.title });
    button("ui:chart", "Close chart", 1090, 88, 136);
    drawChart(g, s, actions, { x: 48, y: 140, w: 1184, h: 446 });
    g.text(
      s.state === "SECTOR_MAP"
        ? "Select a lit destination to commit travel. Costs use your current speed."
        : "Finish the current orders before travelling to another destination.",
      56,
      619,
      { font: F.small, colour: C.inkDim },
    );
    overflow = 0;
    scrollBox = null;
  }
}

function drawHud(s: RunState): void {
  g.text("DESTROYER", 24, 27, { font: F.title });
  const sector = currentSector(s);
  g.text(
    `${sector.name.toUpperCase()} / LEG ${
      Math.max(0, s.layerIndex + 1)
    } OF ${sector.layers.length}`,
    240,
    26,
    { font: F.label, colour: C.inkDim },
  );
  g.text(s.pendingFight ? "CONTACT / AWAITING ORDERS" : "PATROL / AWAITING ORDERS", 1254, 26, {
    font: F.label,
    colour: s.pendingFight ? C.warn : C.port,
    align: "right",
  });
  g.frame("panel_base", 12, 40, 1256, 64);
  g.sprite("icon_hull", 26, 56, 32, 32);
  const share = s.conditions.hull / s.conditions.hullMax;
  g.text("HULL", 72, 60, { font: F.label, colour: C.inkDim });
  g.text(`${Math.round(s.conditions.hull)} / ${s.conditions.hullMax}`, 218, 60, {
    font: F.mono,
    align: "right",
    colour: hullColour(share),
  });
  g.meter(72, 72, 146, 12, share, hullColour(share));
  STOCK_KEYS.forEach((key, i) => {
    const x = 242 + i * 70;
    const cap = capacityFor(s, key);
    g.text(STOCK_NAMES[key], x, 59, { font: F.label, colour: C.inkDim });
    g.sprite(`icon_${STOCK_ICONS[key]}`, x, 68, 16, 16);
    g.text(`${Math.round(s.stocks[key])}`, x + 22, 79, {
      font: F.mono,
      colour: s.stocks[key] < cap * 0.25 ? C.warn : C.ink,
    });
    g.text(`/ ${cap}`, x + 22, 93, { font: F.label, colour: C.inkDim });
  });
  const extra = [
    ["SCRAP", Math.round(s.scrap), "scrap", C.port],
    ["THREAT", Math.round(s.threat), "threat", threatColour(s.threat)],
    ["HOURS", Math.round(s.hours), "time", C.ink],
  ];
  extra.forEach(([label, value, icon, colour], i) => {
    const x = 954 + i * 98;
    g.text(String(label), x, 59, { font: F.label, colour: C.inkDim });
    g.sprite(`icon_${icon}`, x, 64, 32, 32);
    g.text(String(value), x + 36, 85, { font: F.monoBig, colour: String(colour) });
  });
}

function drawShip(s: RunState): void {
  g.frame("panel_base", 12, 112, 800, 436);
  g.text("YOUR SHIP", 28, 139, { font: F.label, colour: C.port });
  g.text(
    `${titleCase(s.faction)} / ${HULLS.find((h) => h.id === s.hullId)?.name ?? s.hullId}`,
    790,
    139,
    { font: F.small, colour: C.inkDim, align: "right" },
  );
  g.text(`CREW / ${activeTeams(s).length} AVAILABLE`, 28, 168, { font: F.label, colour: C.inkDim });
  s.teams.forEach((team, i) => {
    const y = 180 + i * 52;
    g.frame("button_normal", 24, y, 186, 46);
    g.sprite("crew_sailor", 32, y + 7, 32, 32);
    const name = team.name.replace("AA and torpedo crew", "AA / torpedoes");
    g.text(name, 70, y + 16, { font: F.small, colour: team.lost ? C.inkDim : C.ink });
    if (team.lost || team.detachedUntilNode !== null) {
      g.text(team.lost ? "LOST" : "DETACHED", 70, y + 34, {
        font: F.label,
        colour: team.lost ? C.bad : C.warn,
      });
    } else {
      g.meter(70, y + 26, 94, 6, team.health / 100, hullColour(team.health / 100));
      g.text(String(Math.round(team.health)), 198, y + 33, {
        font: F.label,
        align: "right",
        colour: C.inkDim,
      });
    }
  });
  sea({ x: 224, y: 160, w: 572, h: 274 });
  g.sprite("player_destroyer", 254, 170, 512, 256);
  g.text("DECK BATTERY", 242, 453, { font: F.label, colour: C.inkDim });
  g.text(s.deck.split("").map((key) => WEAPONS[key].name).join(" / "), 242, 475, { font: F.small });
  g.text("DAMAGE REPORT", 242, 504, { font: F.label, colour: C.inkDim });
  if (!s.hazards.length) {
    g.text("No active fire or flooding.", 242, 526, { font: F.small, colour: C.good });
  } else {
    // Aggregate hazard counts here; full requirements and notes remain in the orders panel.
    const kinds = [...new Set(s.hazards.map((h) => h.kind))];
    kinds.forEach((kind, i) => {
      const x = 242 + i * 132;
      g.sprite(
        kind === "fire"
          ? "hazard_fire"
          : kind === "flooding" || kind === "breach"
          ? "hazard_flood"
          : "icon_parts",
        x,
        508,
        32,
        32,
      );
      g.text(`${kind} ×${s.hazards.filter((h) => h.kind === kind).length}`, x + 36, 528, {
        font: F.small,
        colour: C.warn,
      });
    });
  }
}

function drawContact(s: RunState): void {
  g.frame("panel_contact", 824, 112, 444, 176);
  if (s.pendingFight) {
    const f = s.pendingFight;
    const pkg = packageOf(f);
    g.text("HOSTILE CONTACT", 842, 137, { font: F.label, colour: C.warn });
    g.meter(842, 151, 146, 8, f.enemyHp / f.enemyHpMax, C.bad);
    g.text(`HULL ${Math.round(f.enemyHp)} / ${Math.round(f.enemyHpMax)}`, 842, 180, {
      font: F.mono,
      colour: C.inkDim,
    });
    g.wrapped(pkg.name, 842, 207, 194, { font: F.title, lineHeight: 22 });
    if (pkg.id === "P3") g.sprite("enemy_trawler", 1004, 154, 256, 128);
    else {
      g.sprite("contact_unknown", 1112, 168, 64, 64);
      g.text(pkg.kind.toUpperCase(), 1144, 256, {
        font: F.label,
        colour: C.inkDim,
        align: "center",
      });
    }
  } else {
    g.text(s.state === "PORT" ? "FRIENDLY PORT" : "NAVIGATION", 842, 137, {
      font: F.label,
      colour: C.port,
    });
    g.sprite(s.state === "PORT" ? "map_port" : "map_water", 1168, 170, 64, 64);
    g.wrapped(currentSector(s).name, 842, 172, 296, { font: F.title, lineHeight: 23 });
    g.wrapped(
      s.state === "PORT"
        ? "Replenish and refit using the services below."
        : "Choose your next orders below, or open the sector chart.",
      842,
      223,
      296,
      { font: F.small, colour: C.inkDim, lineHeight: 19 },
    );
  }
}

function drawBottom(s: RunState): void {
  g.frame("panel_base", 12, 558, 278, 150);
  g.text("SHIP SYSTEMS", 28, 585, { font: F.label, colour: C.port });
  const systems: [string, string, number][] = [
    ["Propulsion", "engine", s.conditions.propulsion],
    ["Sensors", "radar", s.conditions.sensors],
    ["Fire control", "gun", s.conditions.fireControl],
    ["Stability", "hull", s.conditions.stability / 100],
  ];
  systems.forEach(([name, icon, share], i) => {
    const y = 598 + i * 24;
    g.sprite(`icon_${icon}`, 28, y - 3, 16, 16);
    g.text(name, 52, y + 9, { font: F.small, colour: C.inkDim });
    g.meter(149, y + 1, 68, 8, share, hullColour(share));
    g.text(`${Math.round(share * 100)}%`, 274, y + 9, { font: F.mono, align: "right" });
  });
  g.frame("panel_base", 300, 558, 512, 150);
  g.text(`WEAPONS / UPGRADES ${s.upgrades}`, 318, 585, { font: F.label, colour: C.port });
  g.text(
    `${s.speedMode.toUpperCase()} / ${
      s.readiness === "condition_i" ? "GENERAL QUARTERS" : "WAR CRUISING"
    }`,
    794,
    585,
    { font: F.label, colour: C.inkDim, align: "right" },
  );
  s.deck.split("").forEach((key, i) => {
    const x = 314 + i * 162;
    const weapon = WEAPONS[key];
    g.frame("button_normal", x, 598, 154, 96);
    g.sprite(WEAPON_ART[key], x + 8, 606, 32, 32);
    g.text(`MOUNT ${i + 1}`, x + 50, 619, { font: F.label, colour: C.inkDim });
    g.text(
      `${Math.round(s.stocks[weapon.ammo])} ${weapon.ammo === "shell" ? "shells" : "torps"}`,
      x + 50,
      638,
      { font: F.small },
    );
    g.text(weapon.name, x + 12, 659, { font: F.small });
    g.text(`Base ${weapon.damage} dmg / ${weapon.reload}s`, x + 12, 681, {
      font: F.label,
      colour: C.inkDim,
    });
  });
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function activate(id: string): void {
  if (id === "ui:scroll_up" || id === "ui:scroll_down") {
    scroll = Math.max(0, Math.min(overflow, scroll + (id.endsWith("up") ? -180 : 180)));
  } else if (id === "ui:chart" && screen === "run") {
    chartOpen = !chartOpen;
  } else if (screen === "setup") {
    if (id === "begin") {
      run = createRun({ ...setup, difficulty: "normal" });
      report = null;
      lines = [`Final objective: ${run.boss.name}.`];
      screen = "run";
      scroll = 0;
      chartOpen = false;
    } else if (id === "reroll") setup.seed = Math.floor(Math.random() * 1_000_000);
    else {
      const [field, value] = id.split(":");
      if (field === "faction") setup.faction = value as Faction;
      if (field === "hull") setup.hullId = value;
      if (field === "pattern") setup.pattern = value;
      if (field === "support") setup.supportId = value;
      if (field === "loadout") setup.loadoutId = value;
    }
  } else if (screen === "debrief" && id === "new_run") {
    setup.seed = Math.floor(Math.random() * 1_000_000);
    screen = "setup";
    scroll = 0;
  } else if (run && screen === "run") {
    const action = legalActions(run).find((a) => a.id === id && a.enabled);
    if (!action) return;
    lines = apply(run, action.id);
    scroll = 0;
    if (action.kind === "travel") chartOpen = false;
    if (run.lifecycle !== "ACTIVE") {
      run.lifecycle = "ARCHIVED";
      report = debrief(run);
      screen = "debrief";
      chartOpen = false;
    }
  }
  g.hover = null;
  draw();
  announcement.textContent = screen === "run" && run
    ? `${run.state.replaceAll("_", " ")}. ${lines.join(" ")}`
    : screen === "setup"
    ? "Prepare your destroyer."
    : `Patrol ended. ${report?.outcome}: ${report?.reason}`;
}

/** Native buttons mirror visible canvas hits, preserving keyboard and assistive access. */
function syncControls(): void {
  const visible = new Set<string>();
  for (const hit of g.hits) {
    visible.add(hit.id);
    let b = buttons.get(hit.id);
    if (!b) {
      b = document.createElement("button");
      b.type = "button";
      b.addEventListener("click", () => activate(hit.id));
      b.addEventListener("focus", () => {
        g.hover = hit.id;
        draw();
      });
      b.addEventListener("blur", () => {
        if (g.hover === hit.id) {
          g.hover = null;
          draw();
        }
      });
      b.addEventListener("pointerenter", () => {
        g.hover = hit.id;
        draw();
      });
      b.addEventListener("pointerleave", () => {
        if (document.activeElement !== b) {
          g.hover = null;
          draw();
        }
      });
      controls.append(b);
      buttons.set(hit.id, b);
    }
    b.setAttribute("aria-label", hit.label ?? hit.id);
    b.title = hit.label ?? hit.id;
    const [field, value] = hit.id.split(":");
    const selection = {
      faction: setup.faction,
      hull: setup.hullId,
      pattern: setup.pattern,
      support: setup.supportId,
      loadout: setup.loadoutId,
    };
    if (screen === "setup" && field in selection) {
      b.setAttribute("aria-pressed", String(selection[field as keyof typeof selection] === value));
    } else b.removeAttribute("aria-pressed");
    b.style.left = `${hit.x / WIDTH * 100}%`;
    b.style.top = `${hit.y / HEIGHT * 100}%`;
    b.style.width = `${hit.w / WIDTH * 100}%`;
    b.style.height = `${hit.h / HEIGHT * 100}%`;
  }
  for (const [id, b] of buttons) {
    if (!visible.has(id)) {
      b.remove();
      buttons.delete(id);
    }
  }
}

/** Keep the same visible information available outside the bitmap for assistive readers. */
function syncReadout(): void {
  const readout = document.getElementById("readout")!;
  if (screen === "run" && run) {
    const s = run;
    const stocks = STOCK_KEYS.map((key) =>
      `${key}: ${Math.round(s.stocks[key])} of ${capacityFor(s, key)}`
    );
    const blocked = legalActions(s).filter((a) => !a.enabled).map((a) =>
      `${a.label}: unavailable. ${a.reason ?? ""} ${(a.preview ?? []).join(". ")}`
    );
    readout.textContent = [
      `${currentSector(s).name}. ${titleCase(s.faction)} ${s.hullId} destroyer. Hull ${
        Math.round(s.conditions.hull)
      } of ${s.conditions.hullMax}.`,
      ...stocks,
      `Scrap ${Math.round(s.scrap)}. Threat ${Math.round(s.threat)}. Hour ${
        Math.round(s.hours)
      }. Battery upgrades ${s.upgrades}.`,
      `Speed ${s.speedMode}. Readiness ${s.readiness.replaceAll("_", " ")}.`,
      ...s.teams.map((t) =>
        `${t.name}: ${
          t.lost
            ? "lost"
            : t.detachedUntilNode !== null
            ? "detached"
            : `${Math.round(t.health)} health`
        }.`
      ),
      `Fitted: ${s.modules.map((id) => moduleDef(id)?.name ?? id).join(", ")}.`,
      ...s.hazards.map((h) => `${h.kind}: ${h.note}`),
      ...blocked,
    ].join(" ");
  } else if (screen === "debrief" && report) {
    readout.textContent =
      `${report.outcome}. ${report.reason}. Sector ${report.sectorsReached}, ${report.nodesVisited} nodes, ${report.hours} hours. ${
        report.timeline.join(". ")
      }`;
  } else {
    const h = HULLS.find((h) => h.id === setup.hullId)!;
    const fit = LOADOUTS.find((l) => l.id === setup.loadoutId)!;
    readout.textContent = `${titleCase(setup.faction)} ${h.name} destroyer. Hull ${h.hp}, armor ${
      Math.round(h.armor * 100)
    } percent, speed ${h.speed}, base fuel ${h.fuelCapacity}. ${
      PATTERNS[setup.pattern].name
    }. ${setup.supportId} support. ${
      fit.modules.map((id) => moduleDef(id)?.name ?? id).join(", ")
    }. Seed ${setup.seed}.`;
  }
}

function changeScroll(delta: number): void {
  if (!overflow) return;
  scroll = Math.max(0, Math.min(overflow, scroll + delta));
  draw();
}
viewport.addEventListener("wheel", (e) => {
  if (!scrollBox || !overflow) return;
  const rect = viewport.getBoundingClientRect();
  const x = (e.clientX - rect.left) * WIDTH / rect.width;
  const y = (e.clientY - rect.top) * HEIGHT / rect.height;
  if (
    x < scrollBox.x || x > scrollBox.x + scrollBox.w || y < scrollBox.y ||
    y > scrollBox.y + scrollBox.h
  ) return;
  e.preventDefault();
  changeScroll(e.deltaY);
}, { passive: false });
globalThis.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && chartOpen) {
    activate("ui:chart");
    e.preventDefault();
  }
  if (e.key === "PageDown" || e.key === "PageUp") {
    changeScroll(e.key === "PageDown" ? 180 : -180);
    e.preventDefault();
  }
});
globalThis.addEventListener("resize", resize);
resize();
loadSprites().then(draw).catch(() => {
  assetsFailed = true;
  draw();
});
