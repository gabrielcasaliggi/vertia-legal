"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ContractTasksPanel } from "@/components/clm/ContractTasksPanel";
import { PageHeader } from "@/components/clm/PageHeader";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  taskPriorityBadgeClass,
  taskStatusBadgeClass,
  type ContractTask,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/contracts/tasks";
import type { UserProfile } from "@/lib/auth/session";

type DueFilter = "all" | "overdue" | "today" | "week" | "no_due";

interface TasksWorkspaceProps {
  profile: UserProfile | null;
}

const STATUS_OPTIONS: Array<"all" | TaskStatus> = [
  "all",
  "pending",
  "in_progress",
  "completed",
  "cancelled",
];

const PRIORITY_OPTIONS: Array<"all" | TaskPriority> = [
  "all",
  "urgent",
  "high",
  "normal",
  "low",
];

const DUE_LABELS: Record<DueFilter, string> = {
  all: "Todos los plazos",
  overdue: "Vencidas",
  today: "Vencen hoy",
  week: "Próximos 7 días",
  no_due: "Sin fecha",
};

function formatDate(value: string | null): string {
  if (!value) {
    return "Sin fecha";
  }
  return new Date(value).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function daysUntil(value: string | null): number | null {
  if (!value) {
    return null;
  }
  return Math.ceil((new Date(value).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function dueTone(task: ContractTask): string {
  const days = daysUntil(task.due_at);
  if (task.status === "completed" || task.status === "cancelled") {
    return "text-slate-500";
  }
  if (days === null) {
    return "text-corp-muted";
  }
  if (days < 0) {
    return "text-red-700";
  }
  if (days <= 2) {
    return "text-amber-700";
  }
  return "text-corp-muted";
}

function dueLabel(task: ContractTask): string {
  const days = daysUntil(task.due_at);
  if (days === null) {
    return "Sin vencimiento";
  }
  if (days < 0) {
    return `Vencida hace ${Math.abs(days)} día(s)`;
  }
  if (days === 0) {
    return "Vence hoy";
  }
  return `Vence en ${days} día(s)`;
}

export function TasksWorkspace({ profile }: TasksWorkspaceProps) {
  const [tasks, setTasks] = useState<ContractTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mineOnly, setMineOnly] = useState(Boolean(profile));
  const [query, setQuery] = useState("");
  const [assignee, setAssignee] = useState("");
  const [status, setStatus] = useState<"all" | TaskStatus>("all");
  const [priority, setPriority] = useState<"all" | TaskPriority>("all");
  const [due, setDue] = useState<DueFilter>("all");

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (mineOnly) {
      params.set("mine", "1");
    }
    if (query.trim()) {
      params.set("q", query.trim());
    }
    if (assignee.trim()) {
      params.set("assignee", assignee.trim());
    }
    if (status !== "all") {
      params.set("status", status);
    } else if (!mineOnly) {
      params.set("open", "1");
    }
    if (priority !== "all") {
      params.set("priority", priority);
    }
    if (due !== "all") {
      params.set("due", due);
    }

    const response = await fetch(`/api/tasks?${params.toString()}`);
    const payload = await response.json();
    if (response.ok) {
      setTasks(payload.tasks ?? []);
    } else {
      setError(payload.error ?? "No se pudieron cargar las tareas.");
      setTasks([]);
    }
    setIsLoading(false);
  }, [assignee, due, mineOnly, priority, query, status]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const stats = useMemo(() => {
    const open = tasks.filter(
      (task) => task.status === "pending" || task.status === "in_progress",
    ).length;
    const overdue = tasks.filter((task) => {
      const days = daysUntil(task.due_at);
      return days !== null && days < 0 && task.status !== "completed";
    }).length;
    const urgent = tasks.filter((task) => task.priority === "urgent").length;
    const completed = tasks.filter((task) => task.status === "completed").length;

    return { open, overdue, urgent, completed };
  }, [tasks]);

  async function updateStatus(
    task: ContractTask,
    nextStatus: TaskStatus,
    take = false,
  ) {
    setIsUpdatingId(task.id);
    setError(null);

    const response = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: nextStatus,
        ...(take ? { take: true } : {}),
      }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "No se pudo actualizar la tarea.");
    }

    await loadTasks();
    setIsUpdatingId(null);
  }

  function resetFilters() {
    setMineOnly(Boolean(profile));
    setQuery("");
    setAssignee("");
    setStatus("all");
    setPriority("all");
    setDue("all");
  }

  return (
    <div className="min-h-screen bg-corp-bg">
      <PageHeader
        label="Operaciones"
        title="Mis tareas"
        subtitle="Acá ves lo que te corresponde, lo vencido y lo que necesita seguimiento."
        actions={
          profile ? (
            <span className="rounded-corp border border-cyan-300/50 bg-cyan-50 px-3 py-1.5 text-xs font-medium text-cyan-900">
              {profile.full_name.trim() || profile.email}
            </span>
          ) : undefined
        }
      />

      <main className="mx-auto grid max-w-[1400px] gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <section className="space-y-5">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="corp-panel p-4">
              <p className="corp-label">Abiertas</p>
              <p className="mt-2 text-2xl font-semibold text-corp-text">{stats.open}</p>
            </div>
            <div className="corp-panel p-4">
              <p className="corp-label text-red-700">Vencidas</p>
              <p className="mt-2 text-2xl font-semibold text-red-700">{stats.overdue}</p>
            </div>
            <div className="corp-panel p-4">
              <p className="corp-label text-amber-700">Urgentes</p>
              <p className="mt-2 text-2xl font-semibold text-amber-700">{stats.urgent}</p>
            </div>
            <div className="corp-panel p-4">
              <p className="corp-label text-emerald-700">Completadas</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-700">
                {stats.completed}
              </p>
            </div>
          </div>

          <section className="corp-panel p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="corp-label text-cyan-700">Filtros</p>
                <p className="mt-1 text-sm text-corp-muted">
                  Por defecto se muestran tus tareas si hay sesión activa.
                </p>
              </div>
              <button type="button" className="corp-btn" onClick={resetFilters}>
                Limpiar filtros
              </button>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-5">
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar tarea..."
                className="corp-input lg:col-span-2"
              />
              <input
                value={assignee}
                onChange={(event) => setAssignee(event.target.value)}
                placeholder="Responsable..."
                className="corp-input"
              />
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as "all" | TaskStatus)}
                className="corp-input"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option === "all" ? "Todos los estados" : TASK_STATUS_LABELS[option]}
                  </option>
                ))}
              </select>
              <select
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as "all" | TaskPriority)
                }
                className="corp-input"
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option === "all" ? "Todas las prioridades" : TASK_PRIORITY_LABELS[option]}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-corp-text">
                <input
                  type="checkbox"
                  checked={mineOnly}
                  onChange={(event) => setMineOnly(event.target.checked)}
                  className="h-4 w-4 rounded border-corp-border text-cyan-600"
                />
                Solo mis tareas
              </label>
              <select
                value={due}
                onChange={(event) => setDue(event.target.value as DueFilter)}
                className="corp-input w-auto min-w-[180px]"
              >
                {(Object.keys(DUE_LABELS) as DueFilter[]).map((option) => (
                  <option key={option} value={option}>
                    {DUE_LABELS[option]}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="corp-panel p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="corp-label">Bandeja de tareas</p>
              <span className="text-xs text-corp-muted">{tasks.length} resultado(s)</span>
            </div>

            {error ? (
              <p className="mb-4 rounded-corp border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </p>
            ) : null}

            {isLoading ? (
              <p className="text-sm text-corp-muted">Cargando tareas...</p>
            ) : tasks.length === 0 ? (
              <div>
                <p className="text-sm text-corp-muted">
                  No hay tareas para los filtros seleccionados. Podés crear una nueva
                  desde la columna derecha o desde el detalle de un documento.
                </p>
                <Link href="/contracts" className="corp-btn mt-4 inline-block">
                  Ver documentos
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <article
                    key={task.id}
                    className="rounded-corp border border-corp-border bg-white/75 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="font-medium text-corp-text">{task.title}</h2>
                        {task.description ? (
                          <p className="mt-1 text-sm text-corp-muted">{task.description}</p>
                        ) : null}
                        <p className="mt-2 text-xs text-corp-muted">
                          {task.assignee_name
                            ? `Responsable: ${task.assignee_name}`
                            : "Sin responsable"}
                          {" · "}
                          <span className={dueTone(task)}>
                            {formatDate(task.due_at)} ({dueLabel(task)})
                          </span>
                        </p>
                      </div>

                      <div className="flex flex-wrap justify-end gap-2">
                        <span
                          className={`rounded-corp border px-2 py-0.5 text-[11px] font-medium ${taskStatusBadgeClass(task.status)}`}
                        >
                          {TASK_STATUS_LABELS[task.status]}
                        </span>
                        <span
                          className={`rounded-corp border px-2 py-0.5 text-[11px] font-medium ${taskPriorityBadgeClass(task.priority)}`}
                        >
                          {TASK_PRIORITY_LABELS[task.priority]}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-2">
                        {task.status !== "in_progress" && task.status !== "completed" ? (
                          <button
                            type="button"
                            disabled={isUpdatingId === task.id}
                            onClick={() =>
                              void updateStatus(task, "in_progress", true)
                            }
                            className="corp-btn text-xs"
                          >
                            Tomar
                          </button>
                        ) : null}
                        {task.status !== "completed" ? (
                          <button
                            type="button"
                            disabled={isUpdatingId === task.id}
                            onClick={() => void updateStatus(task, "completed")}
                            className="corp-btn-primary text-xs"
                          >
                            Completar
                          </button>
                        ) : null}
                        {task.status !== "cancelled" && task.status !== "completed" ? (
                          <button
                            type="button"
                            disabled={isUpdatingId === task.id}
                            onClick={() => void updateStatus(task, "cancelled")}
                            className="corp-btn text-xs"
                          >
                            Cancelar
                          </button>
                        ) : null}
                      </div>

                      {task.contract_id ? (
                        <Link
                          href={`/contracts/${task.contract_id}`}
                          className="text-xs font-medium text-cyan-800 hover:underline"
                        >
                          Ver expediente vinculado
                        </Link>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>

        <ContractTasksPanel title="Nueva tarea" onTasksChanged={() => void loadTasks()} />
      </main>
    </div>
  );
}
