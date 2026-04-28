# Prisma Client & Reporting Test Database Strategy

## Status
DESIGN LOCKED – berlaku mulai MVP Step 3 (Reporting)

Dokumen ini menjadi referensi resmi untuk penggunaan Prisma Client dan strategi database khusus **reporting & integration test**, agar tidak terjadi kebingungan atau inkonsistensi di masa depan.

---

## 1. Prinsip Umum

1. Reporting adalah **read-only & observasional**.
2. Reporting **tidak boleh** menggunakan domain entity, use case, atau invariant dari Step 1 & 2.
3. Reporting boleh query langsung ke database menggunakan Prisma.
4. Semua keputusan di dokumen ini bersifat **operasional**, bukan domain rule.

---

## 2. Lokasi Prisma Client (Opsi A – Dipilih)

### Keputusan
Prisma Client **harus dibuat satu kali** dan diletakkan di:

```
src/shared/prisma.ts
```

### Aturan
- File tersebut mengekspor **singleton PrismaClient**.
- Semua query reporting **wajib** mengimpor Prisma Client dari file ini.
- Domain layer **tidak boleh** mengimpor Prisma Client.
- Application/use case Step 1 & 2 tetap menggunakan repository abstraction (bukan Prisma langsung).

### Alasan
- Menghindari multiple Prisma instance.
- Membuat query reporting konsisten dan mudah diaudit.
- Memisahkan dengan jelas antara **domain persistence** dan **observational query**.

Status perubahan: **NON-BREAKING** (additive, tidak mempengaruhi Step 1 & 2).

---

## 3. Boundary Penggunaan Prisma

Prisma Client **hanya boleh digunakan** di:

```
src/modules/reporting/queries/
```

Dilarang digunakan di:
- `domain/`
- `application/` (reporting application layer hanya mapping & orchestration)
- `shared/domain/*`

Pelanggaran aturan ini **harus terdeteksi** oleh architecture/boundary test.

---

## 4. Strategi Database untuk Integration Test (Reporting)

### Database yang Digunakan
- **MySQL**
- Database khusus test (contoh: `app_test`)

### Karakteristik
- Menggunakan schema yang sama dengan production
- Tidak menggunakan in-memory DB
- Fokus pada validasi query nyata (WHERE, GROUP BY, INDEX)

---

## 5. Migrasi & Setup Test Database

### Keputusan
- **Tidak ada migrasi otomatis** yang dijalankan oleh test runner saat ini.
- Setup database test dilakukan secara eksplisit oleh developer.

Pilihan yang diperbolehkan:
- `prisma migrate deploy`
- atau `prisma db push`

Keputusan ini disengaja untuk:
- Menghindari side-effect tersembunyi saat test
- Menjaga test tetap deterministik

---

## 6. Seeding Data untuk Integration Test

### Prinsip
- Integration test reporting **TIDAK BOLEH** menggunakan domain entity (`Order.create`, dsb).
- Data test dibuat **langsung via Prisma Client**.

Contoh pendekatan:
- `beforeEach`: insert data via `prisma.order.create`
- `afterEach` atau `beforeEach`: cleanup via `deleteMany`

Helper seperti `seedTestDb()` **boleh dibuat di masa depan**, tapi tidak wajib untuk MVP Step 3.

---

## 7. Dampak ke Architecture Test

Architecture/boundary test **wajib memastikan**:
- Reporting query mengimpor Prisma Client hanya dari `src/shared/prisma.ts`
- Tidak ada Prisma import di domain atau use case Step 1 & 2
- Tidak ada operasi write di reporting

---

## 8. Catatan Penutup

Dokumen ini dibuat untuk mencegah:
- Prisma Client tersebar di banyak tempat
- Reporting berubah menjadi pseudo-domain
- Integration test yang rapuh dan tidak representatif

Segala perubahan terhadap keputusan di dokumen ini **harus ditandai BREAKING / NON-BREAKING** dan direview secara eksplisit.

