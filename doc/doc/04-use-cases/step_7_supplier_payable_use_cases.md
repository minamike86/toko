# Step 7 — Final Use Cases

Dokumen ini berisi 3 use case final untuk Step 7:

- Record Supplier Payment
- Get Supplier Outstanding
- Handle Purchase Return (Reduce Payable)

Dokumen ini harus dibaca bersama:

- Procurement Domain
- ADR-0020 — Supplier Payable & Payment Handling
- architecture_overview.md
- DDD Boundaries.md
- Testing Strategy.md
- Unit Test Guidelines.md
- testing_boundary_integration_policy.md

---

# Use Case — Record Supplier Payment

## Status

PROPOSED FOR STEP 7 IMPLEMENTATION

---

## Tujuan

Mencatat pembayaran ke supplier untuk purchase order yang sudah diterima, baik penuh maupun parsial, tanpa mengubah histori procurement dan tanpa menyentuh inventory.

---

## Outcome

Sistem berhasil:

- mencatat satu histori payment baru
- mempertahankan histori payment lama tetap immutable
- menurunkan outstanding secara derived
- menolak pembayaran yang melanggar invariant domain

---

## Actor

- Admin

Catatan:

Authorization wajib berada di application layer sebelum use case dijalankan.

---

## Precondition

- Purchase order ada
- Purchase order berstatus `RECEIVED`
- Supplier terkait ada dan valid
- Amount payment valid
- Outstanding masih lebih besar dari nol

---

## Trigger

Admin mencatat pembayaran ke supplier untuk purchase order tertentu.

---

## Input DTO

```ts
export type RecordSupplierPaymentInput = {
  purchaseOrderId: string;
  amount: number;
  paidAt: Date;
  notes: string | null;
  actor: {
    actorId: string;
    role: "ADMIN";
  };
};
```

---

## Output DTO

```ts
export type RecordSupplierPaymentResult = {
  purchaseOrderId: string;
  supplierId: string;
  paidAmount: number;
  payableInitial: number;
  totalPaid: number;
  totalReturned: number;
  outstanding: number;
  paymentId: string;
  paidAt: Date;
};
```

---

## Main Flow

1. Application layer menerima request dan actor.
2. Authorization guard memverifikasi actor `ADMIN`.
3. Use case memuat aggregate/data procurement yang diperlukan.
4. Sistem memverifikasi purchase order ada.
5. Sistem memverifikasi purchase order berstatus `RECEIVED`.
6. Sistem menghitung outstanding saat ini secara derived dari:
   - `totalCost` purchase order
   - total histori payment
   - total histori return reduction
7. Sistem memverifikasi `amount > 0`.
8. Sistem memverifikasi `amount <= outstanding`.
9. Sistem membuat histori payment baru (append-only).
10. Sistem menyimpan histori payment.
11. Sistem menghitung ulang outstanding secara derived.
12. Sistem mengembalikan hasil payment beserta outstanding terbaru.

---

## Alternative / Rejection Flow

### A1. Purchase order tidak ditemukan

- Use case ditolak
- Tidak ada histori payment dibuat
- Error: `PURCHASE_ORDER_NOT_FOUND`

### A2. Purchase order belum `RECEIVED`

- Use case ditolak
- Error: `PURCHASE_ORDER_NOT_RECEIVED`

### A3. Amount tidak valid

- Amount nol atau negatif
- Use case ditolak
- Error: `INVALID_SUPPLIER_PAYMENT_AMOUNT`

### A4. Payment melebihi outstanding

- Use case ditolak
- Tidak ada histori payment dibuat
- Error: `SUPPLIER_PAYMENT_EXCEEDS_OUTSTANDING`

### A5. Outstanding sudah nol

- Use case ditolak
- Error: `SUPPLIER_PAYMENT_EXCEEDS_OUTSTANDING`

---

## Postcondition

- Histori payment baru tercatat
- Histori payment lama tidak berubah
- Inventory tidak berubah
- Outstanding turun secara derived

---

## Invariant yang Harus Dijaga

- Payment hanya untuk purchase order `RECEIVED`
- Payment amount harus positif
- Total payment tidak boleh melebihi outstanding
- Histori payment immutable
- Payment bukan inventory mutation
- Outstanding tidak boleh negatif

---

## Repository / Port yang Diperbolehkan

- `PurchaseOrderRepository`
- `SupplierPaymentRepository`
- query/read model procurement payable yang relevan untuk agregasi outstanding

Use case ini tidak boleh:

- memanggil inventory mutation
- mengubah `PurchaseOrder.status`
- mengedit histori payment yang sudah ada

---

## Error Contract

Minimal:

- `PURCHASE_ORDER_NOT_FOUND`
- `PURCHASE_ORDER_NOT_RECEIVED`
- `INVALID_SUPPLIER_PAYMENT_AMOUNT`
- `SUPPLIER_PAYMENT_EXCEEDS_OUTSTANDING`
- `FORBIDDEN`

---

## Testing Focus

### Domain / invariant oriented

- payment amount harus positif
- payment tidak boleh melebihi outstanding
- outstanding tidak boleh negatif
- histori payment immutable

### Application / orchestration oriented

- actor non-admin ditolak
- purchase order non-received ditolak
- payment berhasil tercatat dan outstanding turun secara derived

### Integration bernilai tinggi

- partial payment berulang tetap konsisten
- dua payment berurutan menghasilkan outstanding yang benar

---

## Boundary Notes

- Use case ini tidak menyentuh inventory
- Use case ini tidak membuat accounting journal
- Outstanding harus diperlakukan sebagai derived value, bukan field mutable

---

# Use Case — Get Supplier Outstanding

## Status

PROPOSED FOR STEP 7 IMPLEMENTATION

---

## Tujuan

Menyediakan total hutang supplier dan rincian purchase order yang masih memiliki outstanding, secara read-only.

---

## Outcome

Sistem berhasil mengembalikan posisi outstanding supplier berdasarkan histori procurement, payment, dan return reduction tanpa mengubah data apa pun.

---

## Actor

- Admin

---

## Precondition

- Supplier ada
- Supplier valid untuk dibaca

---

## Trigger

Admin membuka detail outstanding supplier.

---

## Input DTO

```ts
export type GetSupplierOutstandingInput = {
  supplierId: string;
  actor: {
    actorId: string;
    role: "ADMIN";
  };
};
```

---

## Output DTO

```ts
export type GetSupplierOutstandingResult = {
  supplierId: string;
  supplierStoreName: string;
  totalOutstanding: number;
  purchaseOrders: Array<{
    purchaseOrderId: string;
    receivedAt: Date;
    payableInitial: number;
    totalPaid: number;
    totalReturned: number;
    outstanding: number;
  }>;
};
```

---

## Main Flow

1. Application layer menerima request dan actor.
2. Authorization guard memverifikasi actor `ADMIN`.
3. Sistem memverifikasi supplier ada.
4. Sistem mengambil semua purchase order supplier yang relevan.
5. Sistem hanya mempertimbangkan purchase order `RECEIVED`.
6. Sistem menghitung outstanding per purchase order secara derived dari:
   - total cost
   - total payment
   - total return reduction
7. Sistem mengecualikan purchase order dengan outstanding nol dari daftar aktif, kecuali desain reporting internal memerlukan tampil semua.
8. Sistem menjumlahkan total outstanding supplier.
9. Sistem mengembalikan hasil tanpa side effect.

---

## Alternative / Rejection Flow

### A1. Supplier tidak ditemukan

- Use case ditolak
- Error: `SUPPLIER_NOT_FOUND`

### A2. Actor tidak valid

- Use case ditolak
- Error: `FORBIDDEN`

---

## Postcondition

- Tidak ada write
- Tidak ada perubahan histori procurement
- Tidak ada perubahan payment
- Tidak ada perubahan inventory

---

## Invariant yang Harus Dijaga

- Read-only
- Outstanding dihitung secara derived
- Purchase order yang belum `RECEIVED` tidak membentuk payable
- Total outstanding supplier tidak boleh negatif

---

## Repository / Query yang Diperbolehkan

- read model / query procurement outstanding
- repository/query yang membaca purchase order, payment history, dan return history

Use case ini tidak boleh:

- membuat payment
- membuat return reduction
- mengubah purchase order
- memanggil inventory mutation

---

## Error Contract

Minimal:

- `SUPPLIER_NOT_FOUND`
- `FORBIDDEN`

---

## Testing Focus

### Application / read-only

- supplier tidak ditemukan ditolak
- hasil total outstanding benar
- tidak ada side effect

### Integration bernilai tinggi

- satu supplier dengan banyak purchase order
- outstanding campuran: unpaid, partially paid, fully paid
- outstanding tetap konsisten setelah payment dan return reduction

---

## Boundary Notes

- Use case ini bersifat read-only
- Tidak menjadikan reporting sebagai pseudo-domain
- Tidak melakukan mutation apa pun

---

# Use Case — Handle Purchase Return (Reduce Payable)

## Status

PROPOSED FOR STEP 7 IMPLEMENTATION

---

## Tujuan

Mencatat return pembelian yang sah untuk purchase order yang sudah diterima sehingga outstanding hutang berkurang secara derived, tanpa mengubah histori payment.

---

## Outcome

Sistem berhasil:

- mencatat histori return reduction baru
- menurunkan outstanding secara derived
- menjaga pemisahan tegas antara payment dan return
- tidak mengubah histori payment

---

## Actor

- Admin

---

## Precondition

- Purchase order ada
- Purchase order berstatus `RECEIVED`
- Return reduction valid dan masih dalam batas yang sah
- Jika ada efek inventory reversal, itu harus melalui boundary resmi yang eksplisit

---

## Trigger

Admin mencatat pengembalian barang ke supplier yang mengurangi hutang pembelian.

---

## Input DTO

```ts
export type HandlePurchaseReturnInput = {
  purchaseOrderId: string;
  returnItems: Array<{
    purchaseItemId: string;
    quantity: number;
    reason: string | null;
  }>;
  returnedAt: Date;
  notes: string | null;
  actor: {
    actorId: string;
    role: "ADMIN";
  };
};
```

---

## Output DTO

```ts
export type HandlePurchaseReturnResult = {
  purchaseOrderId: string;
  supplierId: string;
  returnId: string;
  reducedAmount: number;
  payableInitial: number;
  totalPaid: number;
  totalReturned: number;
  outstanding: number;
  returnedAt: Date;
};
```

---

## Main Flow

1. Application layer menerima request dan actor.
2. Authorization guard memverifikasi actor `ADMIN`.
3. Sistem memverifikasi purchase order ada.
4. Sistem memverifikasi purchase order berstatus `RECEIVED`.
5. Sistem memverifikasi seluruh return item valid terhadap purchase order.
6. Sistem memverifikasi quantity return valid.
7. Sistem menghitung nilai return reduction berdasarkan item yang dikembalikan.
8. Sistem memverifikasi return reduction tidak melebihi nilai yang sah untuk dikurangi.
9. Sistem memverifikasi outstanding akhir tidak negatif.
10. Sistem membuat histori return reduction baru.
11. Sistem menyimpan histori return reduction.
12. Outstanding berkurang secara derived dari histori return yang baru ditambahkan.
13. Sistem mengembalikan hasil reduction.

---

## Alternative / Rejection Flow

### A1. Purchase order tidak ditemukan

- Use case ditolak
- Error: `PURCHASE_ORDER_NOT_FOUND`

### A2. Purchase order belum `RECEIVED`

- Use case ditolak
- Error: `PURCHASE_ORDER_NOT_RECEIVED`

### A3. Return item tidak valid

- Use case ditolak
- Error: `PURCHASE_RETURN_ITEM_INVALID`

### A4. Return reduction melebihi batas yang sah

- Use case ditolak
- Error: `PURCHASE_RETURN_EXCEEDS_ALLOWED_REDUCTION`

### A5. Return reduction menyebabkan outstanding negatif

- Use case ditolak
- Error: `PURCHASE_RETURN_REDUCTION_EXCEEDS_OUTSTANDING`

---

## Postcondition

- Histori return reduction baru tercatat
- Histori payment tetap tidak berubah
- Outstanding turun secara derived
- Purchase order tidak berubah status

---

## Invariant yang Harus Dijaga

- Return reduction bukan payment
- Return reduction tidak boleh melebihi batas yang sah
- Return reduction tidak boleh membuat outstanding negatif
- Histori return immutable
- Histori payment tidak berubah

---

## Repository / Port yang Diperbolehkan

- `PurchaseOrderRepository`
- `PurchaseReturnRepository` / repository histori return yang setara
- boundary inventory reversal resmi jika dan hanya jika desain Step 7 mengaktifkan reversal inventory

Use case ini tidak boleh:

- menyamarkan return sebagai payment
- mengubah histori payment
- mengubah purchase order menjadi `CANCELED`

---

## Error Contract

Minimal:

- `PURCHASE_ORDER_NOT_FOUND`
- `PURCHASE_ORDER_NOT_RECEIVED`
- `PURCHASE_RETURN_ITEM_INVALID`
- `PURCHASE_RETURN_EXCEEDS_ALLOWED_REDUCTION`
- `PURCHASE_RETURN_REDUCTION_EXCEEDS_OUTSTANDING`
- `FORBIDDEN`

---

## Testing Focus

### Domain / invariant oriented

- return bukan payment
- return reduction tidak boleh membuat outstanding negatif
- histori return immutable

### Application / orchestration oriented

- actor non-admin ditolak
- PO non-received ditolak
- item return invalid ditolak
- histori return tercatat dan outstanding turun secara derived

### Integration bernilai tinggi

- payment lalu return lalu outstanding tetap benar
- beberapa return reduction pada PO yang sama tetap konsisten
- jika inventory reversal diaktifkan, boundary resmi tetap dipakai dan tidak dibypass

---

## Boundary Notes

- Return reduction adalah concern procurement payable, bukan payment
- Inventory reversal tidak boleh diasumsikan otomatis di domain
- Jika inventory reversal ikut scope implementasi, ia harus melalui use case/port resmi yang eksplisit

---

## Penutup

Ketiga use case ini adalah entry point resmi perilaku Step 7.

Implementasi, wiring, dan testing wajib tunduk pada:

- Procurement Domain
- ADR-0020
- boundary DDD proyek
- Testing Strategy

