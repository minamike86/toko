# Backup Admin Panel Design

**Location:** `/docs/08-operations/backup-admin-panel-design.md`  
**Status:** DESIGN LOCKED – Implementation Pending  
**Layer:** Operational / Admin Tooling  

---

## 1. Purpose

Backup Admin Panel menyediakan antarmuka operasional untuk:

- Melihat daftar backup database
- Melihat ukuran file dan waktu pembuatan
- Membuat backup baru
- Melakukan restore secara aman

Panel ini bersifat operasional dan tidak menyentuh domain bisnis.

Restore adalah operasi destruktif sehingga wajib memiliki proteksi berlapis.

---

## 2. Feature Scope

### 2.1 Backup Listing

Menampilkan:

- File name
- File size (bytes + human readable)
- Created time (filesystem metadata)
- Sorted: terbaru di atas

Data hanya boleh dibaca dari folder `/backups/`.

Path tidak boleh berasal dari input bebas user.

---

### 2.2 Create Backup

Tombol: **Create Backup**

Behavior:

1. Trigger server-side backup service.
2. Disable tombol saat proses berjalan.
3. Tampilkan loading indicator.
4. Refresh list setelah selesai.

Backup harus mengikuti naming convention:

```
db-backup-YYYY-MM-DD-HH-mm.sql
```

---

### 2.3 Restore Backup

Restore harus memiliki 3 layer proteksi:

#### Layer 1 – Role Protection

- Hanya role `ADMIN`.
- Endpoint wajib dilindungi middleware auth.

#### Layer 2 – Maintenance Requirement

Restore hanya boleh dilakukan jika Maintenance Mode = ON.

Jika OFF:
- Tombol restore disabled.
- UI menampilkan pesan: "Enable maintenance before restore".

#### Layer 3 – Explicit Confirmation

Restore tidak boleh hanya menggunakan confirm popup.

Harus:
- Modal dialog
- User wajib mengetik: `RESTORE`
- Atau mengetik nama database target

Baru tombol restore aktif.

---

## 3. Snapshot Before Restore (Mandatory)

Restore adalah operasi destruktif dan dapat menyebabkan kehilangan data.

Karena itu, sistem wajib secara otomatis membuat snapshot sebelum restore dimulai.

### 3.1 Rule: Snapshot Always On

- Snapshot tidak boleh opsional.
- Tidak boleh disable via UI.
- Restore tidak boleh berjalan tanpa snapshot sukses.

### 3.2 Snapshot Naming

```
pre-restore-YYYY-MM-DD-HH-mm.sql
```

Contoh:

```
pre-restore-2026-02-15-10-30.sql
```

Disimpan di folder `/backups/`.

### 3.3 Restore Flow Protocol

Urutan wajib:

1. Validate role = ADMIN
2. Validate Maintenance Mode = ON
3. Create snapshot (current DB)
4. Jika snapshot gagal → restore dibatalkan
5. Jika snapshot sukses → restore file target
6. Tulis restore log

---

## 4. Restore Event Log

Setiap restore harus dicatat dalam:

```
/backups/restore-log.json
```

Struktur:

```json
[
  {
    "restoredFrom": "db-backup-2026-02-15-09-19.sql",
    "snapshotCreated": "pre-restore-2026-02-15-10-02.sql",
    "restoredAt": "2026-02-15T10:02:33Z",
    "restoredBy": "admin-id"
  }
]
```

Restore log bersifat operasional dan tidak masuk ke database utama.

---

## 5. Auto-Delete Retention Policy

Retention fase awal:

- Simpan maksimum 7 backup terbaru.
- Setelah backup sukses, hapus file tertua jika lebih dari 7.
- Snapshot pre-restore juga termasuk dalam retention policy.

Future improvement:
- Snapshot minimal disimpan 24 jam.

---

## 6. Progress Indicator

Karena backup & restore async:

UI wajib:

- Disable tombol saat proses berjalan.
- Menampilkan status "Running...".
- Menampilkan success / failure.

Future improvement:
- Log streaming atau progress percentage.

---

## 7. Security Rules

Wajib:

- Tidak menerima path bebas dari client.
- Filename diverifikasi ada di `/backups/`.
- Tidak boleh mengizinkan `../` path traversal.
- Restore hanya melalui server-side service.

---

## 8. Non-Goals

Panel ini bukan:

- Multi-region replication
- Cloud snapshot manager
- Full DevOps dashboard
- HA cluster management

---

## 9. Definition of Done

Backup Admin Panel dianggap siap jika:

- File listing benar
- Size & created time tampil
- Create backup berjalan
- Restore hanya bisa saat maintenance ON
- Restore wajib snapshot otomatis
- Snapshot gagal membatalkan restore
- Restore event tercatat
- Retention policy berjalan

---

Dokumen ini mengunci desain Backup Admin Panel sebelum implementasi teknis dilakukan.

