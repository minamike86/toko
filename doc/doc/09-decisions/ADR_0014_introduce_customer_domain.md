# ADR-0014 – Introduce Customer Domain Activation

**Status:** ACCEPTED (PLANNED – NEXT OPERATIONAL LAYER)
**Date:** 2026-02-14
**Supersedes:** None
**Related:**
- MVP Step 1 – Sales Domain (cash & credit)
- MVP Step 2 – Operational Stability
- MVP Step 4.2 – Payment Settlement Formalization
- Reporting Boundary Policy

---

## 1. Context

Sistem saat ini telah mendukung:

- Penjualan cash dan credit
- Partial payment (cicilan)
- Outstanding derived dari payment
- Reporting cash vs credit

Namun, sistem belum memiliki entitas resmi untuk merepresentasikan pelanggan (customer).

Konsekuensi dari kondisi saat ini:

- Piutang tidak terikat pada identitas pelanggan formal
- Tidak ada kontrol credit limit
- Tidak ada fondasi untuk histori pembelian per pelanggan

Untuk meningkatkan stabilitas operasional tanpa masuk ke CRM atau Accounting penuh,
diperlukan aktivasi Customer Domain.

---

## 2. Decision

Diperkenalkan domain baru: **Customer Domain**.

Customer Domain bertanggung jawab atas:

- Identitas pelanggan
- Status aktif / nonaktif
- Credit limit

Sales Domain tetap bertanggung jawab atas:

- Order
- Payment
- Outstanding

Sales hanya akan mereferensikan `customerId` tanpa memindahkan logika bisnis ke Customer.

---

## 3. Architectural Position

High-level separation:

Demand Side:
- Customer Domain
- Sales Domain

Supply Side:
- Procurement Domain

Observation:
- Reporting
- Dashboard

Aturan integrasi:

- Order dapat memiliki `customerId` (opsional untuk transaksi retail cash)
- Outstanding dihitung dari Sales (bukan dari Customer)
- Customer tidak menyimpan daftar Order secara langsung

---

## 4. Scope of Implementation

### 4.1 Customer Entity (Minimal)

Field minimal:

- id
- name
- contact (opsional)
- status (ACTIVE | INACTIVE)
- creditLimit (nullable atau default 0)
- createdAt
- updatedAt

### 4.2 Credit Limit Rule

Saat membuat order dengan metode credit:

Validasi:

(currentOutstanding + newCreditAmount) <= creditLimit

Jika melebihi creditLimit → transaksi ditolak.

Credit limit = 0 berarti tidak diizinkan transaksi credit.

---

## 5. Explicit Non-Goals

Step ini TIDAK mencakup:

- Loyalty program
- Diskon personal otomatis
- CRM automation
- Marketing segmentation
- Denda keterlambatan
- Scoring kredit kompleks

Aging receivable tetap berada di Reporting layer dan bukan bagian dari domain write-model.

---

## 6. Boundary Protection Rules

1. Customer tidak memiliki logika pembayaran.
2. Customer tidak menyimpan referensi langsung ke daftar Order.
3. Tidak ada business rule di UI.
4. Tidak ada perubahan terhadap invariant Inventory.
5. Tidak ada journal entry yang diperkenalkan.

---

## 7. Migration & Compatibility

- Order lama tanpa customerId tetap valid.
- customerId bersifat opsional pada fase awal.
- Tidak ada perubahan pada histori transaksi.

---

## 8. Consequences

### Positive

- Piutang terikat ke identitas pelanggan
- Kontrol kredit lebih aman
- Fondasi untuk aging receivable
- Fondasi untuk ekspansi ERP di masa depan

### Trade-offs

- Kompleksitas domain bertambah
- Perlu validasi tambahan pada createOrder

Namun perubahan ini tidak menyentuh Accounting Domain.

---

## 9. Activation Criteria

Customer Domain diaktifkan ketika:

- Sistem telah stabil pada Step 4
- Payment Settlement (Step 4.2) telah formal
- Tidak ada mismatch outstanding

---

## 10. Purchase History Clarification

Histori pembelian pelanggan bukan bagian dari aggregate Customer.

Customer Domain tidak menyimpan daftar Order atau OrderItem.

Histori pembelian diperoleh melalui Reporting / Query layer dengan membaca:
- Order
- OrderItem
- Payment
berdasarkan customerId.

Dengan demikian:
- Customer tetap lightweight dan tidak memiliki ketergantungan ke Sales
- Tidak terjadi circular dependency antar domain
- Boundary antara Customer dan Sales tetap satu arah

---

## 11. Final Statement

Customer Domain diperkenalkan sebagai lapisan operasional pada sisi demand.

Domain ini tidak menjadikan sistem sebagai CRM dan tidak mengubah sistem menjadi ERP penuh.

Aktivasi ini bertujuan meningkatkan kontrol kredit dan stabilitas operasional tanpa melanggar boundary yang telah dikunci pada MVP sebelumnya.

