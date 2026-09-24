/**
 * Re-colouring a Lottie animation to the app's theme.
 *
 * A downloaded animation arrives with whatever palette its author chose. On a
 * banner painted in the theme accent that palette is simply someone else's,
 * and two palettes on one surface read as a mistake rather than as artwork.
 *
 * So the colours are remapped on load. The rule is hue-only:
 *
 *   - Every saturated colour is rotated onto the accent's hue, keeping its own
 *     saturation and lightness. That preserves the drawing's internal
 *     contrast - highlights stay lighter than midtones, shadows stay darker -
 *     while making the whole thing one family with the page.
 *   - Near-neutral colours (black outlines, white paper, grey shading) are
 *     left alone. They are the line work; tinting them muddies the art and
 *     buys nothing.
 *   - Lightness is floored, because these animations sit on a saturated
 *     gradient. Without it the darker parts of the palette disappear into the
 *     background instead of reading as shapes.
 *
 * Lottie stores colour as [r, g, b] floats in 0..1 on fill (`fl`) and stroke
 * (`st`) items, and as a flat [pos, r, g, b, ...] ramp on gradients
 * (`gf`/`gs`). Both are handled.
 */

type RGB = [number, number, number];

/** 0..1 RGB to 0..1 HSL. */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h, s, l];
}

/** 0..1 HSL back to 0..1 RGB. */
function hslToRgb(h: number, s: number, l: number): RGB {
  if (s === 0) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t: number) => {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  return [channel(h + 1 / 3), channel(h), channel(h - 1 / 3)];
}

export interface RecolorOptions {
  /**
   * Colours at or below this saturation are treated as line work and left
   * untouched. 0.18 keeps blacks, whites and greys neutral while still
   * catching muted brand colours.
   */
  neutralBelow?: number;
  /**
   * Floor for lightness, so nothing sinks into a saturated banner. Raising
   * this makes the artwork read brighter against the gradient.
   */
  minLightness?: number;
}

/**
 * Rotate every saturated colour in an animation onto `accent`'s hue.
 *
 * Returns a new object; the input is not modified, so the imported JSON stays
 * reusable if the theme changes and the animation is recoloured again.
 */
export function recolorLottie<T>(
  animation: T,
  accent: RGB,
  { neutralBelow = 0.18, minLightness = 0.34 }: RecolorOptions = {}
): T {
  const [accentHue] = rgbToHsl(accent[0], accent[1], accent[2]);

  const mapChannelTriplet = (r: number, g: number, b: number): RGB => {
    const [, s, l] = rgbToHsl(r, g, b);
    // Line work and paper stay as drawn.
    if (s <= neutralBelow) return [r, g, b];
    return hslToRgb(accentHue, s, Math.max(l, minLightness));
  };

  const visit = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(visit);
    if (!node || typeof node !== "object") return node;

    const src = node as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(src)) out[key] = visit(src[key]);

    const ty = out.ty;

    // Solid fill or stroke: `c.k` is [r, g, b] (often with a trailing alpha).
    if ((ty === "fl" || ty === "st") && out.c && typeof out.c === "object") {
      const c = out.c as { k?: unknown };
      if (
        Array.isArray(c.k) &&
        c.k.length >= 3 &&
        c.k.every((v) => typeof v === "number")
      ) {
        const k = c.k as number[];
        const [r, g, b] = mapChannelTriplet(k[0], k[1], k[2]);
        (out.c as { k: number[] }).k = [r, g, b, ...k.slice(3)];
      }
    }

    // Gradient: `g.k.k` is a flat ramp of [position, r, g, b, ...] quads.
    if ((ty === "gf" || ty === "gs") && out.g && typeof out.g === "object") {
      const g = out.g as { k?: { k?: unknown } };
      const ramp = g.k?.k;
      if (Array.isArray(ramp) && ramp.every((v) => typeof v === "number")) {
        const stops = ramp as number[];
        // Only the colour quads at the head of the ramp are RGB; an opacity
        // ramp may follow, and must not be treated as colour.
        const colourCount = (g.k as unknown as { p?: number }).p ?? 0;
        const quads = colourCount || Math.floor(stops.length / 4);
        for (let i = 0; i < quads; i++) {
          const at = i * 4;
          if (at + 3 >= stops.length) break;
          const [r, gg, b] = mapChannelTriplet(
            stops[at + 1],
            stops[at + 2],
            stops[at + 3]
          );
          stops[at + 1] = r;
          stops[at + 2] = gg;
          stops[at + 3] = b;
        }
      }
    }

    return out;
  };

  return visit(animation) as T;
}

/**
 * Drop the backdrop an animation was exported with.
 *
 * Illustration exports are drawn on an artboard, and the artboard usually
 * ships with the art: `attendence.json` carries a 1509x1509 white solid plus a
 * near-white floor and its shading, `documents.json` a wall. On a banner that
 * paper reads as a white card sitting on the gradient, which is not what a
 * decorative illustration should look like.
 *
 * Lottie draws the `layers` array front to back, so the backdrop is whatever
 * sits at the end of it. This walks back from there and drops layers while
 * they are paper - a full-canvas solid (layer type 1), or a shape layer whose
 * every fill is a light near-neutral - and stops at the first layer that is
 * not. Stopping is what keeps it safe: white *inside* the drawing (a calendar
 * page, a laptop screen, the pages of a book) is in front of the backdrop, so
 * the walk never reaches it.
 *
 * `recolorLottie` cannot do this job. White is near-neutral, so it is treated
 * as line work and deliberately left alone - which is the correct rule for
 * line work and the wrong one for paper.
 *
 * Returns a new object; the input is not modified.
 */

/** Every solid fill or stroke colour under a node, as 0..1 RGB triplets. */
function collectFills(node: unknown, out: number[][]): void {
  if (Array.isArray(node)) {
    for (const child of node) collectFills(child, out);
    return;
  }
  if (!node || typeof node !== "object") return;
  const item = node as Record<string, unknown>;
  if (item.ty === "fl" || item.ty === "st") {
    const k = (item.c as { k?: unknown } | undefined)?.k;
    if (Array.isArray(k) && k.length >= 3 && k.every((v) => typeof v === "number")) {
      out.push(k.slice(0, 3) as number[]);
    }
  }
  for (const value of Object.values(item)) collectFills(value, out);
}

export function stripBackdropLayers<T>(animation: T): T {
  const root = animation as unknown as {
    w?: number;
    h?: number;
    layers?: Array<Record<string, unknown>>;
  };
  if (!Array.isArray(root.layers) || root.layers.length === 0) return animation;

  const isPaper = (layer: Record<string, unknown>): boolean => {
    // A solid (type 1) counts only if it actually covers the canvas; a smaller
    // one is a block of colour the drawing meant to have.
    if (layer.ty === 1) {
      const sw = layer.sw as number | undefined;
      const sh = layer.sh as number | undefined;
      return (
        typeof sw === "number" &&
        typeof sh === "number" &&
        sw >= (root.w ?? 0) &&
        sh >= (root.h ?? 0)
      );
    }
    if (layer.ty !== 4) return false;

    const colours: number[][] = [];
    collectFills(layer.shapes, colours);
    if (colours.length === 0) return false;
    // Light and near-grey: paper and the soft shading printed on it.
    return colours.every(
      (c) => Math.min(...c) > 0.85 && Math.max(...c) - Math.min(...c) < 0.06
    );
  };

  let end = root.layers.length;
  while (end > 0 && isPaper(root.layers[end - 1])) end--;
  if (end === root.layers.length) return animation;

  return { ...root, layers: root.layers.slice(0, end) } as unknown as T;
}
