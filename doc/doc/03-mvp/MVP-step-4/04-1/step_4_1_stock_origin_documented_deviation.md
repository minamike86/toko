# step_4_1_stock_origin_documented_deviation.md

## Status  
**DOCUMENTED DEVIATION – STEP 4.1**

---

## 1. Context

Step 4.1 (Stock Origin Activation) telah selesai secara teknis dan dinyatakan:

> **DONE WITH DOCUMENTED DEVIATION**

Dokumen ini mencatat deviasi antara:
- desain ideal / referensi governance
- implementasi aktual sistem

Tujuan:
- menjaga transparansi keputusan
- mencegah asumsi salah di step berikutnya
- menyediakan dasar evaluasi yang eksplisit

Dokumen ini merupakan dasar formal dari status tersebut.

---

## 2. Deviation Summary

| ID | Deviation | Type |
|----|---------|------|
| D1 | Revised design document tersedia setelah implementasi | Documentation |
| D2 | DB enum formal tidak digunakan | Implementation |

---

## 3. Deviation Detail

### D1 — Revised Design Document Created Post-Implementation

#### Description
Dokumen:
`phase_2_2_stock_origin_design_revised.md`
dibuat setelah implementasi Step 4.1 selesai.

#### Expected (Governance)
- dokumen tersedia sebelum implementasi
- menjadi referensi utama selama development

#### Actual
- implementasi dilakukan berdasarkan:
  - ADR
  - diskusi internal
  - interpretasi dokumen lama (superseded)
- dokumen revised dibuat setelah sistem stabil

#### Impact
- tidak ada dampak fungsional
- berpotensi mismatch interpretasi jika tidak diselaraskan

#### Mitigation
- dokumen revised telah dibuat dan design locked
- menjadi source of truth untuk langkah berikutnya

#### Status
**CLOSED WITH DOCUMENTED DEVIATION**

---

### D2 — DB Enum Formal Not Implemented

#### Description
Desain Step 4.1 menyebut:
> penggunaan enum formal untuk origin

Namun implementasi menggunakan:
- `origin: String` di database
- closed set di TypeScript (application layer)

#### Expected (Design Intent)
- constraint enum di database
- enforcement di level persistence

#### Actual Implementation
- constraint hanya di domain layer (TypeScript)
- database tidak memiliki constraint enum

#### Rationale
Keputusan ini diambil untuk:
- menjaga perubahan tetap **additive**
- menghindari kompleksitas migration
- menghindari coupling kuat ke database
- mempercepat delivery tanpa mengganggu sistem existing

#### Impact

**Positive**
- migration lebih aman
- perubahan minimal
- fleksibilitas lebih tinggi

**Negative**
- database tidak mencegah typo
- integritas bergantung pada application layer
- raw SQL / script dapat merusak data

#### Risk Level
**LOW–MEDIUM (depends on discipline of write paths)**

#### Mitigation
- semua write path aplikasi melalui domain/use case
- tidak ada fallback/default origin
- test memastikan origin selalu diisi
- direct database write berada di luar kontrak sistem

---

## 4. Non-Deviation Clarification

Hal berikut **bukan deviasi**:
- penggunaan closed set di TypeScript
- mapping:
  - LEGACY
  - MANUAL_ADJUSTMENT
- tidak digunakannya PURCHASE di Step 4.1

Ini merupakan bagian dari desain final yang disengaja.

---

## 5. Deferred Decision

### DB Enum Adoption

Keputusan penggunaan DB enum **ditunda**.

#### Reason
- bukan kebutuhan kritikal Step 4.1
- tidak mempengaruhi behavior sistem
- berisiko memperbesar scope

#### Evaluation Timing
- setelah Step 4.2 selesai
- atau **sebelum penutupan penuh Step 4**

This decision must be explicitly revisited before full closure of Step 4.

#### Future Options

**Option A — Tetap String**
- constraint di domain saja

**Option B — Migrasi ke DB Enum**
- tambah constraint DB
- butuh migration + audit data

---

## 6. Constraints Moving Forward

Selama Step 4.2 dan seterusnya:
- tidak boleh mengubah origin design
- tidak boleh menambah nilai origin
- tidak boleh mengubah mapping use case

Dokumen ini:
> **tidak boleh dijadikan alasan untuk redesign origin di Step 4.2**

---

## 7. Relationship to Design Document

Dokumen ini terkait langsung dengan:
`phase_2_2_stock_origin_design_revised.md`

Hubungan:
- design doc → source of truth
- deviation doc → kondisi implementasi

Keduanya harus dibaca bersama.

---

## 8. Governance Reference

### 8.1 Step 4.1 Constraints
- perubahan bersifat additive
- tidak mengubah mutation pattern
- tidak mengubah identity stok
- tidak menambah domain baru
- tidak mengintroduce costing / procurement logic

### 8.2 Compliance Assessment

| Constraint | Status |
|----------|--------|
| Additive change only | COMPLIANT |
| No mutation change | COMPLIANT |
| No identity change | COMPLIANT |
| No new domain introduced | COMPLIANT |
| No costing/procurement logic | COMPLIANT |

### 8.3 Deviation Classification

| Deviation | Category |
|----------|---------|
| Missing revised doc | Documentation |
| No DB enum | Implementation |

### 8.4 Governance Conclusion

Deviation yang ada:
- tidak melanggar constraint Step 4.1
- tidak mengubah behavior sistem
- tidak memblokir Step 4.2

Sehingga:

> **Step 4.1 lulus hardening gate dengan documented deviation**

---

## 9. Usage Constraint

Dokumen ini:
- tidak boleh digunakan sebagai dasar redesign origin
- tidak boleh digunakan untuk menambah scope Step 4.2
- hanya berfungsi sebagai:
  - audit trail
  - decision record
  - deviation transparency

Perubahan origin hanya boleh melalui:
`phase_2_2_stock_origin_design_revised.md`

---

## 10. Conclusion

Step 4.1:
- selesai secara teknis
- memenuhi semua constraint utama
- tidak menyebabkan regression

Deviation:
- bersifat non-blocking
- terdokumentasi
- terkendali

Dokumen ini memastikan:
> tidak ada keputusan tersembunyi dalam implementasi

