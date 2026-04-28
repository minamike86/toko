# Step 6 — Batch Clarification & Cancel Flow Design

Status: DESIGN CLARIFICATION
Type: DESIGN SUPPORT DOCUMENT (NON-LOCKED)

---

## 1. Context

Terdapat inkonsistensi penamaan batch antara:

### A. Global Implementation Plan

Urutan resmi:

1. Batch 1 → Foundation
2. Batch 2 → Create Purchase Order
3. Batch 3 → Receive Purchase Order
4. Batch 4 → Cancel Purchase Order + Hardening

### B. Dokumen Implementasi Receive

Dokumen yang digunakan saat implementasi:

* `step_6_batch_2_Receive_Flow_Activation.md`

Dokumen ini menyebut receive sebagai **Batch 2**

---

## 2. Decision — Naming Resolution

### Keputusan (mengikat untuk implementasi saat ini)

* Penamaan batch **mengikuti dokumen PRIMARY yang aktif digunakan**
* Maka:

| Logical Order | Implementation Naming (aktif) |
| ------------- | ----------------------------- |
| Foundation    | Batch 1                       |
| Receive       | Batch 2                       |
| Cancel        | Batch 3 (lanjutan praktis)    |

### Catatan penting

* Ini **bukan perubahan design**
* Ini hanya **klarifikasi penamaan operasional**
* Tidak boleh rewrite dokumen lama
* Tidak boleh rename batch lama

---

## 3. Scope Step 6 (Reconfirmed)

Use case resmi Step 6:

* CreatePurchaseOrder
* ReceivePurchaseOrder
* CancelPurchaseOrder

Constraint:

* tidak ada payable
* tidak ada accounting
* tidak ada costing lanjutan
* tidak ada partial receive
* tidak ada return

---

## 4. Cancel Purchase Order — Design

### 4.1 Use Case

CancelPurchaseOrder

---

### 4.2 Input

```ts
type CancelPurchaseOrderInput = {
  purchaseOrderId: string;
};
```

---

### 4.3 Authorization

Allowed roles:

* ADMIN only

Tidak boleh:

* SALES
* WAREHOUSE

---

### 4.4 Domain Rule (CRITICAL)

#### Valid transition

| Status   | Action | Result   |
| -------- | ------ | -------- |
| CREATED  | cancel | CANCELED |
| RECEIVED | cancel | ❌ ERROR  |

#### Invariant

* PO yang sudah RECEIVED tidak boleh dibatalkan
* Tidak ada perubahan ke inventory saat cancel

---

### 4.5 Behavior

Flow:

1. Authorization guard
2. Load PurchaseOrder
3. Validasi existence
4. Validasi state (`assertCanBeCanceled`)
5. Mutasi domain:

   * set status → CANCELED
   * set canceledAt
   * set canceledBy
6. Persist

---

### 4.6 Non-Goals

Cancel flow **tidak boleh**:

* mengurangi stock
* memanggil inventory
* melakukan rollback receive
* membuat stock movement

---

## 5. Boundary Rules

### Procurement

* tidak boleh akses inventory repository
* tidak boleh memanggil inventory port untuk cancel

### Inventory

* tidak terlibat dalam cancel flow

### Application Layer

* hanya orchestration
* tidak menyimpan business rule

---

## 6. Testing Strategy

### Application Test

Wajib:

* cancel sukses pada CREATED
* reject pada RECEIVED
* reject unauthorized role
* reject not found

---

### Integration Test

Wajib:

* status berubah ke CANCELED
* persistence benar
* audit field tersimpan

---

### Architecture Test

Tambahan:

* Cancel flow tidak import inventory port
* Procurement tidak import inventory repository
* Tidak import sales mutation

---

## 7. Consequences

* Flow procurement menjadi lengkap (create → receive → cancel)
* Tidak ada coupling ke inventory pada cancel
* State machine PO menjadi eksplisit

---

## 8. Trade-offs

* Tidak ada rollback receive → jika sudah receive, cancel tidak bisa dilakukan
* Simpel tapi tidak fleksibel (sesuai MVP)

---

## 9. Relationship dengan Batch Sebelumnya

| Batch             | Scope        |
| ----------------- | ------------ |
| Batch 1           | Foundation   |
| Batch 2           | Receive Flow |
| Batch 3 (current) | Cancel Flow  |

---

## 10. Implementation Readiness

Setelah dokumen ini:

* tidak perlu design tambahan
* tidak perlu ADR
* langsung implementasi

---

## 11. Important Note

Dokumen ini:

* bukan source of truth utama
* hanya clarification + execution support

Source of truth tetap:

* implementation plan
* receive flow document
* mvp stages overview

---

## 12. Conclusion

* Konflik penamaan batch telah diklarifikasi tanpa mengubah histori
* Cancel flow menjadi langkah berikut yang valid
* Boundary dan invariant tetap terjaga
* Scope tetap dalam MVP
