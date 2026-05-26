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

## Domain Patterns

Apply your DDD and Clean Architecture knowledge. If something feels off (e.g. an entity enforcing rules that belong to another aggregate, business logic leaking into infrastructure, fat use cases), name the concern before writing code.

### Entity identity

Every entity has two identity fields:
- `_id` — internal UUID (UUIDv7), generated via `EntityId.generate()`, never exposed in API responses.
- `_code` — short public identifier (nanoid(10)), generated via `EntityCode.generate()`, exposed as the public `id` in all DTOs.

Mappers always use `entity.code` as the DTO's `id`. Never use `entity.id` in a DTO.

### Entity lifecycle methods

Every entity follows this pattern:
- `static create(props)` — for new (unpersisted) entities. Generates `id` and `code`. Validates. Returns `Result`.
- `static reconstruct(props)` — for DB-sourced data. Skips validation. Takes raw primitives and wraps them in VOs.
- `update(props)` — mutates the entity in place after validating. Returns `Result<this, ValidationError>`.

### Value Objects

VOs live in their own subdirectory named after the VO, inside the entity folder they belong to.  
Each VO has its own test file in the same folder.

```
entities/schedule/
  time-of-day/
    time-of-day.ts
    time-of-day.test.ts
```

VO pattern:
- Private constructor. Immutable (all fields `readonly`).
- `static create(value, field): Result<VO, ValidationError>` — for user input. `field` is the name used in the error message.
- `static from(value): VO` — for trusted reconstruction from DB. No validation.
- Domain methods (`equals()`, `isAfter()`, `toMinutes()`, etc.) — behaviour lives here, not in the entity.

Entity getters expose VOs, not raw primitives. Mappers and repositories unwrap to primitives at their boundary.

### Aggregates

`ResourceEntity` is the aggregate root for scheduling. `ScheduleEntity` instances are only created/replaced through `resource.setSchedule(entries)`. Never construct `ScheduleEntity` directly in use cases.

`EstablishmentEntity` owns `ResourceEntity[]` and `ServiceEntity[]` as read-only children (for queries). Mutations to resources or services go through their own use cases and repositories.

### Mappers

Mappers translate between domain entities and DTOs (application layer boundary). They are pure static classes.
- `toDTO(entity)` — entity → DTO. Must use `entity.code` as the public `id`. Never expose `entity.id`.
- Every mapper must have a corresponding `.test.ts` file.

### Use cases

Each use case is a class with a single `execute(input)` method returning `PromiseResult<OutputDTO, Errors>`. They:
- Accept primitive inputs (no domain types in the input).
- Return DTOs (not entities).
- Use the `Result` pattern — never throw for expected failures.
- Do not construct entities directly from user input without calling `Entity.create()`.

### Testing conventions

- Every entity, VO, mapper, use case, and controller must have a test file.
- Use `result.getData()` / `result.getError()` in tests only (never in production code).
- Use `vitest-mock-extended` (`mock<Interface>()`) for faking dependencies in use-case tests.
- Use `vitest-mock-express` for controller tests.

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
