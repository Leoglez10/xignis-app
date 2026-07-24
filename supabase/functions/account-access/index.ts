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

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Pre-login endpoint for accounts created by HR without an invite email.
 *
 *  action "status"   -> "pending" if the account still has to set its password,
 *                       "password" for every other case.
 *  action "activate" -> sets the password of a pending account and clears the flag.
 *
 *  Unknown emails deliberately answer "password" (and activate answers a generic
 *  error) so this endpoint cannot be used to enumerate registered addresses. */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  let payload: any;
  try { payload = await req.json(); } catch { return json({ error: "JSON inválido." }, 400); }

  const action = String(payload.action ?? "status");
  const email = String(payload.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return json({ error: "Correo inválido." }, 400);

  const { data, error } = await admin.rpc("account_activation_state", { p_email: email });
  if (error) return json({ error: "No se pudo verificar la cuenta." }, 500);

  const account = (data ?? [])[0] as { user_id: string; pending: boolean } | undefined;
  const pending = Boolean(account?.pending);

  if (action === "status") {
    return json({ status: pending ? "pending" : "password" });
  }

  if (action !== "activate") return json({ error: "Acción inválida." }, 400);

  const password = String(payload.password ?? "");
  if (password.length < 8) return json({ error: "La contraseña necesita al menos 8 caracteres." }, 400);

  // Same generic answer for "no existe" and "ya tiene contraseña": no enumeration.
  if (!account || !pending) {
    return json({ error: "Esta cuenta ya tiene contraseña. Inicia sesión o recupérala." }, 400);
  }

  const { error: updErr } = await admin.auth.admin.updateUserById(account.user_id, {
    password,
    user_metadata: { must_set_password: false },
  });
  if (updErr) return json({ error: updErr.message }, 400);

  return json({ ok: true });
});
