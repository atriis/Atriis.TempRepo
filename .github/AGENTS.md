# AtriisAutomation Agents Registry

Custom agents for the Playwright + Cucumber BDD automation framework. Use these with `@agent-name` or through `runSubagent()` calls.

## Available Agents

### batch-test-fixer
**Purpose**: Run 3 test cases sequentially, auto-resolve TODO comments, and iterate until each test passes.

**Workflow**:
1. Collect 3 test paths + users from input
2. For each test:
   - Run feature file
   - Parse for TODO comments in steps/DSL
   - Implement missing functionality
   - Commit atomic fix
   - Rerun (up to 5 iterations)
3. Report final status for all 3 tests

**Usage**:
```
@batch-test-fixer

Test 1: tests/features/flights/general/random_roundtrip.feature
User 1: amadeus user_one

Test 2: tests/features/hotels/daily_hotels/68393_expedia_co2.feature  
User 2: expedia user_co2

Test 3: tests/features/cars/general/basic_car_search.feature
User 3: hertz user_standard
```

---

### code-reviewer
**Purpose**: Review pending code changes for stability, maintainability, and pattern adherence.

**Scope**: Gherkin, Step Definitions, DSL, Page Objects, Utils

---

### context-bridge
**Purpose**: Connect Cortex.QA (ADO bugs, findings) with Atriis.OBT source code for test automation.

**Use When**:
- Generating tests from ADO bugs
- Checking coverage gaps
- Exploring what to test

---

### fix-tests
**Purpose**: Make failing tests pass with minimal, safe changes.

**Scope**: Scans frameworks, selectors, flows, root causes

---

### generate-dsl-method
**Purpose**: Create/update DSL methods following project patterns.

**Output**: Method in correct DSL file + barrel export updates

---

### generate-test
**Purpose**: Generate Gherkin feature + step definitions for new test scenarios.

**Reuses**: Existing steps/DSL patterns before creating new ones

---

### test-case-converter
**Purpose**: Convert manual test cases (ADO, sheets, docs) into Gherkin .feature files.

---

### testim-converter
**Purpose**: Migrate Testim-exported Playwright tests into Gherkin BDD format.

---

## Adding New Agents

1. Create `.agent.md` file in `.github/agents/`
2. Include YAML frontmatter with name and description
3. Define workflow phases and implementation notes
4. Update this AGENTS.md registry
5. Commit: `chore(agents): add {agent-name}`

## Agent Invocation

### From VS Code Chat
```
@batch-test-fixer
```

### Programmatic
```javascript
runSubagent({
  agentName: 'batch-test-fixer',
  description: 'Run 3 tests with auto TODO resolution',
  prompt: 'Run flights, hotels, cars tests...'
})
```
