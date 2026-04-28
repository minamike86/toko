# Step 4 – Batch 4: Persistence Cleanup & Closure

**Status:** DRAFT FOR IMPLEMENTATION  
**Parent Step:** MVP Step 4 – Domain Hardening & Catalog Activation  
**Sub-Scope:** Finalization setelah 4.1–4.4 implementasi teknis lulus  
**Design Authority:** `mvp_stages_overview.md`, `mvp_step_4_Domain_Hardening_&_Catalog_Activation_lock_note.md`, `log_note.md`, `step_4_4_inventory_consistency_implementation_plan.md`
**Purpose: Step 4 Closure Phase**

---

## 1. Tujuan

Batch 4 bertujuan menutup utang transisional yang masih tersisa pada Step 4 agar Step 4 dapat benar-benar ditutup dan Step 5 dapat dimulai tanpa membawa bridging logic transisional ke layer operasional.

Batch 4 **bukan** fitur baru.  
Batch 4 adalah fase:

- cleanup persistence,
- finalization decision,
- hardening akhir,
- dan closure governance.

---

## 2. Latar Belakang

Setelah 4.1–4.4:

- stock origin sudah aktif,
- payment settlement sudah concurrency-safe,
- variant activation sudah berjalan,
- inventory consistency checker sudah tersedia,
- seluruh compile dan test sudah hijau.

Namun Step 4 **belum boleh ditutup** karena masih ada kondisi transisional:

- `InventoryItem` persistence masih bergantung pada `productId` sebagai anchor,
- checker 4.4 masih membutuhkan Option B untuk membaca legacy movement,
- lock note Step 4 belum sinkron penuh dengan kondisi implementasi nyata,
- Definition of Done Step 4 mensyaratkan final state yang lebih bersih daripada kondisi sekarang.

---

## 3. Keputusan Desain yang Dikunci

### 3.1 Final Identity Inventory

Final identity untuk `InventoryItem` adalah:

- **`variantId` sebagai identity persistence aktif**

Artinya setelah Batch 4 selesai:

- read snapshot by `variantId`
- write snapshot by `variantId`
- update snapshot tidak lagi bergantung pada `productId`

### 3.2 Nasib `StockMovement.productId`

Keputusan final:

- **`StockMovement.productId` dipertahankan sebagai field historis**
- tetapi **tidak lagi dipakai untuk logic aktif runtime setelah cleanup selesai**

Rationale:

- tidak perlu rewrite histori,
- audit trail tetap kuat,
- lebih aman dibanding penghapusan agresif,
- tetap konsisten dengan prinsip no historical rewrite.

### 3.3 Runtime Active Logic

Setelah cleanup selesai:

- runtime aktif inventory menggunakan `variantId`
- checker normal tidak lagi bergantung pada bridging logic legacy
- Option B transisional dinyatakan selesai sebagai compatibility phase, bukan perilaku aktif permanen

### 3.4 Reporting Boundary

Batch 4 tidak boleh:

- memindahkan logic cleanup ke reporting,
- mengubah boundary Reporting Step 3,
- menambah business rule baru pada reporting.

---

## 4. Scope Batch 4

### 4.1 Yang Dikerjakan

1. Finalisasi schema/persistence `InventoryItem` ke `variantId`
2. Finalisasi repository inventory agar read/write aktif full by `variantId`
3. Hentikan ketergantungan logic aktif pada `productId` untuk inventory snapshot
4. Evaluasi dan rapikan checker agar tidak lagi mengandalkan bridging transisional untuk flow aktif
5. Sinkronisasi lock note, log note, dan status governance Step 4
6. Validasi ulang compile, integration test, reporting boundary test, dan checker behavior setelah cleanup

### 4.2 Yang Tidak Dikerjakan

Batch 4 tidak mengerjakan:

- Step 5 dashboard
- fitur UI baru
- multi-warehouse
- accounting
- procurement
- rewrite histori `StockMovement`
- redesign reporting
- perubahan domain baru di luar cleanup Step 4

---

## 5. Masalah yang Diselesaikan oleh Batch 4

### 5.1 Persistence Inventory Masih Transisional

Masalah saat ini:

- `InventoryItem` masih ber-anchor ke `productId`
- identity aktif di application layer sudah `variantId`
- ini menciptakan dual identity mental model walaupun bukan dual-write

### 5.2 Checker Masih Memakai Bridging Legacy

Masalah saat ini:

- Step 4.4 memakai Option B untuk jujur menghadapi data transisional
- ini benar untuk fase hardening
- tetapi tidak boleh dibiarkan menjadi final runtime shape jika cleanup sudah bisa dilakukan

### 5.3 Governance Step 4 Belum Sinkron

Masalah saat ini:

- implementasi nyata lebih maju daripada status pada lock note
- Step 4 tidak bisa ditutup bila dokumen governance masih menyatakan status lama

---

## 6. Prinsip Implementasi Batch 4

1. **No historical rewrite**  
   histori lama tidak diubah paksa

2. **No stealth redesign**  
   cleanup hanya untuk menyelesaikan transisi Step 4, bukan menyelundupkan Step 5

3. **Runtime simplification**  
   logic aktif harus lebih sederhana setelah Batch 4, bukan lebih rumit

4. **Reporting untouched**  
   reporting tetap read-only dan observasional

5. **Variant-native active model**  
   inventory aktif harus benar-benar berbasis `variantId`

6. **Historical preservation**  
   `StockMovement.productId` boleh tetap ada, tetapi perannya historis, bukan anchor runtime

---

## 7. Rencana Perubahan Teknis

### 7.1 Schema / Migration

Target final untuk `InventoryItem`:

- `variantId` menjadi identifier aktif persistence
- `productId` tidak lagi menjadi anchor snapshot aktif

Pekerjaan yang mungkin diperlukan:

- memastikan seluruh row `InventoryItem` sudah memiliki `variantId`
- menambah constraint/finalization pada `variantId`
- meninjau nasib `productId` pada tabel `InventoryItem`:
  - dihapus, atau
  - dipertahankan sementara hanya jika benar-benar diperlukan migrasi bertahap

**Target ideal Batch 4:**

- tidak ada dependency logic aktif ke `productId` pada `InventoryItem`

### 7.2 Inventory Repository

Repository inventory harus difinalisasi agar:

- `findByVariantId` tetap menjadi read utama
- `increaseByVariantId` dan `decreaseByVariantId` benar-benar update by `variantId`
- tidak ada lagi update snapshot via lookup `productId`

### 7.3 PrismaInventoryRepository

Yang harus dibersihkan:

- strategi `find-by-variant, update-by-product`

Yang harus menjadi final:

- `find-by-variant, update-by-variant`

### 7.4 CheckInventoryConsistency

Sesudah cleanup persistence selesai:

- evaluasi apakah checker masih perlu bridging Option B
- target final:
  - checker default berjalan dengan variant-native reconciliation
  - legacy compatibility hanya dipertahankan jika memang masih dibutuhkan oleh histori yang belum bisa diabaikan

**Keputusan arah:**

- Batch 4 harus memindahkan Option B dari active necessity menjadi documented historical compatibility

### 7.5 Test Suite

Semua test terkait inventory harus divalidasi ulang, termasuk:

- receive stock
- issue stock
- adjust stock
- checker integration
- reporting inventory boundary
- migration / prisma integration bila ada

---

## 8. Batch Breakdown

### Batch 4.1 – Decision & Schema Finalization

**Tujuan:**
Mengunci keputusan final persistence shape.

**Pekerjaan:**

- review schema aktif
- finalisasi shape `InventoryItem`
- finalisasi status `StockMovement.productId` sebagai historical field
- definisikan migration yang dibutuhkan

**Output:**

- keputusan schema final
- migration plan final

### Batch 4.2 – Repository Cleanup

**Tujuan:**
Menghapus dependency active runtime pada `productId` untuk inventory snapshot.

**Pekerjaan:**

- update `InventoryRepository`
- update `PrismaInventoryRepository`
- update in-memory repo/test double jika perlu

**Output:**

- repository full variant-native

### Batch 4.3 – Validation & Transition Removal Audit

**Tujuan:**
Membuktikan cleanup tidak merusak perilaku sistem.

**Pekerjaan:**

- jalankan compile
- jalankan full test
- verifikasi reporting tetap aman
- verifikasi checker tetap jujur
- audit apakah Option B masih aktif di runtime atau sudah menjadi legacy-only concern

**Output:**

- audit hasil cleanup
- daftar limitation final

### Batch 4.4 – Step 4 Closure Governance

**Tujuan:**
Menutup Step 4 secara resmi.

**Pekerjaan:**

- update `mvp_step_4_Domain_Hardening_&_Catalog_Activation_lock_note.md`
- update status real sub-step 4.1–4.4
- tambah closure note final di `log_note.md`
- pastikan `mvp_stages_overview.md` tidak lagi bertentangan dengan final state Step 4

**Output:**

- Step 4 resmi CLOSED bila seluruh kriteria terpenuhi

---

## 9. Test Plan Batch 4

### 9.1 Technical Validation

Wajib lulus:

- `npx tsc --noEmit`
- `npx vitest run`

### 9.2 Functional Validation

Wajib terbukti:

- receive stock tetap benar
- issue stock tetap benar
- adjust stock tetap sesuai limitation yang diakui
- inventory consistency checker tetap benar
- snapshot inventory aktif tidak lagi membutuhkan `productId` sebagai anchor

### 9.3 Governance Validation

Wajib terbukti:

- Reporting Step 3 tetap hijau
- tidak ada dual-write
- tidak ada rewrite histori
- dokumen governance sinkron dengan implementasi nyata

---

## 10. Definition of Done – Batch 4

Batch 4 dianggap selesai jika:

1. `InventoryItem` aktif benar-benar variant-native
2. repository inventory tidak lagi update by `productId`
3. `StockMovement.productId` diposisikan jelas sebagai historical field, bukan active anchor
4. checker tidak lagi bergantung pada bridging transisional sebagai kebutuhan utama runtime
5. compile dan seluruh test lulus
6. reporting boundary tetap aman
7. lock note Step 4 sinkron dengan status implementasi nyata
8. Step 4 bisa ditutup tanpa menyisakan kontradiksi governance

---

## 11. Kriteria Penutupan Step 4

Step 4 hanya boleh ditutup jika:

- 4.1 = COMPLETED
- 4.2 = COMPLETED
- 4.3 = COMPLETED atau FINALIZED dari status transisional
- 4.4 = COMPLETED
- Definition of Done Step 4 pada `mvp_stages_overview.md` sudah benar-benar terpenuhi

Jika persistence inventory masih transisional, maka:

- Step 4 **belum boleh ditutup**
- Step 5 **belum boleh dimulai**

---

## 12. Risiko Utama

### Risiko A – Cleanup Merusak Reporting

Mitigasi:

- jalankan seluruh reporting test
- jangan sentuh query reporting kecuali benar-benar perlu untuk kompatibilitas schema

### Risiko B – Legacy Behavior Tidak Terdokumentasi

Mitigasi:

- tulis decision final `StockMovement.productId` secara eksplisit

### Risiko C – Step 5 Dimulai Terlalu Cepat

Mitigasi:

- Step 4 closure note harus selesai dulu
- lock note harus sinkron dulu

---

## 13. Kesimpulan

Batch 4 adalah fase penutupan, bukan fase eksplorasi.

Tujuan akhirnya sederhana:

- menyelesaikan utang transisional Step 4,
- memastikan inventory aktif benar-benar variant-native,
- mempertahankan histori secara jujur,
- dan menutup Step 4 dengan governance yang sinkron.

Setelah Batch 4 selesai dan Step 4 resmi ditutup,
barulah Step 5 layak dimulai.
