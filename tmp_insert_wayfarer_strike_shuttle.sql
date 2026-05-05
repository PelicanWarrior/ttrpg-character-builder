insert into public."SW_ships" (
  name,
  class,
  silhouette,
  speed,
  handling,
  armor,
  hull_trauma_threshold,
  system_strain_threshold,
  defence_fore,
  defence_port,
  defence_starboard,
  defence_aft,
  hyperdrive_primary,
  hyperdrive_backup,
  navicomputer,
  sensor_range,
  ship_complement,
  encumbrance_capacity,
  passenger_capacity,
  consumables,
  customization_hard_points,
  weapons,
  source
)
select
  'Wayfarer Strike Shuttle',
  'Armed Transport Shuttle',
  4,
  3,
  0,
  3,
  20,
  16,
  1,
  0,
  0,
  1,
  'Class 2',
  'Class 15',
  'Yes',
  'Medium',
  '1 pilot, 1 gunner, 2 crew',
  24,
  4,
  '2 months',
  3,
  $$Twin Medium Laser Cannons (Forward) | Damage: 6 | Critical: 3 | Range: Close | Qualities: Linked 1
Dorsal Light Ion Turret (All) | Damage: 5 | Critical: 4 | Range: Close | Qualities: Ion, Limited Ammo 6$$,
  null
where not exists (
  select 1
  from public."SW_ships"
  where lower(name) = lower('Wayfarer Strike Shuttle')
);

select
  id,
  name,
  class,
  ship_complement,
  passenger_capacity,
  speed,
  handling
from public."SW_ships"
where lower(name) = lower('Wayfarer Strike Shuttle');
