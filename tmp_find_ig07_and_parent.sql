-- Note ID 51 (parent of session note 116)
SELECT id, "Place_Name", "Part_of_Place", "CampaignID" FROM public."SW_campaign_notes" WHERE id = 51;
-- IG-07 as an NPC?
SELECT id, "Name", "Part_of_Place", "CampaignID", "Description", "Abilities" FROM public."SW_campaign_NPC" WHERE "Name" ILIKE '%IG%' AND "CampaignID" = 2;
-- IG-07 as a note?
SELECT id, "Place_Name", "Part_of_Place", "CampaignID", "Description" FROM public."SW_campaign_notes" WHERE "Place_Name" ILIKE '%IG%' AND "CampaignID" = 2;
-- What note IDs exist in the Ashen Testament hierarchy?
SELECT id, "Place_Name", "Part_of_Place" FROM public."SW_campaign_notes" WHERE "Part_of_Place"::text = '96' ORDER BY id;
