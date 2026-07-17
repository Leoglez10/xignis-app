import { useNavigate } from "react-router-dom";
import type { UserRole } from "../lib/database.types";
import { getModules } from "../app/modules";
import { BottomSheet } from "./ui/BottomSheet";

type Props = {
  isOpen: boolean;
  role: UserRole;
  onClose: () => void;
};

/** Grid de módulos de Xignis. Los `live` navegan; los `soon` muestran "Próximamente". */
export function ModuleSwitcherSheet({ isOpen, role, onClose }: Props) {
  const navigate = useNavigate();
  const modules = getModules(role);

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Módulos de Xignis">
      <ul className="grid grid-cols-2 gap-3">
        {modules.map(({ id, name, description, icon: Icon, status, to }) => {
          const soon = status === "soon";
          return (
            <li key={id}>
              <button
                type="button"
                aria-disabled={soon}
                className={`press flex h-full w-full flex-col items-start gap-2 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 text-left ${
                  soon ? "opacity-60" : ""
                }`}
                onClick={() => {
                  if (soon) return;
                  onClose();
                  navigate(to);
                }}
              >
                <span
                  className="grid size-11 place-items-center rounded-2xl"
                  style={{
                    background: soon ? "var(--color-surface)" : "var(--color-primary)",
                    color: soon ? "var(--color-muted)" : "var(--color-primary-contrast)",
                  }}
                >
                  <Icon aria-hidden="true" className="size-6" />
                </span>
                <span className="text-sm font-black text-[var(--color-text)]">{name}</span>
                <span className="text-xs leading-5 text-[var(--color-muted)]">{description}</span>
                {soon ? (
                  <span className="mt-auto rounded-full bg-[var(--color-surface)] px-2.5 py-0.5 text-[11px] font-black text-[var(--color-muted)]">
                    Próximamente
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </BottomSheet>
  );
}
