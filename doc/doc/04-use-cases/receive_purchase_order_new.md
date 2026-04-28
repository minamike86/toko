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
- memvalidasi bahwa seluruh item dapat dinormalisasi ke canonical unit
- melakukan normalisasi quantity ke canonical unit melalui application layer
- memanggil boundary inventory resmi untuk receive procurement
- mengubah state `PurchaseOrder` menjadi `RECEIVED`
- menyimpan metadata receive

Use case ini **tidak**:

- melakukan partial receive
- melakukan multi receive
- melakukan rollback lintas domain
- menjamin idempotency request
- menyimpan costing di Inventory
- mendefinisikan conversion rule
- melakukan conversion di UI atau reporting

---

## Posisi dalam Sistem

Use case ini berada di Application Layer Procurement.

Use case ini adalah entry point resmi untuk receive procurement.

Jika terjadi konflik:

- `procurement_domain.md` menang untuk invariant domain
- `catalog_domain.md` menang untuk ownership unit dan conversion rule
- `inventory_domain.md` menang untuk invariant quantity
- dokumen use case ini menang untuk flow orchestration dan error contract application

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

Catatan:

- `items[].quantity` pada output tetap merepresentasikan snapshot transaksi procurement
- output ini tidak mengubah histori unit transaksi
- canonical quantity bukan pengganti snapshot histori procurement

---

## Preconditions

Sebelum eksekusi, kondisi berikut harus benar:

- actor valid
- role actor diizinkan
- `PurchaseOrder` ada
- `PurchaseOrder.status = CREATED`
- seluruh item masih melekat pada aggregate order yang valid
- seluruh item memiliki `variantId` valid
- seluruh item memiliki `unitSnapshot` valid
- seluruh item memiliki quantity transaksi yang valid
- seluruh item dapat dinormalisasi ke canonical unit

Jika salah satu item gagal dinormalisasi:

→ seluruh use case harus gagal  
→ inventory boundary tidak boleh dipanggil

---

## Dependency Boundary

Use case ini secara resmi bergantung pada:

- `PurchaseOrderRepository`
- `InventoryProcurementPort` atau boundary resmi setara
- read dependency resmi Catalog untuk kebutuhan normalisasi unit
- authorization guard application layer

Use case ini tidak boleh:

- mengimpor repository implementation Inventory secara langsung
- mengakses Prisma langsung
- menulis tabel inventory langsung
- mendefinisikan rule conversion sendiri

---

## Kontrak Normalisasi Unit

Normalisasi quantity pada use case ini bersifat **wajib**.

Aturan:

1. Setiap item `PurchaseOrder` dibaca sebagai snapshot transaksi:
   - `variantId`
   - `unitSnapshot`
   - `quantity`

2. Untuk setiap item, sistem wajib:
   - mengambil canonical unit resmi dari Catalog
   - memvalidasi bahwa `unitSnapshot` dapat dikonversi ke canonical
   - menghitung canonical quantity

3. Conversion rule:
   - didefinisikan oleh Catalog
   - dieksekusi di application layer
   - tidak boleh dilakukan di UI
   - tidak boleh dilakukan di Inventory domain
   - tidak boleh menggunakan fallback
   - tidak boleh menggunakan chaining implisit
   - tidak boleh menebak unit

4. Jika conversion rule tidak ditemukan atau hasil normalisasi tidak valid:

→ use case wajib gagal sebelum memanggil Inventory boundary

---

## Main Flow

1. Validasi actor dan role.
2. Ambil `PurchaseOrder` berdasarkan `purchaseOrderId`.
3. Jika order tidak ditemukan, eksekusi gagal.
4. Validasi order masih bisa di-receive.
5. Untuk setiap item order:
   - baca `variantId`
   - baca `unitSnapshot`
   - baca `quantity`
   - ambil canonical unit resmi dari Catalog
   - validasi bahwa unit transaksi dapat dikonversi ke canonical
   - hitung canonical quantity
6. Bentuk request inventory dari seluruh item order menggunakan **canonical quantity**.
7. Panggil boundary resmi inventory untuk receive procurement.
8. Setelah inventory sukses, mutasi domain:
   - `status = RECEIVED`
   - isi `receivedAt`
   - isi `receivedBy`
9. Simpan perubahan `PurchaseOrder` ke repository.
10. Kembalikan DTO hasil receive.

---

## Urutan Kritis yang Mengikat

Urutan berikut **tidak boleh diubah**:

1. validasi actor
2. load order
3. validasi state order
4. normalisasi seluruh item ke canonical quantity
5. panggil inventory boundary
6. ubah state order menjadi `RECEIVED`
7. persist Procurement

Konsekuensinya:

- conversion harus selesai **sebelum** inventory dipanggil
- inventory tidak boleh menerima raw quantity procurement
- procurement tidak boleh ditandai `RECEIVED` sebelum inventory boundary sukses

---

## Postconditions

Jika sukses:

- stok inventory bertambah melalui boundary resmi
- stock movement tercatat dengan kontrak procurement
- quantity yang dipakai untuk inventory adalah canonical quantity
- status order menjadi `RECEIVED`
- `receivedAt` terisi
- `receivedBy = actor.actorId`
- order tidak lagi boleh di-receive ulang
- order tidak lagi boleh di-cancel
- snapshot histori procurement tetap utuh
- `unitSnapshot` tidak diubah
- quantity transaksi procurement tidak diubah secara historis

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
- procurement snapshot tetap historis
- inventory mutation hanya menggunakan canonical quantity
- tidak ada fallback conversion
- tidak ada partial normalization
- kegagalan satu item menggagalkan seluruh receive flow

---

## Error Contract

Error pada use case ini harus bermakna bisnis atau application-level yang eksplisit.

Minimal error yang wajib ada:

### 1. Actor tidak valid atau role tidak diizinkan

Contoh kategori:

- `FORBIDDEN`
- `ACTOR_INVALID`

Hasil:

- request ditolak
- inventory boundary tidak dipanggil
- order tidak berubah

---

### 2. PurchaseOrder tidak ditemukan

Contoh kategori:

- `PURCHASE_ORDER_NOT_FOUND`

Hasil:

- request ditolak
- inventory boundary tidak dipanggil

---

### 3. PurchaseOrder sudah `RECEIVED`

Contoh kategori:

- `PURCHASE_ORDER_ALREADY_RECEIVED`

Hasil:

- request ditolak
- inventory boundary tidak dipanggil

---

### 4. PurchaseOrder sudah `CANCELED`

Contoh kategori:

- `PURCHASE_ORDER_ALREADY_CANCELED`

Hasil:

- request ditolak
- inventory boundary tidak dipanggil

---

### 5. Unit transaksi tidak valid

Contoh kategori:

- `INVALID_INPUT_UNIT`

Hasil:

- request ditolak
- inventory boundary tidak dipanggil
- order tidak berubah

---

### 6. Conversion rule tidak ditemukan

Contoh kategori:

- `CONVERSION_RULE_NOT_FOUND`

Hasil:

- request ditolak
- inventory boundary tidak dipanggil
- order tidak berubah
- tidak boleh ada fallback unit

---

### 7. Hasil normalisasi canonical tidak valid

Contoh kategori:

- `NON_CANONICAL_QUANTITY`
- `NORMALIZED_QUANTITY_INVALID`

Hasil:

- request ditolak
- inventory boundary tidak dipanggil
- order tidak berubah

---

### 8. Inventory boundary gagal

Hasil:

- order tidak disimpan sebagai `RECEIVED`
- metadata receive tidak dipersist
- stok mengikuti hasil boundary inventory

Catatan:

- use case ini tidak menjamin rollback lintas domain

---

### 9. Inventory sukses tetapi save Procurement gagal

Hasil:

- stok tetap bertambah
- order dapat tetap `CREATED`
- tidak ada rollback lintas domain
- kondisi ini valid menurut kontrak Step 6

---

## Failure Handling Rule

Aturan wajib:

- semua error normalisasi unit harus terjadi **sebelum** inventory boundary dipanggil
- jika inventory boundary belum dipanggil, tidak boleh ada side effect stok
- jika inventory boundary sudah sukses tetapi persistence Procurement gagal, kondisi non-atomic diterima sebagai trade-off MVP

---

## Non-Atomic Receive Contract

Kontrak receive procurement pada Step 6 bersifat **non-atomic lintas domain**.

Urutan resmi:

1. seluruh item dinormalisasi ke canonical quantity
2. inventory receive dieksekusi lebih dulu
3. setelah itu baru `PurchaseOrder` ditandai `RECEIVED` dan disimpan

Jika:

- normalisasi sukses
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

## Boundary Rules

Use case ini:

- wajib memakai `InventoryProcurementPort` atau boundary resmi yang setara
- wajib memakai read dependency Catalog resmi untuk canonical unit dan conversion rule
- tidak boleh mengimpor repository implementation Inventory secara langsung
- tidak boleh menulis tabel inventory langsung
- tidak boleh membuat stock movement secara manual dari Procurement
- tidak boleh mengubah Sales
- tidak boleh menaruh unit cost ke Inventory
- tidak boleh memindahkan conversion logic ke UI atau reporting

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
- perubahan snapshot histori procurement
- conversion di UI
- fallback conversion

---

## Contract Inventory Integration

Boundary Inventory yang dipanggil oleh use case ini harus menjaga kontrak berikut:

- quantity bertambah
- quantity yang diterima boundary Inventory sudah canonical
- movement dicatat sebagai procurement receive
- `origin = PURCHASE`
- `referenceId = purchaseOrderId`
- Inventory tidak menerima supplier atau unit cost sebagai bagian dari model quantity
- Inventory tidak dipaksa memahami unit transaksi procurement

---

## Testing Focus

Application test minimal:

- receive sukses saat actor valid dan order masih `CREATED`
- reject jika order tidak ditemukan
- reject jika order sudah `RECEIVED`
- reject jika order sudah `CANCELED`
- reject jika conversion rule tidak ditemukan
- reject jika unit input tidak valid
- memastikan normalisasi terjadi sebelum inventory boundary dipanggil
- memastikan inventory boundary dipanggil sekali untuk seluruh flow
- memastikan inventory menerima canonical quantity
- memastikan order tidak disimpan jika inventory boundary gagal
- memastikan skenario non-atomic tercermin dalam test
- memastikan tidak ada fallback behavior

Integration test minimal:

- create PO lalu receive PO mempersist status `RECEIVED`
- metadata receive tersimpan benar
- stock bertambah melalui integration inventory
- movement procurement tercatat sesuai kontrak
- receive PO dengan unit non-canonical tetapi conversion valid menghasilkan stok canonical
- receive PO dengan conversion rule missing ditolak tanpa side effect inventory
- skenario inventory sukses tetapi save order gagal tercermin sebagai non-atomic behavior

Architecture test minimal:

- Procurement tidak import inventory infrastructure repository langsung
- Procurement receive wajib bergantung pada port / boundary resmi
- conversion tidak dilakukan di delivery layer
- reporting tidak menjadi tempat conversion logic

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
- historical rewrite
- fallback unit resolution
- UI-side conversion

---

## Kesimpulan

`ReceivePurchaseOrder` adalah entry point resmi untuk mengubah niat pembelian menjadi stok masuk resmi melalui boundary Inventory.

Use case ini sengaja sempit, non-atomic, dan tegas terhadap aturan berikut:

- Procurement menjaga histori transaksi
- Catalog memiliki authority atas unit dan conversion rule
- Application layer melakukan normalisasi
- Inventory hanya menerima canonical quantity
- tidak ada fallback
