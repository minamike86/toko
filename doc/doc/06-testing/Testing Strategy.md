# Testing Strategy

Dokumen ini mendefinisikan **strategi pengujian resmi** untuk proyek Sistem Jual Beli Terpadu. 
Strategi ini dirancang agar **logika bisnis tetap benar, mudah ditelusuri, dan tahan terhadap perubahan teknis**, sekaligus realistis terhadap kebutuhan bisnis asli.

Dokumen ini bersifat **mengikat secara arah**, bukan sekadar panduan opsional.

---

## Prinsip Dasar

1. **Test adalah alat kepercayaan bisnis, bukan sekadar CI hijau**
   Test harus membantu menjawab pertanyaan: *"Apakah sistem ini aman dipakai di operasional?"*

2. **Tidak semua test menguji hal yang sama**
   Setiap jenis test memiliki peran berbeda dan tidak boleh saling menggantikan.

3. **Masalah bisnis nyata muncul dari interaksi sistem**
   Oleh karena itu, kombinasi unit test dan integration test adalah keharusan.
   Selain memverifikasi kebenaran logika dan integrasi, strategi pengujian juga digunakan untuk

4. **menjaga disiplin arsitektur dan boundary antar modul** 
   agar tidak bocor seiring waktu.
---

## Lapisan Testing dan Tujuannya

### 1. Domain Test (Wajib)

**Tujuan**
Menjamin aturan bisnis inti (*invariants*) selalu benar.

**Kenapa wajib**
Jika invariant domain rusak, seluruh sistem ikut rusak meskipun UI dan database bekerja sempurna.

**Contoh bisnis nyata**:

* Stok tidak boleh negatif meskipun ada banyak transaksi
* Quantity tidak boleh nol atau negatif

**Aturan**:

* Setiap entity domain **WAJIB** memiliki unit test
* Tidak boleh import Prisma atau database
* Fokus pada perilaku entity

---

### 2. Application / Use Case Test (Wajib)

**Tujuan**
Memastikan alur bisnis dijalankan dengan urutan dan dependency yang benar.

**Kenapa wajib**
Sebagian besar bug operasional terjadi karena alur bisnis salah, bukan karena entity salah.

**Contoh bisnis nyata**:

* Order PAID harus mengurangi stok
* Cancel order harus mengembalikan stok

**Aturan**:

* Repository di-*mock* melalui interface
* Tidak boleh akses database
* Satu use case diuji dengan beberapa skenario

---

### 3. Integration Test (Terbatas tapi Kritis)

**Tujuan**
Memastikan sistem bekerja dalam kondisi nyata (database, transaksi, concurrency).

**Kenapa tidak semua use case**
Integration test mahal, lambat, dan sulit dirawat. Digunakan hanya untuk skenario bernilai tinggi.

**Contoh bisnis nyata**:

* Order dibayar lalu dibatalkan
* Dua transaksi bersamaan pada stok yang sama

**Aturan**:

* Boleh menggunakan Prisma dan database test
* Tidak menambahkan aturan bisnis baru
* Fokus ke end-to-end behavior

---

### 4. Architecture / Boundary Test (Spesifik & Preventif)

**Tujuan**  
Menjaga disiplin arsitektur dan boundary antar modul agar tidak rusak seiring bertambahnya fitur.

**Karakteristik**
- Tidak menguji aturan bisnis
- Tidak menguji alur use case
- Gagal berarti pelanggaran desain, bukan bug fungsional

**Catatan penting**
Untuk MVP Step 3 (Reporting), aturan dan spesifikasi architecture test didefinisikan secara khusus pada:
`/docs/03-mvp/reporting-boundary-and-testing.md`

---

## Concurrency dan Edge Case

**Concurrency dianggap penting** karena:

* Masalah stok hampir selalu muncul saat sistem dipakai bersamaan
* Unit test tidak pernah menemukan race condition

Minimal satu integration test **HARUS** mencakup skenario concurrency.

---

## Penutup

Strategi ini sengaja tidak mengejar kuantitas test, melainkan **nilai bisnis dari setiap test**.
Disiplin arsitektur yang dijaga melalui architecture test adalah bagian dari kepercayaan tersebut,
meskipun tidak selalu terlihat langsung oleh pengguna sistem.
Test yang baik tidak hanya menemukan bug, tetapi memberi kepercayaan diri saat sistem dipakai di dunia nyata.
