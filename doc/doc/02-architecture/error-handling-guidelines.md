# Error Handling Guidelines – MVP Step 2

## Status

Draft – MVP Step 2

---

## Tujuan Dokumen

Dokumen ini mendefinisikan **standar error handling** untuk MVP Step 2.

Tujuannya adalah:

* Menjadikan kegagalan sistem **bermakna dan dapat dijelaskan**
* Menjaga agar error tidak bocor sebagai detail teknis mentah
* Menyeragamkan cara sistem menolak kondisi tidak valid

Dokumen ini **tidak** mendefinisikan UI error message atau mekanisme logging detail.

---

## Prinsip Dasar

1. **Error adalah bagian dari kontrak sistem**
   Cara sistem gagal sama pentingnya dengan cara sistem berhasil.

2. **Error harus berbicara bahasa bisnis**
   Error menjelaskan *kenapa* sesuatu ditolak, bukan *bagaimana* sistem diimplementasikan.

3. **Domain tetap menjadi sumber kebenaran invariant**
   Pelanggaran invariant domain harus muncul sebagai error eksplisit.

4. **Tidak ada error teknis mentah ke luar boundary**
   Error dari ORM, framework, atau runtime tidak boleh bocor apa adanya.
   

---

## Klasifikasi Error

Pada MVP Step 2, error diklasifikasikan sebagai berikut:

### 1. Validation Error

Digunakan ketika:

* Input tidak memenuhi prasyarat format atau nilai
* Data tidak lengkap atau tidak valid secara struktural

Contoh:

* Quantity <= 0
* ID kosong

Catatan:

* Validation error **tidak mengubah state sistem**

---

### 2. Not Found Error

Digunakan ketika:

* Entity yang diminta tidak ditemukan

Contoh:

* Order tidak ditemukan
* Product tidak ditemukan

---

### 3. Forbidden Error

Digunakan ketika:

* Actor tidak berwenang menjalankan use case

Contoh:

* Kasir mencoba melakukan Adjust Stock

---

### 4. Conflict Error

Digunakan ketika:

* Operasi valid secara input, tetapi tidak valid secara state

Contoh:

* Melunasi order yang sudah PAID
* Membatalkan order yang sudah CANCELED

---

### 5. Invariant Violation Error

Digunakan ketika:

* Aturan domain inti dilanggar

Contoh:

* Stok menjadi negatif
* Order tanpa item

Invariant violation menandakan **kesalahan serius** dan harus mudah dilacak.

---

## Sumber Error per Layer

### Domain Layer

Domain layer **boleh dan wajib**:

* Melempar error terkait invariant
* Menggunakan tipe error yang eksplisit

Domain layer **tidak boleh**:

* Menangani error authorization
* Menangani error teknis (database, network)

---

### Application Layer

Application layer bertanggung jawab:

* Menerjemahkan error domain ke konteks use case
* Menghasilkan error operasional (Forbidden, Conflict)

Application layer **tidak boleh**:

* Melempar error generik
* Menyembunyikan error domain

---

### Infrastructure Layer

Infrastructure layer:

* Boleh menghasilkan error teknis
* **Wajib** memetakan error teknis ke error bermakna sebelum keluar dari boundary

Tidak ada error ORM yang keluar mentah.

---

## Aturan Umum

1. Tidak boleh menggunakan `throw new Error()` tanpa makna bisnis
2. Setiap error **harus punya tipe yang jelas**
3. Error handling tidak boleh mengubah state sistem
4. Error digunakan sebagai sinyal, bukan flow control

---

## Hubungan dengan Authorization

* Authorization failure **selalu** menghasilkan `Forbidden Error`
* Use case tidak dijalankan jika authorization gagal

---

## Testing Guidelines

* Setiap use case **wajib** memiliki minimal satu skenario error
* Test memverifikasi **jenis error**, bukan pesan string
* Error handling diuji di application layer

---

## Yang Sengaja Tidak Ditangani

Dokumen ini **tidak** mencakup:

* Mapping HTTP status code
* Format response API
* Pesan error untuk end-user

Detail tersebut ditentukan di delivery layer.

---

## Dampak terhadap MVP Step 1

* **NON-BREAKING**
* Tidak mengubah aturan domain Step 1
* Menstandarkan cara kegagalan diekspresikan

---

## Catatan Penutup

Sistem yang baik bukan sistem yang tidak pernah gagal.
Sistem yang baik adalah sistem yang **gagal dengan jujur, konsisten, dan dapat dipahami**.
Mapping error teknis menjadi error bisnis wajib dilakukan di application layer, bukan domain.
Infrastructure tidak boleh menyimpan kebijakan error; hanya sumber error teknis.


## Application Layer Error Consistency (MVP Step 2)

Pada MVP Step 2, error handling pada application layer
harus konsisten di seluruh use case (CreateOrder, CancelOrder,
PayCredit, dan use case sejenis).

Aturan berikut bersifat mengikat:

1. Application layer **TIDAK BOLEH** melempar DomainError
   dengan pesan string bebas.

   Contoh yang salah:
   ```ts
   throw new DomainError('ORDER_NOT_FOUND')

2. Kondisi "entity tidak ditemukan" BUKAN domain invariant,
   dan HARUS direpresentasikan sebagai Application Error.

      Contoh yang benar:
      throw new NotFoundError('Order', orderId.toString())


3. Domain error yang berasal dari entity
   (misalnya dari order.cancel() atau order.markAsPaid())
   HARUS dibiarkan mengalir apa adanya,
   tanpa ditangkap atau dipetakan ulang.

4. Application layer hanya bertanggung jawab atas:
   - Authorization (ForbiddenError)
   - Orchestration flow
   - Mapping kondisi "tidak ditemukan"

5. Repository TIDAK melempar DomainError
   untuk kondisi "tidak ditemukan".
   Repository mengembalikan null,
   dan application layer yang memutuskan respons error.

Aturan ini bersifat NON-BREAKING terhadap MVP Step 1
dan berlaku untuk seluruh use case pada Step 2.


---

## KENAPA INI SOLUSI TERBAIK

- ✅ Tidak menambah dokumen baru
- ✅ Tidak mengubah struktur `/docs`
- ✅ Tidak menduplikasi aturan
- ✅ Mengikat Step 2 **tanpa membuka Step 1**
- ✅ Mudah diaudit ke depan

Kalau suatu hari Step 3 mau beda:
- tinggal tambah subsection baru
- tidak perlu bikin guideline baru

---

## RANGKUMAN KEPUTUSAN (FINAL)

- ❌ Tidak membuat dokumen baru
- ✅ Update **`/docs/02-architecture/error-handling-guidelines.md`**
- ✅ Tambah **1 subsection** khusus konsistensi application layer
- ✅ Berlaku untuk CreateOrder, CancelOrder, PayCredit

Ini keputusan yang **dewasa dan scalable**, bukan sekadar “rapi hari ini”.

Kalau kamu setuju, langkah berikutnya baru masuk akal:
👉 **audit CreateOrder.ts sesuai aturan ini**

Dan ya, ini contoh bagus kenapa dokumentasi yang benar **mencegah diskusi berulang** di masa depan.
