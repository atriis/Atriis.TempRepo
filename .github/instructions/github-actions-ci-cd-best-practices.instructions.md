---
applyTo: '.github/workflows/*.yml,.github/workflows/*.yaml'
description: 'Reusable GitHub Actions best practices (security, caching, concurrency, matrix hygiene) for this Playwright + Cucumber test repo. Project CI specifics live in .github/CLAUDE.md.'
---

# GitHub Actions Best Practices

> **Project CI specifics (matrix jobs, schedule, retry, artifacts) live in [`.github/CLAUDE.md`](../CLAUDE.md) under "CI/CD".** This file only covers reusable, generic best practices for editing `.github/workflows/`. This repo has a single workflow (`test-suite.yml`); there is no build/deploy/release pipeline, so this guide omits deployment, image-signing, and release material.

## 1. Least-Privilege `permissions:`

The default `GITHUB_TOKEN` is broad. Always declare an explicit, minimal `permissions:` block — at the workflow level for a secure default, overridden per job only where a job needs more.

- Start from `contents: read`. Add a write scope only when a step actually mutates that resource.
- A test-only workflow usually needs nothing more than `contents: read`. Add `checks: write` / `pull-requests: write` only if you publish test results back to the PR.

```yaml
permissions:
  contents: read          # secure default for the whole workflow

jobs:
  publish-report:
    permissions:
      contents: read
      checks: write        # only this job posts a check run
```

## 2. Pin Actions to a Commit SHA

Tags (`@v4`) and branches (`@main`, `@latest`) are **mutable** — a compromised or moved tag silently executes arbitrary code in your runner (supply-chain attack). A full-length commit SHA is immutable.

- Pin every `uses:` to a full SHA, with the human-readable version as a trailing comment.
- This matters most for third-party actions, where you don't control the tag.
- Let Dependabot (`.github/dependabot.yml`, `package-ecosystem: "github-actions"`) propose SHA bumps so pinning doesn't mean going stale.

```yaml
- uses: actions/checkout@08c6903cd8c0fde910a37f88322edcfb5dd907a8 # v5.0.0
- uses: actions/setup-node@a0853c24544627f65ddf259abe73b1d18a591444 # v5.0.0
```

## 3. Secrets Handling

- Sensitive values come **only** from the `secrets` context (`${{ secrets.MY_SECRET }}`) — never hardcoded, never echoed to logs (masking is a safety net, not a license to print).
- Pass a secret into a step via `env:` at the narrowest scope that needs it; don't expose it workflow-wide.
- Don't construct secrets dynamically or interpolate them into `run:` strings where they could leak into logs.
- For login/test credentials this repo reads them as workflow secrets injected into the test process's environment (e.g. `GENERAL_PASSWORD`) — see CLAUDE.md for the project's env conventions.

```yaml
- name: Run tests
  env:
    GENERAL_PASSWORD: ${{ secrets.GENERAL_PASSWORD }}
  run: npm test
```

## 4. Dependency Caching

Cache package-manager downloads so runs don't re-fetch unchanged dependencies. For Node, `actions/setup-node` has built-in npm caching — prefer it over a hand-rolled `actions/cache`.

```yaml
- uses: actions/setup-node@a0853c24544627f65ddf259abe73b1d18a591444 # v5.0.0
  with:
    node-version: 20
    cache: 'npm'           # caches the npm download cache keyed on package-lock.json
- run: npm ci              # deterministic install from the lockfile
```

If you need a manual cache (e.g. Playwright browser binaries), key it on the relevant lockfile and provide `restore-keys` for graceful fallback:

```yaml
- uses: actions/cache@0057852bfaa89a56745cba8c7296529d2fc39830 # v4.3.0
  with:
    path: ~/.cache/ms-playwright
    key: ${{ runner.os }}-playwright-${{ hashFiles('**/package-lock.json') }}
    restore-keys: ${{ runner.os }}-playwright-
```

Notes: keys should change **only** when the dependency set changes (a too-dynamic key never hits). Caches are scoped per branch; the `path` must exactly match the install location.

## 5. Concurrency Cancellation

Use `concurrency` to cancel superseded runs and avoid wasted minutes / racing runs against shared external test accounts.

- For PR/push CI, group by ref and cancel the in-progress run when a new commit lands.
- Do **not** blindly cancel scheduled or long-running suites you want to complete — scope `cancel-in-progress` to the right event, or set it `false` for the scheduled run.

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}
```

## 6. Matrix Strategy Hygiene

- **`fail-fast`**: default `true` cancels sibling matrix jobs on the first failure (fast feedback). For a test suite where you want every shard's results, set `fail-fast: false`.
- **`include` / `exclude`**: refine combinations instead of multiplying a full cross-product you don't need.
- **`max-parallel`**: throttle concurrent jobs when they share a limited external resource (e.g. supplier test accounts that can't run simultaneously).
- Keep the matrix data-driven and minimal — one axis per real dimension; avoid dimensions that always pair 1:1 (fold them into `include`).
- Set `timeout-minutes` on matrix jobs so one hung shard can't burn the full runner budget.

```yaml
strategy:
  fail-fast: false         # collect results from every shard
  max-parallel: 4          # don't overrun shared test accounts
  matrix:
    suite: [flights, hotels, cars, rails]
```

## Checkout & Misc

- `actions/checkout` with `fetch-depth: 1` (the default) is enough for tests; only use `0` when you genuinely need full history.
- Skip `submodules`/`lfs` checkout unless a job needs them.
- Give every job a `timeout-minutes` to prevent hung workflows from consuming runner minutes.

## Quick Review Checklist

- [ ] Explicit `permissions:` block, `contents: read` baseline, write scopes only where needed.
- [ ] Every `uses:` pinned to a full commit SHA with a `# version` comment.
- [ ] Secrets via `secrets` context, scoped `env:`, never logged.
- [ ] Dependency cache configured (prefer `setup-node` `cache: 'npm'` + `npm ci`).
- [ ] `concurrency` set to cancel superseded PR runs.
- [ ] Matrix `fail-fast` chosen deliberately; `timeout-minutes` on jobs.
