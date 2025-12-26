import "tailwindcss";
import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SelectTTRPG from './pages/SelectTTRPG';
import SWEotECharacterCreator from './pages/SWEotECharacterCreator';
import SWCharacterOverview from './pages/SWCharacterOverview';
import SWCampaign from './pages/SW_campaign';
import SWCampaignEdit from './pages/SW_campaign_edit';
import SWNotes from './pages/SW_notes';
import CampaignJoin from './pages/CampaignJoin';
import Settings from './pages/Settings';   // <-- NEW
import TTRPGGenericPage from './pages/TTRPGGenericPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/select-ttrpg" element={<SelectTTRPG />} />
      <Route path="/sweote-character-creator" element={<SWEotECharacterCreator />} />
      <Route path="/SW_character_overview" element={<SWCharacterOverview />} />
      <Route path="/SW_campaign" element={<SWCampaign />} />
      <Route path="/SW_campaign_edit" element={<SWCampaignEdit />} />
      <Route path="/SW_notes" element={<SWNotes />} />
      <Route path="/campaign-join" element={<CampaignJoin />} />
      <Route path="/settings" element={<Settings />} />   {/* NEW ROUTE */}
      <Route path="/ttrpg/:initials/:page" element={<TTRPGGenericPage />} />
    </Routes>
  );
}