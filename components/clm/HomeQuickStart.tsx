"use client";

import Link from "next/link";

interface HomeQuickStartProps {
  onScrollToSearch: () => void;
  onScrollToUpload: () => void;
}

const ACTIONS = [
  {
    id: "upload",
    title: "Cargar documento",
    description: "Subí un PDF con cliente, carpeta y categoría.",
  },
  {
    id: "search",
    title: "Buscar en documentos",
    description: "Encontrá cláusulas, partes, montos o vencimientos.",
  },
  {
    id: "tasks",
    title: "Revisar mis tareas",
    description: "Mira vencimientos y pendientes del equipo.",
    href: "/tareas",
  },
  {
    id: "reports",
    title: "Generar informe",
    description: "Exporta portfolios e informes imprimibles.",
    href: "/reportes",
  },
] as const;

export function HomeQuickStart({
  onScrollToSearch,
  onScrollToUpload,
}: HomeQuickStartProps) {
  function handleClick(actionId: string) {
    if (actionId === "upload") {
      onScrollToUpload();
      return;
    }
    if (actionId === "search") {
      onScrollToSearch();
    }
  }

  return (
    <section className="corp-panel ops-panel-accent p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="corp-label text-cyan-700">Empezar aquí</p>
          <h2 className="mt-1 text-xl font-semibold text-corp-text">
            ¿Qué querés hacer primero?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-corp-muted">
            Usa estas acciones como punto de partida. Si es tu primera vez,
            abrí Ayuda para ver el recorrido recomendado.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {ACTIONS.map((action) => {
          const className =
            "rounded-corp border border-corp-border bg-white/75 p-4 text-left transition hover:border-cyan-300 hover:bg-cyan-50/80";

          if ("href" in action) {
            return (
              <Link key={action.id} href={action.href} className={className}>
                <p className="text-sm font-semibold text-corp-text">
                  {action.title}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-corp-muted">
                  {action.description}
                </p>
              </Link>
            );
          }

          return (
            <button
              key={action.id}
              type="button"
              onClick={() => handleClick(action.id)}
              className={className}
            >
              <p className="text-sm font-semibold text-corp-text">
                {action.title}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-corp-muted">
                {action.description}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
