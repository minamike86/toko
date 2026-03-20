# Step 4.2 – Payment Settlement Execution Plan

**Status:** In Progress (Hybrid Transitional Model)  
**Parent:** MVP Step 4 – Stabilization & Formalization  
**Scope:** Sales Domain (Payment & Order Settlement)

---

## 1. Purpose

Dokumen ini mendefinisikan urutan implementasi resmi untuk Step 4.2 – Payment Settlement Formalization.

Tujuan utamanya adalah memformalkan model pembayaran agar:

- Outstanding tidak lagi disimpan sebagai nilai mutable
- Outstanding selalu diturunkan (derived) dari histori pembayaran
- Mendukung partial payment
- Aman terhadap concurrency
- Tidak merusak Step 1–3 yang telah dikunci

---

## 2. Pre-Conditions

Implementasi Step 4.2 hanya boleh dimulai jika:

1. Step 4.1 (Stock Origin) telah selesai dan seluruh test lulus.
2. Reporting Step 3 tetap deterministik.
3. Tidak ada perubahan write-model selain yang direncanakan di dokumen ini.

---

## 3. Scope of Implementation

### 3.1 Introduce Payment Entity

Tambahkan entitas resmi:

```
Payment {
  id
  orderId
  amount
  paidAt
  method
}
```

Aturan:

- Payment immutable setelah tercatat.
- Tidak ada edit payment; koreksi dilakukan dengan payment baru.

---

### 3.2 Derived Outstanding (Target Model)

### Previous State (Legacy)

- Outstanding disimpan sebagai field mutable.
- Outstanding dikurangi langsung saat payment masuk.

### Transitional State (Current Hybrid)

- Outstanding masih disimpan sebagai field fisik pada Order.
- Outstanding direcompute setiap kali payment ditambahkan.
- Outstanding saat ini diperlakukan sebagai derived cache, bukan source of truth.

### Target Final State

Outstanding dihitung sebagai:

```
order.totalAmount - sum(all payments)
```

Outstanding tetap disimpan sebagai **derived cache field**, bukan sebagai nilai yang dimutasi langsung.

Tidak boleh ada update langsung terhadap outstanding.
Source of truth adalah histori Payment.

---

## 3.3 Partial Payment Support

Sistem harus mendukung:

- Pembayaran bertahap
- Pembayaran lunas bertahap
- Validasi agar total pembayaran tidak melebihi total order

---

### 3.4 Concurrency Safety (Hardening Required)

### Previous State

- Payment disimpan terlebih dahulu.
- Sum ulang payment dilakukan.
- Order disimpan ulang.
- Tidak ada transaction eksplisit yang mengikat seluruh proses.

### Risk

- Double submit dapat menyebabkan overpayment.
- Race condition dapat menyebabkan outstanding tidak akurat.

### Required Hardening Strategy

Settlement wajib dibungkus dalam satu database transaction.

Strategi minimum yang dipilih:

1. Gunakan database transaction per settlement request.
2. Gunakan optimistic locking melalui field Order.version.
3. Validasi ulang outstanding di dalam transaction.
4. Pastikan tidak ada overpayment sebelum commit.
5. Tangani OptimisticLockConflictError dengan retry terbatas.

### Tambahan

"Detail teknis implementasi hardening dirinci secara normatif dalam step-4-2-hardening-optimistic-locking.md. Dokumen tersebut adalah sumber kebenaran teknis untuk concurrency handling."


Tanpa kelima langkah ini, Step 4.2 tidak boleh dinyatakan selesai.

---

### 3.5 Refactor PayCredit Use Case

Use case lama harus:

- Dialihkan untuk membuat Payment baru
- Tidak lagi memodifikasi outstanding secara langsung
- Tidak mengubah struktur inventory

---

## 4. Non-Goals

Step 4.2 tidak mencakup:

- Perubahan pada Inventory Domain
- Perubahan pada Reporting Step 3
- Accounting system
- Multi-currency

---

## 5. Execution Order

1. Finalisasi desain Payment entity
2. Tambahkan schema dan migration database (termasuk field Order.version)
3. Refactor Order aggregate untuk menghitung outstanding sebagai derived cache
4. Implement saveWithVersionCheck pada OrderRepository
5. Update PayCredit use case dengan transaction + optimistic locking
6. Tambahkan retry policy untuk OptimisticLockConflictError
7. Tambahkan unit test dan integration test untuk settlement (termasuk race condition)
8. Deprecate mekanisme outstanding lama


---

## 6. Completion Criteria (Hardening Gate)

Step 4.2 dianggap selesai hanya jika:

1. Outstanding tidak lagi dimutasi langsung.
2. Outstanding diperlakukan sebagai derived cache.
3. Semua settlement dibungkus dalam database transaction.
4. Order.version digunakan untuk optimistic locking dan conflict ditangani dengan retry terbatas.
5. Overpayment tidak mungkin terjadi dalam race condition.
6. Error handling menggunakan SalesErrors / DomainError (tidak ada generic Error).
7. Partial payment diverifikasi melalui integration test.
8. Reporting Step 3 tetap hijau.
9. Tidak ada logic settlement lama yang aktif.

Step 4.3 (Variant Activation) tidak boleh dimulai sebelum seluruh kriteria ini terpenuhi.

---

## 7. Transitional Hybrid State (Current Implementation)

Saat ini sistem berada dalam fase hybrid:

- Payment entity sudah digunakan sebagai source of fact.
- Outstanding masih disimpan sebagai field fisik pada Order.
- Outstanding direcompute berdasarkan total payment.
- Concurrency safety belum diformalisasi penuh.

Model ini dianggap sebagai **transitional state resmi** dalam Step 4.2.

Tujuan fase hybrid:

1. Memastikan seluruh settlement berbasis Payment entity.
2. Menghilangkan update manual outstanding.
3. Menjaga kompatibilitas dengan reporting Step 3.

Fase hybrid akan dianggap selesai ketika:

- Error handling sudah mengikuti SalesErrors discipline.
- Settlement dibungkus dalam transaction yang aman.
- Outstanding secara eksplisit ditetapkan sebagai derived cache (bukan source of truth).

---

## 8. Post-Completion Alignment

Setelah Step 4.2 selesai sepenuhnya:

- Sistem siap masuk Step 4.3 (Variant Activation)
- Tidak ada technical debt settlement yang tertinggal
- Boundary Sales Domain menjadi lebih formal dan stabil

---

**End of Step 4.2 Execution Plan**

