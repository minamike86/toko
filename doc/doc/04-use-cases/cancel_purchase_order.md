# Cancel Purchase Order

### Status  
CANONICAL USE CASE DOCUMENT

---

## Tujuan

Use case ini digunakan untuk membatalkan `PurchaseOrder` yang masih berstatus `CREATED`.

Use case ini bertanggung jawab untuk:

- memvalidasi actor dan role
- memuat `PurchaseOrder`
- memvalidasi state order
- mengubah state order menjadi `CANCELED`
- menyimpan metadata cancel

Use case ini **tidak**:

- mengurangi stok
- membuat stock movement
- memanggil inventory boundary
- melakukan rollback terhadap receive yang sudah terjadi

---

## Posisi dalam Sistem

Use case ini berada di Application Layer Procurement.

Use case ini adalah entry point resmi untuk cancel procurement sebelum receive terjadi.

Jika terjadi konflik:
- `procurement_domain.md` menang untuk invariant domain
- dokumen clarifikasi cancel flow menang untuk constraint implementasi Step 6

---

## Aktor yang Diizinkan

Allowed roles:

- `ADMIN`

Role berikut tidak diizinkan:

- `SALES`
- `WAREHOUSE`

Authorization wajib dilakukan di application layer sebelum mutasi dijalankan.

---

## Input

Input minimal:

- `purchaseOrderId: string`
- `actor`
  - `actorId: string`
  - `role: UserRole`

---

## Output

Output minimal:

- `purchaseOrderId`
- `status`
- `canceledAt`
- `canceledBy`

Status output wajib:

- `CANCELED`

---

## Preconditions

Sebelum eksekusi, kondisi berikut harus benar:

- actor valid
- role actor diizinkan
- `PurchaseOrder` ada
- `PurchaseOrder.status = CREATED`

---

## Main Flow

1. Validasi actor dan role.
2. Ambil `PurchaseOrder` berdasarkan `purchaseOrderId`.
3. Jika order tidak ditemukan, eksekusi gagal.
4. Validasi order masih bisa di-cancel.
5. Mutasi domain:
   - `status = CANCELED`
   - isi `canceledAt`
   - isi `canceledBy`
6. Simpan perubahan `PurchaseOrder` ke repository.
7. Kembalikan hasil cancel.

---

## Postconditions

Jika sukses:

- status order menjadi `CANCELED`
- `canceledAt` terisi
- `canceledBy = actor.actorId`
- order tidak bisa di-receive lagi
- inventory tidak berubah
- stock movement tidak bertambah

---

## Invariant yang Harus Dijaga

Use case ini wajib menjaga invariant berikut:

- hanya `CREATED` yang boleh di-cancel
- order `RECEIVED` tidak boleh di-cancel
- order `CANCELED` tidak boleh di-cancel ulang
- order `CANCELED` wajib memiliki `canceledAt` dan `canceledBy`
- order `CANCELED` tidak boleh memiliki metadata receive
- cancel tidak boleh menyentuh inventory
- cancel tidak boleh membuat stock movement

---

## Failure Cases

### 1. Actor tidak valid atau role tidak diizinkan

Hasil:
- request ditolak
- repository procurement tidak dipanggil

### 2. PurchaseOrder tidak ditemukan

Hasil:
- request ditolak
- order tidak berubah

### 3. PurchaseOrder sudah `RECEIVED`

Hasil:
- request ditolak
- order tidak berubah
- inventory tetap tidak disentuh

### 4. PurchaseOrder sudah `CANCELED`

Hasil:
- request ditolak
- order tidak berubah

---

## Boundary Rules

Use case ini:

- boleh memuat dan menyimpan `PurchaseOrder`
- tidak boleh mengimpor repository implementation Inventory
- tidak boleh memanggil `InventoryProcurementPort`
- tidak boleh membuat stock movement
- tidak boleh mengubah Sales
- tidak boleh menambah rollback receive

---

## Side Effects

Side effect yang sah:

- perubahan state order menjadi `CANCELED`
- persistence metadata cancel

Side effect yang dilarang:

- perubahan quantity inventory
- pembuatan movement inventory
- rollback receive
- perubahan reporting write-side
- perubahan ke accounting / payable

---

## Relation dengan Receive Flow

Cancel flow bukan reversal dari receive flow.

Konsekuensi:
- jika order sudah `RECEIVED`, maka cancel tidak lagi valid
- Step 6 tidak menyediakan undo terhadap stok masuk procurement
- tidak ada reconciliation otomatis antara cancel dan inventory

---

## Testing Focus

Application test minimal:

- cancel sukses saat order masih `CREATED`
- reject jika order tidak ditemukan
- reject jika actor bukan `ADMIN`
- reject jika order sudah `RECEIVED`
- reject jika order sudah `CANCELED`
- memastikan inventory boundary tidak pernah dipanggil

Integration test minimal:

- status benar-benar berubah ke `CANCELED`
- `canceledAt` dan `canceledBy` tersimpan benar
- inventory tidak berubah
- tidak ada stock movement baru

Architecture test minimal:

- cancel flow tidak import inventory port
- Procurement tidak import inventory repository
- tidak ada dependency ke Sales mutation use case

---

## Out of Scope

Use case ini tidak mencakup:

- partial cancel
- cancel setelah receive
- rollback stock receive
- return pembelian
- payable supplier
- purchase payment
- accounting journal

---

## Kesimpulan

`CancelPurchaseOrder` adalah entry point resmi untuk membatalkan purchase order sebelum barang diterima.

Use case ini adalah kontrol state procurement, bukan reversal transaksi inventory.

