# Step 4.4 – Inventory Reconciliation Specification

**Status:** DESIGN LOCKED  
**Scope:** MVP Step 4 – Inventory Consistency Stabilization  
**Type:** Test-Level Integrity Specification  
**Non-Breaking:** Step 1, Step 2, Step 3  

---

## 1. Tujuan Dokumen

Dokumen ini mendefinisikan spesifikasi rekonsiliasi antara:

- Inventory Snapshot (InventoryItem)
- StockMovement (historical log)

Tujuan:
- Menjamin tidak ada mismatch matematis pada test
- Menjaga integritas write model
- Tidak mengubah arsitektur snapshot + movement

Dokumen ini tidak mengubah desain Inventory.
Dokumen ini hanya menambahkan pagar verifikasi.

---

## 2. Definisi Rekonsiliasi

Untuk setiap `variantId`:

```
ExpectedQuantity =
  SUM(quantity WHERE movementType == IN)
  - SUM(quantity WHERE movementType == OUT)
  + SUM(quantity WHERE movementType == ADJUST_IN)
  - SUM(quantity WHERE movementType == ADJUST_OUT)

```

Rekonsiliasi dianggap valid jika:

```
InventoryItem.quantity == ExpectedQuantity
```
ADJUST movement WAJIB memiliki arah eksplisit (ADJUST_IN atau ADJUST_OUT).
ADJUST movement harus secara eksplisit menyatakan arah (increase / decrease). 
Quantity selalu positif.
Rekonsiliasi tidak boleh menginfer sign dari quantity negatif.



---

## 3. Ruang Lingkup Rekonsiliasi

Rekonsiliasi dilakukan:

- Di integration test
- Atau melalui integrity checker internal (opsional)

Rekonsiliasi TIDAK dilakukan:

- Di reporting
- Di domain runtime production
- Sebagai auto-correction

Reporting tetap membaca snapshot apa adanya.

---

## 4. Toleransi Mismatch

Toleransi mismatch = 0

Jika mismatch ditemukan:

- Test HARUS FAIL
- Tidak boleh auto-fix
- Tidak boleh silent correction

Mismatch dianggap:
> Bug domain atau bug persistence

---

## 5. Aturan Movement

Agar rekonsiliasi deterministik:

1. Quantity movement selalu positif
2. Arah ditentukan oleh movementType
3. Movement bersifat immutable
4. Tidak ada update atau delete pada movement historis

Jika movement diubah:
- Itu pelanggaran desain Step 4

---

## 6. Hubungan dengan InventorySnapshotReport

InventorySnapshotReport:

- Tidak melakukan rekonstruksi
- Tidak melakukan validasi
- Tidak membandingkan dengan movement

Jika reporting melakukan hal tersebut:
- Reporting telah berubah menjadi domain validator
- Ini pelanggaran boundary Step 3

Rekonsiliasi hanya milik test dan stabilisasi internal.

---

## 7. Dampak terhadap Production Runtime

Integrity checker:

- Tidak wajib berjalan di production
- Tidak boleh mengubah data
- Tidak boleh memblokir transaksi runtime

Tujuan checker:
- Deteksi dini di test
- Audit manual jika diperlukan

---

## 8. Definition of Done – Step 4.4

Step 4.4 dianggap selesai jika:

1. Seluruh integration test lulus
2. Tidak ada mismatch snapshot vs movement
3. Tidak ada auto-repair logic
4. Reporting tetap read-only dan tidak merekonstruksi stok

---

## 9. Larangan Keras

- Tidak boleh menghitung ulang snapshot di runtime
- Tidak boleh mengganti snapshot berdasarkan movement
- Tidak boleh menjadikan movement sebagai satu-satunya sumber kebenaran (bukan event sourcing)

Desain yang dikunci tetap:
- Snapshot = state saat ini
- Movement = histori immutable
- Reconciliation = pagar verifikasi

---

## Penutup

Snapshot dan Movement adalah dua sisi sistem inventory.

Snapshot memberi kecepatan.
Movement memberi histori.

Rekonsiliasi memastikan keduanya tidak berbohong satu sama lain.

Jika suatu hari mismatch muncul,
itu alarm sistem,
bukan alasan untuk memperbaiki data secara diam-diam.

