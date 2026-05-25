# Bookler Copilot Instructions

These instructions apply to work in this repository.

## Product Backlog

Before implementing any feature, read `docs/PRODUCT.md`. It contains the domain model, the MVP scope, and all features with their acceptance criteria and current status.

When a feature is completed, update its status in `docs/PRODUCT.md` from `[planned]` or `[in-progress]` to `[done]` and check off the relevant acceptance criteria.

When starting a feature, set its status to `[in-progress]` in `docs/PRODUCT.md`.

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

This project follows strict Clean Architecture. Layer boundaries are non-negotiable. When in doubt, **stop and ask** rather than finding a shortcut that compiles.

### Layer rules

- **Domain layer** (`src/application/domain`): pure business logic and rules. No framework imports, no ORM types, no DTOs, no infrastructure concerns of any kind.
- **Application layer** (`src/application`): use cases and mappers. May depend on domain contracts. Must not import from Express, Drizzle, or any infrastructure detail.
- **Infrastructure layer** (`src/infrastructure`): repositories, controllers, server, IoC container. The only layer allowed to depend on frameworks.

### Repository contracts

- Repository interfaces live in the **domain layer** and return domain entities or primitives only. No DTOs, no ORM types.
- Repository implementations live in the **infrastructure layer** and are the only place that knows about Drizzle, SQL, or table schemas.

### When something feels awkward

If a design forces you to violate a layer boundary, add a bypass factory, or import infrastructure into the domain — **that is a signal the design is wrong**, not a reason to bend the rule. Stop, explain the tension, and propose a proper fix.

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
