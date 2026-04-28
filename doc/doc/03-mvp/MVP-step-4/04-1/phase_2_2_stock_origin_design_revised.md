# phase_2_2_stock_origin_design_revised.md

## Status  
**DESIGN LOCKED FOR STEP 4.1 IMPLEMENTATION**

---

## 1. Context

Step 4.1 memperkenalkan konsep **stock origin** sebagai metadata historis pada `StockMovement`.

Tujuan utama:
- meningkatkan transparansi asal perubahan stok
- menyediakan fondasi untuk evolusi domain (Procurement, Audit, Reporting)
- tanpa mengubah behavior sistem inventory existing

Origin pada fase ini:
- bukan costing driver
- bukan procurement model penuh
- bukan entity mandiri

---

## 2. Scope

### Included
- penambahan `origin` pada `StockMovement`
- origin bersifat immutable
- semua movement wajib memiliki origin
- origin diekspos pada reporting movement history

### Explicitly Excluded
- costing / valuation
- batch / lot tracking
- supplier / procurement workflow
- perubahan snapshot logic
- perubahan perhitungan stok

---

## 3. Design Principles

### 3.1 Origin as Historical Classification
Origin merepresentasikan:
> bagaimana stok ini masuk atau berubah secara historis

Origin tidak merepresentasikan:
- supplier
- harga
- relasi transaksi detail

---

### 3.2 Origin as Value (Not Entity)
Origin:
- tidak memiliki identity
- tidak memiliki lifecycle
- tidak dapat diedit

Direpresentasikan sebagai closed set value.

---

### 3.3 Origin is Immutable
- ditentukan saat movement dibuat
- tidak dapat diubah setelah persist

---

## 4. Revised Origin Classification

Closed set untuk Step 4.1:

- LEGACY
- MANUAL_ADJUSTMENT
- PURCHASE

---

### 4.1 LEGACY

Definisi:
> Movement yang tidak berasal dari sistem procurement formal

Digunakan untuk:
- stok lama
- seluruh receipt dan issue pada fase Step 4.1

Catatan penting:
- LEGACY bukan berarti "lama secara waktu"
- LEGACY berarti "tidak memiliki procurement truth"

---

### 4.2 MANUAL_ADJUSTMENT

Digunakan untuk:
- koreksi manual
- audit adjustment
- fix discrepancy

Makna:
> perubahan stok yang disengaja oleh operator

---

### 4.3 PURCHASE (Reserved)

Digunakan untuk:
- stok hasil procurement formal

Status:
- tidak boleh digunakan pada Step 4.1
- tidak boleh digunakan pada Step 4.2
- hanya boleh digunakan melalui Procurement Domain (Step 6)

---

## 5. Step 4.1 Operational Mapping

| Use Case       | Origin             |
|----------------|--------------------|
| ReceiveStock   | LEGACY             |
| IssueStock     | LEGACY             |
| AdjustStock    | MANUAL_ADJUSTMENT  |

---

### Clarification: Origin for OUT Movement

Origin diterapkan pada semua movement (IN, OUT, ADJUST).

Untuk OUT movement:
> origin merepresentasikan klasifikasi historis stok yang dikonsumsi dalam fase ini

---

## 6. Data Model Contract

### 6.1 Schema

```
origin: String
```

Constraint:
- NOT NULL

---

### 6.2 Domain Constraint

Closed set ditegakkan pada application layer:

```
type StockMovementOrigin =
  | "LEGACY"
  | "MANUAL_ADJUSTMENT"
  | "PURCHASE";
```

---

### 6.3 Enforcement Strategy

- constraint enforced di TypeScript (domain/use case)
- database tidak enforce enum pada Step 4.1

---

### 6.4 Persistence Rules

- origin ditentukan di use case
- repository hanya menyimpan
- tidak ada default/fallback di persistence layer

---

## 7. Reporting Contract

- movement history wajib mengembalikan field `origin`
- origin diperlakukan sebagai primitive string
- tidak ada transformasi domain di reporting layer

Boundary:
- reporting tidak bergantung pada domain type

---

## 8. Backfill Strategy

Untuk data existing:

- ADJUST → MANUAL_ADJUSTMENT
- IN → LEGACY
- OUT → LEGACY

Tujuan:
- memastikan semua movement memiliki origin
- menjaga determinisme reporting

---

## 9. Non-Goals

Dokumen ini tidak mencakup:

- purchase order modeling
- supplier integration
- cost tracking
- inventory valuation
- variant / SKU extension
- event sourcing

---

## 10. Constraint vs Procurement Domain

Origin tidak boleh:
- menyimpan relasi ke supplier
- menyimpan relasi ke purchase order
- membawa logic procurement

Origin hanya classification, bukan representasi transaksi procurement.

---

## 11. Future Evolution

### Step 6 – Procurement Domain

Pada tahap ini:
- PURCHASE mulai digunakan
- receipt dari procurement menghasilkan:
  origin = PURCHASE

---

### Evolution Rule

- origin bersifat append-only
- nilai existing tidak boleh berubah makna
- backward compatibility wajib dijaga

---

## 12. Relationship to Previous Design

Dokumen ini menggantikan:
- phase_2_2_stock_origin_design.md

Perubahan utama:
- simplifikasi klasifikasi
- penghapusan kategori ambigu
- alignment dengan implementasi aktual

---

## 13. Cross-Step Protection

Step 4.2 dan seterusnya tidak boleh:
- mengubah klasifikasi origin
- menambah nilai origin baru
- mengubah mapping use case

Perubahan hanya boleh dilakukan melalui revisi dokumen ini.

---

## 14. Design Lock

Desain ini dianggap:
- final untuk Step 4.1
- menjadi source of truth origin
- tidak boleh diubah secara implisit di code

---

## 15. Documentation Note

Implementation deviation dan technical debt dicatat terpisah di:

- step_4_1_stock_origin_documented_deviation.md

Dokumen ini fokus pada design truth, bukan implementation condition.

