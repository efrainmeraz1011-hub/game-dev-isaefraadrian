import { Surface } from "./draw.ts";

function equal(actual: unknown, expected: unknown): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}

function surface(): { g: Surface; saves: () => number } {
  let depth = 0;
  const ctx = {
    fillRect() {},
    beginPath() {},
    rect() {},
    clip() {},
    save() {
      depth++;
    },
    restore() {
      depth--;
    },
  } as unknown as CanvasRenderingContext2D;
  const g = new Surface(ctx);
  g.begin(200, 160);
  return { g, saves: () => depth };
}

Deno.test("scrolled controls cannot activate through the surrounding panel", () => {
  const { g } = surface();
  g.hit(0, 0, 200, 160, "background");
  g.clipped(20, 30, 100, 80, () => {
    g.hit(25, 10, 90, 35, "partly-visible", "Choose route");
    g.hit(25, 115, 90, 35, "below-scroll-window");
  });
  equal(g.at(30, 20), "background");
  equal(g.at(30, 35), "partly-visible");
  equal(g.at(30, 120), "background");
  equal(g.hits[1], {
    x: 25,
    y: 30,
    w: 90,
    h: 15,
    id: "partly-visible",
    label: "Choose route",
  });
  equal(g.hits.length, 2);
});

Deno.test("nested clipping intersects both windows and restores the outer window", () => {
  const { g, saves } = surface();
  g.clipped(20, 20, 90, 90, () => {
    g.clipped(70, 60, 100, 100, () => {
      g.hit(0, 0, 200, 160, "inner");
    });
    g.hit(25, 25, 20, 20, "outer");
  });
  equal(g.at(75, 65), "inner");
  equal(g.at(115, 65), null);
  equal(g.at(75, 115), null);
  equal(g.at(30, 30), "outer");
  equal(saves(), 0);
});

Deno.test("a failed panel draw restores its canvas state and hit-test clip", () => {
  const { g, saves } = surface();
  try {
    g.clipped(50, 50, 20, 20, () => {
      throw new Error("panel failed");
    });
  } catch {
    // A failed panel must not silently constrain subsequent controls.
  }
  g.hit(5, 5, 10, 10, "after-failure");
  equal(g.at(7, 7), "after-failure");
  equal(saves(), 0);
});

Deno.test("new frames clear old controls and bound hits to the current viewport", () => {
  const { g } = surface();
  g.hit(150, 100, 20, 20, "old-control");
  g.begin(100, 80);
  g.hit(90, 70, 30, 30, "edge-control");
  equal(g.at(155, 105), null);
  equal(g.at(95, 75), "edge-control");
  equal(g.at(100, 75), null);
  equal(g.at(95, 80), null);
  equal(g.hits.length, 1);
});

Deno.test("empty clips do not register controls or retain hover state", () => {
  const { g } = surface();
  g.hover = "hidden";
  g.clipped(220, 0, 10, 10, () => {
    equal(g.hit(0, 0, 300, 300, "hidden"), false);
  });
  g.clipped(0, 0, 0, 40, () => {
    g.hit(0, 0, 30, 30, "zero-width");
  });
  equal(g.hits.length, 0);
});

Deno.test("adjacent controls share no clickable edge and the top visible control wins", () => {
  const { g } = surface();
  g.hit(10, 10, 30, 30, "left");
  g.hit(40, 10, 30, 30, "right");
  equal(g.at(39, 20), "left");
  equal(g.at(40, 20), "right");
  g.clipped(35, 15, 10, 10, () => {
    g.hit(20, 0, 50, 40, "overlay");
  });
  equal(g.at(40, 20), "overlay");
  equal(g.at(45, 20), "right");
});
