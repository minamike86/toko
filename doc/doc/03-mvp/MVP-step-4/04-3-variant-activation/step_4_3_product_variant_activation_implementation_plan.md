# Step 4.3 – Product & Variant Activation Implementation Plan

Status: DRAFT FOR IMPLEMENTATION  
Phase: MVP Step 4.3  
Scope: Catalog, Sales, Inventory, Reporting Compatibility  
Type: Implementation Plan

---

## 1. Tujuan

Step 4.3 bertujuan untuk mengaktifkan model `Product` dan `ProductVariant` secara resmi sehingga:

- stok berpindah ke level `variantId`
- transaksi penjualan (`OrderItem`) mereferensikan `variantId`
- SKU menjadi identitas operasional nyata
- sistem tetap kompatibel secara transisional dengan hasil Step 1–4.2
- reporting Step 3 tetap deterministik dan read-only selama masa transisi

Step ini **bukan**:

- redesign reporting
- redesign inventory movement
- accounting
- multi-gudang
- attribute engine kompleks

Tujuan Step 4.3 telah dikunci pada MVP Step 4 sebagai:

- `Product` entity resmi
- `ProductVariant` entity resmi
- `InventoryItem` pindah ke `variantId`
- `OrderItem` refer ke `variantId`  
Ref: `mvp_stages_overview.md`

---

## 2. Prinsip Implementasi

1. Step 4.3 bersifat **identity migration**, bukan feature expansion.
2. Write model aktif hanya boleh memiliki **satu identity utama** per fase.
3. Transisi dilakukan bertahap, additive lebih dulu, cleanup kemudian.
4. Reporting Step 3 tetap read-only dan hanya boleh beradaptasi di query layer.
5. Stock movement tetap immutable.
6. Histori lama tidak di-rewrite demi “kerapian”.
7. Tidak ada dual-write.
8. Dual-read hanya boleh sementara dan hanya di reporting/query layer jika diperlukan.

---

## 3. Keputusan Model Domain

### 3.1 Product

`Product` adalah entitas katalog induk.

Field minimal:

- `id`
- `name`
- `brand`
- `isActive`

Catatan:

- `Product` tidak menjadi unit stok
- `Product` tidak menjadi unit transaksi
- `Product` adalah grouping katalog dan identitas bisnis tingkat atas

### 3.2 ProductVariant

`ProductVariant` adalah unit stok dan unit transaksi.

Field minimal:

- `id`
- `productId`
- `sku`
- `variantName`
- `unit`
- `sizeLabel` (opsional)
- `colorLabel` (opsional)
- `basePrice`
- `isActive`

Catatan:

- `sku` wajib menjadi identitas operasional nyata
- `ProductVariant` adalah sumber referensi untuk `InventoryItem` dan `OrderItem`
- model variant pada Step 4.3 bersifat **simple variant**, bukan attribute engine generik

### 3.3 Batasan Model

Step 4.3 **tidak** memperkenalkan:

- variant attribute table generik
- matrix attribute engine
- pricing rule engine
- promotion logic
- costing logic

Jika kebutuhan tersebut muncul, harus masuk step / ADR terpisah.

---

## 4. Keputusan Identitas Data

### 4.1 Kondisi Saat Ini

Schema saat ini masih berbasis `productId` pada:

- `InventoryItem`
- `OrderItem`
- `StockMovement`

### 4.2 Target Akhir Step 4.3

Write model aktif harus menjadi:

- `InventoryItem.variantId`
- `OrderItem.variantId`

`StockMovement`:

- histori lama tetap historis
- movement baru mendukung `variantId` secara transisional sesuai roadmap

### 4.3 Aturan Transisi

- `productId` tidak dihapus pada fase awal
- `variantId` ditambahkan secara additive lebih dulu
- semua product lama wajib memiliki **default variant**
- semua referensi lama dibackfill ke default variant
- write path baru wajib menggunakan `variantId` setelah switch phase aktif
- cleanup penghapusan `productId` dilakukan hanya setelah seluruh gate lulus

---

## 5. Strategi Migrasi Data

## Phase A — Introduce Catalog Structure (Non-Breaking)

### Tujuan

Menambahkan struktur `Product` dan `ProductVariant` tanpa mengubah write flow lama.

### Perubahan

- Tambah model `Product`
- Tambah model `ProductVariant`
- Tambah `variantId` nullable ke:
  - `InventoryItem`
  - `OrderItem`
  - `StockMovement` (sesuai roadmap transisi)
- Tambah index dan FK yang relevan

### Constraint

- Use case lama belum diubah
- Reporting lama belum diubah
- Tidak ada dual-write

### Exit Criteria

- Migration additive sukses
- Semua test existing tetap hijau
- Tidak ada perilaku runtime yang berubah

---

## Phase B — Backfill Default Variant

### Tujuan

Menjamin setiap data product lama memiliki pasangan variant yang valid.

### Aturan

- Untuk setiap product lama, buat tepat satu `default variant`
- Default variant menjadi jembatan semua data legacy
Default variant harus memenuhi:
- SKU unik (misal: <productId>-DEFAULT)
- variantName merepresentasikan product legacy
- isActive = true saat dibuat

### Backfill

- `InventoryItem.variantId = defaultVariant(productId)`
- `OrderItem.variantId = defaultVariant(productId)`
- `StockMovement.variantId` hanya diisi bila strategi roadmap memerlukannya untuk data baru; histori lama tidak di-rewrite massal

### Constraint

- Tidak boleh ada product tanpa variant
- Tidak boleh ada `OrderItem` legacy yang kehilangan relasi identitas
- Tidak boleh rewrite histori movement lama

### Exit Criteria

- Semua product memiliki minimal satu variant
- Semua `InventoryItem` memiliki `variantId`
- Semua `OrderItem` memiliki `variantId`
- Query validasi migration lulus

---

## Phase C — Switch Write Model to Variant

### Tujuan

Mengalihkan seluruh write path aktif ke `variantId`.

### Scope Use Case

Minimal terdampak:

- CreateOrder
- CancelOrder
- InitializeStock
- ReceiveStock
- AdjustStock
- IssueStock

### Perubahan

- Input use case operasional aktif menggunakan `variantId`
- Snapshot order item diambil dari ProductVariant saat pembuatan order
- Setelah tersimpan, snapshot menjadi immutable dan tidak di-resolve ulang dari ProductVariant
- Inventory mutation aktif berjalan terhadap `variantId`
- Stock snapshot aktif berada di `InventoryItem.variantId`

### Constraint

- Tidak ada dual-write `productId + variantId`
- Domain inventory tidak berubah perilakunya selain identity
- Pattern snapshot + movement tetap dipertahankan
- Step 4.3 tidak boleh mengubah invariant Step 4.1 dan Step 4.2

### Exit Criteria

- Tidak ada write mutation baru yang bergantung pada `productId`
- Semua application/use case test hijau
- Semua integration test hijau

---

## Phase D — Reporting Transitional Compatibility

### Tujuan

Menjaga Reporting Step 3 tetap deterministik selama transisi identity.

### Aturan Keras

- Tidak mengubah boundary reporting
- Tidak mengimpor domain baru
- Tidak menambah business rule
- Adaptasi hanya boleh dilakukan di query layer

### Kebijakan

- Dual-read **boleh sementara** hanya di query reporting
- Tujuannya hanya untuk kompatibilitas transisional
- Tidak boleh menyebabkan double count
- Tidak boleh menjadi kontrak permanen
- Dual-read logic wajib dilindungi oleh mekanisme yang dapat dihapus (feature flag / query guard)
- Dual-read tidak boleh menjadi bagian permanen dari query reporting
- Setelah exit criteria terpenuhi, seluruh fallback logic WAJIB dihapus
- Dual-read harus memiliki exit checklist eksplisit sebelum Phase E
- Tidak boleh dihapus tanpa verifikasi reporting parity

### Area yang perlu dicek

- inventory snapshot reporting
- inventory movement reporting
- sales summary yang membaca order item
- low stock future compatibility

### Exit Criteria

- Reporting snapshot & movement tetap deterministik
- Reporting boundary test tetap lulus
- Architecture test tetap hijau
- Tidak ada fallback transisional tersisa setelah cleanup final

---

## Phase E — Cleanup & Lock

### Tujuan

Membersihkan jejak legacy setelah seluruh write path dan reporting stabil.

### Cleanup Target

- hapus dependensi aktif pada `productId` di `InventoryItem`
- jadikan `OrderItem.variantId` mandatory final
- hapus fallback query transisional yang sudah tidak diperlukan
- evaluasi kebutuhan `StockMovement.productId` untuk histori vs kontrak final

### Constraint

- Cleanup hanya dilakukan setelah:
  - migration valid
  - reporting valid
  - integration tests valid
  - governance gates valid

### Exit Criteria

- Tidak ada `InventoryItem.productId` aktif tersisa
- Tidak ada `OrderItem` tanpa `variantId`
- Reporting tidak lagi membutuhkan dual-read fallback
- Step 4.3 siap dinyatakan complete

---

## 6. Perubahan Schema yang Direncanakan

### 6.1 Model Baru

#### Product

- `id`
- `name`
- `brand`
- `isActive`
- timestamp standar bila diperlukan

#### ProductVariant

- `id`
- `productId`
- `sku`
- `variantName`
- `unit`
- `sizeLabel?`
- `colorLabel?`
- `basePrice`
- `isActive`
- timestamp standar bila diperlukan

### 6.2 Tabel Existing

#### InventoryItem

- tambah `variantId`
- migrasi identity aktif dari `productId` ke `variantId`

#### OrderItem

- tambah `variantId`
- write model aktif berpindah ke `variantId`
- snapshot tetap immutable

#### StockMovement

- pertahankan immutable
- dukung `variantId` untuk movement baru sesuai phase roadmap
- Setiap movement baru harus memiliki variantId non-null
- movement lama tetap menggunakan productId sebagai histori
- movement baru WAJIB menggunakan variantId sebagai identity utama
- productId tidak digunakan lagi dalam mutation baru
- histori lama tidak di-rewrite

---

## 7. Dampak terhadap Domain

### 7.1 Catalog Domain

- resmi memiliki `Product`
- resmi memiliki `ProductVariant`
- product adalah container katalog
- variant adalah SKU operasional

### 7.2 Sales Domain

- `OrderItem` aktif mereferensikan `variantId`
- OrderItem tetap menyimpan snapshot:
  - productNameSnapshot
  - unitSnapshot
  - unitPriceSnapshot
- Snapshot tidak boleh di-resolve ulang dari ProductVariant saat membaca data historis
- domain sales tidak menjadi pemilik stok

### 7.3 Inventory Domain

- stock aktif berada pada `variantId`
- movement tetap immutable
- pattern snapshot + movement tetap sama
- tidak ada event sourcing

### 7.4 Reporting

- tetap read-only
- hanya adaptasi query
- tidak boleh menjadi domain baru
- tidak boleh mengimpor use case mutasi

---

## 8. Strategi Testing

### 8.1 Domain Test

- test entity baru `Product`
- test entity baru `ProductVariant`
- test invariant SKU / activation / snapshot bila ada

### 8.2 Application / Use Case Test

- CreateOrder membaca variant, bukan product lama
- Inventory mutation aktif memakai `variantId`
- Negative cases:
  - variant inactive
  - variant not found
  - variant mismatch jika ada

### 8.3 Integration Test

- migration backfill default variant
- create order dengan variant
- stock mutation by variant
- cancel order terhadap variant-based stock
- reporting transitional query validation
- seluruh test DB tetap serial sesuai policy

### 8.4 Architecture / Boundary Test

- reporting boundary tetap lulus
- application layer tidak import Prisma
- domain tidak tahu Prisma
- tidak ada kebocoran identity migration ke layer yang salah

---

## 9. Governance Constraints

Step 4.3 tidak boleh:

- mengubah Reporting Step 3 menjadi write-aware
- mengubah Payment settlement Step 4.2
- mengubah Stock Origin Step 4.1
- memperkenalkan accounting atau costing
- menambahkan multi-gudang
- menambahkan attribute engine generik
- mengubah inventory movement menjadi mutable

---

## 10. Definition of Done — Step 4.3

Step 4.3 dianggap selesai jika:

### Technical

- `Product` resmi aktif
- `ProductVariant` resmi aktif
- semua product lama punya default variant
- `InventoryItem` aktif berada pada `variantId`
- `OrderItem` aktif berada pada `variantId`
- write path aktif tidak lagi memakai `productId`
- seluruh migration dan backfill tervalidasi
- seluruh integration test hijau

### Governance

- reporting snapshot & movement tetap deterministik
- reporting boundary test tetap lulus
- architecture test tetap hijau
- tidak ada dual-write
- tidak ada rewrite histori movement

---

## 11. Known Trade-offs

- selama transisi, query reporting bisa sedikit lebih kompleks
- default variant adalah kompromi migrasi, bukan model final terbaik untuk semua katalog
- size/color disimpan sederhana di variant, bukan sebagai attribute engine
- cleanup final harus disiplin agar compatibility layer tidak menjadi permanen

---

## 12. Kesimpulan

Step 4.3 adalah migrasi identitas inti sistem dari `productId` ke `variantId` untuk stok dan transaksi.  
Pendekatan yang dipilih adalah:

- simple variant model
- additive migration
- default variant backfill
- single active write identity per phase
- reporting transitional compatibility hanya di query layer

Pendekatan ini menjaga:

- boundary tetap bersih
- migration tetap realistis
- reporting tetap jujur
- dan Step 4 tetap bergerak tanpa merusak step sebelumnya.

## Reference

- mvp_stages_overview.md
- mvp_step_4_Domain_Hardening_&_Catalog_Activation_lock_note.md
- step_4_hardening_governance.md
- variant_migration_roadmap_step_4_3.md
- step_4_variant_reporting_transitional_contract.md
- step_4_transitional_compatibility_with_step_3.md
- catalog_domain.md
- sales_domain.md
- inventory_domain.md
- inventory_mutation_implementation_guide.md
- reporting_boundary_and_testing_policy.md
- architecture_test_specification_reporting_boundary.md
- Testing Strategy.md
- testing_boundary_integration_policy.md
- integration_test_db_strategy_schema_per_suite_design_locked.md
- error-handling-guidelines.md
- schemaPrisma.txt
