# MVP Step 3 – Reporting

**Status: FINAL – READY TO LOCK (NO IMPLEMENTATION YET)**

Dokumen ini mendefinisikan secara resmi ruang lingkup, prinsip, dan batasan **MVP Step 3 – Reporting**.
Dokumen ini adalah Lock Note resmi untuk MVP Step 3 dan menjadi rujukan utama scope dan prinsip reporting.

Dokumen ini **WAJIB dibaca bersama**:
- `/docs/03-mvp/internal-vs-fiscal-reporting.md`
- `/docs/03-mvp/architecture_test_specification_reporting_boundary.md`
- `/docs/03-mvp/reporting_boundary_and_testing_policy.md`

Reporting pada Step 3 **BERSIFAT INTERNAL DAN OPERASIONAL**, serta **BUKAN laporan fiskal atau akuntansi resmi**.

---

## 1. Tujuan Step 3

MVP Step 3 bertujuan menyediakan **visibilitas data bisnis** bagi owner dan manajemen tanpa:
- menambah aturan bisnis baru
- mengubah state domain
- memengaruhi MVP Step 1 dan Step 2

Step 3 bersifat **murni observasional**.

---

## 2. Prinsip Keras (Non‑Negotiable)

Prinsip berikut **mengikat secara desain**:

- Reporting **READ‑ONLY**
- Tidak ada write ke domain
- Tidak ada side effect
- Tidak ada reuse use case mutasi
- Tidak ada penguncian periode
- Data merepresentasikan **kebenaran saat query dijalankan**

Jika sebuah kebutuhan reporting memerlukan:
- aturan bisnis baru
- snapshot final
- period locking

maka kebutuhan tersebut **BUKAN scope Step 3**.

---

## 3. Posisi terhadap Laporan Pajak dan Akuntansi

Reporting pada Step 3:
- **BUKAN laporan pajak**
- **BUKAN laporan akuntansi resmi**
- **TIDAK dimaksudkan** untuk pelaporan ke negara

Konsekuensi sadar:
- Laporan periode lalu dapat berubah jika fakta transaksi berubah
- Output CSV tidak memiliki status "final" atau "locked"

Untuk perbedaan konseptual yang lebih lengkap, rujuk:
`internal-vs-fiscal-reporting.md`

---

## 4. Ruang Lingkup Reporting

### 4.1 Sales Reporting (Internal)

Disediakan laporan:
- Total penjualan per hari / minggu / bulan (**berdasarkan status PAID**)
- Total penjualan per channel (offline / online)
- Total penjualan cash vs credit (PAID only)
- Daftar order berdasarkan status
- Daftar order ON_CREDIT (piutang berjalan)
- Riwayat Pay Credit per periode

Aturan penting:
- Order dihitung sebagai penjualan **hanya jika berstatus PAID**
- Order ON_CREDIT **BUKAN penjualan**
- Order PAID yang dibatalkan dianggap **koreksi periode berjalan**

---

### 4.2 Inventory Reporting (Internal)

Disediakan laporan:
- Stok saat ini per produk (point‑in‑time)
- Riwayat stock movement
- Produk dengan stok rendah

Definisi stok rendah:
- Kondisi `stok <= threshold`
- Threshold adalah **konfigurasi sistem (write concern)**
- Threshold terakhir yang berlaku digunakan saat query
- Perubahan threshold **WAJIB memiliki audit trail**
- Laporan melihat **kondisi stok terakhir**, bukan histori melewati threshold

---

### 4.3 Catalog Reporting (Internal)

Disediakan laporan:
- Daftar produk aktif
- Produk tidak pernah terjual
- Catalog reporting bersifat observasional dan tidak menambah lifecycle atau aturan baru pada domain katalog.

Definisi penting:
- Produk dianggap "pernah terjual" **hanya jika memiliki Order berstatus PAID**
- Order CANCELED dan ON_CREDIT tidak dihitung sebagai penjualan

---

## 5. Arsitektur Reporting

### 5.1 Read Model

Reporting Step 3 menggunakan **read model terpisah**:

- Query langsung ke database
- Database view diperbolehkan dan dianggap bagian arsitektur resmi

Larangan:
- Tidak boleh reuse repository domain mutasi
- Tidak boleh mengubah entity domain

---

### 5.2 Lokasi Modul (Rencana)

```
src/modules/reporting/
  ├─ application
  ├─ queries
  ├─ dto
  └─ tests
```

Tidak ada:
- domain layer
- entity
- invariant

---

## 6. Testing Strategy Step 3

- Fokus pada integration test
- Validasi kebenaran query
- Database asli diperbolehkan
- Tidak perlu mock domain

Reporting test **TIDAK** bertujuan:
- menguji aturan bisnis
- mengunci angka historis

---

## 7. Out of Scope (Eksplisit)

Step 3 **TIDAK mencakup**:
- Pelaporan pajak
- Akuntansi
- Period locking
- Snapshot historis final
- Dashboard UI
- Export PDF / Excel
- Analytics lanjutan

---

## 8. Definition of Done (Step 3)

MVP Step 3 dianggap selesai jika:

1. Seluruh laporan bersifat read‑only
2. Tidak ada perubahan domain atau use case Step 1 & 2
3. Definisi penjualan konsisten (PAID only)
4. Threshold stok rendah bersifat mekanis dan auditable
5. Reporting tidak mengklaim finalitas fiskal
6. Seluruh keputusan ini terdokumentasi dan dirujuk

---

## 8. Operational Decisions (Design Locked)

Prisma Client & Reporting Test DB Strategy
(lihat: architecture/prisma-client-and-reporting-test-db-strategy.md)

Integration test database isolation for reporting follows the Schema-per-Suite strategy as defined in
architecture/integration-test-db-schema-per-suite.md.

### Implemented Reports (CLOSED)

- Credit Outstanding Report
- Credit Payment History Report
- Sales Summary Report
- Inventory Snapshot Report

Seluruh integration test hijau pada saat penutupan Step 3.
Reporting tetap bersifat read-only dan observasional.


## 9. Catatan Penutup

Step 3 sengaja dirancang **jujur dan tidak final**.

Kejujuran operasional adalah fondasi sistem ini.
Finalitas fiskal adalah tanggung jawab domain lain.

Jika kedua hal ini dicampur, sistem akan terlihat rapi di atas kertas tetapi rapuh di dunia nyata.

🔒 PATCH TAMBAHAN — INVENTORY REPORTING LOCK
Tambahkan section ini di bagian bawah dokumen lock note Step 3.

Inventory Reporting — DESIGN LOCKED
Inventory Reporting dalam MVP Step 3 dinyatakan DESIGN LOCKED dengan ruang lingkup berikut:

Implemented Reports
- InventorySnapshotReport
- InventoryMovementHistoryReport
- InventoryLowStockReport

Architectural Constraints (Enforced by Tests)
- Reporting layer bersifat read-only dan observasional.
- Tidak mengimpor domain entity atau invariant.
- Tidak mereuse use case Inventory.
- Query langsung ke database diperbolehkan.
- DTO reporting tidak bergantung pada domain type.
- Tidak ada implicit business rule.
- Tidak ada implicit limit.
- Semua ordering deterministik.
- Integration test menggunakan schema-per-suite strategy.
- Tidak ada any dalam reporting queries.
- Reporting tidak mengasumsikan enum movement type (schema masih String).

Behavior Guarantees
- InventorySnapshotReport:
- Mengembalikan satu baris per productId.
- Termasuk quantity = 0.
- Tidak mengembalikan produk tanpa inventoryItem record.
- Urut berdasarkan productId ASC.

InventoryMovementHistoryReport:
- Filter optional: productId, from, to.
- Range bersifat inclusive.
- Urut berdasarkan occurredAt ASC, lalu id ASC.
- Tidak ada implicit limit.

InventoryLowStockReport:
- Threshold wajib diberikan.
- Mengembalikan quantity <= threshold.
- Threshold negatif → empty array.
- Urut berdasarkan quantity ASC, lalu productId ASC.
- Tidak memiliki default threshold tersembunyi.

Non-Goals
- Tidak ada perhitungan ulang stok dari movement.
- Tidak ada validasi konsistensi domain.
- Tidak ada transformasi atau agregasi bisnis tambahan.
- Tidak ada enum enforcement pada movement type.
- Tidak ada interpretasi fiskal.

Inventory Reporting dianggap stabil dan tidak boleh diubah tanpa dokumen perubahan arsitektur (ADR) yang eksplisit.

Status Final
Sekarang Step 3 secara realistis bisa dianggap matang.

Kamu sudah punya:
Domain separation yang jelas
Reporting boundary yang benar-benar teruji
Integration isolation stabil
Deterministic ordering di semua report
Tidak ada flakiness

Ini bukan lagi eksperimen. Ini fondasi.
Kalau nanti kamu kembali dan bertanya “kenapa dulu saya tidak reuse use case?”, jawabannya sudah terkunci di dokumen.