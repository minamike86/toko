# ADR-0013 – Introduce Procurement Domain

**Status:** ACCEPTED (PLANNED – FUTURE ACTIVATION)
**Date:** 2026-02-14
**Supersedes:** None
**Related:**
- MVP Step 6 – Procurement & Cost Foundation
- ADR-0008 – Stock Origin Classification
- MVP Step 4 – Domain Hardening
- MVP Step 5 – Operational Dashboard

---

## 1. Context

Setelah MVP Step 1–5 selesai dan stabil, sistem telah memiliki:

- Transaksi penjualan (Sales Domain)
- Manajemen stok (Inventory Domain)
- Pelacakan asal stok melalui StockMovement.origin
- Reporting read-only yang deterministik
- Dashboard operasional tanpa rule bisnis baru

Namun, sistem belum memiliki sumber kebenaran formal untuk:

- Histori pembelian barang
- Harga kulak per transaksi
- Relasi eksplisit dengan supplier

Saat ini penambahan stok dilakukan melalui:
- initialize stock
- receive stock manual
- adjustment

Pendekatan ini cukup untuk fase awal, tetapi tidak memadai untuk:
- Pelacakan histori pembelian jangka panjang
- Persiapan perhitungan margin
- Transparansi supply chain

Karena itu diperlukan domain baru yang secara eksplisit menangani sisi supply.

---

## 2. Decision

Diputuskan untuk memperkenalkan **Procurement Domain** sebagai domain baru yang aktif pada:

> MVP Step 6 – Procurement & Cost Foundation

Procurement Domain akan:

- Mengelola Supplier
- Mengelola Purchase Order
- Mengelola Purchase Item
- Menyimpan unit cost pembelian
- Menghasilkan StockMovement dengan origin = PURCHASE

Procurement Domain:

- TIDAK menggantikan Inventory
- TIDAK menggantikan Sales
- TIDAK mengubah reporting boundary
- TIDAK memperkenalkan accounting penuh

Inventory tetap menjadi satu-satunya sumber kebenaran jumlah stok.

---

## 3. Architectural Position

High-level separation:

Supply Side:
- Procurement Domain

Core Operational:
- Inventory Domain
- Sales Domain

Observation:
- Reporting
- Dashboard

Procurement berinteraksi dengan Inventory hanya melalui mekanisme resmi:

> InventoryService / StockMovement (origin = PURCHASE)

Procurement tidak:
- Mengubah InventoryItem secara langsung
- Menulis ke tabel Inventory di luar boundary

---

## 4. Scope of Implementation (Step 6)

### 4.1 Entities (Conceptual)

- Supplier
- PurchaseOrder
- PurchaseItem

### 4.2 Core Rules

- PurchaseOrder berstatus: CREATED | RECEIVED | CANCELED
- Stok hanya bertambah ketika PurchaseOrder berstatus RECEIVED
- Unit cost disimpan di PurchaseItem
- Inventory tidak menyimpan supplier atau cost

---

## 5. Explicit Non-Goals

Step 6 TIDAK mencakup:

- Hutang ke supplier
- Payment pembelian
- Retur pembelian
- Margin calculation
- Laporan laba rugi
- FIFO / LIFO costing
- Accounting journal

Fitur tersebut akan dipertimbangkan pada fase Accounting Domain terpisah.

---

## 6. Boundary Protection

Untuk menjaga konsistensi arsitektur:

1. Procurement adalah domain terpisah, bukan ekstensi Inventory.
2. Reporting tetap read-only dan tidak mengambil logika costing.
3. Tidak ada modifikasi pada kontrak Sales.
4. Tidak ada perubahan pada invariant Inventory.
5. Aktivasi Procurement tidak boleh memecah test Step 1–5.

---

## 7. Migration & Legacy Handling

- Stok lama sebelum aktivasi Procurement tetap dianggap legacy.
- Tidak dilakukan rekonstruksi histori pembelian lama.
- Legacy stock tetap memiliki origin INITIAL_STOCK atau UNKNOWN.

Transisi dari legacy ke procurement mengikuti prinsip di ADR-0008.

---

## 8. Consequences

### Positive

- Histori pembelian tercatat dengan jelas
- Fondasi cost awareness tersedia
- Evolusi ke margin calculation lebih terkontrol
- Supply chain menjadi eksplisit

### Trade-offs

- Kompleksitas domain bertambah
- Memerlukan integration test tambahan
- Memerlukan boundary test baru

Namun kompleksitas ini terisolasi dan tidak merusak domain lama.

---

## 9. Activation Criteria

Procurement Domain diaktifkan jika:

- Step 4 dan Step 5 telah stabil
- Tidak ada mismatch snapshot vs movement
- Reporting tetap deterministik

---

## 10. Governance

- Perubahan terhadap domain ini wajib melalui ADR baru.
- Perubahan yang memengaruhi Inventory atau Sales dianggap BREAKING.
- Tidak boleh ada fitur procurement kecil yang diselipkan ke Inventory.

---

## 11. Final Statement

Procurement Domain diperkenalkan sebagai ekspansi supply-side yang disiplin.

Domain ini tidak membuat sistem menjadi sistem akuntansi.
Domain ini hanya memastikan bahwa pembelian barang memiliki tempat yang benar dalam arsitektur.

Dengan ADR ini, roadmap MVP dan struktur domain tetap sinkron dan tidak tumpang tindih.

