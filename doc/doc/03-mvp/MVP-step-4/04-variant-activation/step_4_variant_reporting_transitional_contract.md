# Step 4 – Variant Activation ↔ Reporting Transitional Contract

**Status:** DESIGN LOCKED  
**Scope:** MVP Step 4 (Variant Activation)  
**Affects:** Reporting (Step 3), Step 5 Dashboard Preparation  
**Non-Breaking Target:** MVP Step 1, Step 2, Step 3  

---

## 1. Tujuan Dokumen

Dokumen ini mengunci kontrak transisi antara:

- MVP Step 4.3 – Product & Variant Activation (write model)
- MVP Step 3 – Reporting (read model)
- MVP Step 5 – Operational Dashboard

Tujuan utama:
- Mencegah inkonsistensi reporting pasca aktivasi variant
- Menghindari double counting
- Menghindari fallback implisit ke product-level

Dokumen ini bersifat **mengikat**.

---

## 2. Perubahan Fundamental Step 4.3

Setelah Step 4.3 selesai:

- InventoryItem berada di level `variantId`
- OrderItem mereferensikan `variantId`
- Product bukan lagi unit stok terkecil
- Tidak ada stok di level product

Implikasi:
> Variant menjadi unit stok dan transaksi paling granular.

---

## 3. Dampak terhadap Reporting Step 3

Reporting Step 3 sebelumnya diasumsikan product-level.

Setelah aktivasi variant:

### 3.1 InventorySnapshotReport

Wajib:
- Primary grouping berdasarkan `variantId`
- Snapshot membaca stok dari InventoryItem berbasis variant

Boleh:
- Menyediakan agregasi turunan ke level product (GROUP BY productId)

Dilarang:
- Menghitung stok langsung dari productId
- Mengabaikan variant dalam agregasi

---

### 3.2 InventoryMovementHistoryReport

Wajib:
- Movement direferensikan ke `variantId`
- Tidak ada fallback ke productId

Jika terdapat data lama tanpa variant:
- Harus sudah dimigrasi
- Tidak boleh ditangani dengan conditional logic di reporting

---

### 3.3 LowStockReport

Threshold berlaku:
- Per variant
- Bukan per product

Jika threshold sebelumnya product-level:
- Migrasi threshold harus dilakukan sebelum Step 5

Jika Product memiliki lowStockThreshold sebelum Variant Activation,
dan Product memiliki N variant, maka:

1. Setiap variant mewarisi threshold yang sama dengan Product pada saat migrasi.
2. Setelah migrasi selesai, threshold di level Product dianggap deprecated.
3. Tidak boleh ada ProductVariant tanpa threshold.
4. LowStockReport hanya membaca threshold di level variant.


---

## 4. Dual-Read Strategy (Transisi Sementara)

Selama fase migrasi (variant_migration_roadmap_step_4_3.md):

Reporting diperbolehkan melakukan dual-read terbatas dengan syarat:

- Bersifat sementara
- Tidak menghasilkan double count
- Tidak memunculkan entitas duplikat

Dual-read berakhir ketika seluruh kondisi berikut terpenuhi:

### Exit Criteria (WAJIB)

1. Tidak ada `InventoryItem.productId` tersisa
2. Tidak ada `OrderItem` tanpa `variantId`
3. Tidak ada conditional query berbasis product fallback
4. Semua integration test reporting lulus tanpa mode kompatibilitas

Setelah kondisi di atas terpenuhi:
> Semua fallback logic WAJIB dihapus.

---

## 5. Larangan Keras

Reporting Step 3 dan Step 5 DILARANG:

- Menyembunyikan variant demi menyederhanakan tampilan
- Menggabungkan variant tanpa agregasi eksplisit
- Mengasumsikan satu product hanya memiliki satu variant

Jika kebutuhan UI membutuhkan simplifikasi:
- Dilakukan melalui agregasi eksplisit di reporting layer
- Bukan melalui perubahan write model

---

## 6. Hubungan dengan Step 5 – Dashboard

Dashboard Step 5:

- Hanya membaca reporting
- Tidak boleh query langsung ke tabel inventory
- Tidak boleh bypass variant granularity

Jika dashboard menampilkan stok per product:
- Itu adalah hasil agregasi reporting
- Bukan sumber data primer

---

## 7. Status & Governance

Dokumen ini menjadi prasyarat:

- Step 4 tidak dianggap selesai jika reporting belum selaras
- Step 5 tidak boleh dimulai sebelum exit criteria terpenuhi

Perubahan terhadap dokumen ini wajib melalui ADR.

---

## Penutup

Variant Activation adalah perubahan struktural write model.

Reporting wajib mengikuti perubahan ini secara eksplisit.

Jika reporting tetap product-centric setelah variant aktif,
maka sistem sedang hidup dalam dua realitas sekaligus.

