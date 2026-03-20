# Test Helper Contract

**Status: DESIGN LOCKED**

Dokumen ini menetapkan kontrak resmi untuk seluruh test helper yang digunakan pada MVP Step 3, dengan tujuan menjaga stabilitas, determinisme, dan boundary arsitektur integration test.

Dokumen ini bersifat normatif. Helper yang melanggar aturan di bawah dianggap sebagai bug pada test infrastructure.

## Tujuan

- Mencegah flaky integration test
- Menjaga isolasi schema-per-suite
- Memastikan boundary domain tidak bocor ke test infrastructure
- Menetapkan disiplin pembuatan helper test

## Klasifikasi Helper

### 1. Domain Factory Helper

Helper yang menghasilkan entity domain tanpa menyentuh database.

Ciri-ciri:
- Tidak menggunakan PrismaClient
- Tidak menulis ke database
- Menghasilkan object domain murni

Contoh:
- createOrderWithTotal.ts
- createDummyOrderItem.ts

Aturan:
- Tidak wajib idempotent
- Tidak boleh digunakan untuk integration test berbasis database
- Digunakan untuk unit test atau domain-level test

---

### 2. Database Seed Helper

Helper yang menulis data langsung ke database dan digunakan oleh integration test.

Ciri-ciri:
- Menggunakan PrismaClient
- Menulis langsung ke database
- Digunakan oleh integration test

Contoh:
- seedInventory
- seedStockMovement
- seedOrder (khusus reporting)

Aturan WAJIB:
1. Helper harus idempotent
2. Tidak boleh mengasumsikan database kosong
3. Tidak boleh menghapus data domain lain
4. Harus mengekspresikan state akhir, bukan perubahan relatif

Prinsip yang benar:
> "Pastikan stok = 10"

Prinsip yang dilarang:
> "Tambah stok 10"

---

## Larangan Keras

- Helper hipotetis yang tidak digunakan oleh test mana pun
- Helper database yang menggunakan create tanpa idempotensi
- Helper yang menyentuh domain entity dan database sekaligus
- Helper database yang melakukan deleteMany lintas domain

## Hubungan dengan Schema-per-Suite

Karena integration test menggunakan schema-per-suite:
- Database hidup sepanjang satu suite
- Helper harus aman dipanggil berulang kali
- Cleanup manual dilarang

Helper yang melanggar prinsip ini dianggap tidak kompatibel dengan strategi testing yang dikunci.

## Status

Dokumen ini DESIGN LOCKED. Semua helper test pada MVP Step 3 wajib mematuhi kontrak ini. Perubahan terhadap dokumen ini dianggap sebagai perubahan arsitektural dan harus ditandai secara eksplisit sebagai BREAKING atau NON-BREAKING.

