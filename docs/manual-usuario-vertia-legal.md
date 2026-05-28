# Manual de usuario — Vertia Legal

Vertia Legal es una plataforma de control documental inteligente para estudios jurídicos, contables y equipos legales. Su objetivo es centralizar documentos, facilitar búsquedas, controlar vencimientos, asignar tareas y generar informes profesionales.

La inteligencia artificial funciona como asistencia bajo demanda. No reemplaza la revisión profesional ni toma decisiones legales por el usuario.

## 1. Para qué sirve Vertia Legal

Vertia Legal ayuda a responder preguntas operativas frecuentes:

- ¿Dónde está el contrato o documento que necesito?
- ¿Qué documentos vencen pronto?
- ¿Qué tareas tiene pendiente el equipo?
- ¿Qué cláusulas tienen riesgo o requieren revisión?
- ¿Qué documentos están asociados a un cliente?
- ¿Qué informe puedo entregar al cliente?

El sistema combina:

- Repositorio documental.
- Indexación de texto de PDFs.
- Búsqueda en documentos.
- Control de vencimientos.
- Cliente 360.
- Tareas y responsables.
- Bitácora de actividad.
- Auditoría cognitiva bajo demanda.
- Exportes profesionales.

## 2. Qué no hace

Vertia Legal no debe interpretarse como:

- Un reemplazo del abogado, contador o responsable profesional.
- Un sistema de firma digital.
- Un gestor judicial completo.
- Un ERP contable.
- Un CLM enterprise completo con aprobaciones complejas, redlining y negociación colaborativa.

El foco actual es el control documental inteligente y operativo.

## 3. Acceso al sistema

Ingresar desde:

```text
/login
```

Usar correo y contraseña asignados por el administrador.

En la barra superior se muestra:

- Nombre del usuario.
- Rol.
- Botón `Salir`.
- Acceso al centro de ayuda.

Roles disponibles:

- `admin`: administración y configuración.
- `lawyer`: abogado/a.
- `accountant`: contador/a.
- `assistant`: asistente o usuario operativo.

En el piloto todos los roles comparten el mismo repositorio. Los roles preparan permisos más finos para etapas posteriores.

## 4. Pantallas principales

### Inicio

Es la pantalla principal de trabajo y el punto de partida. Permite:

- Cargar documentos.
- Buscar documentos y cláusulas.
- Ver indicadores ejecutivos.
- Revisar alertas de vencimiento.
- Consultar la bitácora reciente.

### Clientes

Permite gestionar el Cliente 360:

- Datos del cliente.
- Expedientes o asuntos.
- Documentos vinculados.
- Tareas asociadas.
- Reportes de portfolio.

### Documentos

Muestra el registro documental completo:

- Nombre del archivo.
- Cliente.
- Carpeta.
- Estado.
- Vencimiento.
- Acceso al detalle del expediente.

### Tareas

Es la bandeja operativa del usuario:

- Mis tareas.
- Tareas vencidas.
- Tareas urgentes.
- Filtros por responsable, estado, prioridad y fecha.
- Acciones rápidas para tomar, completar o cancelar.

### Reportes

Permite generar:

- Portfolio por cliente.
- Informe de auditoría por contrato.
- HTML imprimible.
- Markdown.
- Resumen de alertas por email si SMTP está configurado.

## 5. Cargar un documento

Desde Inicio:

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

El detalle concentra la información operativa del documento:

- Visor PDF.
- Descarga del archivo.
- Metadatos.
- Estado del ciclo de vida.
- Renovación.
- Obligaciones.
- Tareas.
- Hash SHA-256.
- Auditoría cognitiva.
- Exportes.

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

## 11. Auditoría cognitiva

La auditoría cognitiva se ejecuta desde el detalle del contrato.

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

## 12. Reportes

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

## 13. Notificaciones por email

Si el administrador configuró SMTP, Vertia Legal puede enviar un resumen operativo con:

- Documentos por vencer.
- Tareas próximas o vencidas.
- Obligaciones pendientes.

Desde `/reportes`, un administrador puede:

- Ver vista previa.
- Enviar resumen del día.
- Reenviar forzadamente.

El sistema evita reenviar el mismo resumen al mismo destinatario durante el mismo día, salvo que se fuerce.

## 14. Bitácora

La bitácora registra eventos relevantes:

- Carga de documentos.
- Actualización de documentos.
- Archivado.
- Auditoría cognitiva.
- Exportes.
- Creación o actualización de clientes.
- Creación o cierre de tareas.
- Envío de notificaciones.

Sirve para trazabilidad operativa y control interno.

## 15. Buenas prácticas

Para mantener la calidad del repositorio:

- Usar nombres de cliente consistentes.
- Evitar duplicar documentos.
- Completar metadatos clave.
- Revisar vencimientos luego de cada carga.
- Crear tareas para todo vencimiento crítico.
- Validar informes antes de enviarlos al cliente.
- Ejecutar IA solo cuando aporte valor.
- Mantener usuarios individuales.
- No compartir credenciales.

## 16. Errores comunes

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

## 17. Criterio de uso profesional

Vertia Legal ayuda a ordenar y acelerar el trabajo, pero el criterio profesional sigue siendo responsabilidad del usuario.

Antes de enviar un informe o tomar una decisión:

- Revisar el documento original.
- Validar metadatos.
- Confirmar vencimientos.
- Leer cláusulas críticas.
- Corregir cualquier dato incompleto.
- Dejar registrada la tarea o acción correspondiente.

## 18. Flujo recomendado diario

Al iniciar el día:

1. Entrar a `/tareas`.
2. Revisar vencidas y urgentes.
3. Revisar próximas a 7 días.
4. Tomar tareas propias.
5. Abrir documentos vinculados.

Durante el trabajo:

1. Buscar documentos desde Inicio.
2. Crear tareas ante hallazgos.
3. Actualizar metadatos cuando falten.
4. Ejecutar auditoría solo si es necesaria.

Al cerrar el día:

1. Completar tareas cerradas.
2. Revisar bitácora si hubo actividad sensible.
3. Exportar informes pendientes.
4. Enviar resumen por email si corresponde.
