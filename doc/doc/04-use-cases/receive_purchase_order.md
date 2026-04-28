# Receive Purchase Order

### Status  
CANONICAL USE CASE DOCUMENT

---

## Tujuan

Use case ini digunakan untuk menerima barang dari `PurchaseOrder` yang masih berstatus `CREATED` dan menambah stok resmi melalui boundary Inventory.

Use case ini bertanggung jawab untuk:

- memvalidasi actor dan role
- memuat `PurchaseOrder`
- memvalidasi state order
- memanggil boundary inventory resmi untuk receive procurement
- mengubah state `PurchaseOrder` menjadi `RECEIVED`
- menyimpan metadata receive

Use case ini **tidak**:

- melakukan partial receive
- melakukan multi receive
- melakukan rollback lintas domain
- menjamin idempotency request
- menyimpan costing di Inventory

---

## Posisi dalam Sistem

Use case ini berada di Application Layer Procurement.

Use case ini adalah entry point resmi untuk receive procurement.

Jika terjadi konflik:
- `procurement_domain.md` menang untuk invariant domain
- dokumen Step 6 receive flow menang untuk kontrak integration dan boundary

---

## Aktor yang Diizinkan

Allowed roles:

- `ADMIN`
- `WAREHOUSE`

Role berikut tidak diizinkan:

- `SALES`

Authorization wajib dilakukan di application layer sebelum side effect dijalankan.

---

## Input

Input minimal:

- `purchaseOrderId: string`
- `receivedAt?: Date`
- `actor`
  - `actorId: string`
  - `role: UserRole`

Jika `receivedAt` tidak diberikan, use case boleh menggunakan waktu eksekusi saat ini.

---

## Output

Output minimal:

- `id`
- `supplierId`
- `status`
- `receivedAt`
- `receivedBy`
- `totalQuantity`
- `totalCost`
- `items[]`

Status output wajib:

- `RECEIVED`

---

## Preconditions

Sebelum eksekusi, kondisi berikut harus benar:

- actor valid
- role actor diizinkan
- `PurchaseOrder` ada
- `PurchaseOrder.status = CREATED`
- seluruh item masih melekat pada aggregate order yang valid

---

## Main Flow

1. Validasi actor dan role.
2. Ambil `PurchaseOrder` berdasarkan `purchaseOrderId`.
3. Jika order tidak ditemukan, eksekusi gagal.
4. Validasi order masih bisa di-receive.
5. Bentuk request inventory dari seluruh item order.
6. Panggil boundary resmi inventory untuk receive procurement.
7. Setelah inventory sukses, mutasi domain:
   - `status = RECEIVED`
   - isi `receivedAt`
   - isi `receivedBy`
8. Simpan perubahan `PurchaseOrder` ke repository.
9. Kembalikan DTO hasil receive.

---

## Postconditions

Jika sukses:

- stok inventory bertambah melalui boundary resmi
- stock movement tercatat dengan kontrak procurement
- status order menjadi `RECEIVED`
- `receivedAt` terisi
- `receivedBy = actor.actorId`
- order tidak lagi boleh di-receive ulang
- order tidak lagi boleh di-cancel

---

## Invariant yang Harus Dijaga

Use case ini wajib menjaga invariant berikut:

- hanya `CREATED` yang boleh di-receive
- order `RECEIVED` tidak boleh di-receive lagi
- order `CANCELED` tidak boleh di-receive
- receive harus mengisi `receivedAt` dan `receivedBy`
- order `RECEIVED` tidak boleh memiliki metadata cancel
- Inventory tetap source of truth quantity
- Procurement tidak menulis inventory langsung

---

## Non-Atomic Receive Contract

Kontrak receive procurement pada Step 6 bersifat **non-atomic lintas domain**.

Urutan resmi:

1. Inventory receive dieksekusi lebih dulu.
2. Setelah itu baru `PurchaseOrder` ditandai `RECEIVED` dan disimpan.

Jika:
- inventory berhasil
- tetapi persistence Procurement gagal

maka:
- stok tetap bertambah
- `PurchaseOrder` dapat tetap berstatus `CREATED`
- tidak ada rollback lintas domain

Kontrak ini adalah **accepted MVP behavior**, bukan bug.

---

## Idempotency Limitation

Use case ini **tidak mengasumsikan idempotency**.

Konsekuensi:
- retry request dapat menyebabkan duplicate stock movement
- proteksi utama hanya berasal dari status `PurchaseOrder`
- jika inventory sukses tetapi save order gagal, request ulang dapat menghasilkan efek ganda pada inventory

Idempotency formal ditunda ke tahap berikutnya.

---

## Failure Cases

### 1. Actor tidak valid atau role tidak diizinkan

Hasil:
- request ditolak
- inventory boundary tidak dipanggil
- order tidak berubah

### 2. PurchaseOrder tidak ditemukan

Hasil:
- request ditolak
- inventory boundary tidak dipanggil

### 3. PurchaseOrder sudah `RECEIVED`

Hasil:
- request ditolak
- inventory boundary tidak dipanggil

### 4. PurchaseOrder sudah `CANCELED`

Hasil:
- request ditolak
- inventory boundary tidak dipanggil

### 5. Inventory boundary gagal

Hasil:
- order tidak disimpan sebagai `RECEIVED`
- metadata receive tidak dipersist
- stok mengikuti hasil boundary inventory

### 6. Inventory sukses tetapi save Procurement gagal

Hasil:
- stok tetap bertambah
- order dapat tetap `CREATED`
- tidak ada rollback lintas domain
- kondisi ini valid menurut kontrak Step 6

---

## Boundary Rules

Use case ini:

- wajib memakai `InventoryProcurementPort` atau boundary resmi yang setara
- tidak boleh mengimpor repository implementation Inventory secara langsung
- tidak boleh menulis tabel inventory langsung
- tidak boleh membuat stock movement secara manual dari Procurement
- tidak boleh mengubah Sales
- tidak boleh menaruh unit cost ke Inventory

---

## Side Effects

Side effect yang sah:

- penambahan stok melalui Inventory boundary
- stock movement procurement tercatat lewat Inventory boundary
- perubahan state order menjadi `RECEIVED`

Side effect yang dilarang:

- partial receive
- receive tanpa movement resmi
- rollback lintas domain
- perubahan ke Sales
- perubahan ke accounting / payable

---

## Contract Inventory Integration

Boundary Inventory yang dipanggil oleh use case ini harus menjaga kontrak berikut:

- quantity bertambah
- movement dicatat sebagai procurement receive
- `origin = PURCHASE`
- `referenceId = purchaseOrderId`
- Inventory tidak menerima supplier atau unit cost sebagai bagian dari model quantity

---

## Testing Focus

Application test minimal:

- receive sukses saat actor valid dan order masih `CREATED`
- reject jika order tidak ditemukan
- reject jika order sudah `RECEIVED`
- reject jika order sudah `CANCELED`
- memastikan inventory boundary dipanggil sekali untuk seluruh flow
- memastikan order tidak disimpan jika inventory boundary gagal
- memastikan skenario non-atomic tercermin dalam test

Integration test minimal:

- create PO lalu receive PO mempersist status `RECEIVED`
- metadata receive tersimpan benar
- stock bertambah melalui integration inventory
- movement procurement tercatat sesuai kontrak
- skenario inventory sukses tetapi save order gagal tercermin sebagai non-atomic behavior

Architecture test minimal:

- Procurement tidak import inventory infrastructure repository langsung
- Procurement receive wajib bergantung pada port / boundary resmi

---

## Out of Scope

Use case ini tidak mencakup:

- partial receive
- multi receive
- cancel setelah receive
- payable supplier
- purchase payment
- purchase return
- accounting journal
- moving average / FIFO / COGS

---

## Kesimpulan

`ReceivePurchaseOrder` adalah entry point resmi untuk mengubah niat pembelian menjadi stok masuk resmi melalui boundary Inventory.

Use case ini sengaja sempit, non-atomic, dan jujur terhadap keterbatasan MVP Step 6.

