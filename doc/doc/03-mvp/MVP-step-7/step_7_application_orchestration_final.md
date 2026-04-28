# Step 7 — Application Orchestration Final

Status: FINAL FOR STEP 7 IMPLEMENTATION  
Scope: Supplier Payable  
Change Type: Additive, Non-Breaking  

---

## Purpose

Dokumen ini mendefinisikan orchestration application layer final untuk Step 7 — Supplier Payable.

Use case yang dicakup:

- Record Supplier Payment
- Get Supplier Outstanding
- Handle Purchase Return (Reduce Payable)

Dokumen ini tidak mendefinisikan domain baru di luar Procurement.

---

## Source of Truth

Implementasi wajib tunduk pada:

- Procurement Domain
- ADR-0020 — Supplier Payable & Payment Handling
- Step 7 — Final Use Cases
- Step 7 — Repository Contract Final
- architecture_overview.md
- DDD Boundaries.md
- Testing Strategy.md
- Unit Test Guidelines.md
- testing_boundary_integration_policy.md

---

## Global Application Boundary Rules

Application layer adalah orchestrator use case.

Application layer wajib:

- menerima input DTO
- menjalankan authorization guard
- memuat data melalui repository/query contract
- memanggil domain/application validation yang relevan
- menyimpan histori append-only melalui repository
- mengembalikan output DTO
- memetakan error ke error contract

Application layer tidak boleh:

- menyimpan business rule inti di infrastructure
- memanggil Prisma langsung
- memanggil InventoryRepository
- membuat StockMovement
- membuat accounting journal
- mengubah histori payment
- mengubah histori return
- menggunakan fallback
- melakukan konversi unit di UI
- mengubah histori lama

---

## Shared Types

```ts
export type ActorContext = {
  actorId: string;
  role: "ADMIN" | "WAREHOUSE" | "SALES";
};

export type MoneyAmount = number;

export type Step7UseCaseContext = {
  now: () => Date;
};
```

---

## Shared Dependency Contracts

```ts
export type Step7AuthorizationGuard = {
  requireAdmin(actor: ActorContext): void;
};

export type Step7UnitOfWork = {
  runInTransaction<T>(operation: () => Promise<T>): Promise<T>;
};
```

Rules:

- Authorization berada sebelum mutation dijalankan.
- Transaction boundary berada di application layer.
- Repository implementation boleh memakai transaction infrastructure, tetapi use case tidak boleh mengetahui detail Prisma.

---

## Shared Outstanding Calculation Rule

Outstanding wajib dihitung secara derived.

Rumus:

```ts
outstanding = payableInitial - totalPaid - totalReturned;
```

Rules:

- `payableInitial` berasal dari `PurchaseOrder.totalCost` untuk PO `RECEIVED`.
- `totalPaid` berasal dari histori supplier payment.
- `totalReturned` berasal dari histori purchase return reduction.
- Jika outstanding negatif, use case wajib menolak dengan `SUPPLIER_OUTSTANDING_NEGATIVE`.
- Outstanding tidak boleh disimpan sebagai mutable field utama.

---

## Shared Error Handling Rule

Use case harus mengembalikan atau melempar error contract yang aman.

Minimal business errors:

```ts
export type Step7BusinessErrorCode =
  | "PURCHASE_ORDER_NOT_FOUND"
  | "PURCHASE_ORDER_NOT_RECEIVED"
  | "SUPPLIER_NOT_FOUND"
  | "INVALID_SUPPLIER_PAYMENT_AMOUNT"
  | "SUPPLIER_PAYMENT_EXCEEDS_OUTSTANDING"
  | "PURCHASE_RETURN_ITEM_INVALID"
  | "PURCHASE_RETURN_EXCEEDS_ALLOWED_REDUCTION"
  | "PURCHASE_RETURN_REDUCTION_EXCEEDS_OUTSTANDING"
  | "SUPPLIER_OUTSTANDING_NEGATIVE"
  | "FORBIDDEN";
```

Rules:

- Prisma/database raw error tidak boleh bocor.
- Error teknis repository harus dipetakan oleh application layer.
- Business error tidak boleh diganti generic error.

---

# 1. Record Supplier Payment

## Purpose

Mencatat pembayaran supplier untuk purchase order yang sudah `RECEIVED`.

Use case ini:

- membuat histori payment append-only
- tidak mengubah inventory
- tidak mengubah status purchase order
- tidak membuat accounting journal

---

## Input DTO

```ts
export type RecordSupplierPaymentInput = {
  purchaseOrderId: string;
  amount: number;
  paidAt: Date;
  notes: string | null;
  actor: {
    actorId: string;
    role: "ADMIN";
  };
};
```

---

## Output DTO

```ts
export type RecordSupplierPaymentResult = {
  purchaseOrderId: string;
  supplierId: string;
  paidAmount: number;
  payableInitial: number;
  totalPaid: number;
  totalReturned: number;
  outstanding: number;
  paymentId: string;
  paidAt: Date;
};
```

---

## Dependencies

```ts
export type RecordSupplierPaymentDependencies = {
  authorization: Step7AuthorizationGuard;
  unitOfWork: Step7UnitOfWork;
  purchaseOrders: PurchaseOrderPayableReader;
  suppliers: SupplierPayableReader;
  payments: SupplierPaymentRepository;
  returns: PurchaseReturnRepository;
  context: Step7UseCaseContext;
};
```

---

## Orchestration Flow

1. Validate actor is `ADMIN` using authorization guard.
2. Run use case inside transaction boundary.
3. Load purchase order payable snapshot by `purchaseOrderId`.
4. If purchase order does not exist, reject with `PURCHASE_ORDER_NOT_FOUND`.
5. If purchase order status is not `RECEIVED`, reject with `PURCHASE_ORDER_NOT_RECEIVED`.
6. Load supplier snapshot by `supplierId`.
7. If supplier does not exist, reject with `SUPPLIER_NOT_FOUND`.
8. Validate `amount > 0`.
9. If invalid, reject with `INVALID_SUPPLIER_PAYMENT_AMOUNT`.
10. Read total paid using `SupplierPaymentRepository`.
11. Read total returned using `PurchaseReturnRepository`.
12. Calculate current outstanding.
13. If outstanding is negative, reject with `SUPPLIER_OUTSTANDING_NEGATIVE`.
14. If `amount > outstanding`, reject with `SUPPLIER_PAYMENT_EXCEEDS_OUTSTANDING`.
15. Generate payment id using `payments.nextId()`.
16. Create `SupplierPaymentRecord`.
17. Save payment record append-only.
18. Recalculate result totals:
    - `totalPaidAfter = totalPaidBefore + amount`
    - `outstandingAfter = payableInitial - totalPaidAfter - totalReturned`
19. Return output DTO.

---

## Atomicity Rule

The following operations must be in one application transaction:

- load payable snapshot
- load payment and return totals
- validate outstanding
- save payment

Rules:

- If save fails, no payment is recorded.
- No partial write is allowed.
- Inventory must not be touched.

---

## Forbidden Behavior

This use case must not:

- call inventory mutation
- update purchase order status
- update existing payment
- delete existing payment
- create return reduction
- create accounting journal
- normalize outstanding to zero

---

## Testing Focus

Required application tests:

- rejects non-admin actor
- rejects missing purchase order
- rejects purchase order not `RECEIVED`
- rejects missing supplier
- rejects zero amount
- rejects negative amount
- rejects amount greater than outstanding
- rejects negative derived outstanding
- saves payment append-only on success
- returns updated outstanding derived correctly

Required integration tests:

- partial payment repeated twice produces correct outstanding
- payment after return produces correct outstanding
- repository failure does not create partial state

---

# 2. Get Supplier Outstanding

## Purpose

Membaca outstanding supplier secara read-only.

Use case ini:

- tidak melakukan mutation
- tidak membuat payment
- tidak membuat return
- tidak memanggil inventory
- tidak menjadi reporting pseudo-domain

---

## Input DTO

```ts
export type GetSupplierOutstandingInput = {
  supplierId: string;
  actor: {
    actorId: string;
    role: "ADMIN";
  };
};
```

---

## Output DTO

```ts
export type GetSupplierOutstandingResult = {
  supplierId: string;
  supplierStoreName: string;
  totalOutstanding: number;
  purchaseOrders: Array<{
    purchaseOrderId: string;
    receivedAt: Date;
    payableInitial: number;
    totalPaid: number;
    totalReturned: number;
    outstanding: number;
  }>;
};
```

---

## Dependencies

```ts
export type GetSupplierOutstandingDependencies = {
  authorization: Step7AuthorizationGuard;
  suppliers: SupplierPayableReader;
  payableQuery: SupplierPayableQuery;
};
```

---

## Orchestration Flow

1. Validate actor is `ADMIN` using authorization guard.
2. Load supplier snapshot by `supplierId`.
3. If supplier does not exist, reject with `SUPPLIER_NOT_FOUND`.
4. Load outstanding summary using `SupplierPayableQuery.getOutstandingBySupplierId`.
5. If query returns `null`, return empty outstanding summary for valid supplier:
   - `totalOutstanding = 0`
   - `purchaseOrders = []`
6. Validate every returned purchase order line:
   - `outstanding = payableInitial - totalPaid - totalReturned`
   - `outstanding >= 0`
7. If any line is negative, reject with `SUPPLIER_OUTSTANDING_NEGATIVE`.
8. Return output DTO.

---

## Read-Only Rule

This use case must be read-only.

Rules:

- No transaction write is allowed.
- No payment write is allowed.
- No return write is allowed.
- No inventory mutation is allowed.
- Query layer must not become source of business rule.

---

## Forbidden Behavior

This use case must not:

- create supplier payment
- create purchase return
- change purchase order
- call inventory
- query dashboard/reporting module as business source of truth
- normalize negative outstanding to zero

---

## Testing Focus

Required application tests:

- rejects non-admin actor
- rejects missing supplier
- returns zero summary for supplier with no outstanding
- returns only received purchase orders
- rejects negative derived outstanding
- performs no write

Required integration tests:

- supplier with unpaid, partially paid, and fully paid purchase orders
- supplier with payment and return reduction history
- query result remains deterministic

---

# 3. Handle Purchase Return (Reduce Payable)

## Purpose

Mencatat return reduction untuk purchase order yang sudah `RECEIVED`.

Use case ini:

- membuat histori return reduction append-only
- mengurangi outstanding secara derived
- tidak mengubah payment history
- tidak mengubah purchase order status
- tidak melakukan inventory reversal otomatis

---

## Input DTO

```ts
export type HandlePurchaseReturnInput = {
  purchaseOrderId: string;
  returnItems: Array<{
    purchaseItemId: string;
    quantity: number;
    reason: string | null;
  }>;
  returnedAt: Date;
  notes: string | null;
  actor: {
    actorId: string;
    role: "ADMIN";
  };
};
```

---

## Output DTO

```ts
export type HandlePurchaseReturnResult = {
  purchaseOrderId: string;
  supplierId: string;
  returnId: string;
  reducedAmount: number;
  payableInitial: number;
  totalPaid: number;
  totalReturned: number;
  outstanding: number;
  returnedAt: Date;
};
```

---

## Dependencies

```ts
export type HandlePurchaseReturnDependencies = {
  authorization: Step7AuthorizationGuard;
  unitOfWork: Step7UnitOfWork;
  purchaseOrders: PurchaseOrderPayableReader;
  suppliers: SupplierPayableReader;
  payments: SupplierPaymentRepository;
  returns: PurchaseReturnRepository;
  context: Step7UseCaseContext;
};
```

---

## Orchestration Flow

1. Validate actor is `ADMIN` using authorization guard.
2. Run use case inside transaction boundary.
3. Load purchase order payable snapshot by `purchaseOrderId`.
4. If purchase order does not exist, reject with `PURCHASE_ORDER_NOT_FOUND`.
5. If purchase order status is not `RECEIVED`, reject with `PURCHASE_ORDER_NOT_RECEIVED`.
6. Load supplier snapshot by `supplierId`.
7. If supplier does not exist, reject with `SUPPLIER_NOT_FOUND`.
8. Validate `returnItems` is not empty.
9. For each return item:
   - validate `purchaseItemId` exists in purchase order snapshot
   - validate quantity is integer positive
   - load already returned quantity by `purchaseItemId`
   - reject if requested return quantity exceeds remaining returnable quantity
10. Calculate reduced amount per item using purchase item unit cost.
11. Calculate total reduced amount.
12. Read total paid using `SupplierPaymentRepository`.
13. Read total returned using `PurchaseReturnRepository`.
14. Calculate current outstanding.
15. If outstanding is negative, reject with `SUPPLIER_OUTSTANDING_NEGATIVE`.
16. If total reduced amount exceeds current outstanding, reject with `PURCHASE_RETURN_REDUCTION_EXCEEDS_OUTSTANDING`.
17. Generate return id using `returns.nextId()`.
18. Create `PurchaseReturnReductionRecord` and item records.
19. Save return reduction append-only.
20. Recalculate result totals:
    - `totalReturnedAfter = totalReturnedBefore + totalReducedAmount`
    - `outstandingAfter = payableInitial - totalPaid - totalReturnedAfter`
21. Return output DTO.

---

## Return Quantity Rule

Return quantity must be validated per purchase item.

For each purchase item:

```ts
remainingReturnableQuantity = purchaseItem.quantity - alreadyReturnedQuantity;
```

Rules:

- requested return quantity must be positive integer.
- requested return quantity must not exceed remaining returnable quantity.
- if invalid, reject with `PURCHASE_RETURN_EXCEEDS_ALLOWED_REDUCTION`.

---

## Reduced Amount Rule

Reduced amount must be derived from purchase item cost.

For each item:

```ts
reducedAmount = returnQuantity * purchaseItem.unitCost;
```

Rules:

- reduced amount must not be supplied by UI as source of truth.
- UI may display preview, but application calculation is authoritative.
- total reduced amount must not make outstanding negative.

---

## Atomicity Rule

The following operations must be in one application transaction:

- load payable snapshot
- load previous return quantity
- load payment and return totals
- validate return amount
- save return reduction

Rules:

- If save fails, no return reduction is recorded.
- No partial write is allowed.
- Inventory must not be touched.

---

## Forbidden Behavior

This use case must not:

- treat return reduction as payment
- update payment history
- update purchase order status
- create inventory movement
- call inventory repository
- perform stock reversal
- accept reducedAmount from UI as source of truth
- create accounting journal
- normalize outstanding to zero

---

## Testing Focus

Required application tests:

- rejects non-admin actor
- rejects missing purchase order
- rejects purchase order not `RECEIVED`
- rejects missing supplier
- rejects empty return items
- rejects unknown purchase item
- rejects zero quantity
- rejects negative quantity
- rejects quantity exceeding remaining returnable quantity
- rejects reduction exceeding outstanding
- saves return append-only on success
- returns updated outstanding derived correctly

Required integration tests:

- return after partial payment calculates outstanding correctly
- multiple returns on same purchase item cannot exceed original quantity
- repository failure does not create partial state
- no inventory mutation happens

---

# 4. UI Preparation Contract

UI Step 7 boleh disiapkan setelah application use case siap.

UI Step 7 hanya boleh menjadi input/output surface untuk use case Step 7.

---

## Allowed Screens

### 1. Supplier Outstanding Page

Purpose:

- menampilkan total outstanding per supplier
- menampilkan purchase order yang masih memiliki outstanding

Allowed data:

- supplier store name
- total outstanding
- payable initial
- total paid
- total returned
- outstanding per purchase order

Forbidden:

- inventory stock quantity
- asset valuation
- costing/margin
- quarantine status

---

### 2. Supplier Payment Form

Purpose:

- mencatat supplier payment

Allowed inputs:

- purchaseOrderId
- amount
- paidAt
- notes

Rules:

- UI boleh melakukan client-side validation untuk UX.
- Application layer tetap menjadi source of truth.
- UI tidak boleh mengizinkan payment untuk PO non-RECEIVED.
- UI tidak boleh mengubah outstanding langsung.

---

### 3. Purchase Return Form

Purpose:

- mencatat return reduction untuk mengurangi payable

Allowed inputs:

- purchaseOrderId
- purchaseItemId
- quantity
- reason
- returnedAt
- notes

Rules:

- UI tidak boleh mengirim `reducedAmount` sebagai source of truth.
- UI boleh menampilkan preview reduced amount.
- Application layer tetap menghitung reduced amount.
- UI tidak boleh membuat inventory reversal.

---

### 4. Payment & Return History

Purpose:

- menampilkan audit trail operasional payment dan return reduction

Allowed data:

- payment history
- return reduction history
- timestamps
- actor id/name jika tersedia

Rules:

- history read-only
- tidak ada edit/delete action

---

## Forbidden UI Scope

UI Step 7 tidak boleh menampilkan atau mengelola:

- warehouse asset valuation
- inventory valuation
- costing
- margin
- stock movement editing
- receiving inspection
- quarantine
- inventory reversal
- accounting journal

---

# 5. Final Implementation Order

Implementasi Step 7 wajib mengikuti urutan:

1. Repository implementation
2. Application use case implementation
3. Application tests
4. Integration tests
5. UI route/API boundary
6. UI screens

UI tidak boleh didahulukan sebelum application contract dan use case siap.

---

# 6. Final Decision

Application orchestration Step 7 adalah entry point resmi Supplier Payable.

Step 7 implementation:

- payable-only
- append-only
- derived outstanding
- no inventory mutation
- no accounting
- UI allowed only after application layer is ready

Status:

FINAL — READY FOR STEP 7 IMPLEMENTATION

