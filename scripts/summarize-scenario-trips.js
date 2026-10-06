#!/usr/bin/env node
/**
 * Write one row per scenario of this job's cucumber run — status, scenario, location, the
 * trip number(s) it touched and, for a failed scenario, its error — to the GitHub job summary,
 * so every run and rerun job shows its trip numbers for passed and failed tests alike, and why
 * the failed ones failed, without waiting for the domain report.
 *
 * Run it AFTER cucumber-js (and the deferred payload verifier, which can turn a passed scenario
 * into a failed one) has exited — the JSON report is only written at the very end.
 *
 * Trip numbers come from the 'TRIP_IDS:' text attachment the After hook adds
 * (tests/support/hooks.js); a scenario that never reached a trip shows '—'.
 *
 * Env:
 *   GITHUB_STEP_SUMMARY  - file to append to (stdout when unset, for a local run)
 *   SUMMARY_TITLE        - heading of the table (default "Scenarios")
 *   CUCUMBER_REPORT      - report to read (default test-results/cucumber-report.json)
 *
 * Always exits 0: a missing or unreadable report is noted in the summary, never fails the job.
 */

const fs = require("fs");

const REPORT = process.env.CUCUMBER_REPORT || "test-results/cucumber-report.json";
const TITLE = process.env.SUMMARY_TITLE || "Scenarios";

// pending/undefined/ambiguous fail the cucumber run in strict mode — same split as the domain report.
const FAIL_STATUSES = new Set(["failed", "ambiguous", "pending", "undefined"]);
const ICON = { passed: "✅", failed: "❌", skipped: "⏭️" };
const ORDER = { failed: 0, skipped: 1, passed: 2 };

// Markdown-table-safe cell text: pipes/angle brackets swapped so a scenario name can never break the table.
const esc = (t) =>
  String(t == null ? "" : t)
    .slice(0, 220)
    .split("\n").join(" ")
    .split("|").join("¦")
    .split("<").join("&lt;")
    .split(">").join("&gt;");

// Text attachments come through raw in some cucumber versions and base64-encoded in others; try both.
const embeddedText = (emb, marker) => {
  if (!emb || !emb.data) return "";
  const mt = emb.mime_type || emb.media_type || "";
  if (mt && mt.indexOf("text") === -1 && mt.indexOf("json") === -1) return "";
  let text = String(emb.data);
  if (text.indexOf(marker) === -1) {
    try {
      text = Buffer.from(emb.data, "base64").toString("utf8");
    } catch {
      // not base64
    }
  }
  return text.indexOf(marker) === -1 ? "" : text;
};

const tripIdsOf = (el) => {
  const ids = new Set();
  for (const step of el.steps || []) {
    for (const emb of step.embeddings || []) {
      const m = embeddedText(emb, "TRIP_IDS:").match(/TRIP_IDS:([0-9,\s]+)/);
      if (m) m[1].split(",").map((s) => s.trim()).filter(Boolean).forEach((id) => ids.add(id));
    }
  }
  return [...ids].join(", ");
};

// A scenario stopped by a known supplier booking error ends 'pending' with no error message;
// the step attaches the supplier's own words as a 'BOOKING_ERROR:' text embedding.
const bookingErrorOf = (el) => {
  for (const step of el.steps || []) {
    for (const emb of step.embeddings || []) {
      const m = embeddedText(emb, "BOOKING_ERROR:").match(/BOOKING_ERROR:([\s\S]+)/);
      if (m) return m[1].split("\n")[0].trim();
    }
  }
  return "";
};

const failedStepOf = (el) => (el.steps || []).find((s) => s.result && FAIL_STATUSES.has(s.result.status));

const statusOf = (el) => {
  const steps = el.steps || [];
  if (failedStepOf(el)) return "failed";
  if (steps.every((s) => !s.result || s.result.status === "skipped")) return "skipped";
  return "passed";
};

// First line of the failing step's error, else the supplier booking error, else the step it
// stopped on — same read as the suite and rerun domain reports.
const errorOf = (el) => {
  const bad = failedStepOf(el);
  if (!bad) return "";
  return (
    (bad.result.error_message || "").split("\n")[0] ||
    bookingErrorOf(el) ||
    `${bad.result.status} step: ${`${bad.keyword || ""}${bad.name || ""}`.trim()}`
  );
};

const out = ["", `### ${TITLE}`, ""];

let features = null;
if (!fs.existsSync(REPORT)) {
  out.push(`> No cucumber report at \`${REPORT}\` — the run did not finish writing it (timeout or crash).`);
} else {
  try {
    const data = JSON.parse(fs.readFileSync(REPORT, "utf8"));
    features = Array.isArray(data) ? data : [data];
  } catch (error) {
    out.push(`> Cucumber report could not be read: ${esc(error.message)}`);
  }
}

if (features) {
  const rows = [];
  for (const feature of features) {
    const uri = String(feature.uri || "").replace(/\\/g, "/");
    for (const el of feature.elements || []) {
      if (el.type !== "scenario") continue;
      rows.push({ status: statusOf(el), name: el.name || "", loc: `${uri}:${el.line || ""}`, trips: tripIdsOf(el), err: errorOf(el) });
    }
  }
  rows.sort((a, b) => ORDER[a.status] - ORDER[b.status] || a.loc.localeCompare(b.loc));

  const count = (st) => rows.filter((r) => r.status === st).length;
  out.push(`${rows.length} scenario(s): ✅ ${count("passed")} passed · ❌ ${count("failed")} failed · ⏭️ ${count("skipped")} skipped`, "");
  if (rows.length > 0) {
    out.push("| | Scenario | Location | Trip # | Error |");
    out.push("|---|----------|----------|--------|-------|");
    for (const r of rows) {
      out.push(`| ${ICON[r.status]} | ${esc(r.name)} | ${esc(r.loc)} | ${esc(r.trips || "—")} | ${r.status === "failed" ? esc(r.err) : "—"} |`);
    }
  }
}

const text = out.join("\n") + "\n";
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, text);
else process.stdout.write(text);
