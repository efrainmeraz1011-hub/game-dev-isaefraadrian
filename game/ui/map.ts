/**
 * The sector chart. Columns are layers, rectangles are nodes, lines are the
 * edges you may commit [§1.5:128].
 *
 * You visit one node per layer and never see what the others held. Clearing
 * every node is not possible and not required, so the chart shows the shape of
 * the choice rather than a route to optimise.
 */
import { candidates, travelCost } from "../sim/campaign.ts";
import { currentSector, type RunState } from "../sim/state.ts";
import type { Action, MapNode } from "../sim/types.ts";
import { C, F, M } from "./theme.ts";
import type { Surface } from "./draw.ts";

const NODE_W_MAX = 164;
const NODE_H = 58;

const MAP_ICONS: Record<MapNode["kind"], string> = {
  open_water: "water",
  island: "island",
  strait: "strait",
  convoy_rendezvous: "convoy",
  patrol_lane: "patrol",
  salvage_site: "salvage",
  weather_front: "weather",
  minefield: "minefield",
  port: "port",
  anchorage: "anchorage",
  distress_call: "distress",
  operation_area: "operation",
};

/** What reconnaissance permits, as a colour [§5.2:1272 step 9]. */
function threatInk(node: MapNode): string {
  switch (node.knownThreat) {
    case "quiet":
      return C.good;
    case "patrolled":
      return C.warn;
    case "contested":
      return C.bad;
    default:
      return C.inkFaint;
  }
}

function label(node: MapNode): string {
  return node.kind === "port" ? "PORT" : node.kind.replace(/_/g, " ");
}

export function drawChart(
  g: Surface,
  s: RunState,
  actions: Action[],
  box: { x: number; y: number; w: number; h: number },
): void {
  const sector = currentSector(s);
  g.frame("panel_base", box.x, box.y, box.w, box.h);

  g.text(sector.name.toUpperCase(), box.x + M.pad, box.y + 22, {
    font: F.label,
    colour: C.inkFaint,
  });
  g.text(
    `SECTOR ${s.sectorIndex + 1} OF 6 · ONE NODE PER LAYER`,
    box.x + box.w - M.pad,
    box.y + 22,
    { font: F.label, colour: C.inkFaint, align: "right" },
  );

  const layers = sector.layers;
  const top = box.y + 40;
  const usableH = box.h - 54;
  const colW = (box.w - M.pad * 2) / layers.length;
  // A sector can have six layers [§1.5:128]. The node has to fit its column,
  // and below about 90px the fuel and hours line stops being readable at all,
  // so it comes off rather than overprinting the label.
  // The gap between columns is where the edges are drawn, so it has to be
  // wide enough to see a line in.
  const nodeW = Math.min(NODE_W_MAX, colW - 28);
  const terse = nodeW < 92;
  const next = s.layerIndex + 1;
  const live = new Map(
    candidates(s).map((n) => [n.id, actions.find((a) => a.payload?.nodeId === n.id)] as const),
  );

  // The graph, then the edges you may actually commit on top of it. They are
  // drawn separately because an option that spends a route layer [EVT-21,
  // EVT-72] rejoins further along, so the live edge can span more than one
  // column and the ship's node is not always in the previous one.
  for (let l = 0; l < layers.length - 1; l++) {
    for (const from of layers[l]) {
      for (const to of layers[l + 1]) {
        const a = centre(box, colW, top, usableH, layers, l, from);
        const b = centre(box, colW, top, usableH, layers, l + 1, to);
        g.line(a.x + nodeW / 2, a.y, b.x - nodeW / 2, b.y, C.route, 1);
      }
    }
  }

  // In port or mid-event there is no edge on offer, so nothing is lit.
  const travelling = [...live.values()].some((a) => a !== undefined);
  const shipLayer = layers.findIndex((layer) => layer.some((n) => n.id === s.nodeId));
  if (travelling && shipLayer >= 0) {
    const from = layers[shipLayer].find((n) => n.id === s.nodeId)!;
    const a = centre(box, colW, top, usableH, layers, shipLayer, from);
    for (const to of candidates(s)) {
      const b = centre(box, colW, top, usableH, layers, next, to);
      const action = live.get(to.id);
      g.line(
        a.x + nodeW / 2,
        a.y,
        b.x - nodeW / 2,
        b.y,
        action?.enabled ? C.routeLive : C.bad,
        1.5,
      );
    }
  }

  for (let l = 0; l < layers.length; l++) {
    for (const node of layers[l]) {
      const p = centre(box, colW, top, usableH, layers, l, node);
      const x = Math.round(p.x - nodeW / 2);
      const y = Math.round(p.y - NODE_H / 2);
      const here = node.id === s.nodeId;
      const action = live.get(node.id);
      const selectable = l === next && action !== undefined;

      let fill = C.raised;
      let edge = C.panelEdge;
      if (here) {
        fill = C.ship;
        edge = C.ship;
      } else if (selectable) edge = action!.enabled ? C.routeLive : C.bad;
      else if (!node.visited && l < next) fill = C.panel;

      const hovered = selectable && action!.enabled &&
        g.hit(
          x,
          y,
          nodeW,
          NODE_H,
          action!.id,
          `${action!.label}. ${action!.preview?.join(". ") ?? ""}`,
        );
      g.rect(x, y, nodeW, NODE_H, hovered ? C.panelEdge : fill, edge);

      const ink = here ? C.ground : selectable ? C.ink : C.inkFaint;
      g.sprite(`map_${MAP_ICONS[node.kind]}`, x + 8, y + 10, 16, 16);
      g.text(clip(g, label(node), nodeW - 40), x + 32, y + 22, { font: F.small, colour: ink });

      if (selectable) {
        const cost = travelCost(s, node);
        const cash = terse
          ? `${cost.fuel.toFixed(0)}f`
          : `${cost.fuel.toFixed(1)}f  ${cost.hours.toFixed(1)}h`;
        g.text(cash, x + 8, y + 46, {
          font: F.mono,
          colour: action!.enabled ? C.inkDim : C.bad,
        });
        g.rect(x + nodeW - 11, y + 36, 5, 10, threatInk(node));
      } else if (here) {
        g.text(terse ? "here" : "you are here", x + 8, y + 46, { font: F.mono, colour: C.ground });
      }
    }
  }

  g.text(
    "quiet · patrolled · contested · unknown is unread, not safe",
    box.x + M.pad,
    box.y + box.h - 12,
    { font: F.label, colour: C.inkFaint },
  );
}

/** Trim a label to the width it actually has, with an ellipsis rather than an overprint. */
function clip(g: Surface, text: string, maxWidth: number): string {
  if (g.measure(text, F.small) <= maxWidth) return text;
  let out = text;
  while (out.length > 1 && g.measure(out + "…", F.small) > maxWidth) out = out.slice(0, -1);
  return out + "…";
}

function centre(
  box: { x: number; y: number; w: number },
  colW: number,
  top: number,
  usableH: number,
  layers: MapNode[][],
  l: number,
  node: MapNode,
) {
  const column = layers[l];
  const i = column.indexOf(node);
  const slot = usableH / (column.length + 1);
  return {
    x: box.x + M.pad + colW * l + colW / 2,
    y: top + slot * (i + 1),
  };
}
