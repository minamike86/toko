# Sales Integration Happy Path

**Status: DESIGN LOCKED**

Dokumen ini menetapkan alur bisnis Sales yang dianggap benar (happy path) dan menjadi referensi tunggal untuk integration test Sales pada MVP Step 3.

Dokumen ini tidak dimaksudkan untuk mencakup seluruh edge case. Fokusnya adalah menetapkan satu alur yang sah, stabil, dan boleh diasumsikan oleh test lain.

## Ruang Lingkup

Berlaku untuk:
- Modul Sales
- Interaksi Inventory melalui domain
- Integration test berbasis schema-per-suite

Tidak mencakup:
- Reporting
- Refund / return flow
- Multi-payment atau partial payment

## Happy Path yang Dikunci

### Skenario
Create OFFLINE Order dengan CASH → Order PAID → Stock berkurang → Cancel → Stock kembali

### Preconditions
- Inventory harus tersedia untuk setiap product yang dipesan.
- Inventory tidak boleh diasumsikan ada; harus di-seed secara eksplisit oleh test.
- Database berada dalam kondisi bersih per suite (schema-per-suite).

## Langkah Bisnis

1. Create Order
   - Input wajib:
     - orderId
     - type = OFFLINE
     - createdBy
     - payment = "CASH"
     - items[] { productId, quantity }
   - Harga diambil dari CatalogReadRepository.
   - Total amount dan status ditentukan oleh domain, bukan oleh input.

2. Efek Langsung
   - Order berstatus PAID.
   - outstandingAmount = 0.
   - Inventory langsung berkurang sesuai quantity.

3. Cancel Order
   - Order berstatus CANCELED.
   - Inventory dikembalikan penuh ke kondisi awal.

## Invariant yang Dikunci

- CreateOrder tidak menerima unitPrice, totalAmount, paidAt, atau actor.
- Inventory tidak pernah diasumsikan memiliki state default.
- CancelOrder wajib mengembalikan inventory.
- Semua perubahan stok harus melalui domain, bukan manipulasi langsung database.

## Referensi Implementasi

Happy path ini direpresentasikan oleh file:
- CreateAndCancelOrder.integration.test.ts

Test tersebut adalah canonical integration test dan tidak boleh diubah tanpa revisi dokumen ini.

## Status

Dokumen ini DESIGN LOCKED. Setiap perubahan pada alur ini dianggap sebagai perubahan bisnis dan wajib melalui ADR dengan penandaan BREAKING atau NON-BREAKING.

