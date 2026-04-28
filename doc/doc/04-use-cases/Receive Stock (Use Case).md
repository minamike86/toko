# Receive Stock (Use Case)

**Status:** DESIGN FINAL – MVP Step 1 (Core Transaction)
**Domain:** Inventory
**Type:** Mutating Use Case

---

## 1. Tujuan Use Case

Receive Stock bertujuan untuk:

* Menambahkan stok ke dalam sistem secara sah
* Mencatat pergerakan stok masuk sebagai fakta domain
* Menjaga konsistensi antara snapshot stok dan histori movement

Use case ini digunakan ketika terjadi kejadian bisnis yang menyebabkan stok bertambah.

---

## 2. Posisi dalam Arsitektur

Lokasi implementasi:

```
src/modules/inventory/application/ReceiveStock.ts
```

Layer:

* Application layer
* Menggunakan `InventoryRepository`
* Menghasilkan `StockMovement` bertipe `IN`

ReceiveStock adalah boundary eksplisit Inventory Domain, bukan helper teknis.

---

## 3. Aktor

ReceiveStock tidak dipanggil langsung oleh user interface.

Aktor sebenarnya adalah:

* Application layer dari use case lain
* Sistem internal yang membutuhkan penambahan stok

Dalam konteks bisnis, operator gudang atau sistem backend memicu ReceiveStock.

---

## 4. Input Contract

```ts
export type ReceiveStockRequest = {
  variantId: string;
  quantity: number;
  reason: string;
  referenceId?: string;
};
```

Aturan:

* `variantId` wajib
* `quantity` wajib dan > 0
* `reason` wajib
* `referenceId` opsional

---

## 5. Prasyarat

Sebelum stok ditambahkan:

* InventoryItem harus sudah ada
* Variant harus valid
* Quantity harus bernilai positif

Jika InventoryItem tidak ditemukan, use case wajib gagal.

---

## 6. Alur Utama

1. Application layer menerima request penambahan stok
2. Sistem mencari `InventoryItem` berdasarkan `variantId`
3. Sistem memvalidasi bahwa inventory tersedia
4. Sistem memanggil repository untuk `increase`
5. Sistem membuat `StockMovement` dengan:

   * type: `IN`
   * quantity: positif
   * reason: sesuai input
6. Sistem menyimpan movement

---

## 7. Error Handling

### 7.1 Inventory Tidak Ditemukan

* Error: error bermakna bisnis (misalnya `InventoryNotFound`)
* Tidak ada perubahan stok
* Tidak ada movement tercatat

### 7.2 Quantity Tidak Valid

* Error: domain error
* Quantity harus > 0

Catatan:
Implementasi saat ini masih menggunakan `Error` generik dan akan dirapikan pada tahap hardening.

---

## 8. Aturan Bisnis

1. Quantity harus bernilai positif
2. Setiap penambahan stok wajib menghasilkan `StockMovement` type `IN`
3. Tidak ada perubahan snapshot tanpa movement
4. Tidak ada movement tanpa perubahan snapshot

---

## 9. Dampak terhadap Domain

### Inventory Domain

* Snapshot quantity bertambah
* Movement type `IN` tercatat

### Sales Domain

* Tidak terpengaruh langsung

### Catalog Domain

* Tidak terpengaruh

---

## 10. Hubungan dengan Use Case Lain

ReceiveStock dapat digunakan oleh:

* proses operasional gudang
* sistem internal yang membutuhkan penambahan stok

ReceiveStock berbeda dengan:

* `AdjustStock` → digunakan untuk koreksi
* `InitializeStock` → digunakan untuk setup awal

---

## 11. Atomicity Note (MVP Step 1 Limitation)

Saat ini implementasi ReceiveStock melakukan:

```
increase()
saveMovement()
```

Atomicity belum dijamin di level domain.

Hal ini merupakan trade-off yang diterima pada MVP Step 1 dan akan divalidasi pada:

> MVP Step 4 – Inventory Consistency Stabilization

---

## 12. Catatan Konsistensi (Step 4.4)

Use case ini berkontribusi terhadap konsistensi antara:

* snapshot inventory (`InventoryItem`)
* histori pergerakan stok (`StockMovement`)

Namun:

* Use case ini **tidak bertanggung jawab** melakukan rekonsiliasi
* Validasi konsistensi dilakukan oleh mekanisme terpisah:
  **Inventory Consistency Checker (MVP Step 4.4)**

Prinsip penting:

* Tidak ada perubahan snapshot tanpa movement
* Tidak ada movement tanpa perubahan snapshot
* Konsistensi diverifikasi di luar use case ini

---

## 13. Referensi Evolusi

* MVP Step 4.4 – Inventory Consistency Stabilization
* inventory_reconciliation_spec_step_4_4.md

---

## Catatan Penutup

ReceiveStock adalah use case fundamental untuk mencatat stok masuk secara jujur.

Walaupun terlihat sederhana, use case ini berperan penting dalam menjaga integritas data inventory sebagai dasar seluruh operasi sistem.
