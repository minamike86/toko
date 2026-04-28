# Step 8 — Costing Engine Implementation Contract

Status: READY FOR IMPLEMENTATION
Depends On:

* Step 7.5 GOVERNANCE COMPLETE
* ADR-0022 DESIGN LOCKED

## Classification

* Additive
* Non-breaking
* New domain: Costing

---

# 1. Domain Layer

## Aggregate / Entity

### CostState

Merepresentasikan cost aktif per ProductVariant.

Fields:

* variantId
* currentCost
* lastUpdatedAt
* lastPurchaseOrderId
* lastPurchaseItemId

---

## Invariants

* currentCost harus integer rupiah
* currentCost ≥ 0
* variantId wajib ada
* cost hanya boleh berasal dari accepted procurement item
* tidak boleh decimal
* tidak boleh manual override
* CostState tidak boleh dihapus setelah dibuat

---

## Domain Errors

* CostStateNotFoundError
* InvalidCostAmountError
* InvalidCostSourceError

---

# 2. Repository Contract

## CostStateRepository

Required methods:

* findByVariantId(variantId)
* save(costState)
* findManyByVariantIds(variantIds)

Persistence rule:

* satu CostState per ProductVariant
* update menggantikan currentCost dengan unitCost terakhir yang accepted
* tidak menyimpan histori pada Step 8 core
* tidak boleh delete CostState

---

# 3. Application Use Cases

## UpdateCostFromAcceptedProcurement

Dipicu setelah `FinalizeInspectionAcceptance`.

⚠️ Constraint penting:

Use case ini:

* tidak boleh dipanggil dari UI
* tidak boleh dipanggil dari API route secara langsung
* tidak boleh dipanggil dari script/manual

Hanya boleh dipanggil oleh:

* orchestration application setelah `FinalizeInspectionAcceptance` berhasil

Jika CostState untuk variant belum ada, maka use case ini wajib membuat CostState baru.

Pembuatan CostState pertama kali hanya boleh terjadi melalui proses ini.

---

### Input

* purchaseOrderId
* acceptedItems:

  * purchaseItemId
  * variantId
  * unitCost
  * acceptedQuantity
* acceptedAt
* actor

---

### Rules

* hanya accepted quantity yang boleh memicu update cost
* rejected dan quarantined tidak boleh mempengaruhi cost
* unitCost harus berasal dari PurchaseItem
* currentCost = unitCost terakhir yang accepted
* currentCost tidak boleh berubah tanpa adanya accepted procurement item baru
* jika terdapat beberapa accepted item untuk variant yang sama dalam satu proses,
  maka currentCost mengikuti item terakhir berdasarkan urutan processing (deterministic order)
* CostState harus selalu tersedia sebelum transaksi sales dilakukan

---

## SnapshotCostForSalesOrder

Digunakan oleh `CreateOrder`.

---

### Input

* orderItems:

  * variantId
  * quantity
  * sellingPrice

---

### Output

* orderItems dengan cogsAmount

---

### Rules

* cogsAmount = currentCost saat order dibuat
* cogsAmount bersifat immutable
* tidak boleh berubah setelah order dibuat
* jika CostState tidak ditemukan:

  * validasi ini harus dilakukan di application layer (bukan domain atau UI)
  * UI tidak boleh menangani kondisi ini sebagai fallback logic
  * order harus ditolak (explicit business error)

---

## GetVariantCostView

Use case read-only untuk delivery/UI.

---

### Output

* variantId
* currentCost
* lastUpdatedAt
* replacementMargin (opsional jika ada selling price)

---

### Rules

* read-only
* tidak ada mutation
* tidak boleh menghitung ulang transaksi lama
* reporting hanya boleh mengonsumsi data ini
* reporting tidak boleh memiliki logic costing sendiri

---

# 4. Integration Boundary

## Procurement → Costing

Hanya setelah final acceptance.

Allowed:

* FinalizeInspectionAcceptance memanggil use case costing

Not allowed:

* Procurement domain import Costing domain
* Procurement langsung akses repository CostState

---

## Sales → Costing

Allowed:

* CreateOrder mengambil snapshot cost via application layer

Not allowed:

* Sales domain menghitung cost
* Sales memodifikasi CostState

---

## Costing → Inventory

Tidak diperbolehkan.

Costing:

* tidak boleh mengubah stock
* tidak boleh membaca logic internal inventory

---

# 5. Delivery / UI

UI hanya boleh dibuat setelah domain dan application layer tervalidasi.

---

## Allowed screens

* Current cost per variant
* Actual margin
* Replacement margin

---

## UI Rules

* UI tidak boleh query Prisma langsung
* UI tidak boleh menghitung COGS
* UI hanya consume DTO
* UI tidak boleh edit cost
* UI tidak boleh memanggil UpdateCostFromAcceptedProcurement

---

# 6. Testing Strategy

## Domain Test

* validasi CostState dengan integer rupiah
* reject cost negatif
* reject cost non-integer
* update cost dari accepted item

---

## Application Test

* cost update hanya dari final acceptance
* ignored rejected/quarantine
* snapshot cost ke order
* reject order jika cost tidak tersedia

---

## Integration Test

* procurement → update cost
* sales → snapshot immutable
* update cost berikutnya tidak mengubah transaksi lama
* UI mendapatkan current cost + replacement margin

---

## Boundary Test

* Inventory tidak import Costing
* Costing tidak import Inventory repository
* UI tidak import Prisma
* Costing tidak membuat journal

---

# 7. Implementation Order

1. Costing domain
2. Costing repository interface
3. Prisma schema
4. Prisma repository implementation
5. Costing application use cases
6. Integrasi ke Sales (snapshot)
7. Integrasi ke Procurement (final acceptance)
8. Unit test
9. Integration test
10. API route
11. UI finalization

---

# 8. Deferred

* FIFO
* Moving Average
* Batch / Lot
* Cost adjustment
* Tax
* Accounting journal
* Period closing
