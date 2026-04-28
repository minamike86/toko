# Tax Domain Roadmap (Future ERP Layer)

Dokumen ini mendefinisikan rencana strategis aktivasi Domain Pajak setelah Accounting Domain (Step 9) stabil dan berjalan dengan benar.

Dokumen ini bersifat roadmap konseptual dan bukan komitmen implementasi aktif.

---

## 1. Tujuan Domain Pajak

Domain Pajak bertujuan untuk:

- Mengelola kewajiban pajak berdasarkan transaksi yang sudah dijurnal.
- Menghitung pajak keluaran dan pajak masukan secara periodik.
- Menyediakan dasar rekonsiliasi pajak terhadap laporan akuntansi.

Domain ini hanya boleh aktif setelah:
- Journal entry stabil
- General ledger konsisten
- Period closing tersedia

---

## 2. Posisi Arsitektural

Domain Pajak berada di atas Accounting Domain.

Alur logis:

Sales / Procurement → Journal Entry → Ledger → Tax Computation

Domain Pajak:
- Tidak mengubah transaksi penjualan
- Tidak mengubah Purchase Order
- Tidak memodifikasi journal lama
- Hanya membaca data akuntansi yang sudah final

---

## 3. Ruang Lingkup Awal (Indonesia-Oriented)

### 3.1 PPN Keluaran
- Dihitung dari penjualan kena pajak
- Tercatat sebagai kewajiban pajak

### 3.2 PPN Masukan
- Dihitung dari pembelian yang valid
- Dapat dikreditkan terhadap PPN keluaran

### 3.3 Rekonsiliasi Masa Pajak
- Per periode (bulanan)
- Berdasarkan transaksi yang sudah close

---

## 4. Tidak Termasuk (Fase Awal)

- Integrasi langsung e-Faktur
- Otomatisasi pelaporan DJP
- PPh Badan kompleks
- Pajak internasional
- Multi-currency tax logic

---

## 5. Prinsip Keras

1. Pajak dihitung dari journal yang sudah final.
2. Tidak boleh mengedit transaksi lama untuk menyesuaikan pajak.
3. Pajak periode yang sudah close tidak dapat diubah tanpa adjustment.
4. Semua perhitungan pajak harus reproducible.

---

## 6. Activation Criteria

Domain Pajak diaktifkan jika:

- Sistem sudah memiliki Accounting Domain stabil.
- Period closing berjalan konsisten.
- Trial balance selalu balance.
- Bisnis resmi menjadi PKP atau membutuhkan laporan pajak formal.

---

## 7. Dampak terhadap Sistem

Positif:
- Kesiapan pelaporan pajak formal
- Kepatuhan regulasi
- Transparansi kewajiban pajak

Trade-off:
- Kompleksitas meningkat
- Memerlukan kontrol periode lebih ketat
- Memerlukan governance lebih disiplin

---

Dokumen ini menjaga agar aktivasi pajak tidak dilakukan prematur sebelum fondasi akuntansi matang.

