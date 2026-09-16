/**
 * The resource bar, the action panel, the port screen and the debrief
 * [BUILD.md section 4 step 2].
 *
 * Every panel is the same shape underneath: read what the engine says is legal,
 * draw a row per action, show its cost and what the stock will be afterward
 * [R10.3]. A gated option keeps its row and names its requirement, because
 * that is what teaches the player what to buy [EVENTS.md section 4].
 */
import { describeFight, packageOf } from "../sim/encounter.ts";
import { moduleDef } from "../sim/content.ts";
import { eventById } from "../sim/events.ts";
import { capacityFor } from "../sim/rules/r1-resources.ts";
import { stabilizationBlockers } from "../sim/rules/r7-damage.ts";
import type { Debrief } from "../sim/resolution.ts";
import { activeTeams, currentSector, type RunState } from "../sim/state.ts";
import { type Action, STOCK_KEYS } from "../sim/types.ts";
import type { Surface } from "./draw.ts";
import { C, F, hullColour, M, threatColour } from "./theme.ts";

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

// --- The resource bar -------------------------------------------------------

/**
 * Stocks deplete, capacities constrain, conditions change [R1.4], and all three
 * are on screen at once. The bar flows and wraps, so a phone gets the same
 * numbers as a desktop rather than a truncated subset of them.
 */
interface Cell {
  label: string;
  value: string;
  colour: string;
  width: number;
  meter?: { share: number; colour: string; width: number };
}

function statusCells(s: RunState): Cell[] {
  const cells: Cell[] = [];
  const share = s.conditions.hull / s.conditions.hullMax;
  cells.push({
    label: "HULL",
    value: `${Math.round(s.conditions.hull)}/${s.conditions.hullMax}`,
    colour: hullColour(share),
    width: 214,
    meter: { share, colour: hullColour(share), width: 150 },
  });
  cells.push({
    label: "THREAT",
    value: `${Math.round(s.threat)}`,
    colour: threatColour(s.threat),
    width: 150,
    meter: { share: s.threat / 100, colour: threatColour(s.threat), width: 110 },
  });
  for (const key of STOCK_KEYS) {
    const cap = capacityFor(s, key);
    if (cap <= 0) continue;
    const have = Math.round(s.stocks[key]);
    cells.push({
      label: key.slice(0, 4).toUpperCase(),
      value: `${have}/${cap}`,
      colour: have < cap * 0.25 ? C.warn : C.ink,
      width: 62,
    });
  }
  const lost = s.teams.filter((t) => t.lost).length;
  cells.push({
    label: "CREW",
    value: `${activeTeams(s).length}${lost ? `-${lost}` : ""}`,
    colour: lost ? C.warn : C.ink,
    width: 56,
  });
  cells.push({ label: "SCRAP", value: `${Math.round(s.scrap)}`, colour: C.port, width: 56 });
  cells.push({ label: "UPGR", value: `${s.upgrades}`, colour: C.ink, width: 46 });
  return cells;
}

/** Rows the bar needs at this width. main.ts asks before it lays anything out. */
export function statusHeight(s: RunState, boxWidth: number): number {
  const usable = boxWidth - M.pad * 2;
  let x = 0;
  let rows = 1;
  for (const c of statusCells(s)) {
    if (x + c.width > usable && x > 0) {
      rows++;
      x = 0;
    }
    x += c.width;
  }
  return 34 + rows * 34;
}

export function drawStatus(g: Surface, s: RunState, box: Box): void {
  g.rect(box.x, box.y, box.w, box.h, C.panel, C.panelEdge);
  const left = box.x + M.pad;
  const usable = box.w - M.pad * 2;
  const sector = currentSector(s);

  const head = `${sector.name.toUpperCase()}  ·  LAYER ${
    Math.max(0, s.layerIndex + 1)
  }/${sector.layers.length}`;
  const tail = `HOUR ${Math.round(s.hours)}  ·  DAY ${
    Math.floor(s.hours / 24) + 1
  }  ·  ${s.speedMode.toUpperCase()}  ·  ${
    s.readiness === "condition_i" ? "GENERAL QUARTERS" : "WAR CRUISING"
  }`;
  g.text(head, left, box.y + 18, { font: F.label, colour: C.inkFaint });
  // Right-align the clock only when it cannot collide with the sector name.
  if (g.measure(head, F.label) + g.measure(tail, F.label) + 24 < usable) {
    g.text(tail, box.x + box.w - M.pad, box.y + 18, {
      font: F.label,
      colour: C.inkFaint,
      align: "right",
    });
  } else {
    g.text(tail, left, box.y + 32, { font: F.label, colour: C.inkFaint });
  }

  let x = left;
  let y = box.y + 34 + (g.measure(head, F.label) + g.measure(tail, F.label) + 24 < usable ? 0 : 14);
  for (const c of statusCells(s)) {
    if (x + c.width > left + usable && x > left) {
      x = left;
      y += 34;
    }
    g.text(c.label, x, y + 12, { font: F.label, colour: C.inkFaint });
    if (c.meter) {
      g.meter(x, y + 18, c.meter.width, 8, c.meter.share, c.meter.colour);
      g.text(c.value, x + c.meter.width + 8, y + 26, { font: F.mono, colour: c.colour });
    } else {
      g.text(c.value, x, y + 26, { font: F.mono, colour: c.colour });
    }
    x += c.width;
  }
}

// --- The action panel -------------------------------------------------------

/** The scene: what the ship has run into, and what it looks like right now. */
function scene(s: RunState): { title: string; sub: string; body: string } {
  switch (s.state) {
    case "EVENT": {
      const ev = s.pendingEventId ? eventById(s.pendingEventId) : undefined;
      if (!ev) break;
      return {
        title: ev.title,
        sub: "EVENT",
        body: ev.arrivalEffect ?? "",
      };
    }
    case "ENCOUNTER":
    case "FINAL_OPERATION": {
      const f = s.pendingFight;
      if (!f) break;
      const pkg = packageOf(f);
      return {
        title: describeFight(f),
        sub: `${pkg.kind} · ${Math.round(f.enemyHp)} of ${Math.round(f.enemyHpMax)} hull`,
        body: "",
      };
    }
    case "PORT":
      return {
        title: "In port",
        sub: "nothing here costs time until you commit it",
        body:
          "Stock and completed services stay depleted when you leave. Departing never restocks, heals, or refunds.",
      };
    case "STABILIZATION":
      return {
        title: "Not stable",
        sub: stabilizationBlockers(s).join(" · "),
        body: "An enemy breaking off does not put out a fire. Ordinary travel waits on this.",
      };
    case "EVENT_RESULT":
      return { title: "Resolved", sub: "", body: "" };
  }
  return {
    title: "Where next",
    sub: "one node per layer, and you never see what the others held",
    body: "",
  };
}

/**
 * Returns how far the content runs past the bottom of the panel, so main.ts
 * knows whether there is anything to scroll to. A port with a full service
 * list is longer than any window.
 */
export function drawPanel(
  g: Surface,
  s: RunState,
  actions: Action[],
  lines: string[],
  box: Box,
  scroll: number,
): number {
  g.frame("panel_base", box.x, box.y, box.w, box.h);
  const left = box.x + M.pad;
  const width = box.w - M.pad * 2 - 6;
  const contentTop = box.y + M.pad;
  const contentBottom = box.y + box.h - 38;
  let y = contentTop + 15 - scroll;
  g.clipped(left, contentTop, width, contentBottom - contentTop, () => {
    const sc = scene(s);
    // "Corvette escorting a merchant · Survive until exit · A damaged friendly
    // needs screening" is three authored pieces joined. It wraps.
    y = g.wrapped(sc.title, left, y, width, { font: F.title, colour: C.ink, lineHeight: 21 }) + 2;
    if (sc.sub) {
      y = g.wrapped(sc.sub, left, y, width, { font: F.small, colour: C.inkDim, lineHeight: 15 });
    }
    if (sc.body) {
      y += 4;
      y = g.wrapped(sc.body, left, y, width, { font: F.small, colour: C.inkDim });
    }

    // The boss is one persistent hull across three phases, so it gets a meter.
    const f = s.pendingFight;
    if (f && f.boss) {
      y += 6;
      g.meter(left, y, width, 10, f.enemyHp / f.enemyHpMax, C.bad);
      y += 22;
    }

    // What just happened, in the engine's words.
    if (lines.length > 0) {
      y += 6;
      for (const l of lines.slice(-4)) {
        y = g.wrapped(`› ${l}`, left, y, width, { font: F.small, colour: C.ink, lineHeight: 16 });
      }
    }

    y += 12;
    const enabled = actions.filter((a) => a.enabled);
    const blocked = actions.filter((a) => !a.enabled);
    for (const a of enabled) y = drawAction(g, a, left, y, width, true);
    for (const a of blocked) y = drawAction(g, a, left, y, width, false);
  });

  // Add the offset back before measuring: scrolling must never shorten the
  // content or hide its final choice.
  const overflow = Math.max(0, y + scroll - contentBottom);
  drawScrollControls(g, box, contentTop, contentBottom, scroll, overflow);
  return overflow;
}

/** Visible alternatives to the mouse wheel, kept outside the clipped content. */
function drawScrollControls(
  g: Surface,
  box: Box,
  top: number,
  bottom: number,
  scroll: number,
  overflow: number,
): void {
  if (overflow <= 0) return;
  const track = bottom - top;
  const thumb = Math.max(24, Math.floor(track * track / (track + overflow)));
  const at = Math.round(Math.min(1, Math.max(0, scroll / overflow)) * (track - thumb));
  g.rect(box.x + box.w - 14, top, 3, track, C.panelEdge);
  g.rect(box.x + box.w - 14, top + at, 3, thumb, C.inkDim);

  const y = box.y + box.h - 32;
  const buttons = [
    { id: "ui:scroll_up", label: "Up", x: box.x + box.w - 152, enabled: scroll > 0 },
    {
      id: "ui:scroll_down",
      label: "Down",
      x: box.x + box.w - 84,
      enabled: scroll < overflow,
    },
  ];
  for (const button of buttons) {
    const hovered = button.enabled &&
      g.hit(button.x, y, 60, 24, button.id, `Scroll ${button.label.toLowerCase()}`);
    g.frame(
      button.enabled ? (hovered ? "button_hover" : "button_normal") : "button_disabled",
      button.x,
      y,
      60,
      24,
    );
    g.text(button.label, button.x + 30, y + 16, {
      font: F.small,
      colour: button.enabled ? C.ink : C.inkFaint,
      align: "center",
    });
  }
  g.text("Scroll for more", box.x + M.pad, y + 16, { font: F.small, colour: C.inkDim });
}

function drawAction(
  g: Surface,
  a: Action,
  x: number,
  y: number,
  w: number,
  enabled: boolean,
): number {
  const previews = a.preview ?? [];
  // Some labels are a sentence: "Go to general quarters (Condition I): all
  // stations manned, fatigue accrues". They wrap, they do not run off the edge.
  const innerWidth = w - 28;
  const labelLines = wrapCount(g, a.label, innerWidth, F.body);
  const previewLines = previews.reduce((n, p) => n + wrapCount(g, p, innerWidth, F.small), 0);
  const reasonLines = !enabled && a.reason ? wrapCount(g, a.reason, innerWidth, F.small) : 0;
  const h = 24 + labelLines * 18 + (previewLines + reasonLines) * 15;
  const hovered = enabled && g.hit(x, y, w, h, a.id, [a.label, ...previews].join(". "));

  g.frame(enabled ? (hovered ? "button_hover" : "button_normal") : "button_disabled", x, y, w, h);

  let cursor = g.wrapped(a.label, x + 14, y + 24, innerWidth, {
    font: F.body,
    colour: enabled ? C.ink : C.inkFaint,
    lineHeight: 18,
  }) + 1;
  if (!enabled && a.reason) {
    cursor = g.wrapped(a.reason, x + 14, cursor, innerWidth, {
      font: F.small,
      colour: C.warn,
      lineHeight: 15,
    });
  }
  for (const p of previews) {
    cursor = g.wrapped(p, x + 14, cursor, innerWidth, {
      font: F.small,
      colour: C.inkDim,
      lineHeight: 15,
    });
  }
  return y + h + 8;
}

/** How many lines a label will take once wrapped, so the row can reserve them. */
function wrapCount(g: Surface, text: string, maxWidth: number, font: string): number {
  let lines = 1;
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (g.measure(next, font) > maxWidth && line) {
      lines++;
      line = word;
    } else {
      line = next;
    }
  }
  return lines;
}

// --- The log tail -----------------------------------------------------------

export function drawLog(g: Surface, s: RunState, box: Box): void {
  g.rect(box.x, box.y, box.w, box.h, C.panel, C.panelEdge);
  const narrow = box.w < 560;
  const stampWidth = narrow ? 92 : 130;
  g.clipped(box.x + 1, box.y + 1, box.w - 2, box.h - 2, () => {
    let y = box.y + 20;
    for (const e of s.log.slice(-3)) {
      const stamp = narrow
        ? `h${Math.round(e.hours)} ${e.kind}`
        : `h${String(Math.round(e.hours)).padStart(3)}  S${e.sector}  ${e.kind}`;
      g.text(stamp, box.x + M.pad, y, { font: F.mono, colour: C.inkFaint });
      g.text(e.text, box.x + M.pad + stampWidth, y, { font: F.small, colour: C.inkDim });
      y += 15;
    }
  });
}

// --- The debrief ------------------------------------------------------------

export function drawDebrief(g: Surface, d: Debrief, box: Box, scroll: number): number {
  g.frame("panel_dialog", box.x, box.y, box.w, box.h);
  const left = box.x + 24;
  const colour = d.outcome === "victory" ? C.good : d.outcome === "defeat" ? C.bad : C.warn;
  g.text(d.outcome.toUpperCase(), left, box.y + 44, {
    font: "600 28px system-ui, sans-serif",
    colour,
  });
  const bodyTop = g.wrapped(d.reason, left, box.y + 72, box.w - 48, {
    font: F.body,
    colour: C.inkDim,
    lineHeight: 18,
  }) + 16;
  const bodyBottom = box.y + box.h - 70;
  const factsWidth = Math.floor((box.w - 72) * 0.4);
  const timelineLeft = left + factsWidth + 32;
  const timelineWidth = box.x + box.w - 30 - timelineLeft;
  g.line(timelineLeft - 16, bodyTop, timelineLeft - 16, bodyBottom, C.panelEdge);

  const facts: [string, string][] = [
    ["SEED", String(d.seed)],
    ["BUILD", `${d.faction} · ${d.build}`],
    ["REACHED", `Sector ${d.sectorsReached} · ${d.nodesVisited} nodes · ${d.hours} hours`],
    [
      "FINAL CONTACT",
      `${d.bossArchetype} · phase ${d.bossPhaseReached + 1} · ${
        d.bossDestroyed ? "sunk" : "afloat"
      }`,
    ],
    ["TEAMS LOST", d.teamsLost.join(", ") || "None"],
    ["ENDED WITH", `${d.scrap} scrap · ${d.upgrades} upgrades`],
    ["FITTED", d.modules.map((id) => moduleDef(id)?.name ?? id).join(", ") || "None"],
  ];
  let factsY = bodyTop + 12;
  for (const [key, value] of facts) {
    g.text(key, left, factsY, { font: F.label, colour: C.inkFaint });
    factsY = g.wrapped(value, left, factsY + 18, factsWidth, {
      font: F.small,
      colour: C.ink,
      lineHeight: 16,
    }) + 8;
  }

  g.text("PATROL TIMELINE", timelineLeft, bodyTop + 12, { font: F.label, colour: C.inkFaint });
  const timelineTop = bodyTop + 28;
  let timelineY = timelineTop + 13 - scroll;
  g.clipped(timelineLeft, timelineTop, timelineWidth, bodyBottom - timelineTop, () => {
    for (const entry of d.timeline) {
      timelineY = g.wrapped(entry, timelineLeft, timelineY, timelineWidth - 10, {
        font: F.small,
        colour: C.inkDim,
        lineHeight: 16,
      }) + 8;
    }
    if (d.timeline.length === 0) {
      g.text("No patrol events recorded.", timelineLeft, timelineY, { colour: C.inkDim });
    }
  });
  const overflow = Math.max(0, timelineY + scroll - bodyBottom);
  const scrollBox = {
    x: timelineLeft - 16,
    y: box.y,
    w: box.x + box.w - timelineLeft + 16,
    h: box.h,
  };
  drawScrollControls(g, scrollBox, timelineTop, bodyBottom, scroll, overflow);

  g.line(left, bodyBottom + 10, box.x + box.w - 24, bodyBottom + 10, C.panelEdge);
  const footerY = box.y + box.h - 50;
  const hovered = g.hit(left, footerY, 180, 34, "new_run", "Another run");
  g.frame(hovered ? "button_hover" : "button_normal", left, footerY, 180, 34);
  g.text("Another run", left + 90, footerY + 22, { font: F.body, colour: C.ink, align: "center" });
  return overflow;
}
