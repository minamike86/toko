# Internal Reporting vs Fiscal Reporting

## 1. Pendahuluan

Sistem Jual Beli Terpadu ini sejak awal dirancang dengan prinsip **kejujuran data** dan **pemisahan tanggung jawab**. Salah satu area yang paling sering menimbulkan kesalahpahaman dalam sistem bisnis adalah *reporting*, khususnya ketika laporan internal digunakan di luar konteks yang dimaksudkan.

Dokumen ini dibuat untuk **membedakan secara tegas** antara:
- **Internal Reporting** (laporan operasional untuk pengambilan keputusan bisnis), dan
- **Fiscal / Accounting Reporting** (laporan resmi untuk keperluan pajak dan pembukuan formal).

Tujuan utama dokumen ini adalah **mencegah penggunaan yang keliru** terhadap laporan internal yang jujur secara operasional, namun **tidak dirancang sebagai laporan fiskal final**.

---

## 2. Definisi Jenis Reporting

### 2.1 Internal Reporting

Internal Reporting adalah laporan yang disediakan oleh sistem untuk **kebutuhan operasional dan manajerial internal**.

Karakteristik utama:
- Bersifat **read-only dan observasional**
- Merepresentasikan **kebenaran data pada saat query dijalankan**
- Data **dapat berubah** jika fakta bisnis berubah (misalnya status transaksi)
- Tidak ada penguncian periode
- Tidak dimaksudkan sebagai dokumen hukum atau pajak

Contoh penggunaan:
- Evaluasi penjualan harian/bulanan
- Monitoring stok dan pergerakan barang
- Melihat piutang berjalan (order ON_CREDIT)
- Analisis performa produk

Internal Reporting **mengutamakan kejujuran kondisi terkini**, bukan finalitas historis.

---

### 2.2 Fiscal / Accounting Reporting

Fiscal / Accounting Reporting adalah laporan yang digunakan untuk **keperluan resmi**, seperti:
- Pelaporan pajak
- Pembukuan akuntansi
- Audit eksternal

Karakteristik utama:
- Bersifat **snapshot**
- Berbasis **periode yang dikunci** (misalnya bulan/tahun pajak)
- Perubahan setelah periode ditutup dicatat sebagai **koreksi eksplisit**, bukan dengan mengubah data masa lalu
- Mengikuti standar akuntansi dan/atau regulasi negara

Catatan penting:
- **Fiscal / Accounting Reporting BELUM diimplementasikan pada MVP Step 3**
- Reporting jenis ini akan diperkenalkan sebagai **domain atau modul terpisah** di fase selanjutnya

---

## 3. Perbedaan Kunci Internal vs Fiscal Reporting

| Aspek | Internal Reporting | Fiscal / Accounting Reporting |
|-----|-------------------|-------------------------------|
| Tujuan | Operasional & manajerial | Pajak & pembukuan resmi |
| Sifat data | Dinamis | Snapshot & terkunci |
| Periode | Tidak dikunci | Dikunci |
| Data bisa berubah | Ya | Tidak (koreksi dicatat terpisah) |
| Pengakuan penjualan | Saat status PAID | Sesuai aturan akuntansi/pajak |
| Pengguna | Owner, manajemen, operasional | Akuntan, auditor, negara |
| Risiko hukum jika salah pakai | Rendah | Tinggi |

---

## 4. Prinsip Internal Reporting (MVP Step 3)

Internal Reporting pada MVP Step 3 mengikuti prinsip-prinsip berikut:

1. **Representasi kebenaran saat query**  
   Laporan selalu dihitung ulang berdasarkan status data terkini.

2. **Pengakuan penjualan berbasis PAID**  
   Order dianggap sebagai penjualan **hanya jika berstatus PAID**.  
   Order ON_CREDIT tidak dihitung sebagai penjualan.

3. **Pembatalan transaksi**  
   Order PAID yang kemudian dibatalkan dianggap sebagai **koreksi periode berjalan**.

4. **Perubahan laporan periode lalu dimungkinkan**  
   Laporan bulan/tahun sebelumnya dapat berubah jika fakta transaksi berubah.

5. **Threshold stok bersifat mekanis dan configurable**  
   - Kondisi stok rendah ditentukan oleh `stok <= threshold`
   - Threshold adalah konfigurasi sistem (write concern)
   - Nilai threshold terakhir yang berlaku digunakan saat query
   - Perubahan threshold **wajib memiliki audit trail**

6. **Tidak ada klaim finalitas historis**  
   Internal Reporting tidak pernah mengklaim angka final atau terkunci.

---

## 5. Batasan Tegas (Non-Negotiable)

Bagian ini bersifat **mengikat dan tidak dapat dinegosiasikan**:

- Internal Reporting **BUKAN laporan pajak**
- CSV atau output dari Internal Reporting **TIDAK dianggap dokumen fiskal resmi**
- Tidak ada jaminan bahwa angka laporan periode lalu akan tetap sama di masa depan
- Internal Reporting **TIDAK BOLEH** digunakan langsung untuk pelaporan ke negara
- Kebutuhan fiskal **HARUS** dipenuhi oleh modul/domain terpisah

Dokumen ini dibuat untuk mencegah klaim:
> “Angka di sistem dulu sekian, sekarang berubah, berarti sistem salah.”

Perubahan tersebut adalah konsekuensi sadar dari desain yang jujur.

---

## 6. Dampak terhadap Arsitektur Sistem

Keputusan pemisahan ini berdampak langsung pada arsitektur:

- Internal Reporting (Step 3) tidak melakukan:
  - snapshot periodik
  - penguncian data
  - pencatatan koreksi historis formal

- Fiscal / Accounting Reporting (future):
  - Akan membaca data mentah transaksi
  - Melakukan snapshot dan period locking
  - Menyimpan koreksi sebagai entri eksplisit

Internal Reporting **tidak akan diubah** untuk memenuhi kebutuhan fiskal.

---

## 7. Implikasi ke Pengembangan Masa Depan

- Saat domain Accounting / Fiscal diperkenalkan:
  - Dokumen ini menjadi referensi utama pemisahan tanggung jawab
  - Internal Reporting tetap dipertahankan apa adanya

- Revisi dokumen ini hanya dilakukan jika:
  - Sistem resmi memasuki fase akuntansi/pajak
  - Ada perubahan fundamental arah bisnis

---

## 8. Penutup

Dokumen ini dibuat untuk menjaga sistem tetap:
- jujur secara data
- aman secara operasional
- dan tidak melampaui tanggung jawabnya

Internal Reporting yang jujur **bukan berarti siap dipakai negara**.
Dengan memisahkan kedua jenis laporan sejak awal, sistem dapat tumbuh tanpa refactor panik dan tanpa risiko hukum yang tidak perlu.

Dokumen ini adalah **pagar konseptual**, bukan formalitas administratif.

