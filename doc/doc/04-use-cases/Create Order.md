# Create Order (Use Case)

Dokumen ini mendefinisikan use case **Create Order**, yaitu proses pembuatan transaksi penjualan baik secara tunai (cash) maupun hutang (credit).

Use case ini merupakan titik temu utama antara **Catalog Domain**, **Inventory Domain**, dan **Sales Domain**, serta direalisasikan melalui application layer.

---

## Tujuan Use Case

Create Order bertujuan untuk:

* Mencatat kejadian penjualan secara konsisten
* Menentukan nilai transaksi pada saat penjualan terjadi
* Mengelola perbedaan alur antara penjualan tunai dan hutang
* Menjadi dasar bagi laporan penjualan dan pergerakan stok

---

## Ruang Lingkup

Use case ini mencakup:

* Pembuatan order
* Penentuan jenis transaksi (cash / credit)
* Perhitungan nilai transaksi
* Perubahan status order
* Permintaan perubahan stok ke Inventory

Use case ini **tidak** mencakup:

* Proses pembayaran eksternal
* Manajemen piutang detail
* Perhitungan pajak atau diskon lanjutan

---

## Aktor

* Kasir / Operator Penjualan

Aktor direpresentasikan sebagai user yang memiliki izin membuat transaksi.

---

## Prasyarat

* Product sudah terdaftar dan berstatus Active di Catalog Domain
* Stok awal telah diinisialisasi (jika produk memiliki stok)
* Sistem Inventory dapat memvalidasi ketersediaan stok

---

## Data yang Digunakan

Dari Catalog Domain (read-only):

* Product ID
* Product Name
* Satuan
* Base Price

Dari Sales Domain:

* Order
* Order Item

---

## Alur Utama – Penjualan Tunai (Cash)

1. Aktor memilih satu atau lebih product dan menentukan quantity
2. Sistem membaca data product dari Catalog
3. Sistem membentuk Order dan Order Item dengan snapshot data product
4. Sistem menghitung subtotal dan total amount
5. Order dibuat dengan status `CREATED`
6. Aktor menyelesaikan pembayaran tunai
7. Sistem mengubah status order menjadi `PAID`
8. Application layer meminta Inventory untuk mengurangi stok
9. Inventory memvalidasi stok dan mencatat Stock Movement (OUT)
10. Order dianggap selesai

---

## Alur Utama – Penjualan Hutang (Credit)

1. Aktor memilih satu atau lebih product dan menentukan quantity
2. Sistem membaca data product dari Catalog
3. Sistem membentuk Order dan Order Item dengan snapshot data product
4. Sistem menghitung subtotal dan total amount
5. Order dibuat dengan status `CREATED`
6. Aktor memilih metode hutang
7. Sistem mengubah status order menjadi `ON_CREDIT`
8. Outstanding amount diset sebesar total amount
9. Application layer meminta Inventory untuk mengurangi stok
10. Inventory memvalidasi stok dan mencatat Stock Movement (OUT)

---

## Alur Pelunasan Hutang (Ringkas)

1. Aktor menerima pembayaran dari pelanggan
2. Sistem mengubah status order dari `ON_CREDIT` menjadi `PAID`
3. Outstanding amount diubah menjadi nol

Catatan: detail pembayaran akan diperluas pada domain lain di fase berikutnya.

---

## Alur Alternatif

### Stok Tidak Mencukupi

* Inventory menolak permintaan pengurangan stok
* Sistem menandai order sebagai `FAILED` atau membatalkan order
* Tidak ada perubahan stok

### Produk Tidak Aktif

* Sistem menolak penambahan product ke order

---

## Aturan Bisnis

* Order harus memiliki minimal satu Order Item
* Quantity setiap item harus bernilai positif
* Snapshot data product bersifat immutable
* Stok hanya berubah setelah order berstatus `PAID` atau `ON_CREDIT`

---

## Dampak ke Domain

* Sales Domain:

  * Mencatat histori transaksi dan status

* Inventory Domain:

  * Mengurangi stok melalui Stock Movement

* Catalog Domain:

  * Tidak terpengaruh

---

## Prinsip Evolusi

* Pajak, diskon, dan metode pembayaran lanjutan ditambahkan sebagai ekstensi
* Manajemen piutang lanjutan diperkenalkan melalui domain terpisah
* Alur dasar Create Order tetap dipertahankan

---

## Catatan Penutup

Create Order adalah use case inti sistem. Kejelasan dan kejujuran alur ini lebih penting daripada optimasi atau fitur tambahan pada tahap awal.
