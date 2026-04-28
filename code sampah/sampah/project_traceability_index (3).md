# Project Traceability Index

### Status  

REFERENCE INDEX — OPERATIONAL CONTROL DOCUMENT

---

## Tujuan

Dokumen ini berfungsi sebagai:

- alat kontrol kelengkapan artefak (dokumen + kode)
- alat traceability antara roadmap, ADR, domain, use case, dan implementasi
- alat bantu AI / developer untuk menentukan langkah berikutnya
- checkpoint sebelum menyatakan sebuah step selesai

Dokumen ini **tidak mendefinisikan desain** dan **bukan source of truth sistem**.

---

## Batasan

Dokumen ini:

- tidak boleh menggantikan ADR, domain doc, atau use case
- tidak boleh menjadi tempat definisi rule baru
- hanya berfungsi sebagai index dan alat audit

Jika terjadi konflik:
→ dokumen arsitektur dan domain adalah sumber kebenaran

---

## Source of Truth Priority  ← TARUH DI SINI

1. Domain Document
2. Architecture Document
3. ADR
4. Use Case Document
5. Implementation Code
6. This Index (reference only)

---

## Aturan Penggunaan

Sebelum menyatakan sebuah fitur / step selesai, wajib cek:

1. ADR sudah ada (jika perubahan desain)
2. domain document sudah dibuat / diupdate
3. use case sudah dibuat / diupdate
4. implementasi utama sudah ada
5. test sudah ada
6. log note / closure sudah ada

Jika salah satu belum terpenuhi:
→ status = BELUM SELESAI

---

## Feature Progress Validation

Urutan WAJIB:

1. ADR
2. Domain Update
3. Use Case
4. Implementation
5. Testing
6. Log Note

Jika urutan dilanggar:
→ INVALID EXECUTION

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

## Core Steps

- mvp_stages_overview.md
- mvp_step_1_core_transaction.md
- mvp_step_2_operational_stability.md
- mvp_step_3_reporting_lock-note.md
- mvp_step_4_Domain_Hardening_&_Catalog_Activation_lock_note.md
- MVP_step_5_operational_dashboard_and_cash_clarity_implementation_plan.md
- MVP_step_6_procurement_cost_foundation_implementation_plan.md

## Step 4

- step_4_hardening_governance.md
- step_4_1_stock_origin_documented_deviation.md
- step_4_2_payment_settlement_execution_plan.md
- step_4_3_product_variant_activation_implementation_plan.md
- step_4_4_inventory_consistency_implementation_plan.md
- step_4_4_full_inventory_consistency_document.md

## Step 5

- step_5_dashboard_implementation_notes.md
- step_5_operational_dashboard_closure_report.md

## Step 6

- step_6_batch_1_foundation_design.md
- step_6_batch_2_Receive_Flow_Activation.md
- Step_6_Batch_3_Clarification_&_Cancel_Flow_Design.md
- Step_6_Batch_3_Delivery_Integration.md

### Step 6 Status (REAL)

- ADR: ✅
- Domain Update: ⚠️ (procurement belum update penuh)
- Use Case: ✅
- Implementation: ✅
- Test: ⚠️ (belum semua edge case)
- Log Note: ❌

STATUS: INCOMPLETE

## Step ↔ Module Mapping

### Step 6

Modules:

- procurement (primary)
- inventory (stock integration)
- reporting (impact from procurement)

Use Cases:

- ReceivePurchaseOrder
- CancelPurchaseOrder

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

# 9. Codebase Mapping (High Level)

## Root Structure

- prisma/
- src/app
- src/components
- src/modules
- src/shared
- src/tests
- src/wiring

(ref: source data file)

---

## Critical Infrastructure Files (Explicit Tracking)

Dokumen ini WAJIB melacak file penting yang berperan sebagai backbone sistem.

### Wiring / Dependency Injection

- src/wiring/container.ts  ← ENTRY POINT dependency injection (CRITICAL)

### Prisma Layer

- prisma/schema.prisma

### System / Shared Core

- src/shared/prisma.ts
- src/shared/system/SystemStateRepository.ts
- src/shared/system/PrismaSystemStateRepository.ts
- src/shared/system/application/AuthorizationGuard.ts
- src/shared/system/application/ToggleMaintenance.ts
- src/shared/system/MaintenanceGuard.ts
- src/shared/system/types/actor-context.ts

### Shared Operational Core

- src/shared/audit/AuditTrail.ts
- src/shared/audit/AuditEvent.ts
- src/shared/logging/Logger.ts
- src/shared/logging/LogContext.ts
- src/shared/errors/ApplicationError.ts
- src/shared/errors/DomainError.ts

Aturan:

- file dalam section ini harus eksplisit disebut
- tidak boleh hanya implicit lewat folder
- jika salah satu file kritikal hilang, status readiness harus diturunkan

---

## Modules

- catalog
- sales
- inventory
- procurement
- reporting
- dashboard
- user

---

## Key Use Case Implementation

### Sales

- CreateOrder
- CancelOrder
- PayCredit

### Inventory

- ReceiveStock
- IssueStock
- AdjustStock
- CheckInventoryConsistency

### Procurement

- CreatePurchaseOrder
- CancelPurchaseOrder
- ReceivePurchaseOrder
- CreateSupplier
- UpdateSupplierStatus

### Reporting

- get-sales-summary-report
- get-inventory-snapshot-report
- get-inventory-low-stock-report
- get-credit-outstanding-report

---

## Traceability Coverage Rule

Setiap use case WAJIB memiliki:

- Doc
- Code
- Test
- Status

Jika tidak:
→ TRACEABILITY INCOMPLETE

## Use Case Coverage Check

| Use Case | Doc | Code | Test | Status |
|---------|-----|------|------|--------|
| Create Order | ✅ | ✅ | ✅ | COMPLETE |
| Cancel Purchase Order | ❌ | ✅ | ✅ | INVALID |

## Verification Rule

- ✅ = diverifikasi via code inspection / test
- ⚠️ = indikasi ada, belum diverifikasi
- ❌ = belum ada

## Use Case Traceability Mapping

### Create Order

- Doc: doc/04-use-cases/Create Order.md
- Code: src/modules/sales/application/CreateOrder.ts
- Test: src/modules/sales/tests/CreateOrder.test.ts

Status: ✅

---

## Critical File Tracking per Module

### Sales Module

**Domain**

- src/modules/sales/domain/Order.ts
- src/modules/sales/domain/OrderItem.ts
- src/modules/sales/domain/Payment.ts
- src/modules/sales/domain/OrderRepository.ts
- src/modules/sales/domain/PaymentRepository.ts
- src/modules/sales/domain/SalesErrors.ts

**Application**

- src/modules/sales/application/CreateOrder.ts
- src/modules/sales/application/CancelOrder.ts
- src/modules/sales/application/PayCredit.ts
- src/modules/sales/application/CreateOrderDTO.ts
- src/modules/sales/application/ports/TransactionRunner.ts

**Infrastructure**

- src/modules/sales/infrastructure/PrismaOrderRepository.ts
- src/modules/sales/infrastructure/PrismaPaymentRepository.ts
- src/modules/sales/infrastructure/PrismaTransactionRunner.ts

**Tests**

- src/modules/sales/tests/CreateOrder.test.ts
- src/modules/sales/tests/CancelOrder.test.ts
- src/modules/sales/tests/PayCredit.test.ts
- src/modules/sales/tests/integration/CreateAndCancelOrder.integration.test.ts
- src/modules/sales/tests/integration/PayCredit.prisma.integration.test.ts

### Sales Module Health

- Domain: ⚠️ belum diverifikasi
- Use Case: ⚠️ belum diverifikasi
- Repository: ⚠️ belum diverifikasi
- Integration Test: ⚠️ belum diverifikasi

Status: UNKNOWN

### Inventory Module

**Domain**

- src/modules/inventory/domain/InventoryItem.ts
- src/modules/inventory/domain/StockMovement.ts
- src/modules/inventory/domain/InventoryRepository.ts

**Application**

- src/modules/inventory/application/ReceiveStock.ts
- src/modules/inventory/application/IssueStock.ts
- src/modules/inventory/application/AdjustStock.ts
- src/modules/inventory/application/CheckInventoryConsistency.ts
- src/modules/inventory/application/ReceivePurchaseStock.ts
- src/modules/inventory/application/InventoryService.ts

**Infrastructure**

- src/modules/inventory/infrastructure/PrismaInventoryRepository.ts
- src/modules/inventory/infrastructure/InventoryServiceAdapter.ts
- src/modules/inventory/infrastructure/InMemoryInventoryRepository.ts

**Tests**

- src/modules/inventory/tests/ReceiveStock.test.ts
- src/modules/inventory/tests/IssueStock.test.ts
- src/modules/inventory/tests/AdjustStock.test.ts
- src/modules/inventory/tests/ConcurrentIssueStock.test.ts

### Inventory Module Health

- Domain: ✅
- Use Case: ✅
- Prisma Repository: ✅
- Wired to container: ⚠️
- Integration Test: ✅

Status: PARTIAL VERIFIED

### Procurement Module

**Domain**

- src/modules/procurement/domain/PurchaseOrder.ts
- src/modules/procurement/domain/PurchaseItem.ts
- src/modules/procurement/domain/Supplier.ts
- src/modules/procurement/domain/PurchaseOrderRepository.ts
- src/modules/procurement/domain/SupplierRepository.ts
- src/modules/procurement/domain/ProcurementErrors.ts

**Application**

- src/modules/procurement/application/use-cases/CreatePurchaseOrder.ts
- src/modules/procurement/application/use-cases/CancelPurchaseOrder.ts
- src/modules/procurement/application/use-cases/ReceivePurchaseOrder.ts
- src/modules/procurement/application/use-cases/CreateSupplier.ts
- src/modules/procurement/application/use-cases/UpdateSupplierStatus.ts
- src/modules/procurement/application/ports/CatalogSnapshotPort.ts
- src/modules/procurement/application/ports/InventoryProcurementPort.ts

**Infrastructure**

- src/modules/procurement/infrastructure/InventoryProcurementAdapter.ts
- src/modules/procurement/infrastructure/prisma/PrismaPurchaseOrderRepository.ts
- src/modules/procurement/infrastructure/prisma/PrismaSupplierRepository.ts

**Tests**

- src/modules/procurement/tests/architecture/procurement-boundary.test.ts
- src/modules/procurement/tests/application/CreatePurchaseOrder.test.ts
- src/modules/procurement/tests/application/CancelPurchaseOrder.test.ts
- src/modules/procurement/tests/application/ReceivePurchaseOrder.test.ts
- src/modules/procurement/tests/integration/PrismaPurchaseOrderRepository.integration.test.ts
- src/modules/procurement/tests/integration/ReceivePurchaseOrder.integration.test.ts

### Procurement Module Health

- Domain: ⚠️ belum diverifikasi
- Use Case: ⚠️ belum diverifikasi
- Repository: ⚠️ belum diverifikasi
- Integration Test: ⚠️ belum diverifikasi

Status: UNKNOWN

### Reporting Module

**Application**

- src/modules/reporting/application/get-sales-summary-report.ts
- src/modules/reporting/application/get-inventory-snapshot-report.ts
- src/modules/reporting/application/get-inventory-low-stock-report.ts
- src/modules/reporting/application/get-inventory-movement-history-report.ts
- src/modules/reporting/application/get-credit-outstanding-report.ts
- src/modules/reporting/application/get-credit-payment-history-report.ts

**Queries**

- src/modules/reporting/queries/sales-summary.query.ts
- src/modules/reporting/queries/inventory-snapshot.query.ts
- src/modules/reporting/queries/inventory-low-stock.query.ts
- src/modules/reporting/queries/inventory-movement-history.query.ts
- src/modules/reporting/queries/credit-outstanding.query.ts
- src/modules/reporting/queries/credit-payment-history.query.ts

**DTO**

- src/modules/reporting/dto/sales-summary.dto.ts
- src/modules/reporting/dto/inventory-snapshot-report.dto.ts
- src/modules/reporting/dto/inventory-low-stock.dto.ts
- src/modules/reporting/dto/inventory-movement-history.dto.ts
- src/modules/reporting/dto/credit-outstanding.dto.ts
- src/modules/reporting/dto/credit-payment-history.dto.ts

**Tests**

- src/tests/architecture/reporting-boundary.test.ts
- src/modules/reporting/tests/integration/sales-summary.integration.test.ts
- src/modules/reporting/tests/integration/inventory-snapshot.integration.test.ts
- src/modules/reporting/tests/integration/inventory-low-stock.integration.test.ts
- src/modules/reporting/tests/integration/credit-outstanding.integration.test.ts
- src/modules/reporting/tests/integration/credit-payment-history.integration.test.ts

### Reporting Module Health

- Domain: ⚠️ belum diverifikasi
- Use Case: ⚠️ belum diverifikasi
- Repository: ⚠️ belum diverifikasi
- Integration Test: ⚠️ belum diverifikasi

Status: UNKNOWN

### Dashboard Module

**Application**

- src/modules/dashboard/application/get-cash-clarity-dashboard.ts
- src/modules/dashboard/application/get-warehouse-dashboard.ts

**DTO**

- src/modules/dashboard/dto/cash-clarity.dto.ts
- src/modules/dashboard/dto/warehouse-dashboard.dto.ts

**Presentation**

- src/app/page.tsx
- src/app/dashboard/page.tsx
- src/components/dashboard/SummaryCards.tsx
- src/components/dashboard/LowStockList.tsx
- src/components/dashboard/OutstandingList.tsx
- src/components/dashboard/CashClarityList.tsx

**Tests**

- src/modules/dashboard/tests/get-cash-clarity-dashboard.test.ts
- src/modules/dashboard/tests/get-warehouse-dashboard.test.ts
- src/app/tests/page.test.ts

### Dashboard Module Health

- Domain: ⚠️ belum diverifikasi
- Use Case: ⚠️ belum diverifikasi
- Repository: ⚠️ belum diverifikasi
- Integration Test: ⚠️ belum diverifikasi

Status: UNKNOWN

---

# 10. Completion Checklist (Template)

Gunakan template ini untuk setiap step:

## Step X

- ADR: ☐
- Domain Update: ☐
- Use Case: ☐
- Implementation: ☐
- Test: ☐
- Log Note: ☐

Jika semua tercentang:
→ step boleh dianggap selesai

---

## Missing Critical Artifacts Check

Gunakan section ini sebagai radar cepat.

### Global Critical Files

- src/wiring/container.ts → ✅
- prisma/schema.prisma → ✅
- src/shared/prisma.ts → ✅
- src/shared/system/application/AuthorizationGuard.ts → ✅
- src/shared/audit/AuditTrail.ts → ✅
- src/tests/architecture/reporting-boundary.test.ts → ✅

### Monitoring Rule

Jika nanti ada file kritikal baru per step / domain:

- wajib ditambahkan ke index ini
- wajib ditandai eksplisit
- tidak boleh diasumsikan hanya karena folder ada

---

## Missing Artifacts (Detected)

- Cancel Purchase Order Use Case Doc → ❌ belum ada
- Procurement Domain Update → ⚠️ parsial
- Step 6 Log Note → ❌ belum ada

---

## Missing Detection Rule

Section ini HARUS berasal dari:

- Use Case Coverage Check
- Module Health
- Step Status

Tidak boleh manual.

---

# 11. AI Review Rules

AI wajib melakukan:

- jika ADR ada → cek artefak turunan
- jika use case ada tapi domain belum update → INVALID
- jika implementasi ada tapi dokumen belum ada → PREMATURE
- jika log note ada tanpa update source of truth → INVALID COMPLETION

---

# 12. Practical Review Flow for AI / Developer

Saat menerima permintaan review implementasi, AI harus menjalankan urutan berikut:

1. cek step / batch yang sedang dibahas
2. cek ADR terkait
3. cek domain doc terkait
4. cek use case terkait
5. cek critical file implementation per module
6. cek test yang relevan
7. cek log note / closure note
8. baru simpulkan: COMPLETE / INCOMPLETE / PREMATURE

---

# Penutup

Dokumen ini adalah:

- alat navigasi
- alat kontrol
- alat audit
- alat pengingat AI / developer

Bukan:

- dokumen desain
- dokumen domain
- dokumen arsitektur

Jika terjadi konflik:
→ dokumen domain dan arsitektur selalu menang
