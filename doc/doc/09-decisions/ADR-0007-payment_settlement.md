# ADR-0007: Payment Settlement & Credit Settlement Recording

## Status
Proposed

## Context

Sistem mendukung dua jenis transaksi: **CASH** dan **ON_CREDIT**. Untuk transaksi ON_CREDIT, penyelesaian pembayaran dapat terjadi di waktu yang berbeda melalui use case *Pay Credit*.

Pada kondisi saat ini:
- `Order` hanya menyimpan status dan nilai agregat (`totalAmount`, `outstandingAmount`).
- Tidak ada pencatatan waktu eksplisit kapan pembayaran (baik penuh maupun sebagian) terjadi.
- Sistem hanya merepresentasikan *state saat ini*, bukan *riwayat penyelesaian pembayaran*.

Konsekuensinya:
- Sistem tidak dapat menentukan waktu pengakuan penjualan berbasis **PAID**.
- Tidak tersedia audit trail pembayaran untuk transaksi kredit.
- Reporting internal tidak dapat membedakan transaksi yang baru saja lunas dengan transaksi yang telah lama lunas.

Keterbatasan ini secara resmi menjadi *blocker* untuk **MVP Step 3 (Reporting)**, yang bersifat read-only dan observasional.

## Decision Drivers

- ON_CREDIT merupakan konsep domain utama, bukan kasus pinggiran.
- Reporting Step 3 mengakui penjualan pada saat transaksi **PAID**.
- Inferensi waktu PAID dari `createdAt` atau data lain tidak dapat diterima.
- Sistem membutuhkan fakta historis yang eksplisit dan dapat diaudit.
- Perubahan harus terdokumentasi secara formal karena menyentuh Step 1 & 2 yang telah dikunci.

## Considered Options

### Option A: Menambahkan `paidAt` pada Order

**Deskripsi**  
Menambahkan kolom `paidAt` pada entity Order dan mengisinya saat status berubah menjadi PAID.

**Kelebihan**
- Implementasi sederhana.
- Perubahan minimal pada struktur domain.
- Mudah digunakan oleh reporting.

**Kekurangan**
- Tidak mendukung partial payment.
- Tidak menyediakan riwayat pembayaran.
- Lemah untuk kebutuhan audit jangka panjang.
- Sulit diperluas jika model pembayaran berkembang.

---

### Option B: Menambahkan Payment / CreditSettlement sebagai Entity Terpisah

**Deskripsi**  
Menambahkan entity baru (misalnya `Payment` atau `CreditSettlement`) yang mencatat setiap peristiwa pembayaran, dengan atribut utama:
- `orderId`
- `amount`
- `occurredAt`
- metadata opsional (method, note, reference)

`Order` tetap menyimpan `outstandingAmount` sebagai state turunan.

**Kelebihan**
- Mendukung partial payment.
- Menyediakan audit trail eksplisit.
- Waktu penyelesaian pembayaran tercatat secara presisi.
- Konsisten dengan lifecycle transaksi ON_CREDIT.
- Lebih siap untuk kebutuhan masa depan.

**Kekurangan**
- Kompleksitas desain meningkat.
- Membutuhkan perubahan pada Step 1 & 2.
- Use case *Pay Credit* harus disesuaikan.

## Decision

Dipilih **Option B**: *Payment / CreditSettlement dicatat sebagai entity terpisah*.

Alasan:
- Transaksi kredit membutuhkan representasi historis, bukan hanya state akhir.
- Reporting membutuhkan fakta waktu PAID yang eksplisit dan dapat diverifikasi.
- Auditability dan observability lebih penting daripada kesederhanaan jangka pendek.
- Desain ini mencegah kebutuhan refactor besar di masa depan.

## Consequences

### Positif
- Waktu PAID dapat ditentukan secara akurat.
- Reporting Step 3 dapat dibangun tanpa inferensi implisit.
- Riwayat pembayaran dapat diaudit.
- Sistem siap mendukung partial payment.

### Negatif
- Step 1 & 2 harus dibuka kembali secara resmi.
- Diperlukan migrasi database.
- Test domain dan integration perlu diperbarui.

## Scope of Change

- Sales domain (Order, PayCredit use case).
- Persistence schema.
- Mekanisme pencatatan pembayaran.

## Out of Scope

- Fiscal / tax reporting.
- Refund atau reversal.
- Integrasi payment gateway.
- Product variant modeling.

## Follow-up Actions

1. Perbarui schema database sesuai keputusan.
2. Sesuaikan use case *Pay Credit*.
3. Perbarui dan tambahkan test yang relevan.
4. Lock ulang Step 1 & 2 setelah stabil.
5. Lanjutkan implementasi MVP Step 3 (Reporting).

