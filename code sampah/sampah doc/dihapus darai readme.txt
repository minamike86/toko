📌 Perubahan pada MVP Step 1 dan Step 2 saat ini hanya diperbolehkan
melalui ADR yang telah berstatus **Approved**.
Urutan implementasi dan kebijakan testing mengacu pada
Implementation Lock Notes.

**Phase 1 – Payment Settlement: Implemented & Locked**
Satu kalimat: payment dicatat sebagai fakta, order recomputed dari payment, read-only reporting menyusul di Step 3.

Phase 2.1 – Product Variant: DESIGN LOCKED
Phase 2.2 – Stock Origin: DESIGN LOCKED



### Architecture Test Specification (MVP Step 3)

Selain kebijakan tertulis, MVP Step 3 – Reporting dilengkapi dengan **Architecture Test Specification** yang mendefinisikan serangkaian test preventif untuk menegakkan boundary reporting secara teknis.
Dokumen `architecture_test_specification_reporting_boundary.md` berisi spesifikasi test (Given / When / Then) yang **WAJIB PASS** sebelum implementasi Step 3 dianggap valid. Test ini memastikan reporting tetap read-only, tidak bergantung pada domain atau use case mutasi, serta mematuhi struktur dan dependency yang telah dikunci. Kegagalan test dianggap sebagai **pelanggaran desain**, bukan bug fungsional.

Inventory Snapshot Report telah diimplementasikan dan
terkunci sebagai bagian dari MVP Step 3.

Integration tests use schema-per-suite strategy and must run serially (see integration_test_db_strategy_schema_per_suite_design_locked.md)

Referensi tambahan:
- /docs/03-mvp/MVP-step-3/testing/sales-integration-happy-path.md
- /docs/03-mvp/MVP-step-3/testing/test-helper-contract.md
- /docs/03-mvp/MVP-step-3/architecture/integration_test_db_strategy_schema_per_suite_design_locked.md