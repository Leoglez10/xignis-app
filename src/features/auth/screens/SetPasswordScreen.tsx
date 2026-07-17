import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "../../../components/ui/Button";
import { TextInput } from "../../../components/ui/TextInput";
import { useAuth } from "../../session/AuthContext";
import { routeForRole, updatePassword } from "../services/authService";

const schema = z
  .object({
    password: z.string().min(8, "Minimo 8 caracteres."),
    confirm: z.string().min(1, "Confirma tu password."),
  })
  .refine((value) => value.password === value.confirm, {
    message: "Las contraseñas no coinciden.",
    path: ["confirm"],
  });

type Values = z.infer<typeof schema>;

export function SetPasswordScreen() {
  const navigate = useNavigate();
  const { isLoading, refreshProfile, session } = useAuth();
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<Values>({ mode: "onSubmit" });

  async function onSubmit(values: Values) {
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === "password" || field === "confirm") setError(field, { message: issue.message });
      }
      return;
    }
    try {
      await updatePassword(parsed.data.password);
      const profile = await refreshProfile();
      navigate(routeForRole(profile?.role ?? "employee"), { replace: true });
    } catch (error) {
      setError("root", { message: error instanceof Error ? error.message : "No se pudo guardar la password." });
    }
  }

  const linkInvalid = !isLoading && !session;

  return (
    <main className="mobile-screen grid place-items-center px-6 pb-10 pt-[calc(2.5rem+env(safe-area-inset-top))]" id="main-content" tabIndex={-1}>
      <section className="animate-fade-up w-full max-w-sm">
        <h1 className="text-3xl font-bold text-[var(--color-text)]">Crear nueva password</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">Define tu password para entrar a Xignis.</p>

        {isLoading ? (
          <p className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-[var(--color-muted)]" role="status">
            Verificando enlace…
          </p>
        ) : linkInvalid ? (
          <div className="mt-6 space-y-3 rounded-2xl bg-orange-50 p-4 text-sm leading-6 text-orange-900" role="alert">
            <p>El enlace no es válido o expiró.</p>
            <Link
              className="press inline-flex w-full items-center justify-center rounded-full bg-white px-4 py-3 font-bold text-orange-900 ring-1 ring-orange-200"
              to="/forgot-password"
            >
              Solicitar nuevo enlace
            </Link>
          </div>
        ) : (
          <form className="mt-7 space-y-4" noValidate onSubmit={handleSubmit(onSubmit)}>
            <TextInput
              autoComplete="new-password"
              error={errors.password?.message}
              label="Nueva password"
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
              {isSubmitting ? "Guardando..." : "Guardar y entrar"}
            </Button>
          </form>
        )}
      </section>
    </main>
  );
}
