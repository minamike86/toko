# Credit Outstanding Report – MVP Step 3

**Status:** DESIGN FINAL – READY TO LOCK  
**Scope:** Internal Reporting (Read‑Only)  
**MVP Phase:** Step 3 – Reporting

---

## 1. Tujuan Dokumen

Dokumen ini mendefinisikan desain **Credit Outstanding Report** sebagai bagian dari **MVP Step 3 – Reporting**.

Laporan ini bertujuan memberikan visibilitas operasional mengenai:

> *Jumlah kewajiban pembayaran pelanggan yang **masih terbuka saat ini**, serta asal transaksi yang menyebabkannya.*

Dokumen ini bersifat **mengikat secara desain** dan **tidak membuka kembali** kontrak domain maupun use case pada:
- MVP Step 1 – Core Transaction
- MVP Step 2 – Operational Stability

---

## 2. Posisi Credit Outstanding Report dalam Sistem

Credit Outstanding Report adalah:

- **Internal Reporting** (bukan fiskal / akuntansi)
- **Read‑only & observasional**
- **Tanpa mutasi data**
- **Tanpa period locking**

Laporan ini **BUKAN**:
- laporan pajak
- laporan akuntansi
- modul piutang (Accounts Receivable)

Jika suatu kebutuhan memerlukan:
- penguncian periode
- snapshot historis final
- aging piutang
- jatuh tempo atau bunga

maka kebutuhan tersebut **BUKAN scope MVP Step 3**.

---

## 3. Definisi Bisnis Credit Outstanding (Final)

### 3.1 Kriteria Order yang Masuk Laporan

Sebuah order **masuk Credit Outstanding Report jika dan hanya jika**:

- `order.status == "ON_CREDIT"`
- `outstandingAmount > 0`

Konsekuensi eksplisit:

| Status Order | Masuk Laporan |
|-------------|---------------|
| CREATED | ❌ |
| PAID | ❌ |
| CANCELED | ❌ |
| ON_CREDIT | ✅ |

Tidak ada kondisi tambahan.

---

### 3.2 Hal yang Secara Sadar TIDAK Ditangani

Credit Outstanding Report **TIDAK**:

- menghitung umur piutang (aging)
- menentukan jatuh tempo
- menyimpan saldo awal / akhir periode
- mengelompokkan berdasarkan customer
- menangani pembayaran parsial

Semua poin di atas adalah **domain masa depan (Accounting / AR)**.

---

## 4. Struktur Data Laporan

### 4.1 Baris Detail (Per Order)

Setiap baris detail merepresentasikan **satu order berstatus ON_CREDIT**.

Field wajib:

- `orderId`
- `orderDate` (createdAt)
- `orderType` (string: ONLINE | OFFLINE)
- `totalAmount`
- `outstandingAmount`

Catatan desain:
- Tidak ada data customer
- Tidak ada import enum atau tipe domain
- Seluruh field menggunakan tipe primitif

---

### 4.2 Baris Summary (Agregat)

Selain daftar detail, laporan **SELALU** menyertakan **1 baris summary**.

Isi summary:

- `totalOutstandingAmount` → SUM(outstandingAmount)
- `totalCreditOrders` → COUNT(orderId)

Karakteristik summary:
- Dihitung dari dataset yang sama dengan baris detail
- Mengikuti filter tanggal yang sama
- Bukan snapshot terpisah
- Tidak disimpan secara persisten

---

## 5. Filter dan Ruang Lingkup Query

### 5.1 Filter yang Didukung

Credit Outstanding Report mendukung filter:

- **Tanggal Order (createdAt)**
  - from (inclusive)
  - to (inclusive)

Filter ini:
- bersifat query‑time
- **BUKAN** period locking
- **BUKAN** penutupan laporan

---

### 5.2 Hal yang TIDAK Ada

- period locking
- closing month / year
- carry‑over saldo piutang

Jika data transaksi berubah, laporan periode sebelumnya **boleh berubah**.

Ini adalah konsekuensi sadar dari desain internal reporting.

---

## 6. Arsitektur & Boundary Reporting

### 6.1 Posisi Modul

Credit Outstanding Report berada di modul:

```
src/modules/reporting/
```

Struktur mengikuti kebijakan reporting:

```
reporting/
  application/
  queries/
  dto/
```

---

### 6.2 Aturan Dependency (Mengikat)

Reporting **DILARANG**:
- mengimpor domain Sales
- mengimpor application use case Sales
- mengimpor enum atau entity domain
- memanggil use case mutasi

Reporting **BOLEH**:
- query langsung ke database
- menggunakan database view
- melakukan agregasi data

---

## 7. Dampak terhadap MVP Sebelumnya

Desain Credit Outstanding Report ini:

- **NON‑BREAKING** terhadap MVP Step 1
- **NON‑BREAKING** terhadap MVP Step 2
- Tidak mengubah kontrak domain
- Tidak mengubah use case mutasi

---

## 8. Definition of Done (Desain)

Credit Outstanding Report dianggap **selesai secara desain** jika:

1. Definisi order ON_CREDIT konsisten
2. Summary dihitung dari dataset yang sama
3. Tidak ada logic bisnis baru
4. Tidak ada klaim finalitas historis
5. Seluruh prinsip reporting Step 3 dipatuhi

---

## 9. Catatan Penutup

Credit Outstanding Report adalah alat visibilitas, bukan alat akuntansi.

Laporan ini sengaja:
- jujur terhadap kondisi terkini
- sederhana secara konsep
- tidak melampaui tanggung jawabnya

Finalitas finansial adalah urusan domain lain.
Reporting Step 3 hanya memastikan **tidak ada uang yang "menghilang tanpa terlihat"**.

