# Step 4.5 — Architecture Cleanup Plan (Post Batch 4)

## Status Saat Ini

Setelah Batch 4:

* Inventory sudah **variant-native**
* `productId` menjadi **historical field only**
* Reporting berjalan dan **tidak rusak**
* Semua test sudah hijau (expected condition)

Namun:

* Terdapat **inkonsistensi kecil di reporting read layer**
* Beberapa file melanggar prinsip clean architecture (non-blocking)

Dokumen ini mendefinisikan cleanup setelah stabilisasi selesai.

---

# Tujuan Cleanup

## Primary Goals

1. Konsistensi akses database (Prisma)
2. Konsistensi boundary antara:

   * Query layer
   * Application layer
3. Menghilangkan pola “quick fix” yang tidak scalable
4. Menyiapkan fondasi Step 5 (Reporting maturity)

## Non-Goals

* Tidak mengubah domain inventory
* Tidak mengubah behavior use case
* Tidak mengubah schema
* Tidak mengubah reporting result

---

# Temuan Arsitektur Saat Ini

## 1. Prisma Client Tidak Konsisten

### Problem

Sebagian query:

```ts
const prisma = new PrismaClient();
```

Sebagian lain:

```ts
import { prisma } from "@/shared/prisma";
```

### Dampak

* Lifecycle tidak terkontrol
* Potensi connection leak
* Testing tidak konsisten

### File terdampak

* inventory-snapshot.query.ts
* inventory-low-stock.query.ts

---

## 2. Query Layer Bocor ke DTO

### Problem

Beberapa query langsung return DTO:

```ts
Promise<InventoryMovementHistoryDTO[]>
```

### Dampak

* Query tahu struktur application layer
* Boundary jadi kabur
* Refactor DTO → ripple effect

---

## 3. Ketergantungan Implicit (Hidden Coupling)

### Problem

Application layer mengandalkan:

* nama export tertentu (`findInventorySnapshot`)
* shape tertentu dari query

Tanpa kontrak formal.

---

# Prinsip Target (Post Cleanup)

## 1. Single Source Prisma

Semua query wajib:

```ts
import { prisma } from "@/shared/prisma";
```

❌ Dilarang:

```ts
new PrismaClient()
```

---

## 2. Query = Read Model Only

Query hanya boleh return:

```ts
type Row = {
  ...
}
```

❌ Tidak boleh:

* DTO
* business logic
* aggregation lintas layer

---

## 3. Application = Mapper + Orchestrator

Application layer:

* mapping row → DTO
* aggregation ringan (sum, count)

---

## 4. Zero Domain Leakage

Reporting:

* tidak menyentuh domain entity
* tidak memakai InventoryItem, dll

---

# Rencana Eksekusi

## Phase 1 — Prisma Standardization

### Task

Refactor:

#### inventory-snapshot.query.ts

#### inventory-low-stock.query.ts

Dari:

```ts
const prisma = new PrismaClient();
```

Menjadi:

```ts
import { prisma } from "@/shared/prisma";
```

### Expected Result

* Semua query pakai satu Prisma instance
* Konsisten dengan query lain

---

## Phase 2 — Query Contract Cleanup

### Task

Pisahkan:

Dari:

```ts
Promise<InventoryMovementHistoryDTO[]>
```

Menjadi:

```ts
type InventoryMovementHistoryRow = { ... }

Promise<InventoryMovementHistoryRow[]>
```

### Impact

* DTO mapping pindah ke application
* Boundary lebih jelas

---

## Phase 3 — Export Contract Stabilization

### Task

Standarisasi naming:

| Layer       | Naming         |
| ----------- | -------------- |
| Query       | `findXxx`      |
| Application | `getXxxReport` |

### Rule

* Tidak ada alias darurat
* Tidak ada duplicate export

---

## Phase 4 — Optional (Nice to Have)

## 4.1 Introduce Query Gateway (Optional)

Jika sistem berkembang:

```ts
type ReportingQuery = {
  findInventorySnapshot: () => ...
}
```

Namun ini **tidak wajib sekarang**.

---

# Risiko

## Risiko rendah

* Refactor bersifat lokal
* Tidak menyentuh domain

## Risiko nyata

* Salah mapping DTO → report rusak
* Test reporting gagal

Mitigasi:

* Jalankan seluruh integration test reporting

---

# Definition of Done

Cleanup dianggap selesai jika:

* Tidak ada `new PrismaClient()` di query layer
* Semua query return **Row**, bukan DTO
* Semua DTO mapping ada di application layer
* Tidak ada compile error
* Semua reporting integration test lulus

---

# Catatan Arsitektur

Ini bukan refactor kosmetik.

Ini:

* mengunci boundary read side
* mencegah coupling liar di masa depan
* membuat Step 5 (Reporting) tidak jadi bencana

---

# Status

| Area      | Status                           |
| --------- | -------------------------------- |
| Domain    | STABLE                           |
| Inventory | CLEAN                            |
| Reporting | NEEDS CLEANUP                    |
| Overall   | READY FOR STEP 5 (AFTER CLEANUP) |

---

# Penutup

Kalau Batch 4 adalah operasi besar,
maka ini adalah fisioterapi.

Tidak dramatis.
Tidak keren.
Tapi kalau dilewati:

👉 kamu akan pincang di Step 5.
