import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_ROLES = ["employee", "manager", "hr_admin", "admin"];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function parseVacationDays(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 365) return NaN;
  return parsed;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// La migración de JWT signing keys de Supabase deja, en ráfaga, algunas instancias
// de GoTrue con el JWKS viejo -> rechaza el token con "unrecognized JWT kid ... ES256".
// Es transitorio: la verificación falla ANTES de crear nada, así que reintentar es
// seguro (no genera usuarios duplicados).
function isTransientJwtError(err: unknown): boolean {
  const msg = (err && typeof err === "object" && "message" in err)
    ? String((err as { message: unknown }).message)
    : String(err ?? "");
  return /unverifiable|unrecognized JWT kid|keyfunc|invalid JWT/i.test(msg);
}

async function withJwtRetry<T extends { error: unknown }>(fn: () => Promise<T>): Promise<T> {
  let last: T = await fn();
  for (let attempt = 1; attempt <= 4 && last.error && isTransientJwtError(last.error); attempt++) {
    await sleep(200 * attempt);
    last = await fn();
  }
  return last;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return json({ error: "Falta autenticación." }, 401);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data: userData, error: userErr } = await withJwtRetry(() => admin.auth.getUser(token));
  if (userErr || !userData.user) return json({ error: "Sesión inválida." }, 401);

  const { data: callerProfile } = await admin
    .from("profiles").select("role").eq("id", userData.user.id).single();
  if (!callerProfile || !["hr_admin", "admin"].includes(callerProfile.role)) {
    return json({ error: "Solo RH o admin pueden crear usuarios." }, 403);
  }

  let payload: any;
  try { payload = await req.json(); } catch { return json({ error: "JSON inválido." }, 400); }

  const rawEmail = String(payload.email ?? "").trim().toLowerCase();
  const fullName = String(payload.full_name ?? "").trim();
  const role = String(payload.role ?? "employee");
  const jobTitle = payload.job_title ? String(payload.job_title).trim() : null;
  const managerId = payload.manager_id ? String(payload.manager_id) : null;
  const departmentId = payload.department_id ? String(payload.department_id) : null;
  const annualVacationDays = parseVacationDays(payload.annual_vacation_days);

  // El correo es opcional: sin correo se crea un empleado "sin cuenta" (no puede
  // iniciar sesión) que RH puede activar después con admin-grant-access.
  const hasEmail = rawEmail.length > 0;
  if (hasEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(rawEmail)) return json({ error: "Correo inválido." }, 400);
  if (!fullName) return json({ error: "Falta el nombre." }, 400);
  if (!ALLOWED_ROLES.includes(role)) return json({ error: "Rol inválido." }, 400);
  if (Number.isNaN(annualVacationDays)) return json({ error: "Días de vacaciones inválidos." }, 400);

  let userId: string;
  let resolvedEmail: string;

  if (hasEmail) {
    // Con correo: alta inmediata SIN correo de invitación. La cuenta queda marcada
    // con must_set_password, así la persona entra a la app, escribe su correo y
    // define ahí mismo su contraseña (ver la Edge Function account-access).
    const { data: created, error: createErr } = await withJwtRetry(() =>
      admin.auth.admin.createUser({
        email: rawEmail,
        password: crypto.randomUUID() + crypto.randomUUID(),
        email_confirm: true,
        user_metadata: { full_name: fullName, must_set_password: true },
      })
    );
    if (createErr || !created.user) {
      const dup = /already|registered|exists/i.test(createErr?.message ?? "");
      return json({ error: dup ? "Ese correo ya está en uso por otra cuenta." : (createErr?.message ?? "No se pudo crear el empleado.") }, 400);
    }
    userId = created.user.id;
    resolvedEmail = rawEmail;
  } else {
    // Sin correo: cuenta placeholder confirmada, con password aleatorio que nadie
    // conoce -> inerte, no hay login posible hasta que RH le asigne un correo real.
    const placeholderEmail = `noreply+${crypto.randomUUID()}@xignis.local`;
    const randomPassword = crypto.randomUUID() + crypto.randomUUID();
    const { data: created, error: createErr } = await withJwtRetry(() =>
      admin.auth.admin.createUser({
        email: placeholderEmail,
        password: randomPassword,
        email_confirm: true,
        user_metadata: { full_name: fullName, no_email: true },
      })
    );
    if (createErr || !created.user) {
      return json({ error: createErr?.message ?? "No se pudo crear el empleado." }, 400);
    }
    userId = created.user.id;
    resolvedEmail = placeholderEmail;
  }

  const { error: profErr } = await admin.from("profiles").upsert({
    id: userId,
    full_name: fullName,
    role,
    job_title: jobTitle,
    manager_id: managerId,
    department_id: departmentId,
    annual_vacation_days: annualVacationDays,
  }, { onConflict: "id" });
  if (profErr) return json({ error: profErr.message }, 400);

  return json({ ok: true, user_id: userId, email: resolvedEmail, has_email: hasEmail });
});
