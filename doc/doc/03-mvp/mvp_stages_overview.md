# MVP Stages Overview

Dokumen ini mengunci definisi **tahapan MVP** untuk Sistem Jual Beli Terpadu. Dokumen ini **bukan pengganti domain atau use case**, melainkan *pagar fase* yang menjelaskan **apa yang boleh dan tidak boleh dilakukan pada setiap tahap**.

Dokumen ini bersifat **mengikat secara arah**, bukan detail implementasi. Detail teknis tetap berada di folder `/docs` lainnya.

---

## MVP Step 1 – Core Transaction (CLOSED & DESIGN LOCKED)

**Tujuan utama:**
Membuktikan bahwa sistem mampu menangani transaksi penjualan dan pergerakan stok secara benar dan jujur.

**Cakupan:**
- Catalog Domain (produk, satuan, harga)
- Inventory Domain (stok satu gudang)
- Sales Domain (cash & credit)
- Use case inti:
  - initialize-stock
  - create-order
  - cancel-order
  - receive-stock
  - adjust-stock

**Batasan keras:**
- Tidak ada pajak
- Tidak ada promo atau diskon kompleks
- Tidak ada multi-gudang
- Tidak ada accounting

**Definisi selesai (Done):**
- Transaksi bisa dibuat, dibatalkan, dan memengaruhi stok dengan benar
- Domain dan boundary tidak dilanggar

---

## MVP Step 2 – Operational Stability (CLOSED & DESIGN LOCKED)

**Tujuan utama:**
Menstabilkan sistem untuk penggunaan harian tanpa mengubah inti domain.

**Cakupan:**
- Pay credit (pelunasan hutang sederhana)
- Validasi dan error handling lebih ketat
- Logging operasional
- Basic role separation (kasir vs admin)

**Yang tidak berubah:**
- Struktur domain
- Boundary antar domain

**Definisi selesai:**
- Sistem dapat digunakan berulang tanpa inkonsistensi data
- Error dapat ditelusuri

---

## MVP Step 3 – Reporting (CLOSED & DESIGN LOCKED)

**Tujuan utama:**
Menyediakan visibilitas data untuk pemilik usaha.

**Cakupan:**
- Laporan penjualan
- Laporan stok (snapshot & movement)
- Rekap cash vs credit

**Catatan:**
- Reporting bersifat read-only
- Tidak menambah aturan bisnis baru
- Tidak reuse use case domain

**Definisi selesai:**
- Laporan deterministik
- Tidak ada kebocoran domain ke reporting

---

## MVP Step 4 – Domain Hardening & Catalog Activation

**Tujuan utama:**
Memperkuat model produk dan stok agar siap operasional nyata.

Step ini berfokus pada penguatan model, bukan penambahan fitur UI besar.

**Cakupan:**

### Definition of Done — Step 4

**Technical Completion Criteria**
- Stok berada pada level variant
- Asal stok tercatat
- Tidak ada string liar untuk SKU
- Semua integration test hijau setelah migration
- Tidak ada field productId tersisa di InventoryItem
- Tidak ada OrderItem tanpa variantId
- Movement wajib memiliki origin

**Governance Criteria**
- Reporting Snapshot & Movement harus tetap deterministik
- Architecture test tetap hijau
- Reporting boundary test tetap lulus setelah perubahan
- Step 4 adalah prasyarat teknis untuk Step 5.
- Step 4 tidak boleh dianggap selesai jika salah satu 4.1–4.4 belum memenuhi Definition of Done

### 4.1 Stock Origin Activation (Current Active Step)

**Tujuan:**
Mengaktifkan transparansi asal stok.

**Yang akan diimplementasikan:**
- Tambah field `origin` pada StockMovement
- Enum formal untuk origin
- Origin immutable
- Reporting movement menampilkan origin
- Transparansi historis stok meningkat

**Tidak termasuk:**
- Event sourcing
- Perubahan perhitungan stok

---

### 4.2 – Payment Settlement Formalization (Additive)

**Tujuan:**
Membuat pembayaran lebih realistis.

**Yang akan diimplementasikan:**
- Payment entity resmi
- Partial payment
- Outstanding derived dari payment
- Concurrency-safe payment

**Governance Criteria**
- Menggantikan mekanisme Step 2
- Mekanisme lama dianggap deprecated setelah 4.2 selesai

### 4.3 Product & Variant Activation

**Tujuan:**
Menjadikan SKU nyata dan stok berada di level varian.

**Yang akan diimplementasikan:**
- Product entity resmi
- ProductVariant entity resmi
- InventoryItem pindah ke variantId
- OrderItem refer ke variantId

### 4.4 Inventory Consistency Stabilization
**Tujuan:**
Menjaga konsistensi antara snapshot dan movement tanpa mengubah arsitektur.

**Yang akan diimplementasikan:**
- Movement tetap immutable
- Snapshot tetap menjadi state saat ini
- Tidak masuk event sourcing
- Integrity checker tersedia
- Tidak ada mismatch snapshot vs movement pada test

**Batasan keras:**
- Tidak menambah multi-gudang
- Tidak menambah accounting
- Tidak merusak reporting boundary

---

## MVP Step 5 – Operational Dashboard & Cash Clarity

**Tujuan utama:**
Memberikan visibilitas operasional kepada owner tanpa menambah aturan bisnis baru.

**Prinsip:**
- Dashboard hanya komposisi dari reporting
- Tidak query langsung ke database
- Tidak menambahkan rule bisnis

### 5.1 Warehouse Dashboard
- Total product & variant
- Snapshot stok per variant
- Low stock indicator
- Komposisi dari reporting saja

### 5.2 Cash Ledger View
- Semua payment
- Semua order (cash vs credit)
- Urut kronologis

### 5.3 Performance Preparation
- Index pada movement & order
- Pagination untuk data besar

### 5.4 Operational Identity & Actor Tracking (Additive)

**Tujuan:**
Menambahkan identitas pengguna minimal untuk akuntabilitas operasional
tanpa mengubah domain inti atau memperkenalkan sistem akuntansi.

**Yang akan diimplementasikan:**
- User entity sederhana (id, name, role, isActive)
- Role minimal: ADMIN | SALES | WAREHOUSE
- Setiap mutation menerima actor context
- Audit trail mencatat actorId
- Authorization guard aktif di application layer

**Batasan keras:**
- Tidak ada logika role di domain entity
- Tidak ada rule bisnis di UI
- Tidak ada sistem IAM kompleks (OAuth, SSO, multi-tenant)
- Tidak mengubah invariant domain

**Tujuan operasional:**
- Diketahui siapa membuat order
- Diketahui siapa menerima barang
- Diketahui siapa melakukan adjustment

Fitur ini bersifat operasional dan tidak menjadikan sistem sebagai ERP penuh.

### Definition of Done — Step 5

***Operational Outcome***
- Stok real per variant
- Produk dan varian aktif
- Low stock yang jelas
- Arus kas masuk
- Outstanding kredit
- Setiap mutation memiliki actorId yang tercatat

***Governance Outcome***
- Tidak ada double-entry
- Tidak membuat sistem akuntansi
- Tidak menyentuh write-model domain
- Tidak menambah rule bisnis tanpa merusak reporting boundary
- Authorization hanya berada di application layer

---

## MVP Step 6 – Procurement & Cost Foundation (FUTURE)

**Tujuan utama:**
Mengaktifkan domain pengadaan barang (Procurement) sebagai sumber kebenaran
histori pembelian dan harga kulak, tanpa merusak domain transaksi dan reporting
yang sudah dikunci.

Step ini memperkenalkan domain baru yang berada di sisi *supply* dan
terpisah dari Catalog, Inventory, dan Sales.

### Cakupan

- Supplier entity
- Purchase Order
- Purchase Item
- Integrasi ke Inventory melalui StockMovement (origin = PURCHASE)
- Penyimpanan unit cost di domain Procurement (bukan di Inventory)

### Prinsip Keras

- Procurement adalah domain terpisah, bukan ekstensi Inventory.
- Inventory tetap menjadi satu-satunya sumber kebenaran jumlah stok.
- Procurement tidak memodifikasi histori penjualan.
- Aktivasi domain wajib melalui ADR resmi.
- Reporting tetap read-only dan tidak mengambil logika costing dari domain ini.

### Tidak Termasuk

- Hutang ke supplier
- Pembayaran pembelian
- Retur pembelian
- Profit / margin calculation
- Laporan akuntansi atau pajak

### Definition of Done — Step 6

- Setiap pembelian yang diterima menghasilkan StockMovement dengan origin PURCHASE.
- Unit cost tersimpan konsisten di Procurement Domain.
- Stok legacy tetap dipisahkan sesuai ADR Stock Origin Classification.
- Tidak ada perubahan pada kontrak domain Sales atau Inventory yang sudah dikunci.

Step 6 tidak boleh dimulai jika seluruh Step 5 belum stabil secara operasional.

### planing aja dulu ###


Step 7 → Supplier Payable (tanpa journal)
- Hutang supplier
- Payment pembelian
- Retur pembelian
- Outstanding supplier

Step 8 → Costing (Moving Average dulu, jangan langsung FIFO)
- FIFO / Moving Average
- COGS calculation
- Margin per transaksi

Step 9 → Baru Accounting Domain
- Journal entry
- Laba rugi
- Period closing
- Ledger

---

# Final MVP Flow

| Step | Fokus | Outcome |
|------|-------|---------|
| 1 | Transaksi | Order & stok berjalan |
| 2 | Stabilitas | Error & boundary aman |
| 3 | Reporting | Laporan jujur & deterministik |
| 4 | Domain Hardening | Varian & origin nyata |
| 5 | Dashboard | Operasional bisa dipakai |
| 6 | Procurement | Histori kulak & cost foundation |

Sistem dianggap operasional-ready setelah Step 5 selesai.
Step 5 tidak boleh dimulai jika seluruh Step 4 belum selesai dan stabil.
Implementasi Procurement (Step 6) adalah ekspansi domain dan bukan bagian dari kesiapan operasional dasar sistem.

---

## Prinsip Penguncian Tahapan

- Setiap Step adalah **subset terkontrol** dari sistem
- Step berikutnya **tidak merusak** step sebelumnya
- Dokumen domain dan use case tetap menjadi sumber kebenaran
- Reporting tetap read-only

---

## Catatan Penutup

Dokumen ini menjaga agar evolusi sistem berjalan bertahap dan disiplin. Jika sebuah ide tidak dapat ditempatkan dengan jelas pada salah satu step di atas, maka ide tersebut **belum waktunya diimplementasikan**.
