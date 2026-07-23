-- Areas can carry an accent color chosen by HR.
-- NULL keeps the derived-from-id fallback, so existing areas look unchanged.
alter table public.departments
  add column if not exists color text
  check (color is null or color in ('sky', 'violet', 'amber', 'rose', 'teal', 'indigo', 'orange', 'fuchsia'));

comment on column public.departments.color is
  'Palette key for the area accent color. NULL = derive from id (see src/features/admin/areaColor.ts).';
