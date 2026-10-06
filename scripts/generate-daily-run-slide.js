/* eslint-disable */
// Generates a single executive PowerPoint slide: "Test Automation Update".
//
// The per-domain test counts (.feature files) are constants at the top of this
// file, with the passing rate and the sprint highlights. The
// suite and blocked counts are still measured from this repo at run time.
//
// Usage:
//   node scripts/generate-daily-run-slide.js
//   node scripts/generate-daily-run-slide.js --rate 81 --sprint 19 --duration 4h30m --out docs/My-Run.pptx
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const WORKFLOW_DIR = path.join(REPO_ROOT, '.github', 'workflows');

// ---------------------------------------------------------------------------
// Figures CI does not carry — edit these per report.
// ---------------------------------------------------------------------------
const DEFAULTS = {
  passingRate: 75,
  sprint: 20,
  // Wall-clock for the WHOLE chain, not one leg: the four suites run in
  // sequence, so measure from the suite-flights start to the
  // suite-transportation end.
  avgDuration: '2h',
  highlights: [
    { value: '130',  label: 'New tests' },
  ],
  // Breakdown under the headline. Kept separate from the domain bars above,
  // which count the whole suite, not what the sprint added. New .feature files
  // added to main from 2026-09-13 to 2026-10-06; renamed hybrids not counted.
  newTestsByDomain: [
    { name: 'Flights', value: 83 },
    { name: 'Hotels', value: 11 },
    { name: 'Transportation', value: 14 },
    { name: 'Shell', value: 22 },
  ],
  // Tests (.feature files) per domain in the daily run, as reported for the
  // 2026-10-05 morning batch.
  testsByDomain: {
    Flights: 414,
    Hotels: 126,
    Shell: 240,
    Transportation: 216,
  },
};

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const out = {
    rate: DEFAULTS.passingRate,
    sprint: DEFAULTS.sprint,
    duration: DEFAULTS.avgDuration,
    outFile: path.join(REPO_ROOT, 'docs', 'Test-Automation-Update.pptx'),
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--rate') out.rate = Number(argv[i + 1]);
    else if (arg === '--sprint') out.sprint = argv[i + 1];
    else if (arg === '--duration') out.duration = argv[i + 1];
    else if (arg === '--out') out.outFile = path.resolve(REPO_ROOT, argv[i + 1]);
  }
  if (!Number.isFinite(out.rate) || out.rate < 0 || out.rate > 100) {
    throw new Error(`--rate must be a number between 0 and 100 (got "${out.rate}")`);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Counting. One .feature FILE is one test — never a cucumber pickle count: the
// Scenario Outlines in the suites expand into several runs each and would
// overstate the inventory. The domain bars use DEFAULTS.testsByDomain; the
// count measured here from the suite workflows is only printed as a cross-check.
// ---------------------------------------------------------------------------
const DOMAIN_WORKFLOWS = [
  { name: 'Flights', file: 'suite-flights.yml' },
  { name: 'Hotels', file: 'suite-hotels.yml' },
  { name: 'Shell', file: 'suite-shell.yml' },
  { name: 'Transportation', file: 'suite-transportation.yml' },
];

function countFeaturesRecursive(dir) {
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) total += countFeaturesRecursive(path.join(dir, entry.name));
    else if (entry.name.endsWith('.feature')) total += 1;
  }
  return total;
}

// A test_path is one of three shapes, and they do NOT behave alike:
//   - a directory           -> recurses (so a nested *_blocked folder is included)
//   - "<dir>/*.feature"     -> non-recursive glob; that is how the rail suites
//                              keep their _blocked subfolder out of the run
//   - a single .feature     -> one test
function countTestPath(testPath) {
  const abs = path.join(REPO_ROOT, testPath);
  if (testPath.includes('*')) {
    const dir = path.dirname(abs);
    if (!fs.existsSync(dir)) return 0;
    return fs.readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith('.feature')).length;
  }
  if (!fs.existsSync(abs)) return 0;
  if (fs.statSync(abs).isDirectory()) return countFeaturesRecursive(abs);
  return abs.endsWith('.feature') ? 1 : 0;
}

// The suite matrices are inline JSON inside the workflow YAML, so the test_path
// values are read straight off the text rather than through a YAML parser.
function readTestPaths(workflowFile) {
  const abs = path.join(WORKFLOW_DIR, workflowFile);
  if (!fs.existsSync(abs)) throw new Error(`Missing workflow: ${abs}`);
  const yaml = fs.readFileSync(abs, 'utf8');
  const matches = [...yaml.matchAll(/"test_path"\s*:\s*"([^"]+)"/g)].map((m) => m[1]);
  if (!matches.length) throw new Error(`No test_path entries found in ${workflowFile}`);
  return matches;
}

function collectDomains() {
  return DOMAIN_WORKFLOWS.map(({ name, file }) => {
    const paths = readTestPaths(file);
    // A path can appear twice when a suite is sharded across two legs
    // (flights_general_non_booking is), and its features must be counted once.
    const unique = [...new Set(paths)];
    const measured = unique.reduce((sum, p) => sum + countTestPath(p), 0);
    const tests = DEFAULTS.testsByDomain[name];
    if (!Number.isFinite(tests)) throw new Error(`No test count for ${name} in DEFAULTS.testsByDomain`);
    return { name, tests, measured, suites: paths.length, paths: unique.length };
  });
}

// Blocked = every .feature file the suite workflows do not run: the *_blocked
// folders plus any file no suite picks up (smoke.feature, cars/payload_test).
// Measured against the suite count, not DEFAULTS.testsByDomain.
function countOutsideRun(domains) {
  const all = countFeaturesRecursive(path.join(REPO_ROOT, 'tests', 'features'));
  return all - domains.reduce((a, d) => a + d.measured, 0);
}

// ---------------------------------------------------------------------------
// Slide
// ---------------------------------------------------------------------------
function loadPptxGenJS() {
  try {
    return require('pptxgenjs');
  } catch (error) {
    if (error && error.code === 'MODULE_NOT_FOUND' && error.message.includes("'pptxgenjs'")) {
      throw new Error(
        'Missing dependency: "pptxgenjs". Install it before running scripts/generate-daily-run-slide.js.'
      );
    }
    throw error;
  }
}

const COLORS = {
  bg: 'FFFFFF',
  ink: '1F2937',
  sub: '6B7280',
  accent: '2563EB',
  accentSoft: 'DBEAFE',
  green: '10B981',
  greenSoft: 'D1FAE5',
  yellow: 'F59E0B',
  yellowSoft: 'FEF3C7',
  red: 'EF4444',
  redSoft: 'FEE2E2',
  gray: 'E5E7EB',
  graySoft: 'F3F4F6',
  border: 'E5E7EB',
};
const FONT = 'Calibri';

function build(opts) {
  const domains = collectDomains();
  const totalTests = domains.reduce((a, d) => a + d.tests, 0);
  const totalSuites = domains.reduce((a, d) => a + d.suites, 0);
  const blocked = countOutsideRun(domains);
  const passed = Math.round((totalTests * opts.rate) / 100);
  const failed = totalTests - passed;
  const PptxGenJS = loadPptxGenJS();
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5 in
  pptx.title = 'Test Automation Update';

  const slide = pptx.addSlide();
  slide.background = { color: COLORS.bg };

  slide.addText('Test Automation Update', {
    x: 0.4, y: 0.25, w: 12.5, h: 0.55,
    fontSize: 28, bold: true, color: COLORS.ink, fontFace: FONT,
  });
  slide.addText(`OBT only`, {
    x: 0.4, y: 0.78, w: 12.5, h: 0.3,
    fontSize: 12, color: COLORS.sub, fontFace: FONT,
  });
  slide.addShape(pptx.ShapeType.line, {
    x: 0.4, y: 1.15, w: 12.5, h: 0,
    line: { color: COLORS.border, width: 1 },
  });

  // === KPI ROW ===
  // The per-outcome figures are NOT repeated here — the doughnut on the right
  // already carries passed/failed, and duplicating them left the row reading as
  // five competing numbers.
  const kpis = [
    { value: `${opts.rate}%`, label: 'Passing rate', fill: COLORS.greenSoft, line: COLORS.green, color: COLORS.green },
    { value: String(totalTests), label: 'Tests running daily', fill: COLORS.accentSoft, line: COLORS.accent, color: COLORS.accent },
    { value: opts.duration, label: 'Avg total duration', fill: 'FFFFFF', line: COLORS.border, color: COLORS.ink },
    { value: String(blocked), label: 'Blocked (outside the run)', fill: 'FFFFFF', line: COLORS.border, color: COLORS.sub },
  ];
  const kpiGap = 0.15;
  const kpiW = (12.5 - kpiGap * (kpis.length - 1)) / kpis.length;
  kpis.forEach((k, i) => {
    const kx = 0.4 + i * (kpiW + kpiGap);
    slide.addShape(pptx.ShapeType.roundRect, {
      x: kx, y: 1.35, w: kpiW, h: 1.15,
      fill: { color: k.fill }, line: { color: k.line, width: 1 }, rectRadius: 0.1,
    });
    slide.addText(k.value, {
      x: kx, y: 1.42, w: kpiW, h: 0.62,
      fontSize: 32, bold: true, color: k.color, align: 'center', valign: 'middle', fontFace: FONT,
    });
    slide.addText(k.label, {
      x: kx, y: 2.03, w: kpiW, h: 0.4,
      fontSize: 10, color: COLORS.sub, align: 'center', fontFace: FONT,
    });
  });

  // === LEFT: tests by domain ===
  const LX = 0.4;
  slide.addText('Tests by domain', {
    x: LX, y: 2.72, w: 6.3, h: 0.35,
    fontSize: 14, bold: true, color: COLORS.accent, fontFace: FONT,
  });
  // The bar track has to leave room for BOTH trailing columns — the count and
  // the share-of-total note — inside the left half, or the note runs into the
  // right column. Last element ends at TRACK_X + TRACK_W + 1.35 = 6.6.
  const TRACK_X = LX + 1.65;
  const TRACK_W = 3.2;
  // Bars are share of the total, NOT share of the largest domain: the trailing
  // note reads as a share of the total, so scaling to the max made a 41% bar
  // fill the whole track. Full track = 100% of the daily run.
  const ROW_STEP = 0.80;
  // Rounding each share on its own can add up to 101% (414/126/240/216 did), so
  // floor them all and hand the missing points to the largest remainders.
  const exact = domains.map((d) => (d.tests / totalTests) * 100);
  const shares = exact.map(Math.floor);
  const missing = 100 - shares.reduce((a, s) => a + s, 0);
  exact
    .map((e, i) => ({ i, rem: e - Math.floor(e) }))
    .sort((a, b) => b.rem - a.rem)
    .slice(0, missing)
    .forEach(({ i }) => { shares[i] += 1; });
  domains.forEach((d, i) => {
    const ry = 3.15 + i * ROW_STEP;
    slide.addText(d.name, {
      x: LX, y: ry, w: 1.6, h: 0.36,
      fontSize: 12, bold: true, color: COLORS.ink, valign: 'middle', fontFace: FONT,
    });
    slide.addShape(pptx.ShapeType.roundRect, {
      x: TRACK_X, y: ry + 0.05, w: TRACK_W, h: 0.26,
      fill: { color: COLORS.graySoft }, line: { color: COLORS.graySoft, width: 0 }, rectRadius: 0.05,
    });
    slide.addShape(pptx.ShapeType.roundRect, {
      x: TRACK_X, y: ry + 0.05, w: Math.max(0.06, (TRACK_W * d.tests) / totalTests), h: 0.26,
      fill: { color: COLORS.accent }, line: { color: COLORS.accent, width: 0 }, rectRadius: 0.05,
    });
    slide.addText(String(d.tests), {
      x: TRACK_X + TRACK_W + 0.1, y: ry, w: 0.6, h: 0.36,
      fontSize: 12, bold: true, color: COLORS.ink, align: 'right', valign: 'middle', fontFace: FONT,
    });
    slide.addText(`${shares[i]}%`, {
      x: TRACK_X + TRACK_W + 0.75, y: ry, w: 0.6, h: 0.36,
      fontSize: 9, color: COLORS.sub, valign: 'middle', fontFace: FONT,
    });
  });

  const totalY = 3.15 + domains.length * ROW_STEP + 0.06;
  slide.addShape(pptx.ShapeType.line, {
    x: LX, y: totalY, w: 6.3, h: 0,
    line: { color: COLORS.border, width: 1 },
  });
  slide.addText('Total', {
    x: LX, y: totalY + 0.08, w: 1.6, h: 0.32,
    fontSize: 13, bold: true, color: COLORS.ink, fontFace: FONT,
  });
  slide.addText(`${totalTests} tests`, {
    x: TRACK_X, y: totalY + 0.08, w: TRACK_W + 0.7, h: 0.32,
    fontSize: 13, bold: true, color: COLORS.accent, align: 'right', fontFace: FONT,
  });

  // === RIGHT TOP: pass / fail split ===
  // A hairline divider plus a wider gutter keeps this column from reading as a
  // continuation of the domain bars; RX is far enough right that the left
  // column's trailing share-of-total note clears it.
  slide.addShape(pptx.ShapeType.line, {
    x: 6.95, y: 2.75, w: 0, h: 4.05,
    line: { color: COLORS.border, width: 1 },
  });
  const RX = 7.3;
  slide.addText('Run outcome', {
    x: RX, y: 2.72, w: 5.6, h: 0.35,
    fontSize: 14, bold: true, color: COLORS.accent, fontFace: FONT,
  });

  slide.addChart(pptx.ChartType.doughnut, [
    { name: 'Outcome', labels: ['Passed', 'Failed'], values: [passed, failed] },
  ], {
    x: RX - 0.15, y: 3.0, w: 2.5, h: 2.0,
    holeSize: 60,
    showLegend: false,
    showValue: false,
    chartColors: [COLORS.green, COLORS.yellow],
    dataBorder: { pt: 1, color: 'FFFFFF' },
  });
  slide.addText(`${opts.rate}%`, {
    x: RX + 0.525, y: 3.75, w: 1.15, h: 0.5,
    fontSize: 20, bold: true, color: COLORS.green, align: 'center', fontFace: FONT,
  });

  [
    { label: `Passed  —  ${passed} tests`, color: COLORS.green },
    { label: `Failed  —  ${failed} tests`, color: COLORS.yellow },
  ].forEach((it, i) => {
    const ly = 3.55 + i * 0.42;
    slide.addShape(pptx.ShapeType.rect, {
      x: RX + 2.5, y: ly + 0.06, w: 0.18, h: 0.18,
      fill: { color: it.color }, line: { color: it.color, width: 0 },
    });
    slide.addText(it.label, {
      x: RX + 2.75, y: ly, w: 2.85, h: 0.3,
      fontSize: 11, color: COLORS.ink, valign: 'middle', fontFace: FONT,
    });
  });
  slide.addText(
    'Passing rate depends on supplier availability, environment speed and administration.',
    {
      x: RX + 2.5, y: 4.42, w: 3.1, h: 0.55,
      fontSize: 9, italic: true, color: COLORS.sub, fontFace: FONT,
    }
  );

  // === RIGHT BOTTOM: highlights ===
  // CARD_Y leaves a clear band under the outcome legend and its note, so the
  // card reads as its own block rather than a footnote to the doughnut.
  const CARD_Y = 5.35;
  const ROW_H = 0.46;
  slide.addShape(pptx.ShapeType.roundRect, {
    x: RX, y: CARD_Y, w: 5.6, h: 1.45,
    fill: { color: COLORS.graySoft }, line: { color: COLORS.border, width: 1 }, rectRadius: 0.1,
  });
  slide.addText(`Coverage added in Sprint ${opts.sprint}`, {
    x: RX + 0.2, y: CARD_Y + 0.08, w: 5.2, h: 0.34,
    fontSize: 14, bold: true, color: COLORS.accent, fontFace: FONT,
  });

  DEFAULTS.highlights.forEach((h, i) => {
    const hy = CARD_Y + 0.46 + i * ROW_H;
    // 0.75 wide and unwrapped: at 0.5 a three-digit value broke onto two lines.
    // Right-aligned, so it still ends where the label starts.
    slide.addText(h.value, {
      x: RX + 0.05, y: hy, w: 0.75, h: 0.34, wrap: false,
      fontSize: 20, bold: true, color: COLORS.green, align: 'right', valign: 'middle', fontFace: FONT,
    });
    slide.addText(h.label, {
      x: RX + 0.85, y: hy, w: 4.6, h: 0.34,
      fontSize: 11.5, bold: true, color: COLORS.ink, valign: 'middle', fontFace: FONT,
    });
  });

  // One line rather than a stacked row per domain: the card sits between the
  // outcome legend and the footer, with no vertical room for four more rows.
  slide.addText(
    DEFAULTS.newTestsByDomain.flatMap((d, i) => [
      ...(i ? [{ text: '   ·   ', options: { color: COLORS.border } }] : []),
      { text: `${d.value} `, options: { bold: true, color: COLORS.green } },
      { text: d.name, options: { color: COLORS.sub } },
    ]),
    {
      x: RX + 0.85, y: CARD_Y + 0.46 + DEFAULTS.highlights.length * ROW_H, w: 4.6, h: 0.34,
      fontSize: 11, valign: 'middle', fontFace: FONT,
    }
  );

  slide.addText(
    'Goal: build confidence — validate stability, analyse results, expand coverage.',
    {
      x: 0.4, y: 6.95, w: 12.5, h: 0.35,
      fontSize: 11, italic: true, color: COLORS.sub, align: 'center', fontFace: FONT,
    }
  );

  return { pptx, domains, totalTests, totalSuites, blocked, passed, failed };
}

// ---------------------------------------------------------------------------
function main() {
  const opts = parseArgs(process.argv.slice(2));
  const { pptx, domains, totalTests, totalSuites, blocked, passed, failed } = build(opts);

  console.log('Tests by domain (measured from the suite workflows in brackets):');
  domains.forEach((d) => {
    console.log(`  ${d.name.padEnd(15)} ${String(d.tests).padStart(4)} tests  (${d.measured} measured, ${d.suites} suites)`);
  });
  const totalMeasured = domains.reduce((a, d) => a + d.measured, 0);
  console.log(`  ${'TOTAL'.padEnd(15)} ${String(totalTests).padStart(4)} tests  (${totalMeasured} measured, ${totalSuites} suites)`);
  console.log(`  blocked, outside the run: ${blocked}`);
  console.log(`  at ${opts.rate}%: ${passed} passed / ${failed} to analyse`);

  fs.mkdirSync(path.dirname(opts.outFile), { recursive: true });
  return pptx.writeFile({ fileName: opts.outFile }).then((f) => {
    console.log('Created:', f);
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
