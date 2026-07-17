import { ArrowLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getModuleById } from "../../../app/modules";
import { useAuth } from "../../session/AuthContext";

/** Placeholder profesional para módulos aún no construidos (Gastos, Reportes, etc.). */
export function ComingSoonScreen({ moduleId }: { moduleId: string }) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const mod = (profile ? getModuleById(profile.role, moduleId) : null) ?? {
    name: "Próximamente",
    description: "Estamos trabajando en esta sección.",
    icon: Sparkles,
  };
  const Icon = mod.icon;

  return (
    <main className="mobile-screen" id="main-content" tabIndex={-1}>
      <section className="flex min-h-dvh flex-col px-5 pb-16 pt-6">
        <button
          aria-label="Volver"
          className="press mb-8 grid size-11 place-items-center rounded-full bg-[var(--card-bg)] text-[var(--color-text)] shadow-sm"
          type="button"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft aria-hidden="true" className="size-5" />
        </button>

        <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <span className="grid size-20 place-items-center rounded-[28px] bg-[var(--color-surface)] text-[var(--color-muted)]">
            <Icon aria-hidden="true" className="size-10" />
          </span>
          <span className="rounded-full bg-[var(--color-primary)] px-4 py-1.5 text-xs font-bold text-[var(--color-primary-contrast)]">
            Próximamente
          </span>
          <h2 className="text-3xl font-bold text-[var(--color-text)]">{mod.name}</h2>
          <p className="max-w-xs text-sm leading-6 text-[var(--color-muted)]">{mod.description}</p>
          <p className="max-w-xs text-xs leading-5 text-[var(--color-muted)]">
            Forma parte de la plataforma Xignis. Te avisaremos cuando esté disponible.
          </p>
        </div>
      </section>
    </main>
  );
}
