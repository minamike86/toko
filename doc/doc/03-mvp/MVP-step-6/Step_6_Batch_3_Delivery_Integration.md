## Step 6 Batch 3 — Delivery Integration Cancel Purchase Order

Type: EXECUTION GUIDE (NON-AUTHORITATIVE)
Status: ACTIVE

---

### Catatan Penamaan

Dokumen ini mengikuti implementation naming aktif yang telah diklarifikasi pada Step_6_Batch_3_Clarification_&_Cancel_Flow_Design.md, sehingga cancel flow diperlakukan sebagai Batch 3 untuk eksekusi saat ini. Dokumen ini tidak mengubah urutan batch pada implementation plan global.

---

### 1. Tujuan

Menghubungkan use case `CancelPurchaseOrder` ke delivery layer (API / UI) tanpa mengubah kontrak domain dan tanpa menambah business rule.

---

### 2. Scope

#### In Scope

* wiring use case ke container
* API endpoint cancel purchase order
* UI trigger (button / action)
* mapping error ke response

#### Out of Scope

* perubahan domain procurement
* perubahan inventory
* perubahan sales
* perubahan authorization design
* login system / authentication system

---

### 3. Existing Contract (WAJIB DIPATUHI)

Delivery integration ini wajib mengikuti kontrak yang sudah dikunci pada:

* Step_6_Batch_3_Clarification_&_Cancel_Flow_Design.md
* MVP_step_6_procurement_cost_foundation_implementation_plan.md

Dokumen ini tidak mendefinisikan ulang kontrak cancel flow,
dan hanya menjabarkan langkah delivery integration.

---

### 4. Current Gap

Berdasarkan container saat ini:

* belum ada:

  * PrismaPurchaseOrderRepository di container
  * CancelPurchaseOrder wiring di container
  * endpoint cancel procurement

👉 Cancel flow sudah ada di application layer, tapi belum bisa diakses dari UI.

---

### 5. Target Architecture (Delivery Layer)

Flow:

```
UI → Route / Handler → CancelPurchaseOrder → Repository → DB
```

Constraint:

* UI tidak tahu business rule
* Route tidak tahu domain logic
* Use case tetap source of truth

---

### 6. Implementation Steps

#### 6.1 Container Wiring

Tambahkan pada container:

* instance PrismaPurchaseOrderRepository
* instance CancelPurchaseOrder yang hanya menerima purchaseOrderRepo

Constraint:

* cancel flow tidak boleh menginject InventoryProcurementPort
* cancel flow tidak boleh mengakses inventory adapter/service
* tidak boleh reuse dependency dari receive flow

---

#### 6.2 API Route

Endpoint:

```
POST /api/procurement/purchase-orders/{id}/cancel
```

Responsibility:

* parsing param
* inject actor
* call use case
* mapping error → HTTP response

---

#### 6.3 Actor Injection

Sementara (MVP / DEVELOPMENT ONLY):

* actor boleh di-hardcode di route hanya untuk local development dan manual verification
* tidak boleh digunakan sebagai implementasi production

Constraint:

* authorization tetap berada di application layer
* route hanya meneruskan actor ke use case
* source actor production (session/auth) berada di luar scope dokumen ini

---

#### 6.4 UI Trigger

Button hanya tampil jika:

* status === `CREATED`

UI hanya:

* call API
* handle response

UI tidak boleh:

* menentukan rule cancel
* validasi domain state

---

### 7. Error Mapping

Route harus mapping:

* `NotFoundError` → 404
* `ForbiddenError` → 403
* domain error → 400

---

### 8. Manual Verification (WAJIB)

Setelah implementasi:

1. cancel PO `CREATED` → sukses
2. cancel PO `RECEIVED` → gagal
3. cek DB → status `CANCELED`
4. cek inventory → tidak berubah
5. cek stock movement → tidak ada

---

### 9. Boundary Rules

Wajib dipastikan:

* route tidak mengakses repository langsung
* UI tidak mengakses domain
* cancel flow tidak menyentuh inventory
* cancel flow tidak boleh memanggil InventoryProcurementPort
* cancel flow tidak boleh menghasilkan stock movement
* tidak boleh ada dependency ke inventory module
* tidak ada logic baru di delivery layer

---

### 10. Exit Criteria

Batch dianggap selesai jika:

* endpoint bisa dipanggil
* UI bisa trigger cancel
* manual verification lulus
* tidak ada pelanggaran boundary
* tsc --noEmit PASS
* vitest run PASS (tidak ada regression pada cancel flow)

Catatan: penyelesaian delivery integration ini tidak mengubah official Definition of Done Step 6, dan hanya berfungsi sebagai enablement operasional atas cancel flow yang sudah selesai
---

### 11. Notes

Dokumen ini:

* bukan design authority
* tidak mengubah kontrak sistem
* hanya panduan implementasi delivery layer

Semua rule tetap berasal dari dokumen PRIMARY dan domain.
