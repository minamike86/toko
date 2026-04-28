# Step 6.5 — Consolidated Design and Code Contract

## Measurement & Unit Normalization

## Status

CONSOLIDATED SOURCE OF TRUTH

Dokumen ini menggabungkan artefak Step 6.5 yang sebelumnya tersebar menjadi satu urutan yang utuh dan jelas:

1. konteks dan tujuan Step 6.5
2. keputusan desain yang dikunci
3. scope implementasi
4. dampak ke use case
5. kontrak DTO, error, dan port
6. flow contract
7. testing contract
8. rollout
9. final naming
10. skeleton implementation

Dokumen ini menggantikan pembacaan terpisah terhadap:

- `step_6_5_measurement_unit_normalization_implementation_plan.md`
- `Step 6.5 — DTO & Error Contract Specification.md`
- `Step 6.5 — Final Code Contract.md`
- `Step 6.5 — Final Code Contract (Revised).md`
- bagian Step 6.5 yang tersebar di `step_6.md`

## Step 6.5 — Measurement & Unit Normalization

- ADR / Decision Backbone: ✅
- Domain Update: ✅ (non-breaking)
- Use Case Update: ✅ (ReceivePurchaseOrder, ReceiveStock contract)
- Implementation: ⚠️ (pending)
- Test: ❌ (belum)
- Log Note / Closure: ❌

Status: IN PROGRESS

---

# 1. Context

Step 4 telah mengunci `ProductVariant` sebagai identity operasional.

Step 6 telah mengunci Procurement, receive flow, dan boundary quantity.

Namun sebelum Step 6.5:

- belum ada standar unit internal yang eksplisit
- belum ada conversion rule resmi yang terkunci sebagai kontrak implementasi
- receive flow masih berisiko menerima quantity yang belum ternormalisasi

Step 6.5 memperkenalkan normalisasi unit tanpa:

- mengubah histori
- mengubah invariant inti yang sudah dikunci
- memindahkan logic ke UI
- menjadikan Inventory mengetahui conversion rule

---

# 2. Goal

Step 6.5 memiliki tujuan berikut:

- menetapkan canonical unit per `ProductVariant`
- menetapkan conversion rule eksplisit yang dimiliki Catalog
- memastikan seluruh quantity Inventory berada dalam canonical unit
- menolak semua ambiguity unit
- memastikan conversion hanya terjadi di application layer

Tujuan Step 6.5 bukan fleksibilitas.
Tujuan utamanya adalah **determinisme dan konsistensi sistem**.

---

# 3. Locked Decisions

Keputusan berikut bersifat mengikat:

- Catalog adalah owner unit dan conversion rule
- Procurement adalah owner snapshot transaksi
- Inventory adalah owner quantity
- conversion hanya boleh dilakukan di application layer
- Inventory bersifat canonical-only
- Procurement tidak memiliki conversion rule
- UI tidak boleh melakukan conversion
- Reporting tidak boleh melakukan conversion
- tidak ada fallback
- tidak ada chaining
- tidak ada two-way conversion
- `NON_CANONICAL_QUANTITY` bukan error Inventory; error ini hanya boleh muncul di application layer sebelum Inventory dipanggil

---

# 4. Prinsip Boundary

## 4.1 Prinsip Umum

- UI hanya parsing input
- application layer membentuk DTO eksplisit
- application layer melakukan normalisasi quantity
- Procurement memuat snapshot transaksi, bukan rule conversion
- Inventory hanya menerima canonical quantity
- Reporting tetap read-only dan tidak memakai kontrak ini untuk business rule baru

## 4.2 Larangan

Tidak boleh:

- memakai `any`
- memakai error generik tanpa makna bisnis
- mengirim raw quantity Procurement langsung ke Inventory
- menjadikan DTO sebagai domain entity terselubung
- menaruh fallback logic di mapper atau helper tersembunyi
- memindahkan conversion ke UI
- memindahkan conversion ke Inventory domain
- menyamarkan conversion failure sebagai inventory failure

---

# 5. Scope Implementasi

## 5.1 Catalog

Catalog bertanggung jawab untuk:

- menyediakan canonical unit
- menyediakan conversion rule resmi
- menjadi source of truth unit

Catalog tidak bertanggung jawab untuk:

- mutasi stock
- orkestrasi receive flow
- fallback conversion

## 5.2 Procurement

Procurement tetap:

- menyimpan `unitSnapshot`
- menyimpan quantity transaksi asli
- tidak melakukan conversion sendiri
- meminta normalisasi melalui application layer sebelum Inventory dipanggil

## 5.3 Inventory

Inventory tetap:

- menjadi source of truth quantity
- menerima hanya canonical quantity
- tidak mengetahui unit alternatif
- tidak mengetahui conversion rule
- tidak memverifikasi canonical vs non-canonical dari basis unit eksternal

## 5.4 Application Layer

Application layer bertanggung jawab untuk:

- memvalidasi input use case
- memuat data domain yang dibutuhkan
- melakukan normalisasi unit
- membentuk request canonical ke Inventory
- menghentikan flow jika conversion gagal

---

# 6. Use Case Impact

## 6.1 ReceivePurchaseOrder

Use case ini wajib:

- memvalidasi actor
- memuat purchase order
- memvalidasi state order
- menormalisasi seluruh item ke canonical quantity
- membentuk inventory request berbasis canonical quantity
- memanggil boundary Inventory
- baru kemudian mengubah state order dan persist

Jika normalisasi gagal:

- flow wajib berhenti sebelum Inventory dipanggil
- tidak boleh ada partial normalization
- tidak boleh ada fallback

## 6.2 ReceiveStock

Use case ini wajib:

- menerima hanya canonical quantity
- tidak melakukan conversion
- tidak mengetahui unit transaksi procurement
- tidak melempar `NON_CANONICAL_QUANTITY`

Penegakan canonical contract dilakukan di caller, yaitu application layer Procurement.

## 6.3 Purchase Order State Contract

Status PurchaseOrder yang sah untuk flow ini adalah:

```ts
export type PurchaseOrderStatus =
  | "CREATED"
  | "RECEIVED"
  | "CANCELED";

```

Aturan transisi yang mengikat:

- hanya `CREATED` yang boleh di-receive
- `RECEIVED` tidak boleh di-receive ulang
- `CANCELED` tidak boleh di-receive
- Step 6.5 tidak membuka partial receive
- Step 6.5 tidak menambah status baru

Konsekuensi:

- `ReceivePurchaseOrder` wajib gagal jika status bukan `CREATED`
- validasi status harus terjadi sebelum normalisasi item
- state mutation hanya boleh terjadi setelah inventory call sukses

---

# 7. DTO Contract

## 7.1 ReceivePurchaseOrderInput

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

### Aturan

- `purchaseOrderId` wajib valid
- `actor.actorId` wajib valid
- `actor.role` wajib valid
- DTO ini tidak membawa conversion rule
- DTO ini tidak membawa canonical quantity dari UI

---

## 7.2 NormalizeProcurementItemInput

```ts
export type NormalizeProcurementItemInput = {
  variantId: string;
  transactionUnit: string;
  transactionQuantity: number;
  referenceId: string;
};
```

### Aturan

- `transactionUnit` adalah snapshot transaksi procurement
- `transactionQuantity` adalah quantity transaksi procurement
- input ini hanya boleh dipakai di application boundary

---

## 7.3 NormalizeProcurementItemResult

```ts
export type NormalizeProcurementItemResult = {
  variantId: string;
  transactionUnit: string;
  transactionQuantity: number;
  canonicalUnit: string;
  canonicalQuantity: number;
  referenceId: string;
};
```

### Aturan

- `canonicalUnit` berasal dari Catalog
- `canonicalQuantity` harus valid dan positif
- hasil ini tidak menjadi domain entity baru

---

## 7.4 ReceiveProcurementStockItem

```ts
export type ReceiveProcurementStockItem = {
  variantId: string;
  quantity: number; // canonical quantity only
  reason: InventoryMutationReason;
  referenceId: string;
};
```

### Aturan

- `quantity` wajib canonical
- `reason` wajib eksplisit
- `referenceId` wajib berisi `purchaseOrderId`
- tidak boleh membawa `unitCost`
- tidak boleh membawa `supplierId`
- tidak boleh membawa `transactionUnit`

---

## 7.5 ReceiveProcurementStockInput

```ts
export type ReceiveProcurementStockInput = {
  items: ReceiveProcurementStockItem[];
};
```

---

## 7.6 ReceiveStockRequest

```ts
export type ReceiveStockRequest = {
  variantId: string;
  quantity: number; // canonical, assumed by contract
  reason: InventoryMutationReason;
  referenceId?: string;
};
```

### Aturan penting

- Inventory tidak memverifikasi unit eksternal
- Inventory tidak mengecek canonical vs non-canonical dari basis unit
- caller bertanggung jawab memastikan quantity sudah canonical
- `ReceiveStock` tidak boleh melakukan conversion

## 7.6.1 Inventory Mutation Reason Contract

Reason untuk mutation inventory tidak boleh berupa string bebas tanpa kontrak.

Minimal contract yang dikunci untuk flow ini adalah:

```ts
export type InventoryMutationReason =
  | "PROCUREMENT_RECEIVE";
```

Aturan:

- untuk Step 6.5, reason yang sah pada flow receive procurement adalah `PROCUREMENT_RECEIVE`
- caller tidak boleh mengirim reason arbitrer
- Inventory menerima reason sebagai bagian dari kontrak mutation yang eksplisit
- perluasan daftar reason di masa depan harus mengikuti domain language resmi dan tidak boleh dilakukan diam-diam

---

## 7.7 ReceivePurchaseOrderResult

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

### Aturan penting

- output tetap merepresentasikan histori procurement
- `unitSnapshot` tidak diganti menjadi canonical unit
- tidak ada agregasi canonical pada result ini
- `totalTransactionQuantity` adalah agregasi historis transaksi, bukan quantity inventory canonical

---

# 8. Error Contract

## 8.1 Prinsip Error

Error harus:

- eksplisit
- terstratifikasi
- dapat diuji berdasarkan code
- tidak menyamarkan sumber boundary
- tidak membocorkan detail ORM / HTTP / framework

Tidak boleh:

- `throw new Error()` tanpa tipe bermakna
- fallback diam-diam
- memakai satu error bag untuk semua boundary

## 8.2 Procurement Normalization Error

```ts
export type ProcurementNormalizationErrorCode =
  | "INVALID_INPUT_UNIT"
  | "CONVERSION_RULE_NOT_FOUND"
  | "NORMALIZED_QUANTITY_INVALID"
  | "NON_CANONICAL_QUANTITY";
```

### Rule

- `INVALID_INPUT_UNIT` = unit transaksi structurally tidak valid
- `CONVERSION_RULE_NOT_FOUND` = unit valid tetapi rule conversion tidak tersedia
- `NORMALIZED_QUANTITY_INVALID` = hasil normalisasi tidak sah
- `NON_CANONICAL_QUANTITY` = caller mencoba meneruskan quantity yang tidak memenuhi canonical contract ke boundary Inventory

## 8.3 Receive Purchase Order Error

```ts
export type ReceivePurchaseOrderErrorCode =
  | "PURCHASE_ORDER_NOT_FOUND"
  | "PURCHASE_ORDER_ALREADY_RECEIVED"
  | "PURCHASE_ORDER_ALREADY_CANCELED"
  | "FORBIDDEN";
```

## 8.4 Receive Stock Error

```ts
export type ReceiveStockErrorCode =
  | "INVENTORY_NOT_FOUND"
  | "INVALID_QUANTITY"
  | "INVALID_STOCK_REASON";
```

### Rule

- `ReceiveStock` tidak boleh melempar `NON_CANONICAL_QUANTITY`
- `ReceiveStock` tidak boleh memanggil Catalog untuk memverifikasi unit
- `ReceiveStock` hanya memvalidasi kontrak quantity numerik dan reason

## 8.5 Error Shape

```ts
export type UseCaseError<TCode extends string> = {
  code: TCode;
  message: string;
};
```

---

# 9. Boundary Interface Contract

## 9.1 ProcurementUnitNormalizationPort

Port ini bukan conversion engine global.

Port ini hanya untuk normalisasi item procurement sebelum Inventory dipanggil.

```ts
export interface ProcurementUnitNormalizationPort {
  normalizeProcurementItem(
    input: NormalizeProcurementItemInput,
  ): Promise<NormalizeProcurementItemResult>;
}
```

### Aturan

- hanya dipakai di application layer procurement
- tidak boleh dipakai sebagai helper bebas lintas domain
- tidak boleh dipanggil dari UI
- tidak boleh dipanggil dari Inventory

## 9.2 ProcurementInventoryPort

Boundary resmi Procurement → Inventory.

```ts
export interface ProcurementInventoryPort {
  receiveProcurementStock(
    input: ReceiveProcurementStockInput,
  ): Promise<void>;
}
```

### Aturan

- hanya menerima item canonical
- tidak menerima raw transaction unit
- tidak menerima conversion rule
- tidak menerima costing field

## 9.3 Repository Contract

Repository dependency pada skeleton implementation tidak boleh dibiarkan implisit.

Minimal contract yang dikunci untuk implementasi Step 6.5 adalah sebagai berikut.

### PurchaseOrderRepository

```ts
export interface PurchaseOrderRepository {
  findById(id: string): Promise<PurchaseOrder | null>;
  save(order: PurchaseOrder): Promise<void>;
}
```

### InventoryItemRepository

```ts
export interface InventoryItemRepository {
  findByVariantId(variantId: string): Promise<InventoryItem | null>;
  save(item: InventoryItem): Promise<void>;
}
```

Aturan:

- application layer hanya bergantung pada contract repository
- application layer tidak boleh mengakses Prisma atau repository implementation secara langsung
- repository contract ini adalah dependency minimum untuk wiring skeleton implementation
- detail persistence tetap berada di infrastructure layer

---

# 10. Validation Order

Urutan validasi `ReceivePurchaseOrder` bersifat mengikat:

1. validate actor
2. load purchase order
3. validate purchase order state
4. normalize all items
5. build canonical inventory request
6. call procurement-inventory port
7. mutate order state
8. persist purchase order

### Rule

- normalisasi gagal → stop sebelum inventory
- tidak ada partial normalization
- tidak ada state mutation sebelum inventory sukses
- inventory failure tidak boleh dipakai untuk menutupi normalization failure

---

# 11. Mapping Rule

## 11.1 Procurement snapshot → normalized result

- mapping dilakukan di application layer
- tidak mengubah snapshot domain

## 11.2 normalized result → inventory request

```ts
export function toReceiveProcurementStockItem(
  item: NormalizeProcurementItemResult,
  reason: InventoryMutationReason,
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

# 12. Flow Contract

## 12.1 ReceivePurchaseOrder

1. validate actor
2. load PO
3. validate state
4. normalize all items
5. build request
6. call inventory
7. mutate state
8. persist

## 12.2 ReceiveStock

1. validate input
2. load inventory
3. increase
4. movement

---

# 13. Testing Contract

## 13.1 Application Test

### ReceivePurchaseOrder

- reject jika order tidak ditemukan
- reject jika order bukan `CREATED`
- reject jika unit input invalid
- reject jika conversion rule tidak ada
- reject jika hasil normalisasi invalid
- memastikan Inventory dipanggil hanya setelah semua item sukses dinormalisasi
- memastikan Inventory menerima canonical quantity
- memastikan tidak ada fallback

### ReceiveStock

- reject jika quantity tidak valid
- reject jika inventory tidak ditemukan
- memastikan movement tercatat saat sukses
- tidak ada test yang mengasumsikan Inventory memverifikasi unit eksternal

## 13.2 Integration Test

- receive PO dengan unit non-canonical yang valid menghasilkan stok canonical
- receive PO dengan missing conversion rule gagal tanpa side effect inventory
- boundary canonical enforcement terjadi sebelum Inventory call

## 13.3 Architecture Test

- conversion hanya terjadi di application layer
- Inventory tidak mengimpor conversion rule Catalog
- Procurement tidak mengakses repository Inventory langsung
- UI tidak mem-bypass contract
- Reporting tidak memakai contract ini untuk business rule baru

---

# 14. Non-Goals

Dokumen ini tidak mencakup:

- detail implementasi business logic final
- struktur file repository di luar contract yang sudah dikunci
- costing logic
- accounting logic
- reporting projection baru
- migration script
- perubahan histori
- fallback unit resolution
- UI-side conversion

---

# 15. Rollout Strategy

Urutan implementasi yang sah:

1. implement conversion rule access di Catalog boundary
2. implement `ProcurementUnitNormalizationPort`
3. update `ReceivePurchaseOrder`
4. enforce canonical-only contract di `ReceiveStock`
5. tambah application test
6. tambah integration test
7. deploy tanpa mengubah histori lama

---

# 16. Final Naming

Penamaan file harus domain-driven, bukan step-driven.

## Struktur final

```txt
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

# 17. Skeleton Implementation

## 17.1 ReceivePurchaseOrder

```ts
export class ReceivePurchaseOrder {
  constructor(
    private readonly normalizationPort: ProcurementUnitNormalizationPort,
    private readonly inventoryPort: ProcurementInventoryPort,
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
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

## 17.2 ReceiveStock

```ts
export class ReceiveStock {
  constructor(
    private readonly inventoryItemRepository: InventoryItemRepository,
    ) {}

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

# 18. Kesimpulan

Dokumen ini adalah bentuk konsolidasi final yang:

- menyatukan plan, DTO spec, revised contract, final naming, dan skeleton
- menghilangkan duplikasi versi lama
- menjaga boundary tetap bersih
- siap dijadikan satu dokumen utuh acuan implementasi Step 6.5
