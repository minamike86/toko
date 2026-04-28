# ADR-0008: Stock Origin Classification & Legacy Inventory Separation

## Status
Proposed

## Context

Sistem telah beroperasi dengan stok awal dan penyesuaian manual yang tidak memiliki histori pengadaan (kulaan). Stok tersebut berasal dari kondisi sebelum sistem aktif atau dari proses manual tanpa dokumen pendukung.

Di sisi lain, sistem direncanakan untuk mendukung **Procurement Domain** di masa depan, yang akan menghasilkan stok dengan histori pengadaan yang eksplisit dan dapat diaudit.

Tanpa pemisahan yang jelas antara stok legacy dan stok hasil pengadaan, sistem berisiko:
- menyajikan histori pembelian yang tidak pernah terjadi,
- mencampurkan stok warisan dengan stok hasil kulaan,
- dan menghasilkan laporan inventory yang tidak jujur secara historis.

## Decision Drivers

- Sistem sudah memiliki stok yang tidak memiliki histori kulaan.
- Procurement Domain belum diimplementasikan dan tidak boleh dipaksakan lebih awal.
- Inventory harus tetap menjadi satu-satunya sumber kebenaran kuantitas stok.
- Histori stok harus mencerminkan fakta, bukan asumsi atau rekonstruksi fiktif.

## Decision

Sistem mengklasifikasikan asal stok secara eksplisit pada setiap peristiwa perubahan stok.

Klasifikasi asal stok yang diakui:
- **LEGACY** – stok awal atau stok warisan tanpa histori pengadaan.
- **MANUAL_ADJUSTMENT** – penyesuaian operasional (koreksi, selisih, kehilangan).
- **PURCHASE** – stok hasil pengadaan melalui Procurement Domain (future).

Proses *initialize stock* secara konseptual diperlakukan sebagai **LEGACY**, bukan sebagai pembelian.

Klasifikasi ini bersifat deklaratif dan tidak dimaksudkan untuk merekonstruksi histori pembelian yang tidak pernah tercatat.

## Consequences

### Positif
- Histori stok menjadi jujur dan dapat ditelusuri.
- Stok legacy dan stok hasil pengadaan tidak tercampur.
- Aktivasi Procurement Domain di masa depan tidak menimbulkan konflik historis.
- Reporting inventory dapat membedakan asal stok secara eksplisit.

### Negatif
- Penambahan kompleksitas konseptual pada Inventory.
- Diperlukan migrasi atau penandaan awal untuk stok yang sudah ada.

## Dependency & Interaction

- ADR ini **tidak bergantung** pada ADR Payment Settlement.
- ADR ini **kompatibel** dengan ADR Product Variant.
- ADR ini menjadi **prasyarat konseptual** bagi aktivasi Procurement Domain.

Implementasi Procurement Domain **wajib** menggunakan klasifikasi `PURCHASE` dan tidak boleh digunakan untuk merepresentasikan stok legacy.

## Scope of Change

- Inventory domain (StockMovement / InventoryAdjustment).
- Dokumentasi arsitektur dan reporting inventory.

## Out of Scope

- Implementasi Procurement Domain.
- Pengelolaan supplier atau purchase order.
- Rekonstruksi histori pembelian lama.

## Follow-up Actions

1. Menambahkan atribut klasifikasi origin pada peristiwa perubahan stok.
2. Menandai proses *initialize stock* sebagai LEGACY.
3. Mendokumentasikan keterbatasan histori stok lama.
4. Lock ulang Step 1 & 2 setelah perubahan stabil.

