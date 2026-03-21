# Customer Aging Receivable – Reporting Design

Dokumen ini mendefinisikan desain laporan Aging Receivable per customer.

Dokumen ini berada pada layer Reporting dan tidak menambah atau mengubah write-model domain.

---

## 1. Tujuan

Menyediakan visibilitas umur piutang pelanggan berdasarkan outstanding yang masih belum dibayar.

Laporan ini membantu:

- Mengidentifikasi piutang yang mendekati jatuh tempo
- Mengidentifikasi piutang yang sudah lama tertunggak
- Mendukung keputusan penagihan

Aging bukan state yang disimpan, melainkan hasil perhitungan saat membaca data.

---

## 2. Sumber Data

Aging dihitung berdasarkan:

- Order (status credit)
- Payment (partial / full)
- customerId
- Tanggal order atau tanggal jatuh tempo (jika ada)

Outstanding dihitung secara derived:

outstanding = totalOrderAmount - totalPaymentAmount

Tidak boleh ada field "agingStatus" yang disimpan di database.

---

## 3. Aging Bucket

Contoh bucket standar:

- 0–30 hari
- 31–60 hari
- 61–90 hari
- > 90 hari

Perhitungan umur berdasarkan:

currentDate - orderDate

Atau jika tersedia:

currentDate - dueDate

Semua perhitungan dilakukan saat query/reporting.

---

## 4. Struktur Output Laporan

Per Customer:

- customerId
- customerName
- totalOutstanding
- bucket_0_30
- bucket_31_60
- bucket_61_90
- bucket_over_90

Detail View (opsional):

- orderId
- orderDate
- dueDate
- totalAmount
- totalPaid
- outstanding
- agingDays

---

## 5. Prinsip Arsitektural

1. Reporting bersifat read-only.
2. Tidak ada perubahan data saat menghitung aging.
3. Tidak ada penyimpanan hasil aging di database.
4. Perhitungan harus deterministik dan reproducible.
5. Tidak ada logika bisnis di UI.

---

## 6. Edge Cases

- Order dengan outstanding = 0 tidak muncul di aging.
- Order dibatalkan tidak masuk perhitungan.
- Order tanpa customerId tidak masuk laporan customer aging.

---

## 7. Testing Strategy (Pseudo)

Given:
- Customer A memiliki 3 order credit
- Order 1 umur 10 hari
- Order 2 umur 45 hari
- Order 3 umur 100 hari

When:
- Laporan aging dijalankan

Then:
- Outstanding terdistribusi sesuai bucket
- TotalOutstanding = jumlah seluruh outstanding
- Tidak ada perubahan data transaksi

---

## 8. Non-Goals

- Denda keterlambatan otomatis
- Penagihan otomatis
- Integrasi notifikasi
- Perubahan status customer berdasarkan aging

Fitur-fitur tersebut berada di luar scope laporan aging dasar.

---

Dokumen ini memastikan bahwa aging receivable tetap menjadi concern reporting dan tidak mengubah struktur domain atau invariant sistem.

