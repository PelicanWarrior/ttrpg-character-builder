-- Add skill-check aware destination fields directly on choice rows.
-- This migration supports the Add Option UX where enabling skill checks
-- splits destination into On Success and On Failure.

alter table if exists public."Solo_Adventure_Choices"
  add column if not exists has_skill_check boolean not null default false,
  add column if not exists skill_name text,
  add column if not exists skill_difficulty text,
  add column if not exists success_page_id bigint,
  add column if not exists failure_page_id bigint;

-- Add foreign keys only if they do not already exist.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'solo_adventure_choices_success_page_id_fkey'
  ) then
    alter table public."Solo_Adventure_Choices"
      add constraint solo_adventure_choices_success_page_id_fkey
      foreign key (success_page_id)
      references public."Solo_Adventure_Pages"(id)
      on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'solo_adventure_choices_failure_page_id_fkey'
  ) then
    alter table public."Solo_Adventure_Choices"
      add constraint solo_adventure_choices_failure_page_id_fkey
      foreign key (failure_page_id)
      references public."Solo_Adventure_Pages"(id)
      on delete set null;
  end if;
end $$;

create index if not exists idx_solo_adventure_choices_success_page_id
  on public."Solo_Adventure_Choices"(success_page_id);

create index if not exists idx_solo_adventure_choices_failure_page_id
  on public."Solo_Adventure_Choices"(failure_page_id);
