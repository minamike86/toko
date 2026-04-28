# Step 7 — Repository Contract Final

Status: FINAL FOR STEP 7 IMPLEMENTATION  
Scope: Supplier Payable  
Change Type: Additive, Non-Breaking  

---

## Purpose

Dokumen ini mendefinisikan repository contract final untuk implementasi Step 7 — Supplier Payable.

Repository contract ini mendukung tiga use case utama:

- Record Supplier Payment
- Get Supplier Outstanding
- Handle Purchase Return (Reduce Payable)

Repository contract ini tidak mendefinisikan domain baru di luar Procurement.

---

## Mandatory Boundary Rules

Repository Step 7 wajib mematuhi aturan berikut:

- Repository tidak boleh menyimpan business rule inti.
- Repository hanya bertanggung jawab untuk persist dan load data.
- Outstanding tidak boleh disimpan sebagai mutable field utama.
- Outstanding harus dihitung secara derived dari histori procurement, payment, dan return reduction.
- Payment history bersifat append-only.
- Return reduction history bersifat append-only.
- Repository tidak boleh memanggil Inventory.
- Repository tidak boleh membuat StockMovement.
- Repository tidak boleh membuat accounting journal.
- Repository tidak boleh mengubah histori payment atau return yang sudah tercatat.
- Repository tidak boleh menggunakan fallback behavior.

### PurchaseOrder Lifecycle Constraint

Semua operasi Step 7 hanya berlaku untuk `PurchaseOrder` dengan status `RECEIVED`.

Aturan:

- Repository tidak boleh menerima data yang terkait dengan:
  - `PurchaseOrder` berstatus `CREATED`
  - `PurchaseOrder` berstatus `CANCELED`

- Validasi utama tetap dilakukan di application layer, namun:
  - repository implementation tidak boleh diam-diam menerima data invalid
  - repository boleh menolak data jika status tidak valid

Konsekuensi:

- Tidak boleh ada histori payment atau return untuk `PurchaseOrder` yang belum `RECEIVED`
- Lifecycle Procurement tetap menjadi sumber kebenaran utama

---

## Shared Types

```ts
export type EntityId = string;

export type MoneyAmount = number;

export type SupplierPaymentId = EntityId;

export type PurchaseReturnId = EntityId;

export type PurchaseOrderId = EntityId;

export type SupplierId = EntityId;

export type PurchaseItemId = EntityId;

export type ActorId = EntityId;
```

---

## Supplier Payment Record

```ts
export type SupplierPaymentRecord = {
  id: SupplierPaymentId;
  purchaseOrderId: PurchaseOrderId;
  supplierId: SupplierId;
  amount: MoneyAmount;
  paidAt: Date;
  notes: string | null;
  createdAt: Date;
  createdBy: ActorId;
};
```

### Rules

- `amount` harus positif.
- Payment hanya boleh dibuat oleh use case setelah invariant outstanding divalidasi.
- Record bersifat immutable setelah tersimpan.
- Repository tidak boleh menyediakan method update atau delete.

---

## Purchase Return Reduction Record

```ts
export type PurchaseReturnReductionRecord = {
  id: PurchaseReturnId;
  purchaseOrderId: PurchaseOrderId;
  supplierId: SupplierId;
  returnedAt: Date;
  notes: string | null;
  createdAt: Date;
  createdBy: ActorId;
  items: PurchaseReturnReductionItemRecord[];
};

export type PurchaseReturnReductionItemRecord = {
  purchaseReturnId: PurchaseReturnId;
  purchaseItemId: PurchaseItemId;
  quantity: number;
  reducedAmount: MoneyAmount;
  reason: string | null;
};
```

### Rules

- Return reduction bukan payment.
- Return reduction tidak boleh mengubah histori payment.
- Return reduction tidak boleh mengubah status purchase order.
- Return reduction record bersifat immutable setelah tersimpan.
- Repository tidak boleh menyediakan method update atau delete.

---

## Supplier Outstanding Read Model

```ts
export type SupplierOutstandingSummary = {
  supplierId: SupplierId;
  supplierStoreName: string;
  totalOutstanding: MoneyAmount;
  purchaseOrders: SupplierOutstandingPurchaseOrderLine[];
};

export type SupplierOutstandingPurchaseOrderLine = {
  purchaseOrderId: PurchaseOrderId;
  receivedAt: Date;
  payableInitial: MoneyAmount;
  totalPaid: MoneyAmount;
  totalReturned: MoneyAmount;
  outstanding: MoneyAmount;
};
```

### Rules

- Read model bersifat read-only.
- Read model tidak menjadi source of truth baru.
- Read model boleh dihitung melalui query optimized, tetapi hasilnya wajib mengikuti rumus domain:
  - `outstanding = payableInitial - totalPaid - totalReturned`
- Purchase order yang belum `RECEIVED` tidak boleh membentuk payable.
- `outstanding` tidak boleh negatif.

---

# 1. SupplierPaymentRepository

## Purpose

`SupplierPaymentRepository` bertanggung jawab untuk membuat ID payment, menyimpan histori payment baru, dan membaca histori payment untuk purchase order.

Repository ini tidak bertanggung jawab menghitung apakah payment valid terhadap outstanding. Validasi tersebut berada di domain/application use case.

---

## Contract

```ts
export interface SupplierPaymentRepository {
  nextId(): Promise<SupplierPaymentId>;

  save(payment: SupplierPaymentRecord): Promise<void>;

  listByPurchaseOrderId(
    purchaseOrderId: PurchaseOrderId,
  ): Promise<SupplierPaymentRecord[]>;

  sumPaidByPurchaseOrderId(
    purchaseOrderId: PurchaseOrderId,
  ): Promise<MoneyAmount>;
}
```

---

## Method Semantics

### `nextId()`

Menghasilkan ID baru untuk `SupplierPaymentRecord`.

Rules:

- ID harus unik.
- ID tidak boleh bergantung pada database auto-increment yang bocor ke domain.

---

### `save(payment)`

Menyimpan histori payment baru.

Rules:

- Operasi bersifat append-only.
- Tidak boleh overwrite payment existing.
- Jika ID sudah ada, repository wajib menolak operasi.
- Tidak boleh mengubah outstanding secara langsung.
- Tidak boleh mengubah purchase order.

Expected errors:

- `SUPPLIER_PAYMENT_ALREADY_EXISTS`
- `SUPPLIER_PAYMENT_PERSISTENCE_FAILED`

---

### `listByPurchaseOrderId(purchaseOrderId)`

Mengambil histori payment untuk satu purchase order.

Rules:

- Hasil harus urut kronologis berdasarkan `paidAt`, lalu `createdAt`.
- Tidak boleh melakukan mutation.

---

### `sumPaidByPurchaseOrderId(purchaseOrderId)`

Menghasilkan total payment untuk satu purchase order.

Rules:

- Hanya menghitung payment valid yang sudah tersimpan.
- Jika tidak ada payment, return `0`.
- Tidak boleh return nilai negatif.

---

# 2. PurchaseReturnRepository

## Purpose

`PurchaseReturnRepository` bertanggung jawab untuk membuat ID return reduction, menyimpan histori return reduction baru, dan membaca histori return reduction untuk purchase order.

Repository ini tidak melakukan inventory reversal.

---

## Contract

```ts
export interface PurchaseReturnRepository {
  nextId(): Promise<PurchaseReturnId>;

  save(returnReduction: PurchaseReturnReductionRecord): Promise<void>;

  listByPurchaseOrderId(
    purchaseOrderId: PurchaseOrderId,
  ): Promise<PurchaseReturnReductionRecord[]>;

  sumReturnedByPurchaseOrderId(
    purchaseOrderId: PurchaseOrderId,
  ): Promise<MoneyAmount>;

  sumReturnedQuantityByPurchaseItemId(
    purchaseItemId: PurchaseItemId,
  ): Promise<number>;
}
```

---

## Method Semantics

### `nextId()`

Menghasilkan ID baru untuk return reduction.

Rules:

- ID harus unik.
- ID digunakan sebagai identity histori return reduction.

---

### `save(returnReduction)`

Menyimpan histori return reduction baru.

Rules:

- Operasi bersifat append-only.
- Tidak boleh overwrite return existing.
- Jika ID sudah ada, repository wajib menolak operasi.
- Tidak boleh menyentuh histori payment.
- Tidak boleh mengubah status purchase order.
- Tidak boleh melakukan inventory mutation.

Expected errors:

- `PURCHASE_RETURN_ALREADY_EXISTS`
- `PURCHASE_RETURN_PERSISTENCE_FAILED`

---

### `listByPurchaseOrderId(purchaseOrderId)`

Mengambil semua histori return reduction untuk satu purchase order.

Rules:

- Hasil harus urut kronologis berdasarkan `returnedAt`, lalu `createdAt`.
- Tidak boleh melakukan mutation.

---

### `sumReturnedByPurchaseOrderId(purchaseOrderId)`

Menghasilkan total nilai return reduction untuk satu purchase order.

Rules:

- Jika tidak ada return, return `0`.
- Tidak boleh return nilai negatif.
- Nilai ini digunakan untuk menghitung outstanding secara derived.

---

### `sumReturnedQuantityByPurchaseItemId(purchaseItemId)`

Menghasilkan total quantity yang sudah direturn untuk satu purchase item.

Rules:

- Jika belum pernah return, return `0`.
- Tidak boleh return nilai negatif.
- Method ini digunakan oleh use case untuk mencegah return melebihi batas yang sah.

---

# 3. SupplierPayableQuery

## Purpose

`SupplierPayableQuery` adalah query/read contract untuk menghitung outstanding supplier secara read-only.

Contract ini boleh diimplementasikan dengan query optimized, tetapi tidak boleh menjadi domain baru atau menyimpan business rule di reporting layer.

---

## Contract

```ts
export interface SupplierPayableQuery {
  getOutstandingBySupplierId(
    supplierId: SupplierId,
  ): Promise<SupplierOutstandingSummary | null>;

  getOutstandingByPurchaseOrderId(
    purchaseOrderId: PurchaseOrderId,
  ): Promise<SupplierOutstandingPurchaseOrderLine | null>;
}
```

---

## Method Semantics

### `getOutstandingBySupplierId(supplierId)`

Menghasilkan posisi outstanding supplier.

Rules:

- Return `null` jika supplier tidak ditemukan.
- Hanya purchase order `RECEIVED` yang boleh dihitung.
- Purchase order dengan outstanding `0` boleh dikecualikan dari daftar aktif.
- Tidak boleh melakukan write.
- Tidak boleh memanggil inventory.

---

### `getOutstandingByPurchaseOrderId(purchaseOrderId)`

Menghasilkan posisi outstanding untuk satu purchase order.

Rules:

- Return `null` jika purchase order tidak ditemukan atau belum `RECEIVED`.
- Nilai outstanding wajib derived dari:
  - payableInitial
  - totalPaid
  - totalReturned
- Jika hasil outstanding negatif, query harus mengembalikan error bisnis melalui application layer, bukan menormalisasi ke nol.

---

# 4. PurchaseOrder Payable Read Dependency

Step 7 membutuhkan kemampuan membaca purchase order yang sudah ada.

Kontrak minimal yang dibutuhkan dari `PurchaseOrderRepository` existing:

```ts
export type PurchaseOrderPayableSnapshot = {
  id: PurchaseOrderId;
  supplierId: SupplierId;
  status: "CREATED" | "RECEIVED" | "CANCELED";
  receivedAt: Date | null;
  totalCost: MoneyAmount;
  items: Array<{
    purchaseItemId: PurchaseItemId;
    quantity: number;
    unitCost: MoneyAmount;
    subtotalCost: MoneyAmount;
  }>;
};
```

Expected repository capability:

```ts
export interface PurchaseOrderPayableReader {
  findPayableSnapshotById(
    purchaseOrderId: PurchaseOrderId,
  ): Promise<PurchaseOrderPayableSnapshot | null>;
}
```

Rules:

- Reader tidak boleh mengubah purchase order.
- Reader tidak boleh menghitung payment.
- Reader tidak boleh menghitung return.
- Reader hanya menyediakan data purchase order yang diperlukan untuk use case Step 7.

# 4.1 Supplier Read Dependency

Step 7 membutuhkan kemampuan membaca supplier untuk validasi dan tampilan outstanding.

```ts
export type SupplierPayableSnapshot = {
  id: SupplierId;
  storeName: string;
  isActive: boolean;
};
```

Expected repository capability:

```ts
export interface SupplierPayableReader {
  findPayableSnapshotById(
    supplierId: SupplierId,
  ): Promise<SupplierPayableSnapshot | null>;
}

```

Rules:

- Reader tidak boleh mengubah supplier.
- Reader hanya digunakan untuk validasi supplier dan read model outstanding.
- Supplier validation tetap dilakukan di application/use case layer.

---

# 5. Error Contract

Repository dan query layer harus menggunakan error yang bisa dipetakan ke business error application layer.

Minimal error:

```ts
export type Step7RepositoryErrorCode =
  | "SUPPLIER_PAYMENT_ALREADY_EXISTS"
  | "SUPPLIER_PAYMENT_PERSISTENCE_FAILED"
  | "PURCHASE_RETURN_ALREADY_EXISTS"
  | "PURCHASE_RETURN_PERSISTENCE_FAILED"
  | "SUPPLIER_PAYABLE_QUERY_FAILED";
```

Use case layer tetap bertanggung jawab atas error bisnis utama:

```ts
export type Step7BusinessErrorCode =
  | "PURCHASE_ORDER_NOT_FOUND"
  | "PURCHASE_ORDER_NOT_RECEIVED"
  | "SUPPLIER_NOT_FOUND"
  | "INVALID_SUPPLIER_PAYMENT_AMOUNT"
  | "SUPPLIER_PAYMENT_EXCEEDS_OUTSTANDING"
  | "PURCHASE_RETURN_ITEM_INVALID"
  | "PURCHASE_RETURN_EXCEEDS_ALLOWED_REDUCTION"
  | "PURCHASE_RETURN_REDUCTION_EXCEEDS_OUTSTANDING"
  | "SUPPLIER_OUTSTANDING_NEGATIVE"
  | "FORBIDDEN";
```

Rules:

- Repository error tidak boleh bocor sebagai Prisma/database raw error.
- Application layer wajib memetakan error teknis menjadi error contract yang aman.
- Domain/application business error tidak boleh diganti dengan generic error.

---

# 6. Implementation Constraints

## Persistence

Implementasi repository boleh menggunakan Prisma di infrastructure layer.

Constraint:

- Prisma tidak boleh masuk domain.
- Prisma tidak boleh masuk use case sebagai dependency langsung.
- Prisma hanya boleh digunakan di infrastructure repository implementation.

---

## Transaction Boundary

Untuk mutation use case:

- `RecordSupplierPayment`
- `HandlePurchaseReturn`

Application layer harus memastikan consistency boundary.

Rules:

- validasi invariant dilakukan sebelum persist.
- persist histori harus atomic terhadap write yang dilakukan pada use case tersebut.
- tidak boleh ada write parsial dalam satu use case.

---

## Immutability

Repository tidak boleh menyediakan:

```ts
updatePayment(...)
deletePayment(...)
updateReturn(...)
deleteReturn(...)
```

Jika koreksi dibutuhkan pada future phase, harus melalui ADR/amendment baru.

---

# 7. Testing Contract

## Repository Test

Minimal:

- save payment baru berhasil
- duplicate payment id ditolak
- list payment by purchase order urut kronologis
- sum paid return `0` jika belum ada payment
- save return reduction baru berhasil
- duplicate return id ditolak
- list return by purchase order urut kronologis
- sum returned return `0` jika belum ada return

---

## Application Integration Test

Minimal:

- RecordSupplierPayment menyimpan payment dan outstanding turun derived
- RecordSupplierPayment menolak payment melebihi outstanding
- HandlePurchaseReturn menyimpan return dan outstanding turun derived
- HandlePurchaseReturn menolak return melebihi batas sah
- GetSupplierOutstanding membaca semua PO received yang masih outstanding

---

## Architecture / Boundary Test

Minimal:

- domain procurement tidak mengimpor Prisma
- application use case tidak mengimpor Prisma langsung
- payment repository tidak mengimpor inventory repository
- return repository tidak mengimpor inventory repository
- query outstanding tidak membuat mutation

---

# 8. Non-Goals

Repository Step 7 tidak mencakup:

- accounting journal
- general ledger
- inventory reversal
- stock movement
- costing engine
- dashboard asset valuation
- payment scheduling
- multi-currency
- edit histori payment
- edit histori return

---

# 9. Final Decision

Repository contract Step 7 adalah bagian dari Procurement application/infrastructure boundary.

Contract ini:

- mendukung Supplier Payable
- menjaga outstanding tetap derived
- menjaga payment dan return append-only
- tidak menyentuh Inventory
- tidak memperkenalkan Accounting

Status:

FINAL — READY FOR STEP 7 IMPLEMENTATION
