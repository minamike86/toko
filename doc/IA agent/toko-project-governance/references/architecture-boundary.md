# Architecture Boundary

Gunakan dokumen ini saat request menyangkut DDD, layer, folder, code review, dependency, wiring, atau clean code.

## Source Documents

- architecture_overview.md
- folder_structure.md
- DDD Boundaries.md
- clean-code-guidelines.md
- Human–AI Collaboration Guidelines.md

## Core Rules

- Domain berisi entity, value object, behavior, dan invariant.
- Application berisi use case dan orchestration.
- Infrastructure berisi repository implementation, Prisma, database, dan IO.
- UI / HTTP hanya parsing request, mapping DTO, memanggil use case, dan mapping response.
- Cross-module interaction wajib melalui port, adapter, atau application layer.
- Jangan gunakan `any`.
- Jangan bypass container.
- Jangan letakkan business rule di UI, infrastructure, reporting, atau test helper.

## Violation Signals

- Prisma di domain/application/UI.
- Repository implementation di-import application.
- Use case dibuat langsung di UI route.
- Domain mengetahui role, HTTP, Prisma, atau framework.
