# Step 7 — Folder Structure and Implementation Mapping

Status: SUPPORTING IMPLEMENTATION DOCUMENT  
Scope: Supplier Payable  
Change Type: Additive, Non-Breaking  

---

## Purpose

Dokumen ini mendefinisikan breakdown folder structure dan file implementation mapping untuk Step 7 — Supplier Payable.

Dokumen ini melengkapi, bukan menggantikan:

- Step 7 — Final Use Cases
- Step 7 — Repository Contract Final
- Step 7 — Application Orchestration Final
- MVP Stages Overview
- Procurement Domain
- ADR-0020 — Supplier Payable & Payment Handling

Dokumen ini hanya mengatur lokasi file, tanggung jawab per file, urutan implementasi, dan boundary implementasi.

---

## Scope

Step 7 mencakup:

- Record Supplier Payment
- Get Supplier Outstanding
- Handle Purchase Return (Reduce Payable)

Step 7 tidak mencakup:

- receiving inspection
- quarantine
- inventory reversal otomatis
- asset valuation
- costing
- accounting journal
- general ledger
- dashboard nilai aset gudang

---

## Architectural Rule

Step 7 tetap berada dalam module Procurement.

Step 7 tidak membuat module baru karena Supplier Payable adalah perluasan operasional dari Procurement, bukan bounded context baru.

Aturan layer:

- Domain mendefinisikan type, invariant helper, dan contract interface.
- Application mengorkestrasi use case.
- Infrastructure mengimplementasikan repository menggunakan Prisma.
- App/API hanya melakukan request parsing, dependency wiring, dan response mapping.
- UI hanya menjadi input/output surface untuk use case Step 7.

---

# 1. Target Folder Structure

```txt
src/
  modules/
    procurement/
      domain/
        payable/
          SupplierPayment.ts
          PurchaseReturnReduction.ts
          SupplierPayable.ts
          Step7Errors.ts
          SupplierPaymentRepository.ts
          PurchaseReturnRepository.ts
          SupplierPayableQuery.ts
          PurchaseOrderPayableReader.ts
          SupplierPayableReader.ts

      application/
        payable/
          Step7DTO.ts
          Step7AuthorizationGuard.ts
          Step7UnitOfWork.ts
          RecordSupplierPayment.ts
          GetSupplierOutstanding.ts
          HandlePurchaseReturn.ts

      infrastructure/
        payable/
          PrismaSupplierPaymentRepository.ts
          PrismaPurchaseReturnRepository.ts
          PrismaSupplierPayableQuery.ts
          PrismaPurchaseOrderPayableReader.ts
          PrismaSupplierPayableReader.ts
          PrismaStep7UnitOfWork.ts

  app/
    api/
      procurement/
        payables/
          suppliers/
            [supplierId]/
              route.ts
          payments/
            route.ts
          returns/
            route.ts

    procurement/
      payables/
        page.tsx
        [supplierId]/
          page.tsx
        components/
          SupplierOutstandingTable.tsx
          SupplierPaymentForm.tsx
          PurchaseReturnForm.tsx
          PaymentReturnHistory.tsx
```

---

# 2. Domain Layer Mapping

Folder:

```txt
src/modules/procurement/domain/payable
```

Domain layer tidak boleh mengimpor:

- Prisma
- Next.js
- HTTP request/response
- React
- infrastructure repository implementation
- UI component

---

## 2.1 SupplierPayment.ts

### Responsibility

Mendefinisikan model data domain-level untuk supplier payment.

### Contains

- `SupplierPaymentRecord`
- `SupplierPaymentId`
- helper validasi amount positif jika diperlukan

### Rules

- Payment bersifat append-only.
- Payment bukan inventory mutation.
- Payment tidak mengubah purchase order status.
- Payment tidak boleh mengubah histori payment lama.

---

## 2.2 PurchaseReturnReduction.ts

### Responsibility

Mendefinisikan model data domain-level untuk return reduction.

### Contains

- `PurchaseReturnReductionRecord`
- `PurchaseReturnReductionItemRecord`
- `PurchaseReturnId`

### Rules

- Return reduction bukan payment.
- Return reduction bersifat append-only.
- Return reduction tidak melakukan inventory reversal.
- Return reduction tidak mengubah histori payment.

---

## 2.3 SupplierPayable.ts

### Responsibility

Menyediakan helper pure untuk perhitungan payable derived.

### Contains

- `calculateOutstanding`
- `assertOutstandingNotNegative`

### Rule

Formula wajib:

```ts
outstanding = payableInitial - totalPaid - totalReturned;
```

### Forbidden

File ini tidak boleh:

- membaca database
- memanggil repository
- melakukan side effect
- memanggil inventory
- membuat payment atau return

---

## 2.4 Step7Errors.ts

### Responsibility

Mendefinisikan error code Step 7 yang aman dan eksplisit.

### Contains

- `Step7BusinessErrorCode`
- `Step7RepositoryErrorCode`
- optional typed error class jika pola error proyek sudah memakai class

### Rules

- Error tidak boleh berupa raw Prisma/database error.
- Error harus dapat dipetakan di delivery/API layer.

---

## 2.5 SupplierPaymentRepository.ts

### Responsibility

Interface repository untuk histori supplier payment.

### Contains

- `SupplierPaymentRepository`

### Methods

- `nextId`
- `save`
- `listByPurchaseOrderId`
- `sumPaidByPurchaseOrderId`

### Rules

- Tidak ada update.
- Tidak ada delete.
- Tidak ada inventory dependency.

---

## 2.6 PurchaseReturnRepository.ts

### Responsibility

Interface repository untuk histori purchase return reduction.

### Contains

- `PurchaseReturnRepository`

### Methods

- `nextId`
- `save`
- `listByPurchaseOrderId`
- `sumReturnedByPurchaseOrderId`
- `sumReturnedQuantityByPurchaseItemId`

### Rules

- Tidak ada update.
- Tidak ada delete.
- Tidak ada inventory dependency.
- Tidak melakukan stock reversal.

---

## 2.7 SupplierPayableQuery.ts

### Responsibility

Interface query read-only untuk supplier outstanding.

### Contains

- `SupplierPayableQuery`
- `SupplierOutstandingSummary`
- `SupplierOutstandingPurchaseOrderLine`

### Rules

- Read-only.
- Tidak menjadi pseudo-domain.
- Tidak melakukan mutation.

---

## 2.8 PurchaseOrderPayableReader.ts

### Responsibility

Interface read dependency untuk membaca snapshot purchase order yang dibutuhkan Step 7.

### Contains

- `PurchaseOrderPayableSnapshot`
- `PurchaseOrderPayableReader`

### Rules

- Reader tidak menghitung payment.
- Reader tidak menghitung return.
- Reader tidak mengubah purchase order.

---

## 2.9 SupplierPayableReader.ts

### Responsibility

Interface read dependency untuk membaca supplier snapshot.

### Contains

- `SupplierPayableSnapshot`
- `SupplierPayableReader`

### Rules

- Reader tidak mengubah supplier.
- Reader hanya digunakan untuk validasi supplier dan read model outstanding.

---

# 3. Application Layer Mapping

Folder:

```txt
src/modules/procurement/application/payable
```

Application layer adalah orchestrator use case.

Application layer boleh:

- menerima DTO
- menjalankan authorization
- membaca repository/query
- menghitung derived outstanding dengan helper domain/application
- menjalankan transaction boundary
- menyimpan histori append-only
- mengembalikan DTO

Application layer tidak boleh:

- import Prisma langsung
- import React/Next UI
- memanggil InventoryRepository
- membuat StockMovement
- membuat accounting journal
- menggunakan fallback

---

## 3.1 Step7DTO.ts

### Responsibility

Mendefinisikan input/output DTO untuk semua use case Step 7.

### Contains

- `RecordSupplierPaymentInput`
- `RecordSupplierPaymentResult`
- `GetSupplierOutstandingInput`
- `GetSupplierOutstandingResult`
- `HandlePurchaseReturnInput`
- `HandlePurchaseReturnResult`

### Rules

- Tidak boleh memakai `any`.
- DTO harus eksplisit.
- DTO tidak boleh membawa Prisma model mentah.

---

## 3.2 Step7AuthorizationGuard.ts

### Responsibility

Mendefinisikan kontrak authorization guard untuk Step 7.

### Contains

- `ActorContext`
- `Step7AuthorizationGuard`

### Rules

- Authorization berada sebelum use case mutation.
- Domain entity tidak boleh mengetahui role.
- Role validation tidak boleh dipindahkan ke UI.

---

## 3.3 Step7UnitOfWork.ts

### Responsibility

Mendefinisikan transaction boundary abstraction.

### Contains

- `Step7UnitOfWork`

### Rules

- Use case tidak boleh tahu Prisma transaction detail.
- Mutation use case wajib berjalan dalam transaction boundary.

---

## 3.4 RecordSupplierPayment.ts

### Responsibility

Mengorkestrasi pencatatan supplier payment.

### Flow Summary

1. Require admin.
2. Load purchase order payable snapshot.
3. Validasi PO ada dan `RECEIVED`.
4. Load supplier.
5. Validasi amount positif.
6. Load total paid dan total returned.
7. Hitung outstanding derived.
8. Tolak overpayment.
9. Generate payment id.
10. Save payment append-only.
11. Return DTO.

### Forbidden

- Tidak boleh menyentuh inventory.
- Tidak boleh mengubah purchase order status.
- Tidak boleh membuat return reduction.
- Tidak boleh membuat accounting journal.

---

## 3.5 GetSupplierOutstanding.ts

### Responsibility

Mengorkestrasi read-only supplier outstanding.

### Flow Summary

1. Require admin.
2. Load supplier.
3. Query outstanding summary.
4. Validasi derived outstanding tidak negatif.
5. Return DTO.

### Forbidden

- Tidak boleh melakukan write.
- Tidak boleh memanggil inventory.
- Tidak boleh menjadi reporting pseudo-domain.

---

## 3.6 HandlePurchaseReturn.ts

### Responsibility

Mengorkestrasi return reduction untuk mengurangi payable.

### Flow Summary

1. Require admin.
2. Load purchase order payable snapshot.
3. Validasi PO ada dan `RECEIVED`.
4. Load supplier.
5. Validasi return item.
6. Validasi quantity return per purchase item.
7. Hitung reduced amount dari purchase item unit cost.
8. Load total paid dan total returned.
9. Hitung outstanding derived.
10. Tolak jika reduction membuat outstanding negatif.
11. Generate return id.
12. Save return reduction append-only.
13. Return DTO.

### Forbidden

- Tidak boleh menyentuh inventory.
- Tidak boleh melakukan stock reversal.
- Tidak boleh mengubah payment history.
- Tidak boleh menerima `reducedAmount` dari UI sebagai source of truth.

---

# 4. Infrastructure Layer Mapping

Folder:

```txt
src/modules/procurement/infrastructure/payable
```

Infrastructure layer boleh menggunakan Prisma.

Infrastructure layer tidak boleh:

- menyimpan business rule inti
- memanggil UI
- memanggil domain behavior yang memerlukan HTTP/Next
- memanggil InventoryRepository dari payment/return repository

---

## 4.1 PrismaSupplierPaymentRepository.ts

### Implements

- `SupplierPaymentRepository`

### Responsibilities

- generate payment id
- save payment append-only
- list payment by purchase order
- sum paid by purchase order

### Constraints

- duplicate ID wajib ditolak.
- tidak ada update/delete.

---

## 4.2 PrismaPurchaseReturnRepository.ts

### Implements

- `PurchaseReturnRepository`

### Responsibilities

- generate return id
- save return reduction append-only
- save return reduction items
- list return by purchase order
- sum returned amount
- sum returned quantity per purchase item

### Constraints

- duplicate ID wajib ditolak.
- tidak ada update/delete.
- tidak membuat stock movement.

---

## 4.3 PrismaSupplierPayableQuery.ts

### Implements

- `SupplierPayableQuery`

### Responsibilities

- read supplier outstanding summary
- read outstanding per purchase order

### Constraints

- read-only.
- tidak melakukan mutation.
- tidak menjadi source business rule baru.

---

## 4.4 PrismaPurchaseOrderPayableReader.ts

### Implements

- `PurchaseOrderPayableReader`

### Responsibilities

- read purchase order payable snapshot
- include item quantity and unit cost
- include status and receivedAt

### Constraints

- tidak menghitung payment.
- tidak menghitung return.
- tidak mengubah purchase order.

---

## 4.5 PrismaSupplierPayableReader.ts

### Implements

- `SupplierPayableReader`

### Responsibilities

- read supplier id
- read supplier store name
- read supplier active status

### Constraints

- read-only.
- tidak mengubah supplier.

---

## 4.6 PrismaStep7UnitOfWork.ts

### Implements

- `Step7UnitOfWork`

### Responsibilities

- menyediakan transaction boundary untuk mutation use case

### Constraints

- use case tidak boleh mengetahui detail Prisma transaction.
- semua repository yang dipakai dalam transaction harus memakai transaction client yang sama.

---

# 5. API Route Mapping

Folder:

```txt
src/app/api/procurement/payables
```

API route hanya boleh:

- parse request
- validate shape dasar request
- build dependency wiring
- call application use case
- map error ke response

API route tidak boleh:

- menghitung outstanding
- menghitung reduced amount sebagai source of truth
- memanggil Prisma langsung untuk business mutation
- memanggil InventoryRepository
- membuat business rule baru

---

## 5.1 suppliers/[supplierId]/route.ts

### Route

```txt
GET /api/procurement/payables/suppliers/:supplierId
```

### Calls

- `GetSupplierOutstanding`

### Returns

- supplier outstanding summary

---

## 5.2 payments/route.ts

### Route

```txt
POST /api/procurement/payables/payments
```

### Calls

- `RecordSupplierPayment`

### Request Body

- `purchaseOrderId`
- `amount`
- `paidAt`
- `notes`

### Forbidden

- tidak boleh menerima outstanding baru dari UI.
- tidak boleh menerima totalPaid dari UI.

---

## 5.3 returns/route.ts

### Route

```txt
POST /api/procurement/payables/returns
```

### Calls

- `HandlePurchaseReturn`

### Request Body

- `purchaseOrderId`
- `returnItems`
- `returnedAt`
- `notes`

### Forbidden

- tidak boleh menerima `reducedAmount` sebagai source of truth.
- tidak boleh melakukan inventory reversal.

---

# 6. UI Mapping

Folder:

```txt
src/app/procurement/payables
```

UI Step 7 boleh dibuat setelah application use case dan API route siap.

UI hanya boleh menjadi input/output surface untuk Supplier Payable.

---

## 6.1 page.tsx

### Purpose

Menampilkan overview payable supplier.

### Allowed

- daftar supplier dengan outstanding
- total outstanding operasional
- link ke detail supplier

### Forbidden

- asset valuation
- inventory valuation
- costing/margin
- stock movement editing
- quarantine/inspection

---

## 6.2 [supplierId]/page.tsx

### Purpose

Menampilkan detail outstanding supplier.

### Allowed

- total outstanding supplier
- daftar purchase order outstanding
- payment action
- return reduction action
- payment/return history

---

## 6.3 SupplierOutstandingTable.tsx

### Purpose

Menampilkan list PO outstanding.

### Data

- purchaseOrderId
- receivedAt
- payableInitial
- totalPaid
- totalReturned
- outstanding

---

## 6.4 SupplierPaymentForm.tsx

### Purpose

Form input payment supplier.

### Inputs

- purchaseOrderId
- amount
- paidAt
- notes

### Rules

- Client-side validation hanya untuk UX.
- Application layer tetap source of truth.
- Tidak boleh mutate outstanding langsung.

---

## 6.5 PurchaseReturnForm.tsx

### Purpose

Form input return reduction.

### Inputs

- purchaseOrderId
- purchaseItemId
- quantity
- reason
- returnedAt
- notes

### Rules

- UI tidak boleh mengirim `reducedAmount` sebagai source of truth.
- UI boleh menampilkan preview.
- Application layer tetap menghitung nilai final.

---

## 6.6 PaymentReturnHistory.tsx

### Purpose

Menampilkan histori payment dan return reduction.

### Rules

- Read-only.
- Tidak ada edit.
- Tidak ada delete.

---

# 7. Test Mapping

```txt
src/modules/procurement/application/payable/__tests__/
  RecordSupplierPayment.test.ts
  GetSupplierOutstanding.test.ts
  HandlePurchaseReturn.test.ts

src/modules/procurement/infrastructure/payable/__tests__/
  PrismaSupplierPaymentRepository.test.ts
  PrismaPurchaseReturnRepository.test.ts
  PrismaSupplierPayableQuery.test.ts

src/modules/procurement/__tests__/architecture/
  procurement-step7-boundary.test.ts
```

---

## Application Tests

Required:

- non-admin actor ditolak
- PO missing ditolak
- PO non-RECEIVED ditolak
- supplier missing ditolak
- payment amount invalid ditolak
- overpayment ditolak
- return item invalid ditolak
- return quantity invalid ditolak
- return exceeding allowed reduction ditolak
- outstanding negatif ditolak

---

## Infrastructure Tests

Required:

- save payment append-only berhasil
- duplicate payment id ditolak
- sum paid return `0` jika kosong
- save return append-only berhasil
- duplicate return id ditolak
- sum returned return `0` jika kosong
- sum returned quantity per purchase item benar

---

## Architecture Tests

Required:

- domain procurement tidak mengimpor Prisma
- application payable tidak mengimpor Prisma langsung
- payment repository tidak mengimpor inventory repository
- return repository tidak mengimpor inventory repository
- query outstanding tidak melakukan mutation
- UI tidak mengimpor infrastructure repository

---

# 8. Implementation Order

Implementasi wajib dilakukan dalam urutan berikut:

1. Domain payable types and helpers
2. Repository interfaces
3. Prisma schema and migration
4. Prisma repository implementations
5. Application use case implementations
6. Application tests
7. Infrastructure integration tests
8. API routes
9. UI screens
10. Boundary/architecture tests

UI tidak boleh diimplementasikan sebelum application use case dan API route tersedia.

---

# 9. Final Decision

Step 7 implementation mapping ini bersifat mengikat sebagai panduan lokasi dan boundary file.

Dokumen ini tidak boleh digunakan untuk memperluas scope Step 7.

Step 7 tetap:

- Supplier Payable only
- append-only
- derived outstanding
- no inventory mutation
- no accounting
- no asset valuation
- no receiving inspection

Status:

READY TO SUPPORT STEP 7 IMPLEMENTATION

