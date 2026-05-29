-- =============================================================================
-- 0007 — Superadmin del sistema + plantilla de cuidados por caballo
-- =============================================================================

-- 1. is_superadmin en profiles. Único flag para acceder a /admin.
alter table public.profiles
  add column if not exists is_superadmin boolean not null default false;

-- 2. care_template_id en horses. Permite que el propietario asigne una
--    plantilla de cuidados específica por caballo (la del club por defecto).
alter table public.horses
  add column if not exists care_template_id uuid
  references public.horse_care_templates(id) on delete set null;

create index if not exists horses_care_template_idx
  on public.horses(care_template_id);
