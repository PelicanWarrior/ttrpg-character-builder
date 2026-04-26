import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://oyqfyjfkqzvatdddngbp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWZ5amZrcXp2YXRkZGRuZ2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDQ0MTcsImV4cCI6MjA3MjcyMDQxN30.1HsQNoFT7VHu1-rFAEOhDRlXYq3SyxhnHcP2whWIVhU'
);

const { data, error } = await supabase
  .from('SW_campaign_NPC')
  .select('id, Name, Part_of_Place, Description, CampaignID')
  .eq('CampaignID', 2)
  .or('Name.ilike.%IG-07%,Name.ilike.%IG07%');

if (error) { console.error(error.message); process.exit(1); }
console.log(JSON.stringify(data, null, 2));
