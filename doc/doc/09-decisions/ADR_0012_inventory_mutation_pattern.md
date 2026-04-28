# ADR-0012 – Inventory Mutation Pattern (Snapshot + Movement)

**Status:** Accepted (Step 1 Trade-off)  
**Date:** 2026-02-12  
**Scope:** Inventory Domain – All Mutation Use Cases  
**Related ADR:**  
- ADR-0010 – Tech Debt: Receive Stock Atomicity  
- ADR-0011 – Missing IssueStock Use Case Specification  
**Target Revisit:** MVP Step 4 – Inventory Consistency Stabilization

Migrasi ke variantId tidak mengubah pola mutasi snapshot + movement sebagaimana ditetapkan di ADR-0012 

---

## 1. Context

Inventory Domain pada MVP Step 1 menggunakan pola mutasi yang konsisten di seluruh use case perubahan stok.

Use case yang termasuk dalam pola ini:

- InitializeStock
- ReceiveStock
- AdjustStock
- IssueStock

Semua mengikuti pendekatan yang sama dalam menangani perubahan stok.

---

## 2. Architectural Pattern

### 2.1 Dual Representation Model

Inventory menyimpan dua representasi data:

1. **Snapshot state**  
   - `InventoryItem.quantity` merepresentasikan stok saat ini.

2. **Historical record**  
   - `StockMovement` merepresentasikan fakta perubahan stok.

Snapshot digunakan untuk performa dan query cepat.
Movement digunakan sebagai histori operasional.

Sistem tidak menggunakan event sourcing penuh pada MVP Step 1.

---

### 2.2 Mutation Flow

Setiap perubahan stok dilakukan dengan pola berikut:

```
1. Mutasi snapshot (increase / decrease)
2. Persist StockMovement
```

Atomic transaction tidak dijamin di level desain domain.

Walaupun repository dapat menggunakan transaksi database, konsistensi bukan dijamin oleh desain domain, melainkan oleh implementasi infrastruktur.

---

## 3. Problem Statement

Konsekuensi dari pola ini:

- Atomicity belum dijamin secara konseptual.
- Snapshot dan movement berpotensi tidak sinkron jika terjadi kegagalan parsial.
- Konsistensi bergantung pada disiplin implementasi repository dan pengujian.

Hal ini bukan bug spesifik satu use case, melainkan karakteristik arsitektur MVP Step 1.

---

## 4. Decision

Diputuskan bahwa:

- Pola snapshot + movement non-atomic diterima sebagai trade-off pada MVP Step 1.
- Tidak dilakukan refactor struktural sebelum Step 4.
- Konsistensi dijaga melalui testing discipline dan repository implementation.

ADR ini bersifat sistemik dan tidak menggantikan ADR spesifik seperti ADR-0010.

---

## 5. Relationship with Other ADR

- **ADR-0010** membahas kasus spesifik ReceiveStock dan debt atomicity yang teridentifikasi.
- **ADR-0011** membahas formalization IssueStock sebagai use case eksplisit.
- **ADR-0012** menetapkan pola umum mutasi Inventory yang menaungi seluruh use case.

ADR-0012 tidak membatalkan atau menggantikan ADR sebelumnya.

---

## 6. Future Evolution (Step 4.4)

Pada MVP Step 4 – Inventory Consistency Stabilization:

Opsi evolusi yang mungkin:

1. Domain-driven atomic mutation
   ```ts
   const movement = inventory.mutate(...)
   repository.saveAtomically(inventory, movement)
   ```

2. Repository-level atomic mutation
   ```ts
   inventoryRepo.mutateStock(...)
   ```

Tujuan:

- Snapshot dan movement selalu konsisten
- Tidak ada mutation tanpa movement
- Deterministic historical reconstruction

---

## 7. Consequences

### Positive

- Implementasi sederhana dan cukup untuk MVP
- Mudah dipahami
- Tidak masuk kompleksitas event sourcing

### Negative

- Konsistensi belum kuat secara desain
- Perlu hardening pada fase berikutnya

---

## 8. Non-Goals

ADR ini tidak:

- Mengubah kontrak use case
- Mengubah behavior test
- Mengubah implementasi repository
- Menghapus atau menggantikan ADR sebelumnya

---

## Status

🔒 Accepted  
Akan direview pada MVP Step 4 – Inventory Consistency Stabilization.

---

**End of ADR-0012**

