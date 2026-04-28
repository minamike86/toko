# Sales Summary Report – MVP Step 3

## Status
DESIGN LOCKED (implementation not started)

Dokumen ini mendefinisikan desain **Sales Summary Report** sebagai bagian dari **MVP Step 3 (Reporting)**.
Report ini bersifat **read-only, observasional**, dan tidak mempengaruhi domain transaksi.

---

## Tujuan

Sales Summary Report bertujuan memberikan **ringkasan kondisi penjualan dan kas masuk** dalam suatu periode waktu tertentu, terutama untuk:

- Owner (pengambilan keputusan cepat)
- Admin operasional (sanity check harian)

Report ini **bukan laporan pajak** dan **bukan laporan akuntansi**.

---

## Prinsip Desain

1. Reporting bersifat **read-only**
2. Tidak memanggil atau reuse use case domain (Step 1 & 2)
3. Tidak mengubah state sistem
4. Mengandalkan fakta transaksi yang sudah dikunci
5. DTO reporting **tidak bergantung** pada domain type

---

## Pertanyaan Bisnis yang Dijawab

Sales Summary Report menjawab pertanyaan berikut:

- Berapa jumlah order dalam periode tertentu?
- Berapa total nilai penjualan (berdasarkan order)?
- Berapa kas yang benar-benar masuk pada periode tersebut?
- Berapa total piutang (outstanding) saat laporan diambil?
- Berapa order yang dibatalkan?

Report ini **tidak** menjawab pertanyaan margin, laba rugi, atau costing.

---

## Definisi Periode

Periode laporan didefinisikan sebagai rentang waktu:

- `startDate`
- `endDate`

Periode dapat bersifat harian, mingguan, atau bulanan, tergantung kebutuhan pemanggil query.

---

## Struktur Output (DTO)

```ts
SalesSummaryDTO {
  period: {
    startDate: Date;
    endDate: Date;
  };
  orderCount: number;
  grossSalesAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  canceledOrderCount: number;
}
```

Catatan:
- Semua nilai uang direpresentasikan sebagai number (nilai mentah), tanpa Value Object domain
- `outstandingAmount` adalah **snapshot saat laporan diambil**, bukan historis per akhir periode

---

## Sumber Data & Aturan Hitung

### Order Metrics

Sumber: **Order**

Aturan:
- Filter order dengan `createdAt` berada dalam periode
- `orderCount` = jumlah order (exclude draft jika ada)
- `grossSalesAmount` = sum `order.totalAmount` (exclude status `CANCELED`)
- `canceledOrderCount` = jumlah order berstatus `CANCELED` dalam periode

---

### Payment Metrics

Sumber: **Payment / Credit Settlement**

Aturan:
- Filter payment dengan `occurredAt` berada dalam periode
- `paidAmount` = sum `payment.amount`

Payment untuk order lama yang dibayar pada periode berjalan **tetap dihitung** sebagai kas masuk periode tersebut.

---

### Outstanding Metrics

Sumber:
- Order
- Payment

Aturan:
- Untuk seluruh order kredit:
  - outstanding = `order.totalAmount - sum(payment.amount)`
- `outstandingAmount` = total outstanding seluruh order yang belum lunas

Perhitungan dilakukan **pada saat query dijalankan**.

---

## Desain Read Model

Sales Summary menggunakan pendekatan **hybrid**:

### Database View (Read-Only)

- `report_orders_daily`
  - date
  - orderCount
  - grossSalesAmount
  - canceledOrderCount

- `report_payments_daily`
  - date
  - paidAmount

View ini hanya berisi agregasi dasar tanpa logika bisnis.

---

### Query Runtime

- Outstanding dihitung secara runtime dari data order dan payment
- Tidak disimpan sebagai tabel atau view terpisah

Pendekatan ini dipilih untuk menjaga kesederhanaan dan konsistensi data.

---

## Boundary & Testing

- Sales Summary berada di **Reporting Boundary**
- Tidak mengimpor entity atau use case domain
- Integration test diperbolehkan menggunakan database (sesuai kebijakan testing)
- Test fokus pada:
  - konsistensi agregasi
  - kebenaran hasil terhadap data contoh

---

## Non-Goals

Sales Summary Report **tidak mencakup**:

- Laporan akuntansi / pajak
- Margin atau laba rugi
- Valuasi inventory
- Prediksi atau analitik lanjutan
- Dashboard visual

---

## Penutup

Sales Summary Report adalah fondasi Reporting Step 3.

Desain ini menekankan kejujuran data, kesederhanaan, dan pemisahan tegas antara domain transaksi dan reporting.

Report lain pada Step 3 **harus mengikuti pola desain yang sama** untuk menjaga konsistensi arsitektur.

