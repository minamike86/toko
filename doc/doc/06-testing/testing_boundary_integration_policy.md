# Testing Boundary & Integration Policy

Dokumen ini menjelaskan **kebijakan resmi pengujian (testing)** pada proyek Sistem Jual Beli Terpadu. 
Tujuannya adalah memastikan **logic bisnis benar, mudah dilacak, dan tidak tercemar oleh detail teknis**, sambil tetap realistis terhadap kebutuhan bisnis asli.


Dokumen ini dibuat setelah seluruh test berjalan hijau dan boundary arsitektur tervalidasi.

---

## Prinsip Utama

1. **Logic bisnis lebih penting daripada framework**  
   Framework bisa diganti. Database bisa diganti. Aturan bisnis tidak boleh ikut rusak.

2. **Setiap jenis test punya tujuan berbeda**  
   Mencampur tujuan test akan menghasilkan test yang hijau tapi bohong.

3. **Integration test mensimulasikan dunia nyata**  
   Dunia nyata selalu punya database. Melarang database di integration test adalah ilusi.

---

## Klasifikasi Test

### 1. Domain Test

**Tujuan**  
Memastikan aturan bisnis (invariants) selalu benar.

**Contoh skenario bisnis nyata**:
- Stok tidak boleh negatif
- Quantity tidak boleh nol atau negatif

**Aturan**:
- ❌ Tidak boleh import Prisma
- ❌ Tidak boleh import repository implementation
- ❌ Tidak boleh menyentuh database
- ✅ Hanya entity & value object

**Analogi bisnis**:
Kepala toko memutuskan aturan tanpa peduli pakai buku tulis atau komputer.

---

### 2. Application / Use Case Test

**Tujuan**  
Memastikan alur bisnis berjalan benar dan dependency digunakan sesuai kontrak.

**Contoh skenario bisnis nyata**:
- Create order mengurangi stok
- Cancel order mengembalikan stok

**Aturan**:
- ❌ Tidak boleh import Prisma
- ❌ Tidak boleh akses database
- ✅ Repository di-mock
- ✅ Fokus ke orkestrasi

**Analogi bisnis**:
SOP operasional kasir, tanpa melihat gudang fisik.

---

### 3. Integration Test

**Tujuan**  
Memastikan seluruh sistem bekerja sebagai satu kesatuan nyata.

**Contoh skenario bisnis nyata**:
- Order PAID → stok berkurang
- Cancel order → stok kembali
- Concurrent stock adjustment

**Aturan**:
- ✅ Boleh menggunakan Prisma
- ✅ Boleh menggunakan database test
- ❌ Tidak boleh menambahkan aturan bisnis baru

**Catatan penting**:
Integration test **bukan** tempat menulis logic bisnis.

**Analogi bisnis**:
Simulasi toko sungguhan dengan gudang, kasir, dan stok nyata.

**Catatan khusus MVP Step 3 (Reporting)**  
Modul Reporting memiliki kebijakan boundary dan architecture test yang lebih ketat dan
terdokumentasi terpisah pada:
`/docs/03-mvp/reporting-boundary-and-testing.md`

---

### 4. Architecture / Boundary Test 

**Tujuan**  
 Menjaga disiplin arsitektur dan boundary antar modul agar tidak rusak seiring bertambahnya fitur.

**Yang diuji**:
- Domain tidak boleh import Prisma
- Application tidak boleh import Prisma
- Repository implementation sesuai kontrak

**Yang TIDAK diuji**:
- Integration test tidak menjadi target boundary

**Contoh boundary test yang benar**:
- Application layer tidak import PrismaClient

**Analogi bisnis**:
Audit internal untuk memastikan SOP masih dipatuhi.

**Karakteristik**
- Tidak menguji aturan bisnis
- Tidak menguji alur use case
- Kegagalan test menandakan pelanggaran desain, bukan bug fungsional

**Catatan penting**
Untuk MVP Step 3 (Reporting), aturan dan spesifikasi architecture test didefinisikan secara khusus pada:
`/docs/03-mvp/reporting-boundary-and-testing.md`

---

## Aturan Import Prisma (Ringkasan)

| Layer | Prisma |
|------|--------|
| Domain | ❌ |
| Application | ❌ |
| Infrastructure | ✅ |
| Integration Test | ✅ |
| Architecture Test | ❌ |

---

## Kenapa Integration Test Boleh Prisma

Karena:
- Tanpa database, concurrency bug tidak pernah muncul
- Tanpa DB nyata, rollback dan consistency tidak teruji
- Tanpa Prisma, integration test hanyalah unit test yang menyamar

**Dalam bisnis asli**:
Bug stok hampir selalu muncul karena interaksi sistem, bukan karena satu fungsi salah.

---

## Kesalahan Umum yang Sengaja Dihindari

- ❌ Melarang Prisma di semua test
- ❌ Menguji compiler (TypeScript) dengan runtime test
- ❌ Boundary test yang tidak tahu konteks layer
- ❌ Test hijau tapi tidak mencerminkan realita bisnis

---

## Prinsip Review Test

Saat mereview test, tanyakan:
1. Ini menguji **aturan bisnis**, **alur**, atau **integrasi nyata**?
2. Apakah layer yang diuji sesuai dengan dependensi yang digunakan?
3. Kalau test ini hijau, apakah aku lebih percaya sistem di production?

Kalau jawabannya tidak, test tersebut perlu diperbaiki atau dihapus.

---

## Lokasi & Referensi Dokumen

Dokumen ini **wajib direferensikan** agar keputusan arsitektural tidak hilang seiring waktu.

**Lokasi yang direkomendasikan:**

1. Salin atau pindahkan dokumen ini ke:
   ```
   /docs/testing/testing-boundary-and-integration-policy.md
   ```

2. Tambahkan referensi singkat di `README.md` proyek:
   ```md
   ### Testing Policy
   Proyek ini menerapkan kebijakan testing berlapis (domain, application, integration, dan architecture).
   Detail lengkap dapat dibaca di:
   /docs/testing/testing-boundary-and-integration-policy.md
   ```

3. Jadikan dokumen ini **acuan wajib** saat:
   - menambah jenis test baru
   - memperkenalkan database / ORM baru
   - menambah anggota tim atau AI baru

4. Untuk MVP Step 3 (Reporting), boundary dan architecture test **WAJIB** mengacu pada:
    `/docs/03-mvp/reporting-boundary-and-testing.md`

Tanpa referensi eksplisit, keputusan ini akan dianggap "opsional" dan rawan dilanggar.

---

## Penutup

Dokumen ini bukan untuk membuat sistem terlihat "bersih" di atas kertas.  
Dokumen ini ada supaya:
- Bug mudah dilacak
- Logika bisnis tidak bocor
- Sistem bisa tumbuh tanpa refactor panik

Test yang baik tidak hanya gagal saat ada bug.  
Test yang baik memberi **kepercayaan diri bisnis**.

