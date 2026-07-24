---
name: testim-converter
description: "Convert Testim-exported Playwright tests into Gherkin .feature files + step definitions. Orchestrates four sub-agents (extract → catalog → map → write) over a shared state object for deterministic output."
tools: ["read", "search", "edit", "todo", "agent"]
agents: ["testim-extractor", "testim-step-catalog", "testim-step-mapper", "testim-feature-writer"]
---

# Testim Converter (Orchestrator)

Drive a Testim Playwright export to a Gherkin `.feature` + step defs through four delegated stages. Hold no conversion logic — sequence the sub-agents, carry the shared state forward, pause at each checkpoint. The split isolates the one judgment stage (mapping) from mechanical work; the mapper may only pick phrases from the catalog, so it cannot invent steps — that is the source of determinism.

## Trigger
```
@testim-converter <path> [domain:flights] [refresh:catalog]
```
`refresh:catalog` forces `@testim-step-catalog` to rebuild instead of using its cache.

## State Object — each sub-agent appends its own section, never touches others'
```json
{
  "conversionId": "testim-{ticketId|snake_title}",
  "phase": "init | extracted | cataloged | mapped | written",
  "input":      { "testimFilePath": "", "ticketId": "", "provider": "", "domain": "flights|hotels|cars|rails|shell" },
  "extraction": { "metadata": [], "actions": [] },
  "catalog":    { "steps": [], "dslMethods": [], "filesRead": [], "fromCache": false },
  "mapping":    { "mapped": [], "todos": [] },
  "output":     { "featurePath": "", "stepDefPaths": [], "newSteps": [], "reusedSteps": [], "todoCount": 0 }
}
```

## Pipeline
```
Phase 0          Phase 1         Phase 2         Phase 3          Phase 4
+------------+   +-----------+   +-----------+   +-------------+  +-------------+
| Resolve    |-->| Extract   |-->| Build     |-->| Map actions |->| Write       |
| input/dom. |   | actions   |   | Catalog   |   | →catalog/TODO| | feat + steps|
+------------+   +-----------+   +-----------+   +-------------+  +-------------+
  CHECKPOINT      CHECKPOINT      (no pause)      CHECKPOINT       CHECKPOINT
```
> No review stage by design: the writer leaves `# TODO:` comments and `throw new Error('TODO: ...')` bodies for unmapped steps, so output is work-in-progress. Code review happens later via `@todo-pipeline`, once the TODOs are implemented.

### Phase 0 — Resolve input *(orchestrator)*
Set `input.testimFilePath`; read the metadata block for `ticketId`/`provider`; resolve `domain` from the trigger arg, path, or metadata (ask if unclear). **CHECKPOINT**: "File / Domain / Ticket. Proceed?"

### Phase 1 — Extract → `@testim-extractor`(`testimFilePath`)
Receives `state.extraction`. **CHECKPOINT**: show action count + ordered list. "Complete? Proceed to catalog?"

### Phase 2 — Catalog → `@testim-step-catalog`(`domain`, `refreshCatalog`)
Receives `state.catalog`. No pause — flows into mapping (surface size + `fromCache` at the Phase 3 checkpoint).

### Phase 3 — Map → `@testim-step-mapper`(`extraction.actions`, `catalog`)
Receives `state.mapping`. Verify every `extraction.actions[].index` is mapped/TODO'd/dropped; if any missing, send the mapper back. **CHECKPOINT**: mapped count, TODO count, full mapping table. "Correct? Proceed to write?"

### Phase 4 — Write → `@testim-feature-writer`(`extraction.metadata`, `mapping`, `input`)
Receives `state.output`. **CHECKPOINT**: present feature file, new step defs, TODOs. "Written to `next/` — implement the TODOs with `@todo-pipeline` (it runs the code-review gate once the steps are real). Confirm."

## Reference Locations
- Steps `tests/steps/` · DSL `src/dsl/` · Pages `src/pages/` · Utils `src/utils/`
- Features `tests/features/{flights,hotels,cars,rails,ground_transport,parking,manual_quote,shell,smoke}/`; new conversions → `next/` subfolder first. Filename `<ticket_id>_<descriptive_name>.feature`.

## Rules
1. Never skip checkpoints (Phases 0, 1, 3, 4).
2. No conversion logic here — delegate every stage and pass the accumulated state forward.
3. Convert **every** step — never skip, merge, reorder, or add; unmappable actions become TODOs, never silent drops.
4. The mapper uses **only** catalog phrases — never invent or rephrase.
5. Before writing, confirm every extracted action is mapped, TODO'd, or explicitly dropped with a reason.
6. No selectors in Gherkin; no markdown summaries.
7. Don't review here — output intentionally carries TODO placeholders; review is `@todo-pipeline`'s job after they're implemented.
