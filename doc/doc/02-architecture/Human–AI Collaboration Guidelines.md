# Human–AI Collaboration Guidelines

Dokumen ini mendefinisikan aturan kolaborasi antara **manusia dan AI** dalam pengembangan Sistem Jual Beli Terpadu. Tujuan utamanya adalah menjaga **kualitas kode, konsistensi desain, dan kejelasan niat**, sekaligus **menghindari penggunaan tipe ambigu seperti `any`** dalam program.

Dokumen ini bersifat **mengikat** dan berlaku untuk seluruh kode yang dihasilkan, baik ditulis langsung oleh manusia maupun dibantu AI.

---

## Tujuan Kolaborasi

Kolaborasi manusia–AI bertujuan untuk:

* Mempercepat implementasi tanpa mengorbankan kualitas
* Menjaga konsistensi dengan domain dan dokumen desain
* Menghindari kode ambigu yang sulit dirawat
* Memastikan setiap baris kode memiliki niat yang jelas

AI diperlakukan sebagai **asisten teknis**, bukan pengambil keputusan desain.

---

## Prinsip Dasar

1. **Tidak ada `any` dalam kode produksi**
   Penggunaan `any` dianggap sebagai kehilangan informasi dan niat.

2. **Setiap tipe harus bermakna**
   Jika sebuah tipe sulit didefinisikan, kemungkinan desainnya belum jelas.

3. **Manusia bertanggung jawab atas keputusan akhir**
   AI boleh menyarankan, manusia yang menyetujui.

---

## Aturan Penggunaan TypeScript

### Larangan

* Dilarang menggunakan:

  * `any`
  * `unknown` tanpa narrowing eksplisit
  * casting paksa (`as any`, `as unknown as T`)

Pengecualian hanya boleh dilakukan dengan:

* komentar eksplisit
* justifikasi tertulis

---

### Pendekatan yang Wajib Digunakan

* Gunakan **interface atau type eksplisit**
* Gunakan **DTO terdefinisi** untuk input/output use case
* Gunakan **Value Object** untuk konsep bisnis penting

Contoh:

```ts
// Buruk
function createOrder(input: any) {}

// Baik
interface CreateOrderInput {
  productId: ProductId;
  quantity: number;
}

function createOrder(input: CreateOrderInput) {}
```

---

## Aturan Saat Menggunakan AI

Saat meminta bantuan AI:

* Sertakan konteks domain atau dokumen terkait
* Minta AI menuliskan tipe secara eksplisit
* Tolak solusi yang menggunakan `any`

Prompt yang dianjurkan:

> "Tuliskan kode TypeScript tanpa menggunakan `any`, dengan tipe eksplisit dan sesuai domain."

---

## Review Kode Hasil AI

Setiap kode hasil AI **wajib direview manusia** dengan fokus:

* Apakah tipe sudah jelas?
* Apakah nama mencerminkan bahasa domain?
* Apakah ada asumsi tersembunyi?

Jika kode sulit dipahami tanpa penjelasan panjang, itu tanda desain perlu diperbaiki.

---

## Hubungan dengan Dokumen Lain

* Mengikuti `clean-code-guidelines.md`
* Mengikuti `ddd-boundaries.md`
* Tidak menggantikan ADR atau keputusan arsitektur

Jika terjadi konflik, dokumen domain dan boundary **menang**.

---

## Penegakan Aturan

* Code review wajib menolak penggunaan `any`
* Pelanggaran berulang dianggap masalah desain, bukan teknis
* Perbaikan dilakukan dengan memperjelas model, bukan dengan casting

---

## Catatan Penutup

Dokumen ini dibuat untuk menjaga agar kolaborasi manusia dan AI menghasilkan kode yang **jelas, dapat dipahami, dan berumur panjang**. Kecepatan tanpa kejelasan hanya memindahkan masalah ke masa depan.
