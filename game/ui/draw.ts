/// <reference lib="dom" />
/**
 * Canvas primitives and hit testing.
 *
 * The DOM lib is referenced here and in main.ts and nowhere else. sim/ has no
 * such line and scripts/check-sim-boundary.ts fails if one appears.
 *
 * Every clickable thing is drawn and registered in one call, so there is no
 * second list of rectangles to keep in step with the first.
 */
import { C, F, M } from "./theme.ts";

export interface Hit {
  x: number;
  y: number;
  w: number;
  h: number;
  id: string;
}

export class Surface {
  ctx: CanvasRenderingContext2D;
  hits: Hit[] = [];
  hover: string | null = null;
  width = 0;
  height = 0;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  begin(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.hits = [];
    this.ctx.fillStyle = C.ground;
    this.ctx.fillRect(0, 0, width, height);
  }

  rect(x: number, y: number, w: number, h: number, fill: string, stroke?: string): void {
    const { ctx } = this;
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, M.radius);
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  line(x1: number, y1: number, x2: number, y2: number, colour: string, width = 1): void {
    const { ctx } = this;
    ctx.strokeStyle = colour;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  text(
    s: string,
    x: number,
    y: number,
    opts: { font?: string; colour?: string; align?: CanvasTextAlign } = {},
  ): void {
    const { ctx } = this;
    ctx.font = opts.font ?? F.body;
    ctx.fillStyle = opts.colour ?? C.ink;
    ctx.textAlign = opts.align ?? "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(s, x, y);
    ctx.textAlign = "left";
  }

  /** Returns the y after the last line, so callers can stack without measuring twice. */
  wrapped(
    s: string,
    x: number,
    y: number,
    maxWidth: number,
    opts: { font?: string; colour?: string; lineHeight?: number } = {},
  ): number {
    const { ctx } = this;
    ctx.font = opts.font ?? F.small;
    ctx.fillStyle = opts.colour ?? C.inkDim;
    const lineHeight = opts.lineHeight ?? 15;
    let line = "";
    let cursor = y;
    for (const word of s.split(" ")) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > maxWidth && line) {
        ctx.fillText(line, x, cursor);
        cursor += lineHeight;
        line = word;
      } else {
        line = next;
      }
    }
    if (line) {
      ctx.fillText(line, x, cursor);
      cursor += lineHeight;
    }
    return cursor;
  }

  measure(s: string, font: string): number {
    this.ctx.font = font;
    return this.ctx.measureText(s).width;
  }

  /** Draw a clickable region and register it in the same breath. */
  hit(x: number, y: number, w: number, h: number, id: string): boolean {
    this.hits.push({ x, y, w, h, id });
    return this.hover === id;
  }

  at(x: number, y: number): string | null {
    for (let i = this.hits.length - 1; i >= 0; i--) {
      const r = this.hits[i];
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return r.id;
    }
    return null;
  }

  /** Draw inside a box and nothing outside it. Used by the scrolling panel. */
  clipped(x: number, y: number, w: number, h: number, body: () => void): void {
    const { ctx } = this;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    body();
    ctx.restore();
  }

  /** A horizontal meter. Used for hull, threat and the boss. */
  meter(x: number, y: number, w: number, h: number, share: number, colour: string): void {
    this.rect(x, y, w, h, C.raised);
    const filled = Math.max(0, Math.min(1, share)) * w;
    if (filled > 0) this.rect(x, y, filled, h, colour);
  }
}
