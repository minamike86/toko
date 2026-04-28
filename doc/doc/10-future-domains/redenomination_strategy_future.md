# Redenomination Strategy (Future ERP Stability Layer)

Dokumen ini mendefinisikan strategi konseptual untuk menghadapi skenario redenominasi mata uang di masa depan.

Dokumen ini bukan fitur aktif dan hanya menjadi panduan jika kondisi nasional atau kebijakan moneter berubah.

---

## 1. Definisi Redenominasi

Redenominasi adalah perubahan skala nominal mata uang tanpa mengubah nilai ekonomi riil.

Contoh hipotetis:
1.000 Rupiah menjadi 1 Rupiah baru.

---

## 2. Tujuan Strategi

- Menjaga integritas histori transaksi.
- Menghindari perubahan nilai historis secara manual.
- Memastikan laporan sebelum dan sesudah redenominasi tetap konsisten.

---

## 3. Prinsip Arsitektural

1. Semua transaksi bersifat immutable.
2. Tidak ada overwrite nilai historis.
3. Redenominasi tidak mengedit data lama.
4. Periode sebelum redenominasi harus ditutup (locked).

---

## 4. Pendekatan Implementasi (Future Options)

### Opsi A – Display Scaling Layer

- Data historis tetap dalam nominal lama.
- UI menampilkan hasil scaling berdasarkan faktor konversi.
- Cocok untuk masa transisi.

### Opsi B – Migration Event Terstruktur

- Buat event redenominasi resmi.
- Semua nilai setelah tanggal tertentu menggunakan skala baru.
- Tidak mengubah transaksi sebelum tanggal tersebut.

### Opsi C – Dual Currency Mode

- Simpan currency version atau scale version.
- Reporting dapat membaca berdasarkan versi mata uang.

---

## 5. Dampak terhadap Domain

### Accounting
- Ledger harus tetap balance.
- Journal tidak boleh diubah.

### Reporting
- Laporan harus konsisten antar periode.

### UI
- Harus mampu menampilkan label mata uang yang jelas.

---

## 6. Activation Criteria

Strategi ini hanya diaktifkan jika:

- Pemerintah secara resmi menetapkan redenominasi.
- Sistem sudah memiliki period locking.
- Accounting Domain sudah stabil.

---

## 7. Risiko Jika Sistem Tidak Disiplin

- Laporan historis berubah.
- Margin dan laba rugi menjadi tidak konsisten.
- Ledger tidak balance.

Karena itu, disiplin immutability dan period lock adalah prasyarat utama.

---

Dokumen ini memastikan bahwa sistem ERP kecil tetap stabil bahkan dalam skenario ekstrem perubahan mata uang.

