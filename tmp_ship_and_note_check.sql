select id, name, class, weapons, passenger_capacity, ship_complement
from public."SW_ships"
where lower(name) = lower('Ashen Talon');

select count(*) as ship_matches
from public."SW_ships"
where lower(name) = lower('Ashen Talon');

select id, "Place_Name" as place_name, "Description" as notes
from public."SW_campaign_notes"
where id = 109;
