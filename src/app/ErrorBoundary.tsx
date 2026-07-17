import { Component, type ErrorInfo, type ReactNode } from "react";
import { captureException } from "../lib/monitoring";

/** Captura errores de render (chunks lazy que fallan, bugs de pantalla)
 *  y muestra fallback recuperable en vez de pantalla blanca. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary:", error, info.componentStack);
    captureException(error, { componentStack: info.componentStack ?? "" });
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="grid min-h-dvh place-items-center bg-slate-50 px-6 text-center" role="alert">
        <section className="w-full max-w-sm">
          <h1 className="text-2xl font-black text-[var(--color-text)]">Algo falló</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Ocurrió un error inesperado. Recarga la app para continuar.
          </p>
          <button
            className="press mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-black text-white"
            type="button"
            onClick={() => window.location.reload()}
          >
            Recargar
          </button>
        </section>
      </main>
    );
  }
}
