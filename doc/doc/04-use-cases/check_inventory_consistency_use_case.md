# Step 4.4 – Batch 3 Test Plan

## Inventory Consistency Validation

**Type:** TEST PLAN  
**Step:** 4.4 – Inventory Consistency Stabilization  
**Batch:** 3  
**Status:** READY FOR EXECUTION

---

## 1. Tujuan Test Plan

Memverifikasi bahwa:

- `CheckInventoryConsistency` sesuai desain
- Snapshot vs movement dapat direkonsiliasi
- Mismatch terdeteksi eksplisit
- Limitation (ADJUST) ditangani jujur
- Checker read-only (tanpa side effect)
- Boundary domain tetap terjaga

---

## 2. Scope Testing

### Termasuk

- Use case: `CheckInventoryConsistency`
- Repository: `listMovementsByVariantId`
- Integrasi: `ReceiveStock`, `IssueStock`, `AdjustStock`

### Tidak termasuk

- Reporting layer
- Cleanup persistence Step 4.3
- Perubahan schema
- Perubahan mutation flow

---

## 3. Lingkungan Testing

- Integration test (schema-per-suite)
- `PrismaInventoryRepository`
- Optional: InMemory repo

---

## 4. Struktur Test Suite

```
tests/integration/inventory/
  CheckInventoryConsistency.integration.test.ts
```

---

## 5. Kategori Test Case (Ringkas)

### A. Konsistensi Normal

- CONSISTENT (IN/OUT)
- INCONSISTENT (Mismatch)
- Snapshot nol
- Snapshot tanpa movement

### B. Limitation

- ADJUST
- Unknown type

### C. Error

- Inventory tidak ditemukan

### D. Read-Only

- Tidak ubah snapshot
- Tidak create movement

### E. Integrasi

- ReceiveStock
- IssueStock
- AdjustStock

### F. Injection

- Snapshot tampering
- Movement injection

---

## 6. Detailed Test Cases (WAJIB)

### A1 – returns CONSISTENT when snapshot equals IN/OUT sum

- Setup: snapshot=7, IN 10, OUT 3
- Expected: CONSISTENT, difference=0

### A2 – returns INCONSISTENT on mismatch

- Setup: snapshot=8, IN 10, OUT 3
- Expected: INCONSISTENT

### A3 – zero snapshot & empty movement

- Expected: CONSISTENT

### A4 – non-zero snapshot & empty movement

- Expected: INCONSISTENT

### B1 – contains ADJUST

- Expected: LIMITED, expectedQuantity=null

### B2 – only ADJUST

- Expected: LIMITED

### B3 – unknown type

- Expected: LIMITED

### C1 – inventory not found

- Expected: throw InventoryConsistencyTargetNotFoundError

### D1 – no snapshot mutation

- Expected: quantity unchanged

### D2 – no movement insertion

- Expected: movement count unchanged

### E1 – ReceiveStock flow

- Expected: CONSISTENT

### E2 – IssueStock flow

- Expected: CONSISTENT

### E3 – AdjustStock flow

- Expected: LIMITED

### F1 – manual snapshot tampering

- Expected: INCONSISTENT

### F2 – movement injection without snapshot update

- Expected: INCONSISTENT atau LIMITED

---

## 7. Checklist Implementasi (Batch 2 – Verifikasi via Test)

### Application (Checker)

- [ ] Throw error jika snapshot tidak ada
- [ ] Return LIMITED jika ADJUST ditemukan
- [ ] Hitung IN/OUT deterministik
- [ ] Tidak melakukan write

### Repository

- [ ] listMovementsByVariantId bekerja
- [ ] Filter by variantId
- [ ] Sorting deterministic (occurredAt, id)
- [ ] Tidak ada business logic di repo

### Safety

- [ ] Snapshot tidak berubah
- [ ] Movement tidak bertambah
- [ ] Tidak ada auto-fix

---

## 8. Kriteria Kelulusan

### LULUS

- Semua test utama pass
- Tidak ada side effect
- ADJUST → LIMITED
- Mismatch terdeteksi

### MINOR

- Sorting belum diuji detail

### MAYOR

- Checker menulis data
- ADJUST dianggap deterministic
- Mismatch tidak terdeteksi

---

## 9. Prinsip

1. Checker = auditor
2. Tidak ada auto-fix
3. Tidak ada inferensi data
4. Limitation harus eksplisit

---

## 10. Output

- Checker terbukti benar
- Sistem bisa mendeteksi inkonsistensi
- Boundary tetap aman

---

## Penutup

Test plan ini memastikan sistem tidak hanya berjalan,
namun juga dapat diverifikasi secara objektif.

---

### Transitional Behavior

Selama fase transitional identity (productId → variantId):

- Sistem akan membaca movement dari:

  - variantId target
  - serta movement legacy berbasis productId tanpa variantId

Tujuan:

- menjaga akurasi rekonsiliasi selama migrasi bertahap

Setelah migrasi selesai:

- behavior ini akan dihapus
- checker menjadi strict variant-based
- Movement yang digunakan dalam rekonsiliasi adalah hasil agregasi dari variant scope dan legacy product scope.
