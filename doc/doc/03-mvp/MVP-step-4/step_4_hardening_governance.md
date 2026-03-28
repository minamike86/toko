# Step 4 – Hardening Governance & Implementation Guard

**Status:** ACTIVE  
**Parent:** MVP Step 4 Lock Note

Dokumen ini menetapkan aturan implementasi agar Step 4 tidak menyimpang dari desain resmi.
Dokumen ini bersifat mengikat untuk seluruh perubahan kode selama Step 4 berlangsung.
Dokumen ini tidak menggantikan Step 4 Lock Note, tetapi memperketat implementasi teknis dari arah yang telah dikunci di sana.

---

## 1. Scope of Authority

Dokumen ini mengikat implementasi pada:

- 4.1 Stock Origin
- 4.2 Payment Settlement
- 4.3 Variant Activation
- 4.4 Inventory Consistency

Tidak ada implementasi yang boleh melanggar dokumen referensi resmi tiap sub-step.

---

# 2. Sub-Step Guard Rules

---

## 2.1 Guard – Stock Origin (4.1)

Referensi wajib:
- ADR-0008-stock_origin_classification.md
- phase_2_2_stock_origin_design_revised.md
- ADR-0012-inventory-mutation-pattern.md
- inventory_mutation_implementation_guide.md

Dilarang:

- Mengubah mutation pattern snapshot + movement
- Menjadikan origin editable
- Menambahkan costing logic
- Mengubah identity stok

Origin hanya metadata historis pada movement.

---

## 2.2 Guard – Settlement (4.2)

Referensi wajib:
- step-4-2-payment-settlement-execution-plan.md
- step-4-2-hardening-optimistic-locking.md

Wajib:

- Semua settlement berjalan dalam satu database transaction
- Order.version digunakan untuk optimistic locking
- Retry maksimal 2 kali untuk OptimisticLockConflictError
- Outstanding diperlakukan sebagai derived cache
- Tidak ada penggunaan generic Error

Dilarang:

- Menggunakan row lock vendor-specific
- Update outstanding langsung tanpa recompute
- Menyentuh Inventory domain

Step 4.3 tidak boleh dimulai sebelum hardening 4.2 lulus.

---

## 2.3 Guard – Variant Activation (4.3)

Referensi wajib:
- ADR-0009-product_variant_modeling.md
- variant-migration-roadmap.md
- phase_2_1_product_variant_design.md

Wajib:

- Migrasi bertahap sesuai roadmap
- Tidak ada dual-write identity
- Reporting Step 3 tetap hijau
- Movement lama tidak diubah

Dilarang:

- Rewrite histori
- Menghapus productId sebelum boundary clean-up
- Menyentuh settlement logic

---

## 2.4 Guard – Inventory Consistency (4.4)

Referensi wajib:
- ADR-0012-inventory-mutation-pattern.md
- inventory_mutation_implementation_guide.md

Wajib:

- Snapshot dan movement tetap immutable
- Tersedia reconciliation test otomatis
- Tidak ada mismatch snapshot vs movement pada integration test

Dilarang:

- Event sourcing
- Multi-warehouse
- Accounting layer

---

# 3. Cross-Step Protection Rules

1. Tidak ada sub-step boleh berjalan paralel dengan sub-step berikutnya.
2. Tidak boleh mengubah Step 1–3.
3. Semua perubahan schema harus terdokumentasi.
4. Semua perubahan besar harus memiliki dokumen referensi.

---

# 4. Hardening Exit Criteria (Global Step 4)

Step 4 hanya boleh ditutup jika:

- 4.1 Origin immutable dan konsisten
- 4.2 Settlement concurrency-safe
- 4.3 Inventory berbasis variant
- 4.4 Snapshot vs movement stabil
- Reporting tetap deterministik

Jika salah satu gagal, Step 4 tetap berstatus IN PROGRESS.

---

# 5. Anti-Improvisation Clause

Implementasi tidak boleh:

- Menambahkan fitur di luar roadmap
- Mengubah boundary domain tanpa ADR
- Menghapus field tanpa migrasi eksplisit
- Mengubah identity tanpa fase transisi resmi

Jika diperlukan perubahan desain, wajib dibuat ADR baru sebelum implementasi.

---

**End of Step 4 Hardening Governance**

