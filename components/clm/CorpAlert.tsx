import type { ReactNode } from "react";

type CorpAlertVariant = "error" | "warning" | "info" | "success";

interface CorpAlertProps {
  variant?: CorpAlertVariant;
  title?: string;
  children: ReactNode;
  className?: string;
}

const VARIANT_CLASS: Record<CorpAlertVariant, string> = {
  error: "corp-alert-error",
  warning: "corp-alert-warning",
  info: "corp-alert-info",
  success: "corp-alert-success",
};

export function CorpAlert({
  variant = "error",
  title,
  children,
  className = "",
}: CorpAlertProps) {
  return (
    <div
      role="alert"
      className={`rounded-corp border px-4 py-3 text-sm ${VARIANT_CLASS[variant]} ${className}`.trim()}
    >
      {title ? <p className="mb-1 font-semibold">{title}</p> : null}
      <div>{children}</div>
    </div>
  );
}
