import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "../../../components/ui/Button";
import { TextInput } from "../../../components/ui/TextInput";
import { signUp } from "../services/authService";

const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, "Ingresa tu nombre."),
    email: z.string().trim().email("Ingresa un correo valido."),
    password: z.string().min(8, "Minimo 8 caracteres."),
    confirm: z.string().min(1, "Confirma tu password."),
  })
  .refine((value) => value.password === value.confirm, {
    message: "Las contraseñas no coinciden.",
    path: ["confirm"],
  });

type SignupValues = z.infer<typeof signupSchema>;

export function SignupScreen() {
  const navigate = useNavigate();
  const [done, setDone] = useState(false);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<SignupValues>({ mode: "onSubmit" });

  async function onSubmit(values: SignupValues) {
    const parsed = signupSchema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === "fullName" || field === "email" || field === "password" || field === "confirm") {
          setError(field, { message: issue.message });
        }
      }
      return;
    }

    try {
      await signUp({ email: parsed.data.email, password: parsed.data.password, fullName: parsed.data.fullName });
      setDone(true);
    } catch (error) {
      setError("root", { message: error instanceof Error ? error.message : "No se pudo crear la cuenta." });
    }
  }

  if (done) {
    return (
      <main className="mobile-screen grid place-items-center px-6 pt-[env(safe-area-inset-top)]" id="main-content" tabIndex={-1}>
        <section className="animate-scale-in w-full max-w-sm rounded-[28px] bg-white p-8 text-center shadow-xl shadow-slate-200/70">
          <div className="mx-auto mb-5 grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 aria-hidden="true" className="size-8" />
          </div>
          <h1 className="text-2xl font-black text-[var(--color-text)]">Revisa tu correo</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
            Te enviamos un enlace para confirmar tu cuenta. Después podrás entrar con tu correo y password.
          </p>
          <Button className="mt-6 w-full" onClick={() => navigate("/login")}>
            Ir a iniciar sesión
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className="mobile-screen grid place-items-center px-6 pb-10 pt-[calc(2.5rem+env(safe-area-inset-top))]" id="main-content" tabIndex={-1}>
      <section className="animate-fade-up w-full max-w-sm">
        <div className="mb-6 grid size-14 place-items-center rounded-[18px] bg-[var(--color-primary)] text-2xl font-black text-[var(--color-primary-contrast)]">
          X
        </div>
        <h1 className="text-3xl font-black text-[var(--color-text)]">Crear cuenta</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">Regístrate para solicitar permisos en Xignis.</p>

        <form className="mt-7 space-y-4" noValidate onSubmit={handleSubmit(onSubmit)}>
          <TextInput autoComplete="name" error={errors.fullName?.message} label="Nombre completo" {...register("fullName")} />
          <TextInput autoComplete="email" error={errors.email?.message} label="Correo" type="email" {...register("email")} />
          <TextInput
            autoComplete="new-password"
            error={errors.password?.message}
            label="Password"
            type="password"
            {...register("password")}
          />
          <TextInput
            autoComplete="new-password"
            error={errors.confirm?.message}
            label="Confirmar password"
            type="password"
            {...register("confirm")}
          />

          {errors.root?.message ? (
            <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700" role="alert">
              {errors.root.message}
            </p>
          ) : null}

          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Creando..." : "Crear cuenta"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
          ¿Ya tienes cuenta?{" "}
          <Link className="font-bold text-[var(--color-text)]" to="/login">
            Inicia sesión
          </Link>
        </p>
      </section>
    </main>
  );
}
