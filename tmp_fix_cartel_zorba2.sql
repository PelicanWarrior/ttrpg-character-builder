UPDATE public."SW_campaign_notes"
SET "Description" = replace(
  "Description",
  'Jabba''s father and the patriarch of the Desilijic kajidic. Currently operating out of Ryloth.',
  'A Hutt crime lord of the Desilijic kajidic. Currently operating out of Ryloth.'
)
WHERE "id" = 117;
SELECT right("Description", 250) AS tail FROM public."SW_campaign_notes" WHERE id = 117;
