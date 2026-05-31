# Dossier de producto — Vertia Legal

Vertia Legal es una plataforma SaaS de control documental inteligente para estudios jurídicos, contables y equipos legales corporativos. Centraliza documentos contractuales, permite búsquedas avanzadas, controla vencimientos, organiza tareas y ejecuta auditoría cognitiva bajo demanda con IA.

El objetivo del desarrollo es reducir fricción operativa, mejorar trazabilidad y dar una capa profesional de inteligencia documental sin reemplazar el criterio del abogado, contador o responsable legal.

## 1. Qué problema resuelve

En estudios y áreas legales, la información contractual suele estar dispersa en carpetas, correos, PDFs y planillas. Eso genera riesgos:

- Documentos difíciles de encontrar.
- Vencimientos no controlados.
- Tareas sin responsable claro.
- Informes manuales lentos.
- Revisión contractual dependiente de memoria humana.
- Falta de trazabilidad sobre quién hizo qué.

Vertia Legal organiza esa operación en un único entorno seguro.

## 2. Qué incluye hoy el desarrollo

### Repositorio documental

- Carga de PDFs.
- Storage privado en Supabase.
- Cálculo de hash SHA-256 para integridad.
- Metadatos contractuales.
- Categorías documentales.
- Estado de procesamiento.
- Reemplazo de PDF con versionado.

### Indexación y búsqueda

- Extracción de texto de PDFs digitales.
- Detección de PDFs con texto insuficiente.
- Búsqueda por texto y filtros.
- Export de resultados.
- Soporte para cliente, carpeta, categoría, vencimiento y estado.

### Cliente 360

- Ficha centralizada por cliente.
- Expedientes o asuntos.
- Contratos vinculados.
- Tareas abiertas.
- Obligaciones pendientes.
- Vencimientos próximos.
- Export de portfolio.

### Gestión de tareas

- Tareas vinculadas a contratos o clientes.
- Responsable por usuario.
- Prioridad y fecha de vencimiento.
- Estados: pendiente, en curso, completada, cancelada.
- Vista “Mis tareas”.
- Acciones rápidas para tomar, completar o cancelar.

### Control de vencimientos

- Fechas de inicio y finalización.
- Renovación automática.
- Días de preaviso.
- Alertas de vencimiento.
- Estados de ciclo de vida.

### Auditoría cognitiva con IA

- Auditoría bajo demanda, no automática al subir documentos.
- Análisis con Groq / Llama.
- Resumen ejecutivo.
- Score de riesgo.
- Cláusulas críticas.
- Sugerencias de revisión.
- Persistencia del historial de auditorías.

### Consulta asistida

- Chat sobre documentos indexados.
- Respuestas basadas en texto contractual disponible.
- Registro de consultas asociadas al contrato.
- Uso orientado a apoyo profesional, no reemplazo legal.

### Reportes profesionales

- Export de portfolio por cliente.
- Export de informe de auditoría.
- Formato Markdown.
- HTML imprimible.
- Branding por organización.
- Disclaimer legal configurable.

### Notificaciones

- Digest operativo por email si SMTP está configurado.
- Alertas por vencimientos, tareas y obligaciones.
- Endpoint protegido para cron.

### Bitácora y trazabilidad

- Registro de carga de documentos.
- Actualizaciones.
- Auditorías.
- Exportes.
- Tareas.
- Actividad operativa relevante.

## 3. Modelo SaaS multi-organización

Vertia Legal ya opera con una estructura multi-tenant.

### Plataforma SaaS

Panel interno para usuarios Vertia.

Permite:

- Crear estudios clientes.
- Definir plan: `pilot`, `professional`, `enterprise`.
- Definir estado: `trial`, `active`, `suspended`, `cancelled`.
- Crear owner inicial.
- Ver métricas agregadas.
- Suspender o reactivar organizaciones.

La plataforma no expone PDFs ni texto contractual de clientes.

### Mi estudio

Panel del owner o admin de cada organización.

Permite:

- Configurar nombre, contacto, logo y textos legales.
- Crear usuarios internos.
- Administrar el equipo del estudio activo.

### Organización activa

Cada usuario trabaja dentro de una organización activa. Si pertenece a varias, el sistema permite seleccionar con qué estudio operar.

Todos los clientes, documentos, tareas y reportes se filtran por organización.

## 4. Roles disponibles

| Rol | Descripción |
|-----|-------------|
| Usuario Vertia / Platform admin | Crea y administra organizaciones SaaS |
| Owner / Admin del estudio | Administra su organización activa |
| Lawyer | Usuario legal operativo |
| Accountant | Usuario contable/fiscal |
| Assistant | Usuario de carga y operación documental |

La separación entre platform admin y admin del estudio evita mezclar permisos comerciales de Vertia con permisos operativos del cliente.

## 5. Seguridad y privacidad

El desarrollo incorpora:

- Autenticación con Supabase Auth.
- Rutas protegidas por middleware.
- Storage privado.
- RLS por organización.
- Validaciones de scope en APIs.
- Hash SHA-256 por documento.
- Separación entre plataforma y datos contractuales.
- Auditoría de acciones de plataforma.
- No entrenamiento público con documentos del cliente.

Principio central: la plataforma administra organizaciones y métricas, pero no lee contenido contractual por defecto.

## 6. Arquitectura técnica

### Frontend y backend

- Next.js 15 con App Router.
- TypeScript.
- APIs server-side en el mismo proyecto.
- UI tipo war-room / HUD profesional.

### Base de datos y storage

- Supabase PostgreSQL.
- Supabase Auth.
- Supabase Storage privado.
- RLS por organización.
- Tablas relacionales para contratos, clientes, tareas, obligaciones, auditorías y organizaciones.

### IA

- Groq SDK.
- Modelo principal: `llama-3.3-70b-versatile`.
- Respuestas estructuradas en JSON para auditoría cognitiva.
- IA bajo demanda para controlar costos y exposición.

### PDFs

- Extracción de texto local.
- Detección de PDFs escaneados o con texto insuficiente.
- OCR server-side desaconsejado en Vercel Hobby.
- Recomendación operativa: PDFs digitales con texto copiable.

## 7. Flujo operativo recomendado

### Alta de un estudio cliente

1. Usuario Vertia entra a Plataforma SaaS.
2. Crea organización.
3. Crea owner inicial.
4. Owner ingresa y configura Mi estudio.
5. Owner crea usuarios internos.
6. Equipo empieza a cargar documentos y operar.

### Uso diario

1. Revisar tareas.
2. Cargar o buscar documentos.
3. Controlar vencimientos.
4. Crear tareas ante riesgos o pendientes.
5. Ejecutar auditoría cognitiva cuando aporte valor.
6. Exportar reportes revisables.

## 8. Estado actual del producto

Vertia Legal se encuentra en una etapa de producto profesional inicial:

- Flujo documental principal implementado.
- SaaS multi-organización implementado.
- Panel de plataforma implementado.
- Admin del estudio implementado.
- Reportes, tareas, búsqueda y auditoría funcionales.
- Build productivo en Vercel funcionando.

## 9. Límites actuales

El producto tiene límites conocidos:

- PDFs escaneados requieren OCR externo o un entorno dedicado.
- En Vercel Hobby se recomienda PDF digital menor al límite operativo.
- Permisos por rol pueden seguir refinándose.
- Invitaciones por email para owners y usuarios todavía pueden automatizarse.
- Backups, monitoreo y runbooks deben mantenerse operativos en producción.

## 10. Diferenciadores

- Plataforma SaaS multi-estudio en una sola implementación.
- Separación clara entre Vertia, owner del estudio y usuarios operativos.
- Auditoría cognitiva bajo demanda, no invasiva.
- Privacidad: plataforma sin acceso contractual por defecto.
- Trazabilidad documental con hash.
- Reportes profesionales con branding del estudio.
- Enfoque en soberanía tecnológica y reducción de OPEX.

## 11. Demo sugerida

Para mostrar el producto:

1. Iniciar sesión como usuario Vertia.
2. Mostrar Plataforma SaaS y alta de una organización.
3. Crear owner inicial.
4. Entrar como owner.
5. Configurar Mi estudio.
6. Crear un usuario operativo.
7. Cargar un PDF digital.
8. Buscar una cláusula.
9. Abrir detalle del contrato.
10. Crear tarea.
11. Ejecutar auditoría cognitiva.
12. Exportar reporte.

Este recorrido muestra el valor completo: alta SaaS, operación del estudio, inteligencia documental y salida profesional.

