# Inventory Reporting – Design & Integration Test Plan

**MVP Step 3 – Reporting**  
**Status: DESIGN DRAFT → TO BE LOCKED**

Dokumen ini mendefinisikan desain awal dan rencana integration test untuk Inventory Reporting pada MVP Step 3. Fokusnya observasional, read-only, dan sepenuhnya terpisah dari domain Inventory/Sales.

---

## Tujuan

Menyediakan laporan inventory berbasis data historis dan posisi terkini yang:
- read-only
- tidak menjalankan use case Inventory
- tidak mengubah state apa pun
- dapat dihasilkan langsung dari database (query / view)

Inventory Reporting **bukan** alat rekonsiliasi domain dan **bukan** pengganti invariant Inventory.

---

## Boundary & Aturan Keras

Berlaku seluruhnya dari dokumen Reporting Boundary:

- Tidak import domain entity Inventory
- Tidak reuse use case Inventory
- Tidak menghitung ulang invariant (mis. saldo lewat domain)
- Query langsung ke database diperbolehkan
- DTO reporting tidak bergantung domain type

Semua pelanggaran boundary dianggap **BUG arsitektural**.

---

## Lingkup Report Inventory (MVP)

### 1. Inventory Snapshot Report (WAJIB)

Laporan posisi inventory **saat ini** per produk.

Field minimum:
- productId
- quantity

Catatan:
- Quantity diambil langsung dari tabel inventoryItem
- Tidak menghitung dari stockMovement

---

### 2. Inventory Movement Summary (OPSIONAL MVP, DISARANKAN)

Ringkasan pergerakan inventory dalam rentang waktu.

Field minimum:
- productId
- totalIn
- totalOut
- totalAdjust

Catatan:
- Diambil dari stockMovement
- Tidak menghitung saldo akhir

---

## Yang TIDAK Termasuk

- FIFO / costing
- Rekonsiliasi stockMovement vs inventoryItem
- Forecast stock
- Negative stock analysis

Semua ini **out of scope** untuk MVP Step 3.

---

## Struktur File (Direncanakan)

```
src/modules/reporting/
  inventory/
    inventory-snapshot.query.ts
    inventory-movement-summary.query.ts (opsional)

src/modules/reporting/tests/integration/
  inventory-snapshot.integration.test.ts
  inventory-movement-summary.integration.test.ts (opsional)

src/modules/reporting/tests/helpers/
  seedInventoryReportingScenario.ts
```

---

## Strategi Integration Test

### Prinsip Umum

- Setiap test memakai reporting schema (schema-per-suite)
- Data disiapkan via seed helper khusus reporting
- Tidak ada cleanup manual
- Test bersifat deterministik

---

### Inventory Snapshot – Test Cases (WAJIB)

1. Produk dengan quantity > 0 muncul
2. Produk dengan quantity = 0 tetap muncul
3. Produk tanpa inventoryItem **tidak muncul**

Test tidak peduli asal-usul stock.

---

### Inventory Movement Summary – Test Cases (OPSIONAL)

1. IN / OUT / ADJUST dijumlahkan terpisah
2. Movement di luar date range tidak dihitung
3. Produk tanpa movement tidak muncul

---

## Seed Strategy (Reporting Only)

Seed dilakukan langsung ke tabel:
- inventoryItem
- stockMovement

Aturan:
- Helper bersifat skenario
- Tidak dipakai lintas module
- Boleh non-generik

---

## Kriteria Siap LOCK

Inventory Reporting dianggap siap dikunci jika:
- Integration test hijau
- Tidak ada import domain Inventory
- Query sederhana & dapat dijelaskan
- Tidak ada logika bisnis tersembunyi

---

## Status

DESIGN DRAFT – lanjutkan ke penulisan integration test Inventory Snapshot terlebih dahulu.

