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

## Catatan Khusus Adjustment (Step 4.4)

Movement dengan type `ADJUST` dapat merepresentasikan:

* peningkatan stok, atau
* penurunan stok

Arah perubahan ditentukan oleh perubahan terhadap snapshot,
bukan oleh type movement itu sendiri.

Pada fase transisional:

* histori movement mungkin belum menyimpan arah secara eksplisit
* rekonsiliasi penuh terhadap movement ADJUST dapat memiliki keterbatasan

Keterbatasan ini:

* **tidak diselesaikan di use case ini**
* ditangani oleh Inventory Consistency Checker

---

## Catatan Konsistensi (Step 4.4)

* Use case ini berkontribusi terhadap konsistensi antara snapshot dan movement
* Validasi konsistensi dilakukan oleh mekanisme terpisah (Inventory Consistency Checker)
* Use case ini tidak bertanggung jawab melakukan rekonsiliasi
* Movement type ADJUST dapat merepresentasikan peningkatan atau penurunan stok
* Arah perubahan ditentukan oleh perubahan terhadap snapshot, bukan oleh type
* Pada fase transisional, rekonsiliasi penuh terhadap movement ADJUST mungkin memiliki keterbatasan
* Keterbatasan ini ditangani oleh Inventory Consistency Checker

---

## Referensi Evolusi

* MVP Step 4.4 – Inventory Consistency Stabilization
* inventory_reconciliation_spec_step_4_4.md

---

## Catatan Penutup

Adjust Stock adalah mekanisme korektif, bukan operasional rutin.

---
