# Implementation Lock Notes

Dokumen ini berfungsi sebagai **lock note implementasi**, yaitu catatan singkat untuk menjaga kesinambungan kerja pemrograman dari satu sesi ke sesi berikutnya.

Dokumen ini **bukan dokumentasi teknis**, **bukan laporan formal**, dan **bukan pengganti commit log**. Dokumen ini dibuat untuk membantu pengembang (terutama diri sendiri) memahami **posisi terakhir pekerjaan**, **niat desain**, dan **langkah aman berikutnya**.

---

## Tujuan Dokumen

Implementation Lock Notes bertujuan untuk:

* Menghindari kehilangan konteks saat pekerjaan terhenti
* Menjaga fokus implementasi tetap selaras dengan domain dan use case
* Mencegah keputusan impulsif saat melanjutkan pekerjaan
* Menjadi pengingat sadar terhadap fitur atau keputusan yang **sengaja ditunda**

Dokumen ini membantu menjawab pertanyaan:

* "Aku terakhir mengerjakan bagian apa?"
* "Kenapa bagian ini belum selesai?"
* "Langkah aman berikutnya apa?"

---

## Lokasi Dokumen

Dokumen ini **wajib** diletakkan di:

```
/docs/implementation-lock-notes.md
```

Alasan:

* Berada di folder dokumentasi utama
* Mudah ditemukan saat membuka repo
* Tidak tercampur dengan domain atau use case

Dokumen ini dibaca **sebelum melanjutkan coding**, bukan saat menulis kode.

---

## Aturan Umum Penulisan

* Ditulis dengan bahasa Indonesia
* Ditujukan untuk diri sendiri atau tim internal
* Ditulis singkat, jujur, dan apa adanya
* Tidak perlu rapi atau indah
* Boleh diperbarui setiap hari atau setiap sesi kerja

Jika dokumen ini terasa seperti beban administratif, berarti cara menggunakannya salah.

---

## Struktur Penulisan

Gunakan struktur berikut secara konsisten.

---

### 1. Current Focus

Menjelaskan **apa yang sedang dikerjakan saat ini**.

Contoh:

* Implementasi `CreateOrder` use case (application layer)
* Fokus ke alur penjualan tunai (cash)
* Belum menyentuh Prisma atau database

---

### 2. Last Completed

Mencatat **pekerjaan terakhir yang sudah selesai dan aman**.

Contoh:

* Entity `Order` dan transisi status dasar
* Use case `IssueStock` di Inventory
* Test unit untuk skenario stok cukup

---

### 3. Open Decisions

Mencatat keputusan yang **belum diambil** dan sengaja ditunda.

Contoh:

* Strategi error handling untuk stok tidak cukup
* Apakah transaksi database perlu diterapkan sekarang atau nanti

Catatan:
Keputusan di bagian ini **belum final** dan tidak boleh diimplementasikan diam-diam.

---

### 4. Known TODO (Intentionally Unfinished)

Daftar hal yang **sengaja belum dikerjakan**, bukan lupa.

Contoh:

* Use case `pay-credit` (ditunda ke MVP berikutnya)
* Integrasi Procurement Domain
* Reporting lanjutan

Bagian ini mencegah rasa "ada yang ketinggalan" saat membaca kode.

---

### 5. Next Safe Step

Menjelaskan **langkah paling aman berikutnya** untuk dilanjutkan.

Contoh:

* Menulis test untuk `CreateOrder` skenario credit
* Refactor kecil pada Order entity setelah test lulus

Bagian ini membantu langsung mulai bekerja tanpa berpikir ulang.

---

## Cara Menggunakan Dokumen Ini

1. Saat **mengakhiri sesi coding**, perbarui dokumen ini
2. Isi dengan kondisi nyata, bukan rencana ideal
3. Saat **memulai sesi coding**, baca dokumen ini terlebih dahulu
4. Jangan menulis kode sebelum memahami isi dokumen

---

## Hubungan dengan Dokumen Lain

* Tidak menggantikan use case atau domain document
* Tidak menggantikan ADR
* Tidak menggantikan commit message

Implementation Lock Notes adalah **pengikat mental**, bukan artefak arsitektur.

---

## Catatan Penutup

Dokumen ini dibuat untuk membantu manusia bekerja dengan konsisten, bukan untuk mengesankan sistem. Jika suatu hari kamu lelah, lupa, atau kehilangan fokus, dokumen inilah yang membantumu kembali ke jalur yang benar.
