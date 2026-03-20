# Paket ADR + MVP Steps (Security → Customer → Procurement → Accounting Lite)

**Location Recommendation:**
- ADR: `/docs/09-decisions/`  
- MVP plan: `/docs/03-mvp/` (atau update `mvp_stages_overview.md` sesuai format kamu)

Dokumen ini berisi draft **4 ADR** sekaligus + **urutan MVP Steps** agar roadmap sinkron dan tidak tumpang tindih.

---

## ADR-0015 – Authentication & Role Enforcement Activation

**Status:** PROPOSED (Ready to Lock)  
**Date:** 2026-02-15  
**Decision Owner:** Product/Engineering Owner

### Context
Sistem sudah memiliki fitur operasional yang sensitif:
- Maintenance toggle
- Backup/restore
- Mutation guard

Namun actor masih bisa hardcoded dan proteksi admin route belum disiplin. Ini membuka risiko:
- Endpoint admin dapat disalahgunakan
- Audit trail tidak valid karena actor tidak nyata
- Role enforcement bocor ke UI atau domain jika tidak dipaku sejak awal

### Decision
Aktifkan Authentication & Role Enforcement minimal untuk kebutuhan operasional toko:

1. **Session-based auth** (recommended untuk MVP kecil) menggunakan Next.js + cookie session.
2. Role minimal: `ADMIN | SALES | WAREHOUSE`.
3. Semua endpoint `/api/admin/*` dan halaman `/admin/*` **wajib protected**.
4. ActorContext diambil dari auth layer dan diteruskan ke use case:
   - `actorId`
   - `actorRole`
5. Role check **hanya** di application layer (use case / guard), **bukan** di domain entity.

### Options Considered
- **A. Session-based** (dipilih): sederhana, cocok fullstack Next.js, minim complexity.
- **B. JWT**: cocok multi-client, tapi lebih banyak permukaan risiko dan plumbing.
- **C. Tanpa auth, hanya "admin page"**: ditolak, tidak aman (sudah ada tombol yang bisa mematikan sistem).

### Consequences
**Positive**
- Admin area aman
- ActorId nyata di audit
- Boundary tetap bersih

**Negative / Tradeoff**
- Perlu seed user awal
- Perlu middleware auth dan role guard

### Implementation Notes
- Tambah module `user` minimal (sudah ada desainnya)
- Middleware Next.js untuk `/admin` dan `/api/admin`
- Helper `requireRole(role)` di application layer
- Hard rule: no auth/role logic inside domain entities

### Definition of Done
- Login minimal berjalan
- `/admin/system` tidak bisa diakses tanpa login
- `/api/admin/maintenance` reject non-admin
- Semua mutation use case menerima ActorContext

---

## ADR-0016 – Customer Domain Activation

**Status:** PROPOSED (Ready to Lock)  
**Date:** 2026-02-15

### Context
Sistem toko membutuhkan:
- Identitas pelanggan
- Kredit per pelanggan (bisa ngutang, cicil)
- Credit limit
- Riwayat pembelian (read model)
- Aging receivable sebagai reporting layer

Jika Customer tidak distabilkan lebih awal, fitur kredit akan tersebar di Sales tanpa identitas yang rapi.

### Decision
Aktifkan Customer Domain minimal:

1. **Customer Aggregate** (write model) hanya menyimpan data operasional:
   - `id`, `name`, `phone?`, `isActive`
   - `creditLimit` (integer, Rupiah)
2. **Sales Order** menyimpan `customerId?` (nullable untuk transaksi tanpa customer).
3. Validasi kredit dilakukan di application layer (pre-check) menggunakan:
   - Outstanding credit per customer (read model / query)
   - Credit limit (write model Customer)
4. **Riwayat pembelian** dan "pernah beli apa" adalah **read model** (reporting query), bukan field list di Customer.
5. **Aging receivable** berada di reporting layer, bukan ADR (karena implementasi reporting detail). ADR ini hanya mengaktifkan domain dan aturan integrasi.

### Options Considered
- **A. Customer menyimpan list orders**: ditolak (bikin write model gemuk dan bocor cross-domain).
- **B. Customer hanya di UI**: ditolak (tidak enforceable, tidak reliable untuk kredit).
- **C. Customer minimal + read model untuk history** (dipilih).

### Consequences
**Positive**
- Kredit dan cicilan bisa ditautkan dengan jelas
- Boundary Sales vs Reporting tetap bersih

**Tradeoff**
- Perlu query/report untuk history

### Implementation Notes
- Model `Customer`
- Sales Order tambah `customerId?`
- Endpoint CRUD minimal Customer
- Reporting: desain `customer_aging_receivable_design.md` + query implementations

### Definition of Done
- Customer CRUD
- Order bisa terkait customer
- Credit limit tersimpan
- Pre-check order kredit tidak melewati limit

---

## ADR-0017 – Procurement Activation

**Status:** PROPOSED (Ready to Lock)  
**Date:** 2026-02-15

### Context
Inventory real-world butuh supply-side flow:
- Supplier
- Purchase order
- Receive stock berdasarkan pembelian
- Retur pembelian
- Hutang ke supplier

Namun Accounting penuh belum aktif, sehingga procurement harus tetap operasional tanpa double-entry.

### Decision
Aktifkan Procurement Domain minimal sebagai operational layer untuk supply:

1. Entity/aggregate minimal:
   - `Supplier`
   - `PurchaseOrder` (PO)
   - `PurchaseOrderItem`
   - `PurchasePayment` (pembayaran hutang supplier)
   - `PurchaseReturn` (retur pembelian)
2. ReceiveStock harus dapat di-reference ke PO:
   - StockMovement `reason=IN` dengan `referenceId=poId`
3. Hutang supplier dihitung dari:
   - PO total - payment total - return credit
4. Tidak ada jurnal akuntansi otomatis di tahap ini (non-goal).

### Options Considered
- **A. Procurement langsung accounting**: ditolak (terlalu besar, rawan tumpang tindih).
- **B. Procurement operational terlebih dahulu** (dipilih).

### Consequences
**Positive**
- Supply flow nyata
- Stock IN punya asal yang jelas

**Tradeoff**
- Laporan laba rugi masih internal, belum ledger formal

### Implementation Notes
- Domain procurement terpisah
- Integrasi ke inventory via StockMovement reference
- Reporting hutang supplier sebagai report

### Definition of Done
- Supplier CRUD
- Create PO + receive
- Supplier outstanding debt report

---

## ADR-0018 – Accounting Lite (Operational Ledger)

**Status:** PROPOSED (Ready to Lock)  
**Date:** 2026-02-15

### Context
Setelah Customer (receivable) dan Procurement (payable) stabil, sistem butuh:
- Margin calculation
- Laporan laba rugi internal
- FIFO/LIFO costing
- Journal entry minimal (immutable)

Namun sistem belum perlu menjadi ERP akuntansi penuh (fiscal reporting vs internal reporting sudah dipisah).

### Decision
Bangun Accounting Lite sebagai layer operasional:

1. Semua transaksi tetap immutable.
2. Ledger/journal entry dibuat sebagai event/entry, tidak mengubah histori transaksi.
3. Costing method: pilih default (mis. FIFO) namun configurable (future).
4. Laba rugi = derived report dari:
   - Sales (revenue)
   - COGS (costing)
   - Purchase returns/adjustments
5. Fiscal reporting tetap non-goal pada tahap ini.

### Options Considered
- **A. Full accounting domain**: ditolak (ruang lingkup terlalu besar).
- **B. Accounting lite (dipilih)**.

### Consequences
**Positive**
- P&L internal tersedia
- Margin lebih akurat

**Tradeoff**
- Tidak otomatis memenuhi aturan pajak

### Implementation Notes
- Model `JournalEntry` immutable
- Rule mapping dari Sales/Procurement ke journal minimal
- Report P&L internal

### Definition of Done
- Costing method berjalan untuk laporan
- P&L internal bisa ditarik
- Tidak ada overwrite histori

---

# MVP Steps Proposal (Setelah Fondasi Operasional)

Urutan ini menjaga nilai bisnis naik bertahap dan mencegah tumpang tindih.

## Step A – Security Activation (Operational Safety)
- Implement ADR-0015
- Auth + role enforcement
- Protect `/admin/*` dan `/api/admin/*`

## Step B – Customer Activation (Demand Side)
- Implement ADR-0016
- Customer CRUD
- Credit limit + outstanding + aging receivable report

## Step C – Procurement Activation (Supply Side)
- Implement ADR-0017
- Supplier + PO + receive + supplier debt

## Step D – Accounting Lite (Internal ERP Layer)
- Implement ADR-0018
- Costing + margin + P&L internal + journal minimal

---

# Placement & Split Policy

Setelah dokumen ini disetujui, pecah menjadi file-file berikut:

- `/docs/09-decisions/ADR-0015-auth-role-enforcement.md`
- `/docs/09-decisions/ADR-0016-customer-domain-activation.md`
- `/docs/09-decisions/ADR-0017-procurement-activation.md`
- `/docs/09-decisions/ADR-0018-accounting-lite-operational-ledger.md`

Dan MVP steps dimasukkan ke:
- `/docs/03-mvp/blueprint_step_7_10_operational_to_erp.md` (jika itu pusat blueprint)
- atau patch ke `mvp_stages_overview.md` sesuai format stage yang kamu pakai.

