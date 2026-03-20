# CONTRIBUTING

Dokumen ini menjelaskan **cara berkontribusi ke repository ini dengan aman**.

Tujuan utama dokumen ini **bukan mempercepat coding**, tetapi **mencegah kerusakan sistem**.

Jika kamu baru pertama kali berkontribusi, **baca dokumen ini sampai selesai**.

---

## Prinsip Dasar

- Repository ini menggunakan pendekatan **DDD + Clean Architecture**
- MVP dikembangkan **bertahap dan DIKUNCI per step**
- Saat ini **MVP Step 2 telah LOCKED**

Artinya:
> Tidak semua file boleh diubah sembarangan.

---

## 1. Clone Repository

Gunakan git. Jangan download ZIP.

```bash
git clone <URL_REPOSITORY>
cd <nama-folder>
```

Pastikan kamu berada di branch `main` sebelum membuat branch baru:

```bash
git branch
```

---

## 2. Jangan Pernah Commit di `main`

Aturan keras:
- Branch `main` **dilindungi**
- Jangan commit langsung di `main`

Selalu buat branch baru:

```bash
git checkout -b feat/nama-fitur
```

Contoh nama branch:
- `feat/reporting-read-model`
- `fix/inventory-calculation`
- `test/add-paycredit-integration-test`

---

## 3. Jalankan Test Sebelum Mengubah Apa Pun

Sebelum menulis kode:

```bash
npm install
npx vitest run
```

Jika test sudah merah dari awal:
- **Hentikan pekerjaan**
- Laporkan ke maintainer

---

## 4. Aturan Saat Coding

### Hal yang DILARANG

- Mengubah domain Step 1
- Mengubah kontrak repository tanpa persetujuan
- Menghapus atau melemahkan domain invariant
- Mengubah error handling policy
- Menghapus test karena gagal

Jika ragu:
> Berhenti dan tanyakan.

Lebih baik tidak commit daripada commit yang merusak kontrak.

---

## 5. Aturan Commit

### Prinsip

- Satu commit = satu tujuan
- Jangan mencampur refactor dan fitur
- Commit harus bisa dijelaskan dengan satu kalimat

### Format Commit Message

```
<type>: <deskripsi singkat>
```

Contoh:
- `feat: add reporting read model`
- `fix: correct stock rollback on cancel order`
- `test: add integration test for pay credit`

Contoh yang buruk:
- `fix bug`
- `update`
- `wip`

---

## 6. Jalankan Test Sebelum Push

WAJIB.

```bash
npx vitest run
```

Jika ada test merah:
- Jangan push
- Jangan force
- Perbaiki terlebih dahulu

---

## 7. Push dan Buat Pull Request

```bash
git push origin feat/nama-fitur
```

Di GitHub:
1. Buat Pull Request ke `main`
2. Jelaskan:
   - apa yang diubah
   - kenapa perlu diubah
   - apakah BREAKING atau NON-BREAKING

---

## 8. Review Bukan Hukuman

Pull Request **bukan hukuman**.

Reviewer boleh:
- meminta perubahan
- menolak PR
- bertanya detail

Itu normal dan sehat.

---

## 9. Hal yang DILARANG KERAS

- Force push ke `main`
- Mengubah domain invariant tanpa ADR
- Mengubah kode yang sudah LOCKED
- Mengabaikan test merah

Jika kamu melanggar ini, PR **akan ditolak**.

---

## Penutup

Dokumen ini dibuat untuk:
- melindungi sistem
- membantu developer junior bekerja aman
- menjaga kualitas jangka panjang

Ikuti panduan ini, dan kamu tidak akan merusak apa pun.

