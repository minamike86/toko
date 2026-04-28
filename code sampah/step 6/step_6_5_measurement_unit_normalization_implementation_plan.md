# Step 6.5 — Measurement & Unit Normalization

## Status

DESIGN LOCKED (POST ADR)

---

## 1. Context

Step 4 telah mengunci variant sebagai identity operasional.

Step 6 telah mengunci procurement dan receive flow.

Namun:

- belum ada standar unit internal
- belum ada conversion rule resmi
- receive flow masih raw quantity

Step 6.5 memperkenalkan normalisasi unit tanpa merusak invariant existing.

---

## 2. Goal

- Menetapkan canonical unit per ProductVariant
- Menetapkan conversion rule eksplisit
- Menjamin semua quantity inventory dalam canonical unit
- Menolak semua ambiguity unit

---

## 3. Locked Decisions

- Canonical unit dimiliki Catalog
- Quantity dimiliki Inventory
- Snapshot dimiliki Procurement
- Conversion dilakukan di application layer
- Inventory canonical-only

---

## 4. Scope Implementasi

### 4.1 Catalog

- Menyimpan canonical unit
- Menyimpan conversion rule
- Menjadi source of truth unit

---

### 4.2 Procurement

- Tetap menyimpan unitSnapshot
- Tidak melakukan conversion
- Meminta normalisasi sebelum inventory call

---

### 4.3 Inventory

- Hanya menerima canonical quantity
- Tidak mengetahui unit lain

---

### 4.4 Application Layer

- Melakukan conversion sebelum mutation inventory
- Menolak request jika conversion tidak tersedia

---

## 5. Use Case Impact

### ReceivePurchaseOrder

Tambahan wajib:

- validasi unit input
- conversion ke canonical
- reject jika conversion gagal
- baru panggil inventory

---

### ReceiveStock

Tambahan wajib:

- hanya menerima canonical quantity
- reject jika non-canonical

---

## 6. Error Contract

Error wajib:

- CONVERSION_RULE_NOT_FOUND
- INVALID_INPUT_UNIT
- NON_CANONICAL_QUANTITY

Aturan:

- error harus muncul sebelum inventory mutation
- tidak boleh fallback
- tidak boleh silent conversion

---

## 7. Non-Goals

Step ini tidak mencakup:

- costing logic
- accounting
- reporting logic baru
- UI conversion
- multi-step conversion
- fallback unit
- perubahan histori

---

## 8. Testing Impact

### Domain Test

- invariant canonical unit
- invariant conversion rule ownership

---

### Application Test

- conversion dilakukan sebelum inventory call
- reject jika conversion tidak ada
- tidak ada fallback

---

### Integration Test

- receive PO dengan unit non-canonical
- verify inventory bertambah dalam canonical
- verify reject scenario

---

### Reporting Test

- tidak berubah
- tidak menambah logic conversion

---

## 9. Enforcement

- Conversion hanya boleh terjadi di application layer
- Inventory tidak boleh menerima non-canonical input
- Reporting tidak boleh melakukan conversion

---

## 10. Rollout Strategy

1. Implement conversion rule di Catalog
2. Update application layer receive flow
3. Enforce validation
4. Tambah test
5. Deploy tanpa mengubah histori lama

---

## 11. Risiko

- Salah implementasi conversion di layer yang salah
- fallback logic muncul diam-diam
- mismatch unit antar domain

Mitigasi:

- strict validation
- test enforcement
- architecture boundary test

---

## 12. Kesimpulan

Step 6.5 adalah hardening layer untuk quantity system.

Tujuan utamanya bukan fleksibilitas,
tetapi determinisme dan konsistensi sistem.
