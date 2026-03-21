# Phase 1 Implementation Checklist
## Payment Settlement (ADR-0007)

Dokumen ini berfungsi sebagai **panduan eksekusi** untuk Phase 1 (Payment Settlement).
Checklist ini **bukan keputusan arsitektur**, melainkan pagar implementasi agar perubahan tidak melanggar lock MVP Step 1 & 2.

---

## Tujuan Phase

Menyediakan pencatatan **fakta pembayaran (waktu dan jumlah)** secara eksplisit untuk transaksi ON_CREDIT,
sebagai prasyarat observability dan reporting internal.

Scope Phase ini **terbatas pada Payment Settlement** dan **tidak mencakup** Product Variant, Stock Origin, Procurement, maupun Reporting.

---

## 0. Pre-flight Check (WAJIB)

Sebelum menyentuh kode apa pun:

- ADR-0007 berstatus **Approved**
- ADR-0008 dan ADR-0009 **tidak diimplementasikan**
- Implementation Lock Notes memuat referensi ADR-0006, 0007, 0008, 0009
- Tidak ada task paralel di luar Phase 1
- Seluruh perubahan dipahami sebagai **BREAKING terkontrol**

Jika salah satu poin tidak terpenuhi, **Phase 1 tidak boleh dimulai**.

---

## 1. Scope Guard

### Boleh Disentuh

- Sales domain (Order, PayCredit)
- Persistence schema terkait pembayaran
- Audit / payment recording
- Integration test menggunakan Prisma (sesuai ADR-0006)

### Dilarang Disentuh

- Product / Catalog
- Inventory modeling
- Stock Origin classification
- Reporting module
- UI flow baru

Perubahan di luar daftar "Boleh Disentuh" dianggap **pelanggaran Phase**.

---

## 2. Domain Checklist

- Terdapat entity / record pembayaran terpisah (Payment / CreditSettlement)
- Order **tidak** menyimpan histori pembayaran
- `outstandingAmount` diperlakukan sebagai derived state
- Tidak ada logika reporting di domain
- Partial payment tidak melanggar invariant domain

Shortcut seperti penambahan `paidAt` tanpa payment record **tidak diperbolehkan**.

---

## 3. Use Case Checklist (PayCredit)

- PayCredit mencatat payment event secara eksplisit
- PayCredit tidak mengubah makna `Order.createdAt`
- Order menjadi PAID berdasarkan akumulasi payment
- Error handling, audit trail, dan logging konsisten dengan Step 2

Tidak boleh ada flag implisit atau asumsi satu kali pembayaran.

---

## 4. Database & Migration Checklist

- Terdapat struktur tabel baru untuk payment
- Migrasi tidak mengubah atau merekonstruksi data lama
- Tidak ada backfill histori fiktif
- Legacy order tetap tanpa timestamp PAID historis

Prinsip utama: **jangan memalsukan masa lalu demi data yang terlihat rapi**.

---

## 5. Testing Checklist (Wajib Patuh ADR-0006)

### Unit Test

- Domain test tanpa database
- Tidak mengimpor Prisma
- Fokus pada invariant pembayaran

### Integration Test

- Prisma boleh digunakan
- Menguji:
  - partial payment
  - full settlement
  - konsistensi data
- Tidak menambahkan aturan bisnis baru di test

---

## 6. Exit Criteria (Tidak Bisa Ditawar)

Phase 1 **hanya dianggap selesai jika**:

- Fakta pembayaran tercatat eksplisit
- Seluruh test hijau
- Tidak ada domain lain berubah
- ADR-0007 masih akurat
- MVP Step 1 & 2 dikunci ulang

Jika satu poin belum terpenuhi, Phase 1 **belum selesai**.

---

## 7. Post-lock Ritual

Setelah Phase 1 selesai:

- Tambahkan catatan lock singkat:
  "Payment Settlement implemented per ADR-0007"
- Pastikan tidak ada branch atau perubahan liar tersisa
- Phase 2 baru boleh dibicarakan setelah lock ulang selesai

---

## Catatan Penutup

Checklist ini bertujuan menjaga **disiplin perubahan**, bukan mempercepat implementasi.
Phase 1 sengaja dibuat sempit agar perubahan besar tetap dapat diaudit dan dipahami.

