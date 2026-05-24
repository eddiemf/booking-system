# Bookler Copilot Instructions

These instructions apply to work in this repository.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## Architecture

- Keep the domain layer free of framework and infrastructure concerns.
- Keep HTTP and Express details in `src/infrastructure/server`.
- Keep persistence details in `src/infrastructure/repositories`.
- Application use cases may depend on domain contracts, but not on Express or database-specific code.

## Dependency Injection

- Use Awilix for dependency injection.
- Use `InjectionMode.CLASSIC`.
- Constructor parameter names are part of the DI contract and must match the container registration names.
- When changing constructor parameter names, update the container registrations accordingly.

## Errors And Results

- Prefer the existing `Result` pattern from `src/shared/result` over throwing for expected domain and application failures.
- Domain validation failures should use the existing domain error types.

## Code Style

- Use Biome for formatting and import organization.
- Prefer `import type` for type-only imports when possible.
- Keep changes minimal and aligned with the current file style.
- Do not introduce new libraries when the existing project utilities already cover the need.

## Project Rules

- Do not edit generated output in `dist`.
- Preserve the existing path alias usage like `@app/*`, `@domain/*`, `@shared/*`, and `@config/*`.

## Validation

- After code changes, run `npm run check` and `npm run build` when the change can affect compilation or formatting.
- If changing dependency injection wiring, verify both the container registrations and constructor parameter names.
