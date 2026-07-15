/**
 * Windows module-cache dedupe — must load before any support file requires
 * '@cucumber/cucumber' (it is the first entry in cucumber.js `require[]`).
 *
 * WHY THIS EXISTS
 * ---------------
 * Cucumber's CLI resolves '@cucumber/cucumber' through Node's own loader, which
 * yields the canonical on-disk path (uppercase Windows drive letter, e.g.
 * `C:\DEV\...`). Support files, however, are loaded from glob paths that inherit
 * the drive-letter case of `process.cwd()` — and on Windows `fs.realpath` leaves
 * the drive letter exactly as typed. So if a shell's cwd is `c:\DEV\...`
 * (lowercase), a support file's `require('@cucumber/cucumber')` resolves to
 * `c:\DEV\...\node_modules\@cucumber\cucumber\lib\index.js`.
 *
 * Node keys its CommonJS module cache by the raw resolved string, and treats
 * `C:\...` and `c:\...` as DIFFERENT keys even though the filesystem is
 * case-insensitive and they are the same file. Result: two independent copies of
 * cucumber's support-code builder singleton. The CLI's copy is BUILDING; the
 * support copy is PENDING, so hooks.js's `setDefaultTimeout(...)` throws:
 *   "You're calling functions ... on an instance of Cucumber that isn't running
 *    (status: PENDING)."
 * It is intermittent purely because whether cwd is upper/lower-cased depends on
 * how the run was launched (VS Code terminal, PowerShell `cd c:\...`, a cold
 * fs.realpath cache, etc.).
 *
 * THE FIX
 * -------
 * Make the CJS module cache case-insensitive on Windows, which is what a
 * case-insensitive filesystem should have to begin with. We wrap
 * `Module._resolveFilename`: if a cache entry already exists for the same path
 * under different casing, return that existing key so the require reuses the one
 * instance the CLI already loaded. Seeding from the current cache is what lets a
 * support-side require collapse onto the CLI's already-loaded copy.
 *
 * No-op off Windows (CI runs on Linux, a case-sensitive FS — nothing to dedupe),
 * and idempotent if somehow required twice.
 */
"use strict";

if (process.platform === "win32" && !global.__winModuleCacheDedupeInstalled) {
  global.__winModuleCacheDedupeInstalled = true;

  const Module = require("module");
  const originalResolveFilename = Module._resolveFilename;

  // lowercased resolved path -> the actual cache key already in use for it.
  const canonicalByLowerCase = new Map();
  for (const key of Object.keys(require.cache)) {
    canonicalByLowerCase.set(key.toLowerCase(), key);
  }

  Module._resolveFilename = function (request, parent, isMain, options) {
    const resolved = originalResolveFilename.call(
      this,
      request,
      parent,
      isMain,
      options
    );
    const lower = resolved.toLowerCase();
    const existing = canonicalByLowerCase.get(lower);
    if (existing && require.cache[existing]) {
      return existing; // reuse the already-cached instance (case-only difference)
    }
    canonicalByLowerCase.set(lower, resolved);
    return resolved;
  };
}
