# ADR-0020 — Supplier Payable & Payment Handling

Status: ACCEPTED / IMPLEMENTED
Step: 7 — Supplier Payable
Type: FEATURE / DOMAIN EXTENSION

---

## Context

Setelah Step 6.5 (Measurement & Unit Normalization), sistem telah mampu:

* membuat Purchase Order
* menerima barang ke inventory
* menjaga konsistensi quantity dalam canonical unit

Namun sistem belum mampu menjawab:

* berapa hutang ke supplier
* apakah pembelian sudah dibayar
* bagaimana pembayaran parsial dicatat
* bagaimana retur pembelian mempengaruhi hutang

Hal ini menghambat operasional procurement sehari-hari.

---

## Decision

Sistem akan memperkenalkan konsep **Supplier Payable** sebagai bagian dari domain Procurement.

Payable memiliki karakteristik:

* terbentuk saat Purchase Order diterima (RECEIVED)
* berkurang melalui:

  * Supplier Payment
  * Purchase Return
* bersifat **monotonic decreasing (tidak boleh bertambah setelah terbentuk)**

---

## Scope

### Included

* Outstanding hutang per supplier
* Partial payment
* Full payment
* Payment history (immutable)
* Purchase return yang mengurangi hutang

### Excluded (Non-Goals)

* Accounting journal / ledger
* Interest / penalty
* Payment scheduling
* Multi-currency
* Financial reconciliation kompleks
* Perubahan histori

---

## Core Concepts

### Supplier Payable

Representasi hutang ke supplier yang berasal dari Purchase Order.

Sifat:

* terkait dengan Purchase Order
* memiliki nilai total dan sisa hutang
* tidak boleh negatif
* tidak boleh diubah langsung

---

### Payment

Representasi pembayaran ke supplier.

Sifat:

* immutable
* hanya bisa ditambahkan
* tidak bisa dihapus atau diubah
* mengurangi payable

---

### Purchase Return

Representasi pengembalian barang ke supplier.

Sifat:

* mengurangi nilai hutang
* tidak mengubah histori payment
* bukan pembayaran

---

## Invariants

* payable ≥ 0
* totalPaid ≤ payable awal
* payableRemaining = payableInitial - totalPaid - totalReturn
* tidak ada operasi yang boleh:

  * mengubah histori payment
  * mengubah histori return
  * menambah payable setelah PO received

---

## Use Cases

### 1. Record Supplier Payment

Input:

* purchaseOrderId
* amount
* actor

Behavior:

* validasi PO sudah RECEIVED
* validasi amount > 0
* validasi tidak melebihi outstanding
* create payment record
* persist payment record

(outstanding dihitung secara derived dari histori payment dan return)

---

### 2. Get Supplier Outstanding

Input:

* supplierId

Behavior:

* agregasi semua PO yang belum lunas
* return total outstanding
* read-only

---

### 3. Handle Purchase Return (Reduce Payable)

Input:

* purchaseOrderId
* returnItems
* actor

Behavior:

* validasi PO sudah RECEIVED
* validasi item valid
* hitung nilai return
* menambah histori return → outstanding berkurang secara derived
* tidak mengubah histori payment

---

## Boundary Rules

* Payable berada dalam domain Procurement (MVP)
* Tidak boleh membuat domain baru “Accounting”
* Payment tidak boleh memanggil Inventory
* Return tidak boleh memanggil Payment
* Reporting hanya read-only

---

## Error Handling

Semua error harus menggunakan business error:

* PAYMENT_EXCEEDS_OUTSTANDING
* INVALID_PAYMENT_AMOUNT
* PURCHASE_ORDER_NOT_RECEIVED
* RETURN_EXCEEDS_AVAILABLE
* SUPPLIER_NOT_FOUND

---

## Data Behavior

* Payment: append-only
* Return: append-only
* Outstanding: derived, bukan stored langsung

---

## Trade-offs

* Tidak mendukung audit finansial penuh
* Tidak ada rollback payment
* Tidak ada koreksi histori

---

## Consequences

* Sistem bisa melacak hutang supplier
* Operasional procurement menjadi usable
* Sistem siap menuju costing (Step 8)

---

## Open Questions

* apakah return mempengaruhi inventory reversal? (butuh sinkronisasi dengan Step 6 flow)
* apakah payment perlu reference eksternal (invoice)? (ditunda)

---

## Decision Status

PROPOSED — menunggu implementasi use case & validasi test
