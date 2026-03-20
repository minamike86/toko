# ADR-0006: Integration Test Boleh Menggunakan Prisma

## Status

Accepted

---

## Konteks

Proyek Sistem Jual Beli Terpadu dibangun dengan pendekatan **Domain-Driven Design (DDD)** dan arsitektur berlapis yang ketat. Salah satu prinsip utama arsitektur adalah:

* Domain dan application layer **tidak boleh** bergantung pada detail teknis seperti ORM atau database.
* Infrastruktur bersifat replaceable.

Namun, sistem ini juga menargetkan **keandalan operasional di dunia nyata**, khususnya terkait:

* konsistensi stok
* transaksi bersamaan (concurrency)
* pembatalan transaksi

Permasalahan muncul saat menentukan batasan untuk **integration test**:

* Apakah integration test boleh menggunakan Prisma secara langsung?
* Atau apakah semua test harus steril dari ORM?

---

## Keputusan

**Integration test BOLEH menggunakan Prisma dan database test secara langsung.**

Dengan batasan eksplisit:

* Penggunaan Prisma **hanya diperbolehkan di integration test dan infrastructure layer**.
* Domain layer dan application layer **tetap dilarang** mengimpor Prisma.
* Integration test **tidak boleh** menambahkan aturan bisnis baru.

---

## Alasan Keputusan

### 1. Realisme Operasional

Masalah bisnis paling kritis (stok ganda, race condition, rollback gagal) hampir selalu muncul dari **interaksi antar komponen**, bukan dari satu fungsi terisolasi.

Tanpa database nyata:

* concurrency tidak pernah benar-benar diuji
* transaksi tidak merepresentasikan kondisi produksi

---

### 2. Pemisahan Tanggung Jawab Tetap Terjaga

Keputusan ini **tidak melanggar prinsip DDD**, karena:

* Domain dan application tetap steril dari Prisma
* Prisma hanya muncul di boundary yang memang merepresentasikan dunia nyata

---

### 3. Menghindari Integration Test Palsu

Melarang ORM di integration test menghasilkan test yang:

* terlihat besar
* tetapi sebenarnya hanya unit test dengan setup rumit

Hal ini memberi rasa aman palsu terhadap sistem.

---

### 4. Biaya dan Nilai Seimbang

Integration test mahal dan lambat.
Dengan membolehkan Prisma **hanya di integration test bernilai tinggi**, proyek mendapatkan:

* cakupan risiko nyata
* tanpa membebani seluruh test suite

---

## Konsekuensi

### Positif

* Bug concurrency dan transaksi lebih cepat terdeteksi
* Perilaku sistem mendekati kondisi produksi
* Kepercayaan terhadap test meningkat

### Negatif

* Integration test lebih lambat
* Perlu pengelolaan database test

Konsekuensi negatif ini diterima karena nilainya sebanding dengan risiko bisnis yang dicegah.

---

## Aturan Turunan

* Boundary test **tidak boleh** menarget integration test
* Integration test **boleh** mengimpor PrismaClient
* Domain & application test **wajib gagal** jika mengimpor Prisma

---

## Referensi

* `/docs/06-testing/testing-boundary-integration-policy.md`
* `/docs/06-testing/testing-strategy.md`
* `/docs/02-architecture/ddd-boundaries.md`

---

## Catatan

ADR ini dibuat untuk mencegah perdebatan berulang mengenai penggunaan ORM di test.
Jika di masa depan ORM diganti, ADR ini **tidak berubah** karena yang diatur adalah **prinsip**, bukan alat.
