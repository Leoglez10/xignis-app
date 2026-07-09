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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return json({ error: "Falta autenticación." }, 401);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData.user) return json({ error: "Sesión inválida." }, 401);

  const { data: callerProfile } = await admin
    .from("profiles").select("role").eq("id", userData.user.id).single();
  if (!callerProfile || !["hr_admin", "admin"].includes(callerProfile.role)) {
    return json({ error: "Solo RH o admin pueden crear usuarios." }, 403);
  }

  let payload: any;
  try { payload = await req.json(); } catch { return json({ error: "JSON inválido." }, 400); }

  const email = String(payload.email ?? "").trim().toLowerCase();
  const fullName = String(payload.full_name ?? "").trim();
  const role = String(payload.role ?? "employee");
  const jobTitle = payload.job_title ? String(payload.job_title).trim() : null;
  const managerId = payload.manager_id ? String(payload.manager_id) : null;
  const redirectTo = payload.redirect_to ? String(payload.redirect_to) : undefined;
  const annualVacationDays = parseVacationDays(payload.annual_vacation_days);

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Correo inválido." }, 400);
  if (!fullName) return json({ error: "Falta el nombre." }, 400);
  if (!ALLOWED_ROLES.includes(role)) return json({ error: "Rol inválido." }, 400);
  if (Number.isNaN(annualVacationDays)) return json({ error: "Días de vacaciones inválidos." }, 400);

  const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
    redirectTo,
  });
  if (inviteErr || !invited.user) {
    return json({ error: inviteErr?.message ?? "No se pudo invitar." }, 400);
  }

  const { error: profErr } = await admin.from("profiles").upsert({
    id: invited.user.id,
    full_name: fullName,
    role,
    job_title: jobTitle,
    manager_id: managerId,
    annual_vacation_days: annualVacationDays,
  }, { onConflict: "id" });
  if (profErr) return json({ error: profErr.message }, 400);

  return json({ ok: true, user_id: invited.user.id, email });
});
