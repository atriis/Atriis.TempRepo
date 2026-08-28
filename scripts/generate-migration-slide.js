/* eslint-disable */
// Generates a single executive PowerPoint slide:
// "Test Migration Progress: Testim.io -> Playwright"
const path = require('path');

function loadPptxGenJS() {
  try {
    return require('pptxgenjs');
  } catch (error) {
    if (error && error.code === 'MODULE_NOT_FOUND' && error.message.includes("'pptxgenjs'")) {
      throw new Error(
        'Missing dependency: "pptxgenjs". Install it before running scripts/generate-migration-slide.js.'
      );
    }

    throw error;
  }
}

const PptxGenJS = loadPptxGenJS();
const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_WIDE'; // 13.333 x 7.5 in
pptx.title = 'Test Migration Progress';

const COLORS = {
  bg: 'FFFFFF',
  ink: '1F2937',
  sub: '6B7280',
  accent: '2563EB',
  green: '10B981',
  greenSoft: 'D1FAE5',
  yellow: 'F59E0B',
  yellowSoft: 'FEF3C7',
  red: 'EF4444',
  gray: 'E5E7EB',
  graySoft: 'F3F4F6',
  border: 'E5E7EB',
};

const slide = pptx.addSlide();
slide.background = { color: COLORS.bg };

// Title
slide.addText('Test Migration Progress: Testim.io → Playwright', {
  x: 0.4, y: 0.25, w: 12.5, h: 0.55,
  fontSize: 28, bold: true, color: COLORS.ink, fontFace: 'Calibri',
});
slide.addText('Scope: OBT tests only', {
  x: 0.4, y: 0.78, w: 12.5, h: 0.3,
  fontSize: 12, color: COLORS.sub, fontFace: 'Calibri',
});

// Divider
slide.addShape(pptx.ShapeType.line, {
  x: 0.4, y: 1.15, w: 12.5, h: 0,
  line: { color: COLORS.border, width: 1 },
});

// === LEFT COLUMN: Next steps ===
// Replaced the "AI Agents accelerating migration" panel: with the migration at
// 100% the how-we-got-here story has served its purpose, and the question the
// slide now has to answer is what the team does next.
const LX = 0.4;
let ly = 1.35;

slide.addText('Next steps', {
  x: LX, y: ly, w: 4.2, h: 0.35,
  fontSize: 14, bold: true, color: COLORS.accent, fontFace: 'Calibri',
});
ly += 0.38;

// One paragraph per bullet. `bullet` opens a new paragraph and `breakLine`
// keeps the runs from collapsing onto a single line.
const nextSteps = [
  'Migrate the new tests created in Testim after the migration.',
  'Add manual tests that can now be automated.',
  'Unblock the blocked tests.',
  'Ongoing test maintenance.',
];

slide.addText(
  nextSteps.map((t) => ({
    text: t,
    options: { color: COLORS.ink, bullet: true, breakLine: true },
  })),
  { x: LX, y: ly, w: 4.2, h: 1.4, fontSize: 11, fontFace: 'Calibri', paraSpaceAfter: 4 }
);
ly += 1.5;

// Migration trend chart
slide.addText('Migration Progress per Sprint', {
  x: LX, y: ly, w: 4.2, h: 0.3,
  fontSize: 12, bold: true, color: COLORS.accent, fontFace: 'Calibri',
});
ly += 0.3;

slide.addChart(pptx.ChartType.line, [
  {
    name: 'Migration %',
    labels: ['9', '10', '11', '12', '13', '14', '15', '16', '17'],
    values: [45, 53, 63, 63, 68, 74, 86, 94, 100],
  },
], {
  x: LX, y: ly, w: 4.2, h: 2.2,
  showLegend: false,
  showValue: true,
  dataLabelPosition: 'above',
  dataLabelFontSize: 10,
  dataLabelColor: COLORS.ink,
  dataLabelFormatCode: '0"%"',
  catAxisLabelFontSize: 10,
  catAxisLabelColor: COLORS.ink,
  valAxisLabelFontSize: 9,
  valAxisLabelColor: COLORS.sub,
  valAxisMinVal: 0,
  valAxisMaxVal: 100,
  valAxisLabelFormatCode: '0"%"',
  lineDataSymbol: 'circle',
  lineDataSymbolSize: 8,
  chartColors: [COLORS.green],
  plotArea: { border: { color: COLORS.border, width: 1 }, fill: { color: 'FFFFFF' } },
});

// === CENTER COLUMN: KPI + Breakdown ===
const CX = 4.85;

// KPI card
slide.addShape(pptx.ShapeType.roundRect, {
  x: CX, y: 1.35, w: 3.7, h: 1.7,
  fill: { color: COLORS.greenSoft },
  line: { color: COLORS.green, width: 1 },
  rectRadius: 0.1,
});
slide.addText('Overall Migration', {
  x: CX, y: 1.42, w: 3.7, h: 0.3,
  fontSize: 12, bold: true, color: COLORS.ink, align: 'center', fontFace: 'Calibri',
});
slide.addText('100%', {
  x: CX, y: 1.7, w: 3.7, h: 0.95,
  fontSize: 64, bold: true, color: COLORS.green, align: 'center', fontFace: 'Calibri',
});
slide.addText('713 / 713 tests migrated', {
  x: CX, y: 2.65, w: 3.7, h: 0.35,
  fontSize: 13, color: COLORS.ink, align: 'center', fontFace: 'Calibri',
});
// Domain breakdown header
slide.addText('Domain Breakdown', {
  x: CX, y: 3.1, w: 3.7, h: 0.35,
  fontSize: 14, bold: true, color: COLORS.accent, fontFace: 'Calibri',
});

// Horizontal bars per domain. Every row partitions exactly:
//   total = (done - blocked) + blocked + still-to-do
// `blocked` is a SUBSET of `done`: the test was converted and lives in the repo,
// but cannot run (supplier error / known bug / awaiting review). It is drawn as
// an orange segment following the green one, and its count comes from the
// *_blocked folders under tests/features/<domain>.
// As of sprint 17 conversion is complete in ALL FOUR domains — Transportation
// closed its last 40-test backlog — so every total IS that domain's converted
// scope and the blocked slice is all that is outstanding. No domain sets
// `showRemainder` any more; the flag (and the grey track, grey number and grey
// legend swatch it drives) is kept because a future in-scope backlog would need
// it again, and the legend below only prints "Not migrated" when some domain
// actually has one.
const domains = [
  { name: 'Hotels',         total: 121, done: 121, blocked: 3,  pct: 100, showRemainder: false },
  { name: 'Flights',        total: 254, done: 254, blocked: 17, pct: 100, showRemainder: false },
  { name: 'Transportation', total: 148, done: 148, blocked: 11, pct: 100, showRemainder: false },
  { name: 'Shell',          total: 190, done: 190, blocked: 23, pct: 100, showRemainder: false },
];

const barX = CX;
const barY0 = 3.5;
const barW = 3.7;
const rowH = 0.52;
const trackH = 0.20;

domains.forEach((d, i) => {
  const ry = barY0 + i * rowH;
  // label
  slide.addText(d.name, {
    x: barX, y: ry, w: 1.4, h: 0.25,
    fontSize: 11, bold: true, color: COLORS.ink, fontFace: 'Calibri',
  });
  // numbers on top of the bar: total (black) / migrated & running (green) /
  // then one figure per outstanding segment this domain actually has, each
  // coloured to match its own bar segment — grey for a still-to-do backlog
  // (Transportation only) and amber for converted-but-blocked tests. A domain
  // can carry both, so the two are separate runs rather than one either/or
  // figure: Transportation shows its grey backlog followed by its amber blocked.
  const running = Math.max(0, d.done - d.blocked);
  const gap = { text: '  ', options: { color: COLORS.sub } };
  const numbers = [
    { text: String(d.total), options: { color: COLORS.ink, bold: true } },
    gap,
    { text: String(running), options: { color: COLORS.green, bold: true } },
  ];
  if (d.showRemainder) {
    numbers.push(gap, {
      text: String(d.total - d.done),
      options: { color: COLORS.sub, bold: true },
    });
  }
  if (d.blocked) {
    numbers.push(gap, {
      text: String(d.blocked),
      options: { color: COLORS.yellow, bold: true },
    });
  }
  slide.addText(
    numbers,
    {
      x: barX + 1.35, y: ry, w: 1.75, h: 0.25,
      fontSize: 10, fontFace: 'Calibri',
    }
  );
  // pct
  slide.addText(`${d.pct}%`, {
    x: barX + barW - 0.6, y: ry, w: 0.6, h: 0.25,
    fontSize: 11, bold: true, color: d.pct === 100 ? COLORS.green : COLORS.yellow,
    align: 'right', fontFace: 'Calibri',
  });
  // track (full scope = not-yet-migrated remainder), only where it is still material
  if (d.showRemainder) {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: barX, y: ry + 0.27, w: barW, h: trackH,
      fill: { color: COLORS.graySoft }, line: { color: COLORS.graySoft, width: 0 },
      rectRadius: 0.05,
    });
  }
  // green segment: done and running
  const runningW = (barW * Math.max(0, d.done - d.blocked)) / d.total;
  slide.addShape(pptx.ShapeType.roundRect, {
    x: barX, y: ry + 0.27, w: Math.max(0.05, runningW), h: trackH,
    fill: { color: COLORS.green }, line: { color: COLORS.green, width: 0 },
    rectRadius: 0.05,
  });
  // amber segment: converted but blocked
  if (d.blocked) {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: barX + runningW, y: ry + 0.27, w: (barW * d.blocked) / d.total, h: trackH,
      fill: { color: COLORS.yellow }, line: { color: COLORS.yellow, width: 0 },
      rectRadius: 0.05,
    });
  }
});

// Blocked tests note
const blockedY = barY0 + domains.length * rowH + 0.1;
const blockedTotal = domains.reduce((a, d) => a + d.blocked, 0);
slide.addText(`\uD83D\uDEA7 ${blockedTotal} tests blocked (supplier errors / known bugs / require review) \u2014 converted, but cannot run yet; shown in orange above`, {
  x: barX, y: blockedY, w: barW, h: 0.5,
  fontSize: 9, italic: true, color: COLORS.yellow, fontFace: 'Calibri',
});

// Legend
const legY = blockedY + 0.55;
// Each item advances by its OWN width — a single fixed pitch crowded the amber
// swatch right up against the long 'Done & running' label.
// 'Not migrated' is only listed while some domain still paints a grey track —
// with every domain at 100% there is no grey segment for it to explain.
const legendItems = [
  { label: 'Done & running', color: COLORS.green,  w: 1.50 },
  { label: 'Blocked',        color: COLORS.yellow, w: 0.95 },
];
if (domains.some((d) => d.showRemainder)) {
  legendItems.push({ label: 'Not migrated', color: COLORS.gray, w: 1.20 });
}
let legX = CX;
legendItems.forEach((it) => {
  slide.addShape(pptx.ShapeType.rect, {
    x: legX, y: legY + 0.05, w: 0.18, h: 0.18,
    fill: { color: it.color }, line: { color: it.color, width: 0 },
  });
  slide.addText(it.label, {
    x: legX + 0.22, y: legY, w: it.w - 0.28, h: 0.28,
    fontSize: 10, color: COLORS.sub, fontFace: 'Calibri',
  });
  legX += it.w;
});

// === RIGHT COLUMN: Daily Stability ===
const RX = 8.8;

slide.addShape(pptx.ShapeType.roundRect, {
  x: RX, y: 1.35, w: 4.15, h: 5.7,
  fill: { color: COLORS.graySoft },
  line: { color: COLORS.border, width: 1 },
  rectRadius: 0.1,
});

slide.addText('Daily Stability Run', {
  x: RX + 0.2, y: 1.45, w: 3.8, h: 0.35,
  fontSize: 14, bold: true, color: COLORS.accent, fontFace: 'Calibri',
});
slide.addText(
  'Mostly migrated tests, with new tests continuously being added to grow coverage. Passing rate depends on supplier availability, environment speed, and administration \u2014 reviewed regularly to stay reliable.',
  {
    x: RX + 0.2, y: 1.85, w: 3.8, h: 0.72,
    fontSize: 9, color: COLORS.sub, fontFace: 'Calibri',
  }
);

// Feature-file counts for every test_path in the nightly chain
// (suite-flights → suite-hotels → suite-shell → suite-transportation):
// Flights 23 suites, Hotels 2, Shell 28, Transportation 13 = 66 suites.
// One .feature file is one test, which is why these are FILE counts and not
// cucumber pickle counts — the handful of Scenario Outlines in the suites expand
// into several runs each, which would overstate the test count.
// Recount with: for each "test_path" in .github/workflows/suite-*.yml, count the
// *.feature files under it (the *_blocked folders sit outside those paths).
// Two traps when recounting: flights_general_non_booking appears TWICE in
// suite-flights.yml because it is sharded across two legs, so its 60 features
// must be counted once, not twice; and a test_path ending in "*.feature" is a
// non-recursive glob (that is how the rail suites keep their _blocked subfolder
// out), so do not recurse into it.
const comp = [
  { name: 'Flights', value: 300 },
  { name: 'Hotels',  value: 119 },
  { name: 'Transportation',    value: 154 },
  { name: 'Shell',   value: 199 },
];
const compTotal = comp.reduce((a, b) => a + b.value, 0);

// KPI tiles — the daily count is the composition sum so the two cannot drift.
// The duration is the CHAIN wall-clock, not one leg: the four suites run in
// sequence (flights → hotels → shell → transportation), so measure from the
// suite-flights start to the suite-transportation end. Recount with
// `gh run list --workflow suite-<domain>.yml --json createdAt,updatedAt` for all
// four and pair the runs by night. Over the 9 nights to 2026-08-28 the legs
// averaged ~104 / ~120 / ~36 / ~57 min for a ~5h17m chain (range 4h44m-6h45m),
// which is why this reads 5h and not the 4h carried since sprint 15.
const tiles = [
  { label: 'Tests running daily',   value: String(compTotal), color: COLORS.accent },
  { label: 'Avg passing rate',      value: '80%',             color: COLORS.green  },
  { label: 'Avg total duration',    value: '5h',              color: COLORS.ink    },
];
tiles.forEach((t, i) => {
  const ty = 2.55 + i * 0.72;
  slide.addShape(pptx.ShapeType.roundRect, {
    x: RX + 0.2, y: ty, w: 3.75, h: 0.68,
    fill: { color: 'FFFFFF' }, line: { color: COLORS.border, width: 1 },
    rectRadius: 0.08,
  });
  slide.addText(t.value, {
    x: RX + 0.3, y: ty + 0.05, w: 2.0, h: 0.58,
    fontSize: 22, bold: true, color: t.color, fontFace: 'Calibri', valign: 'middle',
  });
  slide.addText(t.label, {
    x: RX + 2.0, y: ty + 0.05, w: 1.85, h: 0.58,
    fontSize: 10, color: COLORS.sub, align: 'right', fontFace: 'Calibri', valign: 'middle',
  });
});

// Why the duration went up — a deliberate stability trade-off, not a regression.
slide.addText(
  [
    { text: '⏱  Why the run is taking longer. ', options: { bold: true, color: COLORS.ink } },
    {
      text: 'We now run 1-2 tests at a time instead of 4, so the full run needs '
        + 'more time to finish. Running more at once was making the tests '
        + 'unstable, so for now we prefer a slower run we can trust.',
      options: { color: COLORS.sub },
    },
  ],
  {
    x: RX + 0.2, y: 4.72, w: 3.75, h: 0.62,
    fontSize: 8, italic: true, fontFace: 'Calibri',
  }
);

// Composition
slide.addText('Composition', {
  x: RX + 0.2, y: 5.38, w: 3.8, h: 0.3,
  fontSize: 12, bold: true, color: COLORS.ink, fontFace: 'Calibri',
});

// The longest label ('Transportation') sets the label width, so the track has
// to shrink by the same amount to keep the row ending at the value column.
const COMP_TRACK_W = 1.9;

comp.forEach((c, i) => {
  const cy = 5.70 + i * 0.33;
  slide.addText(c.name, {
    x: RX + 0.2, y: cy, w: 1.25, h: 0.28,
    fontSize: 11, color: COLORS.ink, fontFace: 'Calibri',
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: RX + 1.45, y: cy + 0.05, w: COMP_TRACK_W, h: 0.18,
    fill: { color: COLORS.gray }, line: { color: COLORS.gray, width: 0 },
    rectRadius: 0.04,
  });
  const w = Math.max(0.05, (COMP_TRACK_W * c.value) / compTotal);
  slide.addShape(pptx.ShapeType.roundRect, {
    x: RX + 1.45, y: cy + 0.05, w, h: 0.18,
    fill: { color: COLORS.accent }, line: { color: COLORS.accent, width: 0 },
    rectRadius: 0.04,
  });
  slide.addText(String(c.value), {
    x: RX + 3.4, y: cy, w: 0.55, h: 0.28,
    fontSize: 11, bold: true, color: COLORS.ink, align: 'right', fontFace: 'Calibri',
  });
});

// Insight footer
slide.addText(
  'Goal: build confidence — validate stability, analyze results, expand coverage.',
  {
    x: 0.4, y: 7.05, w: 12.5, h: 0.35,
    fontSize: 11, italic: true, color: COLORS.sub, align: 'center', fontFace: 'Calibri',
  }
);

const outPath = path.resolve(__dirname, '..', 'docs', 'Test-Migration-Progress.pptx');
pptx.writeFile({ fileName: outPath }).then((f) => {
  console.log('Created:', f);
});
