import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// Asigna un correo real a un empleado creado sin cuenta y le envía el enlace para
// definir su password. Solo RH/admin. Contraparte de admin-create-user sin correo.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return json({ error: "Falta autenticación." }, 401);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData.user) return json({ error: "Sesión inválida." }, 401);

  const { data: callerProfile } = await admin
    .from("profiles").select("role").eq("id", userData.user.id).single();
  if (!callerProfile || !["hr_admin", "admin"].includes(callerProfile.role)) {
    return json({ error: "Solo RH o admin pueden dar acceso." }, 403);
  }

  let payload: any;
  try { payload = await req.json(); } catch { return json({ error: "JSON inválido." }, 400); }

  const userId = String(payload.user_id ?? "").trim();
  const email = String(payload.email ?? "").trim().toLowerCase();
  const redirectTo = payload.redirect_to ? String(payload.redirect_to) : undefined;

  if (!userId) return json({ error: "Falta el empleado." }, 400);
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Correo inválido." }, 400);
  if (email.endsWith("@xignis.local")) return json({ error: "Usa un correo real." }, 400);

  // Setea el correo confirmado (sin doble opt-in) sobre el usuario placeholder.
  const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
    email,
    email_confirm: true,
    user_metadata: { no_email: false },
  });
  if (updErr) {
    const dup = /already|registered|exists/i.test(updErr.message);
    return json({ error: dup ? "Ese correo ya está en uso por otra cuenta." : updErr.message }, 400);
  }

  // Envía el correo "define tu password" usando la plantilla de recovery.
  const anon = createClient(url, anonKey, { auth: { persistSession: false } });
  const { error: mailErr } = await anon.auth.resetPasswordForEmail(email, { redirectTo });
  if (mailErr) return json({ error: mailErr.message }, 400);

  return json({ ok: true, user_id: userId, email });
});
