# Receiving Inspection Flow — Final Use Cases

Status: PROPOSED FOR FUTURE STEP IMPLEMENTATION  
Source of Truth: ADR-0021 — Receiving Inspection Flow  
Change Type: Additive, Non-Breaking terhadap Step 6–7

Roadmap Placement: MVP Step 7.5 — Receiving Inspection & Quarantine

Catatan:

- Use case ini tidak termasuk scope MVP Step 7 — Supplier Payable.
- Step 7 tetap fokus pada supplier outstanding, supplier payment, dan payable reduction.
- Receiving Inspection adalah future-step terpisah setelah Step 7.
- Implementasi use case ini tidak boleh dimulai sebelum Step 7 selesai dan governance Step 7 ditutup.

---

## Use Case List

1. Register Goods Arrival
2. Start Receiving Inspection
3. Complete Receiving Inspection
4. Finalize Inspection Acceptance

Use case ini berlaku hanya untuk **Inspection Flow Mode**.

Pada mode ini:

- `ReceivePurchaseOrder` tidak boleh dipanggil langsung oleh delivery/UI.
- Semua barang wajib melalui `ReceivingInspection`.
- Final receive hanya boleh terjadi melalui `Finalize Inspection Acceptance`.
- Direct Receive Mode Step 6 tetap ada dan tidak dihapus.

### Mode Enforcement Rule (Critical)

Dalam Inspection Flow Mode:

- Semua use case di dokumen ini mengasumsikan bahwa `PurchaseOrder` telah masuk mode inspection.
- Setiap use case WAJIB memverifikasi bahwa:
  - `PurchaseOrder` belum pernah di-direct receive
  - Inspection Flow Mode aktif untuk `PurchaseOrder`

Larangan:

- Tidak boleh memanggil `ReceivePurchaseOrder` secara langsung untuk `PurchaseOrder` yang sudah memiliki `ReceivingInspection`
- Tidak boleh membuat `ReceivingInspection` untuk `PurchaseOrder` yang sudah di-direct receive

Konsekuensi:

- Implementasi wajib memiliki guard untuk mencegah pencampuran mode
- Pelanggaran rule ini harus dianggap sebagai error bisnis, bukan error teknis

---

# 1. Use Case — Register Goods Arrival

## Status

PROPOSED FOR FUTURE STEP IMPLEMENTATION

---

## Tujuan

Mencatat bahwa barang dari supplier untuk satu `PurchaseOrder` telah datang dan harus masuk proses inspeksi warehouse sebelum dapat diterima ke inventory.

Use case ini tidak menambah stok, tidak mengubah payable, dan tidak mengubah status `PurchaseOrder` menjadi `RECEIVED`.

---

## Actor

- `WAREHOUSE`
- `ADMIN`

Authorization wajib berada di application layer sebelum use case dijalankan.

---

## Preconditions

- `PurchaseOrder` ada.
- `PurchaseOrder` berstatus `CREATED`.
- `PurchaseOrder` belum menggunakan Direct Receive Mode.
- Belum ada `ReceivingInspection` aktif untuk `PurchaseOrder` tersebut.
- Inspection Flow Mode aktif secara eksplisit melalui policy/config/feature flag.

---

## Input DTO

```ts
export type RegisterGoodsArrivalInput = {
  purchaseOrderId: string;
  arrivedAt: Date;
  notes: string | null;
  actor: {
    actorId: string;
    role: "WAREHOUSE" | "ADMIN";
  };
};
```

---

## Output DTO

```ts
export type RegisterGoodsArrivalResult = {
  receivingInspectionId: string;
  purchaseOrderId: string;
  status: "ARRIVED";
  arrivedAt: Date;
  arrivedBy: string;
};
```

---

## Main Flow

1. Application layer menerima request dan actor.
2. Authorization guard memverifikasi actor `WAREHOUSE` atau `ADMIN`.
3. Use case memverifikasi Inspection Flow Mode aktif.
4. Use case memuat `PurchaseOrder`.
5. Use case memverifikasi `PurchaseOrder` berstatus `CREATED`.
6. Use case memverifikasi `PurchaseOrder` belum pernah direct receive.
7. Use case memverifikasi belum ada `ReceivingInspection` untuk `PurchaseOrder` tersebut.
8. Use case membuat `ReceivingInspection` dengan status `ARRIVED`.
9. Use case membuat daftar `ReceivingInspectionItem` berdasarkan `PurchaseItem`.
10. Use case menyimpan inspection record.
11. Use case mengembalikan hasil registrasi kedatangan.

---

## Rejection Flow

### A1. Purchase order tidak ditemukan

- Use case ditolak.
- Error: `PURCHASE_ORDER_NOT_FOUND`.

### A2. Purchase order bukan `CREATED`

- Use case ditolak.
- Error: `PURCHASE_ORDER_NOT_INSPECTABLE`.

### A3. Inspection Flow Mode tidak aktif

- Use case ditolak.
- Error: `INSPECTION_FLOW_NOT_ENABLED`.

### A4. Inspection sudah ada

- Use case ditolak.
- Error: `RECEIVING_INSPECTION_ALREADY_EXISTS`.

### A5. Purchase order sudah direct receive

- Use case ditolak.
- Error: `PURCHASE_ORDER_ALREADY_RECEIVED`.

### A6. Actor tidak berwenang

- Use case ditolak.
- Error: `FORBIDDEN`.

---

## Postconditions

- `ReceivingInspection` tercatat dengan status `ARRIVED`.
- `PurchaseOrder` tetap `CREATED`.
- Inventory tidak berubah.
- Payable tidak berubah.
- Outstanding tidak berubah.

---

## Invariants

- Satu `PurchaseOrder` hanya boleh memiliki satu `ReceivingInspection` pada phase pertama.
- Inspection tidak boleh dibuat untuk `PurchaseOrder` yang sudah direct receive.
- Register arrival tidak boleh memicu inventory mutation.
- Register arrival tidak boleh memicu payable mutation.

---

## Repository / Port yang Diperbolehkan

- `PurchaseOrderRepository`
- `ReceivingInspectionRepository`
- Inspection flow policy/config reader

Use case ini tidak boleh:

- memanggil inventory mutation
- memanggil supplier payment
- membuat supplier return
- mengubah status `PurchaseOrder` menjadi `RECEIVED`

---

## Testing Focus

### Application Test

- berhasil membuat inspection dari PO `CREATED`
- menolak PO tidak ditemukan
- menolak PO yang sudah `RECEIVED`
- menolak duplicate inspection
- menolak actor selain `WAREHOUSE` atau `ADMIN`

### Integration Test Bernilai Tinggi

- memastikan duplicate request tidak menghasilkan inspection ganda
- memastikan tidak ada inventory movement setelah register arrival

---

# 2. Use Case — Start Receiving Inspection

## Status

PROPOSED FOR FUTURE STEP IMPLEMENTATION

---

## Tujuan

Memulai proses inspeksi warehouse untuk inspection yang sudah tercatat sebagai `ARRIVED`.

Use case ini hanya mengubah status inspection dari `ARRIVED` menjadi `UNDER_INSPECTION`.

---

## Actor

- `WAREHOUSE`
- `ADMIN`

---

## Preconditions

- `ReceivingInspection` ada.
- `ReceivingInspection` berstatus `ARRIVED`.
- `PurchaseOrder` terkait masih `CREATED`.

---

## Input DTO

```ts
export type StartReceivingInspectionInput = {
  receivingInspectionId: string;
  startedAt: Date;
  actor: {
    actorId: string;
    role: "WAREHOUSE" | "ADMIN";
  };
};
```

---

## Output DTO

```ts
export type StartReceivingInspectionResult = {
  receivingInspectionId: string;
  purchaseOrderId: string;
  status: "UNDER_INSPECTION";
  startedAt: Date;
  startedBy: string;
};
```

---

## Main Flow

1. Application layer menerima request dan actor.
2. Authorization guard memverifikasi actor `WAREHOUSE` atau `ADMIN`.
3. Use case memuat `ReceivingInspection`.
4. Use case memverifikasi inspection berstatus `ARRIVED`.
5. Use case memuat `PurchaseOrder` terkait.
6. Use case memverifikasi `PurchaseOrder` masih `CREATED`.
7. Use case mengubah status inspection menjadi `UNDER_INSPECTION`.
8. Use case menyimpan inspection.
9. Use case mengembalikan hasil.

---

## Rejection Flow

### A1. Inspection tidak ditemukan

- Use case ditolak.
- Error: `RECEIVING_INSPECTION_NOT_FOUND`.

### A2. Inspection bukan `ARRIVED`

- Use case ditolak.
- Error: `RECEIVING_INSPECTION_STATUS_INVALID`.

### A3. Purchase order sudah tidak `CREATED`

- Use case ditolak.
- Error: `PURCHASE_ORDER_NOT_INSPECTABLE`.

### A4. Actor tidak berwenang

- Use case ditolak.
- Error: `FORBIDDEN`.

---

## Postconditions

- Inspection berstatus `UNDER_INSPECTION`.
- Inventory tidak berubah.
- Payable tidak berubah.
- `PurchaseOrder` tetap `CREATED`.

---

## Invariants

- Inspection hanya boleh dimulai satu kali.
- Status transition valid hanya `ARRIVED -> UNDER_INSPECTION`.
- Start inspection tidak boleh mencatat hasil inspection item.
- Start inspection tidak boleh memicu inventory mutation.

---

## Repository / Port yang Diperbolehkan

- `ReceivingInspectionRepository`
- `PurchaseOrderRepository`

Use case ini tidak boleh:

- memanggil inventory mutation
- mengubah payable
- mengubah status `PurchaseOrder`

---

## Testing Focus

### Application Test

- berhasil mengubah status dari `ARRIVED` ke `UNDER_INSPECTION`
- menolak inspection tidak ditemukan
- menolak status selain `ARRIVED`
- menolak actor tidak berwenang

---

# 3. Use Case — Complete Receiving Inspection

## Status

PROPOSED FOR FUTURE STEP IMPLEMENTATION

---

## Tujuan

Mencatat hasil inspeksi item secara lengkap dan menandai inspection sebagai `COMPLETED`.

Use case ini belum memicu receive final dan belum memasukkan accepted quantity ke inventory.

---

## Actor

- `WAREHOUSE`
- `ADMIN`

---

## Preconditions

- `ReceivingInspection` ada.
- `ReceivingInspection` berstatus `UNDER_INSPECTION`.
- Semua item inspection memiliki hasil eksplisit.
- Semua quantity hasil inspeksi valid.

---

## Input DTO

```ts
export type CompleteReceivingInspectionInput = {
  receivingInspectionId: string;
  completedAt: Date;
  items: Array<{
    purchaseItemId: string;
    acceptedQuantity: number;
    quarantinedQuantity: number;
    rejectedQuantity: number;
    notes: string | null;
  }>;
  actor: {
    actorId: string;
    role: "WAREHOUSE" | "ADMIN";
  };
};
```

---

## Output DTO

```ts
export type CompleteReceivingInspectionResult = {
  receivingInspectionId: string;
  purchaseOrderId: string;
  status: "COMPLETED";
  completedAt: Date;
  completedBy: string;
  items: Array<{
    purchaseItemId: string;
    expectedQuantity: number;
    acceptedQuantity: number;
    quarantinedQuantity: number;
    rejectedQuantity: number;
  }>;
};
```

---

## Main Flow

1. Application layer menerima request dan actor.
2. Authorization guard memverifikasi actor `WAREHOUSE` atau `ADMIN`.
3. Use case memuat `ReceivingInspection`.
4. Use case memverifikasi inspection berstatus `UNDER_INSPECTION`.
5. Use case memverifikasi semua `purchaseItemId` valid dan milik inspection.
6. Use case memverifikasi semua quantity integer non-negatif.
7. Untuk setiap item, use case memverifikasi:
   - `acceptedQuantity + quarantinedQuantity + rejectedQuantity = expectedQuantity`
8. Use case mencatat hasil inspection item.
9. Use case mengubah status inspection menjadi `COMPLETED`.
10. Use case menyimpan inspection.
11. Use case mengembalikan hasil.

---

## Rejection Flow

### A1. Inspection tidak ditemukan

- Use case ditolak.
- Error: `RECEIVING_INSPECTION_NOT_FOUND`.

### A2. Inspection bukan `UNDER_INSPECTION`

- Use case ditolak.
- Error: `RECEIVING_INSPECTION_STATUS_INVALID`.

### A3. Item tidak valid

- Use case ditolak.
- Error: `RECEIVING_INSPECTION_ITEM_INVALID`.

### A4. Quantity tidak valid

- Use case ditolak.
- Error: `RECEIVING_INSPECTION_QUANTITY_INVALID`.

### A5. Quantity tidak teralokasi penuh

- Use case ditolak.
- Error: `RECEIVING_INSPECTION_QUANTITY_UNRESOLVED`.

### A6. Actor tidak berwenang

- Use case ditolak.
- Error: `FORBIDDEN`.

---

## Postconditions

- Inspection berstatus `COMPLETED`.
- Setiap item memiliki hasil eksplisit.
- `PurchaseOrder` tetap `CREATED`.
- Inventory tidak berubah.
- Payable tidak berubah.

---

## Invariants

- `accepted + quarantined + rejected = expectedQuantity` untuk setiap item.
- Semua quantity harus integer non-negatif.
- `COMPLETED` tidak sama dengan final receive.
- Completed inspection tidak boleh membuat inventory movement langsung.
- Completed inspection tidak boleh mengubah outstanding payable.

---

## Repository / Port yang Diperbolehkan

- `ReceivingInspectionRepository`
- `PurchaseOrderRepository`

Use case ini tidak boleh:

- memanggil inventory mutation
- mengubah status `PurchaseOrder` menjadi `RECEIVED`
- mengurangi payable
- membuat supplier return

---

## Testing Focus

### Domain / Invariant Test

- quantity allocation harus tepat sama dengan expected quantity
- quantity negatif ditolak
- item yang tidak termasuk inspection ditolak
- completed inspection immutable terhadap hasil item

### Application Test

- actor non-warehouse/admin ditolak
- status selain `UNDER_INSPECTION` ditolak
- success path tidak menghasilkan inventory movement

### Integration Test Bernilai Tinggi

- complete inspection dengan accepted + quarantined + rejected campuran
- memastikan PO tetap `CREATED` setelah inspection completed

---

# 4. Use Case — Finalize Inspection Acceptance

## Status

PROPOSED FOR FUTURE STEP IMPLEMENTATION

---

## Tujuan

Mengevaluasi hasil inspection yang sudah `COMPLETED`, memastikan seluruh kewajiban quantity telah resolved, lalu menjalankan receive final ke inventory untuk accepted quantity dan menandai `PurchaseOrder` sebagai `RECEIVED`.

Use case ini adalah satu-satunya entry point final receive dalam Inspection Flow Mode.

---

## Actor

- `WAREHOUSE`
- `ADMIN`

---

## Preconditions

- `ReceivingInspection` ada.
- `ReceivingInspection` berstatus `COMPLETED`.
- `PurchaseOrder` terkait masih `CREATED`.
- Tidak ada item dalam status unresolved.
- Tidak ada quantity dalam quarantine.
- Tidak ada rejected pending decision.
- Semua non-accepted quantity sudah resolved melalui supplier return resmi atau disposal resmi jika fitur disposal aktif.

### Resolved Quantity Verification Rule (Critical)

`resolvedNonAccepted` tidak boleh dihitung secara implisit atau asumsi.

Aturan:

- `resolvedNonAccepted` harus diverifikasi melalui sumber data resmi:
  - supplier return yang sudah tercatat secara eksplisit
  - disposal record jika fitur disposal diaktifkan

- Verifikasi harus berbasis data, bukan perhitungan lokal dari inspection.

- Setiap quantity non-accepted harus dapat ditelusuri ke:
  - record supplier return
  - atau record disposal resmi

Larangan:

- tidak boleh menganggap quarantined sebagai resolved
- tidak boleh menganggap rejected pending decision sebagai resolved
- tidak boleh menghitung resolvedNonAccepted tanpa referensi data persistence

Konsekuensi:

- Jika tidak ditemukan record pendukung:
  - Final Acceptance wajib ditolak
  - Error: `FINAL_ACCEPTANCE_RESOLUTION_NOT_VERIFIED`

---

## Input DTO

```ts
export type FinalizeInspectionAcceptanceInput = {
  receivingInspectionId: string;
  finalizedAt: Date;
  actor: {
    actorId: string;
    role: "WAREHOUSE" | "ADMIN";
  };
};
```

---

## Output DTO

```ts
export type FinalizeInspectionAcceptanceResult = {
  receivingInspectionId: string;
  purchaseOrderId: string;
  purchaseOrderStatus: "RECEIVED";
  acceptedItems: Array<{
    purchaseItemId: string;
    variantId: string;
    acceptedQuantity: number;
  }>;
  finalizedAt: Date;
  finalizedBy: string;
};
```

---

## Main Flow

1. Application layer menerima request dan actor.
2. Authorization guard memverifikasi actor `WAREHOUSE` atau `ADMIN`.
3. Use case memuat `ReceivingInspection`.
4. Use case memverifikasi inspection berstatus `COMPLETED`.
5. Use case memuat `PurchaseOrder` terkait.
6. Use case memverifikasi `PurchaseOrder` masih `CREATED`.
7. Use case menghitung:
   - accepted quantity
   - resolved non-accepted quantity
   - unresolved quantity
8. Use case memverifikasi:
   - `totalQuantity = accepted + resolvedNonAccepted`
   - quarantine tidak ada
   - rejected pending decision tidak ada
   - semua non-accepted sudah resolved secara resmi
9. Use case mengirim hanya accepted quantity ke boundary inventory resmi.
10. Use case menandai `PurchaseOrder` sebagai `RECEIVED` melalui orchestration resmi.
11. Use case menyimpan perubahan yang diperlukan.
12. Use case mengembalikan hasil final acceptance.

---

## Rejection Flow

### A1. Inspection tidak ditemukan

- Use case ditolak.
- Error: `RECEIVING_INSPECTION_NOT_FOUND`.

### A2. Inspection belum `COMPLETED`

- Use case ditolak.
- Error: `RECEIVING_INSPECTION_NOT_COMPLETED`.

### A3. Purchase order tidak valid untuk final acceptance

- Use case ditolak.
- Error: `PURCHASE_ORDER_NOT_FINALIZABLE`.

### A4. Masih ada quarantine quantity

- Use case ditolak.
- Error: `FINAL_ACCEPTANCE_BLOCKED_BY_QUARANTINE`.

### A5. Masih ada rejected pending decision

- Use case ditolak.
- Error: `FINAL_ACCEPTANCE_BLOCKED_BY_PENDING_REJECTION`.

### A6. Quantity belum resolved

- Use case ditolak.
- Error: `FINAL_ACCEPTANCE_QUANTITY_UNRESOLVED`.

### A7. Inventory mutation gagal

- Use case gagal.
- `PurchaseOrder` tidak boleh ditandai `RECEIVED` jika inventory mutation gagal.
- Error mengikuti contract inventory/application error.

### A8. Actor tidak berwenang

- Use case ditolak.
- Error: `FORBIDDEN`.

---

## Postconditions

Jika berhasil:

- accepted quantity masuk inventory melalui boundary resmi
- `PurchaseOrder` berstatus `RECEIVED`
- quarantine tidak ada untuk PO tersebut
- rejected pending decision tidak ada
- payable belum berubah karena final acceptance bukan payment dan bukan return reduction

Jika gagal:

- tidak boleh ada status PO `RECEIVED` tanpa inventory mutation sukses
- tidak boleh ada payable mutation
- tidak boleh ada direct inventory mutation dari delivery/UI

---

### Atomicity Rule (Critical)

Final Acceptance harus bersifat atomic pada level application orchestration.

Aturan:

- Inventory mutation dan perubahan status `PurchaseOrder` menjadi `RECEIVED` harus terjadi dalam satu unit of work.
- Jika salah satu gagal:
  - seluruh proses harus dianggap gagal
  - tidak boleh ada partial state

Konsekuensi:

- Tidak boleh terjadi kondisi:
  - inventory berubah tetapi `PurchaseOrder` tidak `RECEIVED`
  - `PurchaseOrder` menjadi `RECEIVED` tetapi inventory tidak berubah
- Implementasi wajib menggunakan transaction boundary atau mekanisme setara untuk menjamin konsistensi

---

## Invariants

- Final Acceptance adalah satu-satunya entry point final receive dalam Inspection Flow Mode.
- Accepted quantity adalah satu-satunya quantity yang boleh masuk inventory.
- Quarantine bukan resolved state.
- Rejected pending decision bukan resolved state.
- Payable tidak berubah karena Final Acceptance.
- Final Acceptance tidak boleh bypass Procurement → Inventory boundary.

---

## Repository / Port yang Diperbolehkan

- `ReceivingInspectionRepository`
- `PurchaseOrderRepository`
- Inventory procurement boundary resmi
- Supplier return / disposal query hanya untuk memverifikasi resolved non-accepted quantity

Use case ini tidak boleh:

- dipanggil implisit dari UI tanpa application orchestration
- memanggil `InventoryRepository` langsung dari Procurement domain
- mengurangi payable
- membuat supplier payment
- membuat supplier return otomatis

---

## Testing Focus

### Application Test

- final acceptance berhasil saat semua quantity resolved
- ditolak jika inspection belum `COMPLETED`
- ditolak jika masih ada quarantine
- ditolak jika masih ada rejected pending decision
- ditolak jika non-accepted belum resolved
- actor selain `WAREHOUSE` atau `ADMIN` ditolak

### Integration Test Bernilai Tinggi

- accepted quantity masuk inventory dan PO menjadi `RECEIVED`
- inventory gagal → PO tidak menjadi `RECEIVED`
- final acceptance tidak mengubah payable
- direct receive ditolak dalam Inspection Flow Mode

### Architecture / Boundary Test

- domain inspection tidak mengimpor inventory repository
- application orchestration menjadi satu-satunya penghubung Procurement → Inventory

---

# Final Notes

Use case ini tidak menggantikan Step 6 Direct Receive Mode.

Use case ini hanya aktif jika Inspection Flow Mode diaktifkan secara eksplisit.

USE CASE SPEC = FINAL, CONSISTENT, IMPLEMENTATION-READY (future step)

Semua implementasi wajib tunduk pada:

- ADR-0021 — Receiving Inspection Flow
- Procurement Domain
- Inventory Domain
- DDD Boundary Policy
- Testing Strategy
