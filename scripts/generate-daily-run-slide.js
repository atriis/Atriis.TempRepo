/* eslint-disable */
// Generates a single executive PowerPoint slide: "Test Automation Update".
//
// Every test count on the slide is MEASURED from this repo at run time — the
// nightly chain (suite-flights -> suite-hotels -> suite-shell ->
// suite-transportation) is the source of truth, so the slide cannot drift from
// what actually runs. Only the figures CI does not record (passing rate and the
// sprint highlights) are constants, at the top of this file.
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
  passingRate: 77,
  sprint: 18,
  // Wall-clock for the WHOLE chain, not one leg: the four suites run in
  // sequence, so measure from the suite-flights start to the
  // suite-transportation end.
  avgDuration: '5h',
  highlights: [
    { value: '17', label: 'Tests unblocked', hint: 'Previously blocked tests now running in the nightly chain' },
    { value: '3',  label: 'New tests created', hint: 'Brand-new coverage written from scratch' },
    { value: '17', label: 'Manual test cases automated', hint: 'Existed in the test plan, now automated' },
  ],
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
// overstate the inventory.
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
    const tests = unique.reduce((sum, p) => sum + countTestPath(p), 0);
    return { name, tests, suites: paths.length, paths: unique.length };
  });
}

// Blocked = .feature files inside a *_blocked FOLDER. A file merely NAMED
// *_blocked.feature outside one is not blocked.
function countBlocked(dir, inBlocked = false) {
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) total += countBlocked(full, inBlocked || entry.name.endsWith('_blocked'));
    else if (inBlocked && entry.name.endsWith('.feature')) total += 1;
  }
  return total;
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
  const blocked = countBlocked(path.join(REPO_ROOT, 'tests', 'features'));
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
  // right column. Last element ends at TRACK_X + TRACK_W + 1.95 = 6.7.
  const TRACK_X = LX + 1.65;
  const TRACK_W = 2.7;
  const maxTests = Math.max(...domains.map((d) => d.tests));
  domains.forEach((d, i) => {
    const ry = 3.15 + i * 0.80;
    slide.addText(d.name, {
      x: LX, y: ry, w: 1.6, h: 0.36,
      fontSize: 12, bold: true, color: COLORS.ink, valign: 'middle', fontFace: FONT,
    });
    slide.addShape(pptx.ShapeType.roundRect, {
      x: TRACK_X, y: ry + 0.05, w: TRACK_W, h: 0.26,
      fill: { color: COLORS.graySoft }, line: { color: COLORS.graySoft, width: 0 }, rectRadius: 0.05,
    });
    slide.addShape(pptx.ShapeType.roundRect, {
      x: TRACK_X, y: ry + 0.05, w: Math.max(0.06, (TRACK_W * d.tests) / maxTests), h: 0.26,
      fill: { color: COLORS.accent }, line: { color: COLORS.accent, width: 0 }, rectRadius: 0.05,
    });
    slide.addText(String(d.tests), {
      x: TRACK_X + TRACK_W + 0.1, y: ry, w: 0.6, h: 0.36,
      fontSize: 12, bold: true, color: COLORS.ink, align: 'right', valign: 'middle', fontFace: FONT,
    });
    slide.addText(`${Math.round((d.tests / totalTests) * 100)}%`, {
      x: TRACK_X + TRACK_W + 0.75, y: ry, w: 1.2, h: 0.36,
      fontSize: 9, color: COLORS.sub, valign: 'middle', fontFace: FONT,
    });
  });

  const totalY = 3.15 + domains.length * 0.80 + 0.06;
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
  slide.addShape(pptx.ShapeType.roundRect, {
    x: RX, y: 5.05, w: 5.6, h: 1.75,
    fill: { color: COLORS.graySoft }, line: { color: COLORS.border, width: 1 }, rectRadius: 0.1,
  });
  slide.addText(`Coverage added in Sprint ${opts.sprint}`, {
    x: RX + 0.2, y: 5.12, w: 5.2, h: 0.3,
    fontSize: 12, bold: true, color: COLORS.accent, fontFace: FONT,
  });

  DEFAULTS.highlights.forEach((h, i) => {
    const hy = 5.46 + i * 0.42;
    slide.addText(h.value, {
      x: RX + 0.2, y: hy, w: 0.5, h: 0.32,
      fontSize: 17, bold: true, color: COLORS.green, align: 'right', valign: 'middle', fontFace: FONT,
    });
    slide.addText(
      [
        { text: `${h.label}  `, options: { bold: true, color: COLORS.ink } },
        { text: `— ${h.hint}`, options: { color: COLORS.sub } },
      ],
      {
        x: RX + 0.8, y: hy, w: 4.7, h: 0.32,
        fontSize: 9.5, valign: 'middle', fontFace: FONT,
      }
    );
  });

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

  console.log('Measured from the nightly suite workflows:');
  domains.forEach((d) => {
    console.log(`  ${d.name.padEnd(15)} ${String(d.tests).padStart(4)} tests  (${d.suites} suites)`);
  });
  console.log(`  ${'TOTAL'.padEnd(15)} ${String(totalTests).padStart(4)} tests  (${totalSuites} suites)`);
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
