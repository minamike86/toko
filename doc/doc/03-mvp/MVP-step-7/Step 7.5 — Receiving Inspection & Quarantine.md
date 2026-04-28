# Step 7.5 — Receiving Inspection & Quarantine

## Implementation Contract (READY-TO-CODE)

---

# 0. Scope & Classification

- Classification: **Additive, Non-Breaking**
- Domain: **Procurement Extension (Inspection Layer)**
- Mode: **Inspection Flow Mode ONLY**

---

# 1. Global Rules

## 1.1 Mode Isolation

Satu PurchaseOrder hanya boleh berada pada salah satu mode:

- Direct Receive (Step 6)
- Inspection Flow (Step 7.5)

Tidak boleh dicampur.

Aturan enforcement:

- Jika Inspection Flow Mode aktif:
  - Use case ReceivePurchaseOrder tidak boleh dipanggil
  - Semua receiving harus melalui inspection flow

- Jika Direct Receive Mode digunakan:
  - Tidak boleh membuat ReceivingInspection

Pelanggaran dianggap sebagai business error

## 1.2 Inventory Rule

- Inventory mutation **hanya boleh terjadi pada Finalize Inspection Acceptance**
- Tidak boleh ada mutation pada step lain

## 1.3 Payable Rule

Inspection tidak boleh:

- membuat payment
- mengubah outstanding
- mengubah payable state

## 1.4 Purchase Order Rule

- PO tidak boleh berubah status selama inspection
- PO menjadi `RECEIVED` hanya saat finalize

## 1.5 Actor & Authorization Rule

Actor adalah context operasional yang menjalankan use case.

Minimal contract:

- actorId: string
- role: "WAREHOUSE" | "ADMIN"

Aturan:

- Authorization harus dilakukan di application layer sebelum use case dijalankan
- Domain tidak boleh mengetahui actor atau role
- Delivery layer hanya meneruskan actor context

Jika actor tidak berwenang:

- use case tidak dijalankan
- harus menghasilkan error kategori FORBIDDEN

---

# 2. Domain Contract

## 2.1 ReceivingInspectionStatus

- ARRIVED
- UNDER_INSPECTION
- COMPLETED

## 2.2 ReceivingInspection

Tanggung jawab:

- lifecycle inspection
- menjaga invariant inspection

## 2.3 ReceivingInspectionItem

Field:

- purchaseItemId
- variantId
- expectedQuantity
- acceptedQuantity
- quarantinedQuantity
- rejectedQuantity

## 2.4 Invariants

- accepted + quarantined + rejected = expected
- semua quantity >= 0
- tidak boleh mutate setelah COMPLETED
- expectedQuantity wajib berasal dari PurchaseItem
- expectedQuantity tidak boleh berasal dari input user

## 2.5 Domain Errors

Domain wajib menggunakan error bermakna bisnis.

Minimal error:

- ReceivingInspectionNotFoundError
- ReceivingInspectionStatusInvalidError
- ReceivingInspectionAlreadyCompletedError
- ReceivingInspectionQuantityInvalidError
- ReceivingInspectionQuantityUnresolvedError
- ReceivingInspectionAlreadyExistsError

Aturan:

- Tidak boleh menggunakan Error generik
- Error harus merepresentasikan pelanggaran invariant atau lifecycle

---

# 3. Repository Contract

```ts
interface ReceivingInspectionRepository {
  findById(id: string): Promise<ReceivingInspection | null>
  findByPurchaseOrderId(poId: string): Promise<ReceivingInspection | null>
  save(inspection: ReceivingInspection): Promise<void>
}
```

Rules:

- aggregate save wajib atomic
- tidak boleh partial update
- ReceivingInspection adalah aggregate root
- ReceivingInspectionItem tidak boleh disimpan secara terpisah
- Semua perubahan item harus melalui aggregate

---

# 4. Use Case Contract

---

## 4.1 Register Goods Arrival

### Input

- purchaseOrderId
- arrivedAt
- actor

### Output

- receivingInspectionId
- status: ARRIVED

### Flow

1. Validasi actor
2. Validasi mode inspection
3. Load PO
4. Validasi PO CREATED
5. Cegah duplicate inspection
6. Create inspection + items
7. Save

### Idempotency Rule

- Request yang sama tidak boleh membuat lebih dari satu inspection
- Duplicate request harus menghasilkan hasil yang sama (idempotent)

Implementasi minimal:

- unique constraint pada purchaseOrderId

---

## 4.2 Start Receiving Inspection

### Input

- receivingInspectionId
- startedAt
- actor

### Output

- status: UNDER_INSPECTION

### Flow

1. Load inspection
2. Validasi ARRIVED
3. Load PurchaseOrder terkait
4. Validasi PO masih CREATED
5. Start inspection
6. Save

---

## 4.3 Complete Receiving Inspection

### Input

- receivingInspectionId
- items[]
- actor

### Output

- status: COMPLETED

### Flow

1. Load inspection
2. Validasi UNDER_INSPECTION
3. Validasi semua item
4. Validasi quantity invariant
5. Apply result
6. Save

---

## 4.4 Finalize Inspection Acceptance

### Input

- receivingInspectionId
- actor

### Output

- purchaseOrderStatus: RECEIVED
- acceptedItems

### Finalization Flow

1. Load inspection
2. Validasi inspection berstatus COMPLETED
3. Validasi inspection belum pernah difinalisasi sebelumnya
4. Load PurchaseOrder terkait
5. Validasi PO masih CREATED
6. Validasi tidak ada quarantinedQuantity > 0
7. Validasi rejectedQuantity sudah resolved melalui flow resmi
8. Jalankan transaction:
   - kirim accepted quantity ke inventory
   - update PO → RECEIVED
9. Commit

### Atomicity Rule (WAJIB)

Inventory mutation dan perubahan PurchaseOrder menjadi RECEIVED
harus terjadi dalam satu unit transaksi.

Tidak boleh terjadi:

- inventory berubah tetapi PO tidak RECEIVED
- PO RECEIVED tetapi inventory tidak berubah

Jika salah satu gagal → seluruh operasi harus rollback

### Quarantine Blocking Rule

Jika terdapat quarantinedQuantity > 0:

- finalize harus ditolak
- harus diselesaikan melalui flow terpisah (deferred)

---

# 5. Integration Boundary

## 5.1 Procurement → Inventory

- via InventoryProcurementPort
- hanya di Finalize

Contract minimal:

InventoryProcurementPort harus menyediakan:

- receiveAcceptedItems(input):
  - variantId
  - quantity
  - purchaseOrderId

Aturan:

- hanya menerima accepted quantity
- tidak boleh menerima quarantined atau rejected
- tidak boleh expose detail inventory entity

## 5.2 Procurement → Payable

- read-only

---

# 6. Delivery Layer Contract

## API

- POST /purchase-orders/{id}/inspections
- POST /receiving-inspections/{id}/start
- POST /receiving-inspections/{id}/complete
- POST /receiving-inspections/{id}/finalize

## Rules

- hanya parsing request
- hanya call use case
- tidak boleh business logic

---

# 7. Testing Contract

## Domain Test

- invariant quantity
- status transition

## Application Test

- flow setiap use case
- negative cases

Aturan tambahan:

- setiap use case wajib memiliki minimal 1 negative test
- negative test harus menguji:
  - invalid status transition
  - invalid quantity
  - unauthorized actor

## Integration Test

- finalize → inventory + PO
- atomicity

## Boundary Test

- domain tidak import prisma
- application tidak import prisma

---

# 8. Implementation Order

1. Domain
2. Repository interface
3. Prisma schema
4. Repository implementation
5. Use case
6. Unit test
7. Integration test
8. API

---

# 9. File Mapping

## Domain

- procurement/domain/ReceivingInspection.ts
- procurement/domain/ReceivingInspectionItem.ts
- procurement/domain/ReceivingInspectionRepository.ts

## Application

- RegisterGoodsArrival.ts
- StartReceivingInspection.ts
- CompleteReceivingInspection.ts
- FinalizeInspectionAcceptance.ts

## Infrastructure

- PrismaReceivingInspectionRepository.ts

## API

- inspections route

---

# 10. Explicit Boundary Rules

## BOLEH

- inspection sebagai aggregate
- accepted → inventory via finalize

## TIDAK BOLEH

- mutate inventory sebelum finalize
- ubah payable
- ubah PO di tengah flow
- campur direct receive

## DEFERRED

- costing
- supplier claim
- accounting

---

# FINAL RULE

Inventory mutation hanya boleh terjadi di Finalize Inspection.
Jika dilanggar → sistem dianggap invalid.
