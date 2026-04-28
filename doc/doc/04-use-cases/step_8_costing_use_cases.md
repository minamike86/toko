# Step 8 — Costing Engine Use Cases

Status: READY FOR IMPLEMENTATION
Source of Truth:

* ADR-0022 — Costing Engine
* Step 8 — Costing Engine Implementation Contract
* Step 8 — Costing Engine File Mapping

Change Type:

* Additive
* Non-breaking
* New Domain: Costing

---

## Use Case List

1. Update Cost From Accepted Procurement
2. Snapshot Cost For Sales Order
3. Get Variant Cost View

Tidak ditambahkan use case lain pada Step 8 agar tidak keluar dari kontrak implementasi yang sudah dikunci.

---

# 1. Use Case — Update Cost From Accepted Procurement

## Tujuan

Memperbarui `CostState.currentCost` per `ProductVariant` berdasarkan item procurement yang sudah accepted melalui `FinalizeInspectionAcceptance`.

Use case ini adalah satu-satunya entry point perubahan cost pada Step 8.

---

## Actor

* SYSTEM / Application Orchestration

Use case ini tidak boleh dipanggil langsung oleh UI, API route, script, atau proses manual.

---

## Preconditions

* `FinalizeInspectionAcceptance` berhasil
* Item memiliki accepted quantity
* `PurchaseItem.unitCost` tersedia
* Rejected dan quarantined item tidak dihitung
* acceptedItems tidak boleh kosong

---

## Input DTO

```ts
export type UpdateCostFromAcceptedProcurementInput = {
  purchaseOrderId: string;
  acceptedAt: Date;
  actor: {
    actorId: string;
    role: "WAREHOUSE" | "ADMIN";
  };
  acceptedItems: Array<{
    purchaseItemId: string;
    variantId: string;
    unitCost: number;
    acceptedQuantity: number;
  }>;
};
```

---

## Output DTO

```ts
export type UpdateCostFromAcceptedProcurementResult = {
  updatedItems: Array<{
    variantId: string;
    currentCost: number;
    lastPurchaseOrderId: string;
    lastPurchaseItemId: string;
    lastUpdatedAt: Date;
  }>;
};
```

---

## Main Flow

1. Dipanggil setelah `FinalizeInspectionAcceptance`
2. Filter hanya accepted items
3. Validasi unitCost integer dan ≥ 0
4. Jika CostState belum ada → buat baru
5. Jika ada → update currentCost
6. Gunakan unitCost terakhir (deterministic order)
7. Simpan metadata update
8. Jika terdapat beberapa acceptedItems dengan variantId yang sama,
maka processing harus mengikuti urutan deterministik (stable order),
dan update terakhir menjadi currentCost final.

---

## Rejection Flow

* INVALID_COST_AMOUNT
* INVALID_COST_SOURCE

---

## Postconditions

* CostState tersedia
* Cost mengikuti accepted item terakhir
* Tidak ada perubahan Inventory / Sales

---

## Transaction Rule

Harus berjalan dalam satu transaction dengan `FinalizeInspectionAcceptance`.
Jika gagal, seluruh proses harus rollback.

---

## Invariants

* Cost hanya berubah dari accepted procurement item
* Cost tidak boleh diubah dari UI / script / manual
* Rejected dan quarantined tidak mempengaruhi cost
* CostState tidak boleh dihapus
* CostState hanya boleh dibuat melalui use case ini (UpdateCostFromAcceptedProcurement)
* Costing tidak boleh mengubah Inventory, Sales, Payable, atau Accounting

---

# 2. Use Case — Snapshot Cost For Sales Order

## Tujuan

Mengambil snapshot `currentCost` dan menyimpannya sebagai `OrderItem.cogsAmount`.

---

## Actor

* SYSTEM / Sales Application

Dipanggil oleh `CreateOrder`.

---

## Preconditions

* Semua variant memiliki CostState

---

## Input DTO

```ts
export type SnapshotCostForSalesOrderInput = {
  orderItems: Array<{
    variantId: string;
    quantity: number;
    sellingPrice: number;
  }>;
};
```

---

## Output DTO

```ts
export type SnapshotCostForSalesOrderResult = {
  items: Array<{
    variantId: string;
    quantity: number;
    sellingPrice: number;
    cogsAmount: number;
  }>;
};
```

---

## Main Flow

1. Load CostState
2. Validasi semua tersedia
3. Assign currentCost → cogsAmount
4. Return ke CreateOrder

---

## Rejection Flow

* COST_STATE_NOT_FOUND
* INVALID_COST_AMOUNT

Jika CostState tidak ditemukan:

* validasi wajib di application layer
* UI tidak boleh fallback
* order harus ditolak

---

## Postconditions

* cogsAmount tersimpan
* cogsAmount immutable
* perubahan cost di masa depan tidak mempengaruhi transaksi lama

---

## Invariants

* Sales tidak menghitung cost
* Snapshot hanya sekali saat order dibuat
* Tidak boleh ada recalculation

---

# 3. Use Case — Get Variant Cost View

## Tujuan

Menyediakan data cost read-only untuk UI.

---

## Actor

* ADMIN

---

## Input DTO

```ts
export type GetVariantCostViewInput = {
  variantIds?: string[];
  includeReplacementMargin: boolean;
};
```

---

## Output DTO

```ts
export type GetVariantCostViewResult = {
  items: Array<{
    variantId: string;
    currentCost: number;
    lastUpdatedAt: Date;
    replacementMargin?: number;
  }>;
};
```

---

## Main Flow

1. Load CostState
2. Jika `includeReplacementMargin = true`, ambil sellingPrice dari read model / pricing source yang sudah disetujui.
3. Validasi sellingPrice tidak berasal dari input UI langsung sebagai source of truth.
4. Hitung replacement margin.

---

## Rules

* read-only
* tidak boleh mutation
* tidak boleh create CostState
* tidak boleh menghitung ulang COGS lama
* tidak boleh fallback cost 0
* hanya membaca CostState

---

## Postconditions

* tidak ada perubahan data sistem

---

## Invariants

* tidak boleh menjadi domain baru
* tidak boleh memiliki business rule costing
* hanya konsumsi data
