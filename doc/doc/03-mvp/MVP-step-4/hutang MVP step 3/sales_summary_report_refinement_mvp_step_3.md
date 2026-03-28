# Sales Summary Report – Refinement (MVP Step 3)

**Status:** DESIGN FINAL – READY TO LOCK  
**Scope:** Internal Reporting (Read-Only)  
**MVP Phase:** Step 3 – Reporting

---

## 1. Tujuan Dokumen

Dokumen ini mendefinisikan **refinement desain Sales Summary Report** pada **MVP Step 3 – Reporting**.

Sales Summary Report bertujuan memberikan ringkasan operasional mengenai:

> *Performa penjualan aktual berdasarkan transaksi yang **benar-benar telah dibayar (PAID)**.*

Refinement ini memperjelas:
- definisi penjualan yang sah
- dimensi agregasi yang diperbolehkan
- batas tegas antara ringkasan operasional dan laporan akuntansi

Dokumen ini **tidak membuka kembali** MVP Step 1 dan Step 2 yang telah dikunci.

---

## 2. Posisi Sales Summary Report dalam Sistem

Sales Summary Report adalah:

- **Internal Reporting**
- **Read-only & observasional**
- **Berbasis agregasi transaksi PAID**
- **Tanpa mutasi domain**

Laporan ini **BUKAN**:
- laporan fiskal
- laporan laba rugi
- laporan akuntansi periode tertutup

Jika suatu kebutuhan memerlukan:
- pengakuan pendapatan berbasis accrual
- period locking
- koreksi jurnal historis

maka kebutuhan tersebut **BUKAN scope MVP Step 3**.

---

## 3. Definisi Bisnis Penjualan (Final)

### 3.1 Definisi Penjualan yang Dihitung

Sebuah order **DIHITUNG sebagai penjualan jika dan hanya jika**:

- `order.status == "PAID"`

Konsekuensi eksplisit:

| Status Order | Dihitung sebagai Penjualan |
|-------------|----------------------------|
| CREATED | ❌ |
| ON_CREDIT | ❌ |
| PAID | ✅ |
| CANCELED | ❌ |

Order `PAID` yang kemudian dibatalkan:
- **mengurangi penjualan pada periode query berjalan**
- **tidak mengubah histori yang dikunci** (karena tidak ada locking)

---

### 3.2 Hal yang Secara Sadar Tidak Ditangani

Sales Summary Report **TIDAK**:

- menghitung profit atau margin
- memasukkan pajak
- membedakan harga pokok
- melakukan penyesuaian akuntansi

---

## 4. Dimensi dan Agregasi yang Didukung

### 4.1 Dimensi Waktu

Sales Summary Report mendukung agregasi berdasarkan:

- Harian
- Mingguan
- Bulanan

Dimensi waktu:
- ditentukan saat query
- **BUKAN** period accounting
- **BUKAN** period locking

---

### 4.2 Dimensi Channel

Jika data tersedia, laporan dapat dikelompokkan berdasarkan:

- `orderType` (ONLINE | OFFLINE)

Channel:
- bersifat informasional
- tidak memengaruhi pengakuan penjualan

---

### 4.3 Dimensi Metode Pembayaran

Sales Summary Report mendukung klasifikasi:

- Cash (order langsung PAID)
- Credit (order PAID melalui Pay Credit)

Catatan penting:
- Credit dihitung **saat PAID**, bukan saat ON_CREDIT
- Tidak ada pembayaran parsial

---

## 5. Struktur Data Laporan

### 5.1 Baris Summary

Setiap baris summary merepresentasikan **satu kombinasi agregasi**.

Field wajib:

- `period` (string representasi periode)
- `totalSalesAmount`
- `totalPaidOrders`

Field opsional (jika grouping aktif):

- `orderType`
- `paymentCategory` (CASH | CREDIT)

Semua field bertipe primitif.

---

### 5.2 Tidak Ada Baris Detail

Sales Summary Report:
- **tidak menampilkan order individual**
- **tidak menggantikan laporan detail penjualan**

Tujuannya adalah ringkasan, bukan audit item.

---

## 6. Filter dan Ruang Lingkup Query

### 6.1 Filter yang Didukung

- **Tanggal Penjualan (paidAt / timestamp PAID)**
  - from (inclusive)
  - to (inclusive)

Filter ini:
- menentukan dataset agregasi
- **BUKAN** penutupan periode

---

### 6.2 Hal yang Tidak Ada

- filter customer
- filter produk
- snapshot historis final

---

## 7. Arsitektur & Boundary Reporting

### 7.1 Posisi Modul

Sales Summary Report berada di:

```
src/modules/reporting/
```

Mengikuti struktur resmi:

```
reporting/
  application/
  queries/
  dto/
```

---

### 7.2 Aturan Dependency (Mengikat)

Reporting **DILARANG**:
- mengimpor domain Sales
- mengimpor application use case
- mengimpor enum domain

Reporting **BOLEH**:
- query langsung ke database
- menggunakan database view

---

## 8. Dampak terhadap MVP Sebelumnya

Refinement Sales Summary Report ini:

- **NON-BREAKING** terhadap MVP Step 1
- **NON-BREAKING** terhadap MVP Step 2
- Tidak mengubah definisi order
- Tidak mengubah use case Pay Credit

---

## 9. Definition of Done (Desain)

Sales Summary Report dianggap **selesai secara desain** jika:

1. Hanya order PAID yang dihitung
2. ON_CREDIT tidak pernah masuk penjualan
3. Dimensi waktu & channel konsisten
4. Tidak ada logika fiskal tersembunyi
5. Seluruh prinsip reporting Step 3 dipatuhi

---

## 10. Catatan Penutup

Sales Summary Report adalah **indikator kesehatan bisnis**, bukan alat pembukuan.

Laporan ini sengaja:
- ringkas
- jujur
- tidak final secara fiskal

Jika suatu hari angka di laporan berubah, itu karena:
- transaksi berubah
- status berubah

Bukan karena sistem berbohong.

