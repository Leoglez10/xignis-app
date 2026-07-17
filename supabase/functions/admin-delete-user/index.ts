import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PROTECTED_EMAILS = new Set<string>([
  // Bloquea dar de baja cuentas del sistema si fuera necesario.
]);

const SEPARATION_TYPES = new Set([
  "voluntary",
  "involuntary",
  "end_contract",
  "relocation",
  "retirement",
  "other",
]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// Baja de empleado = SOFT DELETE: conserva perfil, solicitudes y notificaciones
// para historial; marca employment_status='terminated' y banea el auth user
// para que no pueda volver a entrar.
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
    return json({ error: "Solo RH o admin pueden dar de baja empleados." }, 403);
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "JSON inválido." }, 400);
  }

  const targetId = String(payload.user_id ?? "").trim();
  const confirmation = String(payload.confirmation ?? "").trim();
  const separationType = String(payload.separation_type ?? "").trim();
  const terminationReason = String(payload.termination_reason ?? "").trim();
  if (!targetId) return json({ error: "Falta el ID del empleado." }, 400);
  if (!SEPARATION_TYPES.has(separationType)) {
    return json({ error: "Tipo de separación inválido." }, 400);
  }

  if (targetId === userData.user.id) {
    return json({ error: "No puedes dar de baja tu propia cuenta." }, 400);
  }

  const { data: targetProfile, error: targetErr } = await admin
    .from("profiles").select("id, full_name, role").eq("id", targetId).single();
  if (targetErr || !targetProfile) return json({ error: "Empleado no encontrado." }, 404);

  const { data: targetUser } = await admin.auth.admin.getUserById(targetId);
  const targetEmail = targetUser?.user?.email?.toLowerCase();
  if (targetEmail && PROTECTED_EMAILS.has(targetEmail)) {
    return json({ error: "Esta cuenta no se puede dar de baja." }, 400);
  }

  if (confirmation !== targetProfile.full_name) {
    return json({ error: "El nombre de confirmación no coincide." }, 400);
  }

  // Sus reportes directos quedan sin jefe (van directo a RH en nuevas solicitudes).
  const { error: mgrErr } = await admin.from("profiles").update({ manager_id: null }).eq("manager_id", targetId);
  if (mgrErr) return json({ error: mgrErr.message }, 400);

  // Soft-delete: estado terminado + razón; historial intacto.
  const { error: updateErr } = await admin
    .from("profiles")
    .update({
      employment_status: "terminated",
      terminated_at: new Date().toISOString(),
      termination_reason: terminationReason || null,
      separation_type: separationType,
      manager_id: null,
    })
    .eq("id", targetId);
  if (updateErr) return json({ error: updateErr.message }, 400);

  // Bloquea el acceso: ban de auth (100 años) + revoca sesiones activas.
  const { error: banErr } = await admin.auth.admin.updateUserById(targetId, {
    ban_duration: "876000h",
  });
  if (banErr) return json({ error: banErr.message }, 400);
  await admin.auth.admin.signOut(targetId, "global").catch(() => {});

  return json({ ok: true, user_id: targetId });
});
