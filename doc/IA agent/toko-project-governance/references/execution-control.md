# Execution Control

Gunakan dokumen ini saat request menyangkut audit, sync, lanjut/stop, missing artifacts, execution status, traceability, atau closure.

## Source Documents

- auto_update_workflow.md
- traceability_index.md
- execution_status.md
- log_note.md

## Core Rules

Status hanya boleh diturunkan dari:

1. Use Case Coverage
2. Module Health
3. Step Status

## traceability_index.md

Berfungsi sebagai peta struktur artefak.

Boleh berisi:

- daftar dokumen
- code mapping
- test mapping
- use case traceability

Tidak boleh berisi:

- status eksekusi
- missing artifacts
- keputusan COMPLETE / INCOMPLETE / INVALID

## execution_status.md

Berfungsi sebagai dokumen status aktual.

Boleh berisi:

- step status
- module health
- use case coverage
- missing artifacts
- final decision rule

Tidak boleh menjadi daftar file mentah.

## Hard Failure Rules

Anggap sebagai INVALID jika:

- execution_status.md diupdate sebelum traceability_index.md
- use case tidak ada tapi implementation ada
- domain doc tidak ada tapi use case dibuat
- test tidak ada untuk use case kritikal
- log_note dibuat sebelum semua artefak selesai

Anggap sebagai INCOMPLETE jika:

- ada missing artifacts
- mapping doc ↔ code ↔ test tidak lengkap

Anggap sebagai COMPLETE hanya jika:

- semua artefak tersedia
- urutan execution terpenuhi
- tidak ada violation

## Update Order

1. identifikasi step / fitur
2. identifikasi ADR
3. identifikasi domain doc
4. identifikasi use case
5. identifikasi implementation
6. identifikasi test
7. update traceability_index.md
8. update execution_status.md
9. simpulkan status

Jangan menyatakan COMPLETE jika masih ada missing artifacts kritikal.
