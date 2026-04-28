# ADR-0021 — Receiving Inspection Flow (Future Step)

Status: ACCEPTED (DESIGN LOCKED)
Type: FUTURE STEP / OPERATIONAL EXTENSION
Related Steps: Step 6 (Procurement Foundation), Step 7 (Supplier Payable)

---

## Context

Pada implementasi saat ini:

* `PurchaseOrder` hanya memiliki status `CREATED | RECEIVED | CANCELED`
* Receive berarti barang langsung dianggap valid dan masuk ke inventory
* Tidak ada mekanisme inspeksi warehouse sebelum stok dianggap sah
* Partial receive tidak didukung
* Return supplier terjadi setelah receive dan berdampak ke payable

Model ini cukup untuk MVP awal, namun tidak mencerminkan kondisi operasional nyata:

* Barang yang datang tidak selalu langsung diterima
* Sebagian barang bisa cacat atau salah kirim
* Return ke supplier tidak selalu dilakukan di hari yang sama
* Sebagian barang bermasalah bisa ditahan atau dijual dengan kondisi khusus

Diperlukan lapisan operasional tambahan untuk menangani proses tersebut tanpa merusak kontrak Step 6–7 yang sudah locked.

---

## Decision

Sistem akan memperkenalkan **Receiving Inspection Flow** sebagai extension operasional sebelum receive final ke inventory.

### Prinsip utama

1. **PurchaseOrder tidak diubah**

   * Tidak ada penambahan status baru pada `PurchaseOrder`
   * Status tetap: `CREATED | RECEIVED | CANCELED`

2. **Inspection adalah entitas terpisah**

   * Diperkenalkan aggregate baru:

     * `ReceivingInspection`
     * `ReceivingInspectionItem`
   * Lifecycle inspeksi tidak menjadi bagian dari lifecycle PO

3. **Partial inspection diperbolehkan**

   * Satu kedatangan dapat menghasilkan:

     * accepted
     * quarantined
     * rejected (pending decision)

4. **Inspection tidak otomatis memicu inventory**

   * Hanya hasil `accepted` yang dapat masuk ke inventory normal
   * Barang lain tidak memicu stock mutation

5. **Inspection tidak otomatis memicu payable reduction**

   * Payable hanya berubah saat supplier return resmi
   * Inspection hanya mencatat kondisi barang

6. **Return supplier adalah use case terpisah**

   * Tidak semua barang reject harus langsung diretur
   * Return bisa dilakukan setelah keputusan operasional

### Mode Operasional (Compatibility Rule)

Sistem mendukung dua mode operasional:

#### 1. Direct Receive Mode (Step 6)

* `ReceivePurchaseOrder` dapat dipanggil langsung.
* Barang langsung masuk inventory.
* Tidak melalui inspection.
* Mode ini mempertahankan kontrak Step 6 yang sudah aktif.

#### 2. Inspection Flow Mode (Future Step)

* Barang wajib melalui `ReceivingInspection`.
* `ReceivePurchaseOrder` tidak boleh dipanggil langsung oleh delivery/UI.
* Receive final hanya boleh terjadi melalui use case final acceptance inspection.

Aturan:

* Mode tidak boleh dicampur untuk satu `PurchaseOrder`.
* Satu `PurchaseOrder` wajib mengikuti satu mode secara konsisten.
* Aktivasi inspection flow harus eksplisit melalui policy/config/feature flag.
* Jika `PurchaseOrder` sudah masuk inspection flow, direct receive wajib ditolak.
* Jika `PurchaseOrder` sudah direct receive, inspection flow tidak boleh dibuat.

Konsekuensi:

* Implementasi wajib memiliki guard untuk mencegah penggunaan dua mode bersamaan.
* Future-step ini tidak menghapus direct receive mode.

---

## Scope

### Included

* pencatatan kedatangan barang
* proses inspeksi warehouse
* partial acceptance
* quarantine barang bermasalah
* pencatatan hasil inspeksi per item

### Excluded

* perubahan lifecycle `PurchaseOrder`
* inventory mutation otomatis selain accepted
* supplier return otomatis
* payable reduction saat inspeksi
* pricing barang cacat
* special sale flow
* accounting journal

---

## Core Concepts

### ReceivingInspection

Merepresentasikan satu kejadian barang datang dan diperiksa.

Atribut minimum:

* id
* purchaseOrderId
* status: `ARRIVED | UNDER_INSPECTION | COMPLETED`
* arrivedAt
* arrivedBy

---

### ReceivingInspectionItem

Merepresentasikan hasil inspeksi per item.

Atribut minimum:

* purchaseItemId
* expectedQuantity
* acceptedQuantity
* quarantinedQuantity
* rejectedQuantity
* notes

---

### Quarantine

Status operasional untuk barang:

* tidak masuk inventory normal
* belum diretur
* menunggu keputusan

### Quarantine — Operational Constraint

Quarantine bukan bagian dari inventory quantity resmi.

Aturan:

* Quarantine:
  * tidak dihitung sebagai stock tersedia
  * tidak boleh digunakan oleh Sales
  * tidak boleh mempengaruhi inventory movement
  * tidak boleh masuk ke inventory tanpa proses eksplisit

* Quarantine hanya:
  * state operasional di domain Procurement / Inspection
  * tempat penampungan sementara barang bermasalah

* Barang dalam quarantine hanya dapat:
  * dipindahkan ke accepted melalui proses eksplisit (jika diperbolehkan)
  * diproses menjadi supplier return
  * diproses dalam future-step (misalnya special sale)

Larangan:

* tidak boleh memperlakukan quarantine sebagai inventory dengan flag
* tidak boleh mencampur quarantine dengan stock normal

---

## Invariants

* semua quantity harus integer non-negatif
* accepted + quarantined + rejected = expectedQuantity saat inspection `COMPLETED`
* accepted + quarantined + rejected ≤ expectedQuantity sebelum inspection `COMPLETED`
* inspection item harus mereferensikan purchase item valid
* inspection tidak boleh mengubah histori procurement lama
* inspection tidak boleh mengubah histori payment
* inspection tidak boleh mengubah outstanding payable
* inspection tidak boleh membuat inventory movement langsung

### Inspection Completion Rule

ReceivingInspection hanya boleh berstatus `COMPLETED` jika:

* seluruh item dalam inspection telah memiliki keputusan eksplisit:
  * accepted
  * quarantined
  * rejected (pending decision)
* tidak ada quantity yang tidak teralokasi
* `accepted + quarantined + rejected = expectedQuantity` untuk setiap item

Konsekuensi:

* inspection tidak boleh dianggap selesai secara parsial
* setiap item harus memiliki keputusan eksplisit sebelum inspection selesai
* status `COMPLETED` tidak sama dengan final receive
* `COMPLETED` hanya berarti proses inspeksi selesai, bukan berarti `PurchaseOrder` sudah `RECEIVED`

---

## Interaction Model

Flow konseptual:

PurchaseOrder CREATED  
→ Goods Arrived  
→ ReceivingInspection ARRIVED  
→ UNDER_INSPECTION  
→ hasil item:

* accepted
* quarantined
* rejected (pending decision)
→ ReceivingInspection COMPLETED  
→ Final Acceptance Evaluation  
→ jika seluruh kewajiban kuantitas telah resolved  
→ Inventory mutation untuk accepted quantity  
→ PurchaseOrder RECEIVED

Catatan:

* `ReceivingInspection COMPLETED` tidak otomatis membuat `PurchaseOrder RECEIVED`
* Inventory mutation hanya boleh terjadi setelah Final Acceptance Evaluation lulus
* PurchaseOrder tetap mengikuti lifecycle utama Step 6

---

### Final Acceptance Rule (Critical)

PurchaseOrder hanya boleh ditandai sebagai `RECEIVED` jika seluruh kewajiban kuantitas telah diselesaikan.

Definisi:

* `totalQuantity = accepted + resolvedNonAccepted`

`resolvedNonAccepted` hanya mencakup:

* supplier return resmi yang sudah tercatat
* disposal resmi jika fitur disposal diaktifkan pada fase lanjutan

Tidak termasuk `resolvedNonAccepted`:

* quarantine
* rejected pending decision
* item yang belum diinspeksi
* item yang belum memiliki keputusan final

Aturan:

* `PurchaseOrder` tidak boleh menjadi `RECEIVED` jika masih ada item yang:
  * belum diinspeksi
  * masih berada dalam rejected pending decision
  * masih berada di quarantine
  * belum memiliki keputusan final
* Partial acceptance tidak boleh langsung mengubah `PurchaseOrder` menjadi `RECEIVED`
* Final Acceptance wajib dijalankan melalui use case application layer yang eksplisit
* Final Acceptance hanya boleh dilakukan oleh actor `WAREHOUSE` atau `ADMIN`

Konsekuensi:

* ReceivingInspection dapat `COMPLETED` lebih dulu
* Tetapi `PurchaseOrder RECEIVED` hanya terjadi setelah seluruh item diselesaikan secara final
* Quarantine menahan Final Acceptance sampai ada keputusan final

---

## Boundary Rules

### Procurement

* Mengelola inspection
* Mengelola supplier return decision
* Mengelola payable reduction saat return resmi

### Inventory

* Hanya menerima accepted quantity
* Tidak mengetahui inspection detail

### Inventory Integration Constraint

Inventory mutation hanya boleh terjadi melalui hasil final acceptance.

Aturan:

* hanya accepted quantity yang boleh dikirim ke inventory
* quarantine dan rejected tidak boleh memicu inventory mutation
* inventory tidak mengetahui:
  * inspection status
  * quarantine state
  * rejected state

Semua komunikasi harus melalui application layer orchestration.

### Sales

* Tidak mengetahui inspection
* Tidak boleh mengakses quarantine langsung

### Reporting

* Tetap read-only
* Tidak menjadi tempat rule inspeksi

### Payable Interaction Constraint

ReceivingInspection tidak boleh mempengaruhi payable secara langsung.

Aturan:

* inspection tidak boleh:
  * mengurangi payable
  * mengubah outstanding
  * membuat histori payment
  * membuat histori return

Payable hanya berubah melalui:

* supplier payment (Step 7)
* supplier return resmi (Step 7)

Konsekuensi:

* rejected item tidak otomatis mengurangi hutang
* keputusan return harus melalui use case terpisah

### Final Acceptance Use Case Binding (Clarification)

Final Acceptance harus diimplementasikan sebagai use case application layer yang eksplisit.

Aturan:

* Final Acceptance adalah satu-satunya entry point yang boleh:
  * mengevaluasi apakah seluruh quantity sudah resolved
  * memicu inventory mutation untuk accepted quantity
  * mengubah status `PurchaseOrder` menjadi `RECEIVED`

* Final Acceptance tidak boleh:
  * dipanggil secara implisit dari inspection
  * dipicu langsung dari UI tanpa orchestration application layer
  * di-bypass oleh direct call ke inventory

Relasi dengan use case existing:

* `ReceivePurchaseOrder` pada Step 6 tetap menjadi use case canonical untuk perubahan status `RECEIVED`.
* Dalam Inspection Flow Mode:
  * `ReceivePurchaseOrder` tidak boleh dipanggil langsung oleh delivery/UI
  * tetapi boleh digunakan sebagai internal orchestration oleh Final Acceptance
  * jika tidak kompatibel, wajib dibuat use case baru yang menggantikan perannya secara eksplisit

Constraint implementasi:

* Tidak boleh menduplikasi business rule antara:
  * Final Acceptance
  * ReceivePurchaseOrder
* Tidak boleh memindahkan business rule ke inventory layer
* Semua validasi harus tetap berada di domain Procurement / application orchestration

Konsekuensi:

* Implementasi memiliki satu jalur jelas untuk:
  * inspection → acceptance → inventory → PO RECEIVED
* Menghindari:
  * duplicate receive logic
  * bypass domain invariant
  * inkonsistensi antara direct receive dan inspection flow

---

## Data Behavior

* Inspection bersifat append-only setelah finalized
* Histori inspection tidak boleh diubah
* Quarantine adalah state operasional, bukan inventory utama

### Idempotency / Duplicate Protection

ReceivingInspection tidak boleh dibuat lebih dari sekali untuk event kedatangan yang sama.

Pada phase pertama:

* satu `PurchaseOrder` hanya boleh memiliki satu `ReceivingInspection`
* duplicate inspection untuk `PurchaseOrder` yang sama wajib ditolak
* retry request tidak boleh menghasilkan inspection ganda

Catatan:

* dukungan split delivery / multiple arrival membutuhkan ADR atau amendment lanjutan

---

## Trade-offs

### Keuntungan

* Lebih realistis secara operasional
* Mencegah stok salah masuk
* Memisahkan keputusan bisnis (return vs tahan)
* Tidak merusak Step 6–7

### Kekurangan

* Kompleksitas meningkat
* Membutuhkan aggregate dan use case baru
* Perlu fase lanjutan untuk quarantine sale

---

## Consequences

* Receive tidak lagi selalu identik dengan barang datang
* Inventory hanya berisi barang yang sudah lolos inspeksi
* Supplier return menjadi proses eksplisit
* Payable lebih akurat secara operasional

---

## Non-Goals

* partial receive pada PurchaseOrder
* inventory reversal otomatis
* return otomatis saat inspeksi
* pricing barang cacat
* integrasi langsung ke Sales
* perubahan historis data lama

---

## Future Extension

Phase berikutnya (di luar ADR ini):

* release barang quarantine untuk special sale
* pricing khusus berdasarkan kondisi barang
* integrasi ke Sales flow dengan condition-based selling

---

## Open Questions

Pertanyaan yang masih terbuka dan tidak menghalangi design lock:

* apakah perlu audit trail khusus untuk perubahan status inspection
* bagaimana bentuk future extension untuk split delivery / multiple arrival
* bagaimana desain phase lanjutan untuk quarantine special sale

Pertanyaan yang sudah diselesaikan oleh ADR ini:

* final acceptance tidak bersifat all-or-nothing sederhana
* `PurchaseOrder RECEIVED` hanya boleh terjadi setelah seluruh quantity resolved
* quarantine bukan resolved state
* inspection tidak mempengaruhi payable langsung

---

## Decision Status

ACCEPTED — DESIGN LOCKED

ADR ini mengunci desain konseptual Receiving Inspection Flow sebagai future-step additive.

Implementasi masih membutuhkan:

* use case specification
* repository contract
* testing plan
* rollout plan

Namun keputusan desain utama tidak boleh diubah tanpa ADR/amendment baru.
