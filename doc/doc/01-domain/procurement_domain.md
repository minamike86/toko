# Procurement Domain

### Status  

CANONICAL DOMAIN DOCUMENT

---

## Tujuan

Dokumen ini mendefinisikan **kontrak domain Procurement** untuk MVP Step 6–7.

Procurement adalah domain supply-side yang bertanggung jawab untuk:

- mencatat histori pembelian barang dari supplier
- menyimpan unit cost per transaksi pembelian
- mengelola lifecycle purchase order
- menjadi source of truth histori procurement
- mengelola kewajiban pembayaran ke supplier (payable operasional Step 7)

Dokumen ini **tidak** mendefinisikan:

- delivery layer
- UI
- reporting
- accounting formal (journal / ledger)

Payable operasional pada Step 7 termasuk dalam scope domain Procurement,
namun tidak menjadikan domain ini sebagai accounting system.

---

## Posisi Domain

Procurement adalah domain terpisah.

Procurement:

- **bukan** ekstensi Inventory
- **bukan** ekstensi Sales
- **bukan** pseudo-reporting
- **bukan** accounting mini

Konsekuensinya:

- Inventory tetap menjadi source of truth quantity
- Sales tidak mengetahui proses procurement
- Reporting tetap read-only
- Unit cost hidup di Procurement, bukan di Inventory

---

## Scope Domain

Domain Procurement dalam MVP Step 6-7 mencakup:

- Supplier
- PurchaseOrder
- PurchaseItem
- status lifecycle purchase order
- invariant pembelian dasar
- payable pembelian ke supplier
- histori payment pembelian
- pengurangan payable melalui purchase return

Domain ini tidak mencakup:

- accounting journal
- general ledger
- period closing
- tax pembelian
- discount pembelian kompleks
- multi-currency
- payment scheduling
- costing lanjutan
- FIFO / moving average
- margin / profit calculation

Catatan boundary:

- Step 6 hanya mencakup procurement foundation tanpa payable.
- Step 7 memperluas domain Procurement untuk memasukkan payable operasional.
- Perluasan ini tetap tidak menjadikan Procurement sebagai accounting mini.

---

## Bahasa Domain

Istilah resmi domain ini adalah:

- **Supplier**
- **PurchaseOrder**
- **PurchaseItem**
- **CreatePurchaseOrder**
- **ReceivePurchaseOrder**
- **CancelPurchaseOrder**

Istilah singkatan seperti **PO** boleh dipakai secara informal, tetapi source of truth dokumentasi tetap menggunakan **PurchaseOrder**.

---

# 1. Boundary Domain

## 1.1 Inventory Boundary

Inventory tetap menjadi satu-satunya source of truth quantity.

Procurement tidak boleh:

- menulis `InventoryItem` langsung
- membuat `StockMovement` langsung lewat repository inventory
- mengubah tabel inventory di luar boundary resmi
- menyimpan current stock di domain Procurement

Procurement hanya boleh meminta penambahan stok melalui boundary application yang resmi.

---

## 1.2 Sales Boundary

Sales tidak mengetahui Procurement.

Procurement tidak boleh:

- mengubah kontrak domain Sales
- mengimpor use case mutasi Sales
- menyentuh histori penjualan

---

## 1.3 Reporting Boundary

Reporting tetap read-only.

Procurement tidak boleh:

- memindahkan costing logic ke reporting
- menjadikan reporting sebagai source of truth procurement
- menaruh business rule procurement di query/reporting layer

---

## 1.4 Authorization Boundary

Authorization bukan bagian dari domain Procurement.

Domain Procurement:

- tidak mengetahui role
- tidak mengetahui session
- tidak mengetahui HTTP
- tidak mengetahui framework

Authorization wajib berada di application layer sebelum use case dijalankan.

---

# 2. Aggregate dan Entity

## 2.1 Aggregate Root

Aggregate root domain ini adalah:

- **PurchaseOrder**

PurchaseOrder memegang:

- lifecycle order
- kumpulan item pembelian
- metadata receive / cancel
- total turunan (derived)

`PurchaseItem` adalah child entity dari `PurchaseOrder` dan tidak memiliki repository sendiri.

---

## 2.2 Supplier

Supplier merepresentasikan pihak eksternal tempat barang dibeli.

### Atribut Minimum

- `id: string`
- `storeName: string`
- `salesName: string | null`
- `phone: string | null`
- `notes: string | null`
- `isActive: boolean`
- `createdAt: Date`

### Tanggung Jawab

Supplier bertanggung jawab untuk:

- menyimpan identitas operasional supplier
- menyatakan apakah supplier masih aktif dipakai untuk pembelian baru
- menjaga validitas contact information dasar

### Behavior Resmi

- `activate()`
- `deactivate()`
- `updateContactInfo()`
- `assertCanBeUsedForNewPurchaseOrder()`

### Invariant

- `id` wajib valid dan tidak boleh kosong
- `storeName` wajib ada dan tidak boleh kosong
- `isActive` default `true` saat create
- supplier inactive tidak boleh dipakai untuk purchase order baru
- perubahan contact info tidak boleh mengubah histori procurement lama

### Catatan Boundary

Supplier bukan vendor payable entity. Supplier pada Step 6 hanya identitas operasional procurement.

---

## 2.3 PurchaseItem

PurchaseItem merepresentasikan satu line item dalam purchase order.

### Atribut Minimum

- `id: string`
- `purchaseOrderId: string`
- `productId: string`
- `variantId: string`
- `productNameSnapshot: string`
- `variantNameSnapshot: string`
- `unitSnapshot: string`
- `quantity: number`
- `unitCost: number`
- `subtotalCost: number`

### Tanggung Jawab

PurchaseItem bertanggung jawab untuk:

- merepresentasikan satu item pembelian
- menyimpan snapshot nama dan unit saat pembelian dibuat
- menjaga konsistensi quantity, unit cost, dan subtotal

### Invariant

- `id` wajib valid
- `purchaseOrderId` wajib valid
- `productId` wajib valid
- `variantId` wajib valid
- `productNameSnapshot` tidak boleh kosong
- `variantNameSnapshot` tidak boleh kosong
- `unitSnapshot` tidak boleh kosong
- `quantity` harus integer positif
- `unitCost` harus integer non-negatif
- `subtotalCost = quantity × unitCost`

### Identity Rule

Identity operasional item adalah `variantId`.

`productId` disimpan sebagai:

- snapshot/helper
- referensi historis ringan

`productId` bukan identity operasional utama pada lifecycle procurement.

### Constraint

- satu `PurchaseOrder` tidak boleh memiliki duplicate `variantId`

---

## 2.4 PurchaseOrder

PurchaseOrder merepresentasikan satu kejadian pembelian dari supplier.

### Atribut Minimum

- `id: string`
- `supplierId: string`
- `status: CREATED | RECEIVED | CANCELED`
- `items: PurchaseItem[]`
- `createdAt: Date`
- `createdBy: string`
- `receivedAt: Date | null`
- `receivedBy: string | null`
- `canceledAt: Date | null`
- `canceledBy: string | null`

### Derived Fields

- `totalQuantity`
- `totalCost`

### Tanggung Jawab

PurchaseOrder bertanggung jawab untuk:

- mengontrol lifecycle order pembelian
- memastikan state transition valid
- menjaga metadata receive dan cancel tetap konsisten
- menjadi aggregate root untuk PurchaseItem

### Status Resmi

Status resmi Step 6 hanya:

- `CREATED`
- `RECEIVED`
- `CANCELED`

Tidak ada status tambahan seperti:

- `PARTIALLY_RECEIVED`
- `APPROVED`
- `PAID`
- `CLOSED`

### Behavior Resmi

- `assertCanBeReceived()`
- `assertCanBeCanceled()`
- `receive(receivedAt, receivedBy)`
- `cancel(canceledAt, canceledBy)`

### Invariant Umum

- `id` wajib valid
- `supplierId` wajib valid
- `createdAt` wajib ada
- `createdBy` wajib valid
- `items.length > 0`
- semua item harus terkait ke purchase order yang sama
- tidak boleh ada duplicate `variantId` dalam satu order

### Invariant per Status

#### Saat `CREATED`

- `receivedAt = null`
- `receivedBy = null`
- `canceledAt = null`
- `canceledBy = null`

#### Saat `RECEIVED`

- `receivedAt` wajib ada
- `receivedBy` wajib ada
- `canceledAt = null`
- `canceledBy = null`

#### Saat `CANCELED`

- `canceledAt` wajib ada
- `canceledBy` wajib ada
- `receivedAt = null`
- `receivedBy = null`

### State Transition

Transisi valid hanya:

- `CREATED → RECEIVED`
- `CREATED → CANCELED`

Transisi yang dilarang:

- `RECEIVED → CANCELED`
- `CANCELED → RECEIVED`
- `RECEIVED → RECEIVED`
- `CANCELED → CANCELED`

### Constraint MVP

- tidak ada partial receive
- tidak ada multi receive
- receive selalu seluruh order
- cancel hanya valid sebelum receive

---

## 2.5 Supplier Payable (Step 7 Extension)

Supplier Payable merepresentasikan kewajiban pembayaran ke supplier
yang timbul dari purchase order yang telah diterima.

### Posisi Konsep

Supplier Payable pada MVP Step 7:

- berada dalam boundary domain Procurement
- bukan domain Accounting
- bukan reporting projection
- bukan field bebas yang boleh diubah manual

### Sumber Kebenaran

Payable berasal dari:

- PurchaseOrder yang sudah `RECEIVED`

Payable berkurang melalui:

- Supplier Payment
- Purchase Return

Payable tidak boleh bertambah kembali secara manual
setelah kewajiban awal terbentuk.

### Invariant Umum

- payable tidak boleh negatif
- payment tidak boleh melebihi outstanding
- return reduction tidak boleh melebihi nilai yang masih sah untuk dikurangi
- histori payment bersifat immutable
- histori return bersifat immutable
- perubahan payable harus dapat dijelaskan oleh histori payment dan/atau histori return

### Derived Rule

Secara konseptual:

- `payableInitial = totalCost PurchaseOrder yang telah RECEIVED`
- `payableRemaining = payableInitial - totalPaid - totalReturned`

Outstanding adalah nilai turunan.
Outstanding bukan field bebas yang boleh menjadi sumber kebenaran utama.

### Constraint MVP

- tidak ada interest / denda
- tidak ada due date engine
- tidak ada installment schedule formal
- tidak ada edit histori payment
- tidak ada delete histori payment
- tidak ada recalculation histori lama
- tidak ada journal accounting

---

## 2.6 Supplier Payment (Step 7 Extension)

Supplier Payment merepresentasikan satu kejadian pembayaran ke supplier
yang mengurangi outstanding hutang procurement.

### Karakteristik

Supplier Payment harus:

- terkait ke purchase order yang sah
- memiliki amount positif
- bersifat append-only
- tidak boleh diubah setelah tercatat
- tidak boleh dihapus sebagai mekanisme koreksi normal

### Fungsi Konseptual

Supplier Payment bertanggung jawab untuk:

- mencatat pengurangan payable melalui pembayaran
- menjaga histori pembayaran tetap jujur
- memungkinkan partial payment dan full payment

### Invariant

- amount harus integer positif
- payment hanya valid untuk purchase order `RECEIVED`
- payment tidak boleh menyebabkan outstanding negatif
- payment bukan inventory mutation
- payment bukan purchase return

### Catatan Boundary

Payment tidak boleh:

- menambah atau mengurangi stock
- memanggil inventory mutation
- mengubah histori purchase item
- mengubah histori procurement lama

---

## 2.7 Purchase Return Reduction (Step 7 Extension)

Purchase Return Reduction adalah pengurangan payable
karena barang dikembalikan ke supplier.

### Penegasan Domain

Purchase Return Reduction:

- bukan payment
- bukan cancel purchase order
- bukan rewrite histori receive
- bukan reverse inventory secara otomatis tanpa use case resmi

### Fungsi Konseptual

Return reduction bertanggung jawab untuk:

- mengurangi payable secara sah karena pengembalian barang
- menjaga agar pengurangan hutang karena retur
  tidak tercampur dengan payment

### Invariant

- return reduction tidak boleh melebihi nilai yang sah untuk dikurangi
- return reduction tidak boleh membuat outstanding negatif
- return reduction harus tercatat sebagai histori terpisah dari payment
- return reduction tidak mengubah histori payment
- return reduction tidak mengubah status dasar lifecycle purchase order Step 6
  secara diam-diam

### Constraint MVP

- detail inventory reversal untuk purchase return harus melalui boundary resmi
- procurement domain tidak boleh mengasumsikan inventory reversal otomatis
- jika purchase return diaktifkan, use case dan boundary inventory-nya harus eksplisit

---

# 3. Domain Errors

Domain Procurement menggunakan error domain yang bermakna bisnis.

Aturan:

- domain error harus bermakna bisnis
- domain error tidak boleh membocorkan detail Prisma / HTTP / framework
- payment dan return reduction harus memiliki error yang terpisah
- payment error tidak boleh dipakai untuk menyamarkan return reduction

Contoh error yang sah:

- `PROCUREMENT_IDENTITY_INVALID`
- `SUPPLIER_STORE_NAME_INVALID`
- `SUPPLIER_INACTIVE`
- `PURCHASE_ORDER_ITEMS_EMPTY`
- `PURCHASE_ITEM_QUANTITY_INVALID`
- `PURCHASE_ITEM_UNIT_COST_INVALID`
- `PURCHASE_ITEM_SNAPSHOT_INVALID`
- `PURCHASE_ORDER_STATUS_INVALID`
- `PURCHASE_ORDER_ALREADY_RECEIVED`
- `PURCHASE_ORDER_ALREADY_CANCELED`
- `PURCHASE_ORDER_CANNOT_BE_RECEIVED`
- `PURCHASE_ORDER_CANNOT_BE_CANCELED`
- `DUPLICATE_PURCHASE_ITEM_VARIANT`

Step 7 extension:

- `PURCHASE_ORDER_NOT_RECEIVED`
- `INVALID_SUPPLIER_PAYMENT_AMOUNT`
- `SUPPLIER_PAYMENT_EXCEEDS_OUTSTANDING`
- `SUPPLIER_OUTSTANDING_NEGATIVE`
- `PURCHASE_RETURN_EXCEEDS_ALLOWED_REDUCTION`
- `PURCHASE_RETURN_REDUCTION_EXCEEDS_OUTSTANDING`
- `SUPPLIER_PAYMENT_HISTORY_IMMUTABLE`
- `PURCHASE_RETURN_HISTORY_IMMUTABLE`

---

# 4. Repository Contract

## 4.1 SupplierRepository

Repository contract resmi:

- `nextId()`
- `save(supplier)`
- `findById(id)`
- `findByStoreName(storeName)`

### Tanggung Jawab

- generate id baru
- persist perubahan supplier
- load supplier by id
- cek konflik nama toko bila diperlukan

---

## 4.2 PurchaseOrderRepository

Repository contract resmi:

- `nextId()`
- `nextItemId()`
- `save(order)`
- `findById(id)`

### Tanggung Jawab

- generate id PurchaseOrder
- generate id PurchaseItem
- persist aggregate PurchaseOrder + child items
- load aggregate penuh by id

### Constraint

`PurchaseItem` tidak memiliki repository sendiri.

---

# 5. Relationship dengan Cross-Domain Port

Port lintas domain bukan bagian domain entity, tetapi relevan untuk boundary resmi.

## 5.1 Catalog Snapshot

Procurement membutuhkan snapshot catalog untuk:

- validasi variant aktif
- snapshot nama product
- snapshot nama variant
- snapshot unit

Catalog diperlakukan sebagai read dependency.

Procurement tidak mengubah Catalog.

---

## 5.2 Inventory Procurement Boundary

Procurement membutuhkan boundary resmi untuk receive flow.

Kontrak pentingnya:

- Inventory menerima permintaan receive procurement
- Inventory menambah quantity
- Inventory mencatat movement dengan `origin = PURCHASE`
- `referenceId = purchaseOrderId`

### Constraint Kritis

Procurement tidak boleh:

- mengakses repository inventory langsung
- membuat stock movement sendiri
- mem-bypass inventory boundary

---

# 6. Domain Rules yang Mengikat

## 6.1 Rule Supplier

- Supplier inactive tidak boleh dipakai membuat purchase order baru.
- Update supplier tidak mengubah histori purchase order lama.

## 6.2 Rule Purchase Order Creation

- Purchase order wajib memiliki minimal satu item.
- Semua item harus valid.
- Tidak boleh ada duplicate variant dalam satu order.
- Snapshot item harus diambil saat pembuatan order.

## 6.3 Rule Receive

- Hanya order `CREATED` yang boleh di-receive.
- Receive mengubah state menjadi `RECEIVED`.
- Receive wajib mengisi `receivedAt` dan `receivedBy`.
- Receive tidak membuka partial receive.

## 6.4 Rule Cancel

- Hanya order `CREATED` yang boleh di-cancel.
- Cancel mengubah state menjadi `CANCELED`.
- Cancel wajib mengisi `canceledAt` dan `canceledBy`.
- Cancel tidak boleh menyentuh inventory.
- Cancel tidak membuat stock movement.

## 6.5 Rule Payable Formation (Step 7)

- Hutang supplier hanya terbentuk dari purchase order yang sudah `RECEIVED`.
- Purchase order `CREATED` belum membentuk payable.
- Purchase order `CANCELED` tidak membentuk payable.
- Nilai hutang awal berasal dari `totalCost` purchase order yang diterima.

Catatan tambahan (Step 6.5):

- unitSnapshot tetap menyimpan unit transaksi asli
- quantity transaksi dapat menggunakan unit non-canonical

Namun:

- sebelum mempengaruhi inventory,
  quantity wajib dikonversi ke canonical unit

Procurement tidak memiliki conversion rule
dan tidak boleh melakukan conversion sendiri.

Procurement hanya:

- menyimpan snapshot
- meminta normalisasi melalui application layer

Receive flow wajib memastikan:

1. Unit transaksi valid
2. Conversion ke canonical tersedia
3. Quantity berhasil dinormalisasi

Jika gagal:

→ receive harus ditolak

## 6.6 Rule Supplier Payment (Step 7)

- Payment hanya boleh dicatat untuk purchase order `RECEIVED`.
- Payment amount harus positif.
- Payment boleh parsial.
- Total payment tidak boleh melebihi outstanding.
- Payment tidak boleh mengubah inventory.
- Payment tidak boleh mengubah histori purchase order.
- Payment bersifat immutable setelah tercatat.

## 6.7 Rule Purchase Return Reduction (Step 7)

- Purchase return reduction hanya boleh terjadi pada purchase order `RECEIVED`.
- Purchase return reduction mengurangi payable, bukan dianggap payment.
- Return reduction tidak boleh melebihi nilai yang sah untuk dikurangi.
- Return reduction tidak boleh membuat outstanding negatif.
- Return reduction tidak boleh mengubah histori payment.
- Return reduction harus tercatat sebagai histori terpisah.

## 6.8 Rule Outstanding

- Outstanding adalah nilai turunan.
- Outstanding tidak boleh menjadi field bebas yang diubah manual.
- Outstanding harus konsisten dengan:
  - payable awal
  - total payment
  - total return reduction
- Jika hasil perhitungan outstanding negatif,
  operasi harus ditolak sebagai pelanggaran invariant.

---

# 7. Non-Atomic Receive Contract

Kontrak receive procurement pada Step 6 bersifat **non-atomic lintas domain**.

Flow resminya:

1. Inventory receive dieksekusi terlebih dahulu melalui boundary resmi.
2. Setelah inventory sukses, `PurchaseOrder` ditandai `RECEIVED` dan dipersist.

Jika:

- inventory sukses
- tetapi persistence Procurement gagal

maka:

- stok tetap bertambah
- purchase order dapat tetap berstatus `CREATED`
- tidak ada rollback lintas domain

Kontrak ini adalah **accepted trade-off MVP**.

### Konsekuensi

- duplicate stock movement dapat terjadi jika request diulang setelah inventory sukses tetapi save order gagal
- idempotency belum dijamin
- reconciliation / hardening lanjutan ditunda ke tahap berikutnya

### Batas Penting

Kontrak non-atomic ini adalah behavior application/integration.

Domain Procurement tetap hanya mengatur:

- validitas state transition
- metadata receive
- metadata cancel

---

# 8. Legacy Handling

Stok lama tetap diperlakukan sebagai legacy.

Procurement Step 6 tidak melakukan:

- backfill histori procurement palsu
- rekonstruksi purchase order historis
- klaim bahwa stock legacy berasal dari procurement

Movement lama seperti:

- `LEGACY`
- `MANUAL_ADJUSTMENT`

tetap valid.

Movement procurement baru wajib:

- `origin = PURCHASE`

---

# 9. Anti-Patterns yang Dilarang

Berikut hal-hal yang tidak boleh dilakukan oleh domain Procurement:

- menyimpan current stock
- menaruh `unitCost` di `InventoryItem`
- menaruh `supplierId` di Inventory domain
- menambahkan accounting journal diam-diam
- menambahkan partial receive diam-diam
- membuat cancel flow mengubah inventory
- membuat receive flow mem-bypass movement inventory resmi
- menjadikan reporting sebagai tempat business rule procurement
- memperlakukan payable sebagai accounting ledger mini
- memperlakukan payment sebagai inventory mutation
- memperlakukan purchase return sebagai payment
- mengizinkan edit atau delete histori payment
- mengizinkan edit atau delete histori return reduction
- mengubah outstanding secara manual tanpa histori pendukung
- menambahkan fallback pembayaran atau return di UI

---

# 10. Testing Focus Domain

Testing domain Procurement harus fokus pada invariant.

Minimal yang wajib diuji:

## Supplier

- storeName wajib valid
- supplier inactive ditolak untuk order baru
- activate / deactivate valid

## PurchaseItem

- quantity harus positif
- unitCost harus non-negatif
- subtotal harus konsisten
- snapshot tidak boleh kosong

## PurchaseOrder

- minimal satu item
- duplicate variant ditolak
- transisi `CREATED → RECEIVED` valid
- transisi `CREATED → CANCELED` valid
- transisi `RECEIVED → CANCELED` ditolak
- metadata receive/cancel harus konsisten dengan status

## Supplier Payable (Step 7)

- payable tidak boleh negatif
- outstanding harus konsisten dengan histori

## Supplier Payment

- amount harus positif
- payment tidak boleh melebihi outstanding
- payment hanya untuk purchase order RECEIVED
- histori payment immutable

## Purchase Return Reduction

- return reduction tidak boleh melebihi batas yang sah
- return reduction tidak boleh membuat outstanding negatif
- return reduction bukan payment
- histori return reduction immutable

---

# 11. Hubungan dengan Step 6 - 7

Dokumen ini adalah source of truth domain untuk Procurement pada:

- Step 6 (procurement foundation)
- Step 7 (supplier payable operasional)

Aturan:

- Step 6 mendefinisikan lifecycle purchase order dan hubungan dengan inventory
- Step 7 memperluas domain dengan payable, payment, dan return reduction

Jika ada konflik:

- domain document menang atas implementation log
- ADR tetap menang jika ada keputusan arsitektural yang lebih tinggi
- log note tidak boleh menggantikan dokumen ini

---

# 12. Kesimpulan

Procurement Domain pada MVP Step 6–7 adalah domain supply-side yang sempit, eksplisit, dan terikat boundary.

Domain ini mencakup:

- histori pembelian
- lifecycle purchase order
- unit cost procurement
- payable operasional ke supplier
- histori payment dan return reduction

Domain ini tetap:

- bukan accounting system
- tidak mengelola journal atau ledger
- tidak melakukan rekalkulasi histori

Tujuan utamanya:

- memastikan histori pembelian punya rumah domain yang benar
- menjaga unit cost tidak bocor ke domain lain
- menjaga lifecycle purchase order tetap jelas
- menjaga inventory tetap menjadi source of truth quantity
- menyediakan mekanisme operasional untuk hutang supplier tanpa melanggar boundary sistem
