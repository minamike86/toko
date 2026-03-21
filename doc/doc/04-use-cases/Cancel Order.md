# Cancel Order (Use Case)

Dokumen ini mendefinisikan use case **Cancel Order**, yaitu proses pembatalan transaksi penjualan yang sudah dibuat, baik sebelum maupun setelah pembayaran, termasuk penanganan konsekuensi terhadap stok.

---

## Tujuan Use Case

Cancel Order bertujuan untuk:

* Membatalkan transaksi penjualan secara sah
* Menjaga konsistensi histori transaksi
* Menangani pengembalian stok jika diperlukan

---

## Aktor

* Kasir / Operator Penjualan
* Admin

---

## Prasyarat

* Order sudah dibuat di Sales Domain

---

## Alur Utama – Cancel sebelum dibayar

1. Aktor memilih order dengan status `CREATED`
2. Sistem memvalidasi status order
3. Sistem mengubah status order menjadi `CANCELED`
4. Tidak ada perubahan stok

---

## Alur Utama – Cancel setelah dibayar atau hutang

1. Aktor memilih order dengan status `PAID` atau `ON_CREDIT`
2. Sistem memvalidasi bahwa order dapat dibatalkan
3. Sistem mengubah status order menjadi `CANCELED`
4. Application layer meminta Inventory untuk menambahkan kembali stok
5. Inventory mencatat Stock Movement (IN)

---

## Aturan Bisnis

* Order dengan status `CANCELED` tidak dapat diproses ulang
* Cancel setelah stok berkurang **wajib** mengembalikan stok

---

## Catatan Penutup

Pembatalan order adalah koreksi bisnis, bukan penghapusan histori.
