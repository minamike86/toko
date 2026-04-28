# Step 4.4 – Batch 3 Test Plan
## Inventory Consistency Validation

**Type:** TEST PLAN  
**Step:** 4.4 – Inventory Consistency Stabilization  
**Batch:** 3  
**Status:** READY FOR EXECUTION

---

## 1. Tujuan Test Plan

Test plan ini bertujuan untuk memverifikasi bahwa:

- Use case `CheckInventoryConsistency` bekerja sesuai desain
- Snapshot inventory dan movement history dapat direkonsiliasi
- Mismatch terdeteksi secara eksplisit
- Limitation transisional (ADJUST) ditangani secara jujur
- Checker bersifat read-only (tanpa side effect)
- Boundary antar domain tetap terjaga

Test plan ini merupakan turunan langsung dari desain Batch 1 dan implementasi Batch 2.

---

## 2. Scope Testing

### Termasuk

- Use case: `CheckInventoryConsistency`
- Repository read path: `listMovementsByVariantId`
- Integrasi dengan:
  - `ReceiveStock`
  - `IssueStock`
  - `AdjustStock`

### Tidak termasuk

- Reporting layer
- Cleanup persistence Step 4.3
- Perubahan schema database
- Perubahan mutation flow existing

---

## 3. Lingkungan Testing

### Disarankan

- Integration test menggunakan test DB (schema-per-suite)
- Menggunakan `PrismaInventoryRepository`
- Optional: InMemory repository untuk unit test

### Data Setup

- InventoryItem harus dibuat sebelum test
- Movement dibuat melalui use case (kecuali test injection mismatch)

---

## 4. Struktur Test Suite

```
tests/integration/inventory/
  CheckInventoryConsistency.integration.test.ts
```

Opsional:

```
tests/unit/inventory/
  CheckInventoryConsistency.unit.test.ts
```

---

## 5. Kategori Test Case

---

### A. Konsistensi Normal

#### A1 – CONSISTENT (IN/OUT)

**Deskripsi:** Snapshot sesuai movement

**Setup:**
- snapshot = 7
- movement: IN 10, OUT 3

**Expected:**
- status = CONSISTENT
- isConsistent = true
- difference = 0

---

#### A2 – INCONSISTENT (Mismatch)

**Setup:**
- snapshot = 8
- movement: IN 10, OUT 3

**Expected:**
- status = INCONSISTENT
- isConsistent = false

---

#### A3 – Snapshot Nol & Movement Kosong

**Expected:**
- status = CONSISTENT

---

#### A4 – Snapshot Tidak Nol & Movement Kosong

**Expected:**
- status = INCONSISTENT

---

### B. Transitional Limitation (ADJUST)

#### B1 – Movement Mengandung ADJUST

**Expected:**
- status = LIMITED
- expectedQuantity = null

---

#### B2 – Hanya ADJUST

**Expected:**
- status = LIMITED

---

#### B3 – Unknown Movement Type

**Expected:**
- status = LIMITED

---

### C. Error Handling

#### C1 – Inventory Tidak Ditemukan

**Expected:**
- throw `InventoryConsistencyTargetNotFoundError`

---

### D. Read-Only Safety

#### D1 – Tidak Mengubah Snapshot

**Expected:**
- quantity sebelum = sesudah

---

#### D2 – Tidak Menambah Movement

**Expected:**
- jumlah movement tetap

---

### E. Integrasi Use Case Nyata

#### E1 – ReceiveStock Flow

**Expected:**
- status = CONSISTENT

---

#### E2 – IssueStock Flow

**Expected:**
- status = CONSISTENT

---

#### E3 – AdjustStock Flow

**Expected:**
- status = LIMITED

---

### F. Mismatch Injection

#### F1 – Snapshot Dimodifikasi Manual

**Expected:**
- status = INCONSISTENT

---

#### F2 – Movement Ditambahkan Tanpa Snapshot Update

**Expected:**
- status = INCONSISTENT atau LIMITED

---

### G. Repository Behavior

#### G1 – Filter VariantId

**Expected:**
- hanya movement milik variantId

---

#### G2 – Sorting Deterministik

**Expected:**
- ordered by occurredAt asc, id asc

---

### H. Boundary Validation

#### H1 – Tidak Menggunakan Reporting

**Expected:**
- tidak ada dependency ke reporting module

---

#### H2 – Tidak Mengubah Mutation Flow

**Expected:**
- use case existing tidak berubah

---

## 6. Kriteria Kelulusan

### LULUS

- Semua test utama berhasil
- Tidak ada side effect
- Tidak ada inferensi ADJUST
- Mismatch terdeteksi

---

### MINOR

- Sorting belum diuji detail
- InMemory repository belum diuji

---

### MAYOR

- Checker lolos pada data mismatch
- Checker mengubah data
- ADJUST dianggap deterministik
- Boundary dilanggar

---

## 7. Prinsip Penting

1. Checker adalah auditor, bukan pelaku
2. Tidak ada auto-fix
3. Tidak ada inferensi data tanpa sumber
4. Limitation harus eksplisit

---

## 8. Output yang Diharapkan

Setelah Batch 3:

- Checker terbukti benar secara behavior
- Sistem mampu mendeteksi inkonsistensi
- Sistem jujur terhadap keterbatasan transisional
- Tidak ada regresi terhadap Step 4.3

---

## 9. Catatan Penutup

Batch 3 memastikan sistem tidak hanya berjalan, tetapi juga dapat dipercaya.

Sistem inventory yang sehat bukan yang selalu terlihat benar,
melainkan yang mampu menunjukkan ketika ia salah.

