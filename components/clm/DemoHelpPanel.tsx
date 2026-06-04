"use client";

import Link from "next/link";
import { useEffect } from "react";

interface DemoHelpPanelProps {
  open: boolean;
  onClose: () => void;
}

const QUICK_ACTIONS = [
  { label: "Ir a Inicio", href: "/" },
  { label: "Ver Clientes", href: "/clients" },
  { label: "Ver Documentos", href: "/contracts" },
  { label: "Revisar Tareas", href: "/tareas" },
  { label: "Generar Reportes", href: "/reportes" },
] as const;

const SYSTEM_MAP = [
  {
    area: "Inicio",
    description: "Punto de partida para cargar, buscar y ver alertas.",
  },
  {
    area: "Clientes",
    description: "Cartera y vista 360 por cliente.",
  },
  {
    area: "Documentos",
    description: "Listado de PDFs y expedientes indexados.",
  },
  {
    area: "Tareas",
    description: "Bandeja diaria de pendientes y vencimientos.",
  },
  {
    area: "Reportes",
    description: "Informes para cliente y exportes operativos.",
  },
] as const;

const FIRST_DAY_STEPS = [
  "Entrar a Inicio y cargar un PDF real.",
  "Buscar una cláusula o nombre de parte en el documento.",
  "Abrir el expediente y revisar PDF, metadatos y vencimiento.",
  "Crear una tarea para cualquier seguimiento pendiente.",
  "Generar un informe HTML de prueba desde Reportes.",
] as const;

const WORKFLOWS = [
  {
    title: "Cargar un contrato o documento",
    steps: [
      "Ir a Inicio.",
      "Completar cliente, carpeta, tipo y categoría documental.",
      "Subir el PDF.",
      "Verificar que quede indexado y con hash SHA-256.",
    ],
  },
  {
    title: "Buscar una cláusula o antecedente",
    steps: [
      "Usar Buscar en documentos desde Inicio.",
      "Combinar texto libre con filtros por cliente, estado, riesgo o vencimiento.",
      "Abrir el expediente y revisar el fragmento encontrado.",
      "Usar la consulta jurídica asistida si necesitás una lectura contextual.",
    ],
  },
  {
    title: "Controlar vencimientos",
    steps: [
      "Revisar el resumen de Inicio y la columna de alertas.",
      "Entrar al contrato o al Cliente 360.",
      "Crear una tarea con responsable y fecha.",
      "Marcarla como completada cuando el seguimiento esté cerrado.",
    ],
  },
  {
    title: "Preparar un informe para cliente",
    steps: [
      "Abrir Cliente 360 o el detalle del contrato.",
      "Verificar metadatos, obligaciones y auditoría.",
      "Exportar HTML imprimible o Markdown.",
      "Revisar el contenido antes de enviarlo al cliente.",
    ],
  },
] as const;

const FAQ = [
  {
    q: "¿La IA analiza todos los documentos automáticamente?",
    a: "No. La auditoría cognitiva se ejecuta bajo demanda desde el detalle del contrato. La carga solo indexa texto y metadatos básicos.",
  },
  {
    q: "¿Qué pasa si el visor PDF no abre?",
    a: "Puede faltar el archivo en Storage o haber vencido la URL firmada. El texto indexado puede seguir disponible para búsqueda, pero conviene volver a subir el PDF si el expediente debe conservar visor.",
  },
  {
    q: "¿Qué significan los estados del contrato?",
    a: "Vigente, por vencer, vencido, borrador o sin determinar indican el ciclo de vida según fechas cargadas o extraídas.",
  },
  {
    q: "¿Puedo usarlo para documentos contables o societarios?",
    a: "Sí. Clasificá el documento como societario, impositivo, poder, laboral u otra categoría para filtrarlo mejor.",
  },
  {
    q: "¿El informe reemplaza la revisión profesional?",
    a: "No. El informe ayuda a ordenar riesgos, obligaciones y vencimientos, pero debe ser validado por el profesional responsable.",
  },
] as const;

export function DemoHelpPanel({ open, onClose }: DemoHelpPanelProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar ayuda"
        className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-panel-title"
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-corp-border bg-corp-panel shadow-corp-md"
      >
        <div className="flex items-center justify-between border-b border-corp-border px-5 py-4">
          <div>
            <p className="corp-label text-cyan-700">Centro de ayuda</p>
            <h2 id="help-panel-title" className="text-lg font-semibold text-corp-text">
              Guía de uso para el estudio
            </h2>
          </div>
          <button type="button" onClick={onClose} className="corp-btn text-sm">
            Cerrar
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          <section className="rounded-corp border border-cyan-200 bg-cyan-50 p-4">
            <p className="text-sm font-semibold text-cyan-950">
              ¿Para qué sirve Vertia Legal?
            </p>
            <p className="mt-2 text-sm leading-relaxed text-cyan-950">
              Vertia Legal centraliza documentos legales y contables, permite buscar
              cláusulas, controlar vencimientos, asignar tareas y generar
              informes para clientes. La IA es una asistencia bajo demanda, no
              reemplaza la revisión profesional.
            </p>
          </section>

          <section>
            <p className="corp-label mb-3">Mapa del sistema</p>
            <div className="space-y-2">
              {SYSTEM_MAP.map((item) => (
                <div
                  key={item.area}
                  className="rounded-corp border border-corp-border bg-white/70 px-3 py-2"
                >
                  <p className="text-sm font-semibold text-corp-text">{item.area}</p>
                  <p className="mt-1 text-xs text-corp-muted">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <p className="corp-label mb-3">Tu primer día en Vertia Legal</p>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-corp-muted">
              {FIRST_DAY_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <section>
            <p className="corp-label mb-3">Accesos rápidos</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  onClick={onClose}
                  className="rounded-corp border border-corp-border bg-white/70 px-3 py-2 text-sm font-medium text-corp-text transition hover:border-cyan-300 hover:bg-cyan-50"
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </section>

          <section>
            <p className="corp-label mb-3">Tareas frecuentes</p>
            <div className="space-y-3">
              {WORKFLOWS.map((workflow) => (
                <details
                  key={workflow.title}
                  className="rounded-corp border border-corp-border bg-white/70 p-3"
                >
                  <summary className="cursor-pointer text-sm font-semibold text-corp-text">
                    {workflow.title}
                  </summary>
                  <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-corp-muted">
                    {workflow.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </details>
              ))}
            </div>
          </section>

          <section>
            <p className="corp-label mb-3">Buenas prácticas</p>
            <ul className="space-y-2 text-sm text-corp-muted">
              <li>
                Usá nombres de cliente consistentes para evitar expedientes
                duplicados.
              </li>
              <li>
                Completá tipo contractual, partes y vencimiento antes de
                exportar informes.
              </li>
              <li>
                Convertí cada vencimiento crítico en una tarea con responsable.
              </li>
              <li>
                Ejecutá auditoría cognitiva solo cuando el documento ya esté
                indexado y sea relevante.
              </li>
              <li>
                Revisá la bitácora cuando haya dudas sobre quién modificó o
                exportó información.
              </li>
            </ul>
          </section>

          <section>
            <p className="corp-label mb-3">Preguntas frecuentes</p>
            <div className="space-y-3">
              {FAQ.map((item) => (
                <details
                  key={item.q}
                  className="rounded-corp border border-corp-border bg-white/70 p-3"
                >
                  <summary className="cursor-pointer text-sm font-semibold text-corp-text">
                    {item.q}
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-corp-muted">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </section>

          <section className="rounded-corp border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-950">
              Seguridad y confidencialidad
            </p>
            <p className="mt-2 text-sm leading-relaxed text-amber-950">
              Los documentos deben tratarse como información confidencial. Usá
              usuarios y permisos adecuados en producción, revisá accesos y no
              compartas informes sin validación del responsable del caso.
            </p>
          </section>
        </div>
      </aside>
    </>
  );
}
