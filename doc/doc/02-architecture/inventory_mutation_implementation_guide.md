# Inventory Mutation – Implementation Guide (MVP Step 1–3)

**Status:** IMPLEMENTATION LOCKED (Aligned with ADR-0012)  
**Scope:** Inventory Domain – All Mutation Use Cases  
**Reference:** ADR-0012 – Inventory Mutation Pattern

Selama Phase 4.3, Inventory Mutation – Implementation Guide tetap berlaku sepenuhnya

---

## 1. Purpose of This Document

Dokumen ini menjelaskan bagaimana pola mutasi Inventory (Snapshot + Movement) harus diimplementasikan secara konsisten pada MVP Step 1–3.

Dokumen ini tidak memperkenalkan aturan bisnis baru.
Dokumen ini hanya mengunci cara implementasi agar selaras dengan keputusan arsitektur.

---

## 2. Inventory Mutation Pattern (Recap)

Seluruh perubahan stok mengikuti pola:

1. Mutasi snapshot (`increase` / `decrease`)
2. Persist `StockMovement`

Atomicity tidak dijamin di level domain.
Konsistensi dijaga oleh disiplin repository dan pengujian.

Use case yang wajib mengikuti pola ini:

- InitializeStock
- ReceiveStock
- AdjustStock
- IssueStock

---

---

## 2.1 Identity Evolution Compatibility

Inventory Mutation Pattern bersifat identity-agnostic.

Artinya:

- Pada fase awal (product-based inventory), mutation menggunakan `productId`.
- Pada fase setelah aktivasi Product Variant (Step 4.3), mutation menggunakan `variantId`.
- Pola mutasi snapshot + movement tetap sama dan tidak berubah.

Perubahan identity stok tidak mengubah:

- Urutan mutation (snapshot → movement)
- Responsibility layer
- Invariant rules
- Testing discipline

Implementation Guide ini tetap berlaku lintas fase evolusi identity stok.

---

## 3. Layer Responsibilities

### 3.1 Application Layer

Application layer bertanggung jawab untuk:

- Validasi input dasar (non-empty, quantity > 0, dll)
- Mengambil InventoryItem melalui repository
- Mengorkestrasi urutan mutasi snapshot dan persist movement
- Meneruskan error bermakna bisnis

Application layer tidak boleh:

- Mengakses database langsung
- Mengubah entity di luar kontrak repository
- Membuat shortcut tanpa movement

---

### 3.2 Domain Layer

Domain bertanggung jawab untuk:

- Mendefinisikan entity `InventoryItem`
- Mendefinisikan value object / entity `StockMovement`
- Menjaga invariant dasar (misalnya stok tidak boleh negatif)

Domain tidak bertanggung jawab atas transaksi database.

---

### 3.3 Repository Layer

Repository bertanggung jawab untuk:

- Mengimplementasikan `increase` dan `decrease`
- Menyimpan `StockMovement`
- Menjamin konsistensi data di level infrastruktur (misalnya melalui transaction database jika tersedia)

Repository tidak boleh mengandung logika bisnis yang mengubah makna domain.

---

## 4. Implementation Flow per Use Case

### 4.1 ReceiveStock

Flow:

1. Validasi input
2. Pastikan product valid
3. `increase(stockUnitId, quantity)`
4. Buat `StockMovement` type `IN`
5. `saveMovement(movement)`

---

### 4.2 IssueStock

Flow:

1. Validasi input
2. Validasi stok mencukupi
3. `decrease(stockUnitId, quantity)`
4. Buat `StockMovement` type `OUT`
5. `saveMovement(movement)`

---

### 4.3 AdjustStock

Flow:

1. Validasi input
2. Tentukan arah (increase / decrease)
3. Mutasi snapshot sesuai arah
4. Buat `StockMovement` type `ADJUST`
5. `saveMovement(movement)`

---

### 4.4 InitializeStock

Flow:

1. Validasi input
2. Set quantity awal
3. Buat `StockMovement` type `IN` atau `ADJUST` dengan reason `INITIAL_STOCK`
4. Persist snapshot dan movement

---

## 5. Invariant Rules (Implementation Constraints)

Seluruh implementasi wajib memastikan:

1. Tidak ada perubahan snapshot tanpa `StockMovement`
2. Tidak ada `StockMovement` tanpa perubahan snapshot
3. Quantity movement selalu bernilai positif
4. Arah perubahan ditentukan oleh type movement
5. Error bisnis bersifat eksplisit

---

## 6. Testing Discipline

### Unit Test

- Mock repository
- Validasi alur orkestrasi
- Pastikan movement selalu dibuat ketika snapshot berubah

### Integration Test

- Gunakan repository nyata
- Validasi snapshot dan movement benar-benar tersimpan
- Uji skenario gagal (misalnya stok tidak cukup)

---

## 7. Known Limitation (Step 1 Trade-off)

- Atomicity belum dijamin di level desain domain
- Potensi inkonsistensi bergantung pada implementasi repository
- Refactor atomic mutation direncanakan pada Step 4

---

## 8. What Must NOT Be Done

Selama MVP Step 1–3 aktif:

- Jangan memindahkan mutation ke dalam controller
- Jangan menyimpan snapshot tanpa movement
- Jangan menambahkan transaction logic di application layer tanpa ADR baru
- Jangan mengubah kontrak use case tanpa ADR eksplisit

---

## 9. Evolution Path

Pada MVP Step 4:

- Mutation akan dibuat atomic secara eksplisit
- Domain dapat menghasilkan movement sebelum persist
- Repository dapat menyediakan method atomic tunggal

Dokumen ini akan direvisi ketika Step 4 dimulai.

---

**End of Document**

