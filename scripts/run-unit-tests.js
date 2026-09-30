#!/usr/bin/env node
/**
 * Runs tests/unit/*.test.js with the built-in test runner. `node --test <glob>` only works on
 * Node >= 21 and `node --test <dir>` fails on Node 24, so the file list is built here instead.
 */
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const dir = path.join(__dirname, "..", "tests", "unit");
const files = fs
  .readdirSync(dir)
  .filter((name) => name.endsWith(".test.js"))
  .sort()
  .map((name) => path.join(dir, name));

const result = spawnSync(process.execPath, ["--test", ...files], { stdio: "inherit" });
process.exit(result.status === null ? 1 : result.status);
