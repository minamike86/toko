# Step 6 – Procurement & Cost Foundation

## Batch 2 – Receive Flow Activation

**Status:** DRAFT – READY FOR NEXT IMPLEMENTATION CONVERSATION  
**Scope:** Procurement receive flow only  
**Depends on:** Batch 1 Foundation completed

---

## 1. Tujuan

Dokumen ini mengunci arah implementasi **Batch 2 – Receive Flow Activation** pada Step 6 Procurement & Cost Foundation.

Batch 2 berfokus pada aktivasi alur **Receive Purchase Order** secara resmi melalui boundary Inventory yang bersih.

Batch ini hanya mencakup:

- `ReceivePurchaseOrder` use case
- `ReceivePurchaseOrderInput` DTO
- `InventoryProcurementPort`
- adapter inventory khusus procurement
- persist perubahan status `PurchaseOrder` menjadi `RECEIVED`
- integration test receive flow
- boundary test tambahan agar Procurement tidak bocor ke Inventory

Batch ini **belum** mencakup:

- cancel flow operasional penuh
- payable
- payment pembelian
- retur pembelian
- partial receive
- multi-receive
- accounting
- costing lanjutan

---

## 2. Posisi Batch 2 terhadap Batch 1

Batch 1 telah menyiapkan fondasi berikut:

- Supplier entity
- PurchaseOrder entity
- PurchaseItem entity
- repository contract
- Prisma schema procurement
- Prisma repository procurement
- mapper status string
- domain test
- application use case dasar (`CreateSupplier`, `UpdateSupplierStatus`, `CreatePurchaseOrder`)
- application/integration/boundary test foundation

Batch 2 **tidak mengubah foundation tersebut**. Batch 2 hanya mengaktifkan receive flow di atas fondasi yang sudah ada.

---

## 3. Tujuan Arsitektural Batch 2

### 3.1 Procurement tetap domain terpisah

Procurement tetap menjadi domain supply-side dan **bukan ekstensi Inventory**.

#### Receive Consistency Model

ReceivePurchaseOrder tidak menjamin atomicity lintas domain.

Flow:

1. Inventory receive dipanggil terlebih dahulu
2. Setelah sukses, PurchaseOrder diupdate menjadi RECEIVED

Jika persistence Procurement gagal setelah Inventory berhasil:

- stok sudah bertambah
- PurchaseOrder tetap CREATED

Ini adalah trade-off MVP.

Mitigasi:

- integration test harus mencakup skenario ini
- monitoring/logging wajib
- reconciliation tool akan disediakan pada step berikutnya

#### Contract Clarification (Non-Atomic Behavior)

Kondisi berikut adalah bagian dari kontrak sistem dan bukan error:

Jika:

- Inventory receive berhasil
- tetapi persistence Procurement gagal

Maka:

- stok tetap bertambah
- PurchaseOrder tetap berstatus CREATED

Kondisi ini dianggap valid pada MVP Step 6.

Sistem tidak melakukan rollback lintas domain.

Penanganan kondisi ini ditunda ke:

- reconciliation mechanism (step berikutnya)
- monitoring/logging operasional

### 3.2 Inventory tetap source of truth quantity

Procurement tidak menyimpan current stock dan tidak menulis quantity sendiri.

### 3.3 Receive harus melalui boundary resmi

Receive purchase order hanya boleh terjadi melalui `InventoryProcurementPort`.

### 3.4 Movement origin harus PURCHASE

Setiap receive procurement harus menghasilkan movement Inventory dengan origin `PURCHASE` dan `referenceId = purchaseOrderId`.

### 3.5 Tidak boleh reuse mentah receive stock legacy

Batch 2 tidak boleh menyalurkan procurement receive ke alur legacy yang masih memetakan origin menjadi `LEGACY`.

---

## 4. Scope Batch 2

### Masuk scope

- `ReceivePurchaseOrderInput`
- `ReceivePurchaseOrder`
- `InventoryProcurementPort`
- `InventoryProcurementAdapter`
- wiring actor context ke inventory boundary
- update status PO menjadi `RECEIVED`
- unit test use case receive
- integration test receive
- boundary test tambahan

### Tidak masuk scope

- `CancelPurchaseOrder`
- partial receive
- receive sebagian item
- receive bertahap untuk satu PO
- perubahan schema accounting
- perubahan schema payable
- supplier outstanding
- tax pembelian
- diskon pembelian
- moving average / FIFO / COGS

---

## 5. File Plan Batch 2

```txt
src/modules/procurement/
  application/
    dto/
      ReceivePurchaseOrderInput.ts
    ports/
      InventoryProcurementPort.ts
    use-cases/
      ReceivePurchaseOrder.ts

  infrastructure/
    adapters/
      InventoryProcurementAdapter.ts

  tests/
    application/
      ReceivePurchaseOrder.test.ts
    integration/
      ReceivePurchaseOrder.integration.test.ts

src/tests/architecture/
  procurement-receive-boundary.test.ts
```

---

## 6. Desain Kontrak Batch 2

## 6.1 ReceivePurchaseOrderInput

Minimal shape:

```ts
export type ReceivePurchaseOrderInput = {
  purchaseOrderId: string;
  receivedAt?: Date;
};
```

Catatan:

- `receivedAt` boleh opsional jika use case memakai `new Date()` saat eksekusi.
- Tidak ada payload item karena MVP Step 6 tidak mendukung partial receive.

---

## 6.2 InventoryProcurementPort

Kontrak minimal:

```ts
export const PROCUREMENT_STOCK_REASONS = {
  PURCHASE_RECEIVE: "PURCHASE_RECEIVE",
} as const;

export type ProcurementStockReason =
  (typeof PROCUREMENT_STOCK_REASONS)[keyof typeof PROCUREMENT_STOCK_REASONS];

export type ReceiveProcurementStockRequest = {
  variantId: string;
  quantity: number;
  reason: ProcurementStockReason;
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

Catatan:

- `role` ada di actor payload boundary karena authorization sudah terjadi di application layer dan Inventory adapter mungkin masih membutuhkan actor context operasional.
- Domain Procurement tetap tidak menerima role.

---

## 6.3 ReceivePurchaseOrder Use Case

Tanggung jawab:

1. validasi actor
2. validasi role (`ADMIN`, `WAREHOUSE`)
3. load `PurchaseOrder`
4. pastikan order ditemukan
5. validasi order masih `CREATED`
6. bentuk request inventory dari seluruh item PO
7. panggil `InventoryProcurementPort.receiveFromPurchase()` sekali per flow
8. tandai order `RECEIVED`
9. simpan kembali aggregate `PurchaseOrder`
10. kembalikan DTO hasil receive

Constraint tambahan:

- Use case tidak boleh mengasumsikan idempotency.
- Jika inventory sudah berhasil tetapi persistence gagal,
  eksekusi ulang receive dapat menyebabkan duplicate stock movement.
- Use case hanya mengandalkan status PurchaseOrder sebagai guard,
  dan tidak melakukan deduplication tambahan pada MVP Step 6.
  
Catatan:

- Tidak ada perubahan item setelah receive.
- Tidak ada receive parsial.
- Tidak ada retry orchestration tambahan di application layer kecuali memang sudah dikunci oleh inventory side.

---

## 7. Constraint Operasional Batch 2

### 7.1 Allowed Roles

- `ADMIN`
- `WAREHOUSE`

### 7.2 Transisi status yang diizinkan

- `CREATED -> RECEIVED`

### 7.3 Transisi yang dilarang

- `CANCELED -> RECEIVED`
- `RECEIVED -> RECEIVED`
- receive sebagian item
- receive tanpa movement inventory resmi

### Idempotency Limitation (MVP)

Step 6 tidak menyediakan mekanisme idempotency untuk receive purchase order.

Konsekuensi:

- retry request dapat menyebabkan duplicate stock movement
- Batch 2 tidak menjamin deduplication request pada boundary delivery/API.
- proteksi hanya bergantung pada status PurchaseOrder (CREATED → RECEIVED)

Penanganan idempotency ditunda ke step berikutnya jika diperlukan.

---

## 8. Boundary Checklist Batch 2

Checklist ini wajib lulus sebelum merge.

### 8.1 Procurement vs Inventory

- [ ] Procurement **tidak mengimpor** repository implementation dari `src/modules/inventory/infrastructure/*`
- [ ] Procurement **tidak mengimpor** entity/domain Inventory untuk memutasi stok langsung
- [ ] Procurement **tidak memanggil** Prisma model inventory secara langsung
- [ ] Procurement receive hanya lewat `InventoryProcurementPort`
- [ ] Adapter inventory procurement menghasilkan receive dengan origin `PURCHASE`
- [ ] `referenceId` yang dikirim ke Inventory adalah `purchaseOrderId`
- [ ] Inventory tetap tidak menerima supplier atau unit cost dalam kontraknya
- [ ] Procurement tidak menambah field cost ke Inventory

### 8.2 Procurement vs Sales

- [ ] Tidak ada import use case mutasi Sales
- [ ] Tidak ada perubahan kontrak domain Sales
- [ ] Tidak ada dependency ke order/payment sales use case

### 8.3 Authorization Boundary

- [ ] Authorization tetap di application layer
- [ ] Domain Procurement tidak menerima role
- [ ] Use case receive memvalidasi actor sebelum side effect
- [ ] Jika actor tidak valid, Inventory port tidak dipanggil

### 8.4 Persistence Boundary

- [ ] Status `PurchaseOrder` tetap string + mapper validation
- [ ] Tidak ada enum DB baru untuk status purchase order
- [ ] Repository procurement tetap aggregate-based
- [ ] `PurchaseItem` tetap tanpa repository sendiri

### 8.5 MVP Scope Guard

- [ ] Tidak ada payable
- [ ] Tidak ada payment pembelian
- [ ] Tidak ada retur pembelian
- [ ] Tidak ada partial receive
- [ ] Tidak ada accounting journal
- [ ] Tidak ada margin/COGS/FIFO/moving average
- [ ] Tidak ada perubahan kontrak reporting fiskal

---

## 9. Test Plan Batch 2

## 9.1 Application Test

Minimal skenario:

1. `receives purchase order when actor is allowed and status is CREATED`
2. `throws when purchase order is not found`
3. `throws when purchase order is already RECEIVED`
4. `throws when purchase order is CANCELED`
5. `calls inventory procurement port once with all items`
6. `does not save purchase order when inventory port fails`
7. `rejects actor without allowed role`
8. `inventory succeeds but procurement persistence fails:`
      - inventory port already executed
      - purchase order remains in CREATED state
      - no rollback attempted

Semua test wajib mencerminkan kontrak non-atomic behavior yang telah didefinisikan pada section Receive Consistency Model.

## 9.2 Integration Test

Minimal skenario:

1. create PO -> receive PO -> status persisted as `RECEIVED`
2. receive flow sends all purchase items to inventory adapter boundary
3. receive flow stores `receivedAt` and `receivedBy`
4. receive flow rejects already received PO
5. inventory success but procurement persistence fails:
   - stok tetap bertambah
   - PurchaseOrder tetap CREATED
   - tidak ada rollback lintas domain

Catatan:

- Integration test boleh memakai fake/stub inventory adapter yang mencatat payload.
- Jika adapter Inventory asli dipakai, test harus memastikan origin `PURCHASE` benar-benar tercatat.

## 9.3 Architecture / Boundary Test

Minimal alarm:

1. Procurement tidak import inventory infrastructure repository langsung
2. Procurement tidak import sales application use case
3. Procurement tidak membuat class `ReceiveStock` sendiri
4. Procurement receive wajib bergantung pada `InventoryProcurementPort`

---

## 10. Definition of Done Batch 2

Batch 2 dianggap selesai jika:

1. `ReceivePurchaseOrder` aktif dan hijau
2. Receive hanya bisa dari status `CREATED`
3. Inventory dipanggil melalui port resmi, bukan shortcut langsung
4. Movement inventory untuk procurement receive menggunakan origin `PURCHASE`
5. `PurchaseOrder` tersimpan sebagai `RECEIVED`
6. Tidak ada partial receive
7. Tidak ada kebocoran boundary ke Inventory atau Sales
8. Seluruh test Batch 1 tetap hijau setelah perubahan

---

## 11. Catatan Penutup

Dokumen ini sengaja menjaga Batch 2 tetap sempit.

Tujuannya bukan membuat Procurement terasa lengkap, melainkan membuat receive flow resmi aktif **tanpa**:

- membocorkan cost ke Inventory,
- membocorkan mutation ke Sales,
- atau diam-diam membuka accounting mini.
