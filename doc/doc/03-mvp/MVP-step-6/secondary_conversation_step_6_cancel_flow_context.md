# secondary_conversation_step_6_cancel_flow_context.md

Status: SECONDARY CONTEXT
Type: IMPLEMENTATION CONTEXT (NON-AUTHORITATIVE)

---

## Purpose

Dokumen ini berfungsi sebagai:

* konteks tambahan implementasi Step 6
* referensi keputusan praktis selama eksekusi
* penjelasan konflik penamaan batch

Dokumen ini **bukan source of truth**.

Jika terjadi konflik:

* dokumen PRIMARY selalu menang
* dokumen ini hanya membantu interpretasi implementasi

---

## Context Ringkas

Implementasi Step 6 dilakukan dengan constraint:

* sistem adalah modular monolith
* domain boundary harus dijaga ketat
* procurement tidak boleh mengakses inventory secara langsung
* inventory tetap source of truth quantity

---

## Konflik Penamaan Batch

Terjadi inkonsistensi antara:

### Global Plan

* Batch 1 → Foundation
* Batch 2 → Create PO
* Batch 3 → Receive PO
* Batch 4 → Cancel PO

### Dokumen Implementasi Aktif

* Receive flow disebut sebagai **Batch 2**

---

## Klarifikasi yang Digunakan

Untuk implementasi:

* mengikuti dokumen PRIMARY yang aktif
* sehingga:

| Logical Order | Naming Aktif |
| ------------- | ------------ |
| Foundation    | Batch 1      |
| Receive       | Batch 2      |
| Cancel        | Batch 3      |

Catatan:

* ini bukan perubahan desain
* hanya penyelarasan implementasi
* histori dokumen tidak diubah

---

## Kontrak Receive Flow (yang sudah selesai)

* Inventory dieksekusi terlebih dahulu
* Flow bersifat non-atomic
* Tidak ada rollback jika save PO gagal
* Tidak ada idempotency
* Retry dapat menghasilkan duplicate stock movement
* Origin movement = PURCHASE

---

## Boundary yang Harus Dijaga

### Procurement

* tidak boleh akses InventoryRepository
* tidak boleh tulis tabel inventory
* hanya boleh melalui port

### Inventory

* source of truth quantity
* mengelola stock movement

### Application Layer

* orchestration use case
* bukan tempat business rule inti

---

## Kontrak Cancel Flow (yang akan diimplementasikan)

* hanya PO dengan status CREATED yang boleh di-cancel
* PO dengan status RECEIVED tidak boleh di-cancel
* cancel tidak boleh menyentuh inventory
* cancel tidak boleh membuat stock movement
* cancel hanya mengubah state PO

---

## Scope yang Dilarang

* partial receive
* multi receive
* payable
* accounting
* costing lanjutan
* return pembelian
* perubahan domain sales

---

## Testing Expectation

* application test untuk rule dan orchestration
* integration test untuk persistence
* architecture test untuk boundary enforcement

---

## Prinsip Implementasi

* tidak membuat desain baru
* tidak melanggar boundary
* tidak memindahkan business rule ke infrastructure
* mengikuti dokumen PRIMARY sebagai kontrak

---

## Conclusion

Dokumen ini:

* membantu menjaga konsistensi implementasi
* menjelaskan keputusan yang tidak tertulis eksplisit di dokumen utama
* tidak menggantikan design authority

Segala keputusan final tetap mengacu pada dokumen PRIMARY.
