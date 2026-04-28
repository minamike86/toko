# ADR-0016 — Measurement & Unit Normalization

## Status

Status: ACCEPTED

---

## Context

Sistem saat ini:

- Inventory sudah stabil sebagai source of truth quantity
- Procurement menyimpan snapshot unit transaksi
- Tidak ada standar internal untuk representasi quantity lintas unit

Masalah:

- Input quantity dapat datang dalam berbagai unit (pcs, box, dll)
- Tidak ada canonical representation
- Berpotensi ambiguity pada receive flow dan reporting

---

## Decision

### 1. Canonical Unit per ProductVariant

Setiap ProductVariant wajib memiliki tepat satu canonical unit.

Canonical unit adalah satuan internal resmi untuk seluruh quantity di sistem.

---

### 2. Conversion Model

Sistem hanya mendukung:

input unit → canonical unit

Tidak mendukung:

- two-way conversion
- chaining conversion
- fallback behavior

---

### 3. Ownership

| Concern | Owner |
|--------|------|
| Unit & conversion rule | Catalog |
| Quantity & stock | Inventory |
| Transaction snapshot | Procurement |

---

### 4. Conversion Boundary

- Rule conversion didefinisikan di domain Catalog
- Conversion dieksekusi di application layer
- Inventory hanya menerima canonical quantity
- UI tidak boleh melakukan conversion

---

### 5. Invariant

- Semua mutation inventory wajib menggunakan canonical unit
- Tidak boleh ada unit tanpa conversion rule
- Tidak boleh ada fallback conversion
- Histori tidak boleh diubah

Jika conversion gagal:

→ request wajib ditolak  
→ inventory tidak boleh dipanggil

---

## Consequences

### Positif

- Quantity deterministik
- Boundary domain tetap bersih
- Reporting lebih konsisten

### Negatif

- Tambahan validasi pada receive flow
- Perlu explicit conversion rule per variant

---

## Constraints

- Tidak boleh mengubah histori
- Tidak boleh menambah costing logic
- Tidak boleh mengubah invariant Inventory
- Tidak boleh melakukan conversion di UI
- Tidak boleh membuat fallback behavior

---

## Impact

- Inventory: canonical-only input
- Procurement: membutuhkan normalization sebelum receive
- Reporting: hanya membaca, tidak melakukan conversion

---

## Status Dampak

- Additive
- Non-breaking (selama histori tidak diubah)
