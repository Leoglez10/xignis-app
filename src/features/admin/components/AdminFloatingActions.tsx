import { UserCircle } from "lucide-react";
import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { NotificationBell } from "../../notifications/NotificationBell";

/** NotificationBell flotante para el panel admin. Top-right, safe-area aware. */
export const AdminFloatingActions = memo(function AdminFloatingActions() {
  const navigate = useNavigate();

  return (
    <div className="fixed right-[calc(1rem+env(safe-area-inset-right))] top-[calc(1rem+env(safe-area-inset-top))] z-40 flex items-center gap-2">
      <div className="grid size-12 place-items-center rounded-full bg-white shadow-lg ring-1 ring-slate-200">
        <NotificationBell />
      </div>
      <button
        aria-label="Mi perfil"
        className="press grid size-12 place-items-center rounded-full bg-white text-[var(--color-text)] shadow-lg ring-1 ring-slate-200"
        type="button"
        onClick={() => navigate("/profile")}
      >
        <UserCircle aria-hidden="true" className="size-5" />
      </button>
    </div>
  );
});
