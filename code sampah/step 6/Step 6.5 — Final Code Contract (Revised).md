# Step 6.5 — Final Code Contract (Revised)
## Measurement & Unit Normalization

## Status
IMPLEMENTATION CONTRACT — PRE-CODE LOCKED (REVISED)

---

## Tujuan

Dokumen ini menggabungkan:

- arah implementasi Step 6.5
- kontrak DTO
- error contract (terstratifikasi)
- boundary interface (dipersempit)
- validation order (mengikat)
- mapping rule
- testing contract minimum

Dokumen ini adalah **source of truth kontrak application layer sebelum coding dimulai**.

---

## Kedudukan Dokumen

Jika terjadi konflik:

- domain document menang untuk invariant
- ADR menang untuk keputusan arsitektural
- dokumen ini menang untuk DTO, error, dan boundary contract

---

# 1. Context

Step 6.5 memperkenalkan normalisasi unit tanpa mengubah histori dan tanpa mengubah invariant inti.

---

# 2. Goal

- canonical unit per `ProductVariant`
- conversion rule eksplisit (Catalog-owned)
- seluruh quantity Inventory dalam canonical unit
- tidak ada ambiguity unit
- conversion hanya di application layer

---

# 3. Locked Decisions (Mengikat)

- Catalog: owner unit & conversion rule
- Inventory: owner quantity (canonical-only)
- Procurement: owner snapshot transaksi
- Conversion: hanya di application layer
- Tidak ada fallback / chaining / two-way
- UI & Reporting: tidak boleh melakukan conversion

---

# 4. Prinsip Boundary

- UI hanya parsing input
- Application layer melakukan normalisasi
- Inventory **tidak mengetahui** conversion rule
- Inventory **tidak memverifikasi** unit eksternal
- Procurement **tidak melakukan conversion**

---

# 5. Scope Implementasi

## Catalog
- menyediakan canonical unit & conversion rule

## Procurement
- menyimpan `unitSnapshot`
- meminta normalisasi sebelum Inventory call

## Inventory
- menerima **canonical quantity saja**
- tidak tahu unit lain

## Application Layer
- normalisasi quantity
- fail-fast jika conversion gagal

---

# 6. DTO Contract

## 6.1 ReceivePurchaseOrderInput

```ts
export type ReceivePurchaseOrderInput = {
  purchaseOrderId: string;
  receivedAt?: Date;
  actor: ActorContext;
};
```

---

## 6.2 NormalizedReceivePurchaseItem

```ts
export type NormalizedReceivePurchaseItem = {
  variantId: string;
  transactionUnit: string;
  transactionQuantity: number;
  canonicalUnit: string;
  canonicalQuantity: number;
  referenceId: string;
};
```

---

## 6.3 ReceiveProcurementStockItem

```ts
export type ReceiveProcurementStockItem = {
  variantId: string;
  quantity: number; // canonical
  reason: string;
  referenceId: string;
};
```

---

## 6.4 ReceiveStockRequest

```ts
export type ReceiveStockRequest = {
  variantId: string;
  quantity: number; // canonical (assumed, not validated via unit)
  reason: string;
  referenceId?: string;
};
```

### Catatan Penting (Revisi Mayor)

- Inventory **TIDAK memverifikasi canonical vs non-canonical**
- Error `NON_CANONICAL_QUANTITY` **BUKAN tanggung jawab ReceiveStock**
- Enforcement canonical terjadi di caller (application layer Procurement)

---

## 6.5 ReceivePurchaseOrderResult

```ts
export type ReceivePurchaseOrderResult = {
  id: string;
  supplierId: string;
  status: string;
  receivedAt: Date;
  receivedBy: string;
  totalTransactionQuantity: number;
  totalCost: number;
  items: ReceivePurchaseOrderResultItem[];
};
```

```ts
export type ReceivePurchaseOrderResultItem = {
  variantId: string;
  productNameSnapshot: string;
  variantNameSnapshot: string;
  unitSnapshot: string;
  quantity: number; // transaction quantity
  unitCost: number;
  subtotalCost: number;
};
```

### Revisi Mayor

- `totalQuantity` → diganti menjadi `totalTransactionQuantity`
- tidak ada agregasi canonical di result
- histori procurement tetap utuh

---

# 7. Error Contract (Revised)

## 7.1 Prinsip

- error harus eksplisit
- tidak boleh generic
- tidak boleh menyamarkan boundary

---

## 7.2 Error Stratification (WAJIB)

### Normalization

```ts
export type NormalizationErrorCode =
  | "INVALID_INPUT_UNIT"
  | "CONVERSION_RULE_NOT_FOUND"
  | "NORMALIZED_QUANTITY_INVALID";
```

### Procurement

```ts
export type ReceivePOErrorCode =
  | "PURCHASE_ORDER_NOT_FOUND"
  | "PURCHASE_ORDER_ALREADY_RECEIVED"
  | "PURCHASE_ORDER_ALREADY_CANCELED"
  | "FORBIDDEN";
```

### Inventory

```ts
export type InventoryErrorCode =
  | "INVENTORY_NOT_FOUND"
  | "INVALID_QUANTITY"
  | "INVALID_STOCK_REASON";
```

### Catatan

- `NON_CANONICAL_QUANTITY` **hanya boleh muncul di application layer sebelum Inventory call**
- tidak boleh dilempar dari Inventory

---

## 7.3 Error Type

```ts
export type UseCaseError<TCode extends string> = {
  code: TCode;
  message: string;
};
```

---

# 8. Boundary Interface Contract

## 8.1 UnitNormalizationPort (REVISED — DIPERSEMPIT)

```ts
export interface UnitNormalizationPort {
  normalizeProcurementItem(
    input: NormalizeUnitInput,
  ): Promise<NormalizeUnitResult>;
}
```

### Revisi Mayor

- bukan conversion engine global
- hanya untuk **Procurement normalization use case**
- tidak boleh reusable bebas lintas domain

---

## 8.2 InventoryProcurementPort

```ts
export interface InventoryProcurementPort {
  receiveProcurementStock(
    input: { items: ReceiveProcurementStockItem[] },
  ): Promise<void>;
}
```

---

# 9. Validation Order (Mengikat)

1. validate actor
2. load PO
3. validate state
4. normalize ALL items
5. build inventory request
6. call inventory
7. mutate state
8. persist

### Rule

- normalization failure STOP before inventory
- no partial normalization
- no state mutation before inventory success

---

# 10. Mapping Rules

## Procurement → Normalized

- dilakukan di application layer
- tidak mengubah snapshot

## Normalized → Inventory DTO

```ts
export function toReceiveProcurementStockItem(
  item: NormalizedReceivePurchaseItem,
  reason: string,
): ReceiveProcurementStockItem {
  return {
    variantId: item.variantId,
    quantity: item.canonicalQuantity,
    reason,
    referenceId: item.referenceId,
  };
}
```

---

# 11. Flow Contract

## ReceivePurchaseOrder

- normalize → inventory → mutate → persist

## ReceiveStock

- validate → load → increase → movement

---

# 12. Testing Contract

## Application

- reject conversion failure
- reject invalid unit
- ensure canonical-only before inventory

## Integration

- canonical success
- reject missing conversion

## Architecture

- no conversion in Inventory
- no conversion in UI
- no cross-boundary leak

---

# 13. Non-Goals

- costing
- accounting
- reporting logic
- fallback
- multi-step conversion

---

# 14. Rollout

1. implement normalization port
2. update procurement flow
3. enforce canonical-only inventory
4. test

---

# 15. Kesimpulan

Dokumen ini mengunci:

- DTO jelas
- error terstratifikasi
- boundary tidak bocor
- Inventory tetap bersih
- tidak ada fallback

Dokumen ini sekarang **clean dan siap implementasi tanpa ambiguity**.

