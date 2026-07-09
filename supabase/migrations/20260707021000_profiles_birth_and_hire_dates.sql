-- birth_date + hire_date para widgets de cumpleaños/aniversarios en dashboards.
-- Opcionales: null hasta que el usuario o RH los capture.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS hire_date DATE;

CREATE INDEX IF NOT EXISTS profiles_birth_date_idx ON public.profiles (birth_date);
CREATE INDEX IF NOT EXISTS profiles_hire_date_idx ON public.profiles (hire_date);
