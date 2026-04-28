# Step 4 – Transitional Compatibility with Step 3 Reporting

**Status:** DESIGN LOCK – Transitional Contract  
**Applies To:** MVP Step 4.2 (Payment Settlement Formalization)  
**Related:** Credit Outstanding Report (Step 3), Credit Payment History Report (Step 3)

---

## 1. Purpose

Dokumen ini menetapkan aturan kompatibilitas antara:

- **MVP Step 3 – Reporting (Design Locked)**
- **MVP Step 4.2 – Payment Settlement Formalization (Hybrid Transitional Model)**

Tujuannya adalah memastikan bahwa:

1. Reporting Step 3 tetap valid dan deterministik.
2. Partial payment pada Step 4 tidak merusak kontrak reporting yang telah dikunci.
3. Evolusi domain terdokumentasi secara eksplisit tanpa menulis ulang sejarah desain.

Dokumen ini bersifat transisional dan akan direvisi atau ditandai obsolete setelah Step 4 selesai sepenuhnya.

---

## 2. Baseline – Step 3 Assumptions (Locked Reality)

Pada Step 3, sistem mengasumsikan:

- Order memiliki status `ON_CREDIT` atau `PAID`.
- Tidak ada partial payment bertahap.
- Outstanding direpresentasikan sebagai field pada Order.
- Credit Payment History mencatat pelunasan final (ON_CREDIT → PAID).

Dokumen Step 3 tidak diubah dan tetap berlaku sebagai referensi historis.

---

## 3. Step 4 Hybrid Model

Pada Step 4.2:

- Payment entity menjadi source of fact.
- Partial payment diperbolehkan.
- Outstanding diperlakukan sebagai **derived cache** dari histori Payment.
- outstandingAmount adalah **derived cache** yang direcompute di write-model dan dianggap authoritative oleh reporting selama fase hybrid.
- Status `PAID` terjadi ketika outstanding menjadi 0.

Hybrid state berarti:

- Outstanding masih disimpan sebagai field fisik.
- Nilainya direcompute dari histori Payment.
- Settlement sudah berbasis Payment + transaction + optimistic locking.

---

## 4. Compatibility Rules – Credit Outstanding Report

Selama fase hybrid:

1. Order tetap masuk Credit Outstanding Report jika:
   - `order.status == ON_CREDIT`, dan
   - `outstandingAmount > 0`.

2. `outstandingAmount` dianggap sebagai derived cache yang sah.

3. Partial payment hanya mengurangi outstanding, tidak mengubah definisi laporan.

4. Reporting tetap membaca field `outstandingAmount`.

5. Reporting tidak menghitung ulang `sum(payments)`.

Dengan demikian, Credit Outstanding tetap konsisten dengan kontrak Step 3.

---

## 5. Compatibility Rules – Credit Payment History Report

Selama fase hybrid:

1. Credit Payment History hanya mencatat event ketika order menjadi `PAID`.
2. Partial payment intermediate tidak muncul dalam laporan.
3. Status `PAID` terjadi hanya ketika outstanding menjadi 0.
4. Tidak ada perubahan struktur laporan Step 3.

Reporting tetap bersifat observasional dan tidak mengetahui detail internal Payment entity.

---

## 6. Transitional Discipline

Selama Step 4.2 belum selesai:

- Tidak boleh ada perubahan struktur Credit Report Step 3.
- Tidak boleh ada field baru di DTO reporting terkait partial payment.
- Tidak boleh ada perubahan rule agregasi.
- Reporting tetap read-only dan tidak mengimpor Payment entity.

Jika kebutuhan reporting mulai memerlukan histori partial payment, maka itu adalah scope Step 5 atau domain baru.

---

## 7. Deprecation Rule

Setelah Step 4 selesai sepenuhnya:

- Model lama settlement dianggap deprecated.
- Dokumen ini dapat ditandai sebagai HISTORICAL.
- Jika reporting berevolusi mengikuti model Payment penuh, maka akan dibuat dokumen versi baru (Reporting v2).

Dokumen ini memastikan bahwa transisi terjadi secara disiplin dan tidak mengaburkan histori desain.

---

## 8. Status

Dokumen ini aktif selama Step 4 berada dalam fase hybrid.

Revisi hanya diperbolehkan melalui keputusan arsitektural eksplisit.

**End of Document**

