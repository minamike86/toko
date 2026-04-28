# PR Checklist — Phase 1 Payment Settlement (ADR-0007)

Checklist ini WAJIB diisi untuk setiap PR yang termasuk Phase 1.
Checklist ini berfungsi sebagai pengaman terakhir sebelum merge.

Jika ada satu saja jawaban **TIDAK**, PR tidak boleh di-merge.

---

## Scope Guard

- [ ] PR ini HANYA menyentuh domain Sales (Order, PayCredit) dan Payment
- [ ] Tidak ada perubahan pada Catalog, Inventory, atau Reporting
- [ ] Tidak ada perubahan UI flow atau API publik baru
- [ ] Tidak ada refactor di luar kebutuhan Payment Settlement

---

## Payment Entity & Domain Rules

- [ ] Payment dicatat sebagai entity terpisah
- [ ] Payment tidak memiliki status (PENDING / CONFIRMED / dll)
- [ ] Payment bersifat immutable (tidak di-update setelah dibuat)
- [ ] Order tetap menjadi penentu status PAID
- [ ] Tidak ada penambahan `paidAt` pada Order

---

## Migration & Data Integrity

- [ ] Migration bersifat additive (tidak mengubah data lama)
- [ ] Tidak ada backfill Payment untuk order historis
- [ ] Tidak ada asumsi `createdAt == occurredAt`
- [ ] Order lama tetap tanpa histori payment

---

## Use Case & Invariant

- [ ] Semua pembayaran dicatat melalui PayCredit
- [ ] Partial payment tidak melanggar invariant Order
- [ ] Tidak ada shortcut logika di application layer
- [ ] Tidak ada logika reporting di domain

---

## Testing Policy (ADR-0006)

- [ ] Domain test tidak mengimpor Prisma
- [ ] Prisma hanya digunakan di integration test
- [ ] Integration test tidak menambah aturan bisnis baru
- [ ] Seluruh test lulus

---

## Exit Criteria Check

- [ ] ADR-0007 masih akurat dan tidak dilanggar
- [ ] Phase 1 checklist tetap terpenuhi
- [ ] MVP Step 1 & 2 siap dikunci ulang setelah merge

---

**PR ini aman untuk di-merge hanya jika seluruh checklist di atas terpenuhi.**
