import { supabase } from './src/supabaseClient.js';

const { data: note, error } = await supabase
  .from('SW_campaign_notes')
  .select('id, Place_Name, Part_of_Place, Description')
  .eq('CampaignID', 2)
  .eq('Place_Name', '4th September 2026')
  .single();
if (error) throw error;

const requiredDetails = [
  'Uscru District', 'Kesh Ral', 'Ord Mantell', 'Tol and Nyx',
  'data chips', 'coordinates for Kamino', 'reconnaissance', '10,000 credits',
];
const missingDetails = requiredDetails.filter((detail) => !note.Description.includes(detail));
console.log(JSON.stringify({
  id: note.id,
  title: note.Place_Name,
  parentId: note.Part_of_Place,
  verifiedDetails: requiredDetails.filter((detail) => note.Description.includes(detail)),
  missingDetails,
}, null, 2));
if (missingDetails.length || note.Part_of_Place !== '51') {
  throw new Error('Session note verification failed.');
}