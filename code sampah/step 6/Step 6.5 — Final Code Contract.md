# Step 6.5 — Final Code Contract
## Measurement & Unit Normalization

## Status
IMPLEMENTATION CONTRACT — PRE-CODE LOCKED

---

## Tujuan

Dokumen ini menggabungkan:

- arah implementasi Step 6.5
- kontrak DTO
- error contract
- boundary interface
- validation order
- mapping rule
- testing contract minimum

Dokumen ini dibuat untuk memastikan bahwa implementasi Step 6.5 berjalan konsisten, tidak ambigu, dan tidak melanggar boundary sistem.

Dokumen ini **belum** berisi implementasi kode.
Dokumen ini adalah **source of truth kontrak application layer sebelum coding dimulai**.

---

## Kedudukan Dokumen

Dokumen ini berada di bawah keputusan yang sudah dikunci oleh:

- ADR-0016 — Measurement & Unit Normalization
- `catalog_domain.md`
- `inventory_domain.md`
- `procurement_domain.md`
- `receive_purchase_order.md`
- `Receive Stock (Use Case).md`

Jika terjadi konflik:

- domain document menang untuk invariant
- ADR menang untuk keputusan arsitektural
- dokumen ini menang untuk code contract application layer

---

# 1. Context

Step 4 telah mengunci `ProductVariant` sebagai identity operasional.

Step 6 telah mengunci Procurement dan receive flow.

Namun sebelum Step 6.5:

- belum ada standar unit internal
- belum ada conversion rule resmi
- receive flow masih berisiko menerima quantity yang belum ternormalisasi

Step 6.5 memperkenalkan hardening quantity system tanpa mengubah histori dan tanpa mengubah invariant inti yang sudah ada.

---

# 2. Goal

Step 6.5 memiliki goal berikut:

- menetapkan canonical unit per `ProductVariant`
- menetapkan conversion rule eksplisit
- memastikan seluruh quantity Inventory berada dalam canonical unit
- menolak semua ambiguity unit
- memastikan conversion hanya terjadi di application layer

Tujuan utama Step 6.5 bukan fleksibilitas.
Tujuan utamanya adalah **determinisme dan konsistensi sistem**.

---

# 3. Locked Decisions

Keputusan berikut bersifat mengikat:

- canonical unit dimiliki Catalog
- conversion rule dimiliki Catalog
- quantity dimiliki Inventory
- snapshot transaksi dimiliki Procurement
- conversion dilakukan di application layer
- Inventory bersifat canonical-only
- Procurement tidak memiliki conversion rule
- Reporting tidak boleh melakukan conversion
- UI tidak boleh melakukan conversion
- tidak ada fallback
- tidak ada silent conversion
- tidak ada multi-step conversion

---

# 4. Prinsip Umum Kontrak

## 4.1 Prinsip Boundary

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
- menaruh fallback logic di helper tersembunyi
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

## 5.4 Application Layer

Application layer bertanggung jawab untuk:

- memvalidasi input use case
- memuat data domain yang dibutuhkan
- melakukan normalisasi unit
- membentuk request canonical ke Inventory
- menghentikan flow jika conversion gagal

---

# 6. DTO Contract

## 6.1 ReceivePurchaseOrderInput

Kontrak input resmi untuk use case `ReceivePurchaseOrder`.

```ts
export type ReceivePurchaseOrderInput = {
  purchaseOrderId: string;
  receivedAt?: Date;
  actor: ActorContext;
};
```

### Aturan

- `purchaseOrderId` tidak boleh kosong
- `actor.actorId` tidak boleh kosong
- `actor.role` wajib valid
- `receivedAt` opsional
- DTO ini tidak membawa conversion rule
- DTO ini tidak membawa canonical quantity dari UI

### Konsekuensi

Normalisasi hanya boleh dilakukan setelah `PurchaseOrder` dimuat dari repository.

---

## 6.2 NormalizedReceivePurchaseItem

DTO internal application layer untuk hasil normalisasi satu item procurement.

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

### Aturan

- `transactionUnit` adalah snapshot transaksi procurement
- `transactionQuantity` adalah quantity transaksi procurement
- `canonicalUnit` berasal dari Catalog
- `canonicalQuantity` harus valid dan positif
- DTO ini tidak dipersist sebagai domain entity baru

### Tujuan

DTO ini adalah hasil resmi setelah satu item procurement berhasil dinormalisasi.

---

## 6.3 ReceiveProcurementStockItem

DTO boundary resmi dari Procurement ke Inventory.

```ts
export type ReceiveProcurementStockItem = {
  variantId: string;
  quantity: number;
  reason: string;
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

### Tujuan

DTO ini memastikan Inventory hanya menerima model quantity yang sudah bersih.

---

## 6.4 ReceiveStockRequest

Kontrak input resmi untuk use case `ReceiveStock`.

```ts
export type ReceiveStockRequest = {
  variantId: string;
  quantity: number;
  reason: string;
  referenceId?: string;
};
```

### Aturan

- `quantity` wajib canonical
- jika caller belum melakukan normalisasi, request dianggap invalid
- Inventory tidak menerima unit tambahan untuk conversion
- Inventory tidak menerima factor conversion dari caller

---

## 6.5 ReceivePurchaseOrderResult

Output resmi use case `ReceivePurchaseOrder`.

```ts
export type ReceivePurchaseOrderResult = {
  id: string;
  supplierId: string;
  status: string;
  receivedAt: Date;
  receivedBy: string;
  totalQuantity: number;
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

### Aturan

- output tetap merepresentasikan histori procurement
- `unitSnapshot` tidak diubah menjadi canonical unit
- output tidak memalsukan histori transaksi
- canonical quantity bukan pengganti snapshot transaksi procurement

---

# 7. Error Contract

## 7.1 Prinsip Error

Error harus:

- eksplisit
- bermakna bisnis atau application-level yang sah
- dapat diuji berdasarkan jenis error
- tidak membocorkan Prisma, HTTP, atau framework

Tidak boleh:

- `throw new Error()` tanpa tipe bermakna
- fallback diam-diam tanpa error
- mengaburkan penyebab kegagalan

---

## 7.2 Error Code Minimum

```ts
export const STEP_6_5_ERROR = {
  PURCHASE_ORDER_NOT_FOUND: "PURCHASE_ORDER_NOT_FOUND",
  PURCHASE_ORDER_ALREADY_RECEIVED: "PURCHASE_ORDER_ALREADY_RECEIVED",
  PURCHASE_ORDER_ALREADY_CANCELED: "PURCHASE_ORDER_ALREADY_CANCELED",
  INVALID_INPUT_UNIT: "INVALID_INPUT_UNIT",
  CONVERSION_RULE_NOT_FOUND: "CONVERSION_RULE_NOT_FOUND",
  NORMALIZED_QUANTITY_INVALID: "NORMALIZED_QUANTITY_INVALID",
  NON_CANONICAL_QUANTITY: "NON_CANONICAL_QUANTITY",
  INVENTORY_NOT_FOUND: "INVENTORY_NOT_FOUND",
  INVALID_QUANTITY: "INVALID_QUANTITY",
  INVALID_STOCK_REASON: "INVALID_STOCK_REASON",
  FORBIDDEN: "FORBIDDEN",
} as const;

export type Step65ErrorCode =
  (typeof STEP_6_5_ERROR)[keyof typeof STEP_6_5_ERROR];
```

---

## 7.3 Error untuk ReceivePurchaseOrder

Minimal error yang wajib tersedia:

- `PURCHASE_ORDER_NOT_FOUND`
- `PURCHASE_ORDER_ALREADY_RECEIVED`
- `PURCHASE_ORDER_ALREADY_CANCELED`
- `INVALID_INPUT_UNIT`
- `CONVERSION_RULE_NOT_FOUND`
- `NORMALIZED_QUANTITY_INVALID`
- `NON_CANONICAL_QUANTITY`
- `INVENTORY_NOT_FOUND`
- `FORBIDDEN`

### Rule pemakaian

- `INVALID_INPUT_UNIT` dipakai jika unit transaksi structurally tidak valid
- `CONVERSION_RULE_NOT_FOUND` dipakai jika unit valid tetapi rule conversion tidak tersedia
- `NORMALIZED_QUANTITY_INVALID` dipakai jika hasil normalisasi tidak sah
- `NON_CANONICAL_QUANTITY` dipakai jika boundary Inventory menerima quantity yang tidak memenuhi kontrak canonical

---

## 7.4 Error untuk ReceiveStock

Minimal error yang wajib tersedia:

- `INVENTORY_NOT_FOUND`
- `INVALID_QUANTITY`
- `NON_CANONICAL_QUANTITY`
- `INVALID_STOCK_REASON`

### Rule pemakaian

- ReceiveStock tidak boleh mencoba melakukan conversion untuk memperbaiki input
- jika quantity tidak canonical, request wajib ditolak
- kegagalan canonical contract bukan tanggung jawab domain Catalog di dalam use case Inventory

---

## 7.5 Bentuk Error Type

Bentuk final type-safe contract yang direkomendasikan:

```ts
export type UseCaseError = {
  code: Step65ErrorCode;
  message: string;
};
```

Atau jika proyek memakai class error eksplisit:

```ts
export class Step65ApplicationError extends Error {
  constructor(
    public readonly code: Step65ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "Step65ApplicationError";
  }
}
```

Aturan:
- jenis error harus bisa diuji
- code harus menjadi kontrak utama
- message tidak boleh menjadi satu-satunya basis assertion test

---

# 8. Boundary Interface Contract

## 8.1 UnitNormalizationPort

Port resmi untuk normalisasi unit.

```ts
export type NormalizeUnitInput = {
  variantId: string;
  transactionUnit: string;
  transactionQuantity: number;
  referenceId: string;
};

export type NormalizeUnitResult = {
  variantId: string;
  transactionUnit: string;
  transactionQuantity: number;
  canonicalUnit: string;
  canonicalQuantity: number;
  referenceId: string;
};

export interface UnitNormalizationPort {
  normalizeToCanonical(
    input: NormalizeUnitInput,
  ): Promise<NormalizeUnitResult>;
}
```

### Tanggung jawab

- menerima `variantId`, `transactionUnit`, dan `transactionQuantity`
- membaca rule resmi dari Catalog
- menghasilkan canonical quantity
- gagal eksplisit jika rule tidak tersedia

### Tidak boleh

- dipanggil dari UI
- dipanggil dari Inventory domain
- dipakai sebagai helper global tanpa boundary jelas
- melakukan fallback

---

## 8.2 InventoryProcurementPort

Boundary resmi Procurement → Inventory.

```ts
export type ReceiveProcurementStockInput = {
  items: ReceiveProcurementStockItem[];
};

export interface InventoryProcurementPort {
  receiveProcurementStock(
    input: ReceiveProcurementStockInput,
  ): Promise<void>;
}
```

### Tanggung jawab

- menerima item-item yang sudah canonical
- meneruskan receive ke Inventory mutation boundary
- menjaga agar Procurement tidak menyentuh repository Inventory langsung

### Tidak boleh

- menerima raw transaction unit
- menerima conversion rule dari caller
- memuat costing field

---

## 8.3 ReceiveStockUseCase Contract

Kontrak code-level untuk Inventory.

```ts
export interface ReceiveStockUseCase {
  execute(input: ReceiveStockRequest): Promise<void>;
}
```

Aturan:
- input harus canonical
- tidak ada conversion di dalam `execute`

---

# 9. Validation Order yang Mengikat

Urutan validasi di `ReceivePurchaseOrder` wajib seperti ini:

1. validasi actor
2. load `PurchaseOrder`
3. validasi state order
4. normalisasi seluruh item
5. build inventory request
6. call Inventory boundary
7. mutate order state
8. persist Procurement

Konsekuensinya:

- conversion failure harus berhenti sebelum inventory call
- inventory failure tidak boleh dipakai untuk menutupi conversion failure
- tidak boleh ada partial normalization
- tidak boleh ada state mutation Procurement sebelum inventory call sukses

---

# 10. Mapping Rules

## 10.1 Procurement Item → NormalizedReceivePurchaseItem

Sumber:
- `variantId`
- `unitSnapshot`
- `quantity`

Hasil:
- `canonicalUnit`
- `canonicalQuantity`

Rule:
- mapping terjadi di application layer
- mapping tidak mengubah domain snapshot
- mapping tidak boleh disimpan sebagai domain entity baru

---

## 10.2 NormalizedReceivePurchaseItem → ReceiveProcurementStockItem

Rule:
- hanya field yang diperlukan Inventory yang boleh diteruskan
- `transactionUnit` tidak ikut dikirim
- `unitCost` tidak ikut dikirim
- `supplierId` tidak ikut dikirim

Contoh bentuk mapper:

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

## 11.1 ReceivePurchaseOrder Flow Contract

```ts
export interface ReceivePurchaseOrderUseCase {
  execute(
    input: ReceivePurchaseOrderInput,
  ): Promise<ReceivePurchaseOrderResult>;
}
```

### Flow yang wajib dipatuhi

- load order
- normalize all items
- fail fast jika ada satu item gagal
- build canonical stock request
- call Inventory boundary
- mutate Procurement state
- persist
- return result

---

## 11.2 ReceiveStock Flow Contract

```ts
export interface ReceiveStockUseCase {
  execute(input: ReceiveStockRequest): Promise<void>;
}
```

### Flow yang wajib dipatuhi

- validate input
- validate canonical contract
- load inventory
- increase quantity
- persist movement

---

# 12. Testing Contract

## 12.1 Application Test Wajib

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
- reject jika quantity non-canonical
- reject jika inventory tidak ditemukan
- memastikan movement tercatat saat sukses

---

## 12.2 Integration Test Wajib

- receive PO dengan unit non-canonical yang valid menghasilkan stok canonical
- receive PO dengan missing conversion rule gagal tanpa side effect inventory
- receive stock non-canonical gagal di boundary Inventory

---

## 12.3 Architecture Test Wajib

- conversion hanya terjadi di application layer
- Inventory tidak mengimpor conversion rule Catalog
- Procurement tidak mengakses repository Inventory langsung
- UI tidak mem-bypass contract
- Reporting tidak memakai contract ini untuk business rule baru

---

# 13. Non-Goals

Dokumen ini tidak mencakup:

- detail implementasi code final
- struktur file final repository
- naming adapter final
- costing logic
- accounting logic
- reporting projection baru
- migration script
- perubahan histori
- fallback unit resolution
- UI-side conversion

---

# 14. Rollout Strategy

Urutan implementasi yang sah:

1. implement conversion rule access di Catalog boundary
2. implement `UnitNormalizationPort`
3. update `ReceivePurchaseOrder`
4. enforce canonical-only contract di `ReceiveStock`
5. tambah application test
6. tambah integration test
7. deploy tanpa mengubah histori lama

---

# 15. Risiko dan Mitigasi

## Risiko

- conversion diimplementasikan di layer yang salah
- fallback logic muncul diam-diam
- mismatch unit antar domain
- Inventory menerima raw quantity

## Mitigasi

- strict DTO contract
- strict error code
- boundary interface eksplisit
- architecture test
- application test
- integration test

---

# 16. Kesimpulan

Dokumen ini mengunci full code contract Step 6.5 sebelum implementasi dimulai.

Dokumen ini menetapkan bahwa:

- DTO harus eksplisit
- error harus bermakna
- conversion harus berhenti di boundary yang benar
- Procurement tetap menjaga histori
- Inventory hanya menerima canonical quantity
- tidak ada fallback
- implementasi harus mengikuti urutan validasi yang sudah dikunci

Dokumen ini adalah pagar implementasi resmi untuk Step 6.5.

