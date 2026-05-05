UPDATE public."SW_campaign_notes"
SET "Description" = regexp_replace(
  "Description",
  'ZORBA DESILIJIC TIURE \(Zorba the Hutt\):\nJabba''s father and the patriarch of the Desilijic kajidic\. Currently operating out of Ryloth\.',
  'ZORBA DESILIJIC TIURE (Zorba the Hutt):
A Hutt crime lord of the Desilijic kajidic. Currently operating out of Ryloth.',
  'g'
)
WHERE "id" = 117;
SELECT id, right("Description", 300) AS tail FROM public."SW_campaign_notes" WHERE id = 117;
