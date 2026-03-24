# Excel Validation Portal

Spring Boot application for internal fixed-asset workflow support across multiple modules:

- `FAT` for plant, department, user-role, and hierarchy checks
- `FAB` for Excel-driven task-assignment validation
- `FAP` for row-level validation plus follow-up relationship checks
- Shared lookup/insert utilities for plants, departments, members, and mappings

This repository currently behaves like a single deployable app that hosts:

- backend APIs under `src/main/java/com/vguard/validation`
- static HTML/JS pages under `src/main/resources/static`
- direct database access to both `sd_apps_db` and the external `users`/workflow database

## Start Here

- Project audit and onboarding guide: `docs/PROJECT_AUDIT.md`
- Proposed scalable structure and refactor plan: `docs/TARGET_STRUCTURE.md`

## Current Tech Stack

- Java 17
- Spring Boot 3.2
- Spring Web
- Spring Data JPA
- JdbcTemplate
- MySQL
- Apache POI
- Static HTML/CSS/JavaScript frontend

## Local Run Notes

1. Set `JAVA_HOME` to a Java 17 installation.
2. Review `src/main/resources/application.properties`.
3. The default profile points to live-style MySQL hosts and includes hard-coded credentials.
4. The `dev` profile is H2-based, but not all code paths are portable to H2 because much of the SQL is MySQL-specific and assumes external schemas.
5. Start with:

```powershell
mvn spring-boot:run
```

## Important Reality Check

This repo contains production-style logic, but it is not yet organized like a clean production system. The added docs are intended to make onboarding practical before deeper refactoring begins.
