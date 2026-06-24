---
description: 'Generic code review instructions that can be customized for any project using GitHub Copilot'
applyTo: '**'
excludeAgent: ["coding-agent"]
---

# Generic Code Review Instructions

Universal, language-agnostic code-review principles. These complement — they do not
duplicate — the project's own rules.

> **For layer / DSL / Page-Object review rules, see [architecture.md](architecture.md),
> [dsl.md](dsl.md), [page-objects.md](page-objects.md).** Anything about layer separation,
> data-flow direction, DSL method design, Page Object structure, selectors, naming, or
> where assertions belong is covered there and should not be repeated here.

## Review Priorities

Triage findings in this order:

- **🔴 CRITICAL (block merge)** — security holes, exposed secrets, logic/correctness errors,
  data-loss risks, race conditions, breaking contract changes without versioning.
- **🟡 IMPORTANT (discuss)** — missing tests on critical paths, obvious performance problems
  (N+1, leaks), excessive duplication, deviations from established project patterns.
- **🟢 SUGGESTION (non-blocking)** — readability, minor optimizations, small convention
  deviations, missing comments/docs.

## General Review Principles

1. **Be specific** — reference exact files/lines and give concrete examples.
2. **Explain the why** — state the impact, not just the rule.
3. **Suggest a fix** — show corrected code where it helps.
4. **Be constructive** — improve the code, don't criticize the author.
5. **Acknowledge good work** — call out smart, clean solutions.
6. **Be pragmatic** — not every nit must be fixed before merge.
7. **Group related comments** — one thread per topic, not ten.

## Universal Code Quality

(Layer-specific naming/structure → see the project instruction files above.)

- Single Responsibility: each unit does one thing well.
- DRY: no copy-pasted logic; extract shared behavior.
- Keep functions small and shallow (avoid > ~30 lines, > 3–4 nesting levels).
- No magic numbers/strings — name them as constants.
- Self-documenting code; comment only non-obvious *why*, not *what*.
- No commented-out code; no `TODO` without a tracking reference.

## Error Handling

- Handle errors at the level that can act on them; no empty catch / silent failure.
- Validate inputs early (fail fast) with messages that include the offending value.
- Use specific error types, not bare/generic catches.

```python
# ❌ Silent failure
try:
    user = db.get(user_id); user.process()
except:
    pass

# ✅ Explicit, contextual
if not user_id or user_id <= 0:
    raise ValueError(f"Invalid user_id: {user_id}")
try:
    user = db.get(user_id)
except UserNotFoundError:
    raise UserNotFoundError(f"User {user_id} not found")
```

## Security

- No secrets, API keys, tokens, or PII in code or logs — use env vars / secret stores.
- Validate and sanitize all external input.
- Parameterize queries; never concatenate user input into SQL/commands.
- Enforce authentication *and* authorization before privileged actions.
- Use established crypto libraries; never roll your own.
- Watch for known-vulnerable or outdated dependencies.

```javascript
// ❌ const API_KEY = "sk_live_abc123";
// ✅ const API_KEY = process.env.API_KEY;
```

## Testing

(Gherkin/BDD conventions are project-specific — see the instruction files above.)

- Critical paths and new behavior must be covered.
- Names describe the scenario and expected outcome.
- Clear Arrange-Act-Assert / Given-When-Then structure.
- Tests are independent, deterministic, and order-insensitive.
- Use specific assertions over generic truthy/falsy checks.
- Cover edge cases: nulls, empties, boundaries, error paths.
- Mock external dependencies, not the logic under test.

## Performance

- Avoid N+1 queries; batch or eager-load instead.
- Choose appropriate algorithmic complexity for the data size.
- Cache expensive, repeated work where safe.
- Release resources (connections, files, streams, handles).
- Paginate / stream large result sets.

## Documentation

- Document public APIs: purpose, parameters, return values.
- Explain non-obvious logic with a short comment.
- Update README / setup docs when behavior or setup changes.
- Call out breaking changes explicitly.

## Comment Format

```markdown
**[PRIORITY] Category: Brief title**

What the issue is.

**Why this matters:** the impact.

**Suggested fix:** [code if applicable]
```

Example:

```markdown
**🔴 CRITICAL - Security: Hardcoded secret**

`API_KEY` is committed on line 12.

**Why this matters:** anyone with repo access obtains a live credential.

**Suggested fix:** read it from `process.env.API_KEY`.
```

## Prompt-Engineering Tips for Reviewers

- Start with high-level architecture, then drill into details.
- Reference similar existing patterns when suggesting changes.
- Review large PRs in chunks (security → tests → logic → style).
- Avoid ambiguity: name the file, line, and concrete issue.

## References

- [Google Engineering Practices — Code Review](https://google.github.io/eng-practices/review/)
- [OWASP](https://owasp.org/)
- [GitHub Code Review Guidelines](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests)
