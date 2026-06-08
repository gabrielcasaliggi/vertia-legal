# Manual de usuario — Vertia Legal

Vertia Legal es un Smart CLM (centro de control contractual con IA) para estudios jurídicos, contables y equipos legales. Su objetivo es centralizar documentos, facilitar búsquedas, controlar vencimientos, comparar versiones contractuales, asignar tareas y generar informes profesionales con trazabilidad.

La inteligencia artificial funciona como asistencia bajo demanda. No reemplaza la revisión profesional ni toma decisiones legales por el usuario.

## 1. Para qué sirve Vertia Legal

Vertia Legal ayuda a responder preguntas operativas frecuentes:

- ¿Dónde está el contrato o documento que necesito?
- ¿Qué documentos vencen pronto?
- ¿Qué tareas tiene pendiente el equipo?
- ¿Qué cláusulas tienen riesgo o requieren revisión?
- ¿Qué documentos están asociados a un cliente?
- ¿Qué informe puedo entregar al cliente?
- ¿Qué cambió entre el contrato viejo y la propuesta nueva?

El sistema combina:

- Repositorio documental.
- Indexación de texto de PDFs.
- Búsqueda en documentos.
- Control de vencimientos.
- Cliente 360.
- Tareas y responsables.
- Bitácora de actividad.
- Comparador contractual 1 a 1.
- Historial de comparaciones.
- Auditoría cognitiva bajo demanda.
- Consulta asistida sobre documentos indexados.
- Exportes profesionales (auditoría, portfolio, comparativo).

## 2. Qué no hace

Vertia Legal no debe interpretarse como:

- Un reemplazo del abogado, contador o responsable profesional.
- Un sistema de firma digital.
- Un gestor judicial completo.
- Un ERP contable.
- Un CLM enterprise completo con aprobaciones complejas, redlining colaborativo ni firma electrónica avanzada.

Sí incluye capacidades Smart CLM operativas: repositorio privado, búsqueda, vencimientos, tareas, auditoría IA bajo demanda, comparación contractual y reportes exportables. El foco es control contractual inteligente y operativo, no reemplazo del criterio profesional.

## 3. Acceso al sistema

Ingresar desde:

```text
/login
```

Usar correo y contraseña asignados por el administrador.

En la barra superior se muestra:

- Navegación principal (Inicio, Clientes, Documentos, Tareas, Reportes).
- Chip con el nombre de la **organización activa** (si aplica).
- Menú **Configuración** (usuarios y ajustes del estudio; Plataforma SaaS para admins Vertia).
- Nombre del usuario, rol y selector de organización (si pertenece a más de una).
- Botón `Salir`.
- Acceso al centro de ayuda (`Ayuda`).

En pantallas pequeñas, la navegación se agrupa en el menú **Menú** (hamburguesa).

Roles disponibles:

- `admin`: administración y configuración.
- `lawyer`: abogado/a.
- `accountant`: contador/a.
- `assistant`: asistente o usuario operativo.

Además de esos roles internos del estudio, Vertia Legal distingue una capa superior:

- **Usuario Vertia / Plataforma**: usuario interno autorizado en `platform_admins`. Crea estudios clientes, define plan/estado y crea el owner inicial.
- **Owner o admin del estudio**: administra usuarios y configuración de su organización activa desde **Mi estudio**.
- **Usuario operativo**: trabaja con clientes, documentos, tareas, reportes y auditoría según su rol.

Un usuario Vertia de plataforma no es automáticamente miembro operativo de todos los estudios. Si necesita trabajar dentro de un estudio, también debe existir como miembro de esa organización.

### Organización activa

Cada usuario opera dentro de una organización activa. Si pertenece a una sola organización, Vertia Legal entra directo. Si pertenece a varias, verá un selector para elegir con qué estudio trabajar.

La organización activa se muestra en la barra superior y en el menú de usuario. Determina qué clientes, documentos, tareas, comparaciones y reportes son visibles.

Si el usuario pertenece a varias organizaciones y aún no eligió una, puede redirigirse a `/seleccionar-organizacion` para elegir con qué estudio operar.

### Permisos visibles

Algunas acciones solo aparecen si el rol del usuario lo permite (por ejemplo: cargar documentos, auditar, comparar, exportar informes, archivar). Si no ves un botón que esperás, consultá con el administrador del estudio; no es un error de la pantalla.

## 4. Pantallas principales

### Inicio

Es la pantalla principal de trabajo y el punto de partida. Permite:

- Acciones rápidas (cargar, buscar, comparar, tareas, reportes).
- Cargar documentos.
- Buscar documentos y cláusulas (búsqueda híbrida con filtros).
- Ver indicadores ejecutivos del portfolio (mapa colapsable).
- Revisar alertas de vencimiento y obligaciones.
- Consultar la bitácora reciente.

Si la carga inicial falla, se muestra un mensaje de error en lugar de pantallas vacías.

### Clientes

Permite gestionar el Cliente 360:

- Datos del cliente.
- Expedientes o asuntos.
- Documentos vinculados.
- Tareas asociadas.
- Reportes de portfolio.

### Documentos

Muestra el registro documental completo (`/contracts`):

- Métricas del portfolio (total, indexados, ventana crítica, clientes).
- Filtro por texto sobre archivo, cliente, tipo o partes.
- Enlace a búsqueda avanzada en Inicio.
- **Cargar documento** (modal de carga sin salir de Documentos), si el rol lo permite.
- **Comparar contratos** (acceso al comparador), si el rol lo permite.
- Listado de expedientes con estado, vigencia, partes y hash.
- Acceso al detalle del expediente.

### Tareas

Es la bandeja operativa del usuario:

- Mis tareas.
- Tareas vencidas.
- Tareas urgentes.
- Filtros por responsable, estado, prioridad y fecha.
- Acciones rápidas para tomar, completar o cancelar.

### Comparador contractual

Pantalla dedicada (`/contracts/comparar`). No forma parte del menú principal; se accede desde Documentos, Inicio (acción rápida) o desde el detalle de un expediente (**Comparar con otro**).

Permite contrastar dos contratos indexados de la **misma organización** (pueden ser de clientes distintos) y obtener un informe con cambios críticos, diferencias operativas y recomendaciones.

Requiere permiso de auditoría/comparación (`run_audit`). Roles `assistant` y `accountant` no ven esta función por defecto.

### Reportes

Permite generar:

- Portfolio por cliente.
- Informe de auditoría por contrato.
- Informe comparativo (desde el comparador: export MD/HTML).
- HTML imprimible.
- Markdown.
- Resumen de alertas por email si SMTP está configurado.

### Mi estudio

Disponible para owners o administradores del estudio.

Incluye:

- **Mi estudio · Usuarios**: alta, roles y activación de usuarios internos de la organización activa.
- **Mi estudio · Configuración**: nombre del estudio, contacto, branding y textos legales para reportes.

Importante: **Mi estudio no crea organizaciones SaaS nuevas**. Solo administra el estudio activo.

### Plataforma SaaS

Disponible solo para usuarios Vertia autorizados como platform admins. Acceso: menú **Configuración → Plataforma SaaS** o ruta `/platform/organizaciones`.

Permite:

- Crear un nuevo estudio cliente (wizard en dos pasos).
- Definir plan y estado inicial (`trial`, `active`, `suspended`, `cancelled`).
- Crear el owner inicial del estudio.
- Ver métricas agregadas por organización (usuarios, documentos, tareas).
- Gestionar plan y estado desde el detalle de cada estudio (`/platform/organizaciones/[id]`).
- Suspender o reactivar organizaciones.

La interfaz usa el mismo lenguaje visual que el resto del producto (paneles, alertas, breadcrumbs). La Plataforma SaaS **no muestra PDFs ni texto contractual** de los clientes. Su propósito es administrar el ciclo de vida comercial y operativo de los tenants.

## 4.1 Crear un estudio cliente nuevo

Solo un **Usuario Vertia / Plataforma** puede crear organizaciones nuevas.

Ruta:

```text
/platform/organizaciones
```

Flujo recomendado:

1. Entrar como usuario Vertia autorizado.
2. Abrir **Plataforma SaaS**.
3. Completar **Paso 1 · Crear estudio cliente**:
   - Nombre del estudio.
   - Slug opcional.
   - Email de facturación.
   - Plan.
   - Estado inicial.
4. Continuar a **Paso 2 · Owner inicial del estudio**:
   - Nombre del owner.
   - Email de acceso.
   - Contraseña temporal.
5. Informar al owner que ingrese al sistema.
6. El owner configura **Mi estudio · Configuración** y crea usuarios en **Mi estudio · Usuarios**.

Desde el listado, **Gestionar** abre el detalle del estudio para cambiar plan/estado o crear un owner adicional.

Si no aparece **Plataforma SaaS** en Configuración, el usuario no está autorizado en `platform_admins` o debe cerrar sesión y volver a ingresar.

## 5. Cargar un documento

Desde **Inicio** (sección de carga) o desde **Documentos** (botón **Cargar documento**):

1. Completar cliente.
2. Completar carpeta o expediente.
3. Indicar tipo de contrato si corresponde.
4. Seleccionar categoría documental.
5. Subir PDF.

Durante la carga, Vertia Legal:

- Calcula hash SHA-256.
- Extrae texto del PDF.
- Guarda metadatos.
- Indexa el documento para búsqueda.
- Registra la actividad en la bitácora.
- Guarda el PDF en Storage privado.

Buenas prácticas:

- Usar nombres de cliente consistentes.
- Evitar cargar el mismo PDF varias veces.
- Completar vencimientos cuando sean conocidos.
- Revisar que el visor PDF abra luego de la carga.

## 6. Buscar documentos y cláusulas

En Inicio, usar la búsqueda para encontrar:

- Cláusulas específicas.
- Fechas.
- Partes.
- Montos.
- Riesgos.
- Obligaciones.
- Términos como rescisión, renovación, penalidad o confidencialidad.

Se pueden combinar filtros por:

- Cliente.
- Carpeta.
- Estado.
- Riesgo.
- Vencimiento.
- Categoría documental.

Al abrir un resultado, se accede al detalle del contrato para revisar el PDF, metadatos, tareas, obligaciones y auditoría.

## 7. Detalle del contrato

Ruta: `/contracts/[id]`. El expediente se organiza en **pestañas** para reducir el scroll:

| Pestaña | Contenido |
|---------|-----------|
| **Documento** | Resumen, metadatos editables, renovación |
| **Operación** | Ops documentales, obligaciones, tareas, hash SHA-256 |
| **Inteligencia** | Auditoría cognitiva, semáforo de riesgo, dashboard de análisis, historial de auditorías |
| **Consulta** | Consulta asistida y historial de preguntas |

El **visor PDF** permanece visible a la izquierda en pantallas amplias.

**Barra de acciones** (debajo del encabezado): consulta asistida, comparar con otro, exportar informe MD/HTML (si hay auditoría), archivar (según permisos).

**Breadcrumb:** Documentos → nombre del archivo.

Si el expediente no existe o no hay acceso, se muestra una pantalla **Expediente no encontrado** con enlace de vuelta a Documentos.

Si el visor indica que el PDF no está disponible, puede tratarse de un registro demo sin archivo físico o de un problema en Storage. La búsqueda puede seguir funcionando si el texto indexado existe.

## 8. Control de vencimientos

Vertia Legal usa fechas del contrato para detectar vencimientos próximos.

Estados habituales:

- Vigente.
- Por vencer.
- Vencido.
- Borrador.
- Sin determinar.

Recomendaciones:

- Completar fecha de inicio y vencimiento.
- Registrar renovación automática si existe.
- Cargar días de preaviso.
- Convertir vencimientos críticos en tareas.

## 9. Tareas y responsables

Las tareas sirven para dar seguimiento a:

- Vencimientos.
- Renovaciones.
- Revisión de cláusulas.
- Pendientes con clientes.
- Acciones internas.

Cada tarea puede tener:

- Título.
- Descripción.
- Responsable.
- Fecha de vencimiento.
- Prioridad.
- Estado.
- Contrato o cliente vinculado.

Estados:

- Pendiente.
- En curso.
- Completada.
- Cancelada.

Prioridades:

- Baja.
- Normal.
- Alta.
- Urgente.

En `/tareas`, usar:

- `Solo mis tareas` para ver pendientes asignados al usuario.
- Filtro por responsable si el nombre fue escrito distinto.
- Filtro por vencidas o próximos 7 días.
- Botón `Tomar` para pasar a en curso.
- Botón `Completar` cuando la tarea esté cerrada.

## 10. Cliente 360

Cliente 360 reúne la información de un cliente:

- Datos principales.
- Expedientes o asuntos.
- Documentos vinculados.
- Tareas abiertas.
- Obligaciones pendientes.
- Vencimientos próximos.
- Export de portfolio.

Uso recomendado:

1. Crear o revisar el cliente.
2. Vincular documentos al cliente.
3. Crear expedientes cuando haya asuntos diferenciados.
4. Usar portfolio para preparar reuniones o reportes.

## 11. Comparador contractual

### Para qué sirve

Comparar dos contratos de la misma organización para detectar:

- Cambios críticos (con nivel alto/medio/bajo).
- Diferencias operativas (fechas, partes, montos, etc.).
- Cláusulas agregadas, eliminadas o modificadas.
- Riesgo comparativo (scores 0–100 por documento).
- Recomendaciones de revisión.

Casos típicos: contrato vigente vs propuesta del proveedor, versión anterior vs renovación, modelo estándar vs contrato negociado.

### Cómo usarlo

Ruta: `/contracts/comparar`. También: `?base={id}` preselecciona el contrato base desde el detalle.

1. Filtrar la lista de contratos comparables (deben estar indexados, en análisis pendiente o ya auditados).
2. Elegir **Contrato base** (referencia: viejo, firmado o modelo).
3. Elegir **Contrato a comparar** (propuesta nueva o alternativa).
4. Usar **Intercambiar** o **Limpiar** si hace falta.
5. Pulsar **Comparar** y esperar el informe (puede tardar varios segundos).
6. Revisar secciones colapsables del informe.
7. Exportar **MD** o **HTML** si se necesita entregar o archivar.
8. Consultar **Historial de comparaciones** para reabrir informes anteriores.

No se puede comparar un documento consigo mismo. Ambos deben ser distintos.

### Qué incluye el informe

- Resumen ejecutivo.
- Riesgo comparativo (qué documento es más riesgoso y por qué).
- Cambios críticos con impacto y sugerencia.
- Diferencias operativas.
- Listas de cláusulas y recomendaciones.

El informe **no** es un diff palabra por palabra; prioriza señales legales y operativas relevantes.

### Permisos

Requiere el permiso `run_audit` (habitualmente `admin` y `lawyer`). Sin permiso, la pantalla muestra un aviso y no permite comparar.

### Historial

Las comparaciones quedan guardadas por organización. En el panel **Historial de comparaciones** se ve fecha, actor, resumen y botón **Reabrir informe**.

La bitácora registra la acción `contract.compared`.

## 12. Auditoría cognitiva

La auditoría cognitiva se ejecuta desde la pestaña **Inteligencia** del detalle del contrato.

Sirve para obtener:

- Resumen ejecutivo.
- Score de riesgo.
- Cláusulas riesgosas.
- Motivos de alerta.
- Sugerencias de revisión.
- Metadatos inferidos.

Importante:

- No se ejecuta automáticamente al subir documentos.
- Debe usarse cuando el documento ya fue indexado.
- Puede consumir cuota del proveedor de IA.
- El resultado debe ser validado por el profesional responsable.

### Consulta asistida

Disponible en la pestaña **Consulta** del detalle (y en resultados de búsqueda en Inicio). Permite hacer preguntas en lenguaje natural sobre el texto indexado del documento. Requiere permiso `run_assisted_query`. Las respuestas deben validarse contra el PDF original.

## 13. Reportes

Desde `/reportes` se pueden generar entregables.

### Portfolio por cliente

Incluye:

- Resumen del cliente.
- Cantidad de expedientes.
- Vencimientos próximos.
- Obligaciones pendientes.
- Tareas abiertas.
- Listado de documentos.

Formatos:

- Markdown (`.md`).
- HTML imprimible.

### Informe de auditoría

Requiere que el contrato tenga auditoría cognitiva ejecutada.

Incluye:

- Datos del documento.
- Estado y vencimiento.
- Score de riesgo.
- Resumen ejecutivo.
- Cláusulas de riesgo.
- Sugerencias.
- Metadatos extraídos.

El HTML imprimible puede abrirse en navegador y guardarse como PDF desde la opción de impresión.

### Informe comparativo

Se genera desde el **Comparador contractual** (botones Exportar MD / Exportar HTML), no desde la pantalla Reportes.

Incluye resumen ejecutivo, riesgo comparativo, cambios críticos, diferencias operativas y recomendaciones entre el contrato base y el comparado.

## 14. Notificaciones por email

Si el administrador configuró SMTP, Vertia Legal puede enviar un resumen operativo con:

- Documentos por vencer.
- Tareas próximas o vencidas.
- Obligaciones pendientes.

Desde `/reportes`, un administrador puede:

- Ver vista previa.
- Enviar resumen del día.
- Reenviar forzadamente.

El sistema evita reenviar el mismo resumen al mismo destinatario durante el mismo día, salvo que se fuerce.

## 15. Bitácora

La bitácora registra eventos relevantes:

- Carga de documentos.
- Actualización de documentos.
- Archivado.
- Auditoría cognitiva.
- Comparación contractual.
- Exportes.
- Creación o actualización de clientes.
- Creación o cierre de tareas.
- Envío de notificaciones.

Sirve para trazabilidad operativa y control interno.

## 16. Permisos por rol (resumen)

| Acción | admin | lawyer | accountant | assistant |
|--------|-------|--------|------------|-----------|
| Cargar documentos | Sí | Sí | No | Sí |
| Editar metadatos / archivar | Sí | Sí | No | No |
| Auditoría y comparador | Sí | Sí | No | No |
| Consulta asistida | Sí | Sí | Sí | No |
| Tareas | Sí | Sí | Sí | Sí |
| Exportar reportes | Sí | Sí | Sí | No |
| Mi estudio (usuarios/config) | Sí | No | No | No |
| Plataforma SaaS | Solo platform admin | — | — | — |

Los botones no disponibles para el rol pueden ocultarse en la interfaz.

## 17. Buenas prácticas

Para mantener la calidad del repositorio:

- Usar nombres de cliente consistentes.
- Evitar duplicar documentos.
- Completar metadatos clave.
- Revisar vencimientos luego de cada carga.
- Crear tareas para todo vencimiento crítico.
- Usar el comparador antes de firmar renovaciones o propuestas de proveedores.
- Validar informes (auditoría y comparativo) antes de enviarlos al cliente.
- Ejecutar IA solo cuando aporte valor.
- Mantener usuarios individuales.
- No compartir credenciales.

## 18. Errores comunes

### El PDF no abre

Posibles causas:

- El contrato proviene del seed demo y no tiene archivo físico.
- El archivo no está en Storage.
- Hubo un error durante la carga.

Acción recomendada: volver a subir el PDF real o revisar el bucket `contracts`.

### La búsqueda no encuentra una cláusula

Posibles causas:

- El PDF escaneado no tuvo OCR suficiente.
- La cláusula usa otra terminología.
- El documento no terminó de indexarse.

Acción recomendada: probar términos alternativos y revisar si el texto fue extraído.

### No puedo exportar auditoría

Causa habitual: el contrato todavía no tiene auditoría cognitiva.

Acción recomendada: abrir el contrato y ejecutar auditoría antes de exportar.

### No llegan emails

Posibles causas:

- SMTP no configurado.
- Credenciales incorrectas.
- Proveedor bloquea el envío.
- No hay destinatarios configurados.

Acción recomendada: revisar `docs/notifications-setup.md`.

### No puedo comparar contratos

Posibles causas:

- El rol no tiene permiso `run_audit`.
- Los documentos no están indexados (solo aparecen como comparables los indexados, pendientes de análisis o auditados).
- Se eligió el mismo documento en base y comparado.
- Error de red o de base de datos (historial vacío tras migración pendiente).

Acción recomendada: verificar permisos, estado de indexación y que existan al menos dos expedientes distintos comparables.

### No aparece el historial de comparaciones

Causa habitual: la tabla de comparaciones no está migrada en el entorno (migración `018_contract_comparisons`).

Acción recomendada: contactar al administrador técnico o revisar Supabase en el entorno correspondiente.

### Expediente no encontrado

Causa habitual: ID incorrecto, documento archivado o sin acceso en la organización activa.

Acción recomendada: volver a Documentos y abrir el expediente desde el listado.

## 19. Criterio de uso profesional

Vertia Legal ayuda a ordenar y acelerar el trabajo, pero el criterio profesional sigue siendo responsabilidad del usuario.

Antes de enviar un informe o tomar una decisión:

- Revisar el documento original.
- Validar metadatos.
- Confirmar vencimientos.
- Leer cláusulas críticas.
- Corregir cualquier dato incompleto.
- Dejar registrada la tarea o acción correspondiente.

## 20. Flujo recomendado diario

Al iniciar el día:

1. Entrar a `/tareas`.
2. Revisar vencidas y urgentes.
3. Revisar próximas a 7 días.
4. Tomar tareas propias.
5. Abrir documentos vinculados.
6. Revisar alertas en Inicio.

Durante el trabajo:

1. Buscar documentos desde Inicio o filtrar en Documentos.
2. Crear tareas ante hallazgos.
3. Actualizar metadatos cuando falten.
4. Ejecutar auditoría solo si es necesaria.
5. Comparar versiones contractuales cuando llegue una propuesta nueva o renovación.

Al cerrar el día:

1. Completar tareas cerradas.
2. Revisar bitácora si hubo actividad sensible.
3. Exportar informes pendientes (auditoría, portfolio o comparativo).
4. Enviar resumen por email si corresponde.

### Flujo: negociación con proveedor

1. Cargar o localizar contrato vigente y propuesta nueva en Documentos.
2. Abrir **Comparar contratos** (o **Comparar con otro** desde el vigente).
3. Ejecutar comparación y revisar cambios críticos.
4. Crear tareas para puntos que requieran seguimiento.
5. Exportar informe HTML para revisión interna o cliente.
