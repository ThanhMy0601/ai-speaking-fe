import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guards the bug that made every screen look broken at once.
 *
 * `@import "tailwindcss"` declares `@layer theme, base, components, utilities`.
 * Unlayered CSS outranks *every* cascade layer no matter how low its
 * specificity, so one top-level `* { margin: 0; padding: 0 }` in base.css beat
 * `.p-12`, `.px-6`, `.mx-auto` and the rest — measured in headless Chrome, every
 * padding computed to 0px and mx-auto stopped centring. `button { background:
 * none }` likewise flattened every filled button to transparent.
 *
 * The failure is invisible in review: the CSS is valid, the utilities are
 * emitted, and nothing errors. Only the rendered page disagrees. So assert the
 * structural property instead — our base styles must live inside a layer.
 */

const BASE_CSS = readFileSync(join(__dirname, "base.css"), "utf8");

/** Strips comments, then walks brace depth to collect top-level constructs. */
function topLevelBlocks(css: string): { header: string; layered: boolean }[] {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const blocks: { header: string; layered: boolean }[] = [];
  let depth = 0;
  let start = 0;

  for (let i = 0; i < src.length; i++) {
    if (src[i] === "{") {
      if (depth === 0) {
        const header = src.slice(start, i).trim();
        blocks.push({ header, layered: /^@layer\b/.test(header) });
      }
      depth++;
    } else if (src[i] === "}") {
      depth--;
      if (depth === 0) start = i + 1;
    }
  }
  return blocks;
}

describe("base.css cascade layers", () => {
  it("declares no unlayered rule that could outrank a utility", () => {
    const unlayered = topLevelBlocks(BASE_CSS)
      .filter((b) => !b.layered)
      .map((b) => b.header);

    // The reduced-motion block is deliberately unlayered: it is a global
    // override that must beat utilities, and it only touches animation,
    // transition and scroll-behavior — never layout or colour.
    const unexpected = unlayered.filter(
      (h) => !/^@media\s*\(prefers-reduced-motion/.test(h)
    );

    expect(unexpected).toEqual([]);
  });

  it("does not restate the reset Tailwind preflight already emits", () => {
    // Preflight sets box-sizing/margin/padding on `*` inside @layer base.
    // Repeating it here is what caused the outage; repeating it *inside* the
    // layer would be harmless but still dead weight.
    const universalReset = /\*\s*,\s*\*::before[\s\S]{0,120}?(margin|padding)\s*:\s*0/;
    expect(universalReset.test(BASE_CSS)).toBe(false);
  });
});
