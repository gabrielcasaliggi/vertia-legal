# Visor y descarga PDF

## Comportamiento

- El visor carga el PDF vía **`/api/contracts/[id]/file`** (proxy mismo origen, sin depender de URLs firmadas en el iframe).
- Antes de mostrar el iframe, consulta **`?meta=1`** para saber si el archivo existe en Storage.
- **Descargar PDF** usa `?download=1` con `Content-Disposition: attachment`.
- **Abrir en pestaña** reutiliza el mismo endpoint en modo inline.

## Expedientes demo sin archivo

Los contratos del seed pueden tener metadatos y texto indexado pero **sin PDF en el bucket `contracts`**. En ese caso el visor muestra un mensaje claro y el hash registrado; la búsqueda y auditoría siguen funcionando si hay `extracted_text`.

## API

| Request | Respuesta |
|---------|-----------|
| `GET .../file?meta=1` | JSON `{ available, file_name, file_hash, reason }` |
| `GET .../file` | Stream PDF inline |
| `GET .../file?download=1` | Stream PDF descarga |
| `GET .../file?signed=1` | JSON `{ url }` (legacy / integraciones) |
| `HEAD .../file` | 200 si existe, 404 si no |
