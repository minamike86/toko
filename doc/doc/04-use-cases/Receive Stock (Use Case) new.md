# RECEIVE PURCHASE ORDER

## Status

CANONICAL USE CASE DOCUMENT (UPDATED FOR STEP 6.5)

---

## Tujuan

Use case ini menerima PurchaseOrder dan menambah stok melalui Inventory dengan quantity yang sudah dinormalisasi ke canonical unit.

---

## Prinsip Utama

* Procurement tidak melakukan conversion rule
* Conversion rule berasal dari Catalog
* Conversion dieksekusi di application layer
* Inventory hanya menerima canonical quantity
* Tidak ada fallback

---

## Main Flow (FINAL)

1. Validasi actor dan role
2. Load PurchaseOrder
3. Validasi status = CREATED
4. Untuk setiap item:

   * ambil variantId
   * ambil unitSnapshot
   * ambil quantity
   * ambil canonical unit dari Catalog
   * validasi conversion tersedia
   * hitung canonical quantity
5. Jika ada item gagal → FAIL seluruh flow
6. Build request inventory dengan canonical quantity
7. Call Inventory boundary
8. Jika sukses:

   * set status = RECEIVED
   * set receivedAt
   * set receivedBy
9. Persist PurchaseOrder
10. Return result

---

## Urutan Wajib

Urutan berikut tidak boleh diubah:

1. validation
2. normalization
3. inventory call
4. state change
5. persist

---

## Error Contract

Error wajib:

* PURCHASE_ORDER_NOT_FOUND
* PURCHASE_ORDER_ALREADY_RECEIVED
* PURCHASE_ORDER_ALREADY_CANCELED
* INVALID_INPUT_UNIT
* CONVERSION_RULE_NOT_FOUND
* NON_CANONICAL_QUANTITY

Rule:

* Semua error conversion terjadi sebelum inventory call
* Tidak boleh ada fallback

---

## Invariant

* Semua item harus berhasil dinormalisasi
* Inventory hanya menerima canonical quantity
* Snapshot procurement tidak berubah
* Tidak ada partial success

---

## Non-Atomic Contract

Flow tetap non-atomic:

* inventory sukses + save gagal → stok tetap bertambah
* tidak ada rollback

---

## Side Effects

Valid:

* stok bertambah via inventory
* movement tercatat
* order berubah ke RECEIVED

Invalid:

* partial receive
* fallback conversion
* UI conversion

---

# RECEIVE STOCK

## Status

DESIGN FINAL – STEP 6.5

---

## Tujuan

Menambah stok secara sah menggunakan canonical quantity.

---

## Prinsip Utama

* Inventory tidak melakukan conversion
* Inventory tidak tahu unit lain
* Inventory hanya menerima canonical quantity

---

## Input Contract

```
variantId: string
quantity: number (canonical)
reason: string
referenceId?: string
```

---

## Main Flow

1. Validasi input
2. Validasi quantity > 0
3. Validasi canonical contract
4. Load InventoryItem
5. increase()
6. create StockMovement (IN)
7. save movement

---

## Error Contract

* INVENTORY_NOT_FOUND
* INVALID_QUANTITY
* NON_CANONICAL_QUANTITY

Rule:

* tidak ada conversion
* tidak ada fallback

---

## Invariant

* quantity > 0
* movement wajib tercatat
* snapshot & movement harus konsisten
* canonical-only enforcement

---

## Boundary Rules

* tidak boleh call Catalog
* tidak boleh conversion
* tidak boleh baca unitSnapshot

---

## Dampak Sistem

Inventory:

* tetap source of truth quantity

Procurement:

* wajib normalisasi sebelum call

Catalog:

* owner conversion rule

Reporting:

* read-only, tidak boleh conversion

---

## Kesimpulan

Flow receive sekarang memiliki kontrak eksplisit:

* conversion selesai di application layer
* inventory hanya canonical
* tidak ada fallback
* tidak ada ambiguity

Dokumen ini bersifat DESIGN LOCKED untuk Step 6.5.
