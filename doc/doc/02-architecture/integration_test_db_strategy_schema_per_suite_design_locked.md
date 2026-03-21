# Integration Test Database Strategy – Schema per Suite

**Status:** DESIGN LOCKED  
**Scope:** Integration Test berbasis Database (MySQL)  
**Berlaku untuk:** MVP Step 3 dan seterusnya  
**Tidak mempengaruhi:** Runtime Production

---

## 1. Latar Belakang Keputusan

Seiring bertambahnya integration test berbasis database (khususnya pada MVP Step 3 – Reporting), sistem pengujian mulai menunjukkan gejala:

- Race condition antar test
- Foreign key violation yang tidak deterministik
- Deadlock acak
- Test lulus/gagal tergantung urutan eksekusi

Masalah-masalah ini **bukan disebabkan oleh bug domain atau reporting**, melainkan oleh **shared database state** yang dipakai secara paralel oleh banyak integration test.

Pendekatan sebelumnya (cleanup manual, `deleteMany`, atau `describe.sequential`) bersifat **reaktif dan rapuh**.

Karena itu diputuskan strategi isolasi yang **deterministik, jujur, dan scalable**.

---

## 2. Keputusan Inti

**Diputuskan untuk menggunakan strategi: _Schema-per-Suite_ untuk Integration Test Database.**

Artinya:
- Satu database server MySQL
- Banyak schema terpisah
- Setiap test suite integration **memiliki schema sendiri**

Keputusan ini bersifat **final (DESIGN LOCKED)** sampai ada ADR baru yang secara eksplisit menggantikannya.

---

## 3. Prinsip Desain yang Dikunci

### 3.1 Satu Database, Banyak Schema

Contoh schema:
- `toko_test_reporting`
- `toko_test_sales`
- `toko_test_inventory`

Semua schema berada dalam **satu MySQL instance**, bukan banyak database server.

Alasan:
- Lebih ringan dari sisi infra
- Migrasi cepat
- Tooling Prisma lebih sederhana
- Mudah direproduksi di CI

---

### 3.2 Satu Test Suite = Satu Schema

Mapping bersifat **deterministik**, tidak dinamis per test case.

| Lokasi Test Suite | Schema |
|-------------------|--------|
| `src/modules/reporting/tests/integration/**` | `toko_test_reporting` |
| `src/modules/sales/tests/integration/**` | `toko_test_sales` |
| `src/modules/inventory/tests/integration/**` | `toko_test_inventory` |

Implikasi:
- Reporting test **tidak bisa** merusak data Sales
- Sales test **tidak bisa** mempengaruhi Inventory
- Semua suite boleh dijalankan **parallel**

---

### 3.3 Lifecycle Schema per Suite

Lifecycle yang dikunci:

1. **Before test suite**
   - Drop schema (jika ada)
   - Create schema baru
   - Apply Prisma schema (migrate atau db push)

2. **During tests**
   - Bebas insert/update/delete
   - Tidak perlu cleanup agresif

3. **After test suite (opsional)**
   - Drop schema (terutama di CI)

Tidak ada kewajiban `deleteMany()` di setiap test case.

---

## 4. Dampak terhadap Sistem

### 4.1 Yang Berubah

- Ada lapisan **test database bootstrap**
- Prisma Client test-aware terhadap schema
- Setup integration test menjadi eksplisit

### 4.2 Yang Tidak Berubah

- Domain logic
- Use case Step 1 & 2
- Reporting query & DTO
- Boundary test
- Runtime Prisma configuration

Perubahan **terisolasi di infrastruktur test**.

---

## 5. Aturan Keras Pasca Keputusan

Setelah keputusan ini dikunci:

- ❌ Jangan mengandalkan `describe.sequential` sebagai solusi default
- ❌ Jangan menambah `deleteMany()` sebagai tameng race condition
- ❌ Jangan men-disable foreign key demi test hijau
- ❌ Jangan berbagi schema antar module

Jika hal-hal di atas dilakukan, berarti keputusan ini dilanggar.

---

## 6. Alasan Profesional di Balik Keputusan

Strategi schema-per-suite:
- Menghilangkan shared mutable state
- Menjaga FK tetap jujur
- Membuat test deterministik dan repeatable
- Memungkinkan scaling jumlah integration test tanpa degradasi stabilitas

Pendekatan ini lazim dipakai pada sistem backend serius dengan database nyata.

---

## 7. Status

Dokumen ini berstatus **DESIGN LOCKED**.

Implementasi dilakukan bertahap, dimulai dari:
1. Reporting Integration Test
2. Sales Integration Test
3. Inventory Integration Test

Perubahan atau pembatalan keputusan **wajib melalui ADR baru**.

🔒 Parallel Execution Policy (Database Integration Tests)
Problem Statement

Database-based integration tests may become flaky when executed in parallel due to:
- Shared schema usage
- Concurrent deleteMany() and create() operations
- Foreign key constraint timing conflicts
- Non-deterministic execution order between test files

Observed symptoms include:
- Random FK constraint violations
- Inconsistent result lengths (e.g., expected 2 rows, received 0)
- Tests passing on one run and failing on the next without code changes

Decision
All database-backed integration tests MUST run in serial execution mode.

Vitest configuration:

export default defineConfig({
  test: {
    maxWorkers: 1,
  },
});

or via CLI:

npx vitest run --maxWorkers=1

Rationale
- Deterministic execution
- Eliminates race conditions between test suites
- Prevents FK delete timing conflicts
- Keeps schema-per-suite strategy stable
- Reduces debugging overhead

Non-Goals
This policy does NOT aim to:
- Optimize test runtime
- Support parallel DB integration tests
- Provide worker-level schema isolation

Parallel DB isolation (e.g., per-worker schema or transaction rollback strategy) is intentionally out of scope for MVP Step 3.

Status
LOCKED — MVP Step 3
Database integration tests are intentionally serial for stability and determinism.