"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/clm/PageHeader";
import { USER_ROLE_LABELS, type UserRole } from "@/lib/auth/roles";
import { isUserRole } from "@/lib/auth/roles";

interface StudioUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

const ROLES: UserRole[] = ["admin", "lawyer", "accountant", "assistant"];

export function AdminUsersPanel() {
  const [users, setUsers] = useState<StudioUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("assistant");
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/users");
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.details ?? payload.error ?? "Error al cargar usuarios.");
      }
      setUsers(payload.users ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Error al cargar.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: fullName, role }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.details ?? payload.error ?? "No se pudo crear.");
      }
      setEmail("");
      setPassword("");
      setFullName("");
      setRole("assistant");
      await load();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Error al crear.");
    } finally {
      setIsSaving(false);
    }
  }

  async function patchUser(
    userId: string,
    patch: { role?: UserRole; is_active?: boolean },
  ) {
    setError(null);
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.details ?? payload.error ?? "No se pudo actualizar.");
      return;
    }
    await load();
  }

  return (
    <div className="min-h-screen bg-corp-bg">
      <PageHeader
        label="Mi estudio"
        title="Usuarios del estudio activo"
        subtitle="Creá cuentas para abogados, contadores y asistentes de la organización con la que estás operando. No crea estudios clientes nuevos."
      />

      <main className="mx-auto max-w-[1000px] space-y-5 p-5">
        <div className="rounded-corp border border-cyan-400/25 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-50">
          <p className="font-medium">Panel del administrador del estudio</p>
          <p className="mt-1 text-cyan-100/80">
            Si necesitás dar de alta un estudio cliente nuevo (otro estudio SaaS), eso se hace en
            Plataforma SaaS, no desde esta pantalla.
          </p>
        </div>
        <section className="corp-panel p-6">
          <p className="corp-label text-cyan-700">Nuevo usuario del estudio</p>
          <form
            onSubmit={(event) => void handleCreate(event)}
            className="mt-4 grid gap-3 md:grid-cols-2"
          >
            <label className="space-y-1">
              <span className="corp-label text-[11px]">Correo</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@estudio.com"
                className="corp-input w-full"
              />
            </label>
            <label className="space-y-1">
              <span className="corp-label text-[11px]">Contraseña inicial</span>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="corp-input w-full"
              />
            </label>
            <label className="space-y-1">
              <span className="corp-label text-[11px]">Nombre completo</span>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nombre y apellido"
                className="corp-input w-full"
              />
            </label>
            <label className="space-y-1">
              <span className="corp-label text-[11px]">Rol inicial</span>
              <select
                value={role}
                onChange={(e) => {
                  const value = e.target.value;
                  if (isUserRole(value)) {
                    setRole(value);
                  }
                }}
                className="corp-input w-full"
              >
                {ROLES.map((item) => (
                  <option key={item} value={item}>
                    {USER_ROLE_LABELS[item]}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" disabled={isSaving} className="corp-btn-primary md:col-span-2">
              {isSaving ? "Creando..." : "Crear usuario"}
            </button>
          </form>
        </section>

        <section className="corp-panel overflow-hidden">
          <div className="border-b border-corp-border px-6 py-4">
            <p className="corp-label">Usuarios registrados</p>
          </div>
          {error ? (
            <p className="m-5 rounded-corp border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          ) : null}
          {isLoading ? (
            <p className="p-6 text-sm text-corp-muted">Cargando usuarios...</p>
          ) : (
            <ul className="divide-y divide-corp-border">
              {users.map((user) => (
                <li key={user.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                  <div>
                    <p className="font-medium text-corp-text">{user.full_name}</p>
                    <p className="text-sm text-corp-muted">{user.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={user.role}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (isUserRole(value)) {
                          void patchUser(user.id, { role: value });
                        }
                      }}
                      className="corp-input text-xs"
                    >
                      {ROLES.map((item) => (
                        <option key={item} value={item}>
                          {USER_ROLE_LABELS[item]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => void patchUser(user.id, { is_active: !user.is_active })}
                      className={user.is_active ? "corp-btn text-xs" : "corp-btn-primary text-xs"}
                    >
                      {user.is_active ? "Desactivar" : "Activar"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-center text-sm text-corp-muted">
          <a href="/admin/organizacion" className="text-cyan-800 hover:underline">
            Configuración de organización
          </a>
        </p>
      </main>
    </div>
  );
}
