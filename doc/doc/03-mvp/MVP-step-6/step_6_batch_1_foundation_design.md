# Step 6 – Procurement & Cost Foundation
## Batch 1 – Foundation Design

**Status:** DRAFT – READY FOR IMPLEMENTATION  
**Step:** MVP Step 6 – Procurement & Cost Foundation  
**Batch:** Batch 1 – Foundation

---

## 1. Tujuan

Dokumen ini mendefinisikan desain implementasi awal untuk **Batch 1 – Foundation** pada Step 6 Procurement & Cost Foundation.

Batch ini hanya mencakup fondasi write-model Procurement:

- Supplier entity
- PurchaseOrder entity
- PurchaseItem entity
- Repository contract
- Database schema awal

Dokumen ini **belum** mengaktifkan:

- create purchase order flow penuh
- receive purchase order flow penuh
- cancel purchase order flow penuh
- inventory integration runtime
- accounting
- payable
- costing lanjutan

---

## 2. Acuan Utama

Dokumen ini mengacu pada sumber utama berikut:

1. Step 6 – Procurement & Cost Foundation Implementation Plan
2. MVP Stages Overview
3. ADR-0013 – Introduce Procurement Domain
4. inventory_domain.md
5. catalog_domain.md
6. sales_domain.md
7. architecture_overview.md
8. folder_structure.md

Jika terjadi konflik, dokumen primary di atas menang.

---

## 3. Prinsip Arsitektural

### 3.1 Procurement adalah domain terpisah

Procurement diperkenalkan sebagai domain baru di sisi supply dan **bukan ekstensi Inventory**.

Konsekuensi:

- Procurement menyimpan histori pembelian
- Procurement menyimpan unit cost pembelian
- Inventory tetap menjadi source of truth quantity
- Sales tetap tidak mengetahui Procurement

### 3.2 Quantity tetap milik Inventory

Procurement tidak menyimpan current stock.

Procurement tidak boleh:

- menulis langsung ke `InventoryItem`
- membuat `StockMovement` langsung lewat shortcut repository internal inventory
- memodifikasi tabel inventory di luar boundary resmi

### 3.3 Cost hanya hidup di Procurement

Cost pembelian hanya boleh hidup pada model Procurement.

Inventory tidak menyimpan:

- unit cost
n- subtotal pembelian
- supplier
- costing logic

### 3.4 Batch 1 tetap sempit

Batch 1 hanya menyiapkan fondasi domain dan persistence.

Yang **belum diaktifkan** pada batch ini:

- payable
- payment pembelian
- tax pembelian
- retur pembelian
- partial receive
- accounting journal
- COGS
- margin
- FIFO / moving average

---

## 4. Struktur Folder Procurement Module

Direkomendasikan struktur berikut:

```txt
src/modules/procurement/
  domain/
    Supplier.ts
    PurchaseOrder.ts
    PurchaseItem.ts
    PurchaseOrderStatus.ts
    ProcurementErrors.ts
    SupplierRepository.ts
    PurchaseOrderRepository.ts

  application/
    dto/
      CreateSupplierInput.ts
      UpdateSupplierStatusInput.ts
      CreatePurchaseOrderInput.ts
      ReceivePurchaseOrderInput.ts
      CancelPurchaseOrderInput.ts
      SupplierDto.ts
      PurchaseOrderDto.ts
    ports/
      CatalogSnapshotPort.ts
      InventoryProcurementPort.ts
    use-cases/
      CreateSupplier.ts
      UpdateSupplierStatus.ts
      CreatePurchaseOrder.ts
      ReceivePurchaseOrder.ts
      CancelPurchaseOrder.ts

  infrastructure/
    prisma/
      PrismaSupplierRepository.ts
      PrismaPurchaseOrderRepository.ts
      mappers/
        PrismaSupplierMapper.ts
        PrismaPurchaseOrderMapper.ts
        PrismaPurchaseItemMapper.ts
    adapters/
      PrismaCatalogSnapshotAdapter.ts
      InventoryProcurementAdapter.ts

  tests/
    domain/
    application/
    integration/
```

### Catatan

- `domain/` hanya berisi entity, status, repository contract, dan domain errors.
- `application/ports/` dipakai untuk boundary Catalog dan Inventory.
- `infrastructure/` hanya implementasi persistence dan adapter.
- `PurchaseItem` tidak perlu repository terpisah karena merupakan child entity dari aggregate `PurchaseOrder`.

---

## 5. Entity Design

## 5.1 Supplier

Supplier merepresentasikan pihak eksternal tempat barang dibeli.

### Field

- `id: string`
- `storeName: string`
- `salesName: string | null`
- `phone: string | null`
- `notes: string | null`
- `isActive: boolean`
- `createdAt: Date`

### Rules

- `storeName` wajib ada dan tidak boleh kosong
- `isActive` default `true`
- Supplier inactive tidak boleh dipakai untuk membuat purchase order baru
- Update contact info tidak boleh mengubah histori purchase lama

### Domain Behavior

- `activate()`
- `deactivate()`
- `updateContactInfo()`
- `assertCanBeUsedForNewPurchaseOrder()`

---

## 5.2 PurchaseItem

PurchaseItem merepresentasikan satu line item pembelian.

### Field

- `id: string`
- `purchaseOrderId: string`
- `productId: string`
- `variantId: string`
- `productNameSnapshot: string`
- `variantNameSnapshot: string`
- `unitSnapshot: string`
- `quantity: number`
- `unitCost: number`
- `subtotalCost: number`

### Rules

- `quantity > 0`
- `unitCost >= 0`
- `subtotalCost = quantity × unitCost`
- wajib refer ke `variantId`
- `productId` hanya helper/snapshot, bukan identity operasional utama
- snapshot tidak boleh kosong

### Catatan

- `subtotalCost` sebaiknya dihitung di domain, bukan diterima mentah dari input luar.
- `unitCost` dan `subtotalCost` disimpan sebagai integer rupiah.

---

## 5.3 PurchaseOrder

PurchaseOrder merepresentasikan satu kejadian pembelian dari supplier.

### Field

- `id: string`
- `supplierId: string`
- `status: CREATED | RECEIVED | CANCELED`
- `items: PurchaseItem[]`
- `createdAt: Date`
- `createdBy: string`
- `receivedAt: Date | null`
- `receivedBy: string | null`
- `canceledAt: Date | null`
- `canceledBy: string | null`

### Derived Fields

- `totalCost`
- `totalQuantity`

### Rules

- PurchaseOrder dibuat dalam status `CREATED`
- Harus memiliki minimal satu item
- Hanya `CREATED` yang boleh di-receive
- Hanya `CREATED` yang boleh di-cancel
- `RECEIVED` tidak boleh diubah
- `CANCELED` tidak boleh di-receive
- Tidak ada partial receive pada MVP Step 6
- Disarankan tidak ada duplicate `variantId` dalam satu purchase order

### Domain Behavior

- `receive(receivedAt, receivedBy)`
- `cancel(canceledAt, canceledBy)`
- `assertCanBeReceived()`
- `assertCanBeCanceled()`

---

## 6. Repository Contract

## 6.1 SupplierRepository

```ts
export interface SupplierRepository {
  nextId(): string;
  save(supplier: Supplier): Promise<void>;
  findById(id: string): Promise<Supplier | null>;
  findByStoreName(storeName: string): Promise<Supplier | null>;
}
```

### Tanggung Jawab

- generate id baru
- persist supplier baru / perubahan supplier
- ambil supplier berdasarkan id
- validasi duplikasi nama toko jika dibutuhkan

---

## 6.2 PurchaseOrderRepository

```ts
export interface PurchaseOrderRepository {
  nextId(): string;
  nextItemId(): string;
  save(order: PurchaseOrder): Promise<void>;
  findById(id: string): Promise<PurchaseOrder | null>;
}
```

### Tanggung Jawab

- generate id PurchaseOrder
- generate id PurchaseItem
- persist aggregate PurchaseOrder dan child PurchaseItem
- load aggregate penuh berdasarkan id

### Catatan

`PurchaseItem` tidak memiliki repository sendiri karena ia adalah bagian dari aggregate `PurchaseOrder`.

---

## 7. Required Cross-Domain Ports

Walau implementasi runtime aktif berada di batch berikutnya, kontrak boundary perlu dikunci sejak awal.

## 7.1 CatalogSnapshotPort

```ts
export type ProcurementVariantSnapshot = {
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  unit: string;
  isActive: boolean;
};

export interface CatalogSnapshotPort {
  getVariantsByIds(variantIds: string[]): Promise<ProcurementVariantSnapshot[]>;
}
```

### Tujuan

Digunakan Procurement untuk:

- validasi variant aktif
- mengambil snapshot product name
- mengambil snapshot variant name
- mengambil snapshot unit

---

## 7.2 InventoryProcurementPort

```ts
export type ReceiveProcurementStockRequest = {
  variantId: string;
  quantity: number;
  reason: string;
  referenceId: string;
  actor: {
    actorId: string;
    role: string;
  };
};

export interface InventoryProcurementPort {
  receiveFromPurchase(requests: ReceiveProcurementStockRequest[]): Promise<void>;
}
```

### Constraint

Port ini:

- hanya untuk procurement receive flow
- harus menghasilkan movement origin `PURCHASE`
- bukan reuse mentah dari `ReceiveStock` legacy

---

## 8. Prisma Schema Design

## 8.1 Jika enum database tidak bisa digunakan

Jika environment atau database saat ini tidak mendukung enum dengan aman, gunakan **string field + domain constant / union type**.

Itu berarti:

- database menyimpan `status` sebagai `String`
- validasi allowed value dilakukan di domain/application
- repository wajib menolak / memetakan nilai liar

### Solusi yang direkomendasikan

#### TypeScript

```ts
export const PURCHASE_ORDER_STATUSES = {
  CREATED: "CREATED",
  RECEIVED: "RECEIVED",
  CANCELED: "CANCELED",
} as const;

export type PurchaseOrderStatus =
  (typeof PURCHASE_ORDER_STATUSES)[keyof typeof PURCHASE_ORDER_STATUSES];
```

#### Prisma

```prisma
model PurchaseOrder {
  id          String   @id @db.VarChar(36)
  supplierId  String   @map("supplier_id") @db.VarChar(36)
  status      String   @db.VarChar(20)
  createdAt   DateTime @map("created_at")
  createdBy   String   @map("created_by") @db.VarChar(36)
  receivedAt  DateTime? @map("received_at")
  receivedBy  String?   @map("received_by") @db.VarChar(36)
  canceledAt  DateTime? @map("canceled_at")
  canceledBy  String?   @map("canceled_by") @db.VarChar(36)

  supplier    Supplier @relation(fields: [supplierId], references: [id])
  items       PurchaseItem[]

  @@index([supplierId])
  @@index([status])
  @@index([createdAt])
  @@map("purchase_orders")
}
```

### Konsekuensi

Trade-off ini sama seperti keputusan sebelumnya pada stock origin string:

- database tidak enforce closed set
- discipline dipindahkan ke domain + mapper + test
- tetap aman untuk MVP jika boundary dijaga ketat

### Guard wajib jika pakai string

- domain hanya menerima status yang valid
- mapper repository harus memverifikasi nilai database sebelum rehydrate entity
- architecture / integration test harus memastikan tidak ada nilai liar yang lolos

---

## 8.2 Supplier Table

```prisma
model Supplier {
  id         String   @id @db.VarChar(36)
  storeName  String   @map("store_name") @db.VarChar(200)
  salesName  String?  @map("sales_name") @db.VarChar(200)
  phone      String?  @db.VarChar(50)
  notes      String?  @db.Text
  isActive   Boolean  @default(true) @map("is_active")
  createdAt  DateTime @map("created_at")

  purchaseOrders PurchaseOrder[]

  @@index([isActive])
  @@map("suppliers")
}
```

---

## 8.3 PurchaseOrder Table

```prisma
model PurchaseOrder {
  id          String    @id @db.VarChar(36)
  supplierId  String    @map("supplier_id") @db.VarChar(36)
  status      String    @db.VarChar(20)
  createdAt   DateTime  @map("created_at")
  createdBy   String    @map("created_by") @db.VarChar(36)
  receivedAt  DateTime? @map("received_at")
  receivedBy  String?   @map("received_by") @db.VarChar(36)
  canceledAt  DateTime? @map("canceled_at")
  canceledBy  String?   @map("canceled_by") @db.VarChar(36)

  supplier    Supplier       @relation(fields: [supplierId], references: [id])
  items       PurchaseItem[]

  @@index([supplierId])
  @@index([status])
  @@index([createdAt])
  @@map("purchase_orders")
}
```

---

## 8.4 PurchaseItem Table

```prisma
model PurchaseItem {
  id                   String   @id @db.VarChar(36)
  purchaseOrderId      String   @map("purchase_order_id") @db.VarChar(36)
  productId            String   @map("product_id") @db.VarChar(36)
  variantId            String   @map("variant_id") @db.VarChar(36)
  productNameSnapshot  String   @map("product_name_snapshot") @db.VarChar(200)
  variantNameSnapshot  String   @map("variant_name_snapshot") @db.VarChar(200)
  unitSnapshot         String   @map("unit_snapshot") @db.VarChar(50)
  quantity             Int
  unitCost             Int      @map("unit_cost")
  subtotalCost         Int      @map("subtotal_cost")

  purchaseOrder        PurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)

  @@index([purchaseOrderId])
  @@index([variantId])
  @@map("purchase_items")
}
```

---

## 9. Validasi Rules per Entity

## 9.1 Supplier

- `id` wajib ada
- `storeName.trim()` tidak boleh kosong
- `createdAt` wajib ada
- `isActive` default `true`
- supplier inactive tidak boleh dipakai untuk PO baru

## 9.2 PurchaseItem

- `id` wajib ada
- `purchaseOrderId` wajib ada
- `productId` wajib ada
- `variantId` wajib ada
- `productNameSnapshot.trim()` tidak boleh kosong
- `variantNameSnapshot.trim()` tidak boleh kosong
- `unitSnapshot.trim()` tidak boleh kosong
- `quantity` harus integer positif
- `unitCost` harus integer `>= 0`
- `subtotalCost` dihitung dari `quantity × unitCost`

## 9.3 PurchaseOrder

- `id` wajib ada
- `supplierId` wajib ada
- `createdAt` wajib ada
- `createdBy` wajib ada
- `items.length > 0`
- semua item harus terkait ke purchase order yang sama
- status awal wajib `CREATED`
- hanya `CREATED` yang boleh di-receive
- hanya `CREATED` yang boleh di-cancel
- order yang `RECEIVED` atau `CANCELED` tidak boleh dimutasi lagi

---

## 10. Boundary & Constraint Enforcement

## 10.1 Dilarang menyentuh Inventory langsung

Procurement tidak boleh:

- import repository inventory implementation
- update tabel inventory langsung
- membuat stock movement sendiri

Integrasi ke Inventory hanya melalui `InventoryProcurementPort`.

## 10.2 Dilarang memindahkan cost ke Inventory

Tidak boleh menambah:

- `unitCost` di `InventoryItem`
- `supplierId` di inventory tables
- `subtotalCost` di stock movement

## 10.3 Dilarang membuka accounting diam-diam

Batch 1 tidak boleh menambah field seperti:

- payable amount
- payment status
- due date
- tax amount
- discount amount
- outstanding supplier

## 10.4 Authorization tetap di application layer

Role enforcement tetap berada di application layer.

Entity domain Procurement tidak boleh menerima role.

## 10.5 Legacy tetap dipisahkan

Batch 1 tidak melakukan:

- rekonstruksi histori pembelian lama
- backfill PO untuk stok legacy
- klaim bahwa stok lama berasal dari procurement

---

## 11. Rekomendasi Keputusan Final untuk Batch 1

1. Buat `procurement` sebagai modul terpisah.
2. Jadikan `PurchaseOrder` aggregate root.
3. Jadikan `PurchaseItem` child entity tanpa repository sendiri.
4. Simpan cost sebagai integer rupiah hanya di Procurement.
5. Gunakan `String + domain constant / union type` untuk status jika enum tidak tersedia.
6. Jangan simpan `totalCost` dan `totalQuantity` di database dulu karena masih derived.
7. Siapkan port Catalog dan Inventory sejak foundation.
8. Jangan sentuh kontrak Sales.
9. Jangan bocorkan cost ke Inventory.
10. Jangan buka partial receive.

---

## 12. Draft Kode – Domain Type & Contract

Bagian ini menyediakan draft kode awal untuk Batch 1 agar implementasi dapat dimulai dengan kontrak yang konsisten.

---

## 12.1 PurchaseOrderStatus tanpa enum

```ts
export const PURCHASE_ORDER_STATUSES = {
  CREATED: "CREATED",
  RECEIVED: "RECEIVED",
  CANCELED: "CANCELED",
} as const;

export type PurchaseOrderStatus =
  (typeof PURCHASE_ORDER_STATUSES)[keyof typeof PURCHASE_ORDER_STATUSES];

export function isPurchaseOrderStatus(value: string): value is PurchaseOrderStatus {
  return Object.values(PURCHASE_ORDER_STATUSES).includes(
    value as PurchaseOrderStatus,
  );
}
```

---

## 12.2 ProcurementErrors.ts

```ts
export class ProcurementDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProcurementDomainError";
  }
}

export class InvalidSupplierStoreNameError extends ProcurementDomainError {
  constructor() {
    super("SUPPLIER_STORE_NAME_INVALID");
  }
}

export class SupplierInactiveError extends ProcurementDomainError {
  constructor() {
    super("SUPPLIER_INACTIVE");
  }
}

export class PurchaseOrderItemsEmptyError extends ProcurementDomainError {
  constructor() {
    super("PURCHASE_ORDER_ITEMS_EMPTY");
  }
}

export class PurchaseItemQuantityInvalidError extends ProcurementDomainError {
  constructor() {
    super("PURCHASE_ITEM_QUANTITY_INVALID");
  }
}

export class PurchaseItemUnitCostInvalidError extends ProcurementDomainError {
  constructor() {
    super("PURCHASE_ITEM_UNIT_COST_INVALID");
  }
}

export class PurchaseItemSnapshotInvalidError extends ProcurementDomainError {
  constructor() {
    super("PURCHASE_ITEM_SNAPSHOT_INVALID");
  }
}

export class PurchaseOrderStatusInvalidError extends ProcurementDomainError {
  constructor() {
    super("PURCHASE_ORDER_STATUS_INVALID");
  }
}

export class PurchaseOrderAlreadyReceivedError extends ProcurementDomainError {
  constructor() {
    super("PURCHASE_ORDER_ALREADY_RECEIVED");
  }
}

export class PurchaseOrderAlreadyCanceledError extends ProcurementDomainError {
  constructor() {
    super("PURCHASE_ORDER_ALREADY_CANCELED");
  }
}

export class PurchaseOrderCannotBeReceivedError extends ProcurementDomainError {
  constructor() {
    super("PURCHASE_ORDER_CANNOT_BE_RECEIVED");
  }
}

export class PurchaseOrderCannotBeCanceledError extends ProcurementDomainError {
  constructor() {
    super("PURCHASE_ORDER_CANNOT_BE_CANCELED");
  }
}

export class DuplicatePurchaseItemVariantError extends ProcurementDomainError {
  constructor() {
    super("DUPLICATE_PURCHASE_ITEM_VARIANT");
  }
}
```

---

## 12.3 Supplier.ts

```ts
import {
  InvalidSupplierStoreNameError,
  SupplierInactiveError,
} from "./ProcurementErrors";

function normalizeOptional(value?: string | null): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export class Supplier {
  private constructor(
    public readonly id: string,
    private _storeName: string,
    private _salesName: string | null,
    private _phone: string | null,
    private _notes: string | null,
    private _isActive: boolean,
    public readonly createdAt: Date,
  ) {}

  static create(params: {
    id: string;
    storeName: string;
    salesName?: string | null;
    phone?: string | null;
    notes?: string | null;
    createdAt: Date;
  }): Supplier {
    const storeName = params.storeName.trim();

    if (!storeName) {
      throw new InvalidSupplierStoreNameError();
    }

    return new Supplier(
      params.id,
      storeName,
      normalizeOptional(params.salesName),
      normalizeOptional(params.phone),
      normalizeOptional(params.notes),
      true,
      params.createdAt,
    );
  }

  static rehydrate(params: {
    id: string;
    storeName: string;
    salesName: string | null;
    phone: string | null;
    notes: string | null;
    isActive: boolean;
    createdAt: Date;
  }): Supplier {
    const storeName = params.storeName.trim();

    if (!storeName) {
      throw new InvalidSupplierStoreNameError();
    }

    return new Supplier(
      params.id,
      storeName,
      normalizeOptional(params.salesName),
      normalizeOptional(params.phone),
      normalizeOptional(params.notes),
      params.isActive,
      params.createdAt,
    );
  }

  get storeName(): string {
    return this._storeName;
  }

  get salesName(): string | null {
    return this._salesName;
  }

  get phone(): string | null {
    return this._phone;
  }

  get notes(): string | null {
    return this._notes;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  activate(): void {
    this._isActive = true;
  }

  deactivate(): void {
    this._isActive = false;
  }

  updateContactInfo(params: {
    storeName: string;
    salesName?: string | null;
    phone?: string | null;
    notes?: string | null;
  }): void {
    const storeName = params.storeName.trim();

    if (!storeName) {
      throw new InvalidSupplierStoreNameError();
    }

    this._storeName = storeName;
    this._salesName = normalizeOptional(params.salesName);
    this._phone = normalizeOptional(params.phone);
    this._notes = normalizeOptional(params.notes);
  }

  assertCanBeUsedForNewPurchaseOrder(): void {
    if (!this._isActive) {
      throw new SupplierInactiveError();
    }
  }
}
```

---

## 12.4 PurchaseItem.ts

```ts
import {
  PurchaseItemQuantityInvalidError,
  PurchaseItemSnapshotInvalidError,
  PurchaseItemUnitCostInvalidError,
} from "./ProcurementErrors";

function assertNonEmpty(value: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new PurchaseItemSnapshotInvalidError();
  }

  return normalized;
}

function assertPositiveInteger(value: number): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new PurchaseItemQuantityInvalidError();
  }

  return value;
}

function assertNonNegativeInteger(value: number): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new PurchaseItemUnitCostInvalidError();
  }

  return value;
}

export class PurchaseItem {
  private constructor(
    public readonly id: string,
    public readonly purchaseOrderId: string,
    public readonly productId: string,
    public readonly variantId: string,
    public readonly productNameSnapshot: string,
    public readonly variantNameSnapshot: string,
    public readonly unitSnapshot: string,
    public readonly quantity: number,
    public readonly unitCost: number,
    public readonly subtotalCost: number,
  ) {}

  static create(params: {
    id: string;
    purchaseOrderId: string;
    productId: string;
    variantId: string;
    productNameSnapshot: string;
    variantNameSnapshot: string;
    unitSnapshot: string;
    quantity: number;
    unitCost: number;
  }): PurchaseItem {
    const quantity = assertPositiveInteger(params.quantity);
    const unitCost = assertNonNegativeInteger(params.unitCost);

    return new PurchaseItem(
      params.id,
      assertNonEmpty(params.purchaseOrderId),
      assertNonEmpty(params.productId),
      assertNonEmpty(params.variantId),
      assertNonEmpty(params.productNameSnapshot),
      assertNonEmpty(params.variantNameSnapshot),
      assertNonEmpty(params.unitSnapshot),
      quantity,
      unitCost,
      quantity * unitCost,
    );
  }

  static rehydrate(params: {
    id: string;
    purchaseOrderId: string;
    productId: string;
    variantId: string;
    productNameSnapshot: string;
    variantNameSnapshot: string;
    unitSnapshot: string;
    quantity: number;
    unitCost: number;
    subtotalCost: number;
  }): PurchaseItem {
    const quantity = assertPositiveInteger(params.quantity);
    const unitCost = assertNonNegativeInteger(params.unitCost);
    const subtotalCost = quantity * unitCost;

    if (params.subtotalCost !== subtotalCost) {
      throw new PurchaseItemSnapshotInvalidError();
    }

    return new PurchaseItem(
      assertNonEmpty(params.id),
      assertNonEmpty(params.purchaseOrderId),
      assertNonEmpty(params.productId),
      assertNonEmpty(params.variantId),
      assertNonEmpty(params.productNameSnapshot),
      assertNonEmpty(params.variantNameSnapshot),
      assertNonEmpty(params.unitSnapshot),
      quantity,
      unitCost,
      subtotalCost,
    );
  }
}
```

---

## 12.5 PurchaseOrder.ts

```ts
import {
  DuplicatePurchaseItemVariantError,
  PurchaseOrderAlreadyCanceledError,
  PurchaseOrderAlreadyReceivedError,
  PurchaseOrderCannotBeCanceledError,
  PurchaseOrderCannotBeReceivedError,
  PurchaseOrderItemsEmptyError,
  PurchaseOrderStatusInvalidError,
} from "./ProcurementErrors";
import {
  isPurchaseOrderStatus,
  PURCHASE_ORDER_STATUSES,
  PurchaseOrderStatus,
} from "./PurchaseOrderStatus";
import { PurchaseItem } from "./PurchaseItem";

function assertNonEmpty(value: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new PurchaseOrderStatusInvalidError();
  }

  return normalized;
}

function assertItems(items: PurchaseItem[]): PurchaseItem[] {
  if (items.length === 0) {
    throw new PurchaseOrderItemsEmptyError();
  }

  const seen = new Set<string>();

  for (const item of items) {
    if (seen.has(item.variantId)) {
      throw new DuplicatePurchaseItemVariantError();
    }

    seen.add(item.variantId);
  }

  return items;
}

export class PurchaseOrder {
  private constructor(
    public readonly id: string,
    public readonly supplierId: string,
    private _status: PurchaseOrderStatus,
    private _items: PurchaseItem[],
    public readonly createdAt: Date,
    public readonly createdBy: string,
    private _receivedAt: Date | null,
    private _receivedBy: string | null,
    private _canceledAt: Date | null,
    private _canceledBy: string | null,
  ) {}

  static create(params: {
    id: string;
    supplierId: string;
    items: PurchaseItem[];
    createdAt: Date;
    createdBy: string;
  }): PurchaseOrder {
    return new PurchaseOrder(
      assertNonEmpty(params.id),
      assertNonEmpty(params.supplierId),
      PURCHASE_ORDER_STATUSES.CREATED,
      assertItems(params.items),
      params.createdAt,
      assertNonEmpty(params.createdBy),
      null,
      null,
      null,
      null,
    );
  }

  static rehydrate(params: {
    id: string;
    supplierId: string;
    status: string;
    items: PurchaseItem[];
    createdAt: Date;
    createdBy: string;
    receivedAt: Date | null;
    receivedBy: string | null;
    canceledAt: Date | null;
    canceledBy: string | null;
  }): PurchaseOrder {
    if (!isPurchaseOrderStatus(params.status)) {
      throw new PurchaseOrderStatusInvalidError();
    }

    return new PurchaseOrder(
      assertNonEmpty(params.id),
      assertNonEmpty(params.supplierId),
      params.status,
      assertItems(params.items),
      params.createdAt,
      assertNonEmpty(params.createdBy),
      params.receivedAt,
      params.receivedBy,
      params.canceledAt,
      params.canceledBy,
    );
  }

  get status(): PurchaseOrderStatus {
    return this._status;
  }

  get items(): ReadonlyArray<PurchaseItem> {
    return this._items;
  }

  get receivedAt(): Date | null {
    return this._receivedAt;
  }

  get receivedBy(): string | null {
    return this._receivedBy;
  }

  get canceledAt(): Date | null {
    return this._canceledAt;
  }

  get canceledBy(): string | null {
    return this._canceledBy;
  }

  get totalQuantity(): number {
    return this._items.reduce((total, item) => total + item.quantity, 0);
  }

  get totalCost(): number {
    return this._items.reduce((total, item) => total + item.subtotalCost, 0);
  }

  assertCanBeReceived(): void {
    if (this._status === PURCHASE_ORDER_STATUSES.RECEIVED) {
      throw new PurchaseOrderAlreadyReceivedError();
    }

    if (this._status === PURCHASE_ORDER_STATUSES.CANCELED) {
      throw new PurchaseOrderCannotBeReceivedError();
    }
  }

  assertCanBeCanceled(): void {
    if (this._status === PURCHASE_ORDER_STATUSES.CANCELED) {
      throw new PurchaseOrderAlreadyCanceledError();
    }

    if (this._status === PURCHASE_ORDER_STATUSES.RECEIVED) {
      throw new PurchaseOrderCannotBeCanceledError();
    }
  }

  receive(params: { receivedAt: Date; receivedBy: string }): void {
    this.assertCanBeReceived();
    this._status = PURCHASE_ORDER_STATUSES.RECEIVED;
    this._receivedAt = params.receivedAt;
    this._receivedBy = assertNonEmpty(params.receivedBy);
  }

  cancel(params: { canceledAt: Date; canceledBy: string }): void {
    this.assertCanBeCanceled();
    this._status = PURCHASE_ORDER_STATUSES.CANCELED;
    this._canceledAt = params.canceledAt;
    this._canceledBy = assertNonEmpty(params.canceledBy);
  }
}
```

---

## 12.6 SupplierRepository.ts

```ts
import { Supplier } from "./Supplier";

export interface SupplierRepository {
  nextId(): string;
  save(supplier: Supplier): Promise<void>;
  findById(id: string): Promise<Supplier | null>;
  findByStoreName(storeName: string): Promise<Supplier | null>;
}
```

---

## 12.7 PurchaseOrderRepository.ts

```ts
import { PurchaseOrder } from "./PurchaseOrder";

export interface PurchaseOrderRepository {
  nextId(): string;
  nextItemId(): string;
  save(order: PurchaseOrder): Promise<void>;
  findById(id: string): Promise<PurchaseOrder | null>;
}
```

---

## 12.8 Mapper guard untuk status string

```ts
import {
  isPurchaseOrderStatus,
  PurchaseOrderStatus,
} from "../../domain/PurchaseOrderStatus";
import { PurchaseOrderStatusInvalidError } from "../../domain/ProcurementErrors";

export function toPurchaseOrderStatus(value: string): PurchaseOrderStatus {
  if (!isPurchaseOrderStatus(value)) {
    throw new PurchaseOrderStatusInvalidError();
  }

  return value;
}
```

---

## 13. Conclusion

Batch 1 Step 6 harus menghasilkan fondasi Procurement yang bersih, sempit, dan jujur.

Tujuan utamanya bukan membuat procurement terlihat lengkap, tetapi memastikan bahwa:

- histori pembelian punya rumah yang benar,
- cost tidak bocor ke domain lain,
- status tetap aman meski tanpa enum database,
- dan Inventory tetap menjadi source of truth untuk quantity.

Jika fondasi ini dijaga, Batch 2 dan Batch 3 bisa dibangun tanpa menabrak boundary yang sudah dikunci.

