-- Cierra la superficie: quita el EXECUTE por defecto (PUBLIC/anon) de los RPC
-- security definer. Solo 'authenticated' los puede invocar (grant explícito previo).
revoke execute on function public.get_profile_sheet(uuid) from public, anon;
revoke execute on function public.set_profile_custom_field(uuid, text, jsonb) from public, anon;
