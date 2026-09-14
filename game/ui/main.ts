/// <reference lib="dom" />
/**
 * The canvas front end. Step 2 of BUILD.md: you never need the console to play.
 *
 * It reads sim state and draws it, and sends clicks back as action ids. It
 * holds no rules and no numbers of its own. Everything on screen came out of
 * `legalActions(s)`, including every cost and every reason an option is greyed
 * out, which is why this file is short and why step 3 can add a tactical screen
 * without touching sim/.
 */
import { HULLS, LOADOUTS, PATTERNS, SUPPORT } from "../sim/content.ts";
import { type Debrief, debrief } from "../sim/resolution.ts";
import { apply, legalActions } from "../sim/run.ts";
import { createRun, type RunState } from "../sim/state.ts";
import type { Faction } from "../sim/types.ts";
import { Surface } from "./draw.ts";
import { drawChart } from "./map.ts";
import { drawDebrief, drawLog, drawPanel, drawStatus, statusHeight } from "./panels.ts";
import { C, F, M } from "./theme.ts";

const FACTIONS: Faction[] = ["american", "british", "german", "japanese"];

interface Setup {
  faction: Faction;
  hullId: string;
  pattern: string;
  supportId: string;
  loadoutId: string;
  seed: number;
}

const setup: Setup = {
  faction: "american",
  hullId: "flexible",
  pattern: "mixed",
  supportId: "control",
  loadoutId: "escort",
  seed: Math.floor(Math.random() * 1_000_000),
};

let screen: "setup" | "run" | "debrief" = "setup";
let run: RunState | null = null;
let report: Debrief | null = null;
let lines: string[] = [];
let scroll = 0;
let overflow = 0;

const canvas = document.getElementById("stage") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const g = new Surface(ctx);

function resize(): void {
  const ratio = globalThis.devicePixelRatio || 1;
  canvas.width = Math.floor(canvas.clientWidth * ratio);
  canvas.height = Math.floor(canvas.clientHeight * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  draw();
}

function draw(): void {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  g.begin(w, h);
  if (screen === "setup") overflow = drawSetup(w, h);
  else if (screen === "debrief" && report) {
    overflow = drawDebrief(
      g,
      report,
      { x: M.pad, y: M.pad, w: w - M.pad * 2, h: h - M.pad * 2 },
      scroll,
    );
  } else if (run) drawRun(run, w, h);
}

// --- S02 RUN_SETUP ----------------------------------------------------------

/**
 * Shown before commit [§2.1:663]: the ship's actual strengths and weaknesses,
 * and the seed. The boss archetype is committed at creation, so it is named on
 * the first screen of the run rather than here.
 */
function drawSetup(w: number, h: number): number {
  const box = { x: M.pad, y: M.pad, w: w - M.pad * 2, h: h - M.pad * 2 };
  g.rect(box.x, box.y, box.w, box.h, C.panel, C.panelEdge);
  const left = box.x + M.pad * 2;
  const width = box.w - M.pad * 4;
  let y = box.y + 54 - scroll;
  let end = y;
  g.clipped(box.x + 1, box.y + 1, box.w - 2, box.h - 2, () => {
    g.text("Destroyer", left, y, { font: "600 30px system-ui, sans-serif" });
    y += 22;
    y = g.wrapped(
      "Six sectors, then one large ship. Nothing refills when you cross a boundary.",
      left,
      y,
      width,
      { font: F.body, colour: C.inkDim, lineHeight: 19 },
    ) + 14;

    y = chips(
      left,
      y,
      "SIDE AND NAVY",
      FACTIONS.map((f) => ({
        id: `faction:${f}`,
        label: f,
        on: setup.faction === f,
      })),
      box.w - M.pad * 4,
    );

    y = chips(
      left,
      y,
      "HULL",
      HULLS.map((hl) => ({
        id: `hull:${hl.id}`,
        label: `${hl.name}  ${hl.hp}hp  ${hl.armor.toFixed(2)}a  ${
          hl.speed.toFixed(2)
        }v  ${hl.fuelCapacity}f`,
        on: setup.hullId === hl.id,
      })),
      box.w - M.pad * 4,
    );

    y = chips(
      left,
      y,
      "DECK",
      Object.entries(PATTERNS).map(([id, p]) => ({
        id: `pattern:${id}`,
        label: `${p.deck}  ${p.name}`,
        on: setup.pattern === id,
      })),
      box.w - M.pad * 4,
    );

    y = chips(
      left,
      y,
      "SUPPORT",
      SUPPORT.map((sp) => ({
        id: `support:${sp.id}`,
        label: sp.name,
        on: setup.supportId === sp.id,
      })),
      box.w - M.pad * 4,
    );

    y = chips(
      left,
      y,
      "STARTING FIT",
      LOADOUTS.map((l) => ({
        id: `loadout:${l.id}`,
        label: `${l.name}: ${l.modules.join(", ")}`,
        on: setup.loadoutId === l.id,
      })),
      box.w - M.pad * 4,
    );

    y += 6;
    g.text("SEED", left, y, { font: F.label, colour: C.inkFaint });
    y += 18;
    g.text(String(setup.seed), left, y + 4, { font: F.monoBig, colour: C.ink });
    const rerollHover = g.hit(left + 110, y - 12, 90, 26, "reroll");
    g.rect(left + 110, y - 12, 90, 26, rerollHover ? C.raised : "transparent", C.panelEdge);
    g.text("reroll", left + 130, y + 5, { font: F.small, colour: C.inkDim });
    const hint = "the same seed and the same ship replays the identical run";
    if (216 + g.measure(hint, F.small) < width) {
      g.text(hint, left + 216, y + 4, { font: F.small, colour: C.inkFaint });
      y += 40;
    } else {
      g.text(hint, left, y + 26, { font: F.small, colour: C.inkFaint });
      y += 58;
    }

    const startHover = g.hit(left, y, 200, 42, "begin");
    g.rect(left, y, 200, 42, startHover ? C.ship : "transparent", C.ship);
    g.text("Take her out", left + 20, y + 27, {
      font: F.title,
      colour: startHover ? C.ground : C.ship,
    });
    end = y + 42;
  });
  void h;
  return Math.max(0, end - (box.y + box.h - M.pad));
}

function chips(
  x: number,
  y: number,
  title: string,
  items: { id: string; label: string; on: boolean }[],
  maxWidth: number,
): number {
  g.text(title, x, y, { font: F.label, colour: C.inkFaint });
  let cx = x;
  let cy = y + 14;
  for (const it of items) {
    const w = g.measure(it.label, F.small) + 24;
    if (cx + w > x + maxWidth) {
      cx = x;
      cy += 32;
    }
    const hovered = g.hit(cx, cy, w, 26, it.id);
    g.rect(
      cx,
      cy,
      w,
      26,
      it.on ? C.raised : "transparent",
      it.on ? C.ship : hovered ? C.inkFaint : C.panelEdge,
    );
    g.text(it.label, cx + 12, cy + 17, { font: F.small, colour: it.on ? C.ink : C.inkDim });
    cx += w + 8;
  }
  return cy + 44;
}

// --- The run ----------------------------------------------------------------

function drawRun(s: RunState, w: number, h: number): void {
  const actions = legalActions(s);
  const status = { x: M.pad, y: M.pad, w: w - M.pad * 2, h: statusHeight(s, w - M.pad * 2) };
  drawStatus(g, s, status);

  const bodyTop = status.y + status.h + M.gap;
  const bodyH = h - bodyTop - M.logHeight - M.gap - M.pad;
  const wide = w >= 980;
  const panelW = wide ? Math.max(360, Math.min(470, w * 0.38)) : w - M.pad * 2;

  if (wide) {
    drawChart(g, s, actions, {
      x: M.pad,
      y: bodyTop,
      w: w - M.pad * 2 - panelW - M.gap,
      h: bodyH,
    });
  }
  overflow = drawPanel(g, s, actions, lines, {
    x: wide ? w - M.pad - panelW : M.pad,
    y: bodyTop,
    w: panelW,
    h: bodyH,
  }, scroll);
  drawLog(g, s, { x: M.pad, y: h - M.pad - M.logHeight, w: w - M.pad * 2, h: M.logHeight });
}

// --- Input ------------------------------------------------------------------

function begin(): void {
  run = createRun({ ...setup, difficulty: "normal" });
  report = null;
  lines = [
    `Seed ${setup.seed}. The final operation will be ${run.boss.name}.`,
  ];
  screen = "run";
}

function dispatch(id: string): void {
  if (screen === "setup") {
    if (id === "begin") {
      scroll = 0;
      return begin();
    }
    if (id === "reroll") {
      setup.seed = Math.floor(Math.random() * 1_000_000);
      return;
    }
    const [field, value] = id.split(":");
    if (field === "faction") setup.faction = value as Faction;
    if (field === "hull") setup.hullId = value;
    if (field === "pattern") setup.pattern = value;
    if (field === "support") setup.supportId = value;
    if (field === "loadout") setup.loadoutId = value;
    return;
  }
  if (screen === "debrief") {
    if (id === "new_run") {
      setup.seed = Math.floor(Math.random() * 1_000_000);
      screen = "setup";
      scroll = 0;
    }
    return;
  }
  if (!run) return;
  lines = apply(run, id);
  // A new scene starts at the top of its own list.
  scroll = 0;
  if (run.lifecycle !== "ACTIVE") {
    run.lifecycle = "ARCHIVED";
    report = debrief(run);
    screen = "debrief";
  }
}

function pointer(e: MouseEvent): { x: number; y: number } {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

canvas.addEventListener("mousemove", (e) => {
  const { x, y } = pointer(e);
  const id = g.at(x, y);
  canvas.style.cursor = id ? "pointer" : "default";
  if (id !== g.hover) {
    g.hover = id;
    draw();
  }
});

canvas.addEventListener("click", (e) => {
  const { x, y } = pointer(e);
  const id = g.at(x, y);
  if (!id) return;
  dispatch(id);
  g.hover = null;
  draw();
});

canvas.addEventListener("wheel", (e) => {
  if (overflow <= 0) return;
  e.preventDefault();
  scroll = Math.max(0, Math.min(overflow, scroll + e.deltaY));
  draw();
}, { passive: false });

// A tap already arrives as a click, but a drag does not scroll a canvas, and
// the port screen is longer than a phone.
let touchY: number | null = null;
canvas.addEventListener("touchstart", (e) => {
  touchY = e.touches[0]?.clientY ?? null;
}, { passive: true });

canvas.addEventListener("touchmove", (e) => {
  if (touchY === null || overflow <= 0) return;
  const y = e.touches[0]?.clientY ?? touchY;
  e.preventDefault();
  scroll = Math.max(0, Math.min(overflow, scroll + (touchY - y)));
  touchY = y;
  draw();
}, { passive: false });

canvas.addEventListener("touchend", () => {
  touchY = null;
}, { passive: true });

globalThis.addEventListener("resize", resize);
resize();
