# Step 6.5 — Final Code Contract (FINAL)
## Measurement & Unit Normalization

## Status
IMPLEMENTATION CONTRACT — PRE-CODE LOCKED (FINAL)

---

## Tujuan

Dokumen ini adalah **source of truth final** untuk:

- DTO contract
- error contract (terstratifikasi)
- boundary interface
- validation order
- mapping rule
- flow contract
- skeleton implementation (tanpa business logic)

Dokumen ini menggantikan versi sebelumnya dan sudah menghilangkan seluruh ambiguity.

---

# 1. Locked Decisions

- Catalog: owner unit & conversion rule
- Procurement: owner snapshot transaksi
- Inventory: owner quantity (canonical-only)
- Conversion: hanya di application layer
- Tidak ada fallback
- Tidak ada UI conversion
- Inventory tidak mengetahui conversion rule
- Inventory tidak memverifikasi canonical

---

# 2. Final Structure

```
src/modules/procurement/application/receive/
  receive-purchase-order.types.ts
  receive-purchase-order.errors.ts
  procurement-inventory.port.ts
  receive-purchase-order.ts

src/modules/inventory/application/receive/
  receive-stock.types.ts
  receive-stock.errors.ts
  receive-stock.ts

src/modules/shared/application/unit-normalization/
  procurement-unit-normalization.types.ts
  procurement-unit-normalization.errors.ts
  procurement-unit-normalization.port.ts
```

---

# 3. DTO CONTRACT

## 3.1 Normalize Types

```ts
export type NormalizeProcurementItemInput = {
  variantId: string;
  transactionUnit: string;
  transactionQuantity: number;
  referenceId: string;
};

export type NormalizeProcurementItemResult = {
  variantId: string;
  transactionUnit: string;
  transactionQuantity: number;
  canonicalUnit: string;
  canonicalQuantity: number;
  referenceId: string;
};
```

---

## 3.2 Procurement → Inventory DTO

```ts
export type ReceiveProcurementStockItem = {
  variantId: string;
  quantity: number;
  reason: string;
  referenceId: string;
};

export type ReceiveProcurementStockInput = {
  items: ReceiveProcurementStockItem[];
};
```

---

## 3.3 Receive Purchase Order DTO

```ts
export type ReceivePurchaseOrderInput = {
  purchaseOrderId: string;
  receivedAt?: Date;
  actor: {
    actorId: string;
    role: string;
  };
};
```

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

export type ReceivePurchaseOrderResultItem = {
  variantId: string;
  productNameSnapshot: string;
  variantNameSnapshot: string;
  unitSnapshot: string;
  quantity: number;
  unitCost: number;
  subtotalCost: number;
};
```

---

## 3.4 Receive Stock DTO

```ts
export type ReceiveStockRequest = {
  variantId: string;
  quantity: number; // canonical (assumed)
  reason: string;
  referenceId?: string;
};
```

---

# 4. ERROR CONTRACT

## 4.1 Normalization

```ts
export type ProcurementNormalizationErrorCode =
  | "INVALID_INPUT_UNIT"
  | "CONVERSION_RULE_NOT_FOUND"
  | "NORMALIZED_QUANTITY_INVALID"
  | "NON_CANONICAL_QUANTITY";
```

## 4.2 Procurement

```ts
export type ReceivePurchaseOrderErrorCode =
  | "PURCHASE_ORDER_NOT_FOUND"
  | "PURCHASE_ORDER_ALREADY_RECEIVED"
  | "PURCHASE_ORDER_ALREADY_CANCELED"
  | "FORBIDDEN";
```

## 4.3 Inventory

```ts
export type ReceiveStockErrorCode =
  | "INVENTORY_NOT_FOUND"
  | "INVALID_QUANTITY"
  | "INVALID_STOCK_REASON";
```

---

# 5. PORT CONTRACT

## 5.1 Unit Normalization Port

```ts
export interface ProcurementUnitNormalizationPort {
  normalizeProcurementItem(
    input: NormalizeProcurementItemInput,
  ): Promise<NormalizeProcurementItemResult>;
}
```

---

## 5.2 Procurement → Inventory Port

```ts
export interface ProcurementInventoryPort {
  receiveProcurementStock(
    input: ReceiveProcurementStockInput,
  ): Promise<void>;
}
```

---

# 6. MAPPING

```ts
export function toReceiveProcurementStockItem(
  item: NormalizeProcurementItemResult,
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

# 7. FLOW CONTRACT

## ReceivePurchaseOrder

1. validate actor
2. load PO
3. validate state
4. normalize all items
5. build request
6. call inventory
7. mutate state
8. persist

## ReceiveStock

1. validate input
2. load inventory
3. increase
4. movement

---

# 8. SKELETON IMPLEMENTATION

## 8.1 ReceivePurchaseOrder (Application Layer)

```ts
export class ReceivePurchaseOrder {
  constructor(
    private readonly normalizationPort: ProcurementUnitNormalizationPort,
    private readonly inventoryPort: ProcurementInventoryPort,
    private readonly repository: any,
  ) {}

  async execute(
    input: ReceivePurchaseOrderInput,
  ): Promise<ReceivePurchaseOrderResult> {
    // 1. validate actor

    // 2. load purchase order

    // 3. validate state

    // 4. normalize items

    // 5. map to inventory request

    // 6. call inventory port

    // 7. mutate order state

    // 8. persist

    throw new Error("NOT_IMPLEMENTED");
  }
}
```

---

## 8.2 ReceiveStock (Inventory Layer)

```ts
export class ReceiveStock {
  constructor(private readonly repository: any) {}

  async execute(input: ReceiveStockRequest): Promise<void> {
    // 1. validate quantity > 0

    // 2. load inventory item

    // 3. increase quantity

    // 4. create movement

    throw new Error("NOT_IMPLEMENTED");
  }
}
```

---

# 9. RULE KRITIS

- Inventory tidak boleh melakukan conversion
- Inventory tidak boleh throw NON_CANONICAL
- Conversion hanya di application layer
- Tidak ada fallback
- Tidak ada partial normalization

---

# 10. KESIMPULAN

Dokumen ini sudah:

- clean
- tidak ambigu
- boundary jelas
- siap implementasi

Ini adalah **final source of truth Step 6.5**.

