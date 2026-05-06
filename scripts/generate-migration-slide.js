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
slide.addText('Scope: OBT tests only  •  Executive snapshot', {
  x: 0.4, y: 0.78, w: 12.5, h: 0.3,
  fontSize: 12, color: COLORS.sub, fontFace: 'Calibri',
});

// Divider
slide.addShape(pptx.ShapeType.line, {
  x: 0.4, y: 1.15, w: 12.5, h: 0,
  line: { color: COLORS.border, width: 1 },
});

// === LEFT COLUMN: Why + Agents ===
const LX = 0.4;
let ly = 1.35;

slide.addText('Why Playwright', {
  x: LX, y: ly, w: 4.2, h: 0.35,
  fontSize: 14, bold: true, color: COLORS.accent, fontFace: 'Calibri',
});
ly += 0.38;

const whyItems = [
  'Full control over selectors & waits',
  'Deterministic behavior',
  'Better debugging (logs, traces, screenshots)',
  'Clean architecture (DSL + POM)',
  'Strong CI/CD + Git workflows',
];
slide.addText(
  whyItems.map(t => ({ text: t, options: { bullet: { code: '25A0' }, color: COLORS.ink } })),
  { x: LX, y: ly, w: 4.2, h: 1.6, fontSize: 11, fontFace: 'Calibri', paraSpaceAfter: 4 }
);
ly += 1.7;

slide.addText('AI Agents accelerating migration', {
  x: LX, y: ly, w: 4.2, h: 0.35,
  fontSize: 14, bold: true, color: COLORS.accent, fontFace: 'Calibri',
});
ly += 0.38;

slide.addText(
  [
    { text: 'Foundation: ', options: { bold: true, color: COLORS.ink } },
    { text: 'mapped all OBT pages & main UI elements.\n', options: { color: COLORS.ink } },
    { text: 'Agent 1: ', options: { bold: true, color: COLORS.ink } },
    { text: 'converts Testim → Playwright.\n', options: { color: COLORS.ink } },
    { text: 'Agent 2: ', options: { bold: true, color: COLORS.ink } },
    { text: 'adapts output to our project format.\n', options: { color: COLORS.ink } },
    { text: 'Agent 3: ', options: { bold: true, color: COLORS.ink } },
    { text: 'implements step definitions.', options: { color: COLORS.ink } },
  ],
  { x: LX, y: ly, w: 4.2, h: 1.6, fontSize: 11, fontFace: 'Calibri', paraSpaceAfter: 3 }
);

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
slide.addText('40%', {
  x: CX, y: 1.7, w: 3.7, h: 0.95,
  fontSize: 64, bold: true, color: COLORS.green, align: 'center', fontFace: 'Calibri',
});
slide.addText('296 / 740 tests migrated', {
  x: CX, y: 2.65, w: 3.7, h: 0.35,
  fontSize: 13, color: COLORS.ink, align: 'center', fontFace: 'Calibri',
});

// Domain breakdown header
slide.addText('Domain Breakdown', {
  x: CX, y: 3.2, w: 3.7, h: 0.35,
  fontSize: 14, bold: true, color: COLORS.accent, fontFace: 'Calibri',
});

// Horizontal bars per domain
const domains = [
  { name: 'Hotels',         total: 119, done: 119, pct: 100, color: COLORS.green  },
  { name: 'Flights',        total: 255, done: 166, pct: 65,  color: COLORS.green  },
  { name: 'Transportation', total: 148, done: 9,   pct: 6,   color: COLORS.yellow },
  { name: 'Shell',          total: 218, done: 2,   pct: 1,   color: COLORS.gray   },
];

const barX = CX;
const barY0 = 3.6;
const barW = 3.7;
const rowH = 0.55;
const trackH = 0.22;

domains.forEach((d, i) => {
  const ry = barY0 + i * rowH;
  // label
  slide.addText(d.name, {
    x: barX, y: ry, w: 1.4, h: 0.25,
    fontSize: 11, bold: true, color: COLORS.ink, fontFace: 'Calibri',
  });
  // count
  slide.addText(`${d.done}/${d.total}`, {
    x: barX + 1.4, y: ry, w: 1.0, h: 0.25,
    fontSize: 10, color: COLORS.sub, fontFace: 'Calibri',
  });
  // pct
  slide.addText(`${d.pct}%`, {
    x: barX + barW - 0.6, y: ry, w: 0.6, h: 0.25,
    fontSize: 11, bold: true, color: d.color, align: 'right', fontFace: 'Calibri',
  });
  // track
  slide.addShape(pptx.ShapeType.roundRect, {
    x: barX, y: ry + 0.27, w: barW, h: trackH,
    fill: { color: COLORS.graySoft }, line: { color: COLORS.graySoft, width: 0 },
    rectRadius: 0.05,
  });
  // fill
  const fillW = Math.max(0.05, (barW * d.pct) / 100);
  slide.addShape(pptx.ShapeType.roundRect, {
    x: barX, y: ry + 0.27, w: fillW, h: trackH,
    fill: { color: d.color }, line: { color: d.color, width: 0 },
    rectRadius: 0.05,
  });
});

// Legend
const legY = barY0 + domains.length * rowH + 0.05;
const legendItems = [
  { label: 'Completed', color: COLORS.green },
  { label: 'In progress', color: COLORS.yellow },
  { label: 'Not started', color: COLORS.gray },
];
let legX = CX;
legendItems.forEach((it) => {
  slide.addShape(pptx.ShapeType.rect, {
    x: legX, y: legY + 0.05, w: 0.18, h: 0.18,
    fill: { color: it.color }, line: { color: it.color, width: 0 },
  });
  slide.addText(it.label, {
    x: legX + 0.22, y: legY, w: 1.1, h: 0.28,
    fontSize: 10, color: COLORS.sub, fontFace: 'Calibri',
  });
  legX += 1.25;
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
slide.addText('Mostly non-booking flows • Growing daily', {
  x: RX + 0.2, y: 1.78, w: 3.8, h: 0.3,
  fontSize: 10, italic: true, color: COLORS.sub, fontFace: 'Calibri',
});

// KPI tiles
const tiles = [
  { label: 'Tests running daily',   value: '189',         color: COLORS.accent },
  { label: 'Avg passing rate',      value: '86.52%',      color: COLORS.green  },
  { label: 'Avg total duration',    value: '26 min',      color: COLORS.ink    },
];
tiles.forEach((t, i) => {
  const ty = 2.2 + i * 0.85;
  slide.addShape(pptx.ShapeType.roundRect, {
    x: RX + 0.2, y: ty, w: 3.75, h: 0.75,
    fill: { color: 'FFFFFF' }, line: { color: COLORS.border, width: 1 },
    rectRadius: 0.08,
  });
  slide.addText(t.value, {
    x: RX + 0.3, y: ty + 0.05, w: 2.0, h: 0.65,
    fontSize: 22, bold: true, color: t.color, fontFace: 'Calibri', valign: 'middle',
  });
  slide.addText(t.label, {
    x: RX + 2.0, y: ty + 0.05, w: 1.85, h: 0.65,
    fontSize: 10, color: COLORS.sub, align: 'right', fontFace: 'Calibri', valign: 'middle',
  });
});

// Composition
slide.addText('Composition', {
  x: RX + 0.2, y: 4.85, w: 3.8, h: 0.3,
  fontSize: 12, bold: true, color: COLORS.ink, fontFace: 'Calibri',
});

const comp = [
  { name: 'Flights', value: 101 },
  { name: 'Hotels',  value: 77  },
  { name: 'Cars',    value: 9   },
  { name: 'Rails',   value: 2   },
];
const compTotal = comp.reduce((a, b) => a + b.value, 0);
comp.forEach((c, i) => {
  const cy = 5.2 + i * 0.38;
  slide.addText(c.name, {
    x: RX + 0.2, y: cy, w: 1.0, h: 0.28,
    fontSize: 11, color: COLORS.ink, fontFace: 'Calibri',
  });
  slide.addShape(pptx.ShapeType.roundRect, {
    x: RX + 1.15, y: cy + 0.05, w: 2.2, h: 0.18,
    fill: { color: COLORS.gray }, line: { color: COLORS.gray, width: 0 },
    rectRadius: 0.04,
  });
  const w = Math.max(0.05, (2.2 * c.value) / compTotal);
  slide.addShape(pptx.ShapeType.roundRect, {
    x: RX + 1.15, y: cy + 0.05, w, h: 0.18,
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
