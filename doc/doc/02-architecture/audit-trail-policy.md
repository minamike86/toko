# Audit Trail & Soft Delete Policy – MVP Step 2

## Status

Draft – MVP Step 2

---

## Tujuan Dokumen

Dokumen ini mendefinisikan **kebijakan audit trail dan soft delete** pada MVP Step 2.

Tujuan utama:

* Menjamin bahwa data penting **tidak pernah hilang tanpa jejak**
* Menjaga kejujuran histori sistem
* Mencegah perubahan diam-diam yang merusak integritas bisnis Step 1

Dokumen ini bersifat **pagar arsitektural** dan wajib dirujuk sebelum implementasi apa pun terkait penghapusan atau audit data.

---

## Prinsip Utama

1. **Audit trail adalah concern operasional, bukan domain bisnis inti**
   Domain Step 1 tetap fokus pada fakta bisnis, bukan pada siapa dan kapan secara teknis.

2. **Tidak semua data boleh dihapus**
   Beberapa data bersifat historis dan immutable.

3. **Soft delete bukan pengganti audit trail**
   Soft delete hanya menandai visibilitas, bukan mencatat alasan.

4. **Tidak ada perubahan kontrak domain Step 1**
   Kebijakan ini tidak boleh memaksa perubahan constructor atau invariant domain Step 1.

---

## Definisi Istilah

### Audit Trail

Catatan operasional yang merekam:

* siapa melakukan aksi
* aksi apa yang dilakukan
* terhadap data apa
* kapan terjadi
* konteks singkat (alasan, referensi)

Audit trail **tidak mengubah** fakta bisnis, hanya merekam aktivitas.

---

### Soft Delete

Mekanisme penandaan data sebagai tidak aktif atau tidak terlihat, tanpa menghapus data fisik.

Soft delete:

* menjaga histori
* memungkinkan pemulihan
* mencegah kehilangan data permanen

---

## Klasifikasi Data

### 1. Data Historis (Immutable)

Data yang **tidak boleh dihapus atau diubah** setelah dibuat:

* Order
* Order Item
* Stock Movement

Aturan:

* Tidak ada hard delete
* Tidak ada soft delete
* Koreksi dilakukan melalui **aksi baru**, bukan perubahan data lama

---

### 2. Data Operasional Aktif

Data yang merepresentasikan kondisi saat ini:

* Product
* Inventory Stock (current quantity record)

Aturan:

* Boleh dilakukan soft delete atau deactivate
* Perubahan wajib tercatat dalam audit trail

---

## Penempatan Audit Trail

Untuk menjaga NON-BREAKING terhadap Step 1:

* Audit trail **TIDAK** dimasukkan sebagai field pada entity domain Step 1
* Audit trail direalisasikan sebagai:

  * tabel terpisah, atau
  * mekanisme logging operasional terstruktur

Domain Step 1 **tidak mengetahui** keberadaan audit trail.

---

## Aturan Soft Delete

1. Soft delete hanya berlaku untuk data operasional aktif
2. Soft delete **tidak boleh** diterapkan pada data historis
3. Setiap soft delete **wajib** menghasilkan audit trail
4. Soft delete **tidak menghapus relasi historis**

---

## Hubungan dengan Use Case

* Use case domain Step 1 tetap menghasilkan fakta bisnis
* Use case Step 2 boleh menambahkan pencatatan audit sebagai side effect operasional
* Audit trail **tidak memengaruhi hasil use case**

---

## Error Handling

* Upaya menghapus data historis harus ditolak dengan error bermakna bisnis
* Kegagalan pencatatan audit trail **tidak boleh** mengubah hasil domain, tetapi harus dilog sebagai error operasional

---

## Testing Guidelines

* Tidak ada unit test domain untuk audit trail
* Audit trail diverifikasi melalui:

  * application test, atau
  * integration test bernilai tinggi

---

## Dampak terhadap MVP Step 1

* **NON-BREAKING**
* Tidak mengubah domain entity
* Menambahkan lapisan kejujuran operasional

---

## Catatan Penutup

Audit trail bukan fitur tambahan.

Ia adalah **sabuk pengaman** yang baru terasa penting ketika sesuatu berjalan salah.

Step 2 memperkenalkan sabuk pengaman ini tanpa mengganggu mesin bisnis yang sudah terbukti pada Step 1.
