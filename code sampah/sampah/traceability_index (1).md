# Traceability Index

### Status  
REFERENCE INDEX — STRUCTURAL MAPPING DOCUMENT

---

## Tujuan

Dokumen ini berfungsi sebagai:

- peta struktur dokumentasi dan codebase
- penghubung antara dokumen domain, use case, ADR, dan implementasi
- referensi navigasi artefak sistem

Dokumen ini tidak mengandung status, evaluasi, atau keputusan completion.

---

## Batasan

Dokumen ini:

- tidak boleh mengandung status eksekusi
- tidak boleh mengandung missing artifacts
- tidak boleh menjadi sumber keputusan COMPLETE / INCOMPLETE / INVALID

Jika terjadi konflik, dokumen domain, arsitektur, ADR, dan use case tetap lebih tinggi daripada index ini.

---

# 1. Overview Documents

- product-vision.md
- MVP Roadmap dan Arsitektur Awal.md
- Non-Goals.md
- documentation_lifecycle_policy.md
- circle_update_fitur_dokumentasi.md
- log_note_writing_guidelines.md

---

# 2. Architecture Documents

- architecture_overview.md
- folder_structure.md
- DDD Boundaries.md
- clean-code-guidelines.md
- error-handling-guidelines.md
- authorization-boundary.md
- audit-trail-policy.md
- Human–AI Collaboration Guidelines.md
- integration_test_db_strategy_schema_per_suite_design_locked.md
- inventory_mutation_implementation_guide.md
- prisma_client_reporting_test_db_strategy.md

## Reporting Architecture

- reporting_boundary_and_testing_policy.md
- architecture_test_specification_reporting_boundary.md
- customer_aging_receivable_design.md
- internal_reporting_vs_fiscal_reporting.md

---

# 3. Domain Documents

- catalog_domain.md
- inventory_domain.md
- sales_domain.md
- user_domain_minimal_operational_identity_layer.md
- domain_overview.md
- domain_glossary.md

---

# 4. Use Case Documents

- Create Order.md
- Cancel Order.md
- Pay Credit.md
- Receive Stock (Use Case).md
- Adjust Stock.md
- issue_stock.md
- check_inventory_consistency_use_case.md
- initialize_stock_use_case.md

---

# 5. MVP Execution Documents

## Core MVP Documents

- mvp_stages_overview.md
- mvp_step_1_core_transaction.md
- mvp_step_2_operational_stability.md
- mvp_step_3_reporting_lock-note.md
- mvp_step_4_Domain_Hardening_&_Catalog_Activation_lock_note.md
- MVP_step_5_operational_dashboard_and_cash_clarity_implementation_plan.md
- MVP_step_6_procurement_cost_foundation_implementation_plan.md

## Step 4 Documents

- step_4_hardening_governance.md
- step_4_1_stock_origin_documented_deviation.md
- step_4_2_payment_settlement_execution_plan.md
- step_4_2_hardening_optimistic_locking.md
- step_4_3_product_variant_activation_implementation_plan.md
- step_4_4_inventory_consistency_implementation_plan.md
- step_4_4_full_inventory_consistency_document.md
- inventory_reconciliation_spec_step_4_4.md
- step_4_4_batch_3_inventory_consistency_test_plan.md
- step_4_4_batch_4_persistence_cleanup_and_closure.md
- Step 4.5 — Architecture Cleanup Plan (Post Batch 4).md

## Step 5 Documents

- Step 5.4 – Operational Identity & Actor Tracking (Implementation Plan).md
- Step 5.4 – Operational Identity & Actor Tracking (Execution Plan).md
- Step 5.4 is officially CLOSED.md
- Step 5.5 – Dashboard Presentation & Operational Visibility.md
- step_5_dashboard_implementation_notes.md
- step_5_operational_dashboard_closure_report.md

## Step 6 Documents

- step_6_batch_1_foundation_design.md
- step_6_batch_2_Receive_Flow_Activation.md
- Step_6_Batch_3_Clarification_&_Cancel_Flow_Design.md
- Step_6_Batch_3_Delivery_Integration.md
- secondary_review_notes_step_6_batch_2.md
- secondary_conversation_step_6_cancel_flow_context.md

---

# 6. Decision Records (ADR)

- ADR-0006-Integration Test Boleh Menggunakan Prisma.md
- ADR-0007-payment_settlement.md
- ADR-0008-stock_origin_classification.md
- ADR-0009-product_variant_modeling.md
- ADR_0010-tech_debt_receive_stock_atomicity.md
- ADR_0011_missing_issue_stock_specification.md
- ADR_0012_inventory_mutation_pattern.md
- ADR_0013_introduce_procurement_domain.md
- ADR_0014_introduce_customer_domain.md
- adr_0015_0018_and_mvp_steps_security_customer_procurement_accounting.md

---

# 7. Testing Documents

- Testing Strategy.md
- Unit Test Guidelines.md
- Vitest Setup.md
- testing_boundary_integration_policy.md

---

# 8. Operations Documents

- environment_setup.md
- migration_playbook_production_ready.md
- backup_policy_and_procedure.md
- backup_admin_panel_design.md
- logging-strategy.md
- sop_operasional_harian.md
- sop_transisi_manual_ke_digital.md

---

# 9. Codebase Mapping

## Root Structure

- prisma/
- src/app
- src/components
- src/modules
- src/shared
- src/tests
- src/wiring

## Critical Infrastructure Files

- src/wiring/container.ts
- prisma/schema.prisma
- src/shared/prisma.ts
- src/shared/system/SystemStateRepository.ts
- src/shared/system/PrismaSystemStateRepository.ts
- src/shared/system/application/AuthorizationGuard.ts
- src/shared/system/application/ToggleMaintenance.ts
- src/shared/system/MaintenanceGuard.ts
- src/shared/system/types/actor-context.ts
- src/shared/audit/AuditTrail.ts
- src/shared/audit/AuditEvent.ts
- src/shared/logging/Logger.ts
- src/shared/logging/LogContext.ts
- src/shared/errors/ApplicationError.ts
- src/shared/errors/DomainError.ts

## Modules

- catalog
- sales
- inventory
- procurement
- reporting
- dashboard
- user

---

# 10. Use Case Traceability Mapping

## Sales

### Create Order

- Doc: doc/04-use-cases/Create Order.md
- Code: src/modules/sales/application/CreateOrder.ts
- Test: src/modules/sales/tests/CreateOrder.test.ts

### Cancel Order

- Doc: doc/04-use-cases/Cancel Order.md
- Code: src/modules/sales/application/CancelOrder.ts
- Test: src/modules/sales/tests/CancelOrder.test.ts

### Pay Credit

- Doc: doc/04-use-cases/Pay Credit.md
- Code: src/modules/sales/application/PayCredit.ts
- Test: src/modules/sales/tests/PayCredit.test.ts

## Inventory

### Receive Stock

- Doc: doc/04-use-cases/Receive Stock (Use Case).md
- Code: src/modules/inventory/application/ReceiveStock.ts
- Test: src/modules/inventory/tests/ReceiveStock.test.ts

### Adjust Stock

- Doc: doc/04-use-cases/Adjust Stock.md
- Code: src/modules/inventory/application/AdjustStock.ts
- Test: src/modules/inventory/tests/AdjustStock.test.ts

### Issue Stock

- Doc: doc/04-use-cases/issue_stock.md
- Code: src/modules/inventory/application/IssueStock.ts
- Test: src/modules/inventory/tests/IssueStock.test.ts

### Check Inventory Consistency

- Doc: doc/04-use-cases/check_inventory_consistency_use_case.md
- Code: src/modules/inventory/application/CheckInventoryConsistency.ts
- Test: tidak ada file test dengan nama spesifik terpisah; coverage berada pada suite inventory consistency Step 4.4

## Procurement

### Create Purchase Order

- Doc: belum ada dokumen use case khusus di folder 04-use-cases
- Code: src/modules/procurement/application/use-cases/CreatePurchaseOrder.ts
- Test: src/modules/procurement/tests/application/CreatePurchaseOrder.test.ts

### Cancel Purchase Order

- Doc: belum ada dokumen use case khusus di folder 04-use-cases
- Code: src/modules/procurement/application/use-cases/CancelPurchaseOrder.ts
- Test: src/modules/procurement/tests/application/CancelPurchaseOrder.test.ts

### Receive Purchase Order

- Doc: belum ada dokumen use case khusus di folder 04-use-cases
- Code: src/modules/procurement/application/use-cases/ReceivePurchaseOrder.ts
- Test: src/modules/procurement/tests/application/ReceivePurchaseOrder.test.ts

### Create Supplier

- Doc: belum ada dokumen use case khusus di folder 04-use-cases
- Code: src/modules/procurement/application/use-cases/CreateSupplier.ts
- Test: src/modules/procurement/tests/application/CreateSupplier.test.ts

### Update Supplier Status

- Doc: belum ada dokumen use case khusus di folder 04-use-cases
- Code: src/modules/procurement/application/use-cases/UpdateSupplierStatus.ts
- Test: src/modules/procurement/tests/application/UpdateSupplierStatus.test.ts

---

# 11. Traceability Coverage Rule

Setiap use case yang ingin dianggap fully traceable harus memiliki:

- Doc
- Code
- Test

Dokumen ini hanya mencatat keberadaan artefak. Evaluasi completion dilakukan di `execution_status.md`.

