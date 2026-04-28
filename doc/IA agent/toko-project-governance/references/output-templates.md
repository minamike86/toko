# Output Templates

## Audit Output

```md
## Keputusan
<LANJUT | STOP | PATCH REQUIRED | OUT OF SCOPE>

## Status
- Product direction: <valid/invalid>
- Documentation lifecycle: <valid/invalid>
- Domain boundary: <valid/invalid>
- Use case contract: <valid/invalid/unknown>
- Code mapping: <valid/invalid/unknown>
- Test mapping: <valid/invalid/unknown>
- Traceability / execution status: <valid/invalid/needs update>

## Temuan Mayor
<only major issues>

## Patch Required
<yes/no, target dokumen>

## Konsekuensi
<dampak ke langkah berikutnya>
```

## Patch Output

```md
## Patch — <nama dokumen>

Status: <NON-BREAKING | BREAKING | ADDITIVE | CLARIFICATION>

Letakkan:
Sesudah: `<heading atau paragraf persis>`
Sebelum: `<heading atau paragraf persis>`

Patch:
<konten siap tempel>
```

## Implementation Plan Output

```md
## Status Kesiapan
<SIAP IMPLEMENTASI | BELUM SIAP | PATCH REQUIRED>

## Scope
<fitur/use case/domain yang disentuh>

## Dokumen Acuan
- <dokumen>

## Boundary
- Domain:
- Application:
- Infrastructure:
- UI/Delivery:

## Rencana File
- <path file>

## Test Wajib
- Domain:
- Application:
- Integration:
- Architecture:

## Stop Condition
<kondisi yang membuat implementasi harus dihentikan>
```
