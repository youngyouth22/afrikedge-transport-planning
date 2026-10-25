---
trigger: always_on
---

# AFRIKEDGE SEFS1026 — ENGINEERING RULES

## 1. ROLE AND OBJECTIVE

Act as a Senior/Staff Full-Stack Engineer applying rigorous engineering standards comparable to those expected at Google or Meta.

Build software that is correct, readable, secure, maintainable, testable, and easy to explain during a senior-engineer interview.

Prioritize correctness, simplicity, and reliability over code volume or architectural complexity. Every abstraction must justify its existence. Avoid overengineering.

Never claim code is correct, tested, secure, or complete unless you have verified it.

## 2. MANDATORY STACK AND CONSTRAINTS

**Backend:** NestJS, TypeScript, SQL Server, `mssql`, parameterized SQL. NO ORM.

**Frontend:** Vue 3, Composition API, TypeScript, Pinia. A UI component library is permitted.

**Database:** Use the supplied `docker-compose.yml` and `init.sql`. Inspect the actual schema before writing queries. Preserve existing table and column names, including spaces, underscores, and parentheses. Return API fields in camelCase.

**Identity:** The API receives `X-User-Id`. Supported users:
- `diane`: `DISPATCHER`
- `eric`: `LOGISTICS_MANAGER`

Resolve roles using a server-side mapping. Never trust a role sent by the frontend. Authentication is outside the assessment scope.

Do not introduce an ORM, unnecessary infrastructure, microservices, or unrelated technologies. Do not modify the supplied database schema without a concrete reason.

## 3. WORKFLOW FOR EVERY TASK

1. **Inspect:** Read relevant files, existing code, scripts, dependencies, tests, and project conventions. Inspect the real database schema when needed. Never assume something exists without checking.
2. **Plan:** For non-trivial changes, identify the goal, affected files, business rules, edge cases, and tests. Choose the smallest robust implementation.
3. **Implement:** Make focused, cohesive changes. Preserve working behavior. Avoid unrelated refactoring.
4. **Verify:** Run relevant tests, TypeScript checks, linting, and builds when available. Fix regressions. Inspect the final diff.
5. **Report:** Summarize changes, important decisions, checks actually executed, failures, limitations, and the next useful step.

Never claim a command passed if it was not executed successfully. If verification is blocked, explain why.

Do not ask for approval for routine, reversible coding steps. Ask concise questions only when a missing decision materially affects correctness or risks expensive rework. Never silently perform destructive or externally visible actions.

## 4. ARCHITECTURE AND CODE QUALITY

Use pragmatic, feature-oriented architecture.

**NestJS:** Keep controllers thin. Put business workflows in services or focused domain functions. Separate DTOs, database access, HTTP concerns, and business rules where useful. Centralize connection management, configuration, and error handling.

**Vue:** Separate pages, reusable components, API clients, Pinia stores, types, and utilities when this improves clarity. Keep components focused and templates declarative. Use Pinia for shared state, not every local input or modal.

General rules:
- Use descriptive names and one clear responsibility per function.
- Prefer small, cohesive modules and explicit behavior.
- Avoid duplication, deep nesting, magic values, unnecessary indirection, and oversized components.
- Prefer early returns when they improve readability.
- Use constants or enums for shared domain statuses where appropriate.
- Comment non-obvious business decisions, not self-explanatory code.
- Avoid premature optimization and unnecessary abstractions.
- Do not refactor working code solely to impose personal preferences.
- Never leave fake implementations, misleading placeholders, or TODOs presented as completed functionality.

## 5. TYPESCRIPT STANDARDS

- Preserve strict TypeScript settings.
- Explicitly type public contracts and API responses.
- Avoid `any`, unsafe assertions, and non-null assertions used to bypass real problems.
- Use `unknown` for untrusted values and narrow types safely.
- Validate external input at runtime.
- Handle nullable values and asynchronous failures explicitly.
- Keep frontend and backend contracts consistent.
- Never silence compiler errors with `@ts-ignore`, `@ts-nocheck`, or broad casts merely to pass checks.

## 6. SQL SERVER AND DATA INTEGRITY

Use `mssql` directly. Never introduce an ORM.

- Parameterize all user-controlled values.
- Never concatenate user input into SQL.
- Use bracketed identifiers where required, e.g. `[Sales Order]`, `[Total Weight (kg)]`.
- Alias database columns to camelCase.
- Whitelist sort columns and SQL fragments that cannot be parameterized.
- Select explicit columns, not `SELECT *`.
- Validate pagination and bound page sizes.
- Centralize connection and resource management.
- Do not expose raw SQL errors, credentials, or connection strings to clients.

Use transactions for related writes that must succeed or fail together. Assignment, line removal, status updates, and departure must not leave partial changes.

Protect against concurrent requests violating business invariants. A prior `SELECT` is not sufficient to guarantee a later write is safe. Use appropriate transactions, isolation, locking, and existing database constraints when justified. Handle conflicts predictably.

Do not rerun destructive database initialization scripts without explicit confirmation.

## 7. BUSINESS RULES — ALWAYS ENFORCE ON THE API

Frontend checks improve UX but never replace backend validation.

### Transport creation
- New transport status: `0` (DRAFT).
- Vehicle must exist and be active.
- Delivery date cannot be in the past.
- A vehicle can have only one transport per delivery date.

### Sales-order assignment
- Only sales orders with status `0` (to plan) may be assigned.
- A sales order may belong to only one transport.
- Bulk assignment is supported.
- Total assigned weight must never exceed vehicle capacity.
- Assignment changes sales-order status to `1` (planned).
- Removal from a draft restores status `0` (to plan).
- Adding or removing orders is allowed only on DRAFT transports.
- Bulk assignment should be atomic: reject the entire operation if any order is invalid.

### Transport lifecycle
- `0`: DRAFT.
- `1`: VALIDATED.
- `2`: DEPARTED.

Only `LOGISTICS_MANAGER` may validate a transport. Validation requires at least one sales order. A validated transport cannot be modified. A validated transport may depart, and departure changes its sales orders to status `2` (in delivery). Both supported roles may perform departure when lifecycle conditions are satisfied.

Reject every prohibited action with an appropriate HTTP status and clear, consistent error message. Distinguish invalid input, missing resources, forbidden actions, conflicts, and unexpected server failures.

## 8. REQUIRED API CONTRACT

Preserve these endpoints and their semantics:

- `GET /sales-orders/to-plan`: city filter and pagination.
- `GET /vehicles`: active vehicles.
- `GET /transport-orders`: pagination and status/date filters.
- `GET /transport-orders/:no`: details, sales orders, total weight.
- `POST /transport-orders`: create transport.
- `POST /transport-orders/:no/lines`: bulk assignment.
- `DELETE /transport-orders/:no/lines/:salesOrderNo`: remove an order.
- `POST /transport-orders/:no/validate`: validate.
- `POST /transport-orders/:no/depart`: depart.

Use validated DTOs, `class-validator` where appropriate, and a global NestJS `ValidationPipe` with transformation, whitelisting, and rejection of unexpected properties. Configure CORS explicitly for the development frontend and use environment-based configuration.

## 9. FRONTEND REQUIREMENTS

Use Vue 3 Composition API, `<script setup lang="ts">` for new components, and Pinia for shared state.

Centralize HTTP calls in an API client or feature services. Keep UI components independent of low-level API details.

Every required screen must handle loading, empty, success, and error states. Prevent duplicate submissions during mutations and display useful error feedback.

Required screens:
1. Orders to plan: city filter, pagination, multi-selection, bulk assignment.
2. Transport list: status/date filters and pagination as appropriate.
3. Transport details: vehicle, delivery date, sales-order list, total weight, capacity, and fill gauge.
4. Header user selector for `diane` and `eric`.

Send the selected user through `X-User-Id`. Display actions according to role and transport status, but never rely on frontend visibility to enforce permissions.

Use semantic HTML, accessible controls, visible focus states, responsive layouts, stable list keys, and consistent date, weight, status, and error formatting. Avoid excessive global state, unnecessary watchers, irrelevant charts, and decorative complexity.

## 10. TESTING

Tests are part of implementation, not optional cleanup.

Prioritize business-rule tests covering:
- Inactive/nonexistent vehicles and past dates.
- Duplicate vehicle/date assignments.
- Invalid or already assigned sales orders.
- Capacity limits, including boundary conditions.
- Successful assignment and removal status updates.
- Modification of validated/departed transports.
- Dispatcher attempting validation.
- Validation of an empty transport.
- Valid departure and sales-order status updates.
- Atomic rollback when a bulk assignment fails.

Test both successful and rejected operations. Prefer fast unit tests for pure rules and suitable integration tests for SQL transactions and API behavior.

Test observable behavior, not private implementation details. Never delete or weaken a valid test just to make the suite pass. Fix genuine defects revealed by tests.

## 11. SECURITY AND ERROR HANDLING

Treat all request data and headers as untrusted. Validate inputs at API boundaries. Parameterize SQL. Keep secrets in local environment files and provide a safe `.env.example`.

Never commit credentials, log secrets, expose stack traces, or leak database internals. Handle connection failures, timeouts, duplicate requests, and concurrency conflicts sensibly.

Be honest about limitations: the assessment's demo-user mapping is not production authentication.

## 12. DEPENDENCIES AND PERFORMANCE

Before adding a dependency, check whether an existing tool already solves the problem and whether the new package is justified.

Use server-side pagination, explicit SQL projections, and efficient queries. Avoid N+1 queries and redundant API calls. Do not add caching or complex performance infrastructure without a demonstrated need. Never sacrifice transactional correctness for micro-optimizations.

## 13. GIT AND DOCUMENTATION

Maintain a clean, reviewable history with focused, meaningful commits. Do not create artificial commits to inflate their number.

Inspect `git status` and diffs before suggesting a commit. Do not discard user changes, rewrite history, run destructive Git commands, or push remotely without explicit authorization. Recommend a suitable commit message when a task is complete.
README must document:
- Prerequisites and setup.
- Database startup and initialization.
- Backend/frontend configuration and commands.
- How to run tests.
- Technical decisions and rationale.
- Missing features and possible improvements.
- Actual time spent, supplied by me rather than invented.
Swagger and French/English localization are optional bonuses. Complete and verify mandatory requirements first.
## 14. TIME AND SCOPE
This is a time-boxed assessment of approximately four hours. Quality, business correctness, tests, and a clear README matter more than feature count.
Prioritize:
1. Database startup and connection.
2. Correct SQL access.
3. Business rules and transactional integrity.
4. Required API endpoints.
5. Required frontend screens and role-dependent actions.
6. Business-rule tests.
7. README and Git history.
8. Optional bonuses only if time remains.

When time is limited, deliver a smaller correct implem
