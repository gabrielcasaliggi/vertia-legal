# Operación SaaS multi-organización

Este documento describe cómo operar Vertia Legal como una única plataforma SaaS con múltiples estudios clientes aislados por organización.

## Conceptos clave

| Concepto | Significado |
|----------|-------------|
| Plataforma SaaS | Panel interno de Vertia para crear y administrar estudios clientes |
| Organización / estudio cliente | Tenant aislado con sus usuarios, contratos, tareas y reportes |
| Usuario Vertia | Usuario autorizado en `platform_admins` |
| Owner del estudio | Primer admin operativo de una organización cliente |
| Organización activa | Tenant con el que el usuario está operando en ese momento |

## Separación de responsabilidades

### Usuario Vertia / Platform admin

Puede:

- Crear organizaciones nuevas.
- Definir plan comercial (`pilot`, `professional`, `enterprise`).
- Definir estado (`trial`, `active`, `suspended`, `cancelled`).
- Crear el owner inicial de un estudio.
- Ver métricas agregadas.

No debe:

- Leer PDFs de clientes desde plataforma.
- Leer texto contractual salvo modo soporte explícito y auditado.
- Operar como usuario interno de un estudio si no es miembro de esa organización.

### Owner o admin del estudio

Puede:

- Configurar **Mi estudio · Configuración**.
- Crear usuarios internos desde **Mi estudio · Usuarios**.
- Operar documentos, clientes, tareas y reportes de su organización.

No puede:

- Crear otros estudios clientes.
- Cambiar plan comercial.
- Suspender o reactivar organizaciones.

### Usuario operativo

Puede operar dentro de su estudio según rol:

- `lawyer`
- `accountant`
- `assistant`

## Crear una organización nueva

Ruta:

```text
/platform/organizaciones
```

Requisitos:

- Migración `017_platform_admins_and_org_lifecycle.sql` aplicada.
- Usuario logueado registrado en `public.platform_admins`.

Flujo:

1. Ingresar como usuario Vertia.
2. Abrir **Plataforma SaaS**.
3. Completar **Paso 1 · Crear estudio cliente**:
   - Nombre del estudio.
   - Slug opcional.
   - Email de facturación.
   - Plan.
   - Estado inicial.
4. Completar **Paso 2 · Owner inicial del estudio**:
   - Nombre del owner.
   - Email.
   - Contraseña temporal.
5. Confirmar que el estudio aparece en la tabla de organizaciones.
6. Enviar credenciales al owner por canal seguro.

## Primer ingreso del owner

El owner debe:

1. Ingresar por `/login`.
2. Abrir **Mi estudio · Configuración**.
3. Revisar nombre, contacto, branding y disclaimer legal.
4. Abrir **Mi estudio · Usuarios**.
5. Crear usuarios internos.
6. Cargar el primer PDF digital de prueba.

## Organización activa

Si un usuario pertenece a una sola organización, entra directo.

Si pertenece a varias, Vertia Legal muestra un selector de organización. La selección se guarda en cookie segura (`vertia_active_org`) y todas las APIs operativas validan membresía antes de responder.

## Estados comerciales

| Estado | Uso |
|--------|-----|
| `trial` | Cliente en prueba o piloto |
| `active` | Cliente activo |
| `suspended` | Login permitido, APIs operativas bloqueadas |
| `cancelled` | Cliente cancelado, sin operación normal |

Una organización suspendida o cancelada no debe poder operar APIs de contratos, clientes, tareas ni reportes. El usuario verá un mensaje comercial para contactar a Vertia.

## Privacidad

La plataforma muestra:

- Cantidad de usuarios.
- Cantidad de documentos.
- Cantidad de tareas.
- Última actividad agregada.

La plataforma no muestra:

- PDFs.
- Texto extraído.
- Resultados de auditoría contractual.
- Consultas asistidas del cliente.

## Auditoría de plataforma

Las acciones de plataforma se registran en `platform_audit_log`:

- Creación de organización.
- Actualización de plan/estado.
- Suspensión.
- Reactivación.
- Creación de owner.

## Checklist de alta de cliente

- [ ] Usuario Vertia existe en `platform_admins`.
- [ ] Organización creada desde `/platform/organizaciones`.
- [ ] Plan y estado inicial definidos.
- [ ] Owner inicial creado.
- [ ] Owner puede iniciar sesión.
- [ ] Owner ve **Mi estudio** y no **Plataforma SaaS**.
- [ ] Owner crea al menos un usuario interno.
- [ ] Se carga un PDF digital de prueba.
- [ ] Los datos no son visibles desde otra organización.

