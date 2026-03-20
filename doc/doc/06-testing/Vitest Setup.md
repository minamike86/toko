# Vitest Setup

Dokumen ini menjelaskan **konfigurasi dan aturan penggunaan Vitest** pada proyek Sistem Jual Beli Terpadu.

Tujuannya adalah memastikan test berjalan **konsisten, terisolasi, dan dapat dipercaya**, baik di local maupun CI.

---

## Konfigurasi Dasar

Proyek ini menggunakan Vitest dengan konfigurasi utama:

* **Environment**: `node`
  Alasan: sebagian besar logic bisnis berjalan di server side.

* **Globals**: `true`
  Alasan: mengurangi boilerplate pada test.

* **Alias**:

  ```ts
  @ -> src
  ```

Ini memastikan struktur import konsisten antara production code dan test.

---

## Struktur File Test

Test akan otomatis dikenali dengan pola:

```
**/*.test.ts
```

Baik di folder `src` maupun `tests`.

---

## Unit vs Integration Test

### Unit Test

* Dijalankan cepat
* Tidak menyentuh database
* Menggunakan mock
* Wajib lolos sebelum integration test dijalankan

### Integration Test

* Menggunakan Prisma dan database test
* Menguji alur end-to-end
* Lebih lambat dan dijalankan selektif

**Alasan pemisahan**:
Dalam bisnis nyata, kegagalan kecil harus cepat terdeteksi sebelum simulasi besar dijalankan.

---

## Paralelisme

* Unit test boleh berjalan paralel
* Integration test **disarankan** berjalan terkontrol untuk menghindari race palsu

---

## CI Recommendation

Di CI, urutan yang disarankan:

1. Unit & application test
2. Architecture / boundary test
3. Integration test

Jika unit test gagal, integration test tidak perlu dijalankan.

---

## Penutup

Konfigurasi test bukan sekadar teknis.
Ia adalah bagian dari strategi mitigasi risiko bisnis.
