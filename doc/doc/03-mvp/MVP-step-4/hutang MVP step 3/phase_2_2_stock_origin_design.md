# Phase 2.2 – Stock Origin Design

## Status
DESIGN – SUPERSEDED (See Revised Version)

> ⚠ This document represents the original Phase 2.2 design.
> It has been superseded by the revised version that is compatible
> with Product Variant activation (Step 4.3).
>
> The updated and future-proof version is:
> `phase_2_2_stock_origin_design_revised.md`
>
> This file is kept for historical traceability and architectural evolution.
> Do not implement new features based on this version.


---

## Latar Belakang Masalah

Dalam operasional toko nyata, stok tidak pernah homogen. Barang dapat masuk ke gudang dari berbagai sumber:

- pembelian supplier
- stok awal saat sistem mulai digunakan
- koreksi hasil stock opname
- barang lama tanpa histori yang jelas (nota hilang, pindahan gudang)

Jika seluruh stok diperlakukan sama tanpa mencatat asal-usulnya:
- laporan margin menjadi menyesatkan
- shrinkage tidak dapat dilacak
- audit internal sulit dilakukan

Stock Origin diperkenalkan untuk **mencatat kejujuran data**, bukan untuk optimasi finansial.

---

## Tujuan Phase 2.2

- Mencatat asal-usul setiap penambahan stok secara eksplisit
- Menyediakan histori pergerakan stok yang dapat diaudit
- Menyiapkan fondasi reporting stok yang jujur di Phase berikutnya

Phase ini **tidak bertujuan** untuk menghitung costing, margin, atau valuasi inventory.

---

## Prinsip Desain

1. Stock Origin **bukan inventory baru**
2. Stock Origin **immutable** (tidak boleh diubah setelah dicatat)
3. Stock Origin dicatat **saat stok masuk**, bukan saat dijual atau dilaporkan
4. Koreksi dilakukan dengan **movement baru**, bukan mengedit histori

Prinsip-prinsip ini bersifat keras dan tidak dapat dinegosiasikan.

---

## Lokasi Pencatatan Stock Origin

Stock Origin **dicatat pada level Stock Movement**, bukan pada InventoryItem.

Artinya:
- Inventory adalah hasil agregasi movement
- Setiap movement yang menambah stok memiliki satu origin
- Stok dengan origin berbeda tidak dicampur secara historis

Pendekatan ini lebih verbose, tetapi mencerminkan realitas operasional dengan benar.

---

## Klasifikasi Stock Origin

Pada Phase 2.2, klasifikasi origin dibatasi pada kategori minimal berikut:

- `INITIAL_STOCK`
  - stok awal saat sistem mulai digunakan

- `PROCUREMENT`
  - pembelian barang dari supplier

- `ADJUSTMENT`
  - koreksi manual akibat stock opname atau kesalahan pencatatan

- `UNKNOWN`
  - barang yang tidak memiliki histori asal yang jelas

Keberadaan `UNKNOWN` bersifat **disengaja** untuk mencegah pemalsuan data asal stok.

---

## Model Konseptual

Secara konseptual, Stock Movement memiliki struktur berikut:

```ts
StockMovement {
  id
  productId
  quantity
  movementType   // IN / OUT
  origin         // INITIAL_STOCK | PROCUREMENT | ADJUSTMENT | UNKNOWN
  occurredAt
}
```
movementType menjelaskan arah pergerakan stok, sedangkan origin menjelaskan alasan bisnis kenapa stok tersebut ada.

---
Stock Origin **tidak berdiri sendiri** dan **tidak memiliki lifecycle terpisah** dari Stock Movement.

---

## Interaksi dengan Product Variant

Stock Origin **tidak bergantung** pada Product Variant.

Jika Product Variant ada:
- movement tetap dicatat per product
- variant diperlakukan sebagai atribut barang, bukan penentu origin

Integrasi keduanya **baru dilakukan di reporting**, bukan di domain operasional.

---

## Non-Goals (Sengaja Ditunda)

Phase 2.2 **TIDAK mencakup**:

- costing per origin
- FIFO / LIFO
- margin calculation
- supplier detail
- retur kompleks
- inventory per variant

Seluruh poin di atas ditunda ke Phase berikutnya jika diperlukan.

---

## Dampak ke Phase Selanjutnya

Dengan desain ini, sistem memungkinkan:

- pelaporan stok berdasarkan asal
- identifikasi shrinkage dan adjustment
- evolusi bertahap ke costing dan procurement

Tanpa perlu memodifikasi data historis yang sudah tercatat.

---

## Penutup

Phase 2.2 Stock Origin berfokus pada **kejujuran histori stok**, bukan optimasi.

Pendekatan ini dipilih untuk mencerminkan realitas operasional gudang dan menjaga integritas data jangka panjang.

