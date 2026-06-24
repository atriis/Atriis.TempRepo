#!/usr/bin/env node
/*
 * Deterministically split a folder's .feature files into N shards, printing the
 * files for one shard (one path per line, for `readarray` in the workflow).
 *
 * This decouples CI sharding from test content: a suite is split purely by
 * file index, never by tags or paths inside the tests. Authors don't think
 * about pipeline balance, and retagging/renaming a scenario can't unbalance or
 * drop a shard. Assignment is round-robin (index % shards), so the shards stay
 * balanced and a newly added file is automatically placed in exactly one shard.
 *
 * Usage:  node list-shard.js <testPath> <shard> <shards>
 *   shard  = 1-based index of this shard
 *   shards = total number of shards
 *
 * Exits non-zero (and prints nothing to stdout) on bad input or if no files
 * match, so the workflow fails fast instead of silently running everything.
 */

const fs = require('fs');
const path = require('path');

function fail(msg) {
  process.stderr.write(`list-shard: ${msg}\n`);
  process.exit(1);
}

const [testPath, shardRaw, shardsRaw] = process.argv.slice(2);
const shard = Number(shardRaw);
const shards = Number(shardsRaw);

if (!testPath) fail('missing <testPath>');
if (!Number.isInteger(shards) || shards < 1) fail(`<shards> must be a positive integer, got: ${shardsRaw}`);
if (!Number.isInteger(shard) || shard < 1 || shard > shards) fail(`<shard> must be between 1 and ${shards}, got: ${shardRaw}`);
if (!fs.existsSync(testPath)) fail(`path does not exist: ${testPath}`);

function findFeatures(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findFeatures(full));
    else if (entry.isFile() && entry.name.endsWith('.feature')) out.push(full);
  }
  return out;
}

// Sort for a stable, reproducible assignment across runs.
const all = findFeatures(testPath).sort();
if (all.length === 0) fail(`no .feature files found under: ${testPath}`);

// Round-robin: file i goes to shard (i % shards). 1-based shard -> 0-based slot.
const selected = all.filter((_, i) => i % shards === shard - 1);
if (selected.length === 0) fail(`shard ${shard}/${shards} selected 0 of ${all.length} files (too many shards for too few files?)`);

process.stdout.write(selected.join('\n') + '\n');
