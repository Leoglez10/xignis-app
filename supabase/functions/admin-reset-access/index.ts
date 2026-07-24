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

/** RH corta el acceso de una cuenta: cierra sus sesiones, invalida la contraseña
 *  actual y la deja pendiente de activación otra vez, de modo que la persona vuelve
 *  a crear su contraseña la próxima vez que entre con su correo. */
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
    return json({ error: "Solo RH o admin pueden restablecer el acceso." }, 403);
  }

  let payload: any;
  try { payload = await req.json(); } catch { return json({ error: "JSON inválido." }, 400); }

  const userId = String(payload.user_id ?? "").trim();
  if (!userId) return json({ error: "Falta el empleado." }, 400);

  const { data: target, error: targetErr } = await admin.auth.admin.getUserById(userId);
  if (targetErr || !target.user) return json({ error: "No se encontró la cuenta." }, 404);
  if (!target.user.email || target.user.email.endsWith("@xignis.local")) {
    return json({ error: "Este empleado todavía no tiene correo asignado." }, 400);
  }

  // Contraseña aleatoria que nadie conoce + flag de activación: el login por correo
  // vuelve a pedirle que cree una contraseña nueva.
  const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
    password: crypto.randomUUID() + crypto.randomUUID(),
    user_metadata: { must_set_password: true },
  });
  if (updErr) return json({ error: updErr.message }, 400);

  const { error: sessErr } = await admin.rpc("revoke_user_sessions", { p_user_id: userId });
  if (sessErr) return json({ error: "Se restableció la contraseña, pero no se pudieron cerrar las sesiones." }, 500);

  return json({ ok: true, user_id: userId, email: target.user.email });
});
