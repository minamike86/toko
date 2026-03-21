# Pay Credit (Use Case)

## Status

Draft – MVP Step 2

---

## Tujuan Use Case

Use case **Pay Credit** bertujuan untuk menyelesaikan transaksi penjualan yang sebelumnya dilakukan secara hutang (credit).

Use case ini:

* Mengubah status order dari `ON_CREDIT` menjadi `PAID`
* Menandai bahwa kewajiban pembayaran telah diselesaikan
* Menutup siklus hidup finansial sebuah order
* Pay Credit tidak mengubah item, harga snapshot, atau total order.”

Use case ini **tidak** memperkenalkan model piutang lanjutan dan **tidak** mengubah perilaku bisnis pada MVP Step 1.

---

## Posisi dalam MVP

* MVP Step 1: Order dapat berada pada status `ON_CREDIT`
* MVP Step 2: Order `ON_CREDIT` **harus dapat diselesaikan** secara eksplisit

Pay Credit adalah **perilaku tambahan (additive)** untuk melengkapi alur bisnis yang sudah ada.

Use case ini **NON-BREAKING** terhadap seluruh kontrak MVP Step 1.

---

## Aktor

* Kasir
* Admin

Aktor merepresentasikan pengguna sistem yang berwenang menerima pembayaran dari pelanggan.

---

## Prasyarat

Use case ini hanya dapat dijalankan jika:

* Order sudah ada di Sales Domain
* Order berstatus `ON_CREDIT`
* Order belum dibatalkan

Order dengan status lain (`CREATED`, `PAID`, `CANCELED`) **tidak valid** untuk use case ini.

---

## Data yang Digunakan

Dari Sales Domain:

* Order
* Status Order
* Outstanding Amount

Tidak ada data dari Inventory Domain.

---

## Alur Utama

1. Aktor memilih order dengan status `ON_CREDIT`
2. Sistem memvalidasi status order
3. Sistem menerima konfirmasi pembayaran penuh
4. Sistem mengubah status order menjadi `PAID`
5. Outstanding amount diubah menjadi nol
6. Sistem mencatat aktivitas sebagai penyelesaian transaksi

---

## Alur Alternatif

### Order Tidak Berstatus ON_CREDIT

* Sistem menolak proses
* Sistem mengembalikan error bermakna bisnis
* Tidak ada perubahan data

### Order Sudah Dibatalkan

* Sistem menolak proses
* Sistem mengembalikan error bermakna bisnis
* Tidak ada perubahan data

---

## Aturan Bisnis

1. Hanya order dengan status `ON_CREDIT` yang dapat dilunasi
2. Pelunasan selalu bersifat penuh (tidak ada cicilan)
3. Setelah pelunasan:

   * status order menjadi `PAID`
   * outstanding amount bernilai nol
4. Order yang sudah `PAID` tidak dapat diproses ulang

Aturan ini **tidak mengubah** aturan bisnis pada Step 1, hanya melengkapinya.

---

## Dampak ke Domain

### Sales Domain

* Status order berubah dari `ON_CREDIT` ke `PAID`
* Outstanding amount diselesaikan

### Inventory Domain

* Tidak terpengaruh
* Tidak ada perubahan stok

### Catalog Domain

* Tidak terpengaruh

---

## Error Handling (Ringkas)

Use case ini **wajib** menghasilkan error bermakna bisnis, misalnya:

* OrderNotFound
* OrderNotOnCredit
* OrderAlreadyPaid
* OrderAlreadyCanceled

Detail klasifikasi error mengikuti:

* `error-handling-guidelines.md`

---

## Yang Sengaja Tidak Ditangani

Use case ini **tidak** mencakup:

* Cicilan pembayaran
* Jatuh tempo hutang
* Denda atau bunga
* Metode pembayaran eksternal
* Rekonsiliasi keuangan

Kebutuhan tersebut akan diperkenalkan melalui domain lain pada fase berikutnya.

---

## Testing Guidelines

Minimal skenario test:

1. Melunasi order `ON_CREDIT` berhasil
2. Menolak pelunasan order non-credit
3. Menolak pelunasan order yang sudah dibatalkan

Test dilakukan pada application layer dengan repository di-mock.

---

## Catatan Penutup

Pay Credit adalah penutup alur hutang sederhana.
Use case ini menjaga kejujuran histori penjualan tanpa memaksakan kompleksitas accounting sebelum waktunya.
