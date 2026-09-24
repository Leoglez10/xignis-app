import { Eye } from "lucide-react";

export function OwnerReadOnlyBanner() {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-900 ring-1 ring-amber-200">
      <Eye aria-hidden="true" className="size-4 shrink-0" />
      <span>Vista de solo lectura — no puedes editar nada desde aquí.</span>
    </div>
  );
}
