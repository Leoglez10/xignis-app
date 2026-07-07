import { MailCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Button } from "../../../components/ui/Button";
import { TextInput } from "../../../components/ui/TextInput";
import { requestPasswordReset } from "../services/authService";

const schema = z.object({ email: z.string().trim().email("Ingresa un correo valido.") });
type Values = z.infer<typeof schema>;

export function ForgotPasswordScreen() {
  const [done, setDone] = useState(false);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<Values>({ mode: "onSubmit" });

  async function onSubmit(values: Values) {
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      setError("email", { message: parsed.error.issues[0]?.message });
      return;
    }
    try {
      await requestPasswordReset(parsed.data.email);
      setDone(true);
    } catch (error) {
      setError("root", { message: error instanceof Error ? error.message : "No se pudo enviar el correo." });
    }
  }

  return (
    <main className="mobile-screen grid place-items-center px-6 pb-10 pt-[calc(2.5rem+env(safe-area-inset-top))]" id="main-content" tabIndex={-1}>
      <section className="animate-fade-up w-full max-w-sm">
        {done ? (
          <div className="animate-scale-in rounded-[28px] bg-white p-8 text-center shadow-xl shadow-slate-200/70">
            <div className="mx-auto mb-5 grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-700">
              <MailCheck aria-hidden="true" className="size-8" />
            </div>
            <h1 className="text-2xl font-black text-[var(--color-text)]">Correo enviado</h1>
            <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
              Si el correo existe, recibirás un enlace para crear una nueva password.
            </p>
            <Link
              className="press mt-6 inline-flex w-full items-center justify-center rounded-full bg-[var(--color-surface)] px-4 py-3 font-bold text-[var(--color-text)]"
              to="/login"
            >
              Volver a iniciar sesión
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-black text-[var(--color-text)]">Recuperar password</h1>
            <p className="mt-2 text-sm text-[var(--color-muted)]">Te enviaremos un enlace a tu correo.</p>
            <form className="mt-7 space-y-4" noValidate onSubmit={handleSubmit(onSubmit)}>
              <TextInput autoComplete="email" error={errors.email?.message} label="Correo" type="email" {...register("email")} />
              {errors.root?.message ? (
                <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700" role="alert">
                  {errors.root.message}
                </p>
              ) : null}
              <Button className="w-full" disabled={isSubmitting} type="submit">
                {isSubmitting ? "Enviando..." : "Enviar enlace"}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
              <Link className="font-bold text-[var(--color-text)]" to="/login">
                Volver
              </Link>
            </p>
          </>
        )}
      </section>
    </main>
  );
}
