#!/usr/bin/env -S deno run --allow-read
/**
 * Enforce the one rule that makes assets layerable [flow/BUILD.md section 2]:
 *
 *   game/sim/ never knows that a screen exists.
 *
 * Nothing under sim/ may import from ui/, and nothing under sim/ may reference
 * document, window, or CanvasRenderingContext2D. That boundary is why grey
 * rectangles become sprites later without touching game logic, and why
 * headless.ts plays hundreds of runs with no browser.
 *
 * A grep is enough [BUILD.md section 2]. This is that grep, with line numbers.
 *
 * Usage:  deno run --allow-read scripts/check-sim-boundary.ts
 */
const ROOT = new URL("../game/sim/", import.meta.url).pathname;

const BANNED: { pattern: RegExp; why: string }[] = [
  { pattern: /\bdocument\b/, why: "DOM" },
  { pattern: /\bwindow\b/, why: "DOM" },
  { pattern: /\bCanvasRenderingContext2D\b/, why: "canvas" },
  { pattern: /\bHTML[A-Za-z]*Element\b/, why: "DOM" },
  { pattern: /\brequestAnimationFrame\b/, why: "rendering" },
  { pattern: /from\s+["'][^"']*\/ui\//, why: "an import from ui/" },
  { pattern: /\bconsole\.(log|warn|error)\b/, why: "output: sim/ returns state, it does not print" },
];

async function* files(dir: string): AsyncGenerator<string> {
  for await (const entry of Deno.readDir(dir)) {
    const path = `${dir}${entry.name}`;
    if (entry.isDirectory) yield* files(`${path}/`);
    else if (entry.name.endsWith(".ts")) yield path;
  }
}

const problems: string[] = [];
let checked = 0;

for await (const path of files(ROOT)) {
  checked++;
  const lines = (await Deno.readTextFile(path)).split("\n");
  let inBlockComment = false;
  lines.forEach((line, i) => {
    // A citation or a comment naming the rule is not a violation of it, so
    // comments are stripped first, block comments included.
    let code = line;
    if (inBlockComment) {
      const end = code.indexOf("*/");
      if (end < 0) return;
      code = code.slice(end + 2);
      inBlockComment = false;
    }
    code = code.replace(/\/\*.*?\*\//g, "");
    const open = code.indexOf("/*");
    if (open >= 0) {
      inBlockComment = true;
      code = code.slice(0, open);
    }
    code = code.replace(/\/\/.*$/, "");
    if (code.trim() === "") return;
    for (const { pattern, why } of BANNED) {
      if (pattern.test(code)) {
        problems.push(`${path.replace(/.*\/game\//, "game/")}:${i + 1}: ${why} — ${line.trim()}`);
      }
    }
  });
}

if (problems.length > 0) {
  for (const p of problems) console.log(p);
  console.log(`\n${problems.length} boundary violation(s) across ${checked} files in game/sim/`);
  Deno.exit(1);
}
console.log(`ok   ${checked} files in game/sim/, no screen, no DOM, no output`);
