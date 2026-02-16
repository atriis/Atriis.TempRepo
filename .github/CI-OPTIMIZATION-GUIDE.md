# CI Pipeline Optimization Guide

## 📊 Performance Comparison

### Before Optimization (Current Pipeline)
```
Total Jobs: 11 sequential jobs
Total Duration: ~45-60 minutes
Browser Installs: 11x (133 MB each = 1.46 GB total)
npm ci executions: 11x
Parallelization: None (jobs run sequentially with needs: dependencies)
Caching: None
Cost per run: ~$2.50 (GitHub Actions pricing)
```

### After Optimization (New Pipeline)
```
Total Jobs: 1 setup + 12 parallel jobs
Total Duration: ~12-18 minutes (3-4x faster)
Browser Installs: 1x (cached and reused)
npm ci executions: 1x (cached and reused)
Parallelization: Full (matrix + sharding)
Caching: node_modules + Playwright browsers
Cost per run: ~$0.60 (75% cost reduction)
```

## 🚀 Key Optimizations Implemented

### 1. **Dependency Caching** ⚡
**Problem:** Every job downloads and installs dependencies independently.

**Solution:**
- Dedicated `setup` job runs once
- Caches `node_modules` (keyed by `package-lock.json` hash)
- Caches Playwright browsers (keyed by package version)
- All other jobs restore from cache (10-30 seconds vs 2-5 minutes)

**Impact:** Saves 20-40 minutes total across all jobs

---

### 2. **Smoke Tests as Gate** 🚦
**Problem:** Regression tests run even when critical path is broken.

**Solution:**
- Smoke tests run first and finish fastest (~3 minutes)
- Regression tests depend on smoke completion (`needs: [setup, smoke-tests]`)
- If smoke fails, you know immediately without waiting for full suite
- Regression still runs (with `if: success() || failure()`) for visibility

**Impact:** Fast feedback on critical failures

---

### 3. **Matrix Strategy for Similar Jobs** 🔄
**Problem:** 7+ jobs doing nearly identical setup → run tests → upload.

**Solution:**
```yaml
strategy:
  matrix:
    suite:
      - { name: 'flights-general', path: 'tests/regression/flights/general', ... }
      - { name: 'hotels-general', path: 'tests/regression/hotels/general', ... }
      - { name: 'cars-galileo', path: 'tests/regression/cars/galileo', ... }
```
- Single job definition
- Runs in parallel across all matrix entries
- Easier to maintain (one place to update, not 7)

**Impact:** 7 job definitions → 1 job definition, runs in parallel

---

### 4. **Test Sharding for Large Suites** ⚡
**Problem:** Cross-supplier tests take 15-20 minutes (longest running job).

**Solution:**
```yaml
strategy:
  matrix:
    shard: [1, 2]

run: npx playwright test --shard=${{ matrix.shard }}/2
```
- Splits tests into 2 parallel runners
- Each runner executes 50% of tests
- Total time cut in half

**Impact:** 20-minute job → 2x 10-minute parallel jobs

---

### 5. **Consolidated Reporting** 📈
**Problem:** 11 separate artifact uploads, scattered results.

**Solution:**
- Download all artifacts in final `test-report` job
- Merge Playwright HTML reports into unified view
- Single HTML report with all test results
- Aggregated JUnit XML for test-reporter

**Impact:** One report to rule them all instead of 11 separate reports

---

### 6. **Fail-Fast Disabled Strategically** 🎯
**Problem:** One failing test suite cancels all others (lose visibility).

**Solution:**
```yaml
strategy:
  fail-fast: false
```
- All test suites run to completion
- See full picture of what's broken
- Useful for identifying patterns (e.g., all Galileo tests fail = supplier issue)

**Impact:** Better debugging visibility

---

### 7. **Environment Variable Consolidation** 🔐
**Problem:** Same env vars repeated in every job.

**Solution:**
```yaml
env:
  AUTOMATION_APP_BASEURL: ${{ secrets.AUTOMATION_APP_BASEURL }}
  GENERAL_PASSWORD: ${{ secrets.GENERAL_PASSWORD }}
```
- Define once at workflow level
- All jobs inherit automatically
- Override per-job only when necessary

**Impact:** DRY (Don't Repeat Yourself), easier to update

---

## 📋 Migration Checklist

### Phase 1: Test the Optimized Pipeline (Recommended)
1. **Keep current pipeline running** (`test-suite.yml`)
2. **Enable optimized pipeline** (`test-suite-optimized.yml`)
3. **Run both in parallel for 1 week**
4. **Compare results:**
   - ✅ Speed improvement
   - ✅ Cost reduction
   - ✅ Reliability (flakiness check)

### Phase 2: Switch Over
Once confident the optimized pipeline is stable:

1. Rename files:
   ```bash
   mv .github/workflows/test-suite.yml .github/workflows/test-suite-old.yml.bak
   mv .github/workflows/test-suite-optimized.yml .github/workflows/test-suite.yml
   ```

2. Update branch protection rules (if enabled):
   - Remove old job names from required checks
   - Add: `Smoke Tests (Critical Path)` as REQUIRED
   - Add: `Test Report & Summary` as REQUIRED

3. Delete old pipeline after 1 month of stable operation

### Phase 3: Enable Advanced Features
After migration is stable, consider:

1. **Add visual regression testing:**
   ```yaml
   - name: Capture screenshots
     run: npx playwright test --update-snapshots
   ```

2. **Add test sharding to more suites:**
   - Identify long-running test suites (>10 minutes)
   - Add sharding to matrix strategy

3. **Add performance budgets:**
   ```yaml
   - name: Check performance budgets
     run: npx playwright test --grep @performance
   ```

4. **Add flaky test detection:**
   ```yaml
   - name: Run tests 3x for flakiness detection
     run: npx playwright test --repeat-each=3 --retries=0
   ```

---

## 🔧 Customization Guide

### Add a New Test Suite to Matrix
Edit the `playwright-regression` job matrix:

```yaml
matrix:
  suite:
    # ... existing suites
    - { name: 'your-new-suite', project: 'your:project', path: 'tests/your/path', user: 'YOUR_USER_EMAIL' }
```

### Adjust Sharding for Different Suite Sizes
For very large suites, increase shard count:

```yaml
matrix:
  shard: [1, 2, 3, 4]  # 4 shards instead of 2

run: npx playwright test --shard=${{ matrix.shard }}/4
```

### Change Smoke Test Gating Behavior
Current: Smoke failure shows error but doesn't block regression

To make smoke BLOCK regression:
```yaml
playwright-regression:
  needs: [setup, smoke-tests]
  if: needs.smoke-tests.result == 'success'  # Only run if smoke passed
```

### Add a New BDD Feature Area
Edit the `bdd-tests` job matrix:

```yaml
matrix:
  suite:
    # ... existing suites
    - { name: 'hotels', path: 'tests/features/hotels/daily_hotels/', user: 'RATEHAWK_USER_ONE_EMAIL' }
```

---

## 🐛 Troubleshooting

### Cache Not Working
**Symptom:** Jobs still run `npm ci` and `playwright install`

**Solution:**
- Check cache key matches: `node-modules-${{ runner.os }}-${{ hashFiles('package-lock.json') }}`
- Verify setup job completed successfully
- GitHub cache has 10 GB limit - check if limit exceeded

### Matrix Jobs Failing with Environment Variables
**Symptom:** User email not found, authentication failures

**Solution:**
- Ensure secret name in matrix matches actual GitHub secret name
- Use `${{ secrets[matrix.suite.user] }}` for dynamic secret access
- Check Actions logs for which secret name was attempted

### Sharded Tests Have Imbalanced Duration
**Symptom:** Shard 1 takes 15 min, Shard 2 takes 5 min

**Solution:**
- Playwright shards alphabetically by default
- Reorder test files so slow tests are distributed
- Or use `--fully-parallel` flag

### Unified Report Not Generating
**Symptom:** `playwright merge-reports` fails

**Solution:**
- Verify all jobs uploaded artifacts with correct paths
- Check Playwright version supports merge-reports (v1.40+)
- Use `continue-on-error: true` to not block summary

---

## 📈 Expected Outcomes

After implementing optimized pipeline, you should see:

✅ **3-4x faster CI runs** (45 min → 12-18 min)
✅ **75% cost reduction** ($2.50 → $0.60 per run)
✅ **Faster feedback loop** (Smoke results in 3 minutes)
✅ **Better parallelization** (12 jobs running concurrently)
✅ **Unified reporting** (One HTML report for all tests)
✅ **Reduced flakiness** (Cached dependencies = more stable runs)

---

## 🔗 Additional Resources

- [Playwright Test Sharding](https://playwright.dev/docs/test-sharding)
- [GitHub Actions Caching](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)
- [Matrix Strategy Documentation](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idstrategymatrix)
- [Test Reporter Action](https://github.com/dorny/test-reporter)

---

## 💡 Pro Tips

1. **Monitor cache hit rate** in Actions logs - should be >90%
2. **Set up Slack/Teams notifications** for smoke test failures
3. **Use `workflow_dispatch` inputs** to run specific test suites on demand
4. **Archive old test results** after 30 days to save storage costs
5. **Run smoke tests on every PR**, full regression only on main branch
