# Product-Based → Variant-Based Inventory Migration Roadmap

**Status:** Planned – MVP Step 4.3  
**Scope:** Inventory & Sales Domain  
**Reference:** MVP Step 4.3 – Product & Variant Activation  
**Related ADR:** ADR-0012 – Inventory Mutation Pattern

---

## 1. Purpose

Dokumen ini mendefinisikan roadmap evolusi dari inventory berbasis `productId` menjadi inventory berbasis `variantId`, tanpa merusak data historis dan tanpa membuka kembali Step 1–3 yang telah dikunci.

Migrasi ini dilakukan sebagai bagian resmi dari MVP Step 4.3 dan tidak boleh dijalankan sebelum Step 4 dimulai.

---

## 2. Architectural Constraints (Non-Negotiable)

Seluruh migrasi wajib mematuhi:

1. Pola mutasi snapshot + movement sebagaimana ditetapkan dalam ADR-0012 tetap berlaku.
2. Inventory Mutation Implementation Guide tetap menjadi acuan implementasi.
3. Tidak ada rewrite histori StockMovement lama.
4. Tidak ada perubahan kontrak use case Step 1–3 sebelum fase transisi dimulai secara resmi.
5. Reporting Step 3 harus tetap deterministik selama seluruh proses migrasi.

---

## 3. Migration Principles

1. Data lama tidak dihapus.
2. Migrasi dilakukan bertahap (parallel introduction).
3. Tidak ada dual-write dalam satu use case.
4. Dalam satu fase, hanya satu identity aktif (productId atau variantId).
5. Default variant digunakan untuk menjaga integritas data lama.

---

## 4. Phase Breakdown

### Phase 4.3.A – Introduce Variant Model (Non-Breaking)

- Tambah entity `Product`
- Tambah entity `ProductVariant`
- Tambah kolom `variantId` (nullable) pada:
  - OrderItem
  - InventoryItem
- Tidak ada perubahan pada use case

Status sistem:
- Inventory tetap menggunakan `productId`
- Reporting tetap aman

---

### Phase 4.3.B – Default Variant Backfill

Untuk setiap product lama:

- Buat satu default `ProductVariant`
- Backfill semua InventoryItem lama:
  variantId = defaultVariant(productId)
- Backfill OrderItem lama dengan default variant

Tidak ada perubahan movement lama.

---

### Phase 4.3.C – Switch Write Model

Use case inventory diubah untuk menggunakan `variantId` sebagai identity aktif:

- InitializeStock → variantId
- ReceiveStock → variantId
- IssueStock → variantId
- AdjustStock → variantId
- CreateOrder → wajib refer variantId

productId tetap ada untuk grouping katalog.

Pola mutasi snapshot + movement tetap tidak berubah.

---

### Phase 4.3.D – Deprecate productId in Inventory

- InventoryItem.productId tidak lagi digunakan untuk mutation
- Movement lama tetap menyimpan productId
- Movement baru menyimpan variantId
- Reporting mendukung dual-read sementara
- Dual-read hanya dilakukan pada level query untuk menjaga kompatibilitas data historis.
- Tidak diperbolehkan menambahkan business rule atau conditional logic identity di layer application reporting.

---

### Phase 4.3.E – Boundary Clean-Up

Setelah seluruh test stabil:

- InventoryItem hanya menyimpan variantId
- OrderItem wajib menyimpan variantId
- Tidak ada use case yang melakukan mutation berdasarkan productId
- Tidak ada InventoryItem tanpa variantId

Definition of Done Step 4.3 terpenuhi.

---

## 5. Risk & Mitigation

| Risk | Mitigation |
|------|------------|
| Reporting mismatch | Dual-read adapter sementara |
| Data orphan | Default variant mapping |
| Mutation inconsistency | Single identity per phase |
| Test regression | Freeze Step 3 integration test sebagai guardrail |

---

## 6. Completion Criteria

Migrasi dianggap selesai jika:

- Semua mutation menggunakan variantId
- Tidak ada InventoryItem berbasis productId
- Reporting tetap deterministik
- Seluruh integration test lulus
- Tidak ada legacy fallback di application layer

---

## 7. Post-Migration Alignment

Setelah Phase 4.3 selesai:

- Lanjut ke Step 4.4 – Inventory Consistency Stabilization
- Refactor atomic mutation jika diperlukan
- Finalisasi clean boundary antar domain

---

### Governance Constraint

This roadmap is the only allowed migration path for identity transition
from product-based inventory to variant-based inventory.

No direct schema rewrite is allowed.
No dual-write identity is allowed.
Step 4.2 must be completed before activation begins.
Reporting Step 3 must remain deterministic during transition.


---

**End of Document**