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
  'The Ashen Talon',
  'Sith Courier Interceptor',
  3,
  5,
  2,
  3,
  18,
  14,
  1,
  0,
  0,
  1,
  'Class 2',
  'Class 12',
  'Yes - encrypted (5 stored jumps)',
  'Medium',
  '1 pilot, 2 gunners',
  8,
  10,
  '1 week',
  null,
  E'Twin Linked Laser Cannons (fixed forward) | Damage: 6 | Critical: 3 | Range: Close | Qualities: Linked 1, Accurate 1\nProton Torpedo Launcher (fixed forward) | Damage: 8 | Critical: 2 | Range: Short | Qualities: Blast 6, Breach 6, Guided 3, Limited Ammo 4, Slow-Firing 1\nDorsal Twin Laser Turret | Damage: 5 | Critical: 3 | Range: Close | Qualities: Accurate 1, Linked 1, Fire Arc All\nVentral Twin Laser Turret | Damage: 5 | Critical: 3 | Range: Close | Qualities: Accurate 1, Linked 1, Fire Arc All',
  null
where not exists (
  select 1
  from public."SW_ships"
  where lower(name) = lower('The Ashen Talon')
);

select
  id,
  name,
  class,
  silhouette,
  speed,
  handling,
  armor,
  hull_trauma_threshold,
  system_strain_threshold,
  ship_complement,
  passenger_capacity
from public."SW_ships"
where lower(name) = lower('The Ashen Talon');
