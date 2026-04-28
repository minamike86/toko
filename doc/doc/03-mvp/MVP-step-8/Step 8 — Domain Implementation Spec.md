# Step 8 — Domain Implementation Spec

Status: READY FOR IMPLEMENTATION
Scope: Costing Domain Only
Layer: Domain

---

# 1. Aggregate Root

## CostState

Merepresentasikan cost aktif per `ProductVariant`.

---

## Properties

```ts
type CostStateProps = {
  variantId: string;
  currentCost: number;
  lastPurchaseOrderId: string;
  lastPurchaseItemId: string;
  lastUpdatedAt: Date;
};
```

---

## Constructor Rule

Constructor tidak boleh langsung digunakan dari luar.

Pembuatan harus melalui factory:

```ts
CostStateFactory.create(...)
CostStateFactory.rehydrate(...)
```

---

# 2. Invariants (MANDATORY)

Harus selalu benar setelah object dibuat:

* currentCost harus integer
* currentCost ≥ 0
* variantId tidak boleh kosong
* lastPurchaseOrderId tidak boleh kosong
* lastPurchaseItemId tidak boleh kosong
* lastUpdatedAt harus valid Date
* cost hanya boleh berasal dari accepted procurement item
* cost tidak boleh berasal dari UI, script manual, atau domain lain
* CostState tidak boleh dihapus setelah dibuat

---

# 3. Domain Behavior

## Method: updateFromAcceptedProcurement

```ts
updateFromAcceptedProcurement(params: {
  unitCost: number;
  purchaseOrderId: string;
  purchaseItemId: string;
  updatedAt: Date;
}): void
```

### Rules

* unitCost harus integer ≥ 0
* unitCost berasal dari accepted procurement item
* method ini tidak boleh dipanggil dari luar use case yang valid
* jika beberapa update terjadi untuk variant yang sama dalam satu proses, harus menggunakan urutan deterministik dan update terakhir menjadi final state
* overwrite currentCost (last purchase wins)

### Effect

```ts
this.currentCost = unitCost;
this.lastPurchaseOrderId = purchaseOrderId;
this.lastPurchaseItemId = purchaseItemId;
this.lastUpdatedAt = updatedAt;
```

---

## Method: getCurrentCost

```ts
getCurrentCost(): number
```

Rule:

* return immutable value
* tidak boleh expose internal state mutable

---

# 4. Factory

## CostStateFactory

### create (first creation)

```ts
create(params: {
  variantId: string;
  unitCost: number;
  purchaseOrderId: string;
  purchaseItemId: string;
  createdAt: Date;
}): CostState
```

### Rules

* hanya dipanggil dari UpdateCostFromAcceptedProcurement
* validate semua invariant
* set initial state

---

### rehydrate (from persistence)

```ts
rehydrate(props: CostStateProps): CostState
```

### Rules

* tidak boleh mengubah data
* hanya validasi invariant

---

# 5. Domain Errors

```ts
class InvalidCostAmountError extends Error {}
class InvalidCostSourceError extends Error {}
class CostStateNotFoundError extends Error {}
```

---

# 6. Forbidden Behavior

Domain TIDAK BOLEH:

* mengetahui Prisma
* mengetahui database
* mengetahui HTTP / API
* menghitung margin
* mengakses Inventory
* mengakses Sales
* membuat snapshot COGS
* melakukan logging
* melakukan authorization

---

# 7. Boundary Enforcement

## Allowed

* pure business rule
* invariant validation
* state mutation internal

## Not Allowed

* IO operation
* repository access
* cross-domain call

---

# 8. Lifecycle

```txt
CREATED → UPDATED → UPDATED → ...
```

Tidak ada:

* delete
* archive
* versioning (Step 8)

---

# 9. Consistency Rule

* Satu variant hanya punya satu CostState
* Update bersifat overwrite
* Tidak ada histori di domain core
* CostState harus tersedia sebelum digunakan oleh use case lain
* tidak boleh menggunakan fallback cost (termasuk 0) sebagai pengganti CostState

---

# 10. Testing Specification (Domain)

## Harus ada test

1. create CostState valid
2. reject cost negatif
3. reject cost decimal
4. update cost berhasil
5. update overwrite previous cost
6. invariant violation throw error

---

# 11. Integration Contract (Domain View)

Domain tidak tahu:

* FinalizeInspectionAcceptance
* CreateOrder

Domain hanya expose:

* updateFromAcceptedProcurement
* getCurrentCost

---

# 12. Design Constraint

* No any
* Strict typing
* Immutable exposure
* Explicit method naming
* Tidak ada logic tersembunyi

---

# 13. Result

Dengan spec ini:

* implementasi domain bisa langsung dibuat
* tidak ada ambiguity
* tidak ada leakage ke layer lain
* siap untuk diintegrasikan ke application layer
