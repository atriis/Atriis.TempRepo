# Atriis Automation – AI-Assisted Development Guide

This guide explains how to use GitHub Copilot effectively and safely in this Playwright + Cucumber BDD test automation framework.

**For non-developers (QA Engineers)**: This project provides approved prompts that simplify AI usage. You don't need to write complex instructions—just follow the steps below.

---

## Quick Start (3 Steps)

Using prompts in this repository is simple and **always the same**:

1. Open the prompt file you need from the `prompts/` folder
2. Copy **the entire content** of the file
3. Paste it into **Copilot Chat**
4. Below the pasted prompt, add your specific context:
   - scenario
   - files
   - error messages
   - questions

That’s it.

You do **not** need to:
- reference the filename in chat
- modify the prompt text
- configure Copilot settings
- choose a model or agent
- invent your own wording

The behavior comes from **what you paste**, not from the filename.

---

## Step 1 – Decide what you want to do

Pick **ONE** of the actions below:

### A) Review existing code
→ Use: `code-reviewer.prompt.md`

### B) Create a new automated test
→ Use: `generate-test.prompt.md`

### C) Add or update a DSL method
→ Use: `generate-dsl-method.prompt.md`

### D) Understand existing code
→ Use: `explain-code.prompt.md`

❗ Do NOT invent your own prompts  
❗ Always start from one of the approved prompt files

---

## Step 2 – Paste the prompt content

1. Open the correct prompt file from the `prompts/` folder
2. Copy **the entire content**
3. Paste it into Copilot Chat **without changes**

---

## Step 3 – Provide the required information

After pasting the prompt, add the information below depending on your task.

### If you are reviewing code
Include:
- What changed (short description)
- Files changed (paths or diff)
- Any known concerns or questions

Example:
> These files were changed:
> - src/dsl/Search.js
> - tests/search.flight.spec.js  
>  
> Please review for stability and DSL clarity.

---

### If you are generating a test
Include:
- Business scenario (what the user is doing)
- Preconditions (if any)
- Expected outcome
- Existing test or DSL to reuse (if known)

Example:
> Scenario: Search for a one-way flight and verify results are shown  
> Preconditions: User is logged in  
> Expected outcome: Results page loads successfully  
> Similar test: tests/search.roundtrip.spec.js

---

### If you are adding/updating a DSL method
Include:
- What the method should represent (user intent)
- Where it will be used (test name or scenario)
- What already exists (if relevant)

Example:
> I need a DSL method to select a vehicle type in ground transport search.  
> This will be used in tests for supplier XYZ.  
> There is already a GroundTransportSearch DSL.

---

### If you are explaining code
Include:
- File(s) to explain
- What is confusing or unclear (if applicable)

Example:
> Please explain src/dsl/FlightSearch.js.  
> I want to understand how it differs from the Page Object.

---

### If you are dealing with an error or failure
Always include:
- Exact error message (copy/paste)
- Stack trace or Playwright output (if available)
- When it happens (test name, step)
- What you already tried (if anything)

Example:
> Error: Timeout waiting for locator  
> Test: search.flight.spec.js  
> Happens after clicking “Search”  
> I already tried increasing the timeout.

---

## Step 4 – Important rules (read carefully)

- Always follow `copilot-instructions.md`
- Never ask Copilot to “just fix it”
- Never invent new patterns
- Prefer reuse over creation
- If something is unclear, ask for explanation first

When in doubt: **review first, then change**.

---

## Goal of this system

This prompt library exists to ensure:
- stable, non-flaky tests
- consistent architecture
- safe AI usage for non-developers
- long-term maintainability of the framework