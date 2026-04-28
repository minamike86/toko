# Testing Strategy

Dokumen ini mendefinisikan **strategi pengujian resmi** untuk proyek Sistem Jual Beli Terpadu.
Strategi ini dirancang agar **logika bisnis tetap benar, mudah ditelusuri, dan tahan terhadap perubahan teknis**, sekaligus realistis terhadap kebutuhan bisnis asli.

Dokumen ini bersifat **mengikat secara arah**, bukan sekadar panduan opsional.

---

## Prinsip Dasar

1. **Test adalah alat kepercayaan bisnis, bukan sekadar CI hijau**
   Test harus membantu menjawab pertanyaan: *"Apakah sistem ini aman dipakai di operasional?"*

2. **Tidak semua test menguji hal yang sama**
   Setiap jenis test memiliki peran berbeda dan tidak boleh saling menggantikan.

3. **Masalah bisnis nyata muncul dari interaksi sistem**
   Oleh karena itu, kombinasi unit test dan integration test adalah keharusan.
   Selain memverifikasi kebenaran logika dan integrasi, strategi pengujian juga digunakan untuk

4. **menjaga disiplin arsitektur dan boundary antar modul**
   agar tidak bocor seiring waktu.

---

## Architecture / Boundary Test (MANDATORY)

- Architecture test = guardrail, bukan optional
- Wajib mencakup:
  - dependency wiring
  - Prisma usage
  - cross-module import
  - reporting boundary

Test ini:

- bukan test bisnis
- bukan integration test
- bersifat preventif

Klasifikasi:

- NON-BREAKING
- Clarification

## Lapisan Testing dan Tujuannya

### 1. Domain Test (Wajib)

**Tujuan**
Menjamin aturan bisnis inti (*invariants*) selalu benar.

**Kenapa wajib**
Jika invariant domain rusak, seluruh sistem ikut rusak meskipun UI dan database bekerja sempurna.

**Contoh bisnis nyata**:

- Stok tidak boleh negatif meskipun ada banyak transaksi
- Quantity tidak boleh nol atau negatif

**Aturan**:

- Setiap entity domain **WAJIB** memiliki unit test
- Tidak boleh import Prisma atau database
- Fokus pada perilaku entity

---

### 2. Application / Use Case Test (Wajib)

**Tujuan**
Memastikan alur bisnis dijalankan dengan urutan dan dependency yang benar.

**Kenapa wajib**
Sebagian besar bug operasional terjadi karena alur bisnis salah, bukan karena entity salah.

**Contoh bisnis nyata**:

- Order PAID harus mengurangi stok
- Cancel order harus mengembalikan stok

**Aturan**:

- Repository di-*mock* melalui interface
- Tidak boleh akses database
- Satu use case diuji dengan beberapa skenario

---

### 3. Integration Test (Terbatas tapi Kritis)

**Tujuan**
Memastikan sistem bekerja dalam kondisi nyata (database, transaksi, concurrency).

**Kenapa tidak semua use case**
Integration test mahal, lambat, dan sulit dirawat. Digunakan hanya untuk skenario bernilai tinggi.

**Contoh bisnis nyata**:

- Order dibayar lalu dibatalkan
- Dua transaksi bersamaan pada stok yang sama

**Aturan**:

- Boleh menggunakan Prisma dan database test
- Tidak menambahkan aturan bisnis baru
- Fokus ke end-to-end behavior

---

### 4. Architecture / Boundary Test (Spesifik & Preventif)

**Tujuan**  
Menjaga disiplin arsitektur dan boundary antar modul agar tidak rusak seiring bertambahnya fitur.

**Karakteristik**

- Tidak menguji aturan bisnis
- Tidak menguji alur use case
- Gagal berarti pelanggaran desain, bukan bug fungsional

**Catatan penting**
Untuk MVP Step 3 (Reporting), aturan dan spesifikasi architecture test didefinisikan secara khusus pada:
`/docs/03-mvp/reporting-boundary-and-testing.md`

---

## Concurrency dan Edge Case

**Concurrency dianggap penting** karena:

- Masalah stok hampir selalu muncul saat sistem dipakai bersamaan
- Unit test tidak pernah menemukan race condition

Minimal satu integration test **HARUS** mencakup skenario concurrency.

## Architecture / Boundary Test Checklist (MANDATORY)

Architecture / boundary test adalah pagar desain yang wajib dijaga secara aktif.
Test pada section ini tidak menguji business rule, tidak menggantikan application test,
dan tidak menggantikan integration test.

Tujuan utamanya adalah mencegah pelanggaran boundary dan dependency drift
sebelum perubahan dianggap final.

### Rule Group A — Dependency Wiring & Container Boundary

Checklist wajib:

- [ ] Application layer tidak boleh menginstansiasi Prisma.
- [ ] Domain layer tidak boleh menginstansiasi Prisma.
- [ ] UI / route layer tidak boleh menginstansiasi Prisma.
- [ ] Application layer tidak boleh mengimpor repository implementation dari infrastructure.
- [ ] UI / route layer tidak boleh mengimpor repository implementation dari infrastructure.
- [ ] UI / route layer tidak boleh membuat use case produksi secara langsung (`new UseCase(...)`).
- [ ] Seluruh dependency produksi harus diakses melalui wiring / container yang sah.
- [ ] Cross-module interaction tidak boleh memakai repository implementation modul lain secara langsung.

Tujuan:

- menjaga container tetap menjadi composition root
- menjaga application layer tetap bersih dari detail teknis
- mencegah coupling langsung antar modul

### Rule Group B — Delivery Boundary

Checklist wajib:

- [ ] Route / UI tidak boleh berisi business rule inti.
- [ ] Route / UI tidak boleh mengakses Prisma secara langsung.
- [ ] Route / UI tidak boleh mengakses repository langsung.
- [ ] Route / UI hanya boleh memanggil dependency yang sudah di-wire.
- [ ] Actor context hanya diteruskan, bukan diputuskan sebagai rule bisnis di UI.
- [ ] Error mapping di delivery layer tidak boleh mengubah makna error bisnis.
- [ ] Route POS / API wajib memakai helper delivery yang sudah distandardisasi jika scope-nya relevan.

Tujuan:

- menjaga delivery layer tetap tipis
- mencegah delivery berubah menjadi pseudo-application
- menjaga boundary request / response tetap konsisten

### Rule Group C — Reporting Boundary

Checklist wajib:

- [ ] Reporting tidak boleh mengimpor domain modul lain.
- [ ] Reporting tidak boleh mengimpor application / use case mutasi modul lain.
- [ ] Reporting tidak boleh memanggil use case mutasi.
- [ ] Prisma hanya boleh digunakan di `src/modules/reporting/queries/*`.
- [ ] Prisma tidak boleh digunakan di `src/modules/reporting/application/*`.
- [ ] Prisma tidak boleh digunakan di `src/modules/reporting/dto/*`.
- [ ] DTO reporting tidak boleh mengimpor enum / type / interface dari domain lain.
- [ ] Reporting tidak boleh memiliki folder `domain/`.
- [ ] Reporting tidak boleh memperkenalkan entity, invariant, atau value object bergaya domain.

Tujuan:

- menjaga reporting tetap read-only
- menjaga reporting tetap observasional
- mencegah reporting berubah menjadi domain terselubung

### Rule Group D — DTO Independence

Checklist wajib:

- [ ] DTO reporting hanya memakai tipe primitif atau shape DTO eksplisit.
- [ ] DTO reporting tidak boleh bergantung pada type domain.
- [ ] Domain entity tidak boleh diekspos mentah sebagai kontrak delivery / HTTP.
- [ ] Response transport tidak boleh menjadi source of truth domain.

Tujuan:

- menjaga kontrak output tetap stabil
- mencegah kebocoran domain model ke boundary luar sistem

### Rule Group E — Enforcement Rule

Checklist wajib:

- [ ] Architecture / boundary test harus FAIL pada pelanggaran desain.
- [ ] Kegagalan architecture test diperlakukan sebagai architecture violation, bukan code smell biasa.
- [ ] Architecture test tidak menguji business rule.
- [ ] Architecture test tidak menggantikan unit, application, atau integration test.
- [ ] Rule boundary bersifat preventif dan wajib lulus sebelum perubahan dianggap final.

### Prioritas Implementasi Coverage

Urutan prioritas yang wajib diutamakan:

1. Prisma usage di layer yang salah
2. Import repository implementation di layer yang salah
3. UI / route bypass container
4. Reporting dependency leak ke domain / mutation
5. DTO leak dari domain ke reporting / delivery

### Batasan

Checklist ini tidak digunakan untuk:

- naming convention file
- style code umum
- detail render UI
- perilaku bisnis use case
- detail implementasi internal yang tidak memengaruhi boundary

Jika sebuah rule tidak menjaga boundary atau dependency discipline,
rule tersebut tidak boleh dimasukkan ke architecture / boundary test checklist ini

Checklist ini tidak menjadi sumber definisi rule.

Seluruh rule tetap bersumber dari:

- architecture_overview.md
- reporting_boundary_and_testing_policy.md

Checklist ini hanya mendefinisikan coverage enforcement.

---

### Phase-2 Blind Spots (MANDATORY FOLLOW-UP)

Bagian ini mencatat blind spot enforcement yang belum sepenuhnya
machine-checkable pada architecture / boundary test saat ini.

Blind spot ini tidak mengubah source of truth arsitektur.
Bagian ini hanya mendefinisikan area enforcement lanjutan yang wajib
ditutup pada phase-2 hardening.

#### Priority 1 — Delivery Boundary

- deteksi business rule inti di UI / route
- deteksi authorization decision di UI / route
- deteksi error mapping yang mengubah makna error bisnis

#### Priority 2 — Generic Enforcement

- generalisasi cross-module infrastructure import ban
- pengurangan ketergantungan pada allowlist use case manual
- pengurangan ketergantungan pada naming repository implementation

#### Priority 3 — Reporting Advanced Guardrail

- pseudo-domain detection di reporting
- hardening shared Prisma rule terhadap re-export / indirection

#### Priority 4 — Precision Hardening

- AST-based parsing untuk rule kritikal
- explicit exception registry yang dapat diaudit

---

## Penutup

Strategi ini sengaja tidak mengejar kuantitas test, melainkan **nilai bisnis dari setiap test**.
Disiplin arsitektur yang dijaga melalui architecture test adalah bagian dari kepercayaan tersebut,
meskipun tidak selalu terlihat langsung oleh pengguna sistem.
Test yang baik tidak hanya menemukan bug, tetapi memberi kepercayaan diri saat sistem dipakai di dunia nyata.
