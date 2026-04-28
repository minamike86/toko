# Blueprint Evolusi Sistem – Step 7 sampai Step 10

Dokumen ini mendefinisikan arah evolusi sistem dari alat bantu operasional toko menuju ERP skala kecil secara bertahap, disiplin, dan tidak merusak boundary yang sudah dikunci pada Step 1–6.

Filosofi utama:
> Operational first. ERP-ready by design.

---

# STEP 7 – Customer Activation (Operational Layer)

## Tujuan
Mengaktifkan entitas Customer sebagai bagian dari sisi demand (penjualan)
tanpa masuk ke domain CRM atau akuntansi penuh.

## Posisi Arsitektural
- Domain terpisah dari Sales
- Sales hanya mereferensikan customerId
- Tidak memperkenalkan journal entry
- Tidak memengaruhi Procurement

## Cakupan

### 1. Customer Entity
- id
- nama
- kontak (opsional)
- status (ACTIVE | INACTIVE)
- timestamped & immutable identity

### 2. Integrasi dengan Sales
- Order dapat memiliki customerId (opsional untuk transaksi cash retail)
- Outstanding kredit dihitung per customer
- Riwayat order dapat ditelusuri per customer

### 3. Status & Kontrol Dasar
- Nonaktifkan customer tanpa menghapus histori
- Tidak boleh hard delete jika sudah memiliki transaksi

## Tidak Termasuk
- Loyalty program
- Diskon personal otomatis
- Segmentasi marketing
- CRM automation

## Prinsip Keras
- Customer tidak memiliki logika pembayaran
- Customer tidak menyimpan daftar order secara langsung
- Tidak ada logika bisnis di layer UI
- Tidak mengubah kontrak domain Sales

## Definition of Done
- Order dapat mereferensikan customerId
- Outstanding kredit per customer dapat dihitung deterministik
- Tidak ada pelanggaran boundary antara Customer dan Sales

# STEP 8 – Supplier Payable (Accounts Payable Lite)

## Tujuan
Mengelola kewajiban hutang ke supplier tanpa masuk ke domain akuntansi penuh.

## Posisi Arsitektural
- Tetap berada di sisi Procurement
- Tidak memperkenalkan General Ledger
- Tidak ada journal entry
- Tidak ada period closing

## Cakupan

### 1. Supplier Outstanding
- Outstanding dihitung dari Purchase Order
- Status: UNPAID | PARTIALLY_PAID | PAID

### 2. Payment Pembelian
- Mencatat pembayaran ke supplier
- Mendukung partial payment
- Timestamped & immutable

### 3. Retur Pembelian
- Mengurangi stok melalui Inventory
- Mengurangi outstanding supplier
- Tidak menghapus histori PO

## Prinsip Keras
- Tidak ada double-entry accounting
- Tidak ada jurnal debit/kredit
- Tidak ada rekalkulasi histori
- Semua transaksi immutable

## Definition of Done
- Outstanding supplier terlihat real-time
- Payment tercatat kronologis
- Retur mengurangi stok & hutang secara konsisten
- Tidak ada perubahan pada domain Sales

---

# STEP 9 – Costing Engine (Moving Average First)

## Tujuan
Menentukan harga pokok penjualan (COGS) secara deterministik dan tidak retroaktif.

## Posisi Arsitektural
- Layer terpisah dari Procurement
- Tidak mengubah histori transaksi
- Tidak melakukan rekalkulasi ulang masa lalu

## Cakupan Awal (Disarankan)
- Moving Average Cost per variant
- Cost snapshot saat penjualan
- Simpan COGS di OrderItem
- Margin internal (read-only)

## Tidak Termasuk
- FIFO langsung
- LIFO
- Retroactive cost recalculation

## Prinsip Keras
- Cost dihitung saat event terjadi
- Tidak boleh berubah setelah transaksi final
- Tidak ada edit cost manual

## Definition of Done
- Setiap penjualan memiliki COGS snapshot
- Margin bisa dihitung deterministik
- Reporting tetap read-only

---

# STEP 10 – Accounting Domain (General Ledger Activation)

## Tujuan
Mengubah sistem dari operasional menjadi ERP skala kecil dengan akuntansi formal.

## Posisi Arsitektural
- Domain baru: Accounting
- Terpisah dari Procurement & Sales
- Semua transaksi menghasilkan journal entry

## Cakupan

### 1. Journal Entry (Double Entry)
- Debit & Credit
- Immutable

### 2. General Ledger
- Account structure
- Trial balance

### 3. Period Closing
- Monthly lock
- Adjustment entry only

### 4. Laporan
- Laba Rugi
- Neraca

## Prinsip Keras
- Tidak boleh edit transaksi lama
- Perubahan melalui adjustment entry
- Period yang sudah close tidak bisa diubah

## Definition of Done
- Trial balance selalu balance
- Laporan laba rugi konsisten
- Closing period terkunci

---

# STEP 11 – Master Data Governance & UX Maturity

## Tujuan
Membuat input data produk dan master data menjadi stabil, audit-ready, dan finansial-aware.

## Kenapa di Step 10?
Karena setelah Accounting aktif:
- Harga jual memengaruhi margin
- Cost memengaruhi laba
- SKU tidak boleh berubah sembarangan
- Penghapusan produk berdampak finansial

## Cakupan

### 1. Product Lifecycle
- Active / Inactive / Archived
- Tidak boleh hard delete jika ada histori transaksi

### 2. Variant Governance
- SKU immutable
- Tidak boleh ubah struktur setelah ada transaksi

### 3. Price Versioning
- Tidak overwrite harga
- Simpan histori perubahan harga

### 4. Audit Trail Master Data
- Siapa mengubah apa dan kapan

### 5. Role Restriction
- Hanya role tertentu boleh edit master data

## Prinsip Keras
- Tidak boleh mengubah histori finansial
- Tidak boleh hapus entity yang punya referensi transaksi
- Semua perubahan terdokumentasi

## Definition of Done
- Tidak ada master data liar
- Semua perubahan audit-ready
- Input produk stabil untuk jangka panjang

---

# Evolusi Sistem

Step 1–5 → Operasional stabil
Step 6 → Procurement
Step 7 → Customer Activation (Operational Layer)
Step 8 → Supplier Payable Lite
Step 9 → Costing Engine
Step 10 → Accounting Domain
Step 11 → Master Data Governance

---

# Prinsip Utama Evolusi

1. Tidak ada langkah yang merusak step sebelumnya.
2. Domain baru selalu terisolasi.
3. Tidak ada logika bisnis di UI.
4. Semua transaksi immutable.
5. Reporting tetap observasional.

Dengan blueprint ini, sistem dapat berkembang dari alat bantu operasional menjadi ERP kecil tanpa refactor besar di tengah jalan.

