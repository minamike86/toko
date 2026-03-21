# Phase 2.1 – Product Variant Design

## Status
DESIGN – DRAFT (belum diimplementasikan)

Dokumen ini mendefinisikan desain **Product Variant** untuk Phase 2.1.
Fokus dokumen ini adalah **klasifikasi varian produk secara eksplisit** tanpa menambah kompleksitas domain atau membuka scope yang belum diperlukan.

Dokumen ini **bukan ADR** dan **tidak membuka kembali** MVP Step 1 dan Step 2 yang sudah dikunci.

---

## Latar Belakang Masalah

Dalam operasional toko nyata, satu produk sering memiliki banyak variasi fisik:

- Rit / karet merek KCC dengan ukuran berbeda (25 cm, 50 cm)
- Benang merek Yamalon dengan:
  - jenis produk berbeda (obras vs jahit)
  - ukuran isi berbeda (500 yard, 5000 yard)
  - variasi warna yang sangat banyak (hingga >1000 warna)

Tanpa klasifikasi varian yang eksplisit:
- OrderItem menjadi ambigu
- Reporting di masa depan sulit dilakukan
- Perbedaan barang nyata hanya tersirat di nama teks

Namun, pada tahap ini sistem **belum membutuhkan**:
- manajemen SKU
- inventory per varian
- pricing rule per varian

Karena itu diperlukan desain **Product Variant minimal dan aman**.

---

## Tujuan Phase 2.1

- Membuat perbedaan varian produk **eksplisit** di level transaksi
- Menjaga konsistensi snapshot historis OrderItem
- Menyiapkan fondasi reporting di Phase berikutnya

Phase ini **tidak bertujuan** untuk mengoptimalkan pricing, inventory, atau katalog.

---

## Prinsip Desain

1. Product Variant **bukan aggregate baru**
2. Product Variant **tidak memiliki lifecycle sendiri**
3. Product Variant **tidak mengandung logika pricing**
4. Product Variant **tidak mempengaruhi inventory logic**
5. Semua informasi varian disimpan sebagai **snapshot**

Desain ini sengaja menunda kompleksitas sampai benar-benar dibutuhkan.

---

## Definisi Konseptual

### Product

Product merepresentasikan identitas katalog utama.
Contoh:
- "Benang Obras Yamalon"
- "Benang Jahit Yamalon"
- "Rit KCC"

Jenis produk (misalnya obras vs jahit) **dianggap bagian dari nama produk**, bukan varian.

### Product Variant

Product Variant adalah **kombinasi atribut pembeda barang nyata** yang tidak cukup direpresentasikan oleh nama produk saja.

Variant **bersifat opsional** dan disimpan sebagai snapshot pada OrderItem.

---

## Bentuk Variant Snapshot

Variant disimpan dalam bentuk struktur sederhana dan fleksibel:

```ts
variantSnapshot?: {
  brand?: string;  // contoh: "Yamalon", "KCC"
  size?: string;   // contoh: "25 cm", "500 yard", "5000 yard"
  color?: string;  // contoh: "Hitam", "Dongker", "Merah 123"
};
```

Karakteristik:
- Semua field bersifat **opsional**
- Semua field bertipe **string**
- Tidak ada validasi lintas field
- Tidak ada referensi ke master data

Variant snapshot merepresentasikan **kondisi barang pada saat transaksi**, bukan definisi katalog global.

---

## Dampak ke OrderItem

OrderItem akan menyimpan informasi berikut:
- productId
- productNameSnapshot
- unitSnapshot
- unitPriceSnapshot
- quantity
- **variantSnapshot (opsional)**

OrderItem lama tanpa variant tetap valid dan tidak perlu migrasi data.

---

## Contoh Snapshot

### Rit KCC 25 cm warna hitam

```json
{
  "productNameSnapshot": "Rit KCC",
  "unitPriceSnapshot": 120000,
  "variantSnapshot": {
    "brand": "KCC",
    "size": "25 cm",
    "color": "Hitam"
  }
}
```

### Benang Jahit Yamalon 500 yard warna merah

```json
{
  "productNameSnapshot": "Benang Jahit Yamalon",
  "unitPriceSnapshot": 45000,
  "variantSnapshot": {
    "brand": "Yamalon",
    "size": "500 yard",
    "color": "Merah 123"
  }
}
```

---

## Non-Goals (Sengaja Ditunda)

Phase 2.1 **TIDAK mencakup**:

- SKU generation
- ProductVariant entity atau table
- Enum warna / ukuran
- Inventory per varian
- Pricing rule per varian
- Reporting berbasis varian
- No pricing logic
- No discount logic
- No bundle logic
- No stock mutation change

Semua poin di atas **ditunda secara sadar** ke Phase berikutnya jika memang dibutuhkan.

---

## Dampak ke Phase Selanjutnya

Desain ini memungkinkan:
- Reporting grouping berdasarkan brand / size / color
- Evolusi bertahap ke inventory per varian
- Migrasi ke struktur variant yang lebih formal

Tanpa memerlukan migrasi data historis yang kompleks.

---

## Penutup

Phase 2.1 Product Variant berfokus pada **kejelasan fakta transaksi**, bukan optimasi.

Pendekatan snapshot terstruktur ini dipilih untuk mencerminkan realitas operasional toko, menjaga fleksibilitas, dan mencegah over-design di tahap awal.

This document defines structural entity design only.
It does not authorize schema activation.
Activation must follow variant migration roadmap.
