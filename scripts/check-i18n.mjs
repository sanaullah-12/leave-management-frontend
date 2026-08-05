#!/usr/bin/env node
/**
 * i18n health check.
 *
 * Two failure modes that are invisible at runtime until a user switches
 * language and half the screen stays in English:
 *
 *   1. KEY DRIFT — a key exists in `en` but is missing from another locale
 *      (or vice versa). i18next silently falls back, so nobody notices.
 *
 *   2. STALE HOOKS — a `useMemo`/`useCallback` builds translated strings but
 *      omits `t` from its dependency array. `t` changes identity on a language
 *      change; without it the memo keeps the old language's text forever.
 *      This is the bug that froze the whole sidebar.
 *
 * Run: npm run check:i18n     (exits non-zero on any problem)
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const SRC = join(ROOT, "src");
const LOCALES = join(SRC, "i18n", "locales");

let problems = 0;
const fail = (msg) => {
  problems += 1;
  console.error(`  ✗ ${msg}`);
};

/* ------------------------------------------------------------------ */
/* 1. Key alignment                                                    */
/* ------------------------------------------------------------------ */

const flatten = (obj, prefix = "") =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? flatten(v, `${prefix}${k}.`)
      : [`${prefix}${k}`]
  );

const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));

console.log("i18n: checking translation key alignment…");

const locales = readdirSync(LOCALES).filter((d) =>
  statSync(join(LOCALES, d)).isDirectory()
);

if (!locales.includes("en")) {
  fail("no `en` locale found — English is the fallback and must exist");
}

const namespaces = readdirSync(join(LOCALES, "en"))
  .filter((f) => f.endsWith(".json") && f !== "_meta.json")
  .map((f) => f.replace(/\.json$/, ""));

for (const ns of namespaces) {
  const base = new Set(flatten(readJson(join(LOCALES, "en", `${ns}.json`))));
  for (const loc of locales) {
    const file = join(LOCALES, loc, `${ns}.json`);
    let keys;
    try {
      keys = new Set(flatten(readJson(file)));
    } catch {
      fail(`${loc}/${ns}.json is missing or unparseable`);
      continue;
    }
    const missing = [...base].filter((k) => !keys.has(k));
    const extra = [...keys].filter((k) => !base.has(k));
    if (missing.length) fail(`${loc}/${ns}.json missing: ${missing.join(", ")}`);
    if (extra.length) fail(`${loc}/${ns}.json has keys not in en: ${extra.join(", ")}`);
  }
}

// Every locale needs _meta.json — it is what registers the language.
for (const loc of locales) {
  try {
    const meta = readJson(join(LOCALES, loc, "_meta.json"));
    for (const field of ["code", "name", "nativeName", "dir", "flag"]) {
      if (!meta[field]) fail(`${loc}/_meta.json is missing "${field}"`);
    }
    if (meta.code !== loc) fail(`${loc}/_meta.json code "${meta.code}" ≠ folder "${loc}"`);
    if (!["ltr", "rtl"].includes(meta.dir)) fail(`${loc}/_meta.json dir must be ltr or rtl`);
  } catch {
    fail(`${loc}/_meta.json is missing or unparseable`);
  }
}

console.log(`  ${locales.length} locales × ${namespaces.length} namespaces checked`);

/* ------------------------------------------------------------------ */
/* 2. Stale translated hooks                                           */
/* ------------------------------------------------------------------ */

console.log("i18n: checking for stale translated hooks…");

const walk = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const p = join(dir, entry);
    return statSync(p).isDirectory()
      ? walk(p)
      : /\.tsx?$/.test(p)
      ? [p]
      : [];
  });

/** Extract each `name(...)` call with balanced parens, skipping strings. */
function balancedCalls(src, name) {
  const out = [];
  const re = new RegExp(`\\b${name}\\(`, "g");
  let m;
  while ((m = re.exec(src))) {
    let depth = 0;
    let inStr = false;
    let quote = "";
    for (let i = m.end ?? m.index + m[0].length - 1; i < src.length; i++) {
      const c = src[i];
      if (inStr) {
        if (c === "\\") { i++; continue; }
        if (c === quote) inStr = false;
        continue;
      }
      if (c === '"' || c === "'" || c === "`") { inStr = true; quote = c; continue; }
      if (c === "(") depth++;
      else if (c === ")") {
        depth--;
        if (depth === 0) {
          out.push({
            line: src.slice(0, m.index).split("\n").length,
            text: src.slice(m.index, i + 1),
          });
          break;
        }
      }
    }
  }
  return out;
}

let hookCount = 0;
for (const file of walk(SRC)) {
  const src = readFileSync(file, "utf8");
  if (!src.includes("useTranslation")) continue;

  for (const hook of ["useMemo", "useCallback"]) {
    for (const { line, text } of balancedCalls(src, hook)) {
      const depsMatch = text.match(/,\s*(\[[^[\]]*\])\s*\)$/s);
      if (!depsMatch) continue;
      const deps = depsMatch[1];
      const body = text.slice(0, depsMatch.index);
      // Only care about hooks that actually resolve a translation key.
      if (!/\bt\(\s*["'`]/.test(body)) continue;
      hookCount += 1;
      if (/(\[|[,\s])t([,\s]|\])/.test(deps)) continue;
      fail(
        `${relative(ROOT, file).split(sep).join("/")}:${line} — ${hook} builds ` +
          `translated text but omits \`t\` from deps ${deps.trim()}`
      );
    }
  }
}

console.log(`  ${hookCount} translated hooks checked`);

/* ------------------------------------------------------------------ */

if (problems) {
  console.error(`\ni18n check FAILED — ${problems} problem(s)\n`);
  process.exit(1);
}
console.log("\ni18n check passed\n");
