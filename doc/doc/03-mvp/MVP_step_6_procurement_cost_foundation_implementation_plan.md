# Step 6 – Procurement & Cost Foundation Implementation Plan

**Status:** READY FOR DESIGN EXECUTION  
**Parent:** MVP Step 6 – Procurement & Cost Foundation  
**Reference:**

- MVP Stages Overview
- ADR-0013 – Introduce Procurement Domain
- Procurement Domain (Future)
- ADR-0012 – Inventory Mutation Pattern
- ADR-0010 – Receive Stock Atomicity

---

## 1. Tujuan

Step 6 mengaktifkan **Procurement Domain** sebagai domain baru di sisi supply untuk:

- mencatat histori pembelian barang dari supplier
- menyimpan **unit cost** per transaksi pembelian
- menghasilkan penambahan stok resmi ke Inventory melalui `StockMovement.origin = PURCHASE`
- menyiapkan fondasi untuk costing pada step berikutnya

Step 6 **bukan** accounting, **bukan** supplier payable, dan **bukan** profit calculation.

---

## 2. Prinsip Arsitektural

### 2.1 Domain Baru yang Terpisah

Procurement adalah domain baru dan **bukan ekstensi Inventory**.

Konsekuensi:
- Inventory tetap menjadi source of truth jumlah stok
- Procurement menjadi source of truth histori pembelian dan unit cost
- Sales tidak mengetahui proses procurement

### 2.2 Integrasi Melalui Boundary Resmi

Procurement **tidak boleh**:
- menulis `InventoryItem` langsung
- membuat `StockMovement` melalui shortcut repository internal inventory
- memodifikasi tabel inventory di luar application boundary

Integrasi hanya melalui service/use case inventory resmi.

### 2.3 Cost Tidak Hidup di Inventory

Inventory hanya menyimpan kuantitas dan movement.

Inventory **tidak menyimpan**:
- supplier
- unit cost
- subtotal pembelian
- costing logic

### 2.4 Legacy Tetap Dipisahkan

Stok sebelum aktivasi Procurement tetap dianggap legacy.

Step 6 **tidak melakukan**:
- rekonstruksi histori pembelian lama
- backfill purchase order historis
- konversi stock legacy menjadi histori procurement palsu

---

## 3. Scope Step 6

### 3.1 Yang Masuk Scope

- Supplier entity
- PurchaseOrder entity
- PurchaseItem entity
- Create Purchase Order
- Receive Purchase Order
- Cancel Purchase Order
- Integrasi ke Inventory melalui penambahan stok resmi
- Penyimpanan unit cost di Procurement Domain
- Recording `StockMovement.origin = PURCHASE`

### 3.2 Yang Tidak Masuk Scope

Step 6 **tidak** mencakup:

- Hutang ke supplier
- Payment pembelian
- Retur pembelian
- Partial receiving
- Multi-receive untuk satu purchase order
- Margin calculation
- COGS calculation
- FIFO / Moving Average
- Accounting journal
- Pajak pembelian
- Reorder otomatis

---

## 4. Model Domain Final (MVP Step 6)

## 4.1 Supplier

Merepresentasikan pihak eksternal tempat barang dibeli.

### Minimal Attributes

- `id: string`
- `storeName: string`
- `salesName: string | null`
- `phone: string | null`
- `notes: string | null`
- `isActive: boolean`
- `createdAt: Date`

### Rules

- Supplier inactive tidak boleh dipakai membuat purchase order baru
- Perubahan contact info tidak mengubah histori pembelian lama
- Histori purchase tetap menyimpan referensi supplier saat transaksi terjadi

---

## 4.2 PurchaseOrder

Merepresentasikan satu kejadian pembelian dari supplier.

### Minimal Attributes

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
- Hanya PurchaseOrder `CREATED` yang boleh di-receive
- Hanya PurchaseOrder `CREATED` yang boleh di-cancel
- PurchaseOrder `RECEIVED` tidak boleh diubah
- PurchaseOrder `CANCELED` tidak boleh di-receive

---

## 4.3 PurchaseItem

Merepresentasikan satu line item dalam purchase order.

### Minimal Attributes

- `variantId: string`
- `productId: string`
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
- PurchaseItem **harus** refer ke `variantId`
- `productId` disimpan sebagai snapshot/helper, bukan identity operasional utama

---

## 5. Role Matrix MVP

Mengikuti model actor minimal yang sudah aktif pada Step 5.4.

| Use Case | Allowed Roles |
|----------|---------------|
| CreateSupplier | ADMIN |
| UpdateSupplierStatus | ADMIN |
| CreatePurchaseOrder | ADMIN, WAREHOUSE |
| ReceivePurchaseOrder | ADMIN, WAREHOUSE |
| CancelPurchaseOrder | ADMIN |
| GetProcurementReports (future read) | ADMIN |

Catatan:
- SALES tidak masuk scope write Procurement pada Step 6
- Tidak ada authorization di domain entity
- Authorization tetap di application layer

---

## 6. Use Cases Step 6

## 6.1 CreatePurchaseOrder

### Tujuan
Membuat order pembelian baru terhadap supplier.

### Input
- `supplierId`
- `actor`
- `items[]`:
  - `variantId`
  - `quantity`
  - `unitCost`

### Flow
1. Validasi actor dan role
2. Validasi supplier ada dan aktif
3. Ambil snapshot variant dari Catalog Read Repository
4. Validasi seluruh variant ada dan aktif
5. Bentuk `PurchaseItem` dengan snapshot nama/unit
6. Buat `PurchaseOrder` status `CREATED`
7. Simpan ke Procurement Repository

### Output
- `purchaseOrderId`
- `status`
- `totalCost`
- `totalQuantity`

### Tidak Dilakukan
- tidak menambah stok
- tidak membuat stock movement
- tidak menyentuh inventory

---

## 6.2 ReceivePurchaseOrder

### Tujuan
Menerima barang dari purchase order dan menambah stok resmi.

### Input
- `purchaseOrderId`
- `actor`
- `receivedAt`

### Flow
1. Validasi actor dan role
2. Ambil PurchaseOrder
3. Validasi status masih `CREATED`
4. Untuk setiap item purchase:
   - panggil inventory receive melalui boundary resmi
   - quantity bertambah
   - movement tercatat dengan `origin = PURCHASE`
   - `referenceId = purchaseOrderId`
5. Tandai PurchaseOrder sebagai `RECEIVED`
6. Simpan perubahan Procurement

### Constraint Keras
- Tidak boleh memanggil repository inventory langsung dari Procurement
- Tidak boleh mem-bypass movement
- Tidak boleh menggunakan `origin = LEGACY`
- Tidak boleh partial receive pada Step 6 MVP

### Output
- `purchaseOrderId`
- `status = RECEIVED`
- `receivedAt`

---

## 6.3 CancelPurchaseOrder

### Tujuan
Membatalkan purchase order sebelum barang diterima.

### Input
- `purchaseOrderId`
- `actor`

### Flow
1. Validasi actor dan role
2. Ambil PurchaseOrder
3. Validasi status masih `CREATED`
4. Tandai order `CANCELED`
5. Simpan perubahan

### Constraint
- PurchaseOrder yang sudah `RECEIVED` tidak bisa dibatalkan
- Cancel tidak mengubah stok karena stok belum pernah masuk

---

## 7. Integrasi dengan Domain Lain

## 7.1 Catalog

Procurement membaca Catalog untuk:
- validasi variant aktif
- snapshot product name
- snapshot variant name
- snapshot unit

Procurement tidak mengubah Catalog.

---

## 7.2 Inventory

Inventory hanya menerima permintaan penambahan stok resmi dari Procurement.

### Aturan Integrasi

- quantity bertambah melalui use case/service inventory
- movement wajib dibuat
- `origin = PURCHASE`
- `referenceId = purchaseOrderId`
- Inventory tetap tidak mengetahui supplier atau unit cost

### Required Alignment

Jika receive inventory existing masih hardcoded `origin = LEGACY`, Step 6 harus menambahkan jalur receive resmi khusus procurement atau memperluas boundary inventory secara eksplisit tanpa mengubah meaning use case lama.

---

## 7.3 Sales

Sales tidak mengetahui Procurement.

Tidak ada perubahan kontrak Sales pada Step 6.

---

## 8. Struktur Modul yang Direkomendasikan

```txt
src/modules/procurement/
  domain/
    Supplier.ts
    PurchaseOrder.ts
    PurchaseItem.ts
    ProcurementErrors.ts
    SupplierRepository.ts
    PurchaseOrderRepository.ts
  application/
    CreateSupplier.ts
    UpdateSupplierStatus.ts
    CreatePurchaseOrder.ts
    ReceivePurchaseOrder.ts
    CancelPurchaseOrder.ts
    dto/
      create-purchase-order.dto.ts
      receive-purchase-order.dto.ts
      purchase-order.dto.ts
    ports/
      CatalogSnapshotPort.ts
      InventoryProcurementPort.ts
  infrastructure/
    PrismaSupplierRepository.ts
    PrismaPurchaseOrderRepository.ts
    PrismaCatalogSnapshotAdapter.ts
    InventoryProcurementAdapter.ts
  tests/
    ...
```

Catatan:
- Procurement tidak memiliki dependency ke UI
- Reporting procurement belum menjadi bagian wajib Step 6
- Jika diperlukan read model minimal, tempatkan sebagai reporting terpisah, bukan di domain

---

## 9. Contract yang Direkomendasikan

## 9.1 InventoryProcurementPort

Procurement memerlukan port eksplisit agar boundary inventory tetap bersih.

```ts
export type ReceiveProcurementStockRequest = {
  variantId: string;
  quantity: number;
  reason: string;
  referenceId: string;
  actor: ActorContext;
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

## 9.2 CatalogSnapshotPort

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

---

## 10. Status Model Purchase Order

Status final MVP Step 6:

- `CREATED`
- `RECEIVED`
- `CANCELED`

### Tidak Ada Status Tambahan

Step 6 tidak menambah:
- `PARTIALLY_RECEIVED`
- `APPROVED`
- `PAID`
- `CLOSED`

Status tambahan tersebut ditunda ke step/domain berikutnya jika benar-benar dibutuhkan.

---

## 11. Data Model Database (Direction Only)

## 11.1 Supplier Table

Minimal columns:
- `id`
- `store_name`
- `sales_name`
- `phone`
- `notes`
- `is_active`
- `created_at`

## 11.2 Purchase Order Table

Minimal columns:
- `id`
- `supplier_id`
- `status`
- `created_at`
- `created_by`
- `received_at`
- `received_by`
- `canceled_at`
- `canceled_by`

## 11.3 Purchase Item Table

Minimal columns:
- `id`
- `purchase_order_id`
- `product_id`
- `variant_id`
- `product_name_snapshot`
- `variant_name_snapshot`
- `unit_snapshot`
- `quantity`
- `unit_cost`
- `subtotal_cost`

Catatan:
- gunakan integer rupiah untuk `unit_cost`
- tidak gunakan float
- tidak simpan cost di inventory tables

---

## 12. Testing Strategy

## 12.1 Domain Test

- Supplier active/inactive behavior
- PurchaseOrder status transition
- PurchaseItem subtotal calculation
- invalid quantity / invalid unit cost

## 12.2 Application Test

- CreatePurchaseOrder validates supplier and variants
- ReceivePurchaseOrder calls inventory port exactly once per order flow
- CancelPurchaseOrder rejects received orders
- authorization enforced in application layer

## 12.3 Integration Test

- Create + Receive purchase order persists procurement data
- Receive purchase order produces stock increase in inventory
- Movement origin recorded as `PURCHASE`
- referenceId links to purchaseOrderId
- legacy stock remains untouched

## 12.4 Architecture / Boundary Test

- Procurement must not import Inventory repositories directly
- Procurement must not write Inventory tables directly
- Procurement must not import Sales mutation use cases
- Cost fields must not appear in Inventory domain contracts

---

## 13. Migration & Legacy Handling

### 13.1 Legacy Stock

Stok lama tetap dianggap legacy.

Procurement Step 6:
- tidak memigrasikan stok lama
- tidak mengklaim histori kulak lama
- hanya berlaku untuk purchase baru setelah aktivasi domain

### 13.2 Existing Stock Movement

Movement lama dengan:
- `LEGACY`
- `MANUAL_ADJUSTMENT`

Tetap valid.

Movement procurement baru wajib:
- `origin = PURCHASE`

---

## 14. Risks & Trade-offs

## 14.1 Accepted Trade-offs

- Belum ada supplier payable
- Belum ada partial receive
- Belum ada cost accounting
- Belum ada purchase reporting formal

## 14.2 Risk

Jika boundary tidak dijaga, Procurement mudah bocor menjadi:
- inventory extension tersembunyi
- accounting mini tanpa desain
- costing liar di reporting

Karena itu Step 6 harus tetap sempit dan disiplin.

---

## 15. Definition of Done — Step 6

Step 6 dianggap selesai jika:

1. Supplier entity aktif dan bisa dikelola minimal
2. PurchaseOrder dan PurchaseItem aktif
3. CreatePurchaseOrder berjalan
4. ReceivePurchaseOrder menambah stok resmi melalui Inventory boundary
5. Setiap receive menghasilkan `StockMovement.origin = PURCHASE`
6. Unit cost tersimpan konsisten di Procurement Domain
7. Tidak ada perubahan kontrak domain Sales
8. Inventory tetap menjadi source of truth jumlah stok
9. Test hijau
10. Boundary Procurement vs Inventory tetap bersih

---

## 16. Explicit Anti-Patterns (Dilarang)

- Menyimpan unit cost di InventoryItem
- Menambahkan supplierId ke Inventory domain
- Menghitung margin di Step 6
- Menambah payable logic diam-diam
- Membuat receive purchase langsung menulis ke tabel inventory
- Menggunakan purchase order untuk merekonstruksi histori stok lama
- Mengubah reporting Step 3 menjadi cost-aware

---

## 17. Recommended Execution Order

### Batch 1 – Foundation
- Supplier entity
- PurchaseOrder entity
- PurchaseItem entity
- repositories + schema

### Batch 2 – Create Purchase Order
- catalog snapshot port
- create purchase order use case
- tests

### Batch 3 – Receive Purchase Order
- inventory procurement port
- receive purchase order use case
- movement origin PURCHASE
- integration tests

### Batch 4 – Cancel Purchase Order + hardening
- cancel purchase order
- architecture test
- final validation

---

## 18. Conclusion

Step 6 adalah ekspansi domain yang memperkenalkan supply-side truth tanpa merusak domain operasional yang sudah stabil.

Step ini harus tetap:
- sempit
- jujur
- tidak berpura-pura menjadi accounting

Dengan plan ini, Procurement dapat diaktifkan secara disiplin sebagai fondasi cost awareness untuk langkah berikutnya, tanpa merusak Inventory, Sales, maupun Reporting yang sudah terkunci.

