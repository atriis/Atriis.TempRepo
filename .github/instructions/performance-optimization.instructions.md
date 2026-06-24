---
applyTo: '*'
description: 'Performance guidance for this Playwright + Cucumber E2E test suite: fast, stable, parallel test runs. Covers explicit waits, sharding/parallelization, selective runs by tag, flakiness reduction, and fast setup/teardown.'
---

# E2E Test Suite Performance Best Practices

Performance here means a test suite that runs fast, reliably, and gives quick feedback — not application runtime performance. The goal is short feedback loops in CI and locally without sacrificing stability. Measure suite duration and flake rate before optimizing.

---

## General Principles

- **Measure first:** Track total run time, per-scenario duration, and flake/retry rate. Optimize the slowest and flakiest scenarios first, not random ones.
- **Stability over raw speed:** A fast suite that flakes is worse than a slightly slower reliable one. Don't trade determinism for speed.
- **Keep scenarios independent and idempotent:** Each scenario must run in any order and in isolation so it can be parallelized and retried safely.
- **Set a budget:** Define an acceptable wall-clock target for the suite (and key jobs) and watch for regressions over time.

---

## Avoid Hardcoded Sleeps — Use Explicit Waits

- **Never use fixed `waitForTimeout`/sleep** to "wait for the page." Hard sleeps either waste time (too long) or flake (too short).
- **Wait for a condition instead.** Prefer, in order:
  1. `locator.waitFor({ state })` / web-first assertions (auto-wait) for a specific element or state.
  2. `page.waitForResponse` / `waitForRequest` when the trigger is a known network call.
  3. `page.waitForLoadState('networkidle')` only when no more specific signal exists.
- **Use Playwright's auto-waiting.** Actions (`click`, `fill`) and `expect(locator)` assertions already retry until ready — extra waits are usually redundant.
- **Always set an explicit timeout** on `waitFor` calls so a genuinely stuck test fails fast instead of hanging to the global limit.

---

## Parallelization and Sharding

- **Run scenarios in parallel** (Cucumber `--parallel N`) once scenarios are independent. Match worker count to available CPU cores; more workers than cores rarely helps.
- **Shard across CI jobs.** Split the suite into matrix jobs (e.g. by domain or feature group) so they run concurrently and finish sooner.
- **Avoid shared mutable state** between workers (same test user, same booking, shared files). Contention reintroduces flakiness and forces serialization.
- **Balance shards** so no single job dominates wall-clock time; rebalance when one job grows much slower than the rest.

---

## Selective Test Runs

- **Run by tag** (`--tags '@smoke'`, `@regression`, `@priority:critical`) so local and PR runs execute only the relevant subset instead of the whole suite.
- **Use a fast smoke set** for quick feedback; reserve the full regression run for scheduled/nightly jobs.
- **Filter by path/feature** when iterating on one area — don't run everything to validate a single scenario.

---

## Reducing Flakiness

- **Fix flakes, don't just retry them.** Retries (`--retry`) are a CI safety net, not a substitute for a deterministic test. A scenario that needs retries hides a real wait or isolation problem.
- **Wait on state, not time** (see explicit waits above) — timing assumptions are the most common flake source.
- **Use stable, unique locators** (`data-testid` / role-based) so UI changes and dynamic content don't cause intermittent failures.
- **Reset state between scenarios** (fresh context/storage, clean test data) so order and leftover data can't affect outcomes.
- **Quarantine known-flaky scenarios** with a tag so they don't block the suite while being fixed.

---

## Fast Setup and Teardown

- **Skip the UI for setup where possible.** Use API/request calls or seeded data for preconditions; only drive the UI for what is actually under test.
- **Reuse expensive setup.** Reuse authenticated storage state instead of logging in through the UI in every scenario.
- **Use fresh browser contexts, not fresh browsers,** for isolation — contexts are cheap, browser launches are not.
- **Always clean up,** but cheaply: release contexts/pages promptly and ensure created bookings/resources are torn down (also avoids cost and state leakage).
- **Reduce artifact overhead:** capture traces, video, and screenshots on failure/retry only — full capture on every run slows the suite and bloats storage.

---

## CI Checklist

- [ ] No hardcoded sleeps; all waits are condition-based with explicit timeouts.
- [ ] Scenarios are independent and safe to run in parallel and in any order.
- [ ] Suite is sharded/parallelized and shards are reasonably balanced.
- [ ] Smoke/critical tags give a fast feedback path separate from full regression.
- [ ] Setup uses API/seeded data and reused auth state where possible.
- [ ] Traces/video/screenshots captured on failure only.
- [ ] Flaky scenarios are tracked and being fixed, not masked by retries.
