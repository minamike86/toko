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

### 5.5 Dashboard Presentation (Finalization)

**Tujuan:**
Menyajikan dashboard operasional sebagai UI yang dapat digunakan owner/admin
tanpa menambahkan aturan bisnis baru.

**Yang akan diimplementasikan:**

- Screen dashboard utama (SC1)
- Penyajian Warehouse Dashboard dan Cash Clarity
- Low stock visibility
- Outstanding credit visibility

**Batasan keras:**

- Tidak query langsung ke database
- Tidak menambahkan business rule
- Tidak memindahkan authorization ke UI
- Hanya menggunakan reporting/dashboard application layer

**Tujuan operasional:**

- Owner dapat melihat kondisi stok
- Owner dapat melihat arus kas
- Owner dapat mengambil keputusan operasional harian

Fitur ini bersifat operasional dan tidak menjadikan sistem sebagai ERP penuh.

### Step 5 Extension — POS Operational Interface (Phase 2)

Step ini merupakan finalisasi operasional untuk domain Sales melalui UI POS.

Scope:

- UI POS (`/pos`)
- API route untuk Sales use case
- Integrasi ke reporting (read-only)
- Validasi end-to-end flow transaksi

Flow yang tervalidasi:

- Create Order (CASH / CREDIT)
- List transaksi (read-only via reporting)
- Cancel Order
- Pay Credit (full settlement)

Constraint:

- Tidak menambah business rule
- Tidak mengubah domain Sales
- Tidak membuat use case baru
- Tidak mengakses Prisma dari UI
- Semua mutasi wajib melalui application layer

Boundary:

- UI → hanya consume DTO
- Route → hanya orchestration
- Reporting → tetap read-only
- Domain → tidak berubah

Status:

- IMPLEMENTED
- VERIFIED
- NON-BREAKING
- ADDITIVE

Catatan:

- Actor context masih berasal dari UI layer (MVP acceptable)
- Error mapping telah dirapikan di delivery layer
- Cancel Order pada POS adalah pembatalan sales order ke konsumen, bukan purchase order ke supplier
- Authorization Cancel Order mengikuti use case sales pada konteks POS: `ADMIN, SALES`

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

## MVP Step 6 – Procurement & Cost Foundation (COMPLETED)

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

## MVP Step 6.5 – Measurement & Unit Normalization (PLANNING)

**Tujuan utama:**
Menjamin konsistensi satuan (unit) pada seluruh sistem sehingga transaksi,
stok, dan pengadaan dapat dihitung secara benar tanpa ambiguitas.

Step ini merupakan *foundation layer* sebelum masuk ke domain finansial
(Step 7) dan costing (Step 8).

---

### Dependency

- Step 6 (Procurement) harus COMPLETE
- Step 6.5 (Measurement & Unit Normalization) harus COMPLETE

Alasan:

- Semua perhitungan payable harus berbasis quantity canonical
- Tanpa unit normalization, outstanding dan return tidak dapat dihitung secara konsisten

---

### Cakupan

- Definisi **base unit (canonical unit)** per ProductVariant
- Definisi **conversion rule** antar unit
  - contoh: 1 dosin = 12 pcs
- Semua quantity baru harus dikonversi ke canonical unit sebelum masuk ke domain.
- Data historis tidak diubah dan tetap mengikuti aturan pada saat transaksi terjadi.
- Input transaksi boleh menggunakan unit alternatif (opsional),
  tetapi harus dikonversi sebelum masuk ke domain

---

### Prinsip Keras

- Canonical unit menjadi satu-satunya sumber kebenaran quantity
- Conversion bersifat deterministik dan tidak boleh ambigu
- Conversion tidak boleh mengubah histori transaksi yang sudah ada
- Tidak boleh ada fallback ke perhitungan UI
- Konversi dilakukan di application layer atau domain service sebelum nilai quantity digunakan oleh domain entity.
- UI tidak boleh melakukan konversi sebagai source of truth.

---

### Tidak Termasuk

- Tidak mengubah histori StockMovement lama
- Tidak melakukan recalculation terhadap snapshot lama
- Tidak menambahkan costing logic
- Tidak menambahkan hutang atau payment
- Tidak mengubah kontrak domain Procurement yang sudah dikunci

---

### Boundary

- Catalog / Variant bertanggung jawab atas definisi unit
- Inventory tetap menyimpan quantity dalam canonical unit
- Procurement mengikuti canonical unit saat membuat movement
- UI hanya sebagai input layer, bukan tempat konversi final

---

### Invariant (MANDATORY)

- Setiap ProductVariant harus memiliki tepat satu canonical unit
- Conversion rule harus bersifat satu arah menuju canonical unit
- Tidak boleh ada lebih dari satu jalur konversi yang menghasilkan ambiguity
- Quantity yang masuk ke Inventory selalu dalam canonical unit

### Dependency

- Step 6 harus sudah COMPLETE
- Menjadi prasyarat untuk:
  - Step 7 (Supplier Payable)
  - Step 8 (Costing Engine)

---

### Status

- PLANNING
- NON-BREAKING
- ADDITIVE

Step ini tidak mengubah step sebelumnya dan hanya memperkuat fondasi
data sebelum sistem berkembang ke arah finansial dan costing.

### Next Planning Horizon (Post-Step-6)

Tahapan berikutnya berada pada fase **planning** dan tidak boleh langsung
diimplementasikan tanpa definisi domain, use case, dan boundary yang jelas.

---

## MVP Step 7 – Supplier Payable (PLANNING)

**Tujuan utama:**
Mengelola kewajiban hutang ke supplier secara operasional tanpa masuk ke domain akuntansi formal.

Step 7 tidak mengubah lifecycle procurement,
hanya membaca dan menambahkan histori finansial (payment & return reduction).

**Cakupan:**

- Supplier outstanding (UNPAID | PARTIALLY_PAID | PAID)
- Payment pembelian (full & partial)
- Retur pembelian yang mengurangi hutang
- Histori pembayaran yang immutable

**Batasan keras:**

- Tidak ada journal entry
- Tidak ada general ledger
- Tidak ada period closing
- Tidak ada rekalkulasi histori
- Tidak mengubah domain Sales

### Boundary Clarification

- Step 7 tidak menyentuh Inventory mutation secara langsung
- Step 7 tidak melakukan stock reversal secara otomatis
- Jika return membutuhkan inventory reversal:
  - harus melalui boundary/use case resmi yang terpisah
- Step 7 tidak mengubah status `PurchaseOrder` selain validasi `RECEIVED`

### Use Case Scope (Locked)

Step 7 diimplementasikan melalui tiga use case utama:

- Record Supplier Payment
- Get Supplier Outstanding
- Handle Purchase Return (Reduce Payable)

Definisi:

- Payment adalah pencatatan pembayaran ke supplier (append-only, immutable)
- Outstanding adalah nilai derived dari:
  - total cost purchase order
  - total payment
  - total return reduction
- Return reduction adalah mekanisme pengurangan hutang yang terpisah dari payment

Constraint:

- Return tidak boleh dianggap sebagai payment
- Return tidak boleh mengubah histori payment
- Outstanding tidak boleh disimpan sebagai field mutable
- Outstanding harus selalu dihitung secara derived

Konsekuensi:

- Step 7 tidak memperkenalkan accounting domain
- Step 7 hanya mengelola payable operasional

### Lifecycle Constraint (Critical)

Semua use case Step 7 hanya berlaku untuk `PurchaseOrder` yang sudah berstatus `RECEIVED`.

Aturan:

- PurchaseOrder yang belum `RECEIVED` tidak boleh:
  - memiliki outstanding payable
  - menerima supplier payment
  - menerima return reduction

Konsekuensi:

- Step 7 selalu berada setelah proses receive procurement selesai
- Tidak boleh ada payable sebelum barang secara resmi diterima ke inventory

---

## MVP Step 7.5 – Receiving Inspection & Quarantine (FUTURE STEP)

**Tujuan utama:**
Memastikan kualitas barang sebelum masuk inventory tanpa merusak kontrak Procurement dan Inventory yang sudah dikunci.

**Cakupan:**

- ReceivingInspection entity
- Inspection item (accepted, quarantined, rejected)
- Final Acceptance sebelum inventory mutation
- Quarantine sebagai state terpisah dari inventory

**Prinsip keras:**

- Tidak mengubah kontrak Step 6 (ReceivePurchaseOrder)
- Tidak mengubah kontrak Step 7 (Supplier Payable)
- Tidak mempengaruhi outstanding payable secara langsung
- Inventory hanya menerima accepted quantity

**Batasan keras:**

- Tidak boleh langsung memanggil inventory mutation dari UI
- Tidak boleh mencampur Direct Receive Mode dan Inspection Flow Mode
- Tidak boleh menganggap quarantine sebagai stok tersedia

### Interaction with Step 7 (Payable)

Jika Inspection Flow Mode digunakan:

- Status `PurchaseOrder RECEIVED` hanya terjadi melalui:
  - `Finalize Inspection Acceptance`

Konsekuensi:

- Step 7 (Supplier Payable) baru boleh berjalan setelah:
  - Final Acceptance berhasil
  - PurchaseOrder resmi menjadi `RECEIVED`

Larangan:

- Tidak boleh menjalankan Step 7 use case pada:
  - PurchaseOrder yang masih dalam inspection
  - PurchaseOrder yang belum melalui Final Acceptance

**Status:**

- DESIGN LOCKED (ADR-0021)
- IMPLEMENTATION DEFERRED

**Catatan:**

- Step ini hanya boleh diimplementasikan setelah Step 7 selesai
- Step ini bersifat additive dan tidak merusak flow sebelumnya

---

## MVP Step 8 – Costing Engine (PLANNING)

**Tujuan utama:**
Menentukan harga pokok penjualan (COGS) secara deterministik tanpa mengubah histori.

**Cakupan awal:**

- Last Purchase Cost per ProductVariant
- CostState sebagai current cost aktif
- Cost snapshot pada saat transaksi
- Penyimpanan COGS di OrderItem
- Replacement margin internal (read-only)

**Batasan keras:**

- Tidak ada FIFO (tahap awal)
- Tidak ada retroactive recalculation
- Tidak ada edit cost manual
- Reporting tetap read-only

**Clarification:**

Step 8 tidak menggunakan Moving Average Cost.

Model resmi Step 8 adalah Last Purchase Cost per ProductVariant sesuai ADR-0022. Moving Average Cost ditunda sebagai future extension dan tidak boleh diimplementasikan pada Step 8

---

## MVP Step 9 – Accounting Domain (PLANNING)

**Tujuan utama:**
Mengaktifkan domain akuntansi formal sebagai evolusi sistem ke arah ERP.

**Cakupan:**

- Journal Entry (double-entry)
- General Ledger
- Trial Balance
- Period closing

**Batasan keras:**

- Tidak boleh edit transaksi lama
- Semua perubahan melalui adjustment entry
- Period yang sudah close tidak bisa diubah

---

## MVP Step 10 – Customer Activation (PLANNING)

**Tujuan utama:**
Mengaktifkan entitas Customer sebagai identitas sisi penjualan tanpa masuk ke domain CRM.

**Cakupan:**

- Customer entity (id, name, contact, status)
- Integrasi ke Sales (order dapat memiliki customerId)
- Riwayat transaksi per customer

**Batasan keras:**

- Tidak ada loyalty system
- Tidak ada CRM automation
- Tidak ada logika pembayaran di Customer

---

## MVP Step 11 – Master Data Governance (PLANNING)

**Tujuan utama:**
Menstabilkan master data agar audit-ready dan tidak merusak histori finansial.

**Cakupan:**

- Product lifecycle (ACTIVE | INACTIVE | ARCHIVED)
- Variant governance (SKU immutable)
- Price versioning
- Audit trail perubahan master data

**Batasan keras:**

- Tidak boleh hard delete jika ada histori
- Tidak boleh mengubah histori transaksi
- Semua perubahan harus tercatat

---

## MVP Step 12 – Operational Scaling & Performance (PLANNING)

**Tujuan utama:**
Menyiapkan sistem untuk skala penggunaan lebih besar tanpa mengubah domain.

**Cakupan:**

- Indexing strategy lanjutan
- Query optimization
- Pagination & batching
- Background job untuk reporting berat

**Batasan keras:**

- Tidak mengubah domain model
- Tidak memindahkan business rule ke infrastructure
- Tidak merusak boundary DDD

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
