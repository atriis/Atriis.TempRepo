---
applyTo: '*'
description: "Security rules relevant to this Playwright + Cucumber test-automation repo: secret handling and sensitive-data hygiene."
---
# Security Guidelines (Test Automation)

This repo **authors automated tests** — it does not build the app under test. So most OWASP application-security concerns (SQL injection, XSS, crypto, session management, deserialization) are out of scope here. Two rules do apply:

## 1. Never hardcode secrets

- Credentials, API keys, and connection strings must come from the environment, never the source tree.
- Test-account login uses the shared `GENERAL_PASSWORD` from `.env` (see `.github/CLAUDE.md` → Environment & Configuration). Emails live in feature files; the password does not.
- `.env` is local-only — never commit it. Add new secrets to `.env.example` as empty placeholders with a comment.

```javascript
// GOOD: read from environment
const password = process.env.GENERAL_PASSWORD;

// BAD: hardcoded credential
const password = 'Sup3rSecret!';
```

## 2. Don't expose sensitive data

- Never log passwords, tokens, or full payment details — see [logging.md](logging.md) (`DON'T log sensitive data`).
- Remember that **screenshots and Playwright traces are captured on failure** and uploaded as CI artifacts. Avoid leaving real card numbers, tokens, or PII on screen in a state that gets captured; use the designated test cards in `src/data/cards.json`.
- Keep dependencies current; run `npm audit` periodically and review flagged advisories.
