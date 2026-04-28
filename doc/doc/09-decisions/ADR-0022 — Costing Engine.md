# ADR-0022 — Costing Engine

Status: DESIGN LOCKED  
Step: MVP Step 8 — Costing Engine  
Change Type: Additive, Non-Breaking

## Decision

Sistem menggunakan domain baru `Costing` untuk menyimpan cost aktif per `ProductVariant`.

Model costing Step 8 adalah:

- Last Purchase Cost per ProductVariant
- Immutable COGS snapshot pada OrderItem
- Replacement margin untuk kebutuhan operasional owner

Step 8 tidak menggunakan:

- FIFO
- Moving Average
- Batch / Lot costing
- Retroactive recalculation
- Manual cost edit

## Rationale

Cost tidak boleh disimpan di Inventory karena Inventory adalah source of truth quantity, bukan nilai harga.

Cost tidak boleh dihitung di Sales karena Sales hanya melakukan transaksi dan menyimpan snapshot saat order dibuat.

Costing harus menjadi boundary sendiri agar dapat berkembang ke batch / FIFO / accounting-grade logic di masa depan.

## Rules

1. Cost disimpan sebagai integer rupiah.
2. Cost dihitung pada level ProductVariant.
3. `CostState.currentCost` hanya berubah saat procurement accepted/finalized.
4. CostState tidak boleh dihapus setelah dibuat.
5. Sumber cost adalah `PurchaseItem.unitCost`.
6. Cost hanya boleh diambil dari item dengan accepted quantity pada FinalizeInspectionAcceptance.
7. Rejected dan quarantined item tidak boleh mempengaruhi cost.
8. `OrderItem.cogsAmount` disimpan sebagai snapshot saat order dibuat.
9. `OrderItem.cogsAmount` tidak boleh berubah setelah order dibuat.
10. Margin historis memakai `OrderItem.cogsAmount`.
11. Replacement margin memakai `CostState.currentCost`.
12. Costing tidak boleh mengubah Inventory.
13. Costing tidak boleh membuat accounting journal.

Cost tidak boleh diubah oleh:

- UI
- script manual
- domain selain procurement acceptance

Satu-satunya entry point perubahan cost adalah:

- FinalizeInspectionAcceptance

## Boundary

Procurement:

- menyediakan `unitCost`
- tidak menyimpan logic costing

Inventory:

- hanya quantity
- tidak mengetahui cost

Sales:

- mengambil snapshot cost
- tidak menghitung current cost

Costing:

- menyimpan current cost
- menyediakan cost snapshot
- menyediakan data margin

Reporting/UI:

- read-only
- tidak menghitung ulang business rule

## Deferred

- FIFO
- Batch / Lot Tracking
- Accounting Journal
- Tax
- Manual Cost Adjustment
- Retroactive COGS recalculation

## Consequence

Sistem dapat menampilkan margin operasional tanpa merusak histori transaksi.

Model ini tidak akurat secara batch, tetapi sengaja dipilih untuk menjaga MVP tetap sederhana dan siap berkembang.
