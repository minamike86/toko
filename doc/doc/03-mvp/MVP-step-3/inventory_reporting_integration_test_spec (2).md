# Inventory Reporting – Integration Test Specification

**Status:** DESIGN FINAL – READY TO IMPLEMENT  
**Scope:** MVP Step 3 – Reporting (Inventory Only)  
**Type:** Functional Integration Test Specification (Given / When / Then)

---

## 1. Tujuan Dokumen

Dokumen ini mendefinisikan spesifikasi integration test untuk:

- `InventorySnapshotReport`
- `InventoryMovementHistoryReport`
- `LowStockReport`

Dokumen ini:

- Tidak berisi kode
- Tidak menambah aturan bisnis baru
- Tidak memodifikasi domain Inventory
- Tidak menggantikan Architecture Test Specification

Tujuannya adalah memastikan query reporting:

- Mengembalikan data yang benar
- Konsisten dengan desain Step 3
- Deterministik
- Tidak bergantung pada domain logic

---

## 2. Prinsip Umum Integration Test Reporting

Integration test Inventory Reporting:

1. Menggunakan database nyata.
2. Menggunakan strategi Schema-per-Suite.
3. Membentuk state melalui Database Seed Helper yang idempotent.
4. Tidak menggunakan use case mutasi (ReceiveStock, AdjustStock, IssueStock).
5. Tidak menguji invariant domain.
6. Hanya menguji kebenaran hasil query.
7. Test reporting tidak boleh mengimpor modul domain atau application.
8. Seed helper hanya boleh menggunakan Prisma (tanpa entity domain).
9. Query reporting tidak boleh menggunakan implicit `LIMIT` atau pagination kecuali eksplisit diminta oleh kontrak report.

Jika test membutuhkan logic domain untuk lulus, berarti desain reporting bocor.

---

## 3. Asumsi Teknis (Data Integrity & Time Assumptions)

Integration test ini mengasumsikan:

- Foreign key integrity dijaga oleh schema database.
- Snapshot hanya mencakup produk yang memiliki InventoryItem.
- Produk tanpa InventoryItem TIDAK muncul dalam InventorySnapshotReport.
- InventorySnapshotReport berbasis tabel InventoryItem sebagai sumber utama, bukan tabel Product.
- Movement tanpa product dianggap invalid dan berada di luar scope test.
- `lowStockThreshold` tidak bernilai null.
- Seluruh perbandingan timestamp menggunakan timezone database yang konsisten (diasumsikan UTC atau konfigurasi tunggal yang sama).

Test tidak menguji kerusakan data akibat pelanggaran constraint.

---

## 4. InventorySnapshotReport – Integration Scenarios

### 4.1 Scenario A – Basic Snapshot

**Given**

- Database bersih (schema-per-suite).
- Terdapat:
  - Product A dengan quantity = 100
  - Product B dengan quantity = 0
- Data dibentuk langsung melalui seed database.

**When**

InventorySnapshotReport dijalankan tanpa filter.

**Then**

- Hasil berisi 2 baris.
- Product A memiliki `currentStockQuantity = 100`.
- Product B memiliki `currentStockQuantity = 0`.
- Tidak ada duplikasi baris.
- Ordering WAJIB `ORDER BY productId ASC`.

---

### 4.2 Scenario B – Produk Tanpa InventoryItem Tidak Muncul

**Given**

- Product A memiliki InventoryItem.
- Product B tidak memiliki InventoryItem.

**When**

InventorySnapshotReport dijalankan.

**Then**

- Product A muncul.
- Product B tidak muncul.

---

### 4.3 Scenario C – Snapshot Tidak Direkonstruksi dari Movement

**Given**

- InventoryItem.quantity = 50.
- Terdapat beberapa StockMovement yang totalnya tidak konsisten dengan 50.

**When**

InventorySnapshotReport dijalankan.

**Then**

- `currentStockQuantity` tetap 50.
- Reporting tidak menghitung ulang berdasarkan movement.
- Tidak ada error atau validasi tambahan.

---

### 4.4 Scenario D – Deterministic Ordering

**Given**

- Tiga produk dengan insertion order acak.

**When**

Report dijalankan dua kali berturut-turut.

**Then**

- Urutan hasil identik.
- Tidak bergantung pada insertion order database.
- Ordering tetap `ORDER BY productId ASC`.

---


## 5. InventoryMovementHistoryReport – Integration Scenarios

### 5.1 Aturan Ordering (Normatif)

InventoryMovementHistoryReport WAJIB menggunakan:

`ORDER BY movementDate ASC, id ASC`

Secondary key (`id ASC`) diperlukan untuk menjamin determinisme jika dua movement memiliki timestamp identik.

### Scenario F – Dua Movement Timestamp Identik 

**Given:**

Dua movement dengan movementDate sama tapi id berbeda

**When**

InventoryMovementHistoryReport dijalankan tanpa filter.

**Then:**

Urutan mengikuti id ASC

---

### 5.2 Scenario A – Basic Historical Listing

**Given**

Seed data:

- Product A.
- Movement 1: IN 100 (INITIAL_STOCK, 2024-01-01 10:00:00)
- Movement 2: OUT 20 (ADJUSTMENT, 2024-01-02 10:00:00)
- Movement 3: IN 50 (PROCUREMENT, 2024-01-03 10:00:00)

Semua quantity positif.

**When**

InventoryMovementHistoryReport dijalankan tanpa filter.

**Then**

- Terdapat 3 baris.
- Semua movement muncul tepat satu kali.
- `quantity` selalu positif.
- Reporting tidak mentransformasi sign; quantity yang disimpan diasumsikan selalu positif dan arah ditentukan oleh movementType.
- `movementType` sesuai data.
- Ordering sesuai aturan normatif.
- Tidak ada saldo berjalan.

---

### 5.3 Scenario B – Filter by Date Range (Inclusive)

Filter bersifat:

- `from` = inclusive
- `to` = inclusive
- Perbandingan berbasis timestamp penuh
- Timezone mengikuti konfigurasi database

**Given**

Movement pada:

- 2024-01-01 00:00:00
- 2024-01-02 12:00:00
- 2024-01-03 23:59:59
- 2024-01-04 00:00:00

**When**

Filter from `2024-01-02 00:00:00` to `2024-01-03 23:59:59`.

**Then**

- Movement tanggal 2 dan 3 muncul.
- Movement tanggal 1 dan 4 tidak muncul.

---

### 5.4 Scenario C – Filter by ProductId

**Given**

- Product A dan Product B memiliki movement.

**When**

Filter berdasarkan `productId = A`.

**Then**

- Hanya movement milik Product A yang muncul.
- Movement Product B tidak muncul.

---

### 5.5 Scenario D – Kombinasi Filter ProductId dan Date

**Given**

- Product A memiliki movement pada beberapa tanggal.

**When**

Filter berdasarkan `productId = A` dan rentang tanggal tertentu.

**Then**

- Hanya movement milik Product A dalam rentang tanggal tersebut yang muncul.
- Ordering tetap mengikuti aturan normatif.

---

### 5.6 Scenario E – Reporting Tidak Memvalidasi Konsistensi

**Given**

- InventoryItem.quantity = 10.
- Total movement matematis menghasilkan 50.

**When**

MovementHistoryReport dijalankan.

**Then**

- Semua movement tetap ditampilkan.
- Tidak ada error.
- Reporting tidak mencoba memverifikasi snapshot.
- Reporting tidak mengubah atau mengoreksi arah movement.

---

## 6. LowStockReport – Integration Scenarios

### 6.1 Aturan Ordering (Normatif)

LowStockReport WAJIB menggunakan:

`ORDER BY productId ASC`

---

### 6.2 Scenario A – Basic Threshold Evaluation

**Given**

- Product A: quantity = 10, threshold = 15
- Product B: quantity = 20, threshold = 15
- Product C: quantity = 15, threshold = 15
- Produk dengan quantity = threshold + 1 tidak muncul.

**When**

LowStockReport dijalankan.

**Then**

- Product A muncul.
- Product C muncul.
- Product B tidak muncul.
- Kondisi evaluasi adalah `quantity <= threshold`.
- Ordering sesuai aturan normatif.
- LowStockReport membaca currentStockQuantity dari sumber yang sama dengan InventorySnapshotReport.
---

### 6.3 Scenario B – Produk Tanpa Threshold Tidak Diuji


Produk tanpa threshold tidak boleh ada dalam dataset test dan berada di luar scope integration test ini.

---

### 6.4 Scenario C – Threshold Perubahan Terakhir Berlaku

**Given**

- Product A quantity = 12.
- Threshold awal = 10.
- Threshold diubah menjadi 15.

**When**

LowStockReport dijalankan.

**Then**

- Product A muncul sebagai low stock.
- Reporting menggunakan threshold terakhir.
- Tidak merekonstruksi histori threshold lama.

---

## 7. Negative & Edge Scenarios

### 7.1 Empty Dataset

**Given**

Tidak ada product atau movement.

**When**

Report dijalankan.

**Then**

- Snapshot: hasil kosong.
- Movement history: hasil kosong.
- Low stock: hasil kosong.
- Tidak ada error.

---

### 7.2 Large Dataset (Deterministic Verification)

**Given**

Lebih dari 1000 movement untuk satu produk.

**When**

MovementHistoryReport dijalankan.

**Then**

- Jumlah baris hasil sama dengan jumlah seed.
- Tidak ada implicit limit.
- Tidak ada truncation.
- Ordering tetap sesuai aturan normatif.

---

## 8. Out of Scope Integration Test

Integration test Inventory Reporting tidak menguji:

- Invariant stok negatif.
- Use case mutasi Inventory.
- Audit trail logging.
- Authorization.
- Costing atau valuasi.
- Cross-domain consistency.

Integration test tidak menguji perilaku terhadap quantity negatif; data dianggap valid sesuai domain invariant.
Jika test mulai menyentuh area tersebut, berarti scope bergeser.

Reporting tidak mengoreksi nilai quantity walaupun data tidak konsisten secara domain.

---

## 9. Dampak terhadap Sistem

Spesifikasi ini:

- NON-BREAKING terhadap MVP Step 1.
- NON-BREAKING terhadap MVP Step 2.
- Tidak mengubah Inventory Domain.
- Tidak mengubah kontrak reporting.

Dokumen ini hanya menurunkan desain menjadi kontrak executable.

---

## 10. Definition of Done – Inventory Reporting Integration

Inventory Reporting dianggap siap diimplementasikan jika:

1. Seluruh skenario di atas memiliki test.
2. Test berjalan stabil dengan Schema-per-Suite.
3. Tidak ada ketergantungan pada use case mutasi.
4. Tidak ada kebocoran ke domain entity.
5. Tidak ada rekonstruksi stok dari movement.
6. Ordering dan filter bersifat deterministik dan eksplisit.
7. Tidak ada implicit limit atau pagination tersembunyi.

