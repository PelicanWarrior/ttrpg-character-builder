import "tailwindcss";
import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SelectTTRPG from './pages/SelectTTRPG';
import SWEotECharacterCreator from './pages/SWEotECharacterCreator';
import SWCharacterOverview from './pages/SWCharacterOverview';
import FeastlandsCharacterCreator from './pages/FeastlandsCharacterCreator';
import SWCampaign from './pages/SW_campaign';
import Settings from './pages/Settings';   // <-- NEW

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/select-ttrpg" element={<SelectTTRPG />} />
      <Route path="/sweote-character-creator" element={<SWEotECharacterCreator />} />
      <Route path="/SW_character_overview" element={<SWCharacterOverview />} />
      <Route path="/feastlands-character-creator" element={<FeastlandsCharacterCreator />} />
      <Route path="/sw-campaign" element={<SWCampaign />} />
      <Route path="/settings" element={<Settings />} />   {/* NEW ROUTE */}
    </Routes>
  );
}