# Traceability Index

### Status

REFERENCE INDEX — STRUCTURAL MAPPING DOCUMENT

---

## Tujuan

Dokumen ini berfungsi sebagai:

* peta struktur dokumentasi dan codebase
* penghubung antara dokumen domain, use case, ADR, dan implementasi
* referensi navigasi artefak sistem

Dokumen ini tidak mengandung status, evaluasi, atau keputusan completion.

---

## Batasan

Dokumen ini:

* tidak boleh mengandung status eksekusi
* tidak boleh mengandung missing artifacts
* tidak boleh menjadi sumber keputusan COMPLETE / INCOMPLETE / INVALID

Jika terjadi konflik, dokumen domain, arsitektur, ADR, dan use case tetap lebih tinggi daripada index ini.

---

# 1. Overview Documents

* product-vision.md
* MVP Roadmap dan Arsitektur Awal.md
* Non-Goals.md
* documentation_lifecycle_policy.md
* circle_update_fitur_dokumentasi.md
* log_note_writing_guidelines.md

---

# 2. Architecture Documents

* architecture_overview.md
* folder_structure.md
* DDD Boundaries.md
* clean-code-guidelines.md
* error-handling-guidelines.md
* authorization-boundary.md
* audit-trail-policy.md
* Human–AI Collaboration Guidelines.md
* integration_test_db_strategy_schema_per_suite_design_locked.md
* inventory_mutation_implementation_guide.md
* prisma_client_reporting_test_db_strategy.md

## Reporting Architecture

* reporting_boundary_and_testing_policy.md
* architecture_test_specification_reporting_boundary.md
* customer_aging_receivable_design.md
* internal_reporting_vs_fiscal_reporting.md

---

# 3. Domain Documents

* catalog_domain.md
* inventory_domain.md
* sales_domain.md
* procurement_domain.md
* user_domain_minimal_operational_identity_layer.md
* domain_overview.md
* domain_glossary.md

---

# 4. Use Case Documents

## Sales

* Create Order.md
* Cancel Order.md
* Pay Credit.md

## Inventory

* Receive Stock (Use Case).md
* Adjust Stock.md
* issue_stock.md
* check_inventory_consistency_use_case.md
* initialize_stock_use_case.md

## Procurement

* create_purchase_order.md
* cancel_purchase_order.md
* receive_purchase_order.md
* create_supplier.md
* update_supplier_status.md

---

# 5. MVP Execution Documents

## Core MVP Documents

* mvp_stages_overview.md
* mvp_step_1_core_transaction.md
* mvp_step_2_operational_stability.md
* mvp_step_3_reporting_lock-note.md
* mvp_step_4_Domain_Hardening_&_Catalog_Activation_lock_note.md
* MVP_step_5_operational_dashboard_and_cash_clarity_implementation_plan.md
* MVP_step_6_procurement_cost_foundation_implementation_plan.md

## Step 4 Documents

* step_4_hardening_governance.md
* step_4_1_stock_origin_documented_deviation.md
* step_4_2_payment_settlement_execution_plan.md
* step_4_2_hardening_optimistic_locking.md
* step_4_3_product_variant_activation_implementation_plan.md
* step_4_4_inventory_consistency_implementation_plan.md
* step_4_4_full_inventory_consistency_document.md
* inventory_reconciliation_spec_step_4_4.md
* step_4_4_batch_3_inventory_consistency_test_plan.md
* step_4_4_batch_4_persistence_cleanup_and_closure.md
* Step 4.5 — Architecture Cleanup Plan (Post Batch 4).md

## Step 5 Documents

* Step 5.4 – Operational Identity & Actor Tracking (Implementation Plan).md
* Step 5.4 – Operational Identity & Actor Tracking (Execution Plan).md
* Step 5.4 is officially CLOSED.md
* Step 5.5 – Dashboard Presentation & Operational Visibility.md
* step_5_dashboard_implementation_notes.md
* step_5_operational_dashboard_closure_report.md

## Step 6 Documents

* step_6_batch_1_foundation_design.md
* step_6_batch_2_Receive_Flow_Activation.md
* Step_6_Batch_3_Clarification_&_Cancel_Flow_Design.md
* Step_6_Batch_3_Delivery_Integration.md
* secondary_review_notes_step_6_batch_2.md
* secondary_conversation_step_6_cancel_flow_context.md

## Step 6.5 Documents

* Step 6.5 — Consolidated Design and Code Contract.md
* ADR-0019-measurement-unit-normalization.md

---

# 6. Decision Records (ADR)

* ADR-0006-Integration Test Boleh Menggunakan Prisma.md
* ADR-0007-payment_settlement.md
* ADR-0008-stock_origin_classification.md
* ADR-0009-product_variant_modeling.md
* ADR_0010-tech_debt_receive_stock_atomicity.md
* ADR_0011_missing_issue_stock_specification.md
* ADR_0012_inventory_mutation_pattern.md
* ADR_0013_introduce_procurement_domain.md
* ADR_0014_introduce_customer_domain.md
* adr_0015_0018_and_mvp_steps_security_customer_procurement_accounting.md
* ADR-0019-measurement-unit-normalization.md
* ADR-0020 — Supplier Payable & Payment Handling.md
* ADR-0021 — Receiving Inspection Flow.md

---

# 7. Testing Documents

* Testing Strategy.md
* Unit Test Guidelines.md
* Vitest Setup.md
* testing_boundary_integration_policy.md

---

# 8. Operations Documents

* environment_setup.md
* migration_playbook_production_ready.md
* backup_policy_and_procedure.md
* backup_admin_panel_design.md
* logging-strategy.md
* sop_operasional_harian.md
* sop_transisi_manual_ke_digital.md

---

# 8A. Data / Update / Future-Domain Documents

## Data Documents

* prisma_schema_notes.md

## Update / Governance Support Documents

* auto_update_workflow.md
* execution_status.md
* traceability_index.md

## Operational / Root-Level Supporting Records

* backup_system_activation_lock_note.md
* log_note.md
* Implementation Lock Notes.md

## Future Domain Documents

* procurement_domain_future.md
* redenomination_strategy_future.md
* tax_domain_roadmap_future.md

---

# 9. Codebase Mapping

## Root Structure

* prisma/
* src/app
* src/components
* src/modules
* src/shared
* src/tests
* src/wiring

## Document Structure (Repository)

* doc/00-overview
* doc/01-domain
* doc/02-architecture
* doc/03-mvp
* doc/04-use-cases
* doc/05-data
* doc/06-testing
* doc/07-ui
* doc/08-operations
* doc/09-decisions
* doc/10-future-domains
* doc/update

## Critical Infrastructure Files

* src/wiring/container.ts
* prisma/schema.prisma
* src/shared/prisma.ts
* src/shared/system/SystemStateRepository.ts
* src/shared/system/PrismaSystemStateRepository.ts
* src/shared/system/application/AuthorizationGuard.ts
* src/shared/system/application/ToggleMaintenance.ts
* src/shared/system/MaintenanceGuard.ts
* src/shared/system/types/actor-context.ts
* src/shared/audit/AuditTrail.ts
* src/shared/audit/AuditEvent.ts
* src/shared/logging/Logger.ts
* src/shared/logging/LogContext.ts
* src/shared/errors/ApplicationError.ts
* src/shared/errors/DomainError.ts

### Shared Unit Normalization Artifacts

* src/shared/application/unit-normalization/procurement-unit-normalization.port.ts
* src/shared/application/unit-normalization/procurement-unit-normalization.errors.ts
* src/shared/application/unit-normalization/procurement-unit-normalization.types.ts

### Delivery Boundary Helpers (POS & API)

* src/shared/delivery/parse-actor-context.ts
* src/shared/delivery/map-http-error.ts

### Shared Value Objects

* src/shared/value-objects/EntityId.ts
* src/shared/value-objects/Money.ts
* src/shared/value-objects/PositiveInt.ts

### Shared UI / Formatting Support

* src/shared/components/format.ts

### Global Architecture / Boundary Tests

* src/tests/architecture/dependency-wiring-boundary.test.ts
* src/tests/architecture/domain-purity.test.ts
* src/tests/architecture/integration-boundary.test.ts
* src/tests/architecture/pos-delivery-boundary.test.ts
* src/tests/architecture/reporting-boundary.test.ts
* src/tests/architecture/repository-contract.test.ts
* src/tests/architecture/usecase-deps.test.ts

### Global Test Support

* src/tests/setup.ts
* src/tests/helpers/seedInventory.ts
* src/tests/helpers/seedStockMovement.ts

## Modules

* catalog
* sales
* inventory
* procurement
* reporting
* dashboard
* user

### Delivery Surface

* src/app/api/orders/route.ts
* src/app/api/orders/[id]/cancel/route.ts
* src/app/api/orders/[id]/pay-credit/route.ts
* src/app/api/procurement/purchase-orders/[id]/cancel/route.ts
* src/app/api/procurement/purchase-orders/[id]/payments/route.ts
* src/app/api/procurement/purchase-orders/[id]/returns/route.ts
* src/app/api/procurement/purchase-orders/[id]/outstanding/route.ts
* src/app/api/catalog/variants/route.ts
* src/app/api/dashboard/route.ts
* src/app/api/dashboard/warehouse/route.ts
* src/app/api/admin/maintenance/route.ts

### Delivery / UI Tests

* src/app/api/orders/route.test.ts
* src/app/api/orders/[id]/cancel/route.test.ts
* src/app/api/orders/[id]/pay-credit/route.test.ts
* src/app/api/procurement/purchase-orders/[id]/cancel/route.test.ts
* src/app/api/procurement/purchase-orders/[id]/payments/route.test.ts
* src/app/api/procurement/purchase-orders/[id]/returns/route.test.ts
* src/app/api/procurement/purchase-orders/[id]/outstanding/route.test.ts
* src/app/procurement/purchase-orders/[id]/_components/CancelPurchaseOrderButton.test.tsx
* src/app/tests/page.test.ts

---

# 10. Use Case Traceability Mapping

## Sales

### Create Order

* Doc: doc/04-use-cases/Create Order.md
* Code: src/modules/sales/application/CreateOrder.ts
* Test: src/modules/sales/tests/CreateOrder.test.ts

### Cancel Order

* Doc: doc/04-use-cases/Cancel Order.md
* Code: src/modules/sales/application/CancelOrder.ts
* Test: src/modules/sales/tests/CancelOrder.test.ts

### Pay Credit

* Doc: doc/04-use-cases/Pay Credit.md
* Code: src/modules/sales/application/PayCredit.ts
* Test: src/modules/sales/tests/PayCredit.test.ts

## Inventory

### Receive Stock

* Doc: doc/04-use-cases/Receive Stock (Use Case).md
* Code: src/modules/inventory/application/ReceiveStock.ts
* Test: src/modules/inventory/tests/ReceiveStock.test.ts
* Cross-Step Note:
  * Dipakai sebagai canonical-only receiving path untuk procurement receive setelah Step 6.5.

### Adjust Stock

* Doc: doc/04-use-cases/Adjust Stock.md
* Code: src/modules/inventory/application/AdjustStock.ts
* Test: src/modules/inventory/tests/AdjustStock.test.ts

### Issue Stock

* Doc: doc/04-use-cases/issue_stock.md
* Code: src/modules/inventory/application/IssueStock.ts
* Test: src/modules/inventory/tests/IssueStock.test.ts

### Check Inventory Consistency

* Doc: doc/04-use-cases/check_inventory_consistency_use_case.md
* Code: src/modules/inventory/application/CheckInventoryConsistency.ts
* Test: src/modules/inventory/tests/CheckInventoryConsistency.test.ts

## Procurement

### Create Purchase Order

* Doc: doc/04-use-cases/create_purchase_order.md
* Code: src/modules/procurement/application/use-cases/CreatePurchaseOrder.ts
* Test: src/modules/procurement/tests/application/CreatePurchaseOrder.test.ts

### Cancel Purchase Order

* Doc: doc/04-use-cases/cancel_purchase_order.md
* Code: src/modules/procurement/application/use-cases/CancelPurchaseOrder.ts
* Test: src/modules/procurement/tests/application/CancelPurchaseOrder.test.ts

### Receive Purchase Order

* Doc: doc/04-use-cases/receive_purchase_order.md
* Code: src/modules/procurement/application/use-cases/ReceivePurchaseOrder.ts
* Code Support:
  * src/modules/procurement/infrastructure/InventoryProcurementAdapter.ts
  * src/shared/application/unit-normalization/procurement-unit-normalization.port.ts
  * src/shared/application/unit-normalization/procurement-unit-normalization.errors.ts
  * src/shared/application/unit-normalization/procurement-unit-normalization.types.ts
* Test: src/modules/procurement/tests/application/ReceivePurchaseOrder.test.ts
* Integration Test: src/modules/procurement/tests/integration/ReceivePurchaseOrder.integration.test.ts

### Create Supplier

* Doc: doc/04-use-cases/create_supplier.md
* Code: src/modules/procurement/application/use-cases/CreateSupplier.ts
* Test: src/modules/procurement/tests/application/CreateSupplier.test.ts

### Update Supplier Status

* Doc: doc/04-use-cases/update_supplier_status.md
* Code: src/modules/procurement/application/use-cases/UpdateSupplierStatus.ts
* Test: src/modules/procurement/tests/application/UpdateSupplierStatus.test.ts

### Register Goods Arrival

* Doc: doc/04-use-cases/register_goods_arrival.md
* Code: src/modules/procurement/application/use-cases/RegisterGoodsArrival.ts
* Test: src/modules/procurement/tests/integration/RegisterGoodsArrival.integration.test.ts

### Start Receiving Inspection

* Doc: doc/04-use-cases/start_receiving_inspection.md
* Code: src/modules/procurement/application/use-cases/StartReceivingInspection.ts
* Test: src/modules/procurement/tests/application/StartReceivingInspection.test.ts

### Complete Receiving Inspection

* Doc: doc/04-use-cases/complete_receiving_inspection.md
* Code: src/modules/procurement/application/use-cases/CompleteReceivingInspection.ts
* Test: src/modules/procurement/tests/application/CompleteReceivingInspection.test.ts

### Finalize Inspection Acceptance

* Doc: doc/04-use-cases/finalize_inspection_acceptance.md
* Code: src/modules/procurement/application/use-cases/FinalizeInspectionAcceptance.ts
* Test: src/modules/procurement/tests/integration/FinalizeInspectionAcceptance.integration.test.ts

## Dashboard / Reporting Delivery Mapping

### Cash Clarity Dashboard

* Code: src/modules/dashboard/application/get-cash-clarity-dashboard.ts
* DTO: src/modules/dashboard/dto/cash-clarity.dto.ts
* UI: src/components/dashboard/CashClarityList.tsx
* Test: src/modules/dashboard/tests/get-cash-clarity-dashboard.test.ts
* UI Test: src/components/dashboard/tests/CashClarityList.test.tsx

### Warehouse Dashboard

* Code: src/modules/dashboard/application/get-warehouse-dashboard.ts
* DTO: src/modules/dashboard/dto/warehouse-dashboard.dto.ts
* UI: src/components/dashboard/LowStockList.tsx
* Test: src/modules/dashboard/tests/get-warehouse-dashboard.test.ts
* UI Test: src/components/dashboard/tests/LowStockList.test.tsx

### Dashboard Summary / Outstanding Presentation

* UI: src/components/dashboard/SummaryCards.tsx
* UI: src/components/dashboard/OutstandingList.tsx
* UI: src/components/dashboard/DashboardSection.tsx
* UI: src/components/dashboard/DashboardEmptyState.tsx
* UI Test: src/components/dashboard/tests/SummaryCards.test.tsx
* UI Test: src/components/dashboard/tests/OutstandingList.test.tsx

## Reporting Module Artifacts

### Application Layer

* src/modules/reporting/application/get-credit-outstanding-report.ts
* src/modules/reporting/application/get-credit-payment-history-report.ts
* src/modules/reporting/application/get-inventory-low-stock-report.ts
* src/modules/reporting/application/get-inventory-movement-history-report.ts
* src/modules/reporting/application/get-inventory-snapshot-report.ts
* src/modules/reporting/application/get-order-outstanding.ts
* src/modules/reporting/application/get-sales-summary-report.ts
* src/modules/reporting/application/ListPosOrders.ts

### Query Layer

* src/modules/reporting/queries/credit-outstanding.query.ts
* src/modules/reporting/queries/credit-payment-history.query.ts
* src/modules/reporting/queries/get-order-outstanding.query.ts
* src/modules/reporting/queries/inventory-low-stock.query.ts
* src/modules/reporting/queries/inventory-movement-history.query.ts
* src/modules/reporting/queries/inventory-snapshot.query.ts
* src/modules/reporting/queries/list-pos-orders.query.ts
* src/modules/reporting/queries/sales-summary.query.ts

### Integration Tests

* src/modules/reporting/tests/integration/credit-outstanding.integration.test.ts
* src/modules/reporting/tests/integration/credit-payment-history.integration.test.ts
* src/modules/reporting/tests/integration/get-credit-outstanding-report.test.ts
* src/modules/reporting/tests/integration/get-credit-payment-history-report.test.ts
* src/modules/reporting/tests/integration/get-inventory-snapshot-report.test.ts
* src/modules/reporting/tests/integration/inventory-low-stock.integration.test.ts
* src/modules/reporting/tests/integration/inventory-movement-history.integration.test.ts
* src/modules/reporting/tests/integration/inventory-snapshot.integration.test.ts
* src/modules/reporting/tests/integration/sales-summary.integration.test.ts
* src/modules/reporting/tests/integration/_bootstrap.ts

---

---

## Cross-Module Interaction (Critical Paths)

### Procurement → Inventory

* Shared normalization:
  * src/shared/application/unit-normalization/procurement-unit-normalization.port.ts
  * src/shared/application/unit-normalization/procurement-unit-normalization.errors.ts
  * src/shared/application/unit-normalization/procurement-unit-normalization.types.ts
* Adapter: src/modules/procurement/infrastructure/InventoryProcurementAdapter.ts
* Use Case:
  * ReceivePurchaseOrder → normalization → Inventory mutation
  * CancelPurchaseOrder → Inventory reversal

### Sales → Inventory

* Adapter: src/modules/inventory/infrastructure/InventoryServiceAdapter.ts
* Use Case:
  * CreateOrder → IssueStock
  * CancelOrder → ReceiveStock (internal flow)

### Reporting → All Domains

* Reporting bersifat read-only
* Query mengambil data dari:
  * Sales
  * Inventory
  * Procurement
* Reporting tidak menggunakan use case mutation

---

# 11. Traceability Coverage Rule

Setiap use case yang ingin dianggap fully traceable harus memiliki:

* Doc
* Code
* Test

Dokumen ini hanya mencatat keberadaan artefak. Evaluasi completion dilakukan di `execution_status.md`.
