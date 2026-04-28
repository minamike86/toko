# Step 8 — Costing Engine File Mapping

Status: READY FOR IMPLEMENTATION
Depends On:

* Step 8 Implementation Contract (LOCKED)
* folder_structure.md
* DDD Boundaries.md

---

# 1. Domain Layer

Lokasi:

```txt
src/modules/costing/domain/
```

File:

```txt
CostState.ts
CostState.test.ts
CostingErrors.ts
CostStateFactory.ts
```

---

# 2. Application Layer

Lokasi:

```txt
src/modules/costing/application/
```

## Use Cases

```txt
use-cases/
  UpdateCostFromAcceptedProcurement.ts
  UpdateCostFromAcceptedProcurement.test.ts

  SnapshotCostForSalesOrder.ts
  SnapshotCostForSalesOrder.test.ts

```

---

## Queries

```txt
queries/
  GetVariantCostView.ts
```

---

## Ports

```txt
ports/
  CostStateRepository.ts
```

---

# 3. Infrastructure Layer

Lokasi:

```txt
src/modules/costing/infrastructure/
```

## Prisma Implementation

```txt
prisma/
  PrismaCostStateRepository.ts
```

---

# 4. Prisma Schema

File:

```txt
prisma/schema.prisma
```

Tambahan model:

```txt
model CostState
```

---

# 5. Integration Points

## Procurement

File:

```txt
src/modules/procurement/application/use-cases/FinalizeInspectionAcceptance.ts
```

Tambahkan call ke:

```txt
UpdateCostFromAcceptedProcurement
```

⚠️ WAJIB dijalankan dalam satu transaction boundary yang sama dengan FinalizeInspectionAcceptance.

Tidak boleh:

* dipanggil secara async terpisah
* menggunakan background job
* menggunakan eventual consistency

Jika salah satu proses gagal, seluruh proses harus rollback.

---

## Sales

File:

```txt
src/modules/sales/application/use-cases/CreateOrder.ts
```

Tambahkan:

```txt
SnapshotCostForSalesOrder
```

---

# 6. API Layer (Delivery)

Lokasi:

```txt
src/app/api/costing/
```

File:

```txt
variants/route.ts
variants/route.test.ts
```

Endpoint:

```txt
GET /api/costing/variants
```

---

# 7. UI Layer

Lokasi:

```txt
src/modules/costing/ui/
```

File:

```txt
CostDashboard.tsx
CostDashboard.test.tsx
```

---

# 8. Test Structure

## Domain

```txt
src/modules/costing/tests/domain/CostState.test.ts
```

## Application

```txt
src/modules/costing/tests/application/use-cases/*.test.ts
```

## Integration

```txt
src/modules/costing/tests/integration/Costing.integration.test.ts
```

---

# 9. Boundary Enforcement

WAJIB:

* domain tidak import Prisma
* application tidak berisi business rule inti
* infrastructure hanya implement repository
* UI tidak menghitung cost
* API tidak berisi business logic

---

# 10. Naming Convention

WAJIB:

* gunakan nama use case sebagai nama file
* tidak boleh alias
* tidak boleh singkatan

Contoh:

```txt
FinalizeInspectionAcceptance.ts
UpdateCostFromAcceptedProcurement.ts
```

---

# 11. Forbidden

TIDAK BOLEH:

* menaruh cost di Inventory
* menaruh logic cost di Sales
* membuat util function global untuk cost
* query Prisma langsung di UI
* membuat endpoint untuk edit cost

---

# 12. Result

Dengan mapping ini:

* implementasi bisa langsung dilakukan
* tidak ada ambiguity lokasi file
* tidak ada conflict antar module
* siap untuk scaling ke Step 9 (Accounting)
