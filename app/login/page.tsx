import { Suspense } from "react";
import { LoginForm } from "@/app/login/LoginForm";
import { BrandMark } from "@/components/clm/BrandMark";

export const metadata = {
  title: "Ingresar — Vertia Legal",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="w-full max-w-md rounded-corp border border-slate-700/60 bg-slate-900/80 p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur-md">
        <div className="mb-8 flex justify-center">
          <BrandMark />
        </div>
        <h1 className="mb-1 text-center text-xl font-semibold text-white">Acceso al estudio</h1>
        <p className="mb-8 text-center text-sm text-slate-400">
          Ingresá con tu cuenta autorizada para operar el repositorio documental.
        </p>
        <Suspense fallback={<p className="text-center text-sm text-slate-400">Cargando…</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
