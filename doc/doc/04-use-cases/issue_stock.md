# Issue Stock (Use Case)

**Status:** DESIGN FINAL – MVP Step 1 (Core Transaction)  
**Domain:** Inventory  
**Type:** Mutating Use Case

---

## 1. Tujuan Use Case

Issue Stock bertujuan untuk:

- Mengurangi stok suatu produk secara sah
- Memastikan stok mencukupi sebelum dikurangi
- Mencatat pergerakan stok keluar sebagai fakta domain
- Menjaga konsistensi snapshot dan histori movement

Use case ini digunakan ketika terjadi kejadian bisnis yang menyebabkan stok keluar, seperti penjualan.

---

## 2. Posisi dalam Arsitektur

Lokasi implementasi:

```
src/modules/inventory/application/IssueStock.ts
```

Layer:

- Application layer
- Menggunakan `InventoryRepository`
- Menghasilkan `StockMovement` bertipe `OUT`

IssueStock adalah boundary eksplisit Inventory Domain, bukan helper teknis.

---

## 3. Aktor

IssueStock tidak dipanggil langsung oleh user interface.

Aktor sebenarnya adalah:

- Application layer dari use case lain (misalnya `CreateOrder`)
- Sistem internal yang membutuhkan pengurangan stok

Dalam konteks bisnis, kasir memicu IssueStock melalui CreateOrder.

---

## 4. Input Contract

```ts
export type IssueStockRequest = {
  productId: string;
  quantity: number;
  reason: string;
  referenceId?: string;
};
```

Aturan:

- `productId` wajib
- `quantity` wajib dan > 0
- `reason` wajib
- `referenceId` opsional (untuk korelasi ke Order atau entitas lain)

---

## 5. Prasyarat

Sebelum stok dikurangi:

- Product harus ada
- InventoryItem harus ada
- Stok harus mencukupi

Jika stok tidak mencukupi, use case wajib gagal.

---

## 6. Alur Utama

1. Application layer menerima request pengurangan stok
2. Sistem mencari `InventoryItem`
3. Sistem memvalidasi bahwa stok mencukupi
4. Sistem memanggil repository untuk `decrease`
5. Sistem membuat `StockMovement` dengan:
   - type: `OUT`
   - quantity: positif
   - reason: sesuai input
6. Sistem menyimpan movement

---

## 7. Error Handling

### 7.1 Inventory Tidak Ditemukan

- Error: `NotFoundError` atau domain error setara
- Tidak ada perubahan stok

### 7.2 Stok Tidak Mencukupi

- Error: `InsufficientStockError`
- Tidak ada perubahan stok
- Tidak ada movement tercatat

### 7.3 Quantity Tidak Valid

- Error: `DomainError`
- Quantity harus > 0

Semua error bersifat eksplisit dan tidak menggunakan generic `Error`.

---

## 8. Aturan Bisnis

1. Quantity harus bernilai positif
2. Tidak boleh mengurangi stok jika stok tidak mencukupi
3. Setiap pengurangan stok wajib menghasilkan `StockMovement` type `OUT`
4. Tidak ada pengurangan stok tanpa movement

---

## 9. Dampak terhadap Domain

### Inventory Domain

- Snapshot quantity berkurang
- Movement type `OUT` tercatat

### Sales Domain

- Tidak terpengaruh langsung
- Biasanya IssueStock dipanggil oleh CreateOrder

### Catalog Domain

- Tidak terpengaruh

---

## 10. Hubungan dengan Create Order

Pada alur Create Order:

- Setelah order berstatus `PAID` atau `ON_CREDIT`
- Application layer memanggil IssueStock
- Jika IssueStock gagal (stok tidak cukup), order tidak boleh diselesaikan

IssueStock adalah penegak kebenaran stok dalam alur penjualan.

---

## 11. Atomicity Note (MVP Step 1 Limitation)

Saat ini implementasi IssueStock melakukan:

```
decrease()
saveMovement()
```

Secara desain, atomicity belum dijamin di level domain.

Hal ini diterima sebagai trade-off MVP Step 1 dan akan direview pada:

> MVP Step 4 – Inventory Consistency Stabilization

Use case ini tidak melakukan transaksi eksplisit di level application.

---

## 12. Non-Goals

IssueStock tidak mencakup:

- Multi-gudang
- Costing
- Batch tracking
- Serial number tracking
- Partial reservation

Semua fitur tersebut berada di luar scope MVP Step 1.

---

## 13. Testing Guidelines

Minimal skenario test:

1. Berhasil mengurangi stok ketika stok mencukupi
2. Gagal jika stok tidak mencukupi
3. Movement `OUT` tercatat dengan quantity positif
4. Tidak ada movement jika terjadi error

Testing dilakukan pada application layer dengan repository di-mock untuk unit test dan menggunakan repository nyata untuk integration test.

---

## Catatan Penutup

IssueStock adalah use case fundamental dalam menjaga kejujuran Inventory Domain.

Walaupun tidak dipanggil langsung oleh UI, use case ini adalah penjaga konsistensi stok dan fondasi bagi seluruh alur penjualan.

