# Proposed Target Structure

## 1. Goals

The target structure should:

- separate shared infrastructure from business features
- make FAT, FAB, and FAP explicit first-class modules
- isolate database and transport concerns
- give frontend code a module-based layout instead of one large script

## 2. Proposed Folder Tree

```text
excel-validation/
├── README.md
├── docs/
│   ├── PROJECT_AUDIT.md
│   ├── TARGET_STRUCTURE.md
│   ├── api/
│   │   ├── fat.md
│   │   ├── fab.md
│   │   └── fap.md
│   └── onboarding/
│       ├── local-setup.md
│       ├── environments.md
│       └── troubleshooting.md
├── scripts/
│   ├── dev.ps1
│   ├── test.ps1
│   └── package.ps1
├── src/
│   ├── main/
│   │   ├── java/com/vguard/workflow/
│   │   │   ├── Application.java
│   │   │   ├── shared/
│   │   │   │   ├── config/
│   │   │   │   ├── exception/
│   │   │   │   ├── web/
│   │   │   │   ├── db/
│   │   │   │   └── util/
│   │   │   ├── fat/
│   │   │   │   ├── api/
│   │   │   │   ├── application/
│   │   │   │   ├── domain/
│   │   │   │   ├── infrastructure/
│   │   │   │   └── ui/
│   │   │   ├── fab/
│   │   │   │   ├── api/
│   │   │   │   ├── application/
│   │   │   │   ├── domain/
│   │   │   │   ├── infrastructure/
│   │   │   │   └── ui/
│   │   │   └── fap/
│   │   │       ├── api/
│   │   │       ├── application/
│   │   │       ├── domain/
│   │   │       ├── infrastructure/
│   │   │       └── ui/
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-dev.yml
│   │       ├── application-local.yml
│   │       ├── db/
│   │       │   ├── migration/
│   │       │   └── seed/
│   │       └── static/
│   │           ├── assets/
│   │           ├── shared/
│   │           │   ├── css/
│   │           │   └── js/
│   │           ├── fat/
│   │           │   ├── index.html
│   │           │   └── js/
│   │           ├── fab/
│   │           │   ├── index.html
│   │           │   └── js/
│   │           └── fap/
│   │               ├── index.html
│   │               └── js/
│   └── test/
│       ├── java/
│       │   ├── fat/
│       │   ├── fab/
│       │   └── fap/
│       └── resources/
├── samples/
│   ├── excel/
│   └── sql/
└── .gitignore
```

## 3. Naming Guidance

### Package Naming

Use business capabilities, not generic technical buckets:

- `fat.api.UserRoleController`
- `fat.application.UserRoleService`
- `fat.infrastructure.persistence.MemberJdbcRepository`

Avoid generic names like:

- `ValidationController`
- `ValidationService`
- `TestController`
- `insert.js`

### Endpoint Naming

Prefer resource-oriented endpoints:

- `GET /api/fat/users/{email}`
- `GET /api/fat/users/{userId}/roles`
- `POST /api/fat/plants`
- `POST /api/fat/departments`
- `POST /api/fat/hierarchy-recipients`
- `POST /api/fab/validations`
- `POST /api/fap/validations`
- `POST /api/fap/checks/plant-user`

### Front-End File Naming

Replace generic files like:

- `app.js`
- `insert.js`

With feature-specific names like:

- `fat-validation-page.js`
- `fat-hierarchy-modal.js`
- `fat-member-insert-page.js`
- `shared-excel-parser.js`
- `shared-api-client.js`

## 4. Separation Of Concerns

### Current Problem

Controllers, services, repositories, and front-end scripts all contain business rules.

### Target Rule

- `api/`: HTTP request/response mapping only
- `application/`: use cases, orchestration, transactions
- `domain/`: business rules, validation logic, domain models
- `infrastructure/`: SQL, JPA, external system access
- `ui/`: page-specific static assets or server-side view wiring

## 5. Suggested Backend Refactor Mapping

### Shared

Move:

- `config/*` -> `shared/config`
- generic exception handling -> `shared/web`
- datasource config -> `shared/db`

### FAT

Move from current shared package into `fat`:

- `ValidationController`
- `UserDetailsController`
- `UserLookupController`
- `PlantMappingController`
- `MemberController`
- `HierarchyController`
- `ValidationService`
- related repositories and models

### FAB

Keep under `fab`, but split by responsibility:

- `fab/api`
- `fab/application`
- `fab/domain`
- `fab/infrastructure`

### FAP

Create the same layering instead of keeping all logic in one service.

## 6. Suggested Front-End Refactor Mapping

### Shared UI

Extract from `app.js`:

- API helpers
- toast/modal helpers
- Excel parsing helpers
- common row/column normalization

### FAT UI

Create dedicated files for:

- upload + parse flow
- results rendering
- user detail modal
- member insert modal
- plant mapping modal
- hierarchy modal

### FAB UI

Keep FAB-specific parsing and results rendering separate from FAT.

### FAP UI

Keep FAP validation and secondary checks fully separate from FAT and FAB.

## 7. Example Refactored Backend File Design

### Example: FAT plant validation API

```java
package com.vguard.workflow.fat.api;

@RestController
@RequestMapping("/api/fat/validations")
public class FatValidationController {
    private final FatValidationUseCase useCase;

    @PostMapping
    public ResponseEntity<FatValidationResponse> validate(@RequestBody FatValidationRequest request) {
        return ResponseEntity.ok(useCase.validate(request));
    }
}
```

```java
package com.vguard.workflow.fat.application;

@Service
public class FatValidationUseCase {
    private final PlantLookupGateway plantLookupGateway;
    private final DepartmentLookupGateway departmentLookupGateway;

    public FatValidationResponse validate(FatValidationRequest request) {
        // Orchestrate use case only
    }
}
```

```java
package com.vguard.workflow.fat.infrastructure.persistence;

@Repository
public class PlantJdbcRepository implements PlantLookupGateway {
    private final JdbcTemplate jdbcTemplate;

    @Override
    public boolean existsByPlantCode(String plantCode) {
        // SQL lives here, not in controller/service
    }
}
```

## 8. Example Refactored Front-End Split

```text
static/fat/js/
├── fat-page.js
├── fat-upload.js
├── fat-results-table.js
├── fat-hierarchy-modal.js
├── fat-member-modal.js
└── fat-api.js
```

This keeps one responsibility per file and makes debugging far easier than a single multi-thousand-line script.

## 9. Cleanup Actions To Apply Early

1. Add `.gitignore` for `target/`, logs, IDE files, and temporary spreadsheets.
2. Move sample spreadsheets into `samples/excel/`.
3. Move SQL notes into `docs/` or `samples/sql/`.
4. Delete `.bak` files after confirming they are obsolete.
5. Remove committed build artifacts.
6. Normalize route naming before adding more endpoints.

## 10. Immediate Next Sprint Recommendation

If this were a real cleanup engagement, the next safest incremental implementation would be:

1. Add `.gitignore` and clean repo noise.
2. Extract `app.js` into shared plus FAT-specific modules.
3. Move FAT code from `com.vguard.validation` into a dedicated `fat` package.
4. Introduce a proper service/gateway layer for user and hierarchy lookups.
5. Rewrite FAB tests so they match the current service or restore the richer rules intentionally.
