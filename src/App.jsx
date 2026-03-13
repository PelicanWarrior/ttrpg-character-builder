import "tailwindcss";
import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SelectTTRPG from './pages/SelectTTRPG';
import SWEotECharacterCreator from './pages/SWEotECharacterCreator';
import DNDModCharacterCreator from './pages/DNDMod_Character_Creator';
import SWCharacterOverview from './pages/SWCharacterOverview';
import SWCampaign from './pages/SW_campaign';
import SWCampaignEdit from './pages/SW_campaign_edit';
import SWNotes from './pages/SW_notes';
import DNDCampaign from './pages/DND_campaign';
import DNDCampaignEdit from './pages/DND_campaign_edit';
import DNDNotes from './pages/DND_notes';
import SWBattles from './pages/SW_battles';
import CampaignJoin from './pages/CampaignJoin';
import Settings from './pages/Settings';   // <-- NEW
import TTRPGGenericPage from './pages/TTRPGGenericPage';
import UnifiedTTRPGAdmin from './pages/UnifiedTTRPGAdmin';
import WWWCharacterCreator from './pages/WWW_character_creator';
import SoloAdventure from './pages/SoloAdventure';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/select-ttrpg" element={<SelectTTRPG />} />
      <Route path="/sweote-character-creator" element={<SWEotECharacterCreator />} />
      <Route path="/dndmod_character_creator" element={<DNDModCharacterCreator />} />
      <Route path="/SW_character_overview" element={<SWCharacterOverview />} />
      <Route path="/SW_campaign" element={<SWCampaign />} />
      <Route path="/SW_campaign_edit" element={<SWCampaignEdit />} />
      <Route path="/SW_notes" element={<SWNotes />} />
      <Route path="/DND_campaign" element={<DNDCampaign />} />
      <Route path="/DND_campaign_edit" element={<DNDCampaignEdit />} />
      <Route path="/DND_notes" element={<DNDNotes />} />
      <Route path="/SW_battles" element={<SWBattles />} />
      <Route path="/campaign-join" element={<CampaignJoin />} />
      <Route path="/settings" element={<Settings />} />   {/* NEW ROUTE */}
      <Route path="/settings/www-admin" element={<UnifiedTTRPGAdmin />} />
      <Route path="/www-character-creator" element={<WWWCharacterCreator />} />
      <Route path="/solo-adventure" element={<SoloAdventure />} />
      <Route path="/ttrpg/:initials/:page" element={<TTRPGGenericPage />} />
    </Routes>
  );
}