import { ArrowRight, Eye } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type OwnerReadOnlyNoticeProps = {
  /** Qué se ve y por qué no se edita aquí. Por defecto, una variante neutra. */
  children?: ReactNode;
  /** Siguiente paso concreto (p. ej. aprobar las de tu equipo). */
  action?: { label: string; to: string };
};

/** Aviso compacto de solo lectura para las páginas de toda la empresa del dueño. */
export function OwnerReadOnlyNotice({ action, children = "Solo lectura." }: OwnerReadOnlyNoticeProps) {
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs font-semibold text-[var(--color-muted)]">
      <Eye aria-hidden="true" className="size-3.5 shrink-0" />
      <span>{children}</span>
      {action ? (
        <Link className="inline-flex items-center gap-0.5 font-bold text-[var(--color-primary-strong)] underline-offset-2 hover:underline" to={action.to}>
          {action.label}
          <ArrowRight aria-hidden="true" className="size-3.5" />
        </Link>
      ) : null}
    </p>
  );
}
