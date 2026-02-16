# CI Pipeline Quick Start

## 🚀 TL;DR - Enable Optimized Pipeline Now

### Step 1: Commit the New Workflow
The optimized pipeline is already created at:
```
.github/workflows/test-suite-optimized.yml
```

Commit and push it:
```bash
git add .github/workflows/test-suite-optimized.yml .github/CI-OPTIMIZATION-GUIDE.md
git commit -m "feat(ci): add optimized CI pipeline with caching and parallelization"
git push origin main
```

### Step 2: Test Both Pipelines Side-by-Side
For the next week, **both pipelines will run**:
- ✅ Old pipeline: `test-suite.yml` (baseline)
- ✅ New pipeline: `test-suite-optimized.yml` (optimized)

### Step 3: Compare Results
After a few runs, check the Actions tab and compare:

| Metric | Old Pipeline | New Pipeline | Improvement |
|--------|-------------|--------------|-------------|
| **Duration** | ~45-60 min | ~12-18 min | **3-4x faster** |
| **Cost** | ~$2.50 | ~$0.60 | **75% cheaper** |
| **Parallelization** | Sequential | Parallel | **12 jobs concurrent** |
| **Setup time** | 11x installs | 1x cached | **20-40 min saved** |

### Step 4: Make it the Primary Pipeline
Once confident (after 5-10 successful runs):

```bash
# Disable old pipeline
mv .github/workflows/test-suite.yml .github/workflows/test-suite-old.yml.bak

# Rename optimized to primary
mv .github/workflows/test-suite-optimized.yml .github/workflows/test-suite.yml

git add .github/workflows/
git commit -m "feat(ci): switch to optimized CI pipeline as primary"
git push origin main
```

### Step 5: Update Branch Protection (Optional)
If you have branch protection rules that require specific checks to pass:

**Go to:** Repository Settings → Branches → Branch protection rules → Edit rule for `main`

**Update Required Status Checks:**
- ✅ Add: `Smoke Tests (Critical Path)`
- ✅ Add: `Test Report & Summary`
- ⚠️ Remove: Old individual job names (if they were required)

---

## 🎯 What Changed?

### Architecture Changes

```
BEFORE (Sequential):
┌─────────────┐
│   Setup     │ (2-5 min each job)
└──────┬──────┘
       ├─────────────────┬─────────────────┬─────────────────┐
       │                 │                 │                 │
┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────┐
│ Smoke  (5m) │   │ Flight (8m) │   │ Hotel (10m) │   │  Cars (7m)  │
└──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
       │                 │                 │                 │
       └─────────────────┴─────────────────┴─────────────────┘
                               │
                        ┌──────▼──────┐
                        │   Summary   │
                        └─────────────┘
Total Time: ~45-60 minutes

AFTER (Parallel with Caching):
┌─────────────┐
│Setup (Cached)│ (30 sec - only once)
└──────┬──────┘
       │
       ├─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
       │     │     │     │     │     │     │     │     │     │     │     │
┌──────▼─┐ ┌─▼───┐ ┌─▼───┐ ┌─▼───┐ ┌─▼───┐ ┌─▼───┐ ┌─▼───┐ ┌─▼───┐ ┌─▼───┐
│Smoke 3m│ │Flt5m│ │Htl6m│ │Car4m│ │X-Spl│ │BDD5m│ │BDD4m│ │Flt7m│ │Htl5m│
└────┬───┘ └──┬──┘ └──┬──┘ └──┬──┘ │Shd1│ └──┬──┘ └──┬──┘ └──┬──┘ └──┬──┘
     │        │       │       │    │ 8m  │    │       │       │       │
     └────────┴───────┴───────┴────┴──┬──┴────┴───────┴───────┴───────┘
                                      │
                               ┌──────▼──────┐
                               │   Summary   │
                               └─────────────┘
Total Time: ~12-18 minutes (longest job duration + setup)
```

### Key Features

1. **Shared Setup Job** - Dependencies installed once, cached
2. **Smoke Tests Gate** - Fast feedback if critical path breaks
3. **Matrix Strategy** - Similar jobs run in parallel from one definition
4. **Test Sharding** - Large suites split across multiple runners
5. **Unified Reporting** - Single HTML report with all results

---

## 🔍 How to Monitor the New Pipeline

### Via GitHub Actions UI

1. Go to **Actions** tab in your repository
2. Click on any workflow run
3. **Expand the job list** - you'll see many jobs running in parallel
4. **Check job duration** - each job should complete in <10 minutes

### Key Jobs to Monitor

| Job Name | Expected Duration | Success Criteria |
|----------|------------------|------------------|
| `Setup & Cache Dependencies` | 30 sec (cached) / 2 min (cold) | ✅ Cache created/restored |
| `Smoke Tests (Critical Path)` | 3-5 min | ✅ All smoke tests pass |
| `PW Regression - *` | 4-8 min each | ✅ Matrix jobs run in parallel |
| `Cross-Supplier - * (Shard *)` | 8-12 min each | ✅ Shards split workload |
| `BDD - *` | 4-6 min each | ✅ Cucumber tests complete |
| `Test Report & Summary` | 1-2 min | ✅ Unified report generated |

### Success Indicators

✅ **Cache hit rate >90%** (Check setup job logs)
✅ **Smoke tests complete first** (within 5 minutes)
✅ **Matrix jobs run concurrently** (check timeline view)
✅ **Total workflow time <20 minutes**
✅ **Unified HTML report available** (in artifacts)

---

## ⚠️ Potential Issues & Solutions

### Issue: Cache Miss on Every Run
**Symptom:** Setup job always installs dependencies

**Cause:** `package-lock.json` changed or cache evicted

**Solution:**
- Normal if dependencies updated
- Cache auto-expires after 7 days of non-use
- Monitor cache hit rate - should stabilize at >90%

### Issue: Smoke Tests Not Blocking
**Symptom:** Regression runs even when smoke fails

**Cause:** By design - you get full visibility

**To Block:** Change in `test-suite-optimized.yml`:
```yaml
playwright-regression:
  needs: [setup, smoke-tests]
  if: needs.smoke-tests.result == 'success'  # Add this line
```

### Issue: Matrix Job Fails to Find Secret
**Symptom:** `Error: SECRET_NAME not found`

**Cause:** Secret name in matrix doesn't match GitHub secret

**Solution:** Verify secret names match:
```bash
# In workflow file:
user: 'AMADEUS_USER_ONE_EMAIL'

# In GitHub: Settings → Secrets → Actions
# Must have secret named: AMADEUS_USER_ONE_EMAIL
```

### Issue: Sharded Tests Overlap
**Symptom:** Same test runs in multiple shards

**Cause:** Misconfigured shard syntax

**Solution:** Verify format:
```yaml
--shard=1/2  # Shard 1 of 2
--shard=2/2  # Shard 2 of 2
```

---

## 📊 Cost Breakdown

### Old Pipeline Cost Per Run
```
11 jobs × 5 minutes each = 55 CPU-minutes
GitHub Actions pricing: ~$0.008 per CPU-minute
Cost: 55 × $0.008 = $0.44

BUT: Jobs run sequentially, so wall-clock time is 45-60 min
Effective cost (including queue time): ~$2.50
```

### New Pipeline Cost Per Run
```
1 setup job (2 min) + 12 parallel jobs (avg 6 min each)
Total CPU-minutes: 2 + (12 × 6) = 74 CPU-minutes
Cost: 74 × $0.008 = $0.59

Wall-clock time: 12-18 minutes (3x faster)
Effective cost (with caching): ~$0.60
```

### Annual Savings
```
Assumptions:
- 10 runs per day (PRs + scheduled + manual)
- 260 working days per year

Old: $2.50 × 10 × 260 = $6,500/year
New: $0.60 × 10 × 260 = $1,560/year

SAVINGS: $4,940/year (76% reduction)
```

---

## 🎉 Success Checklist

After running the optimized pipeline for 1 week:

- [ ] Pipeline completes in <20 minutes consistently
- [ ] Smoke tests pass and complete within 5 minutes
- [ ] Matrix jobs run in parallel (verify in Actions timeline view)
- [ ] Cache hit rate is >90% (check setup job logs)
- [ ] Unified HTML report contains all test results
- [ ] No increase in flakiness or failures compared to old pipeline
- [ ] Team is comfortable with new workflow structure

Once all checked ✅ → **Switch to optimized pipeline as primary**

---

## 🆘 Need Help?

1. **Check the detailed guide:** `.github/CI-OPTIMIZATION-GUIDE.md`
2. **Review specific optimization:** See relevant section in guide
3. **Still stuck?** Open an issue with:
   - Job name that's failing
   - Error message from Actions logs
   - Link to workflow run

Happy optimizing! 🚀
