# Step 4.2 – Payment Settlement Hardening (Optimistic Locking + Transaction)

**Status:** DESIGN LOCK – Implementation Required  
**Applies To:** Sales Domain (PayCredit / Payment Settlement)  
**Parent Doc:** Step 4.2 – Payment Settlement Execution Plan  
**Hardening Goal:** Concurrency-safe settlement without DB vendor-specific row locks

---

## 1. Purpose

Dokumen ini memformalkan strategi hardening untuk Step 4.2 menggunakan:

- **Optimistic locking** pada Order (versioning)
- **Database transaction** untuk atomic settlement

Tujuan:

- Mencegah race-condition yang dapat menyebabkan overpayment
- Menjadikan outstanding sebagai derived cache yang aman
- Menyediakan pola yang future-proof untuk scale dan evolusi arsitektur

---

## 2. Scope

Hardening ini mencakup:

- Use case `PayCredit`
- Repository persistence untuk `Order` dan `Payment`
- Schema perubahan minimal untuk mendukung versioning
- Integration test untuk race-condition

Tidak mencakup:

- Variant activation (Step 4.3)
- Reporting changes
- Inventory

---

## 3. Design Decision

### 3.1 Why Optimistic Locking

Optimistic locking dipilih karena:

- DB-agnostic dan tidak bergantung pada `SELECT FOR UPDATE`
- Cocok untuk sistem yang tumbuh (lebih mudah scale-out)
- Selaras dengan DDD: `Order` adalah aggregate boundary untuk settlement

### 3.2 Locking Target

Lock diterapkan pada **Order row** melalui field `version`.

`Order` dianggap berubah (conflict) jika version yang di-load tidak sama saat update.

---

## 4. Schema Requirements

Tambahkan field berikut ke model `Order`:

```prisma
model Order {
  id               String   @id
  // ... fields lainnya
  outstandingAmount Int
  version          Int      @default(0)

  payments Payment[]

  @@index([status])
  @@index([createdAt])
}
```

Catatan:

- `outstandingAmount` tetap ada sebagai **derived cache**.
- `version` adalah satu-satunya mekanisme konflik untuk settlement.

---

## 5. Repository Contract (Hardening)

Repository harus mendukung transaksi dan update dengan version check.

### 5.1 OrderRepository

Wajib menyediakan:

- `findById(orderId, tx?)`
- `saveWithVersionCheck(order, expectedVersion, tx)`

Aturan:

- `saveWithVersionCheck` harus melakukan update dengan kondisi:
  - `where: { id: order.id, version: expectedVersion }`
  - `data: { ..., version: { increment: 1 } }`
- Jika update count = 0 → throw `OptimisticLockConflictError`

### 5.2 PaymentRepository

Wajib menyediakan:

- `save(payment, tx)`
- `sumAmountByOrderId(orderId, tx)`

---

## 6. Transaction Boundary

Settlement harus berjalan dalam satu transaction:

- Insert Payment
- Sum ulang payment untuk Order
- Recompute outstanding
- Save Order dengan version check

Semua langkah tersebut harus berada di dalam callback transaction yang sama.

---

## 7. PayCredit Algorithm (Authoritative)

Pseudocode (Given/When/Then style):

**Given** Order ON_CREDIT dan amount > 0

**When** PayCredit dieksekusi

**Then** lakukan langkah berikut dalam transaction:

1. Load Order (dengan current version)
2. Validasi status ON_CREDIT
3. Hitung `totalPaid = sum(payments)` dari DB (di dalam tx)
4. Validasi `totalPaid + amount <= order.totalAmount`
5. Persist Payment
6. Hitung ulang `totalPaidAfter = totalPaid + amount`
7. `order.recomputeOutstanding(totalPaidAfter)` (outstanding sebagai cache)
8. `saveWithVersionCheck(order, expectedVersion)`

Jika terjadi `OptimisticLockConflictError`:

- Retry (max 2 attempts)
- Jika masih conflict → gagal dengan error eksplisit

---

## 8. Retry Policy

- Max retry: **2**
- Retry hanya untuk `OptimisticLockConflictError`
- Tidak retry untuk error bisnis (invalid amount, overpayment, status invalid)

---

## 9. Error Discipline

Wajib menggunakan error eksplisit (bukan `new Error`).

Tambahkan error (SalesErrors) minimal:

- `OptimisticLockConflictError`
- `PaymentOverpayError`
- `InvalidPaymentAmountError`
- `OrderNotOnCreditError`

---

## 10. Tests (Hardening Gate)

### 10.1 Integration – Race Condition

- Jalankan dua PayCredit paralel pada order yang sama
- Pastikan:
  - Tidak ada overpayment
  - Salah satu request gagal (atau retry lalu sukses) sesuai aturan

### 10.2 Integration – Double Submit

Jika idempotency key belum diimplementasikan:

- Minimal test: dua request dengan amount sama dieksekusi paralel
- Pastikan invariant overpayment tidak pernah terjadi

Jika idempotency key sudah ada:

- Dua request dengan key sama → hanya satu Payment tercatat

---

## 11. Completion Criteria

Hardening dianggap lulus jika:

1. Semua settlement berjalan dalam transaction
2. `Order.version` digunakan dan conflict ditangani
3. Overpayment tidak mungkin terjadi pada race-condition
4. Error discipline konsisten
5. Integration tests hardening lulus

---

## 12. Placement

File ini harus diletakkan di folder Step 4.2:

```
/docs/03-mvp/step-4/04-2-payment-settlement/step-4-2-hardening-optimistic-locking.md
```

---

**End of Document**

