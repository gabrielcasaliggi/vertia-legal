import type { ReactNode } from "react";

interface PageHeaderProps {
  label?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ label, title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="px-5 pt-5">
      <div className="corp-panel ops-panel-accent mx-auto flex max-w-[1600px] flex-wrap items-start justify-between gap-4 px-6 py-5">
        <div>
          {label && <p className="corp-label text-cyan-700">{label}</p>}
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-corp-text">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-corp-muted">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
