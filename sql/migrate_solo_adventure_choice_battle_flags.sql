-- Add battle flags to solo adventure choice rows.
-- Surprise Battle and Battle are mutually exclusive.

alter table if exists public."Solo_Adventure_Choices"
  add column if not exists surprise_battle boolean not null default false,
  add column if not exists battle boolean not null default false,
  add column if not exists battle_npc_ids jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'solo_adventure_choices_battle_mode_check'
  ) then
    alter table public."Solo_Adventure_Choices"
      add constraint solo_adventure_choices_battle_mode_check
      check (not (surprise_battle and battle));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'solo_adventure_choices_battle_npc_ids_array_check'
  ) then
    alter table public."Solo_Adventure_Choices"
      add constraint solo_adventure_choices_battle_npc_ids_array_check
      check (jsonb_typeof(battle_npc_ids) = 'array');
  end if;
end $$;
