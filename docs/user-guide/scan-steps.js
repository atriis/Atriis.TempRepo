/*
 * Step Explorer — data generator.
 *
 * Scans tests/steps/ for Cucumber step definitions and emits a static data file
 * (assets/step-data.js) that the Step Explorer page reads. Emitting a JS file
 * (window.STEP_DATA = [...]) rather than fetching the raw source at runtime lets
 * the guide work when opened directly from disk (file://...), no local server needed.
 *
 * Re-run after adding or changing steps:  node docs/user-guide/scan-steps.js
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const STEPS_DIR = path.join(REPO_ROOT, "tests", "steps");
const OUT_FILE = path.join(__dirname, "assets", "step-data.js");

// Step file (without .steps.js) -> product label. Files not listed fall back to "Shared".
// Update this map when a new product-specific step file is added.
const PRODUCT_BY_FILE = {
  flight_nff: "Flights",
  flight_pricing: "Flights",
  flight_results: "Flights",
  flight_search: "Flights",
  pfa_fare_rules: "Flights",
  hotel_level_results: "Hotels",
  hotel_search: "Hotels",
  room_level_results: "Hotels",
  car_results: "Cars",
  car_search: "Cars",
  amtrak: "Rail",
  amtrak_results: "Rail",
  benerail_results: "Rail",
  benerail_search: "Rail",
  evolvi_results: "Rail",
  evolvi_search: "Rail",
  ground_transport: "Ground Transport",
  parking: "Parking",
};

// The set of DSL module names (from src/dsl/index.js), used to recognise DSL references.
function readDslNames() {
  const idx = fs.readFileSync(path.join(REPO_ROOT, "src", "dsl", "index.js"), "utf8");
  const names = new Set();
  const re = /require\(["']\.\/([A-Za-z0-9_]+)["']\)/g;
  let m;
  while ((m = re.exec(idx))) names.add(m[1]);
  return names;
}

// Collect the local identifiers in a step file that are bound to a DSL module, e.g.
//   const { HotelSearch, Cart } = require("@dsl");
//   const Cart = require("@dsl/Cart");
//   const { FlightSearch } = require("../../src/dsl");
function collectDslLocals(src, dslNames) {
  const locals = new Map(); // localIdentifier -> canonical DSL name

  // const NAME = require("@dsl/Name")  or  require("../../src/dsl/Name")
  const single = /const\s+([A-Za-z0-9_]+)\s*=\s*require\(\s*["'](?:@dsl|(?:\.\.\/)+src\/dsl)\/([A-Za-z0-9_]+)["']\s*\)/g;
  let m;
  while ((m = single.exec(src))) {
    if (dslNames.has(m[2])) locals.set(m[1], m[2]);
  }

  // const { A, B: C } = require("@dsl")  or  require("../../src/dsl")
  const barrel = /const\s*\{([^}]*)\}\s*=\s*require\(\s*["'](?:@dsl|(?:\.\.\/)+src\/dsl)["']\s*\)/g;
  while ((m = barrel.exec(src))) {
    m[1].split(",").forEach((part) => {
      const seg = part.trim();
      if (!seg) return;
      const [orig, alias] = seg.split(":").map((s) => s.trim());
      if (dslNames.has(orig)) locals.set(alias || orig, orig);
    });
  }
  return locals;
}

// Extract the first string-literal argument (the Cucumber pattern) starting at index `from`.
function readPatternString(src, from) {
  // skip whitespace to the opening paren
  let i = src.indexOf("(", from);
  if (i === -1) return null;
  i++;
  while (i < src.length && /\s/.test(src[i])) i++;
  const quote = src[i];
  if (quote !== '"' && quote !== "'" && quote !== "`") return null;
  i++;
  let out = "";
  while (i < src.length) {
    const ch = src[i];
    if (ch === "\\") {
      out += src[i + 1];
      i += 2;
      continue;
    }
    if (ch === quote) break;
    out += ch;
    i++;
  }
  return out;
}

function scanFile(filePath, dslNames) {
  const src = fs.readFileSync(filePath, "utf8");
  const base = path.basename(filePath).replace(/\.steps\.js$/, "");
  const product = PRODUCT_BY_FILE[base] || "Shared";
  const dslLocals = collectDslLocals(src, dslNames);

  // Find every step definition start: line beginning (ignoring indent) with Given/When/Then(
  const stepRe = /(^|\n)\s*(Given|When|Then)\s*\(/g;
  const starts = [];
  let m;
  while ((m = stepRe.exec(src))) {
    starts.push({ keyword: m[2], index: m.index + m[0].length - 1 }); // index at "("
  }

  const steps = [];
  for (let s = 0; s < starts.length; s++) {
    const { keyword, index } = starts[s];
    const pattern = readPatternString(src, index);
    if (pattern == null) continue;
    const bodyEnd = s + 1 < starts.length ? starts[s + 1].index : src.length;
    const body = src.slice(index, bodyEnd);

    const dslUsed = new Set();
    for (const [local, canonical] of dslLocals) {
      const ref = new RegExp("\\b" + local + "\\s*\\.");
      if (ref.test(body)) dslUsed.add(canonical);
    }

    steps.push({
      type: keyword,
      text: pattern,
      file: path.basename(filePath),
      product,
      dsl: Array.from(dslUsed).sort(),
    });
  }
  return steps;
}

function main() {
  const dslNames = readDslNames();
  const files = fs
    .readdirSync(STEPS_DIR)
    .filter((f) => f.endsWith(".steps.js"))
    .sort();

  let all = [];
  for (const f of files) {
    all = all.concat(scanFile(path.join(STEPS_DIR, f), dslNames));
  }

  // De-duplicate exact (type,text,file) collisions just in case.
  const seen = new Set();
  const deduped = all.filter((s) => {
    const k = s.type + "|" + s.text + "|" + s.file;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const products = Array.from(new Set(deduped.map((s) => s.product))).sort();
  const dsls = Array.from(new Set(deduped.flatMap((s) => s.dsl))).sort();

  const payload = {
    generatedFrom: "tests/steps/*.js",
    count: deduped.length,
    products,
    dsls,
    steps: deduped,
  };

  const banner =
    "// AUTO-GENERATED by docs/user-guide/scan-steps.js — do not edit by hand.\n" +
    "// Re-run: node docs/user-guide/scan-steps.js\n";
  fs.writeFileSync(OUT_FILE, banner + "window.STEP_DATA = " + JSON.stringify(payload, null, 2) + ";\n");

  // Console summary for review.
  console.log("Steps found:", deduped.length);
  console.log("Products:", products.join(", "));
  console.log("DSLs (" + dsls.length + "):", dsls.join(", "));
  const byType = deduped.reduce((a, s) => ((a[s.type] = (a[s.type] || 0) + 1), a), {});
  console.log("By type:", JSON.stringify(byType));
  const noDsl = deduped.filter((s) => s.dsl.length === 0).length;
  console.log("Steps with no DSL reference:", noDsl);
  const byProduct = deduped.reduce((a, s) => ((a[s.product] = (a[s.product] || 0) + 1), a), {});
  console.log("By product:", JSON.stringify(byProduct));
  console.log("Wrote:", path.relative(REPO_ROOT, OUT_FILE));
}

main();
