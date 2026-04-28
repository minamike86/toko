# Step 4.4 – Inventory Consistency Stabilization

## Full Implementation Document (Batch 1 – Batch 3)

**Scope:** Inventory Domain  
**Step:** 4.4  
**Status:** READY FOR IMPLEMENTATION & VALIDATION  
**Status Update: HISTORICAL DOCUMENT**

Dokumen ini merepresentasikan baseline desain dan rencana implementasi Step 4.4 sebelum final execution selesai.
Status implementasi final Step 4.4 sudah completed.

---

# 1. Overview

Step 4.4 bertujuan untuk memastikan bahwa:

- snapshot inventory (`InventoryItem`) konsisten dengan histori (`StockMovement`)
- mismatch dapat dideteksi secara eksplisit
- sistem tetap jujur terhadap keterbatasan data transisional
- tidak ada auto-repair atau manipulasi data tersembunyi

Step ini adalah **verification layer**, bukan redesign domain.

---

# 2. Batch 1 – Design & Contract

## 2.1 Use Case

```text
CheckInventoryConsistency
```

Lokasi:

```
src/modules/inventory/application/CheckInventoryConsistency.ts
```

---

## 2.2 Input Contract

```ts
export type CheckInventoryConsistencyInput = {
  variantId: string;
};
```

---

## 2.3 Output Contract

```ts
export type CheckInventoryConsistencyResult = {
  variantId: string;
  actualQuantity: number;
  expectedQuantity: number | null;
  difference: number | null;
  isConsistent: boolean;
  status: "CONSISTENT" | "INCONSISTENT" | "LIMITED";
  movementCount: number;
  limitationReason?: string;
};
```

---

## 2.4 Repository Contract

```ts
listMovementsByVariantId(
  variantId: string
): Promise<ReadonlyArray<StockMovementReadModel>>;
```

---

## 2.5 Read Model

```ts
export type StockMovementReadModel = {
  id: string;
  productId: string;
  variantId: string | null;
  type: string;
  origin: string;
  quantity: number;
  reason: string;
  referenceId: string | null;
  occurredAt: Date;
};
```

---

## 2.6 Behavior Rules

- checker bersifat read-only
- tidak boleh write
- tidak boleh auto-fix
- tidak boleh infer data yang tidak tersedia

---

## 2.7 ADJUST Policy

Jika movement mengandung `ADJUST`:

```
status = "LIMITED"
```

---

# 3. Batch 2 – Implementation

## 3.1 File Changes

### New

- CheckInventoryConsistency.ts

### Updated

- InventoryRepository.ts
- PrismaInventoryRepository.ts

---

## 3.2 Algorithm

1. find snapshot
2. throw error jika tidak ada
3. load movements
4. jika ada ADJUST → LIMITED
5. jika hanya IN/OUT → hitung
6. bandingkan snapshot

---

## 3.3 Error

```ts
InventoryConsistencyTargetNotFoundError
```

---

## 3.4 Repository Rules

- read-only
- tidak ada business logic
- tidak ada transformasi

---

## 3.5 Expected Output Behavior

| Kondisi | Output |
|--------|--------|
| match | CONSISTENT |
| mismatch | INCONSISTENT |
| unknown/adjust | LIMITED |

---

# 4. Batch 3 – Test Plan

## 4.1 Scope

- CheckInventoryConsistency
- Repository read path

---

## 4.2 Test Categories

### A – Normal

- CONSISTENT
- INCONSISTENT

### B – Limitation

- ADJUST
- unknown type

### C – Error

- inventory tidak ditemukan

### D – Read Only

- tidak modify snapshot
- tidak create movement

### E – Integration

- ReceiveStock
- IssueStock
- AdjustStock

### F – Injection

- manual mismatch snapshot
- manual insert movement

---

## 4.3 Expected Status

| Status | Meaning |
|--------|--------|
| CONSISTENT | data valid |
| INCONSISTENT | mismatch |
| LIMITED | tidak bisa diverifikasi |

---

## 4.4 Passing Criteria

- semua test utama lolos
- tidak ada side effect
- limitation jujur

---

# 5. Constraint

- tidak ubah reporting
- tidak ubah mutation flow
- tidak rewrite histori
- tidak cleanup Step 4.3

---

# 6. Definition of Done

Step 4.4 selesai jika:

- checker tersedia
- test lulus
- mismatch terdeteksi
- limitation eksplisit
- tidak ada pelanggaran boundary

---

# 7. Catatan Penting

Checker adalah:

> auditor, bukan pelaku

Jika checker mulai memperbaiki data:

> sistem sudah rusak secara konsep

---

# 8. Next Step (Batch 4)

Batch 4 belum didefinisikan secara detail dalam dokumen ini.

Namun secara arah:

- audit hasil implementasi
- evaluasi limitation ADJUST
- kemungkinan evolusi persistence (jika diperlukan)
- dokumentasi final state Step 4.4

Batch 4 adalah tahap **closing & decision**, bukan implementasi awal.

---

# Penutup

Dokumen ini mengunci seluruh implementasi Step 4.4 dari:

- desain
- implementasi
- hingga validasi

Tujuannya sederhana:

> memastikan sistem inventory tidak hanya berjalan,
> tapi juga bisa dipercaya.

**Status Update: HISTORICAL (Implementation Completed in Step 4.4 Batch 3)**

Dokumen ini merepresentasikan design awal sebelum implementasi final.
Lihat:

- log_note.md
- step_4_4_inventory_consistency_implementation_plan.md
- `step_4_4_batch_4_persistence_cleanup_and_closure.md`
