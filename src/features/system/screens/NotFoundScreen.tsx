import { Home, Map } from "lucide-react";
import { Link } from "react-router-dom";

export function NotFoundScreen() {
  return (
    <main className="grid min-h-dvh place-items-center bg-slate-50 px-5 pb-10 pt-[calc(2.5rem+env(safe-area-inset-top))] text-[var(--color-text)]" id="main-content" tabIndex={-1}>
      <section className="flex w-full max-w-lg flex-col items-center rounded-[28px] bg-white px-6 py-12 text-center shadow-xl shadow-slate-200/70 ring-1 ring-slate-200 sm:px-10">
        <div className="mb-7 grid size-24 place-items-center rounded-[28px] bg-emerald-50 text-emerald-700">
          <Map aria-hidden="true" className="size-11" />
        </div>
        <p className="text-6xl font-black leading-none">404</p>
        <h1 className="mt-4 text-2xl font-black">No encontramos esta pantalla</h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--color-muted)]">
          Puede que el enlace haya cambiado o que no tengas acceso a esta ruta.
        </p>
        <Link
          className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-6 text-sm font-black text-[var(--color-primary-contrast)]"
          to="/login"
        >
          <Home aria-hidden="true" className="size-4" />
          Volver al inicio
        </Link>
      </section>
    </main>
  );
}
