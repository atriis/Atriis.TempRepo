---
applyTo: entire project
description: Conventional Commits format, scopes, examples, and pre-commit checklist for AI-generated commit messages.
---

# Commit Guidelines

## Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Rules:**
- Max 80 characters for subject line
- Use imperative mood: "add" not "added"
- No period at end of subject
- Body explains *what* and *why* (code shows *how*)
- Reference issues: `Fixes #123`, `Relates to #456`

## Types

| Type | Use Case |
|------|----------|
| `feat` | New feature (DSL method, test, Page Object) |
| `fix` | Bug fix (flaky test, selector, wait condition) |
| `refactor` | Restructure without changing behavior |
| `test` | Add/update tests or test data |
| `docs` | Documentation (README, JSDoc, instructions) |
| `chore` | Maintenance (deps, cleanup, config) |
| `perf` | Performance improvements |
| `ci` | CI/CD configuration |
| `style` | Formatting only (no logic change) |

## Scopes

**By Layer:**
- `dsl`, `pages`, `steps`, `utils`, `data`, `config`

**By Feature:**
- `flights`, `hotels`, `cars`, `cart`, `search`, `checkout`, `rails`, `parking`, `manual-quote`, `travel-policy`

**Infrastructure:**
- `ci`, `deps`, `docs`

## Examples

### ✅ Good

```
feat(search): add random flight route selection by region

- Create generateRandomFlightRoute utility
- Add searchRandomFlight, searchOneWayRandomFlight, searchRoundTripRandomFlight
- Support europe/us/intercontinental regions
- Default to europe when no region specified
```

```
fix(cart): prevent duplicate items from race condition

Clicking "Add to Cart" multiple times caused duplicates.
Now disables button until navigation completes.
```

```
refactor(data): group flight routes by region in flights.json

Restructured into us/europe/intercontinental for better organization.
Updated resolveRoute to search nested groups.
```

```
test(flights): add intercontinental roundtrip search test
```

```
docs(instructions): update DSL guidelines to match actual patterns
```

```
chore(deps): update Playwright to 1.42.0
```

### ❌ Bad

```
❌ update files                    (Too vague)
❌ fix bugs                        (Which bugs? Where?)
❌ WIP                             (Never commit WIP)
❌ Added new test for flights      (Use imperative: "Add")
❌ feat: implement flight search functionality with support for...
   (Too long — use body for details)
```

## Commit Checklist

Before committing:

- [ ] Code follows project patterns (object literal DSLs, SELECTORS const, step definitions)
- [ ] Tests pass: `npx cucumber-js --tags "@smoke"` or `npx cucumber-js [file]`
- [ ] No debug code (`console.log`, `page.pause()`, commented blocks)
- [ ] No unused imports
- [ ] Commit message: `<type>(<scope>): <subject>` (max 80 chars)
- [ ] Related files included (Step Defs + DSL/Page Object + Feature file if applicable)
- [ ] Code formatted consistently

## Multi-File Changes

✅ **Atomic commit** (all files work together):
```
feat(flights): add random flight search capability

Files:
- src/utils/data/generateRandomFlightRoute.js (new)
- src/dsl/FlightSearch.js (add methods)
- src/data/flights.json (restructure)
- src/utils/route.helper.js (update resolveRoute)
```

❌ **Too many unrelated changes**:
```
feat: add random flights and fix cart bug and update tests
(Split into 3 commits)
```

## Multi-Step Features

Break large features into atomic commits:

```bash
# Each commit leaves codebase in working state
feat(data): restructure flights.json by region
feat(utils): add generateRandomFlightRoute utility
feat(dsl): add random flight search methods to FlightSearch
test(flights): add random intercontinental flight test
```

## When to Commit

**Commit:**
✅ Feature complete and tested
✅ Fix works, doesn't break existing code
✅ All related files updated (DSL + Page + Test)
✅ Tests pass

**Don't commit:**
❌ Syntax errors or failing tests
❌ Incomplete work (use `git stash`)
❌ Debug code still present

## Optional: Extended Message Template

```
<type>(<scope>): <short summary>

## What changed
- Key changes as bullet points

## Why
- Reasoning behind the change
- Link to issues: Fixes #123

## Testing
- How it was tested
- Edge cases considered
```

Example:
```
feat(cart): add OOP indicator validation

## What changed
- Add verifyOutOfPolicyIndicatorIsVisibleInCart to Cart DSL
- Add getOOPTooltipTextCart to CommonPage
- Update cart tests to validate OOP indicator

## Why
- Visual confirmation when booking violates travel policy
- Ensures policy violations shown before checkout

## Testing
- Manual: book out-of-policy hotel, verify red indicator
- Automated: general-hotel-booking.spec.js validates presence
```
