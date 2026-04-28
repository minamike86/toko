# Step 6.5 — DTO & Error Contract Specification

## Status
DESIGN SPECIFICATION — PRE-IMPLEMENTATION

---

## Tujuan

Dokumen ini mendefinisikan kontrak DTO, error, dan boundary application layer untuk Step 6.5 – Measurement & Unit Normalization.

Dokumen ini dibuat sebelum implementasi agar:

- bentuk input/output tidak liar
- error contract tidak ambigu
- boundary conversion tidak bocor ke layer yang salah
- implementasi dan test memiliki source of truth yang sama

Dokumen ini **tidak** menggantikan domain document.
Dokumen ini **tidak** berisi kode implementasi.
Dokumen ini **mengunci kontrak application layer** yang harus dipatuhi saat coding dimulai.

---

## Posisi Dokumen

Dokumen ini berada di bawah keputusan yang sudah dikunci oleh:

- ADR-0016 — Measurement & Unit Normalization
- `catalog_domain.md`
- `inventory_domain.md`
- `procurement_domain.md`
- `receive_purchase_order.md`
- `Receive Stock (Use Case).md`

Jika terjadi konflik:

- domain document menang untuk invariant
- ADR menang untuk keputusan arsitektural
- dokumen ini menang untuk DTO, error, dan application boundary contract

---

# 1. Prinsip Umum Kontrak

## 1.1 Prinsip Boundary

- UI hanya parsing input
- application layer membentuk DTO eksplisit
- conversion dilakukan di application layer
- Inventory tidak menerima unit non-canonical
- Procurement tidak memiliki conversion rule
- Reporting tidak boleh memakai contract ini untuk business rule baru

---

## 1.2 Larangan

Tidak boleh:

- memakai `any`
- memakai error generik tanpa makna bisnis
- mengirim raw quantity procurement langsung ke Inventory
- menjadikan DTO sebagai domain entity terselubung
- menaruh fallback logic di mapper atau helper sembunyi

---

# 2. DTO yang Wajib Ada

## 2.1 ReceivePurchaseOrderInput

DTO ini adalah kontrak input resmi untuk use case `ReceivePurchaseOrder`.

### Field wajib

- `purchaseOrderId: string`
- `receivedAt?: Date`
- `actor: ActorContext`

### Aturan

- `purchaseOrderId` tidak boleh kosong
- `actor.actorId` tidak boleh kosong
- `actor.role` wajib valid
- `receivedAt` bersifat opsional

### Catatan

DTO ini **tidak** membawa conversion rule.
DTO ini **tidak** membawa canonical quantity dari UI.
Normalisasi dilakukan setelah PurchaseOrder dimuat dari repository.

---

## 2.2 NormalizedReceivePurchaseItem

DTO internal application layer untuk hasil normalisasi satu item procurement.

### Field wajib

- `variantId: string`
- `transactionUnit: string`
- `transactionQuantity: number`
- `canonicalUnit: string`
- `canonicalQuantity: number`
- `referenceId: string`

### Fungsi

DTO ini menjadi hasil resmi setelah item procurement berhasil dinormalisasi.

### Aturan

- `transactionUnit` adalah snapshot transaksi procurement
- `canonicalUnit` adalah unit resmi Catalog
- `canonicalQuantity` harus valid dan positif
- DTO ini tidak dipersist sebagai domain entity baru

---

## 2.3 ReceiveProcurementStockItem

DTO boundary resmi dari Procurement ke Inventory.

### Field wajib

- `variantId: string`
- `quantity: number`
- `reason: string`
- `referenceId: string`

### Aturan

- `quantity` wajib canonical
- `reason` wajib eksplisit
- `referenceId` wajib berisi `purchaseOrderId`
- DTO ini tidak boleh membawa `unitCost`
- DTO ini tidak boleh membawa `supplierId`
- DTO ini tidak boleh membawa `transactionUnit`

### Tujuan

DTO ini memastikan Inventory hanya menerima model quantity yang sudah bersih.

---

## 2.4 ReceiveStockRequest

Kontrak input resmi Inventory untuk use case `ReceiveStock`.

### Field wajib

- `variantId: string`
- `quantity: number`
- `reason: string`
- `referenceId?: string`

### Aturan

- `quantity` wajib canonical
- jika caller belum melakukan normalisasi, request dianggap invalid
- Inventory tidak menerima unit tambahan untuk conversion

---

## 2.5 ReceivePurchaseOrderResult

Output resmi use case `ReceivePurchaseOrder`.

### Field minimum

- `id: string`
- `supplierId: string`
- `status: string`
- `receivedAt: Date`
- `receivedBy: string`
- `totalQuantity: number`
- `totalCost: number`
- `items: ReceivePurchaseOrderResultItem[]`

### Item minimum

- `variantId: string`
- `productNameSnapshot: string`
- `variantNameSnapshot: string`
- `unitSnapshot: string`
- `quantity: number`
- `unitCost: number`
- `subtotalCost: number`

### Aturan

- output tetap merepresentasikan histori procurement
- `unitSnapshot` tidak diubah menjadi canonical unit
- output tidak memalsukan histori transaksi

---

# 3. Error Contract yang Wajib Ada

## 3.1 Prinsip Error

Error harus:

- eksplisit
- bermakna bisnis atau application-level yang sah
- dapat diuji berdasarkan jenis error
- tidak membocorkan Prisma, HTTP, atau framework

Tidak boleh:

- `throw new Error()` tanpa tipe bermakna
- menyamarkan conversion failure sebagai inventory failure
- memakai fallback diam-diam tanpa error

---

## 3.2 Error untuk ReceivePurchaseOrder

Minimal error yang wajib tersedia:

- `PURCHASE_ORDER_NOT_FOUND`
- `PURCHASE_ORDER_ALREADY_RECEIVED`
- `PURCHASE_ORDER_ALREADY_CANCELED`
- `INVALID_INPUT_UNIT`
- `CONVERSION_RULE_NOT_FOUND`
- `NORMALIZED_QUANTITY_INVALID`
- `NON_CANONICAL_QUANTITY`
- `INVENTORY_NOT_FOUND`
- `FORBIDDEN`

### Aturan penting

- `INVALID_INPUT_UNIT` dipakai jika unit transaksi structurally tidak valid
- `CONVERSION_RULE_NOT_FOUND` dipakai jika unit valid tetapi rule conversion tidak tersedia
- `NORMALIZED_QUANTITY_INVALID` dipakai jika hasil normalisasi tidak sah
- `NON_CANONICAL_QUANTITY` dipakai jika boundary Inventory menerima quantity yang tidak memenuhi kontrak canonical

---

## 3.3 Error untuk ReceiveStock

Minimal error yang wajib tersedia:

- `INVENTORY_NOT_FOUND`
- `INVALID_QUANTITY`
- `NON_CANONICAL_QUANTITY`
- `INVALID_STOCK_REASON`

### Aturan penting

- ReceiveStock tidak boleh mencoba melakukan conversion untuk memperbaiki input
- jika quantity tidak canonical, request wajib ditolak
- kegagalan canonical contract bukan tanggung jawab domain Catalog di dalam use case Inventory

---

# 4. Boundary Interface yang Wajib Ada

## 4.1 UnitNormalizationPort

Port ini berada pada application boundary yang sah.

### Tanggung jawab

- menerima `variantId`, `transactionUnit`, dan `transactionQuantity`
- membaca rule resmi dari Catalog
- menghasilkan canonical quantity
- gagal eksplisit jika rule tidak tersedia

### Tidak boleh

- dipanggil dari UI
- dipanggil dari Inventory domain
- dipakai sebagai helper global tanpa boundary jelas

---

## 4.2 InventoryProcurementPort

Port ini adalah boundary resmi Procurement → Inventory.

### Tanggung jawab

- menerima item-item yang sudah canonical
- meneruskan receive ke Inventory mutation boundary
- menjaga agar Procurement tidak menyentuh repository Inventory langsung

### Tidak boleh

- menerima raw transaction unit
- menerima conversion rule dari caller
- memuat costing field

---

# 5. Validation Order yang Mengikat

Urutan validasi di `ReceivePurchaseOrder` wajib seperti ini:

1. validasi actor
2. load PurchaseOrder
3. validasi state order
4. normalisasi seluruh item
5. build inventory request
6. call Inventory boundary
7. mutate order state
8. persist Procurement

Konsekuensinya:

- conversion failure harus berhenti sebelum inventory call
- inventory failure tidak boleh dipakai untuk menutupi conversion failure
- tidak boleh ada partial normalization

---

# 6. Mapping Rules

## 6.1 Procurement Item → NormalizedReceivePurchaseItem

Sumber:

- `variantId`
- `unitSnapshot`
- `quantity`

Hasil:

- `canonicalUnit`
- `canonicalQuantity`

Rule:

- mapping ini terjadi di application layer
- mapping ini tidak mengubah domain snapshot

---

## 6.2 NormalizedReceivePurchaseItem → ReceiveProcurementStockItem

Rule:

- hanya field yang diperlukan Inventory yang boleh diteruskan
- `transactionUnit` tidak ikut dikirim
- `unitCost` tidak ikut dikirim
- `supplierId` tidak ikut dikirim

---

# 7. Testing Contract

## 7.1 Application Test Wajib

### ReceivePurchaseOrder

- reject jika order tidak ditemukan
- reject jika order bukan `CREATED`
- reject jika unit input invalid
- reject jika conversion rule tidak ada
- reject jika hasil normalisasi invalid
- memastikan Inventory dipanggil hanya setelah semua item sukses dinormalisasi
- memastikan Inventory menerima canonical quantity
- memastikan tidak ada fallback

### ReceiveStock

- reject jika quantity tidak valid
- reject jika quantity non-canonical
- reject jika inventory tidak ditemukan
- memastikan movement tercatat saat sukses

---

## 7.2 Integration Test Wajib

- receive PO dengan unit non-canonical yang valid menghasilkan stok canonical
- receive PO dengan missing conversion rule gagal tanpa side effect inventory
- receive stock non-canonical gagal di boundary Inventory

---

# 8. Non-Goals

Dokumen ini tidak mencakup:

- detail implementasi code
- struktur file final
- naming class final di repository atau adapter
- costing logic
- accounting logic
- reporting projection baru
- migration script

---

# 9. Kesimpulan

Sebelum coding dimulai, kontrak Step 6.5 harus dikunci di level application layer.

Dokumen ini menetapkan bahwa:

- DTO harus eksplisit
- error harus bermakna
- conversion harus berhenti di boundary yang benar
- Inventory hanya menerima canonical quantity
- tidak ada fallback

Dokumen ini adalah pagar implementasi.
