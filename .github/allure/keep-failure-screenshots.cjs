// Drops image attachments from passed/skipped scenarios in an allure-results
// directory, so the single-file report (allurerc.mjs) inlines only the
// screenshots worth looking at. The After hook screenshots every scenario, and
// a full domain run otherwise inlines ~1000 of them (~150KB each) into one HTML
// file too heavy to open. Text attachments (TRIP_IDS, BOOKING_ERROR) are kept.
// Per-scenario PNGs stay available in the suites' screenshot artifacts.
//
// Usage: node keep-failure-screenshots.cjs <allure-results dir>
const fs = require("fs");
const path = require("path");

const dir = process.argv[2] || "allure-results";
const KEEP_STATUSES = new Set(["failed", "broken", "unknown"]);

const readJson = (file) => JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
const files = fs.readdirSync(dir);

// uuid -> status of every scenario result
const statusByUuid = new Map();
for (const file of files.filter((f) => f.endsWith("-result.json"))) {
  const result = readJson(file);
  statusByUuid.set(result.uuid, result.status);
}
const keepsScreenshots = (uuid) => KEEP_STATUSES.has(statusByUuid.get(uuid));

// Removes image attachments from a node and its nested steps; returns their sources.
const stripImages = (node) => {
  const removed = [];
  if (Array.isArray(node.attachments)) {
    node.attachments = node.attachments.filter((a) => {
      const isImage = String(a.type || "").startsWith("image/");
      if (isImage) removed.push(a.source);
      return !isImage;
    });
  }
  for (const step of node.steps || []) removed.push(...stripImages(step));
  return removed;
};

let strippedFiles = 0;
const removeSources = (sources) => {
  for (const source of sources) {
    const file = path.join(dir, source);
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      strippedFiles++;
    }
  }
};

// Scenario-level attachments (step screenshots, e.g. pfa_fare_rules).
for (const file of files.filter((f) => f.endsWith("-result.json"))) {
  const result = readJson(file);
  if (keepsScreenshots(result.uuid)) continue;
  const removed = stripImages(result);
  if (removed.length) {
    fs.writeFileSync(path.join(dir, file), JSON.stringify(result));
    removeSources(removed);
  }
}

// Hook-level attachments: the After hook screenshot lives in a container's afters.
for (const file of files.filter((f) => f.endsWith("-container.json"))) {
  const container = readJson(file);
  const children = container.children || [];
  if (children.length === 0 || children.some(keepsScreenshots)) continue;
  const removed = [...(container.befores || []), ...(container.afters || [])].flatMap(stripImages);
  if (removed.length) {
    fs.writeFileSync(path.join(dir, file), JSON.stringify(container));
    removeSources(removed);
  }
}

console.log(`keep-failure-screenshots: removed ${strippedFiles} screenshot(s) from passed/skipped scenarios`);
