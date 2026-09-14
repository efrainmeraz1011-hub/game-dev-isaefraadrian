/**
 * Colours, type and spacing. The only file in the project allowed to have an
 * opinion about how anything looks.
 *
 * Rectangles and text [BUILD.md section 4 step 2]. A chart table under a dim
 * lamp: dark ground, pale ink, one amber for warnings and one red for damage.
 * Nothing here is a sprite and nothing here is final.
 */

export const C: Record<string, string> = {
  ground: "#0e1418",
  panel: "#141d23",
  panelEdge: "#243138",
  raised: "#1b262d",

  ink: "#dfe7ea",
  inkDim: "#8fa3ac",
  inkFaint: "#5a6c76",

  ship: "#6fb3d2",
  route: "#2e424d",
  routeLive: "#6fb3d2",

  good: "#7bb661",
  warn: "#d9a441",
  bad: "#c4593f",
  port: "#c9a227",

  hull: "#7bb661",
  hullLow: "#c4593f",
  threat: "#d9a441",
};

/** Sans for prose, mono for anything with a number in it. */
export const F: Record<string, string> = {
  title: "600 17px system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  body: "14px system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  small: "12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  mono: "12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  monoBig: "600 15px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  label: "600 10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
};

export const M = {
  pad: 16,
  gap: 10,
  statusHeight: 74,
  logHeight: 62,
  radius: 3,
} as const;

/** Hull colour by how much of it is left. Amber is the warning, not a mood. */
export function hullColour(share: number): string {
  if (share > 0.6) return C.hull;
  if (share > 0.3) return C.warn;
  return C.hullLow;
}

export function threatColour(threat: number): string {
  if (threat < 30) return C.inkDim;
  if (threat < 60) return C.warn;
  return C.bad;
}
