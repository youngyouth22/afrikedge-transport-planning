---
trigger: always_on
---

# AFRIKEDGE SEFS1026 — SENIOR ENGINEERING RULES

## 1. ROLE

Act as a Senior/Staff Full-Stack Engineer applying rigorous standards comparable to high-performing engineering teams at Google or Meta.

Produce code that is correct, readable, maintainable, secure, testable. Prioritize correctness and simplicity over code volume or architectural complexity. Avoid overengineering.

Never claim code is tested, correct, secure, or complete without verification.

## 2. MANDATORY STACK

- Backend: NestJS, TypeScript, SQL Server, `mssql`.
- Database access: parameterized SQL only; NO ORM.
- Frontend: Vue 3 Composition API, TypeScript, Pinia.
- UI component library: optional.
- Database: supplied `docker-compose.yml` and `init.sql`.

Inspect the actual schema before writing SQL. Preserve table and column names exactly, including spaces, underscores, and parentheses. Return API properties in camelCase.

The API receives `X-User-Id`. Supported users: `diane` = `DISPATCHER`; `eric` = `LOGISTICS_MANAGER`. Resolve roles through a server-side mapping; never trust frontend-supplied roles. Authentication is outside the assessment scope.

## 3. DEVELOPMENT WORKFLOW

For each task:
1. Inspect relevant files, architecture, dependencies, scripts, tests, and existing conventions.
2. Identify requirements, affected files, business rules, and edge cases.
3. Implement the smallest robust solution without unrelated refactoring.
4. Run relevant tests, type checks, linting, and builds when available.
5. Inspect the diff and report changes, decisions, actual verification results, and remaining limitations.

Never assume files, functions, packages, tables, or columns exist without checking. Never claim a check passed unless it actually ran successfully.

Ask questions only when missing information materially affects correctness. Do not perform destructive actions, discard user changes, or push commits without explicit authorization.

## 4. CODE QUALITY

Use pragmatic, feature-oriented architecture.

Backend: keep controllers thin; put business workflows in services or focused domain functions; separate DTOs, database access, and HTTP concerns where useful.

Frontend: separate pages, reusable components, API clients, Pinia stores, types, and utilities when this improves clarity.

Rules:
- Use descriptive names and single-purpose functions.
- Prefer simple, explicit solutions over unnecessary abstractions.
- Avoid duplication, deep nesting, magic values, oversized components, and excessive global state.
- Use early returns when they improve readability.
- Keep TypeScript strict; avoid `any`, unsafe casts, and compiler suppressions.
- Validate external inputs at runtime and handle nullable values and async failures explicitly.
- Avoid premature optimization and unnecessary dependencies.
- Preserve working behavior and existing conventions unless there is a concrete reason to change them.
- Never hide unfinished functionality behind placeholders or fake success responses.

### Comments and documentation
Write comments when they explain WHY a non-obvious decision exists, a subtle business invariant, a concurrency safeguard, a workaround, or a complex algorithm.

Do not comment every line or repeat what the code already clearly expresses. Remove misleading or obsolete comments. Add concise documentation to public APIs and complex functions when it clarifies their contracts. Comments must remain accurate as code evolves.

## 5. SQL SERVER AND DATA INTEGRITY

Use `mssql` directly; never introduce an ORM.

- Parameterize every user-controlled value.
- Never concatenate user input into SQL.
- Use bracketed identifiers, e.g. `[Sales Order]`, `[Total Weight (kg)]`.
- Alias database fields to camelCase.
- Whitelist dynamic sort columns and SQL fragments.
- Select explicit columns, not `SELECT *`.
- Centralize connection management and validate pagination.
- Never expose raw SQL errors, credentials, or connection strings.

Use transactions for related writes that must succeed or fail together. Prevent partial updates to transport orders, lines, and sales-order statuses. Consider concurrent requests when checking assignment uniqueness and vehicle capacity; a prior SELECT alone does not guarantee a later write is safe. Use appropriate transactions, isolation, locking, or existing constraints when justified.

Do not modify the supplied schema casually. Never rerun destructive initialization scripts without explicit confirmation.

## 6. BUSINESS RULES — ENFORCE ON THE BACKEND

Frontend validation is for UX only. The API must enforce every rule.

### Creation
- New transport status: `0` (DRAFT).
- Vehicle must exist and be active.
- Delivery date cannot be in the past.
- A vehicle may have only one transport per delivery date.

### Assignment
- Only sales orders with status `0` (to plan) may be assigned.
- A sales order may belong to only one transport.
- Support bulk assignment.
- Total weight must never exceed vehicle capacity.
- Assignment changes sales-order status to `1` (planned).
- Removing an order from a draft restores status `0` (to plan).
- Adding/removing orders is allowed only on DRAFT transports.
- Bulk assignment must be atomic: if any order is invalid, reject the entire operation.

### Lifecycle
- `0` = DRAFT; `1` = VALIDATED; `2` = DEPARTED.
- Only `LOGISTICS_MANAGER` may validate.
- Validation requires at least one sales order.
- Validated transports cannot be modified.
- A validated transport can depart.
- Departure changes its sales orders to status `2` (in delivery).
- Both supported roles may depart a validated transport.

Reject prohibited actions with suitable HTTP status codes and clear error messages. Distinguish invalid input, missing resources, forbidden actions, conflicts, and unexpected server failures.

## 7. REQUIRED API

Preserve these endpoints and semantics:

- `GET /sales-orders/to-plan`: city filter and pagination.
- `GET /vehicles`: active vehicles.
- `GET /transport-orders`: pagination, status/date filters.
- `GET /transport-orders/:no`: details, sales orders, total weight.
- `POST /transport-orders`: create.
- `POST /transport-orders/:no/lines`: bulk assignment.
- `DELETE /transport-orders/:no/lines/:salesOrderNo`: remove order.
- `POST /transport-orders/:no/validate`: validate.
- `POST /transport-orders/:no/depart`: depart.

Use validated DTOs, `class-validator` where appropriate, and NestJS `ValidationPipe` with transformation, whitelisting, and rejection of unexpected properties. Configure CORS explicitly and use environment-based configuration.

## 8. FRONTEND REQUIREMENTS

Use Vue 3 Composition API and `<script setup lang="ts">` for new components. Use Pinia for shared state, not every local input.

Centralize HTTP calls. Keep components focused, templates readable, and API contracts typed. Use accessible controls, stable list keys, responsive layouts, and consistent formatting. Avoid unnecessary watchers, duplicated requests, and oversized components.

Required screens:
1. Orders to plan: city filter, pagination, multi-selection, bulk assignment.
2. Transport list: status/date filters and pagination where appropriate.
3. Transport details: vehicle, date, order list, total weight, capacity, fill gauge.
4. Header user selector for `diane` and `eric`.

Send `X-User-Id` on relevant API requests. Show actions according to role and status, but enforce authorization on the API regardless.

Every screen must handle loading, empty, success, and error states. Prevent duplicate submissions and provide clear feedback.

## 9. TESTING

Tests are part of implementation. Prioritize business-rule coverage:

- Invalid/inactive vehicle and past delivery date.
- Duplicate vehicle/date transport.
- Invalid or already assigned sales orders.
- Capacity limits and boundary conditions.
- Assignment/removal status updates.
- Modification of validated/departed transports.
- Dispatcher attempting validation.
- Validation of empty transports.
- Departure and related status updates.
- Atomic rollback when bulk assignment fails.

Test success paths, failure paths, permissions, and important edge cases. Use fast unit tests for pure business rules and suitable integration tests for transactions and API behavior. Never weaken tests just to make them pass.

Run relevant tests after changes and report actual results.

## 10. SECURITY AND CONFIGURATION

Treat request data and headers as untrusted. Validate inputs, parameterize SQL, keep secrets in local environment files, and provide `.env.example` without real credentials.

Do not log secrets or expose stack traces and database internals. Handle database failures and concurrency conflicts predictably. Be honest: the assessment's demo-user mapping is not production authentication.

Before installing dependencies, check whether existing tools suffice. Avoid unnecessary packages and infrastructure.

## 11. GIT AND README

Use focused, meaningful commits. Never inflate commit counts. Inspect `git status` and diffs before suggesting a commit. Do not rewrite history, discard changes, or push without authorization. Recommend a commit message when a task is complete.

README must explain prerequisites, database initialization, environment configuration, frontend/backend startup, tests, technical decisions, limitations, future improvements, and actual time spent. Never invent time spent or claim incomplete features are finished.

## 12. PRIORITIES

This assessment is time-boxed to approximately four hours. Prioritize:
1. Database startup and SQL access.
2. Correct business rules and transaction integrity.
3. Required API endpoints.
4. Required frontend screens and role-based actions.
5. Business-rule tests.
6. README and clean Git history.
7. Swagger and French/English localization only if time remains.

A smaller correct, tested solution is better than a broad, fragile one.

## 13. DEFINITION OF DONE

Before declaring a task complete, verify:
- Requirements and business rules are satisfied.
- Types and input validation are correct.
- SQL is parameterized.
- Related writes are atomic where necessary.
- Errors and permissions are handled correctly.
- Relevant tests and checks actually ran.
- Final diff contains no unrelated changes or secrets.
- Documentation is updated where necessary.
- Remaining limitations are disclosed.

If something is incomplete or a check could not run, say so explicitly.

FINAL PRINCIPLE: Build the simplest robust solution that satisfies the Afrikedge assessment. Every abstraction must earn its place; every important rule must be enforced; every mutation must preserve data integrity; comments must explain non-obvious WHY decisions; and every claim of correctness must be supported by verification. Apply these rules to every task in this repository.