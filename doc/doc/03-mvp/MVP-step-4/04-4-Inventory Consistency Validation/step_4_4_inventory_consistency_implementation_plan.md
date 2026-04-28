# Step 4.4 – Inventory Consistency Stabilization Implementation Plan

**Status:** DRAFT FOR IMPLEMENTATION  
**Parent:** MVP Step 4 – Domain Hardening & Catalog Activation  
**Step:** 4.4 Inventory Consistency Stabilization  
**Scope Type:** Implementation Plan  
**Design Authority:** `inventory_reconciliation_spec_step_4_4.md`, `mvp_step_4_Domain_Hardening_&_Catalog_Activation_lock_note.md`, `step_4_hardening_governance.md`

---

## 1. Tujuan Dokumen

Dokumen ini menjadi panduan implementasi utama untuk Step 4.4.

Dokumen ini menjawab:

- apa yang dikerjakan pada Step 4.4,
- apa masalah nyata pada code saat ini,
- solusi yang diperbolehkan,
- apa saja yang harus diimplementasikan,
- urutan implementasi yang aman,
- dan apa yang tidak boleh dilakukan.

Dokumen ini **bukan** design authority baru.
Dokumen ini menurunkan desain yang sudah dikunci ke dalam rencana implementasi yang operasional.

---

## 2. Posisi Step 4.4 dalam Roadmap

Step 4.4 adalah sub-step lanjutan setelah Step 4.3 dinyatakan:

- **IMPLEMENTED AND STABLE**
- **TRANSITIONAL COMPLETE**
- final cleanup persistence masih **DEFERRED**

Step 4.4 **tidak** bertugas menyelesaikan cleanup persistence Step 4.3.
Step 4.4 bertugas menambahkan pagar verifikasi agar snapshot inventory dan movement history tidak berbohong satu sama lain.

Dengan demikian, Step 4.4 adalah **step verifikasi integritas**, bukan redesign inventory.

---

## 3. Referensi Mengikat

Dokumen implementasi ini wajib tunduk pada dokumen berikut:

- `inventory_reconciliation_spec_step_4_4.md`
- `mvp_step_4_Domain_Hardening_&_Catalog_Activation_lock_note.md`
- `step_4_hardening_governance.md`
- `mvp_stages_overview.md`
- `reporting_boundary_and_testing_policy.md`
- `inventory_mutation_implementation_guide.md`
- `log_note.md`

Jika terjadi konflik antara code saat ini dan dokumen lock/guideline,
**dokumen lock/guideline menang**.

---

## 4. Tujuan Step 4.4

Step 4.4 bertujuan untuk memastikan bahwa:

- `InventoryItem` tetap menjadi snapshot state saat ini,
- `StockMovement` tetap menjadi histori immutable,
- snapshot dan movement dapat direkonsiliasi secara matematis,
- mismatch terdeteksi secara eksplisit,
- reporting tidak berubah menjadi validator domain,
- tidak ada auto-fix diam-diam.

Step ini **tidak** mengubah arsitektur menjadi event sourcing.

---

## 5. Scope Pekerjaan

### 5.1 Yang Dikerjakan

Step 4.4 mengerjakan hal berikut:

1. Menambahkan **inventory consistency checker** yang bersifat read-only
2. Menambahkan **read contract repository** untuk kebutuhan checker
3. Menambahkan **integration test rekonsiliasi** snapshot vs movement
4. Menambahkan **mismatch detection** yang menyebabkan test fail
5. Mendokumentasikan hasil implementasi dan limitation yang masih berlaku

### 5.2 Yang Tidak Dikerjakan

Step 4.4 **tidak** mengerjakan:

- cleanup persistence Step 4.3
- migrasi final `InventoryItem` menjadi variant-native penuh
- keputusan final nasib `productId` pada `StockMovement`
- rewrite histori movement
- dual-write
- perubahan boundary Reporting Step 3
- event sourcing
- accounting
- multi-warehouse

---

## 6. Kondisi Code Saat Ini (Audit Ringkas)

### 6.1 Yang Sudah Benar

Kondisi berikut sudah sesuai arah desain:

- mutation flow inventory masih mengikuti pola **snapshot → movement**
- write path inventory sudah **variant-aware**
- reporting inventory transisional sudah lulus
- compile dan test sudah hijau
- Step 4.3 sudah stabil pada level transisional

### 6.2 Kondisi Transisional yang Masih Ada

Hal berikut **masih sengaja transisional** dan bukan target cleanup Step 4.4:

- `InventoryItem` persistence masih anchored pada `productId`
- lookup aktif sudah menggunakan `variantId`
- update persistence snapshot masih dilakukan by `productId`
- `StockMovement` masih menyimpan `productId` untuk kompatibilitas transisional

### 6.3 Gap Nyata terhadap Step 4.4

Gap utama saat ini:

1. Belum ada checker rekonsiliasi snapshot vs movement
2. Belum ada integration test khusus mismatch detection
3. Belum ada read contract repository khusus consistency validation
4. Data `ADJUST` saat ini belum sepenuhnya sejalan dengan spesifikasi rekonsiliasi yang menuntut arah eksplisit

---

## 7. Masalah Utama yang Harus Diakui

### 7.1 Masalah A – Checker Belum Ada

**Fakta**  
Sistem saat ini belum memiliki use case / service yang secara eksplisit membandingkan:

- kuantitas snapshot saat ini, dan
- hasil penjumlahan movement historis.

**Dampak**  
Step 4.4 belum terimplementasi walaupun mutation path sudah berjalan.

**Status**  
MAYOR

---

### 7.2 Masalah B – Shape `ADJUST` Belum Deterministik Penuh untuk Rekonsiliasi Ketat

**Fakta**  
Spesifikasi Step 4.4 menginginkan arah adjustment eksplisit untuk rekonsiliasi (`ADJUST_IN` / `ADJUST_OUT`).
Namun shape movement saat ini masih berada pada pola transisional yang memakai `ADJUST` generik di write model saat ini.

**Dampak**  
Checker tidak boleh memalsukan arah perubahan jika data historis tidak benar-benar menyimpannya secara eksplisit.

**Status**  
MAYOR

---

### 7.3 Masalah C – Godaan Cleanup Persistence di Tengah Step 4.4

**Fakta**  
Karena persistence inventory masih transisional, implementor berisiko tergoda untuk sekalian membersihkan anchor `productId`.

**Dampak**  
Ini akan mencampur Step 4.4 dengan deferred cleanup Step 4.3 dan berpotensi membuka perubahan yang tidak terkunci.

**Status**  
MAYOR jika dilakukan

---

### 7.4 Masalah D – Risiko Boundary Reporting Tercemar

**Fakta**  
Consistency check bisa saja secara keliru dimasukkan ke reporting query karena sama-sama membaca snapshot dan movement.

**Dampak**  
Jika itu terjadi, Reporting Step 3 berubah dari observasional menjadi validator domain.

**Status**  
MAYOR jika dilakukan

---

## 8. Solusi yang Diperbolehkan

### 8.1 Solusi Inti

Solusi inti untuk Step 4.4 adalah:

- membuat **checker read-only** di Inventory Application Layer,
- checker membaca snapshot dan movement dari repository,
- checker mengembalikan hasil rekonsiliasi sebagai DTO,
- mismatch dideteksi secara eksplisit,
- integration test memverifikasi hasil tersebut,
- tidak ada write path yang berubah.

### 8.2 Solusi untuk Problem ADJUST

Karena data `ADJUST` belum sepenuhnya menyediakan arah eksplisit yang dibutuhkan spesifikasi ketat,
maka implementasi Step 4.4 harus dimulai dengan pendekatan:

#### Transitional Honest Mode

Prinsipnya:

- sistem **jujur** tentang apa yang bisa direkonsiliasi penuh,
- sistem **jujur** tentang apa yang belum bisa direkonsiliasi ketat tanpa menebak,
- tidak ada inferensi palsu,
- tidak ada pemalsuan hasil demi membuat test hijau.

Konsekuensi:

- checker dapat mengembalikan limitation flag / reason bila data historis adjustment belum cukup untuk strict reconciliation,
- mismatch tetap dianggap serius,
- hasil “tidak dapat direkonsiliasi secara ketat” bukan dianggap konsisten.

Pendekatan ini lebih aman daripada melakukan cleanup persistence atau rewrite histori secara diam-diam.

---

## 9. Prinsip Implementasi

Seluruh implementasi Step 4.4 wajib mengikuti prinsip berikut:

1. **Read-only**
   - checker tidak boleh melakukan write
   - checker tidak boleh memperbaiki data

2. **No hidden repair**
   - mismatch tidak boleh di-auto-fix
   - mismatch harus terlihat jelas di test

3. **No reporting leakage**
   - logic checker tidak boleh dipindah ke reporting

4. **No persistence cleanup by stealth**
   - jangan menyelundupkan final cleanup Step 4.3 ke Step 4.4

5. **No historical rewrite**
   - movement lama tetap immutable

6. **No dual-write**
   - checker hanya membaca

---

## 10. Yang Akan Diimplementasikan

### 10.1 Use Case / Checker Baru

Tambahkan use case baru, misalnya:

- `CheckInventoryConsistency.ts`

Tanggung jawab:

- menerima `variantId` atau mode batch,
- membaca snapshot inventory,
- membaca movement history,
- menghitung `expectedQuantity`,
- membandingkan dengan `actualQuantity`,
- mengembalikan DTO hasil rekonsiliasi.

### 10.2 Repository Read Contract Baru

Tambahkan kebutuhan baca yang eksplisit pada `InventoryRepository`, misalnya:

- read snapshot by `variantId`
- read movement history by `variantId`

Tujuan:

- checker tidak mengakses Prisma langsung dari application layer,
- boundary tetap bersih,
- read path checker tetap berada pada Inventory module.

### 10.3 DTO Hasil Rekonsiliasi

Tambahkan DTO hasil checker, misalnya memuat:

- `variantId`
- `actualQuantity`
- `expectedQuantity`
- `difference`
- `isConsistent`
- `hasLimitation`
- `limitationReason`

DTO ini bersifat operasional dan read-only.

### 10.4 Integration Test Baru

Tambahkan integration test untuk skenario berikut:

1. receive stock → snapshot konsisten dengan movement
2. issue stock → snapshot konsisten dengan movement
3. receive + issue berurutan → tetap konsisten
4. data mismatch manual → test fail / checker report inconsistency
5. case adjustment transisional → limitation terdeteksi secara jujur

### 10.5 Update Log / Closure Note

Setelah implementasi selesai:

- tambahkan log note sesuai template canonical,
- nyatakan status implementasi Step 4.4,
- tulis limitation jika masih ada,
- jangan menulis ulang desain domain.

---

## 11. Urutan Implementasi Bertahap

### Batch 1 – Kontrak dan Shape Checker

**Tujuan**  
Mendefinisikan bentuk checker tanpa menyentuh mutation flow.

**Pekerjaan**

- definisikan contract repository read-only
- definisikan DTO hasil rekonsiliasi
- definisikan use case checker

**Output**

- blueprint operasional checker siap diimplementasikan

**Kriteria Lulus**

- tidak ada write path yang berubah
- tidak ada perubahan reporting
- tidak ada cleanup persistence terselubung

---

### Batch 2 – Implementasi Checker Read-Only

**Tujuan**  
Menyediakan checker yang dapat membaca snapshot dan movement.

**Pekerjaan**

- implement checker di application layer
- implement repository read path di infrastructure

**Output**

- checker dapat menghitung dan membandingkan hasil

**Kriteria Lulus**

- checker read-only
- tidak ada side effect
- limitation reported secara jujur

---

### Batch 3 – Integration Test Rekonsiliasi

**Tujuan**  
Membuktikan checker bekerja pada kondisi nyata.

**Pekerjaan**

- tambah integration test normal path
- tambah integration test mismatch
- tambah integration test limitation path

**Output**

- mismatch terdeteksi oleh test
- checker terbukti tidak menulis data

**Kriteria Lulus**

- mismatch = fail / inconsistent result
- tidak ada auto-repair

---

### Batch 4 – Audit Akhir & Log Note

**Tujuan**  
Menutup implementasi secara disiplin.

**Pekerjaan**

- review hasil batch
- klasifikasi akhir: lulus / minor / mayor
- update log note

**Output**

- jejak audit implementasi Step 4.4

---

## 12. Klasifikasi Temuan dan Penanganannya

### Temuan yang Harus Ditandai LULUS

- checker read-only
- reporting tidak disentuh
- mutation flow tetap snapshot → movement
- tidak ada dual-write
- tidak ada rewrite histori

### Temuan yang Harus Ditandai MINOR

- naming atau DTO shape perlu dirapikan
- helper internal perlu diringkas
- output error/result perlu diperjelas

### Temuan yang Harus Ditandai MAYOR

- checker melakukan write
- mismatch di-auto-fix
- reporting dipakai untuk validasi domain
- persistence Step 4.3 dibersihkan diam-diam
- histori movement diubah
- arah ADJUST dipalsukan tanpa data pendukung

---

## 13. File yang Diperkirakan Relevan

### File baru

- `src/modules/inventory/application/CheckInventoryConsistency.ts`
- `src/modules/inventory/tests/integration/InventoryConsistency.integration.test.ts`

### File existing yang mungkin disentuh

- `src/modules/inventory/domain/InventoryRepository.ts`
- `src/modules/inventory/infrastructure/PrismaInventoryRepository.ts`
- helper in-memory repository / adapter test jika diperlukan

### File yang dibaca sebagai referensi dan idealnya tidak diubah pada tahap awal

- `AdjustStock.ts`
- `IssueStock.ts`
- `ReceiveStock.ts`
- `inventory_reconciliation_spec_step_4_4.md`
- `step_4_hardening_governance.md`
- `mvp_step_4_Domain_Hardening_&_Catalog_Activation_lock_note.md`
- `log_note.md`

---

## 14. Aturan yang Tidak Boleh Dilanggar Saat Implementasi

1. Jangan ubah boundary Reporting Step 3
2. Jangan rollback Step 4.1, 4.2, 4.3
3. Jangan buat dual-write
4. Jangan rewrite histori `StockMovement`
5. Jangan sekalian cleanup persistence Step 4.3
6. Jangan membuat event sourcing terselubung
7. Jangan pakai checker untuk memperbaiki data

---

## 15. Definition of Done – Implementasi Step 4.4

Implementasi Step 4.4 dianggap selesai jika:

1. checker inventory consistency tersedia
2. checker bersifat read-only
3. integration test rekonsiliasi tersedia
4. mismatch dapat dideteksi secara eksplisit
5. tidak ada auto-repair logic
6. reporting tetap read-only
7. tidak ada pelanggaran terhadap lock note Step 4.3
8. limitation transisional dijelaskan secara jujur bila masih ada

---

## 16. Kesimpulan

Step 4.4 adalah pekerjaan verifikasi integritas, bukan redesign domain.

Fokus implementasi adalah:

- menambahkan checker,
- menambahkan test rekonsiliasi,
- menjaga kejujuran sistem saat mismatch ada,
- dan menjaga agar transisi Step 4.3 tidak dirusak.

Masalah terbesar pada Step 4.4 bukan kurang ide,
melainkan godaan untuk menyelesaikan masalah lain yang bukan scope step ini.

Dokumen ini mengunci arah implementasi agar perubahan berikutnya tetap disiplin, bertahap, dan bisa diaudit.

---

## Transitional Strategy — Movement Reconciliation (Option B)

### Background

Inventory system berada dalam fase transitional dari `productId` ke `variantId`.

- `InventoryItem` masih ber-anchor pada `productId`
- `StockMovement` memiliki:

  - `productId` (mandatory)
  - `variantId` (nullable)

### Problem

Jika reconciliation hanya menggunakan `variantId`:

- Movement historis (tanpa `variantId`) akan hilang
- Checker menghasilkan false result

### Solution: Transitional Aware Reconciliation

Checker harus membaca movement dari:

#### 1. Variant Scope

```
movement.variantId = targetVariantId
```

#### 2. Legacy Scope

```
movement.productId = anchorProductId
AND movement.variantId IS NULL
```

### Aggregation Rules

- Gabungkan kedua set movement
- Sort:

  - `occurredAt ASC`
  - `id ASC`
- Gunakan hasil gabungan untuk:

  - expected quantity calculation
  - consistency evaluation

### Repository Contract Change

Tambahkan capability:

```
Chosen Approach:

Repository tetap expose method terpisah:
- listMovementsByVariantId
- listMovementsByProductIdWithoutVariant

Aggregation dilakukan di application layer (checker).
```

- tetap expose method terpisah:

  - `listMovementsByVariantId`
  - `listMovementsByProductIdWithoutVariant`
- agregasi dilakukan di application layer

### Design Decision

Aggregation dilakukan di:

- ✅ Application layer (checker)

Repository hanya:

- membaca data
- tidak mengandung logic business

### Constraints

- Tidak boleh mengubah schema
- Tidak boleh rewrite movement lama
- Tidak boleh dual-write

### Future Cleanup

Pada fase post-transition:

- hapus legacy path (`productId-only movement`)
- ubah checker menjadi strict variant-based

## STEP 4.4 — Inventory Consistency Stabilization

Type: IMPLEMENTATION CLOSURE NOTE
Status: COMPLETED WITH KNOWN TRANSITIONAL LIMITATION

### Context

Step 4.4 diselesaikan untuk menambahkan verifikasi integritas antara snapshot `InventoryItem` dan histori `StockMovement` tanpa mengubah mutation flow, tanpa dual-write, dan tanpa merusak boundary Reporting Step 3.

### Implemented Scope

- Ditambahkan checker read-only `CheckInventoryConsistency`
- Ditambahkan repository read contract untuk kebutuhan reconciliation
- Implementasi menggunakan **Option B (Transitional Aware Reconciliation)**:

  - movement by `variantId`
  - ditambah legacy movement by `productId` dengan `variantId IS NULL`
- Aggregation dilakukan di application layer
- Sorting reconciliation deterministik:

  - `occurredAt ASC`
  - `id ASC`
- Batch 3 test coverage ditambahkan untuk:

  - CONSISTENT
  - INCONSISTENT
  - LIMITED
  - target not found
  - no side effect
  - transitional legacy scope

### Validation Result

Hasil verifikasi lokal:

- `npx tsc --noEmit` pass
- `npx vitest run` pass

Tidak ditemukan pelanggaran pada:

- Reporting Step 3 boundary
- Step 4.1 lock
- Step 4.2 lock
- Step 4.3 transitional lock
- no dual-write
- no historical rewrite

### Known Limitation

- Movement `ADJUST` masih bersifat transisional dan belum menyediakan arah eksplisit untuk strict reconciliation
- Karena itu checker secara jujur mengembalikan status `LIMITED` untuk movement `ADJUST`
- Final cleanup persistence inventory dan bentuk final persistence `StockMovement` tetap deferred sesuai lock Step 4.3

### Conclusion

Step 4.4 dinyatakan selesai pada level implementasi dan validasi test.

Status akhir:

- IMPLEMENTED
- VERIFIED
- TRANSITIONAL LIMITATION ACKNOWLEDGED
