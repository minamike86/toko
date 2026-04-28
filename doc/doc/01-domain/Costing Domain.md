# Costing Domain

### Status

CANONICAL DOMAIN DOCUMENT

---

## Tujuan

Domain Costing bertanggung jawab untuk:

* menyimpan cost aktif per `ProductVariant`
* menyediakan cost sebagai dasar perhitungan COGS
* menyediakan snapshot cost untuk transaksi penjualan
* menyediakan data margin operasional (read-only)

Domain ini adalah **source of truth untuk cost aktif**, bukan untuk histori cost atau accounting.

---

## Posisi Domain

Costing adalah domain terpisah.

Costing:

* **bukan** bagian dari Procurement
* **bukan** bagian dari Inventory
* **bukan** bagian dari Sales
* **bukan** reporting
* **bukan** accounting

Konsekuensi:

* Procurement hanya menyediakan `unitCost`
* Inventory hanya menyimpan quantity
* Sales hanya menyimpan snapshot COGS
* Reporting hanya membaca hasil dari Costing

---

## Scope Domain

Domain Costing pada Step 8 mencakup:

* CostState per ProductVariant
* current cost (last purchase cost)
* metadata update terakhir
* penyediaan cost untuk snapshot COGS
* penyediaan data replacement margin (read-only)

---

## Tidak Termasuk

Domain ini tidak mencakup:

* FIFO
* moving average
* batch / lot costing
* histori cost
* manual cost adjustment
* accounting journal
* tax
* profit calculation historis
* recalculation transaksi lama

---

## Bahasa Domain

Istilah resmi:

* **CostState**
* **currentCost**
* **COGS (cogsAmount)**
* **Replacement Margin**

Catatan:

* `currentCost` = cost aktif saat ini
* `cogsAmount` = snapshot cost pada saat transaksi
* Replacement margin = selisih selling price vs currentCost (read-only)

---

# 1. Boundary Domain

## 1.1 Procurement Boundary

Procurement adalah satu-satunya sumber cost.

Costing:

* hanya menerima `unitCost`
* tidak menghitung cost sendiri
* tidak menyimpan histori procurement

Constraint:

* cost hanya boleh berubah setelah `FinalizeInspectionAcceptance`
* hanya accepted item yang boleh mempengaruhi cost

---

## 1.2 Inventory Boundary

Inventory hanya menyimpan quantity.

Costing tidak boleh:

* membaca atau mengubah stock
* mengakses InventoryItem
* menggunakan data quantity untuk menghitung cost

---

## 1.3 Sales Boundary

Sales hanya menggunakan cost.

Costing tidak boleh:

* membuat OrderItem
* menghitung transaksi sales
* mengubah data sales

Sales:

* mengambil snapshot cost saat order dibuat
* tidak menghitung cost sendiri

---

## 1.4 Reporting Boundary

Reporting bersifat read-only.

Costing:

* tidak boleh memindahkan business rule ke reporting
* tidak boleh menjadikan reporting sebagai source of truth

---

## 1.5 Authorization Boundary

Domain Costing:

* tidak mengetahui role
* tidak mengetahui user
* tidak mengetahui session
* tidak mengetahui HTTP

Authorization berada di application layer.

---

# 2. Aggregate dan Entity

## 2.1 Aggregate Root

Aggregate root:

* **CostState**

---

## 2.2 CostState

Merepresentasikan cost aktif per `ProductVariant`.

### Atribut

* `variantId`
* `currentCost`
* `lastPurchaseOrderId`
* `lastPurchaseItemId`
* `lastUpdatedAt`

---

### Tanggung Jawab

CostState bertanggung jawab untuk:

* menyimpan cost aktif
* memastikan cost valid secara bisnis
* mencatat metadata update terakhir
* menyediakan cost untuk use case lain

---

### Invariant

* `currentCost` harus integer rupiah
* `currentCost ≥ 0`
* cost hanya boleh berasal dari accepted procurement item
* cost tidak boleh berasal dari UI atau input manual
* cost tidak boleh decimal
* `variantId` wajib valid
* satu variant hanya boleh memiliki satu CostState
* CostState tidak boleh dihapus setelah dibuat

---

### Behavior

#### updateFromAcceptedProcurement

* menerima unitCost dari procurement
* overwrite currentCost
* update metadata

#### getCurrentCost

* mengembalikan cost aktif
* tidak expose state mutable

---

# 3. Lifecycle

```txt
CREATED → UPDATED → UPDATED → ...
```

---

## Aturan Lifecycle

* CostState dibuat saat pertama kali procurement accepted
* CostState hanya boleh dibuat melalui use case UpdateCostFromAcceptedProcurement
* CostState di-update setiap ada procurement baru
* tidak ada delete
* tidak ada archive
* tidak ada histori internal pada Step 8

---

# 4. Source of Truth

Cost hanya berasal dari:

* `PurchaseItem.unitCost`
* dengan kondisi:

  * item accepted
  * melalui FinalizeInspectionAcceptance

Tidak boleh berasal dari:

* UI
* script manual
* domain lain
* reporting
* fallback logic

---

# 5. Domain Rules yang Mengikat

## 5.1 Rule Cost Update

* hanya accepted item yang boleh update cost
* rejected dan quarantined tidak mempengaruhi cost
* jika multiple item untuk variant yang sama:

  * gunakan urutan deterministik
  * item terakhir menjadi currentCost
* cost update harus bersifat deterministic dan tidak boleh bergantung pada urutan tidak terdefinisi

---

## 5.2 Rule Cost Snapshot

* COGS diambil dari currentCost saat order dibuat
* COGS disimpan di OrderItem
* COGS bersifat immutable
* perubahan cost tidak mempengaruhi transaksi lama
* tidak boleh ada retroactive recalculation terhadap COGS transaksi yang sudah tersimpan

---

## 5.3 Rule Replacement Margin

* replacement margin = sellingPrice - currentCost
* hanya untuk kebutuhan operasional
* tidak boleh mempengaruhi domain lain
* tidak boleh disimpan sebagai state

---

# 6. Consistency Rule

* satu ProductVariant → satu CostState
* update bersifat overwrite
* tidak ada histori cost di domain core
* CostState harus tersedia sebelum transaksi sales
* jika CostState tidak tersedia, transaksi sales harus ditolak
* tidak boleh menggunakan fallback cost (termasuk 0) sebagai pengganti

---

# 7. Domain Errors

Error harus bermakna bisnis.

Contoh:

* `InvalidCostAmountError`
* `InvalidCostSourceError`
* `CostStateNotFoundError`

Constraint:

* tidak boleh expose Prisma / HTTP / framework
* tidak boleh generic error

---

# 8. Cross-Domain Interaction

## Procurement → Costing

Allowed:

* setelah final acceptance
* melalui application layer

Not allowed:

* procurement domain memanggil costing langsung
* procurement akses repository costing

---

## Sales → Costing

Allowed:

* snapshot cost via use case

Not allowed:

* sales menghitung cost
* sales update CostState

---

## Costing → Domain lain

Tidak diperbolehkan:

* tidak boleh mengubah Inventory
* tidak boleh mengubah Sales
* tidak boleh membuat accounting journal

---

# 9. Anti-Patterns yang Dilarang

* menyimpan cost di Inventory
* menghitung cost di Sales
* menghitung cost di UI
* membuat fallback cost 0
* manual edit cost
* membuat endpoint update cost
* menaruh costing logic di reporting
* membuat histori cost diam-diam
* menggabungkan costing dengan accounting

---

# 10. Testing Focus Domain

Testing harus fokus pada invariant.

Minimal:

* reject cost negatif
* reject cost decimal
* update cost valid
* overwrite cost lama
* reject source tidak valid
* satu variant satu CostState

---

# 11. Hubungan dengan Step 8

Domain ini adalah source of truth untuk:

* Implementation Contract
* Use Case
* Domain Implementation Spec

Jika ada konflik:

* ADR menang
* Domain document menang atas implementation spec
* Use case mengikuti domain

---

# 12. Future Extension

Step selanjutnya (tidak termasuk Step 8):

* FIFO costing
* moving average
* batch / lot tracking
* accounting integration
* cost adjustment
* tax

Semua extension ini harus:

* tidak merusak invariant Step 8
* melalui ADR baru

---

# 13. Kesimpulan

Costing Domain adalah domain yang:

* kecil
* eksplisit
* deterministic
* tidak menyimpan histori
* tidak bergantung pada domain lain

Tujuannya:

* menyediakan cost yang konsisten
* menjaga COGS tetap immutable
* memisahkan concern cost dari domain lain
* menjadi fondasi menuju accounting di Step 9
