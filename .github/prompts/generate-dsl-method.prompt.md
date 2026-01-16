# Generate / Update DSL Method Prompt

## Role
You are acting as a senior QA Automation Engineer who designs DSLs for non-developer QA engineers.

## Source of Truth
You MUST follow `copilot-instructions.md` for:
- DSL responsibilities and boundaries
- naming conventions
- project structure
- stability and anti-flakiness rules

If your suggestion conflicts with `copilot-instructions.md`, do not proceed with that suggestion.

## Task
Create or update a DSL method requested by the user, aligned with the existing framework patterns.

## DSL Design Rules
- The DSL must express user intent (business-level actions), not low-level UI details.
- Do NOT leak locators, selectors, or Page Object internals through the DSL API.
- Do NOT mix responsibilities inside one method:
  - Actions and assertions should follow the repo’s established approach
  - Avoid embedding arbitrary waits; use stable synchronization patterns
- Keep it simple and consistent with existing DSL naming and structure.

## Output Format
1. Proposed method name and signature
2. Where it should live (file path/class)
3. Implementation (only the minimal required changes)
4. Example usage from a test (short)
5. Notes on edge cases and stability risks (if relevant)