# Onboarding de nueva organización cliente

Guía práctica para dar de alta un estudio cliente en Vertia Legal.

## 1. Antes de empezar

Confirmar:

- El deploy de producción está operativo.
- La migración `017_platform_admins_and_org_lifecycle.sql` fue aplicada.
- El usuario interno de Vertia está activo en `platform_admins`.
- Supabase Auth tiene registro público desactivado.

## 2. Crear estudio cliente

Entrar a:

```text
/platform/organizaciones
```

Completar **Paso 1 · Crear estudio cliente**:

- Nombre del estudio.
- Slug, si se quiere definir manualmente.
- Email de facturación.
- Plan.
- Estado inicial.

Recomendación:

- Usar `trial` para pilotos.
- Usar `active` cuando ya existe acuerdo comercial.
- Evitar `suspended` o `cancelled` en altas nuevas.

## 3. Crear owner inicial

Completar **Paso 2 · Owner inicial del estudio**:

- Nombre completo.
- Email de acceso.
- Contraseña temporal.

Este usuario queda como admin operativo del estudio. Su tarea inicial es configurar la organización y crear usuarios internos.

## 4. Entregar acceso al owner

Enviar por canal seguro:

```text
URL: https://legal.vertia.net.ar/login
Usuario: owner@cliente.com
Contraseña temporal: ********
```

Indicar que cambie la contraseña si se define un flujo de recuperación o rotación.

## 5. Configuración inicial del owner

El owner debe entrar a:

```text
Mi estudio · Configuración
```

Y completar:

- Nombre visible del estudio.
- Email de contacto.
- Teléfono.
- Logo URL si aplica.
- Responsable en reportes.
- Disclaimer legal.

Luego debe ir a:

```text
Mi estudio · Usuarios
```

Y crear:

- Abogados.
- Contadores si aplica.
- Asistentes.

## 6. Validación funcional

Con el owner o un usuario operativo:

1. Cargar un PDF digital real menor al límite operativo.
2. Verificar que aparece en Documentos.
3. Abrir el detalle.
4. Confirmar visor y descarga.
5. Buscar una cláusula.
6. Crear una tarea.
7. Ejecutar auditoría cognitiva si corresponde.
8. Exportar un reporte.

## 7. Validación de aislamiento

Si hay más de una organización:

- Un owner de la organización A no debe ver contratos de la organización B.
- El selector de organización solo aparece si el usuario pertenece a más de una.
- Las métricas de Plataforma SaaS son agregadas y no muestran contenido contractual.

## 8. Cierre del onboarding

Dar por finalizada el alta cuando:

- El owner puede iniciar sesión.
- El estudio está configurado.
- Hay al menos un usuario operativo.
- Se cargó un documento de prueba.
- La búsqueda funciona.
- La organización queda en estado comercial correcto.

