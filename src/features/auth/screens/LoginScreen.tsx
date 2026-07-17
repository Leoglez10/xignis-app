import { ArrowRight, Lock, Mail } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "../../../components/ui/Button";
import { TextInput } from "../../../components/ui/TextInput";
import { PasswordField } from "../../../components/ui/PasswordField";
import { login, routeForRole } from "../services/authService";
import { useAuth } from "../../session/AuthContext";
import { useTranslation } from "react-i18next";

const loginSchema = z.object({
  email: z.string().trim().email("Ingresa un correo valido."),
  password: z.string().min(1, "Ingresa tu password."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isConfigured, profile, refreshProfile, session } = useAuth();
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
      const { redirectTo } = await login(result.data);
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
    <main
      className="mobile-screen relative isolate overflow-hidden bg-[var(--color-background)]"
      id="main-content"
      tabIndex={-1}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-[-8rem] size-80 rounded-full bg-[var(--color-primary)]/12 blur-3xl sm:size-[28rem]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-32 size-96 rounded-full bg-emerald-200/30 blur-3xl sm:size-[34rem]"
      />

      <section className="relative flex min-h-dvh items-center justify-center px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6 sm:pb-[calc(2rem+env(safe-area-inset-bottom))] sm:pt-[calc(2rem+env(safe-area-inset-top))] lg:px-10">
        <div className="animate-fade-up grid w-full max-w-[920px] overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-emerald-950/10 ring-1 ring-slate-200/80 lg:grid-cols-[0.92fr_1.08fr]">
          <aside className="relative hidden overflow-hidden bg-slate-950 px-10 py-12 lg:flex lg:items-center lg:justify-center">
            <div
              aria-hidden="true"
              className="absolute -right-24 -top-24 size-64 rounded-full border-[3rem] border-[var(--color-primary)]/10"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-24 -left-24 size-72 rounded-full bg-[var(--color-primary)]/10 blur-3xl"
            />

            <img
              alt="Xignis"
              className="relative w-52 brightness-0 invert"
              height="419"
              src="/logo-dos.png"
              width="595"
            />
          </aside>

          <div className="flex min-w-0 flex-col px-5 py-7 sm:px-10 sm:py-10 lg:px-12 lg:py-12">
            <img
              alt="Xignis"
              className="mb-6 w-36 self-center rounded-2xl bg-[#f8fafc] px-3 py-1 lg:hidden"
              height="419"
              src="/logo-dos.png"
              width="595"
            />

            <form className="flex flex-col" noValidate onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-5">
                {!isConfigured ? (
                  <p className="rounded-2xl bg-orange-50 p-4 text-sm font-semibold leading-6 text-orange-900" role="status">
                    {t("auth.notConfigured")}
                  </p>
                ) : null}
                <TextInput
                  autoComplete="email"
                  error={errors.email?.message}
                  label={t("auth.email")}
                  placeholder={t("auth.emailPlaceholder")}
                  type="email"
                  {...register("email")}
                />
                <PasswordField
                  autoComplete="current-password"
                  error={errors.password?.message}
                  label={t("auth.password")}
                  placeholder={t("auth.passwordPlaceholder")}
                  {...register("password")}
                />

                <div className="flex flex-col gap-3 text-sm min-[390px]:flex-row min-[390px]:items-center min-[390px]:justify-between">
                  <span className="inline-flex items-center gap-2 text-[var(--color-muted)]">
                    <Mail aria-hidden="true" className="size-4" />
                    {t("auth.corporate")}
                  </span>
                  <Link
                    className="w-fit rounded-md font-bold text-[var(--color-text)] underline decoration-slate-300 underline-offset-4 transition-colors hover:text-[var(--color-primary-strong)]"
                    to="/forgot-password"
                  >
                    {t("auth.forgot")}
                  </Link>
                </div>

                {errors.root?.message ? (
                  <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700" role="alert">
                    {errors.root.message}
                  </p>
                ) : null}
              </div>

              <Button
                className="mt-7 w-full shadow-lg shadow-emerald-300/25"
                disabled={!isConfigured || isSubmitting}
                type="submit"
              >
                <Lock aria-hidden="true" className="size-4" />
                {isSubmitting ? t("auth.entering") : t("auth.enter")}
                {!isSubmitting ? <ArrowRight aria-hidden="true" className="size-4" /> : null}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
