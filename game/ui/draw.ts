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
import { C, F } from "./theme.ts";

interface SpriteEntry {
  id: string;
  path: string;
  width: number;
  height: number;
}

const sprites = new Map<string, HTMLImageElement>();
let spriteLoad: Promise<void> | undefined;

/** Load the checked-in pack once. A failed load can be retried without losing loaded sprites. */
export function loadSprites(onProgress?: () => void): Promise<void> {
  if (spriteLoad) return spriteLoad;
  spriteLoad = (async () => {
    const base = new URL("assets/naval-ui-v1/", document.baseURI);
    const response = await fetch(new URL("manifest.json", base));
    if (!response.ok) throw new Error(`Could not load asset manifest (${response.status}).`);
    const manifest: { assets: SpriteEntry[] } = await response.json();
    await Promise.all(manifest.assets.map(async (asset) => {
      if (sprites.has(asset.id)) return;
      const bitmap = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          if (image.naturalWidth !== asset.width || image.naturalHeight !== asset.height) {
            reject(new Error(`Unexpected sprite dimensions: ${asset.id}.`));
          } else {
            resolve(image);
          }
        };
        image.onerror = () => reject(new Error(`Could not load sprite: ${asset.id}.`));
        image.src = new URL(asset.path, base).href;
      });
      sprites.set(asset.id, bitmap);
      onProgress?.();
    }));
  })().catch((error) => {
    spriteLoad = undefined;
    throw error;
  });
  return spriteLoad;
}

interface ClipBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

function intersection(a: ClipBox, b: ClipBox): ClipBox {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  return {
    x,
    y,
    w: Math.max(0, Math.min(a.x + a.w, b.x + b.w) - x),
    h: Math.max(0, Math.min(a.y + a.h, b.y + b.h) - y),
  };
}

export interface Hit {
  x: number;
  y: number;
  w: number;
  h: number;
  id: string;
  label?: string;
}

export class Surface {
  ctx: CanvasRenderingContext2D;
  hits: Hit[] = [];
  hover: string | null = null;
  width = 0;
  height = 0;
  private clip: ClipBox = { x: 0, y: 0, w: 0, h: 0 };

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  begin(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.hits = [];
    this.clip = { x: 0, y: 0, w: width, h: height };
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.fillStyle = C.ground;
    this.ctx.fillRect(0, 0, width, height);
  }

  /** Keep placement on pixel boundaries; callers use whole-number native sprite scales. */
  sprite(id: string, x: number, y: number, w?: number, h?: number): void {
    const image = sprites.get(id);
    if (!image) return;
    const width = w ??
      (h === undefined ? image.naturalWidth : h * image.naturalWidth / image.naturalHeight);
    const height = h ?? width * image.naturalHeight / image.naturalWidth;
    if (width <= 0 || height <= 0) return;
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.drawImage(image, Math.round(x), Math.round(y), Math.round(width), Math.round(height));
  }

  /** Nine-slice a 17px tile: eight-pixel corners, with only the one-pixel seams repeated. */
  frame(id: string, x: number, y: number, w: number, h: number): void {
    const image = sprites.get(id);
    x = Math.round(x);
    y = Math.round(y);
    w = Math.round(w);
    h = Math.round(h);
    if (w <= 0 || h <= 0) return;
    if (!image || image.naturalWidth !== 17 || image.naturalHeight !== 17 || w < 16 || h < 16) {
      this.rect(x, y, w, h, C.panel, C.panelEdge);
      return;
    }
    const { ctx } = this;
    ctx.imageSmoothingEnabled = false;
    const middleW = w - 16;
    const middleH = h - 16;
    // The source seam is one pixel wide/high, so stretching it is identical to tiling it.
    if (middleW > 0 && middleH > 0) {
      ctx.drawImage(image, 8, 8, 1, 1, x + 8, y + 8, middleW, middleH);
    }
    if (middleW > 0) {
      ctx.drawImage(image, 8, 0, 1, 8, x + 8, y, middleW, 8);
      ctx.drawImage(image, 8, 9, 1, 8, x + 8, y + h - 8, middleW, 8);
    }
    if (middleH > 0) {
      ctx.drawImage(image, 0, 8, 8, 1, x, y + 8, 8, middleH);
      ctx.drawImage(image, 9, 8, 8, 1, x + w - 8, y + 8, 8, middleH);
    }
    ctx.drawImage(image, 0, 0, 8, 8, x, y, 8, 8);
    ctx.drawImage(image, 9, 0, 8, 8, x + w - 8, y, 8, 8);
    ctx.drawImage(image, 0, 9, 8, 8, x, y + h - 8, 8, 8);
    ctx.drawImage(image, 9, 9, 8, 8, x + w - 8, y + h - 8, 8, 8);
  }

  rect(x: number, y: number, w: number, h: number, fill: string, stroke?: string): void {
    const { ctx } = this;
    x = Math.round(x);
    y = Math.round(y);
    w = Math.round(w);
    h = Math.round(h);
    if (w <= 0 || h <= 0) return;
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
    if (stroke) {
      // Fill the four border rows directly: a centred canvas stroke would soften their edges.
      ctx.fillStyle = stroke;
      ctx.fillRect(x, y, w, 1);
      ctx.fillRect(x, y + h - 1, w, 1);
      ctx.fillRect(x, y, 1, h);
      ctx.fillRect(x + w - 1, y, 1, h);
    }
  }

  line(x1: number, y1: number, x2: number, y2: number, colour: string, width = 1): void {
    if (y1 === y2) {
      this.rect(Math.min(x1, x2), y1, Math.abs(x2 - x1), width, colour);
      return;
    }
    if (x1 === x2) {
      this.rect(x1, Math.min(y1, y2), width, Math.abs(y2 - y1), colour);
      return;
    }
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
  hit(x: number, y: number, w: number, h: number, id: string, label = id): boolean {
    const visible = intersection(this.clip, { x, y, w: Math.max(0, w), h: Math.max(0, h) });
    if (visible.w <= 0 || visible.h <= 0) return false;
    this.hits.push({ ...visible, id, label });
    return this.hover === id;
  }

  at(x: number, y: number): string | null {
    for (let i = this.hits.length - 1; i >= 0; i--) {
      const r = this.hits[i];
      if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return r.id;
    }
    return null;
  }

  /** Draw inside a box and nothing outside it. Used by the scrolling panel. */
  clipped(x: number, y: number, w: number, h: number, body: () => void): void {
    const { ctx } = this;
    const previous = this.clip;
    this.clip = intersection(previous, { x, y, w: Math.max(0, w), h: Math.max(0, h) });
    ctx.save();
    try {
      ctx.beginPath();
      ctx.rect(this.clip.x, this.clip.y, this.clip.w, this.clip.h);
      ctx.clip();
      body();
    } finally {
      this.clip = previous;
      ctx.restore();
    }
  }

  /** A horizontal meter. Used for hull, threat and the boss. */
  meter(x: number, y: number, w: number, h: number, share: number, colour: string): void {
    this.rect(x, y, w, h, C.raised);
    const filled = Math.max(0, Math.min(1, share)) * w;
    if (filled > 0) this.rect(x, y, filled, h, colour);
  }
}
