select id, "Place_Name" as place_name, left("Description", 1200) as notes
from public."SW_campaign_notes"
where id = 109;
