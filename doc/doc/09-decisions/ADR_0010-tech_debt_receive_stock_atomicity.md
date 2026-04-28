# ADR-0010 – Tech Debt: Receive Stock Atomicity

**Status:** Accepted (Deferred to Step 4)  
**Date:** 2026-02-12  
**Scope:** Inventory Domain – Receive Stock Use Case  
**Related Step:** MVP Step 1 (Core Transaction)  
**Target Resolution:** MVP Step 4 – Domain Hardening & Inventory Consistency Stabilization

---

## Context

Implementasi `ReceiveStock` saat ini melakukan dua operasi terpisah di application layer:

1. `inventoryRepo.increase(productId, quantity)`
2. `inventoryRepo.saveMovement(movement)`

Pendekatan ini bekerja dan memenuhi kebutuhan MVP Step 1, namun memiliki kelemahan arsitektural terkait atomicity dan konsistensi domain.

MVP Step 1 telah dinyatakan CLOSED & DESIGN LOCKED. Oleh karena itu, perubahan struktural besar tidak dilakukan saat ini untuk menjaga stabilitas boundary.

Dokumen ini mencatat keputusan sadar untuk menerima kondisi tersebut sebagai technical debt terkontrol.

---

## Problem Statement

### 1. Atomicity Tidak Dijamin Secara Konseptual

Saat ini perubahan snapshot stok dan pencatatan movement dilakukan secara terpisah.

Risiko teoretis:

- `increase()` berhasil
- `saveMovement()` gagal

Akibatnya:

- Snapshot berubah
- Movement tidak tercatat

Hal ini bertentangan dengan prinsip domain:

> Tidak boleh ada perubahan stok tanpa StockMovement.

Walaupun repository Prisma dapat menggunakan transaksi, atomicity belum dijamin di level desain domain.

---

### 2. Orkestrasi InventoryItem Bersifat Implisit

Use case mengasumsikan repository menangani kondisi InventoryItem yang belum ada.

Konsekuensi:

- Perilaku bergantung pada implementasi repository
- Orkestrasi tidak eksplisit di application layer
- Kontrak domain kurang tegas

---

### 3. Timestamp Movement Tidak Dapat Diinject

`StockMovement` saat ini menggunakan `new Date()` secara langsung.

Implikasi:

- Test tidak deterministik sepenuhnya
- Replay historis sulit
- Migrasi data terbatas

Untuk MVP awal hal ini dapat diterima, namun tidak ideal untuk domain yang mengutamakan histori.

---

## Decision

Tim memutuskan untuk:

- Menerima kondisi ini sebagai technical debt yang terkontrol
- Tidak melakukan refactor pada Step 1 & Step 2
- Menjadikan perbaikan atomicity sebagai bagian dari Step 4

Keputusan ini NON-BREAKING terhadap:

- MVP Step 1
- MVP Step 2
- MVP Step 3 (Reporting Read-Only)

---

## Future Resolution Plan (Step 4.4)

Pada Step 4 – Inventory Consistency Stabilization, desain akan diperkuat menjadi:

### Opsi A – Domain-Driven Mutation

1. Load `InventoryItem`
2. Panggil method domain:
   ```ts
   const movement = inventory.receive(quantity, reason, referenceId, occurredAt);
   ```
3. Repository menyimpan inventory dan movement dalam satu transaksi atomik

Karakteristik:

- Movement selalu dihasilkan oleh domain
- Snapshot dan movement konsisten
- Tidak ada state mutation tanpa movement

---

### Opsi B – Repository Atomic Method

Repository menyediakan method atomik:

```ts
inventoryRepo.receiveStock(...)
```

Dengan jaminan:

- Snapshot dan movement disimpan dalam satu transaksi
- Tidak ada operasi terpisah

---

## Acceptance Criteria for Refactor Completion

Refactor dianggap selesai jika:

- Tidak ada pemanggilan `increase()` terpisah dari movement
- Movement selalu dihasilkan melalui domain behavior
- `occurredAt` dapat diinject secara opsional
- Integration test tetap hijau
- Reporting tetap deterministik
- Tidak ada mismatch snapshot vs movement

---

## Consequences

### Positive

- MVP tetap stabil
- Boundary Step 1 tidak dibuka kembali
- Technical debt terdokumentasi jelas

### Negative

- Atomic consistency belum ideal secara desain
- Bergantung pada disiplin implementasi repository

---

## Rationale

MVP Step 1 bertujuan membuktikan kebenaran transaksi dan stok.

Atomic domain hardening adalah bagian dari evolusi domain (Step 4), bukan bagian dari validasi MVP awal.

Melakukan refactor sekarang berisiko membuka kembali scope yang telah dikunci.

Dengan ADR ini, utang tidak disembunyikan, tetapi dikontrol dan dijadwalkan.

---

## Status

🔒 Accepted – Deferred  
Akan direvisit pada MVP Step 4.4 – Inventory Consistency Stabilization.

---

**End of ADR-0010**

