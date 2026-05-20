#!/usr/bin/env node
/**
 * Merges Cucumber JSON and JUnit XML reports from a rerun back into the initial
 * report so the final outcome reflects rerun results.
 *
 * For every scenario present in the rerun report, the scenario in the initial
 * report (matched by feature URI + scenario line for JSON, and by
 * classname + name for JUnit) is replaced with the rerun version.
 *
 * Usage:
 *   node scripts/merge-rerun-results.js \
 *     --initial-json test-results/cucumber-report-initial.json \
 *     --rerun-json   test-results/cucumber-report.json \
 *     --out-json     test-results/cucumber-report.json \
 *     --initial-xml  test-results/cucumber-junit-initial.xml \
 *     --rerun-xml    test-results/cucumber-junit.xml \
 *     --out-xml      test-results/cucumber-junit.xml
 */

const fs = require('fs');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, '');
    args[key] = argv[i + 1];
  }
  return args;
}

function readJsonSafe(file) {
  if (!file || !fs.existsSync(file)) return null;
  const txt = fs.readFileSync(file, 'utf8').trim();
  if (!txt) return null;
  return JSON.parse(txt);
}

function mergeJson(initial, rerun) {
  if (!Array.isArray(initial)) return rerun;
  if (!Array.isArray(rerun)) return initial;

  const rerunByUri = new Map();
  for (const feature of rerun) {
    if (!feature || !feature.uri) continue;
    rerunByUri.set(feature.uri, feature);
  }

  const merged = initial.map((feature) => {
    if (!feature || !feature.uri) return feature;
    const rerunFeature = rerunByUri.get(feature.uri);
    if (!rerunFeature || !Array.isArray(rerunFeature.elements)) return feature;

    const rerunScenariosByLine = new Map();
    for (const el of rerunFeature.elements) {
      if (el && (el.type === 'scenario' || el.keyword === 'Scenario' || el.keyword === 'Scenario Outline')) {
        rerunScenariosByLine.set(el.line, el);
      }
    }

    const mergedElements = (feature.elements || []).map((el) => {
      if (!el) return el;
      if (el.type === 'scenario' || el.keyword === 'Scenario' || el.keyword === 'Scenario Outline') {
        const replacement = rerunScenariosByLine.get(el.line);
        if (replacement) return replacement;
      }
      return el;
    });

    return { ...feature, elements: mergedElements };
  });

  return merged;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractAttr(attrString, name) {
  const re = new RegExp(name + '\\s*=\\s*"([^"]*)"');
  const m = attrString.match(re);
  return m ? m[1] : null;
}

function parseTestcases(xml) {
  const testcases = new Map();
  const tcRegex = /<testcase\s+([^>]*?)(\/>|>([\s\S]*?)<\/testcase>)/g;
  let match;
  while ((match = tcRegex.exec(xml)) !== null) {
    const attrs = match[1];
    const classname = extractAttr(attrs, 'classname');
    const name = extractAttr(attrs, 'name');
    if (classname == null || name == null) continue;
    const key = classname + '||' + name;
    testcases.set(key, { full: match[0], attrs, body: match[3] || '' });
  }
  return testcases;
}

function classifyTestcase(body) {
  if (!body) return 'passed';
  if (/<failure\b/.test(body)) return 'failed';
  if (/<error\b/.test(body)) return 'error';
  if (/<skipped\b/.test(body)) return 'skipped';
  return 'passed';
}

function getTime(attrs) {
  const t = extractAttr(attrs, 'time');
  const n = t ? parseFloat(t) : 0;
  return Number.isFinite(n) ? n : 0;
}

function mergeJUnit(initialXml, rerunXml) {
  if (!initialXml) return rerunXml || '';
  if (!rerunXml) return initialXml;

  const rerunCases = parseTestcases(rerunXml);
  let mergedXml = initialXml;

  const tcRegex = /<testcase\s+([^>]*?)(\/>|>([\s\S]*?)<\/testcase>)/g;
  const replacements = [];
  let match;
  while ((match = tcRegex.exec(initialXml)) !== null) {
    const attrs = match[1];
    const classname = extractAttr(attrs, 'classname');
    const name = extractAttr(attrs, 'name');
    if (classname == null || name == null) continue;
    const key = classname + '||' + name;
    const rerunCase = rerunCases.get(key);
    if (rerunCase) {
      replacements.push({ original: match[0], replacement: rerunCase.full });
    }
  }

  for (const { original, replacement } of replacements) {
    mergedXml = mergedXml.replace(original, () => replacement);
  }

  // Recompute testsuite-level counters based on merged testcases.
  mergedXml = mergedXml.replace(/<testsuite\s+([^>]+)>([\s\S]*?)<\/testsuite>/g, (full, attrs, body) => {
    let tests = 0;
    let failures = 0;
    let errors = 0;
    let skipped = 0;
    let time = 0;
    const tcRe = /<testcase\s+([^>]*?)(\/>|>([\s\S]*?)<\/testcase>)/g;
    let tcMatch;
    while ((tcMatch = tcRe.exec(body)) !== null) {
      tests += 1;
      const tcAttrs = tcMatch[1];
      const tcBody = tcMatch[3] || '';
      time += getTime(tcAttrs);
      const status = classifyTestcase(tcBody);
      if (status === 'failed') failures += 1;
      else if (status === 'error') errors += 1;
      else if (status === 'skipped') skipped += 1;
    }

    const newAttrs = attrs
      .replace(/\btests\s*=\s*"[^"]*"/, `tests="${tests}"`)
      .replace(/\bfailures\s*=\s*"[^"]*"/, `failures="${failures}"`)
      .replace(/\berrors\s*=\s*"[^"]*"/, `errors="${errors}"`)
      .replace(/\bskipped\s*=\s*"[^"]*"/, `skipped="${skipped}"`)
      .replace(/\btime\s*=\s*"[^"]*"/, `time="${time.toFixed(3)}"`);

    return `<testsuite ${newAttrs}>${body}</testsuite>`;
  });

  return mergedXml;
}

function main() {
  const args = parseArgs(process.argv);

  if (args['initial-json'] && args['rerun-json'] && args['out-json']) {
    const initial = readJsonSafe(args['initial-json']);
    const rerun = readJsonSafe(args['rerun-json']);
    if (initial && rerun) {
      const merged = mergeJson(initial, rerun);
      fs.writeFileSync(args['out-json'], JSON.stringify(merged, null, 2));
      console.log(`Merged JSON written to ${args['out-json']}`);
    } else if (initial) {
      fs.writeFileSync(args['out-json'], JSON.stringify(initial, null, 2));
      console.log(`No rerun JSON found; kept initial at ${args['out-json']}`);
    } else {
      console.log('No initial JSON found; nothing to merge.');
    }
  }

  if (args['initial-xml'] && args['rerun-xml'] && args['out-xml']) {
    const initialXml = fs.existsSync(args['initial-xml']) ? fs.readFileSync(args['initial-xml'], 'utf8') : null;
    const rerunXml = fs.existsSync(args['rerun-xml']) ? fs.readFileSync(args['rerun-xml'], 'utf8') : null;
    if (initialXml && rerunXml) {
      const merged = mergeJUnit(initialXml, rerunXml);
      fs.writeFileSync(args['out-xml'], merged);
      console.log(`Merged JUnit written to ${args['out-xml']}`);
    } else if (initialXml) {
      fs.writeFileSync(args['out-xml'], initialXml);
      console.log(`No rerun XML found; kept initial at ${args['out-xml']}`);
    } else {
      console.log('No initial XML found; nothing to merge.');
    }
  }
}

main();
