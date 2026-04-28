# Step 4.1 Close-Out Document
## Domain Hardening & Catalog Activation
### Sub-Step: 4.1 Stock Origin Activation

---

## 1. Status

**Step 4.1: DONE WITH DOCUMENTED DEVIATION**

---

## 2. Scope Summary

Step 4.1 bertujuan untuk:
- Mengaktifkan atribut `origin` pada `StockMovement`
- Menjadikan origin sebagai metadata historis immutable
- Menjamin seluruh movement memiliki origin
- Mengekspos origin di reporting tanpa mengubah behavior sistem existing

---

## 3. Implementation Summary

### 3.1 Schema
- `StockMovement.origin` ditambahkan
- Tipe: `String`
- Constraint: NOT NULL
- Backfill dilakukan untuk seluruh data existing

### 3.2 Backfill Rules
- `type = ADJUST` → `origin = MANUAL_ADJUSTMENT`
- selain itu → `origin = LEGACY`

### 3.3 Domain
- `origin` immutable
- closed set melalui TypeScript:
  - LEGACY
  - MANUAL_ADJUSTMENT
  - PURCHASE

### 3.4 Use Case Mapping
- `ReceiveStock → LEGACY`
- `IssueStock → LEGACY`
- `AdjustStock → MANUAL_ADJUSTMENT`

### 3.5 Repository
- Semua movement persistence menyimpan `origin`
- Tidak ada logic origin di repository

### 3.6 Reporting
- Movement history report menampilkan `origin`
- DTO menggunakan primitive string

### 3.7 Testing
- Semua test hijau
- Reporting dan write-side sudah mengassert origin

---

## 4. Validation Against Step 4.1 Goals

| Requirement | Status |
|------------|--------|
| Origin exists | DONE |
| Origin immutable | DONE |
| All movements have origin | DONE |
| Reporting deterministic | DONE |
| No mutation pattern change | DONE |
| No identity change | DONE |
| No scope expansion | DONE |

---

## 5. Documented Deviations

### 5.1 Missing Revised Design Document
- `phase_2_2_stock_origin_design_revised.md` belum tersedia saat implementasi dilakukan

### 5.2 DB Enum Not Used
- DB menggunakan `String`
- Validasi dilakukan di TypeScript (closed set)

---

## 6. Documentation Strategy (Separated Design & Deviation)

Untuk menjaga kejelasan antara desain domain dan kondisi implementasi, dokumentasi Step 4.1 dipisahkan menjadi dua artefak:

### 6.1 Design Source of Truth
Dokumen:
- `phase_2_2_stock_origin_design_revised.md`

Berfungsi sebagai:
- definisi final origin
- klasifikasi domain
- mapping use case
- contract terhadap reporting
- design lock untuk Step 4.1

Dokumen ini harus:
- bersih dari detail implementasi sementara
- stabil sebagai referensi lintas step

---

### 6.2 Documented Deviation / Implementation Debt
Dokumen:
- `step_4_1_stock_origin_documented_deviation.md`

Berisi:
- deviasi dari desain ideal (misal: DB enum tidak digunakan)
- alasan deviasi
- risiko
- mitigation
- rencana evaluasi ulang

Dokumen ini bersifat:
- operasional
- dapat berubah
- tidak menjadi bagian dari design truth

---

### 6.3 Cross-Reference Rule
Untuk mencegah kehilangan konteks:

- Dokumen design harus menyebut bahwa deviasi dicatat terpisah
- Dokumen deviasi harus merujuk ke design revised
- Close-out document (dokumen ini) merujuk keduanya

---

## 7. Risk Assessment

| Risk | Level | Mitigation |
|------|------|-----------|
| Typo origin | Low | Domain constraint |
| Missing revised doc (initial) | Medium | Now resolved via revised doc |
| Semantic gap | Low | Evolvable |

---

## 8. Decision

Step 4.1 dinyatakan selesai secara teknis dan aman untuk dilanjutkan.

Deviation telah:
- diidentifikasi
- dipisahkan dari design
- didokumentasikan secara eksplisit

---

## 9. Deviation Remediation Plan

### Target
- Finalisasi dan menjaga konsistensi antara:
  - design revised
  - implementation

### Scope
- Tidak ada perubahan kode wajib saat ini
- Evaluasi enum DB dilakukan di fase berikutnya (setelah Step 4.2)

---

## 10. Authorization

Step 4.2 boleh dimulai dengan constraint:
- Tidak mengubah origin logic
- Tidak mengubah inventory mutation pattern
- Tidak melakukan redesign origin

---

## 11. Next Step

Step 4.2 – Sales–Inventory Settlement Synchronization

Fokus:
- Sinkronisasi order dan inventory
- Settlement consistency

---

## 12. Final Notes

- Step 4.1 telah mencapai tujuan utamanya: transparansi historis movement
- Design dan implementation dipisahkan untuk menjaga clarity jangka panjang
- Deviation tidak bersifat blocking dan tidak mempengaruhi behavior sistem

Step 4.1 dianggap siap sebagai foundation untuk Step 4.2.

