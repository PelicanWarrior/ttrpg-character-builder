SELECT id, "Place_Name", "CampaignID"
FROM public."SW_campaign_notes"
WHERE LOWER("Place_Name") IN (
  LOWER('NARRARIVE EPISODE II'),
  LOWER('NARRATIVE EPISODE II')
)
ORDER BY "CampaignID", id;
