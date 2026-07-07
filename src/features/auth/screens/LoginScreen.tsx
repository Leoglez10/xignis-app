import { Lock, Mail, Monitor, Smartphone, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "../../../components/ui/Button";
import { TextInput } from "../../../components/ui/TextInput";
import { login, routeForRole, type LoginRole } from "../services/authService";
import { useAuth } from "../../session/AuthContext";

const loginSchema = z.object({
  email: z.string().trim().email("Ingresa un correo valido."),
  password: z.string().min(1, "Ingresa tu password."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const roleOptions: Array<{ icon: typeof Smartphone; label: string; value: LoginRole }> = [
  { icon: Smartphone, label: "Empleado", value: "employee" },
  { icon: Users, label: "Jefe", value: "manager" },
  { icon: Monitor, label: "RH", value: "hr_admin" },
];

export function LoginScreen() {
  const navigate = useNavigate();
  const { isConfigured, profile, refreshProfile, session } = useAuth();
  const [selectedRole, setSelectedRole] = useState<LoginRole>("employee");
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
    setFocus,
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onSubmit",
    reValidateMode: "onBlur",
  });

  useEffect(() => {
    if (session && profile) navigate(routeForRole(profile.role), { replace: true });
  }, [navigate, profile, session]);

  async function onSubmit(values: LoginFormValues) {
    const result = loginSchema.safeParse(values);

    if (!result.success) {
      for (const issue of result.error.issues) {
        const fieldName = issue.path[0];
        if (fieldName === "email" || fieldName === "password") {
          setError(fieldName, { message: issue.message });
        }
      }
      const firstIssue = result.error.issues[0]?.path[0];
      if (firstIssue === "email" || firstIssue === "password") setFocus(firstIssue);
      return;
    }

    try {
      const { redirectTo } = await login({ ...result.data, selectedRole });
      await refreshProfile();
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setError("root", {
        message: error instanceof Error ? error.message : "No se pudo iniciar sesion.",
      });
      setFocus("email");
    }
  }

  return (
    <main className="mobile-screen" id="main-content" tabIndex={-1}>
      <section className="flex min-h-dvh flex-col items-center justify-center px-6 pb-8 pt-[calc(2.25rem+env(safe-area-inset-top))] lg:px-10">
        <div className="flex min-h-[calc(100dvh-4rem)] w-full max-w-[440px] flex-col lg:min-h-0 lg:rounded-[24px] lg:bg-white lg:p-6 lg:shadow-xl lg:shadow-slate-200/70 lg:ring-1 lg:ring-slate-200">
          <img src="/logo-dos.png" alt="Xignis" className="mb-10 w-56 self-center" />

        <div aria-label="Tipo de acceso" className="mb-6 grid grid-cols-3 gap-1 rounded-full bg-[var(--color-surface)] p-1" role="group">
          {roleOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedRole === option.value;

            return (
              <button
                aria-pressed={isSelected}
                aria-label={`Entrar como ${option.label}`}
                className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-black ${
                  isSelected ? "bg-white shadow-sm" : "text-[var(--color-muted)]"
                }`}
                key={option.value}
                type="button"
                onClick={() => setSelectedRole(option.value)}
              >
                <Icon aria-hidden="true" className="size-4" />
                {option.label}
              </button>
            );
          })}
        </div>

        <form className="flex flex-1 flex-col" noValidate onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {!isConfigured ? (
              <p className="rounded-2xl bg-orange-50 p-4 text-sm font-semibold leading-6 text-orange-900" role="status">
                Supabase no esta configurado. Revisa las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.
              </p>
            ) : null}
            <TextInput
              autoComplete="email"
              error={errors.email?.message}
              label="Correo"
              placeholder="correo@empresa.com"
              type="email"
              {...register("email")}
            />
            <TextInput
              autoComplete="current-password"
              error={errors.password?.message}
              label="Password"
              placeholder="Password"
              type="password"
              {...register("password")}
            />

            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="inline-flex items-center gap-2 text-[var(--color-muted)]">
                <Mail aria-hidden="true" className="size-4" />
                Acceso corporativo
              </span>
              <Link className="font-bold text-[var(--color-text)]" to="/forgot-password">
                Recuperar password
              </Link>
            </div>

            {errors.root?.message ? (
              <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700" role="alert">
                {errors.root.message}
              </p>
            ) : null}
          </div>

          <div className="mt-auto space-y-4 pt-10">
            <Button className="w-full" disabled={!isConfigured || isSubmitting} type="submit">
              <Lock aria-hidden="true" className="size-4" />
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
            <button
              className="press w-full py-2 text-sm font-bold text-[var(--color-text)]"
              type="button"
              onClick={() => navigate("/signup")}
            >
              Crear cuenta nueva
            </button>
            <p className="px-4 text-center text-xs leading-5 text-[var(--color-muted)]">
              RH puede entrar desde computadora con la misma cuenta.
            </p>
          </div>
        </form>
        </div>
      </section>
    </main>
  );
}
