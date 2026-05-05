select id, name, class, weapons, passenger_capacity, ship_complement
from public."SW_ships"
where lower(name) = lower('Ashen Talon');

select count(*) as ship_matches
from public."SW_ships"
where lower(name) = lower('Ashen Talon');
