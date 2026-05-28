"use client";

import { useCallback, useEffect, useState } from "react";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  taskStatusBadgeClass,
  type ContractTask,
  type TaskPriority,
} from "@/lib/contracts/tasks";

interface ContractTasksPanelProps {
  contractId?: string;
  clientId?: string;
  title?: string;
  onTasksChanged?: () => void;
}

export function ContractTasksPanel({
  contractId,
  clientId,
  title = "Tareas y responsables",
  onTasksChanged,
}: ContractTasksPanelProps) {
  const [tasks, setTasks] = useState<ContractTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [isSaving, setIsSaving] = useState(false);

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams({ open: "1" });
    if (contractId) {
      params.set("contract_id", contractId);
    }
    if (clientId) {
      params.set("client_id", clientId);
    }

    const response = await fetch(`/api/tasks?${params.toString()}`);
    const payload = await response.json();
    if (response.ok) {
      setTasks(payload.tasks ?? []);
    }
    setIsLoading(false);
  }, [clientId, contractId]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!newTitle.trim()) {
      return;
    }

    setIsSaving(true);
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle.trim(),
        assignee_name: assignee.trim() || null,
        due_at: dueAt ? new Date(`${dueAt}T12:00:00`).toISOString() : null,
        priority,
        contract_id: contractId ?? null,
        client_id: clientId ?? null,
      }),
    });

    if (response.ok) {
      setNewTitle("");
      setAssignee("");
      setDueAt("");
      await loadTasks();
      onTasksChanged?.();
    }
    setIsSaving(false);
  }

  async function markCompleted(taskId: string) {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    await loadTasks();
    onTasksChanged?.();
  }

  return (
    <section className="corp-panel p-5">
      <p className="corp-label text-cyan-700">{title}</p>

      <form onSubmit={(event) => void handleCreate(event)} className="mt-4 space-y-3">
        <input
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="Nueva tarea (ej. revisar renovación)"
          className="corp-input w-full"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            value={assignee}
            onChange={(event) => setAssignee(event.target.value)}
            placeholder="Responsable"
            className="corp-input w-full"
          />
          <input
            type="date"
            value={dueAt}
            onChange={(event) => setDueAt(event.target.value)}
            className="corp-input w-full"
          />
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as TaskPriority)}
            className="corp-input w-full"
          >
            {(Object.keys(TASK_PRIORITY_LABELS) as TaskPriority[]).map((key) => (
              <option key={key} value={key}>
                {TASK_PRIORITY_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={isSaving} className="corp-btn-primary">
          {isSaving ? "Guardando..." : "Agregar tarea"}
        </button>
      </form>

      <div className="mt-4 space-y-2">
        {isLoading ? (
          <p className="text-sm text-corp-muted">Cargando tareas...</p>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-corp-muted">Sin tareas abiertas.</p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-start justify-between gap-3 rounded-corp border border-corp-border bg-white/70 px-3 py-2.5"
            >
              <div>
                <p className="text-sm font-medium text-corp-text">{task.title}</p>
                <p className="mt-1 text-xs text-corp-muted">
                  {task.assignee_name ? `Responsable: ${task.assignee_name}` : "Sin responsable"}
                  {task.due_at
                    ? ` · Vence: ${new Date(task.due_at).toLocaleDateString("es-AR")}`
                    : ""}
                </p>
                <span
                  className={`mt-2 inline-block rounded-corp border px-2 py-0.5 text-[11px] font-medium ${taskStatusBadgeClass(task.status)}`}
                >
                  {TASK_STATUS_LABELS[task.status]}
                </span>
              </div>
              {task.status !== "completed" && (
                <button
                  type="button"
                  onClick={() => void markCompleted(task.id)}
                  className="corp-btn shrink-0 text-xs"
                >
                  Completar
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
