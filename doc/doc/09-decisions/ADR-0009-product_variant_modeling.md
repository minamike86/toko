# ADR-0009: Product Variant Modeling

This ADR defines the authoritative domain model for Product and ProductVariant.

All implementation in Step 4.3 must comply with:
- MVP Step 4 Lock Note
- Variant Migration Roadmap

This ADR does not define migration order.
Migration order is defined separately.

## Status
Proposed

## Context

Sistem saat ini memodelkan **Product** sebagai satuan tunggal tanpa varian. Setiap produk memiliki satu representasi harga, satuan, dan keterkaitan inventory.

Dalam praktik bisnis jual beli (offline, online, dan gudang), satu produk sering memiliki beberapa varian, misalnya:
- ukuran (S, M, L)
- warna
- kemasan
- kombinasi atribut lain yang memengaruhi harga dan stok

Tanpa konsep varian:
- Inventory tidak dapat merepresentasikan stok aktual per varian.
- OrderItem tidak dapat mereferensikan barang fisik yang spesifik.
- Reporting penjualan per produk menjadi dangkal dan berpotensi menyesatkan.

Seiring dengan rencana pengembangan sistem dan kebutuhan jangka menengah, diperlukan keputusan eksplisit mengenai pemodelan **Product Variant**.

## Decision Drivers

- Sistem ditujukan untuk mendukung operasi offline, online, dan gudang.
- Stok, harga, dan unit secara nyata melekat pada varian, bukan hanya produk induk.
- Perubahan harus terdokumentasi karena menyentuh Step 1 & 2 yang telah dikunci.
- Desain harus tetap konsisten dengan pendekatan DDD dan Clean Architecture.
- Reporting di masa depan membutuhkan identitas item yang lebih presisi.

## Considered Options

### Option A: Product Variant sebagai Entity Terpisah (Recommended)

**Deskripsi**  
Menambahkan entity baru `ProductVariant` sebagai representasi barang yang dapat dijual dan disimpan.

Karakteristik:
- `Product` menjadi agregat deskriptif (nama, kategori, brand).
- `ProductVariant` menyimpan atribut operasional:
  - sku / variantCode
  - unit
  - harga
  - atribut varian (mis. ukuran, warna)
- Inventory melekat pada `ProductVariant`.
- `OrderItem` mereferensikan `productVariantId`.

**Kelebihan**
- Representasi paling mendekati realitas bisnis.
- Inventory dan pricing menjadi akurat.
- Reporting penjualan dan stok menjadi presisi.
- Skalabel untuk kebutuhan masa depan.

**Kekurangan**
- Perubahan lintas domain (Catalog, Inventory, Sales).
- Kompleksitas meningkat.
- Membutuhkan migrasi data.

---

### Option B: Variant sebagai Atribut Snapshot pada OrderItem

**Deskripsi**  
Varian tidak dimodelkan sebagai entity terpisah. Informasi varian hanya disimpan sebagai snapshot (string) pada OrderItem.

**Kelebihan**
- Implementasi cepat.
- Perubahan minimal pada struktur domain.

**Kekurangan**
- Inventory tidak dapat dikelola per varian.
- Harga dan unit sulit divalidasi.
- Reporting menjadi terbatas.
- Sulit dikembangkan tanpa refactor besar.

## Decision

Dipilih **Option A**: *Product Variant dimodelkan sebagai entity terpisah*.

Alasan:
- Varian adalah konsep domain nyata, bukan detail presentasi.
- Ketepatan inventory dan sales lebih penting daripada kesederhanaan jangka pendek.
- Desain ini mencegah keterbatasan struktural di masa depan.

## Consequences

### Positif
- Inventory dapat dikelola per varian.
- OrderItem merepresentasikan barang yang benar-benar dijual.
- Reporting penjualan dan stok lebih akurat.
- Sistem lebih siap untuk skala dan kompleksitas bisnis.

### Negatif
- Step 1 & 2 harus dibuka kembali secara resmi.
- Migrasi schema dan data diperlukan.
- Test domain dan integration harus diperbarui.

## Dependency & Ordering

ADR ini **bergantung pada penyelesaian ADR Payment Settlement & Credit Settlement Recording**.

Alasan:
- Payment Settlement menentukan fakta waktu penjualan (PAID).
- Product Variant memengaruhi struktur item yang dijual, bukan lifecycle pembayaran.
- Implementasi Product Variant tidak boleh dilakukan sebelum Payment Settlement stabil dan Step 1 & 2 dikunci ulang.

Urutan yang diwajibkan:
1. Implementasi ADR Payment Settlement.
2. Seluruh test Step 1 & 2 hijau.
3. Step 1 & 2 dikunci ulang.
4. Implementasi ADR Product Variant.

## Scope of Change

- Catalog domain (Product, ProductVariant).
- Inventory domain (stok per variant).
- Sales domain (OrderItem referensi varian).
- Persistence schema.

## Out of Scope

- Pricing rules kompleks (promo, bundle).
- Variant inheritance atau configurator.
- Reporting implementation.

## Follow-up Actions

1. Rancang schema ProductVariant.
2. Sesuaikan InventoryItem dan OrderItem.
3. Perbarui test domain dan integration.
4. Lock ulang Step 1 & 2.
5. Lanjutkan MVP Step 3 Reporting.

