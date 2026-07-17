alter table public.leave_requests
  add column if not exists coverage_contact text;

comment on column public.leave_requests.coverage_contact is
  'Persona responsable de cubrir actividades durante la ausencia.';
