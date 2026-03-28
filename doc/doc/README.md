## Documentation Structure of dokumen Toko-v
/docs
  /00-overview
    circle_update_fitur_dokumentasi.md ---------------------------------> dokumen Percakapan
    mvp-roadmap-and-architecture.md ---------------------------------> dokumen alam
    non-goals.md ---------------------------------> dokumen alam
    product-vision.md---------------------------------> dokumen alam
    documentation_lifecycle_policy.md ---------------------------------> dokumen alam

  /01-domain
    catalog-domain.md ---------------------------------> dokumen alam
    domain-glossary.md ---------------------------------> dokumen alam
    domain-overview.md ---------------------------------> dokumen alam
    inventory-domain.md ---------------------------------> dokumen alam
    sales-domain.md ---------------------------------> dokumen alam

  /02-architecture
    architecture-overview.md ---------------------------------> dokumen alam
    audit-trail-policy.md ---------------------------------> dokumen alam
    authorization-boundary.md ---------------------------------> dokumen alam
    clean-code-guidelines.md ---------------------------------> dokumen alam
    ddd-boundaries.md ---------------------------------> dokumen alam
    error-handling-guidelines.md ---------------------------------> dokumen alam
    folder-structure.md ---------------------------------> dokumen alam
    Human–AI Collaboration Guidelines.md ---------------------------------> dokumen alam
    inventory_mutation_implementation_guide.md ---------------------------------> dokumen alam
    prisma_client_reporting_test_db_strategy.md ---------------------------------> dokumen alam Fundamental Sistem
    integration-test-db-schema-per-suite.md ---------------------------------> dokumen alam Fundamental Sistem
   /reporting
     architecture_test_specification_reporting_boundary.md → penegakan aturan   
     internal_reporting_vs_fiscal_reporting.md → kenapa
     reporting_boundary_and_testing_policy.md → aturan 
     customer_aging_receivable_design.md  

  /03-mvp   
    mvp-stages-overview.md      
    blueprint_step_7_10_operational_to_erp.md
    mvp-step-1-core-transaction.md
    mvp-step-2-operational-stability.md
    mvp-step-3-reporting.md
    / MVP Step 3     
       credit_outstanding_report_mvp_step_3.md
       credit_payment_history_report_mvp_step_3.md
       inventory_reporting_design_integration_test_plan_mvp_step_3.md
       inventory_reporting_integration_test_spec (2).md       
       inventory_reporting_mvp_step_3_overview_stock_reports.md    
       sales_integration_happy_path_design_locked.md
       test_helper_contract_design_locked.md       
      
    mvp_step_4_Domain_Hardening_&_Catalog_Activation_lock_note.md
    /MVP Step 4
     inventory_reconciliation_spec_step_4_4.md
     step_4_hardening_governance.md
     step_4_transitional_compatibility_with_step_3.md
     /hutang MVP step 3
      //Dokumen FASE LAIN (tetap di sini, tapi mentalnya “bukan Step 3”)
        phase_1_payment_settlement.md
        phase-1-payment-settlement-checklist.md       
        pr-checklist-phase-1-payment-settlement.md
        phase_2_1_product_variant_design.md
        phase_2_2_stock_origin_design.md
        sales_summary_report_step_3.md
        sales_summary_report_refinement_mvp_step_3.md
    /04-2-payment-settlement
      step_4_2_hardening_optimistic_locking.md
      step_4_2_payment_settlement_execution_plan.md
    /04-variant-activation
      step_4_variant_reporting_transitional_contract.md
      variant_migration_roadmap_step_4_3.md

    MVP Step 5 – Operational Dashboard & Cash Clarity
    

  /04-use-cases
    create-order.md
    cancel-order.md
    receive-stock.md
    adjust-stock.md
    initialize_stock_use_case.md
    Pay Credit.md

  /05-data
    prisma-schema-notes.md ---------------------------------> dokumen alam
    migration-strategy.md ------------>belum ada dokumen nya
    data-seeding.md ------------>belum ada dokumen nya

  /06-testing
    testing_boundary_integration_policy.md ---------------------------------> dokumen alam
    testing strategy.md ---------------------------------> dokumen alam
    unit test guidelines.md ---------------------------------> dokumen alam
    vitest setup.md ---------------------------------> dokumen tengah

  /07-ui
    ui-principles.md ------------>belum ada dokumen nya
    dashboard-scope.md ------------>belum ada dokumen nya
    pos-flow.md ------------>belum ada dokumen nya

  /08-operations
    backup_admin_panel_design.md
    backup_policy_and_procedure.md
    environment-setup.md 
    logging-strategy.md ---------------------------------> dokumen alam    
    migration_playbook_production_ready.md
    sop_operasional_harian.md
    sop_transisi_manual_ke_digital.md

  /09-decisions
    adr-0001-tech-stack.md ------------>belum ada dokumen nya
    adr-0002-monolith-first.md ------------>belum ada dokumen nya
    adr-0003-ddd-scope.md ------------>belum ada dokumen nya
    adr-0004-introduce-tax.md ------------>belum ada dokumen nya
    adr-0005-tax-handling.md ------------>belum ada dokumen nya
    ADR-0006-integration-test-boleh-menggunakan-prisma.md
    ADR-0007-payment_settlement.md
    ADR-0008-stock_origin_classification.md
    ADR-0009-product_variant_modeling.md
    ADR_0010-tech_debt_receive_stock_atomicity.md
    ADR_0011_missing_issue_stock_specification.md
    ADR_0012_inventory_mutation_pattern.md
    ADR_0013_introduce_procurement_domain.md
    ADR_0014_introduce_customer_domain.md

  /10-future-domains
     procurement-domain.md
     redenomination_strategy_future.md
     tax_domain_roadmap_future.md


Implementation Lock Notes.md

## How to Read This Repository

- Mulai dari `/docs/00-overview`
- Pahami domain di `/docs/01-domain`
- Arsitektur ada di `/docs/02-architecture`
- Status MVP ada di `/docs/03-mvp`
- Testing rules ada di `/docs/06-testing`

Boundary khusus Reporting (MVP Step 3) ada di /docs/03-mvp/reporting-boundary-and-testing.md
Reporting pada MVP Step 3 bersifat read-only dan observasional, tanpa mutasi domain.

Perbedaan laporan internal dan fiskal dijelaskan di /docs/03-mvp/internal-reporting-vs-fiscal-reporting.md


### alamat file code vs code

alamat file yang pernah ditulis:

src/app/admin/system/page.tsx

src/app/app/orders/route.ts
src/app/app/orders/layout.tsx
src/app/app/orders/page.tsx

//===============================================
// modules/catalog
//===============================================

src/modules/catalog/domain/CatalogReadRepository.ts
src/modules/catalog/infrastructure/InMemoryCatalogReadRepository.ts

//===============================================
// modules/inventory
//===============================================

src/modules/inventory/application/AdjustStock.ts
src/modules/inventory/application/InventoryService.ts
src/modules/inventory/application/IssueStock.ts
src/modules/inventory/application/ReceiveStock.ts

src/modules/inventory/domain/InventoryItem.ts
src/modules/inventory/domain/InventoryRepository.ts
src/modules/inventory/domain/StockMovement.ts

src/modules/inventory/infrastructure/index.ts
src/modules/inventory/infrastructure/InMemoryInventoryRepository.ts
src/modules/inventory/infrastructure/InventoryServiceAdapter.ts
src/modules/inventory/infrastructure/PrismaInventoryRepository.ts

src/modules/inventory/tests/AdjustStock.test.ts
src/modules/inventory/tests/ConcurrentIssueStock.test.ts
src/modules/inventory/tests/IssueStock.test.ts

//===============================================
// modules/reporting
//===============================================

src/modules/reporting/application/get-credit-outstanding-report.ts
src/modules/reporting/application/get-credit-payment-history-report.ts
src/modules/reporting/application/get-sales-summary-report.ts

src/modules/reporting/dto/credit-outstanding.dto.ts
src/modules/reporting/dto/credit-payment-history.dto.ts
src/modules/reporting/dto/sales-summary.dto.ts

src/modules/reporting/inventory/inventory-snapshot.query.ts

src/modules/reporting/queries/credit-outstanding.query.ts
src/modules/reporting/queries/credit-payment-history.query.ts
src/modules/reporting/queries/inventory-low-stock.query.ts
src/modules/reporting/queries/inventory-movement-history.query.ts
src/modules/reporting/queries/sales-summary.query.ts

src/modules/reporting/tests/helpers/seedCreditOutstandingScenario.ts
src/modules/reporting/tests/helpers/seedCreditPaymentHistoryScenario.ts
src/modules/reporting/tests/helpers/seedInventoryReportingScenario.ts
src/modules/reporting/tests/helpers/seedSalesSummaryScenario.ts

src/modules/reporting/tests/integration/_bootstrap.ts
src/modules/reporting/tests/integration/credit-outstanding.integration.test.ts
src/modules/reporting/tests/integration/credit-payment-history.integration.test.ts
src/modules/reporting/tests/integration/inventory-low-stock.integration.test.ts
src/modules/reporting/tests/integration/inventory-movement-history.integration.test.ts
src/modules/reporting/tests/integration/inventory-snapshot.integration.test.ts
src/modules/reporting/tests/integration/sales-summary.integration.test.ts

//===============================================
//  modules/sales
//===============================================
src/modules/sales/application/guards/AuthorizationGuard.ts
src/modules/sales/application/CancelOrder.ts
src/modules/sales/application/CreateOrder.ts
src/modules/sales/application/CreateOrderDTO.ts
src/modules/sales/application/PayCredit.ts

src/modules/sales/domain/Order.ts
src/modules/sales/domain/OrderItem.ts
src/modules/sales/domain/OrderRepository.ts
src/modules/sales/domain/OrderStatus.ts
src/modules/sales/domain/OrderType.ts
src/modules/sales/domain/Payment.ts
src/modules/sales/domain/PaymentRepository.ts
src/modules/sales/domain/SalesErrors.ts

src/modules/sales/infrastructure/InMemoryOrderRepository.ts
src/modules/sales/infrastructure/InMemoryPaymentRepository.ts
src/modules/sales/infrastructure/PrismaOrderRepository.ts
src/modules/sales/infrastructure/PrismaPaymentRepository.ts

src/modules/sales/tests/dummy/createDummyOrderItem.ts
src/modules/sales/tests/dummy/createOrderWithTotal.ts

src/modules/sales/tests/integration/_bootstrap.ts
src/modules/sales/tests/integration/CreateAndCancelOrder.integration.test.ts

src/modules/sales/tests/CancelOrder.test.ts
src/modules/sales/tests/CreateOrder.test.ts
src/modules/sales/tests/PayCredit.test.ts

//===============================================
//  modules/shared
//===============================================
src/shared/audit/AuditTrail.ts
src/shared/audit/AuditEvent.ts

src/shared/errors/ApplicationError.ts
src/shared/errors/DomainError.ts

src/shared/logging/LogContext.ts
src/shared/logging/Logger.ts

src/shared/system/application/ToggleMaintenance.ts
src/shared/system/MaintenanceGuard.ts
src/shared/system/PrismaSystemStateRepository.ts
src/shared/system/SystemStateRepository.ts

src/shared/value-objects/EntityId.ts
src/shared/value-objects/Money.ts
src/shared/value-objects/PositiveInt.ts

src/shared/prisma.ts
//===============================================

src/tests/architecture/domain-purity.test.ts
src/tests/architecture/integration-boundary.test.ts
src/tests/architecture/reporting-boundary.test.ts
src/tests/architecture/repository-contract.test.ts
src/tests/architecture/usecase-deps.test.ts

src/tests/helpers/seedInveseedInventory.ts
src/tests/helpers/seedStockMovement.ts

src/wiring/container.ts

vitest.config.ts

### Testing

Proyek ini menerapkan pendekatan testing berlapis untuk menjaga kejujuran logika bisnis dan keandalan sistem.

Dokumen utama terkait testing:
- **Testing Strategy**  
  Menjelaskan tujuan, lapisan test, dan skenario bernilai bisnis  
  `/docs/06-testing/testing-strategy.md`

- **Testing Boundary & Integration Policy**  
  Menjelaskan batasan dependensi (termasuk keputusan integration test boleh menggunakan Prisma)  
  `/docs/06-testing/testing_boundary_integration_policy.md`

- **Unit Test Guidelines**  
  Aturan penulisan unit test agar fokus pada perilaku bisnis  
  `/docs/06-testing/unit-test-guidelines.md`

- **Vitest Setup**  
  Konfigurasi teknis dan rekomendasi eksekusi test  
  `/docs/06-testing/vitest-setup.md`

- **Reporting Boundary & Architecture Test (MVP Step 3)**
 Aturan khusus boundary dan architecture test untuk modul reporting
 /docs/03-mvp/reporting-boundary-and-testing.md

## Contributing
Untuk developer yang ingin berkontribusi, WAJIB baca:
👉 CONTRIBUTING.md

## Project Status

- ✅ MVP Step 1 – Core Transaction: **LOCKED**
- ✅ MVP Step 2 – Operational Stability: **LOCKED**
- 🚧 MVP Step 3 – Reporting: DESIGN LOCKED, IMPLEMENTATION NOT STARTED*
- ✅ MVP Step 3 – Reporting: DESIGN LOCKED & IMPLEMENTED (READ-ONLY)


Perubahan pada Step 1 dan Step 2 **TIDAK DIPERBOLEHKAN** tanpa ADR.










