# Authorization Boundary – MVP Step 2

## Status

Draft – MVP Step 2

---

## Tujuan Dokumen

Dokumen ini mendefinisikan **boundary authorization** pada MVP Step 2.

Tujuannya adalah:

* Membatasi siapa boleh menjalankan use case tertentu
* Menjaga agar **domain Step 1 tetap steril dari konsep role dan hak akses**
* Menempatkan kontrol akses di lokasi yang tepat secara arsitektural

Dokumen ini **tidak** mendefinisikan UI, mekanisme login, atau sistem IAM lengkap.

---

## Prinsip Utama

1. **Authorization adalah concern operasional, bukan domain bisnis**
   Domain Step 1 tidak mengetahui siapa pengguna sistem.

2. **Boundary lebih penting daripada alat**
   Cara implementasi (middleware, guard, interceptor) adalah detail teknis.

3. **Use case tetap jujur**
   Use case tidak boleh menyimpan asumsi tersembunyi tentang siapa pemanggilnya.

---

## Posisi Authorization dalam Arsitektur

Authorization ditempatkan di **boundary antara delivery layer dan application layer**.

Artinya:

* UI / HTTP layer bertanggung jawab membawa konteks identitas
* Application layer memvalidasi apakah konteks tersebut **berwenang**
* Domain layer **tidak terlibat** dalam keputusan akses

Tidak ada entity domain yang menerima parameter `role` atau `user`.

---

## Konsep Dasar

### Actor

Actor merepresentasikan identitas operasional yang menjalankan use case.

Atribut minimal:

* Actor ID
* Role

Actor **bukan** entity domain dan tidak disimpan sebagai bagian dari Sales / Inventory / Catalog domain.

---

### Role

Pada MVP Step 2, sistem hanya mengenal dua role dasar:

* **Admin**
* **Kasir**

Role bersifat:

* diskrit
* eksplisit
* tidak hierarkis

Penambahan role baru **tidak** boleh mengubah domain Step 1.

---

## Matriks Hak Akses (Konseptual)

| Use Case         | Admin | Kasir |
| ---------------- | ----- | ----- |
| Create Order     | ✔     | ✔     |
| Cancel Order     | ✔     | ✔     |
| Pay Credit       | ✔     | ✔     |
| Initialize Stock | ✔     | ✖     |
| Receive Stock    | ✔     | ✖     |
| Adjust Stock     | ✔     | ✖     |
| Manage Product   | ✔     | ✖     |

Tabel ini bersifat **aturan operasional**, bukan logic domain.

---

## Aturan Enforcement

1. Authorization **harus terjadi sebelum** use case dieksekusi
2. Use case **tidak boleh** melakukan pengecekan role internal
3. Penolakan akses menghasilkan error bermakna bisnis (misalnya `ForbiddenError`)
4. Authorization failure **tidak** mengubah state sistem

---

## Error Handling

Jika actor tidak berwenang:

* Use case tidak dijalankan
* Sistem mengembalikan error kategori `FORBIDDEN`
* Tidak ada side effect

Detail klasifikasi error mengikuti:

* `error-handling-guidelines.md`

---

## Yang Sengaja Tidak Ditangani

Dokumen ini **tidak** mencakup:

* Autentikasi (login, password, token)
* Manajemen user lanjutan
* Permission granular
* Audit keamanan

Topik-topik tersebut akan diperkenalkan pada fase berikutnya jika dibutuhkan.

---

## Dampak terhadap MVP Step 1

* **NON-BREAKING**
* Tidak mengubah kontrak domain
* Tidak mengubah use case Step 1
* Menambahkan pagar operasional di boundary

---

## Catatan Penutup

Authorization yang baik tidak membuat sistem rumit.

Ia membuat sistem **jujur tentang siapa boleh melakukan apa**, tanpa menyeret konsep tersebut ke dalam domain bisnis.
