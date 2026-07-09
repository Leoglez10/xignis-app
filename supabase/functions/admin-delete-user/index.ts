import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PROTECTED_EMAILS = new Set<string>([
  // Bloquea borrar cuentas del sistema si fuera necesario.
  // Ajusta desde el dashboard de Supabase si quieres añadir más.
]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
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
    return json({ error: "Solo RH o admin pueden eliminar empleados." }, 403);
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "JSON inválido." }, 400);
  }

  const targetId = String(payload.user_id ?? "").trim();
  const confirmation = String(payload.confirmation ?? "").trim();
  if (!targetId) return json({ error: "Falta el ID del empleado." }, 400);

  if (targetId === userData.user.id) {
    return json({ error: "No puedes eliminar tu propia cuenta." }, 400);
  }

  const { data: targetProfile, error: targetErr } = await admin
    .from("profiles").select("id, full_name, role, email:auth.users(email)").eq("id", targetId).single();
  if (targetErr || !targetProfile) return json({ error: "Empleado no encontrado." }, 404);

  const targetEmail = (targetProfile as { email?: { email?: string } | null }).email?.email;
  if (targetEmail && PROTECTED_EMAILS.has(targetEmail)) {
    return json({ error: "Esta cuenta no se puede eliminar." }, 400);
  }

  if (confirmation !== targetProfile.full_name) {
    return json({ error: "El nombre de confirmación no coincide." }, 400);
  }

  // Limpia FK NO ACTION antes de borrar para que la transacción no falle.
  await admin.from("profiles").update({ manager_id: null }).eq("manager_id", targetId);
  await admin.from("leave_requests").update({ reviewed_by: null }).eq("reviewed_by", targetId);
  await admin.from("leave_request_approvals").update({ reviewer_id: null }).eq("reviewer_id", targetId);

  // auth.users.id -> profiles.id es CASCADE; perfiles -> leave_requests (employee_id) y
  // -> notifications (user_id) son CASCADE. Borra el auth user para arrastrar todo.
  const { error: deleteErr } = await admin.auth.admin.deleteUser(targetId);
  if (deleteErr) return json({ error: deleteErr.message }, 400);

  return json({ ok: true, user_id: targetId });
});
