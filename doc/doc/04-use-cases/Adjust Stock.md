# Adjust Stock (Use Case)

Dokumen ini mendefinisikan use case **Adjust Stock**, yaitu proses penyesuaian stok akibat selisih fisik, kerusakan, atau koreksi pencatatan.

---

## Tujuan Use Case

Adjust Stock bertujuan untuk:

* Menyesuaikan stok agar sesuai kondisi fisik
* Menjaga kejujuran data Inventory
* Mencatat koreksi secara eksplisit

---

## Aktor

* Admin / Operator Gudang

---

## Prasyarat

* Product sudah terdaftar di Catalog Domain
* Stock sudah ada di Inventory

---

## Alur Utama

1. Aktor memilih product
2. Aktor memasukkan quantity penyesuaian
3. Aktor memasukkan alasan penyesuaian
4. Sistem mencatat Stock Movement dengan:

   * Type: ADJUST
   * Reason: deskriptif (misalnya `STOCK_OPNAME`, `DAMAGED_GOODS`)
5. Inventory menyesuaikan quantity stok

---

## Aturan Bisnis

* Adjust Stock hanya digunakan untuk koreksi
* Tidak digunakan untuk penjualan atau pembelian

---

## Catatan Penutup

Adjust Stock adalah mekanisme korektif, bukan operasional rutin.
