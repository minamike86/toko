# Unit Test Guidelines

Dokumen ini mendefinisikan **aturan penulisan unit test** agar test benar-benar menguji perilaku bisnis, bukan detail implementasi sementara.

Dokumen ini bersifat **mengikat** untuk seluruh unit test domain dan application layer.

---

## Prinsip Utama

1. **Test menguji perilaku, bukan implementasi**
   Jika refactor internal mematahkan test tanpa mengubah perilaku bisnis, test tersebut salah.

2. **Test harus berbicara dengan bahasa bisnis**
   Nama test adalah dokumentasi perilaku sistem.

---

## Aturan Umum

### Assertion Style

**Aturan**: Fokus pada *behavior*, bukan state internal.

**Alasan bisnis**:
Pengguna tidak peduli variabel apa yang berubah, mereka peduli apa yang terjadi.

**Contoh benar**:

* `reduces stock when order is paid`

**Contoh salah**:

* `quantity field equals 90`

---

### Mocking

**Aturan**: Semua dependency di-*mock* melalui **interface**, bukan implementasi.

**Alasan bisnis**:
Bisnis bergantung pada kontrak, bukan alat teknis tertentu.

---

### Penamaan Test

**Aturan**: Nama test **WAJIB** mencerminkan skenario bisnis.

**Contoh**:

* `throws error when inventory is not found`
* `returns stock when order is canceled`

---

### Negative Test

**Aturan**: Setiap use case **WAJIB** memiliki minimal satu negative test.

**Alasan bisnis**:
Sebagian besar kerugian bisnis datang dari kondisi gagal yang tidak tertangani.

---

## Larangan Keras

* ❌ Menguji TypeScript compiler dengan runtime test
* ❌ Menggunakan `any` atau casting paksa
* ❌ Menguji Prisma atau database di unit test

---

## Penutup

Unit test yang baik adalah pagar pertama sistem.
Jika pagar ini rapuh, integration test tidak akan menyelamatkanmu.
