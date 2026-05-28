# Datos de demo — Estudio ficticio

Escenario: **Rivadeneira & Asociados** atiende tres clientes con contratos, vencimientos, obligaciones y auditorías precargadas.

## Cargar datos (recomendado)

```bash
cd ~/Documentos/Vertia/Vertia-Legal
npm run seed:demo
```

Requisitos:
- Migración **009** aplicada en Supabase.
- `.env.local` con `SUPABASE_URL` (o `NEXT_PUBLIC_SUPABASE_URL`) y `SUPABASE_SERVICE_ROLE_KEY`.

## Alternativa: SQL Editor

Pegá y ejecutá [`supabase/seed/demo_estudio_ficticio.sql`](../supabase/seed/demo_estudio_ficticio.sql) en Supabase → SQL Editor.

## Qué incluye la demo

| Cliente | Expedientes | Contratos destacados |
|---------|-------------|----------------------|
| **Acme Argentina S.A.** | Locaciones, IT | Locación Caballito (por vencer), Cloud **auditado** (riesgo 62) |
| **Grupo Norte Logística** | Operaciones | Transporte (urgente), Depósito **auditado** |
| **Inversiones Patagonia** | Societario | Tarea pendiente sin contrato |

- 4 obligaciones pendientes  
- 3 tareas con responsables  
- Bitácora de actividad de ejemplo  

**Nota:** Los PDF no están en Storage; búsqueda, auditoría, chat e informes funcionan con el texto indexado. El visor PDF puede fallar en contratos demo (es esperado).

## Guión rápido (5 min)

1. **Dashboard** — panel ejecutivo con vencimientos y riesgo.
2. **Búsqueda** — `penalidad` o `rescisión` → abrir resultado Cloud.
3. **Consulta jurídica** — preguntar por la limitación de responsabilidad.
4. **Clientes 360** → Acme → exportar informe HTML.
5. **Bitácora** — mostrar trazabilidad en columna derecha.

Guion completo: [`demo-validation-script.md`](./demo-validation-script.md).
