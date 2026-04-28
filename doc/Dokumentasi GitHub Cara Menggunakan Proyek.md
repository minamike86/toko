Dokumentasi GitHub – Cara Menggunakan Proyek

Dokumen ini ditujukan untuk developer yang baru bergabung atau reviewer eksternal.

Prasyarat

Node.js LTS

npm atau pnpm

Database (MySQL / PostgreSQL sesuai konfigurasi lokal)

Menjalankan Proyek
npm install
npm run dev
Menjalankan Test
Unit & Integration Test
npx vitest run

Pastikan seluruh test hijau sebelum melakukan commit.

Aturan Commit
Prinsip Umum

Satu commit = satu niat perubahan

Jangan mencampur refactor dan fitur

Jangan commit test merah

Format Commit Message
<type>: <deskripsi singkat>


Contoh:
feat: implement PayCredit use case
fix: correct inventory rollback on cancel order
test: add PayCredit unit tests
Aturan Perubahan Setelah Lock

Dilarang mengubah domain Step 1

Dilarang mengubah kontrak repository tanpa ADR

Dilarang mengubah error handling policy

Perubahan tanpa ADR akan dianggap invalid.

Panduan GitHub untuk Developer Junior

Bagian ini ditujukan khusus untuk developer junior yang baru pertama kali berkontribusi pada repository ini.

Tujuannya sederhana:

kamu tidak merusak kode yang sudah terkunci

kamu tahu alur kerja GitHub yang benar

kamu tidak panik atau menebak-nebak

1. Cara Clone Repository

Jangan download ZIP. Gunakan git.

git clone <URL_REPOSITORY>
cd <nama-folder>

Setelah itu pastikan kamu berada di branch main:

git branch
2. Jangan Langsung Coding di Branch main

Aturan keras:

Branch main dilindungi

Jangan commit langsung di main

Selalu buat branch baru:

git checkout -b feat/nama-fitur

Contoh:

feat/reporting-read-model

fix/inventory-calculation

3. Jalankan Test Sebelum Coding

Sebelum menyentuh kode:

npm install
npx vitest run

Kalau test sudah merah dari awal, hentikan dan lapor.

4. Aturan Saat Coding

Jangan mengubah domain Step 1

Jangan mengubah file yang sudah dilock tanpa izin

Ikuti pola yang sudah ada

Kalau ragu, berhenti dan tanya

Prinsip penting:

Lebih baik tidak commit apa-apa daripada commit yang merusak kontrak.

5. Cara Commit yang Benar

Commit kecil, jelas, dan satu tujuan.

git status
git add <file-yang-diubah>
git commit -m "feat: deskripsi singkat"

Contoh commit message yang baik:

feat: add read model for sales report

test: add unit test for reporting query

fix: handle null inventory snapshot

Contoh yang buruk:

fix bug

update

wip

6. Jalankan Test Sebelum Push

WAJIB.

npx vitest run

Kalau ada test merah:

jangan push

jangan force

perbaiki dulu

7. Push dan Buat Pull Request
git push origin feat/nama-fitur

Lalu di GitHub:

Buat Pull Request ke main

Jelaskan:

apa yang kamu ubah

kenapa perlu diubah

apakah BREAKING atau NON-BREAKING

8. Jangan Takut Review

Pull Request bukan hukuman.

Reviewer boleh:

meminta perubahan

menolak PR

bertanya detail

Itu normal dan sehat.

9. Hal yang DILARANG KERAS

Force push ke main

Menghapus test karena gagal

Mengubah domain invariant

Mengubah kontrak repository tanpa ADR

Kalau tidak yakin:

Berhenti. Jangan nekat.

Penutup

Dokumentasi ini dibuat agar:

developer junior bisa bekerja dengan aman

sistem tetap stabil

kesalahan bisa dicegah lebih awal

Ikuti panduan ini, dan kamu tidak akan merusak apa pun.