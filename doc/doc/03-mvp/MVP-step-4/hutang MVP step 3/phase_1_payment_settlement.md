# Phase 1 — Payment Settlement

Dokumen ini merupakan **dokumen induk Phase 1** yang mengikat keputusan (ADR), rencana eksekusi (Phase Checklist), dan pengaman implementasi (PR Checklist).

Phase 1 bertujuan **menambahkan fakta pembayaran secara eksplisit** tanpa melanggar lock MVP Step 1 & 2.

---

## Status

ACTIVE (Implementation Not Started)

Phase ini hanya boleh dijalankan selama seluruh aturan di dokumen ini dan dokumen referensinya dipatuhi.

---

## Tujuan Phase

- Mencatat fakta pembayaran (jumlah dan waktu) secara eksplisit
- Mendukung transaksi ON_CREDIT dan partial payment
- Menyediakan fondasi observability untuk Reporting Step 3

Phase ini **TIDAK** bertujuan:
- Menyempurnakan laporan
- Menangani refund atau reversal
- Mengubah domain selain Sales

---

## Dokumen Referensi Wajib

- **ADR-0007 – Payment Settlement** (keputusan)
- **Phase 1 Implementation Checklist**  
  `/docs/03-mvp/phase-1-payment-settlement-checklist.md`
- **PR Checklist Phase 1**  
  `/docs/03-mvp/pr-checklist-phase-1-payment-settlement.md`
- **ADR-0006 – Integration Test Boleh Menggunakan Prisma**

Dokumen-dokumen di atas bersifat mengikat selama Phase 1 berlangsung.

---

## Mapping Error → Test (WAJIB)

Bagian ini memastikan setiap error penting memiliki representasi test eksplisit.

### Business Rejection

| Kasus | Ekspektasi | Jenis Test |
|------|------------|-----------|
| Order tidak ditemukan | Error eksplisit, tidak ada Payment | Unit Test (Use Case) |
| Order sudah PAID | Error, Payment tidak dibuat | Unit Test |
| Order CANCELED | Error, Payment tidak dibuat | Unit Test |
| Amount ≤ 0 | Error validasi | Unit Test |
| Amount > outstanding | Error overpayment | Unit Test |

### Concurrency & Consistency

| Kasus | Ekspektasi | Jenis Test |
|------|------------|-----------|
| Dua pembayaran bersamaan | Satu sukses, satu gagal | Integration Test |
| Outstanding berubah di tengah transaksi | Retry diperlukan | Integration Test |

### Transaction Integrity

| Kasus | Ekspektasi | Jenis Test |
|------|------------|-----------|
| Payment insert gagal | Order tidak berubah | Integration Test |
| Order update gagal | Payment tidak tersimpan | Integration Test |

---

## Scope Guard Phase 1 (Ringkasan)

**Boleh disentuh:**
- Sales domain (Order, PayCredit)
- Payment entity dan persistence

**Dilarang disentuh:**
- Catalog, Inventory, Reporting
- UI flow baru
- Backfill data historis

---

## Exit Criteria Phase 1

Phase 1 **hanya boleh ditutup** jika:

- Seluruh checklist Phase 1 terpenuhi
- Seluruh PR checklist lulus
- Mapping error → test terimplementasi
- MVP Step 1 & 2 dikunci ulang

---

## Catatan Penutup

Dokumen ini berfungsi sebagai **pengikat terakhir** sebelum implementasi.
Jika terdapat kebutuhan di luar scope Phase 1, maka Phase 1 harus dihentikan dan keputusan baru dicatat melalui ADR.

### Phase 1 Freeze Declaration

Phase 1 — Payment Settlement dinyatakan **FROZEN** untuk tahap desain dan perencanaan.

Seluruh keputusan arsitektural, batasan scope, strategi migrasi,
pola query, error handling, serta mapping error → test
telah disepakati dan dikunci melalui dokumen berikut:

- ADR-0007: Payment Settlement
- Phase 1 — Payment Settlement
- Phase 1 Implementation Checklist
- PR Checklist Phase 1 Payment Settlement

Setelah titik ini, perubahan hanya diperbolehkan dalam bentuk
implementasi teknis yang **mematuhi seluruh dokumen di atas**.

Setiap kebutuhan di luar scope Phase 1
WAJIB dihentikan dan diajukan sebagai ADR baru.
