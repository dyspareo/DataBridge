# Project Audit And Onboarding Guide

## 1. What This System Is

This is a single Spring Boot application that acts as an internal workflow support portal for fixed-asset processes. It combines multiple business flows into one codebase:

- `FAT`: plant, department, user, role, and hierarchy validation
- `FAB`: Excel upload validation for task-assignment style rows
- `FAP`: Excel row validation plus downstream relationship checks
- shared insert/lookup utilities for plants, departments, plant mappings, member roles, and hierarchy recipients

The app serves both:

- backend APIs under `/api/**`
- frontend HTML pages directly from `src/main/resources/static`

## 2. High-Level Architecture

```text
Browser
  -> landing.html
  -> index.html?module=FAT|FAB|FAP|...
  -> app.js + fab-validation.js + fap-validation.js
  -> fetch /api/*

Spring Boot app
  -> Controllers
  -> Services
  -> Repositories
     -> JdbcTemplate against external workflow/user DB
     -> JPA/native SQL against app DB

Databases
  -> sd_apps_db
  -> external workflow/user database (configured as userdb)
```

## 3. How The System Works End-To-End

### 3.1 Entry Flow

1. `GET /` forwards to `landing.html`.
2. The user chooses a module tile.
3. `index.html` loads as a shared shell and reads `?module=...`.
4. Shared UI logic is loaded from `static/js/app.js`.
5. Module-specific behavior is layered on top:
   - `fab-validation.js` for FAB
   - `fap-validation.js` for FAP

### 3.2 FAT Flow

The FAT flow is mostly driven by [`src/main/resources/static/js/app.js`](../src/main/resources/static/js/app.js), which:

- parses uploaded Excel data in the browser
- infers relevant columns
- calls validation and lookup APIs
- opens modal-based insert flows
- performs follow-up checks for user roles, plant mapping, and hierarchy

Backend endpoints involved:

- [`src/main/java/com/vguard/validation/controller/ValidationController.java`](../src/main/java/com/vguard/validation/controller/ValidationController.java)
  - `/api/validate`
  - `/api/validate/batch`
  - `/api/validate/emails`
  - `/api/plant`
  - `/api/department`
  - `/api/user/{email}`
  - `/api/user-exists`
- [`src/main/java/com/vguard/validation/controller/UserDetailsController.java`](../src/main/java/com/vguard/validation/controller/UserDetailsController.java)
  - `/api/user/details`
  - `/api/user/get-username`
  - `/api/user/get-userid`
- [`src/main/java/com/vguard/validation/controller/UserLookupController.java`](../src/main/java/com/vguard/validation/controller/UserLookupController.java)
  - `/api/users/by-email`
  - `/api/users/full-name`
- [`src/main/java/com/vguard/validation/controller/PlantMappingController.java`](../src/main/java/com/vguard/validation/controller/PlantMappingController.java)
  - plant-user mapping lookup and insert
- [`src/main/java/com/vguard/validation/controller/MemberController.java`](../src/main/java/com/vguard/validation/controller/MemberController.java)
  - role lookup, process lookup, member insert
- [`src/main/java/com/vguard/validation/controller/HierarchyController.java`](../src/main/java/com/vguard/validation/controller/HierarchyController.java)
  - hierarchy lookup and recipient insert

### 3.3 FAB Flow

FAB uses the same page shell but a different front-end parser:

1. `fab-validation.js` detects the FAB module.
2. It scans Excel rows for a FAB-style header row.
3. It converts rows into `ExcelRowDTO`.
4. It posts the result to `/api/fab/validate`.
5. The backend validates plant, department, and all email fields.
6. If everything is valid, the UI enables a hierarchy follow-up check.

Backend pieces:

- controller: [`src/main/java/com/vguard/validation/fab/controller/FabValidationController.java`](../src/main/java/com/vguard/validation/fab/controller/FabValidationController.java)
- validation service: [`src/main/java/com/vguard/validation/fab/service/FabValidationService.java`](../src/main/java/com/vguard/validation/fab/service/FabValidationService.java)
- hierarchy service: [`src/main/java/com/vguard/validation/fab/service/FabHierarchyService.java`](../src/main/java/com/vguard/validation/fab/service/FabHierarchyService.java)
- optional upload endpoint: [`src/main/java/com/vguard/validation/fab/controller/FabHierarchyUploadController.java`](../src/main/java/com/vguard/validation/fab/controller/FabHierarchyUploadController.java)

### 3.4 FAP Flow

FAP is similar structurally, but the response model is richer:

1. `fap-validation.js` detects a header row with plant, department, and email columns.
2. It converts rows into `FapValidationRowRequest`.
3. It calls `/api/fap/validate`.
4. The backend returns per-row status for user, plant, department, and email-level validation.
5. If all selected rows are valid, the UI exposes three secondary checks:
   - plant-user
   - department-user
   - plant-department
6. Those checks call `/api/fap/checks/{checkType}`.

Backend pieces:

- controller: [`src/main/java/com/vguard/validation/fap/controller/FapValidationController.java`](../src/main/java/com/vguard/validation/fap/controller/FapValidationController.java)
- service: [`src/main/java/com/vguard/validation/fap/service/FapValidationService.java`](../src/main/java/com/vguard/validation/fap/service/FapValidationService.java)

## 4. Package-Level Breakdown

### 4.1 `com.vguard.validation`

This is the original shared package. It contains:

- application bootstrap
- base controllers
- mixed repositories
- simple validation service
- generic models

It currently owns too much of the system.

### 4.2 `com.vguard.validation.fab`

This package is a semi-independent module inside the monolith. It has its own:

- controllers
- DTOs
- services
- repositories
- entities

But it still depends on shared infra and on the second database configuration.

### 4.3 `com.vguard.validation.fap`

This is a lighter module containing:

- one controller
- one service
- DTOs

It reuses shared repositories instead of owning its own domain layer.

### 4.4 `src/main/resources/static`

This folder contains all UI pages and scripts. The front-end is not modularized by feature; instead it is a set of standalone pages plus one very large shared script.

## 5. Data Access Model

The app talks to two logical data sources:

- main app datasource: configured under `spring.datasource.*`
- external user/workflow datasource: configured under `spring.datasource.userdb.*`

Observed pattern:

- some code uses JPA entities with native SQL
- some code uses `JdbcTemplate`
- some repositories query `sd_apps_db` through the `userJdbcTemplate`, which means the naming no longer reflects the true ownership or purpose

## 6. Key Runtime Files To Know First

- bootstrap: [`src/main/java/com/vguard/validation/VguardApplication.java`](../src/main/java/com/vguard/validation/VguardApplication.java)
- second DB config: [`src/main/java/com/vguard/validation/config/UserDbConfig.java`](../src/main/java/com/vguard/validation/config/UserDbConfig.java)
- shared FAT UI shell: [`src/main/resources/static/index.html`](../src/main/resources/static/index.html)
- main front-end orchestration: [`src/main/resources/static/js/app.js`](../src/main/resources/static/js/app.js)
- FAB front-end logic: [`src/main/resources/static/js/fab-validation.js`](../src/main/resources/static/js/fab-validation.js)
- FAP front-end logic: [`src/main/resources/static/js/fap-validation.js`](../src/main/resources/static/js/fap-validation.js)

## 7. Main Problems Slowing Down Onboarding

### 7.1 Repository Hygiene

- Build output is committed: `target/**`
- runtime logs are committed: `application.log`, `server.log`
- sample business spreadsheets live at repo root under the misspelled folder `datamodeluseing/`
- old `.bak` source files remain in `src/main/java`

Why this hurts:

- developers cannot tell source from generated output quickly
- searches return duplicate or stale results
- there is no obvious “clean root” for active code

### 7.2 Mixed Architectural Styles

The code mixes:

- JPA repositories
- native SQL in JPA repositories
- raw `JdbcTemplate`
- controller-level orchestration
- service-level orchestration
- front-end business rules

There is no consistent rule for where logic should live.

### 7.3 Front-End Logic Is Over-Centralized

[`src/main/resources/static/js/app.js`](../src/main/resources/static/js/app.js) is extremely large and acts as:

- file parser
- UI state manager
- API client
- modal coordinator
- insert-flow router
- module switchboard

This is the single biggest front-end maintainability risk.

### 7.4 Domain Boundaries Are Blurry

The system contains at least three domains:

- shared validation/utilities
- FAB
- FAP

But package layout only partially reflects that. Some shared pieces are really FAT-specific; some FAP code depends on shared repositories with domain knowledge embedded in SQL.

### 7.5 Endpoint Design Is Inconsistent

Examples:

- `/api/user/*`
- `/api/users/*`
- `/api/user/{email}`
- `/api/user-exists`
- `/api/validate/emails`

These are related concerns exposed under different controller styles and route conventions.

### 7.6 Naming Problems

Examples observed:

- `datamodeluseing` should be renamed
- `bussiness_partner1` / `bussiness_partner2` in [`FabTaskAssignmentMap`](../src/main/java/com/vguard/validation/fab/entity/FabTaskAssignmentMap.java) carry a misspelling forward from the table model
- some repository names reflect implementation detail instead of business capability
- some methods return IDs but are named like “by-email” login lookups

### 7.7 Documentation Gaps

Before this audit there was:

- no root `README`
- no setup guide
- no architecture guide
- no API map
- no explanation of why two databases exist
- no explanation of which module owns which screens

### 7.8 Environment Risk

[`src/main/resources/application.properties`](../src/main/resources/application.properties) contains hard-coded hostnames and credentials. That is a security issue and also makes safe local onboarding harder.

### 7.9 Tests Do Not Match The Current Design

The FAB test suite in [`src/test/java/com/vguard/validation/fab/FabValidationServiceTest.java`](../src/test/java/com/vguard/validation/fab/FabValidationServiceTest.java) assumes an older design based on `FabPlantMasterRepository`, `FabDepartmentMasterRepository`, and `UserMasterRepository`. The live service now depends on different repositories, so the tests represent historical intent more than current behavior.

## 8. Code-Level Issues Worth Calling Out

### 8.1 Hard-Coded Credentials

[`src/main/resources/application.properties`](../src/main/resources/application.properties) includes raw DB usernames and passwords. This must move to environment variables or a secrets manager.

### 8.2 Shared Validation Uses Async Without Clear Need

[`src/main/java/com/vguard/validation/service/ValidationService.java`](../src/main/java/com/vguard/validation/service/ValidationService.java) uses `CompletableFuture` for two small DB lookups. That adds complexity without a clear executor strategy or throughput benefit.

### 8.3 FAP Department Validation Uses Department Name For A Department Code Field

[`src/main/java/com/vguard/validation/fap/service/FapValidationService.java`](../src/main/java/com/vguard/validation/fap/service/FapValidationService.java) validates `departmentCode` by calling `countInMasterByDepartmentName(...)`. That strongly suggests a field/lookup mismatch.

### 8.4 FAP Secondary Checks Treat `count > 1` As Success

The `executeCountCheck` methods in [`src/main/java/com/vguard/validation/fap/service/FapValidationService.java`](../src/main/java/com/vguard/validation/fap/service/FapValidationService.java) mark a check as satisfied only when `count > 1`. For relationship existence checks, that is suspicious; most systems would treat `count > 0` as success.

### 8.5 FAB Tests Describe Features The Current Service Does Not Implement

The current FAB service checks simple existence. The tests describe richer rules such as:

- inactive plant/user handling
- plant-department ownership checks
- duplicate warnings

That gap makes it unclear whether code regressed or tests were never updated.

### 8.6 Entity/Table Mapping Is Inconsistent

`PlantEntity` and `DepartmentEntity` map to local table names `plant` and `department`, while many repositories query `sd_apps_db.app_vg_*` tables directly. That split is confusing and suggests partial migration or abandoned abstraction.

## 9. Setup Notes For A New Developer

### 9.1 Prerequisites

- Java 17
- Maven
- access to the relevant MySQL schemas if running against real data

### 9.2 Profiles

- default profile:
  - uses remote MySQL endpoints
  - not safe as-is for general local use
- `dev` profile:
  - uses H2 for primary datasource
  - still may not fully support all flows because many queries assume MySQL schemas and cross-database table names

### 9.3 Run

```powershell
mvn spring-boot:run
```

### 9.4 Test Status

Attempted validation command:

```powershell
mvn test
```

Result:

- could not run because `JAVA_HOME` is not configured in the current environment

## 10. Current API Surface Summary

### Shared / FAT-ish

- `POST /api/validate`
- `POST /api/validate/batch`
- `POST /api/validate/emails`
- `POST /api/plant`
- `POST /api/department`
- `GET /api/user/{email}`
- `GET /api/user-exists`
- `GET /api/user/details`
- `GET /api/user/get-username`
- `GET /api/user/get-userid`
- `GET /api/users/by-email`
- `GET /api/users/full-name`
- `GET /api/member/roles`
- `GET /api/member/instances`
- `GET /api/member/processes`
- `GET /api/member/processes-by-app`
- `GET /api/member/check-user-role`
- `POST /api/member/insert`
- `GET /api/plant/mapping`
- `POST /api/plant/mapping/insert`
- `GET /api/hierarchy/check`
- `GET /api/hierarchy/all`
- `GET /api/hierarchy/plant/{plantCode}`
- `GET /api/hierarchy/department/{deptCode}`
- `POST /api/hierarchy/recipient/insert`

### FAB

- `POST /api/fab/validate`
- `POST /api/fab/department`
- `GET /api/fab/hierarchy/check`
- `POST /api/fab/hierarchy/recipient/insert`
- `GET /api/fab/hierarchy/plant/{code}`
- `GET /api/fab/hierarchy/department/{code}`
- `GET /api/fab/hierarchy/department-id`
- `POST /api/fab/hierarchy/upload`
- `POST /api/fab/department/insert`
- `GET /api/fab/department/all`
- `GET /api/fab/department/code/{code}`

### FAP

- `POST /api/fap/validate`
- `POST /api/fap/checks/{checkType}`

## 11. Recommended Refactor Order

1. Clean the repository surface area.
2. Introduce a real package-by-feature structure.
3. Move DB config and API clients behind clearer abstractions.
4. Break `app.js` into shared UI utilities plus module-specific scripts.
5. Normalize endpoint naming.
6. Rebuild tests around the current behavior or restore the richer intended rules.
7. Externalize secrets and environment-specific settings.

## 12. Bottom Line

The codebase is workable, but it feels like several internal tools were merged into one application without a final architecture pass. The fastest path to making it scalable is not a full rewrite; it is a staged cleanup that establishes clear feature ownership, isolates database access, and turns the UI into smaller module-oriented pieces.
