# Testing and Reporting Rules

Gunakan dokumen ini saat request menyangkut test, reporting, dashboard, query, integration test, atau architecture test.

## Source Documents

- Testing Strategy.md
- Unit Test Guidelines.md
- Vitest Setup.md
- testing_boundary_integration_policy.md
- reporting_boundary_and_testing_policy.md
- architecture_test_specification_reporting_boundary.md
- internal_reporting_vs_fiscal_reporting.md
- prisma_client_reporting_test_db_strategy.md

## Testing Rules

### Domain Test

- Menguji invariant.
- Tidak boleh Prisma.
- Tidak boleh database.

### Application Test

- Menguji orchestration use case.
- Repository di-mock lewat interface.
- Minimal satu negative test.

### Integration Test

- Boleh memakai Prisma dan database test.
- Hanya untuk skenario bernilai tinggi.

### Architecture Test

- Menjaga boundary.
- Gagal berarti architecture violation.

## Reporting Rules

Reporting bersifat read-only dan observasional.

Reporting tidak boleh:

- memiliki domain entity
- memiliki invariant
- memanggil mutation use case
- menulis data
- menjadi accounting/fiscal/tax domain

Jika reporting membutuhkan lifecycle, invariant, period locking, journal, correction entry, atau fiscal snapshot, klasifikasikan sebagai domain baru.
