# MVP Step 4 – Domain Hardening & Catalog Activation

**Status:** IN PROGRESS  
**Parent Reference:** MVP Stages Overview fileciteturn29file0

Dokumen ini adalah Lock Note resmi untuk MVP Step 4.
Step 4 berfokus pada penguatan model domain, bukan penambahan fitur UI besar.

Step 4 tidak boleh merusak Step 1–3 yang telah dikunci.

---

## 1. Tujuan Step 4

Mempersiapkan sistem agar:

- Model stok transparan dan historis
- Settlement pembayaran realistis dan aman
- SKU nyata melalui aktivasi variant
- Konsistensi inventory terjaga

Step 4 adalah fase hardening dan aktivasi struktur katalog yang lebih matang.

---

# 2. Sub‑Step Breakdown

---

## 4.1 Stock Origin Activation

**Status:** Active

### Tujuan
Menambahkan transparansi asal stok tanpa mengubah pola mutasi inventory.

### Scope
- Tambah field `origin` pada StockMovement
- Enum formal untuk origin
- Origin immutable
- Reporting movement menampilkan origin

### Constraint
- Tidak mengubah cara perhitungan stok
- Tidak mengubah snapshot logic
- Tidak mengubah mutation pattern (ADR‑0012 tetap berlaku)

### Done Criteria
- Semua movement memiliki origin
- Origin immutable
- Reporting tetap deterministik

### Referensi wajib:
- ADR-0008-stock_origin_classification.md
- phase_2_2_stock_origin_design_revised.md
- ADR-0012-inventory-mutation-pattern.md
- inventory_mutation_implementation_guide.md

Step 4.2 tidak boleh dimulai sebelum 4.1 lulus hardening gate.

---

## 4.2 Payment Settlement Formalization

**Status:** In Progress (Hybrid Transitional Model)

### Tujuan
Menjadikan pembayaran sebagai fact domain yang aman dan concurrency‑safe.

### Scope
- Payment entity resmi
- Partial payment
- Outstanding derived dari histori payment
- Optimistic locking + transaction

### Transitional State
- Outstanding masih disimpan sebagai derived cache
- Settlement sudah berbasis Payment
- Hardening sedang berjalan

### Hardening Gate (Wajib Lulus)
- Settlement berjalan dalam transaction
- Order.version digunakan untuk optimistic locking
- Retry terbatas untuk conflict
- Tidak ada overpayment pada race condition
- Tidak ada generic Error

### Referensi wajib:
- step-4-2-payment-settlement-execution-plan.md
- step-4-2-hardening-optimistic-locking.md

Step 4.3 tidak boleh dimulai sebelum 4.2 lulus hardening gate.

---

## 4.3 Product & Variant Activation

**Status:** Planned

### Tujuan
Menjadikan SKU nyata dan stok berada di level varian.

### Scope
- Product entity resmi
- ProductVariant entity resmi
- InventoryItem pindah ke variantId
- OrderItem refer ke variantId

### Constraint
- Reporting Step 3 tetap deterministik
- Tidak ada productId tersisa di InventoryItem setelah selesai
- Tidak ada OrderItem tanpa variantId

### Referensi wajib:
- ADR-0009-product_variant_modeling.md
- variant_migration_roadmap_step_4_3.md
- phase_2_1_product_variant_design.md

Step 4.4 tidak boleh dimulai sebelum 4.3 lulus hardening gate.
---

## 4.4 Inventory Consistency Stabilization

**Status:** Planned

### Tujuan
Menjaga konsistensi snapshot dan movement tanpa masuk event sourcing.

### Scope
- Movement tetap immutable
- Snapshot tetap state saat ini
- Snapshot vs movement reconciliation test
- Automated mismatch detection
- Tidak ada mismatch snapshot vs movement pada test

### Constraint
- Tidak menambah multi-gudang
- Tidak menambah accounting
- Tidak merusak reporting boundary

---

# 3. Definition of Done – Step 4

Step 4 dianggap selesai jika:

1. Origin aktif dan immutable
2. Settlement concurrency‑safe
3. Inventory berada di level variant
4. Tidak ada productId di InventoryItem
5. Reporting tetap lulus seluruh test boundary
6. Tidak ada mismatch snapshot vs movement

Jika salah satu sub‑step belum memenuhi kriteria, Step 4 tidak boleh ditutup.

---

# 4. Governance Rules

- Step 4 tidak boleh menambah aturan bisnis baru di luar scope.
- Step 5 tidak boleh dimulai sebelum Step 4 selesai.
- Semua perubahan besar harus memiliki dokumen pendukung (ADR / Hardening Doc).
- Reporting tetap read‑only dan observasional.

---

# 5. Status Summary

| Sub‑Step | Status |
|----------|--------|
| 4.1 Origin | Active |
| 4.2 Settlement | In Progress |
| 4.3 Variant | Planned |
| 4.4 Consistency | Planned |

---

Dokumen ini menjadi referensi utama sebelum implementasi lanjutan dilakukan pada Step 4.

**End of MVP Step 4 Lock Note**

