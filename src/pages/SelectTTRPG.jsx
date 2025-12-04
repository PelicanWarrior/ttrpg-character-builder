import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function SelectTTRPG() {
  const [characters, setCharacters] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState('');
  const [staCharacters, setStaCharacters] = useState([]);
  const [selectedStaCharacter, setSelectedStaCharacter] = useState('');
  const [feastlandsCharacters, setFeastlandsCharacters] = useState([]);
  const [selectedFeastlandsCharacter, setSelectedFeastlandsCharacter] = useState('');
  const [animalAdventuresCharacters, setAnimalAdventuresCharacters] = useState([]);
  const [selectedAnimalAdventuresCharacter, setSelectedAnimalAdventuresCharacter] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [playerId, setPlayerId] = useState(null);

  const [ttrpgVisibility, setTtrpgVisibility] = useState({
    'Star Wars': true,
    'Star Trek Adventures': true,
    'Feastlands': false,
    'Animal Adventures': false,
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const username = localStorage.getItem('username');
      if (!username) return;

      const { data: userData } = await supabase
        .from('user')
        .select('id, admin')
        .eq('username', username)
        .single();

      if (!userData) return;

      setPlayerId(userData.id);
      setIsAdmin(!!userData.admin);

      const [swRes, staRes, flRes] = await Promise.all([
        supabase.from('SW_player_characters').select('id, name').eq('user_number', userData.id),
        supabase.from('STA_player_characters').select('id, name').eq('playerID', userData.id),
        supabase.from('FL_player_characters').select('id, name').eq('playerID', userData.id),
      ]);

      setCharacters(swRes.data || []);
      setStaCharacters(staRes.data || []);
      setFeastlandsCharacters(flRes.data || []);

      const { data: ttrpgData } = await supabase
        .from('TTRPGs')
        .select('TTRPG_name, show');

      const visibilityMap = {};
      ttrpgData?.forEach(row => visibilityMap[row.TTRPG_name] = row.show);

      setTtrpgVisibility({
        'Star Wars': visibilityMap['Star Wars'] ?? true,
        'Star Trek Adventures': visibilityMap['Star Trek Adventures'] ?? true,
        'Feastlands': visibilityMap['Feastlands'] ?? false,
        'Animal Adventures': visibilityMap['Animal Adventures'] ?? false,
      });
    };

    fetchData();
  }, []);

  const toggleTTRPGVisibility = async (name, current) => {
    const newVal = !current;
    await supabase.from('TTRPGs').update({ show: newVal }).eq('TTRPG_name', name);
    setTtrpgVisibility(prev => ({ ...prev, [name]: newVal }));
  };

  const shouldShow = (name) => isAdmin || ttrpgVisibility[name] === true;

  const username = localStorage.getItem('username') || 'Guest';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold text-center text-gray-800 mb-4">Select TTRPG</h1>
        <p className="text-center text-2xl mb-12 text-gray-700">
          Welcome {username}
          {isAdmin && <span className="text-red-600 font-bold"> (Admin)</span>}
        </p>

        {/* Settings and Log Out Buttons */}
        <div className="flex justify-center gap-6 mb-20">
          <button onClick={() => navigate('/settings', { state: { playerId } })} className="px-12 py-4 bg-gray-800 text-white text-lg font-bold rounded-xl hover:bg-gray-900 shadow-lg transition">
            Settings
          </button>
          <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} className="px-12 py-4 bg-red-600 text-white text-lg font-bold rounded-xl hover:bg-red-700 shadow-lg transition">
            Log Out
          </button>
        </div>

        {/* TOP ROW: Star Wars + Star Trek Adventures (NO HEADER) */}
        {(shouldShow('Star Wars') || shouldShow('Star Trek Adventures')) && (
          <div className="mb-20">
            {/* Removed "Sci-Fi Adventures" header */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">

              {/* STAR WARS */}
              {shouldShow('Star Wars') && (
                <div className="bg-white rounded-3xl shadow-2xl border-4 border-gray-900 overflow-hidden transform hover:scale-105 transition duration-300">
                  {isAdmin && (
                    <div className="bg-gray-900 text-white p-4 flex items-center gap-4">
                      <input type="checkbox" checked={ttrpgVisibility['Star Wars']} onChange={() => toggleTTRPGVisibility('Star Wars', ttrpgVisibility['Star Wars'])} className="w-6 h-6 rounded" />
                      <span className="font-bold text-lg">Show Star Wars</span>
                    </div>
                  )}
                  <div className="p-10 text-center">
                    <img src="/Star Wars.png" alt="Star Wars" className="w-72 mx-auto mb-8" />
                    <select className="w-full max-w-md mx-auto border-4 border-gray-800 rounded-xl px-6 py-4 text-lg mb-8 bg-white" value={selectedCharacter} onChange={(e) => setSelectedCharacter(e.target.value)}>
                      <option>Select Character</option>
                      {characters.map(c => <option key={c.id}>{c.name}</option>)}
                    </select>
                    <div className="flex justify-center gap-6">
                      <button onClick={() => { if (!selectedCharacter) return alert('Select a character'); const char = characters.find(c => c.name === selectedCharacter); localStorage.setItem('loadedCharacterId', char.id); navigate('/sweote-character-creator', { state: { create_character: false } }); }} className="px-10 py-5 bg-blue-600 text-white font-bold text-xl rounded-xl hover:bg-blue-700 shadow-lg transition">Edit</button>
                      <button onClick={() => { if (!selectedCharacter) return alert('Select a character'); const char = characters.find(c => c.name === selectedCharacter); localStorage.setItem('loadedCharacterId', char.id); navigate('/SW_character_overview'); }} className="px-10 py-5 bg-purple-600 text-white font-bold text-xl rounded-xl hover:bg-purple-700 shadow-lg transition">Overview</button>
                      <button onClick={() => navigate('/sweote-character-creator', { state: { create_character: true } })} className="px-10 py-5 bg-green-600 text-white font-bold text-xl rounded-xl hover:bg-green-700 shadow-lg transition">Create</button>
                    </div>
                  </div>
                </div>
              )}

              {/* STAR TREK ADVENTURES */}
              {shouldShow('Star Trek Adventures') && (
                <div className="bg-white rounded-3xl shadow-2xl border-4 border-gray-900 overflow-hidden transform hover:scale-105 transition duration-300">
                  {isAdmin && (
                    <div className="bg-gray-900 text-white p-4 flex items-center gap-4">
                      <input type="checkbox" checked={ttrpgVisibility['Star Trek Adventures']} onChange={() => toggleTTRPGVisibility('Star Trek Adventures', ttrpgVisibility['Star Trek Adventures'])} className="w-6 h-6 rounded" />
                      <span className="font-bold text-lg">Show Star Trek Adventures</span>
                    </div>
                  )}
                  <div className="p-10 text-center">
                    <img src="/Star Trek Adventures.png" alt="Star Trek Adventures" className="w-72 mx-auto mb-8" />
                    <select className="w-full max-w-md mx-auto border-4 border-gray-800 rounded-xl px-6 py-4 text-lg mb-8 bg-white" value={selectedStaCharacter} onChange={(e) => setSelectedStaCharacter(e.target.value)}>
                      <option>Select Character</option>
                      {staCharacters.map(c => <option key={c.id}>{c.name}</option>)}
                    </select>
                    <div className="flex justify-center gap-6">
                      <button onClick={() => { if (!selectedStaCharacter) return alert('Select a character'); const char = staCharacters.find(c => c.name === selectedStaCharacter); localStorage.setItem('loadedStaCharacterId', char.id); navigate('/sta-character-creator', { state: { create_character: false } }); }} className="px-10 py-5 bg-blue-600 text-white font-bold text-xl rounded-xl hover:bg-blue-700 shadow-lg transition">Edit</button>
                      <button onClick={() => { if (!selectedStaCharacter) return alert('Select a character'); const char = staCharacters.find(c => c.name === selectedStaCharacter); localStorage.setItem('loadedStaCharacterId', char.id); navigate('/STA_character_overview'); }} className="px-10 py-5 bg-purple-600 text-white font-bold text-xl rounded-xl hover:bg-purple-700 shadow-lg transition">Overview</button>
                      <button onClick={() => navigate('/sta-character-creator', { state: { create_character: true } })} className="px-10 py-5 bg-green-600 text-white font-bold text-xl rounded-xl hover:bg-green-700 shadow-lg transition">Create</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* D&D MODS ROW */}
        {(shouldShow('Feastlands') || shouldShow('Animal Adventures')) && (
          <div>
            <h2 className="text-5xl font-bold text-purple-700 text-center mb-16">
              Dungeons and Dragons Mods
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 max-w-6xl mx-auto">
              {shouldShow('Feastlands') && (
                <div className="bg-white rounded-3xl shadow-2xl border-4 border-gray-900 overflow-hidden transform hover:scale-105 transition duration-300">
                  {isAdmin && (
                    <div className="bg-gray-900 text-white p-4 flex items-center gap-4">
                      <input type="checkbox" checked={ttrpgVisibility['Feastlands']} onChange={() => toggleTTRPGVisibility('Feastlands', ttrpgVisibility['Feastlands'])} className="w-6 h-6 rounded" />
                      <span className="font-bold text-lg">Show Feastlands</span>
                    </div>
                  )}
                  <div className="p-10 text-center">
                    <img src="/Feastlands.png" alt="Feastlands" className="w-72 mx-auto mb-8" />
                    <select className="w-full max-w-md mx-auto border-4 border-gray-800 rounded-xl px-6 py-4 text-lg mb-8 bg-white" value={selectedFeastlandsCharacter} onChange={(e) => setSelectedFeastlandsCharacter(e.target.value)}>
                      <option>Select Character</option>
                      {feastlandsCharacters.map(c => <option key={c.id}>{c.name}</option>)}
                    </select>
                    <div className="flex justify-center gap-6">
                      <button onClick={() => { if (!selectedFeastlandsCharacter) return alert('Select a character'); const char = feastlandsCharacters.find(c => c.name === selectedFeastlandsCharacter); localStorage.setItem('loadedFeastlandsCharacterId', char.id); navigate('/feastlands-character-creator', { state: { create_character: false } }); }} className="px-10 py-5 bg-blue-600 text-white font-bold text-xl rounded-xl hover:bg-blue-700 shadow-lg transition">Edit</button>
                      <button onClick={() => { if (!selectedFeastlandsCharacter) return alert('Select a character'); const char = feastlandsCharacters.find(c => c.name === selectedFeastlandsCharacter); localStorage.setItem('loadedFeastlandsCharacterId', char.id); navigate('/FL_character_overview'); }} className="px-10 py-5 bg-purple-600 text-white font-bold text-xl rounded-xl hover:bg-purple-700 shadow-lg transition">Overview</button>
                      <button onClick={() => navigate('/feastlands-character-creator', { state: { create_character: true } })} className="px-10 py-5 bg-green-600 text-white font-bold text-xl rounded-xl hover:bg-green-700 shadow-lg transition">Create</button>
                    </div>
                  </div>
                </div>
              )}

              {shouldShow('Animal Adventures') && (
                <div className="bg-white rounded-3xl shadow-2xl border-4 border-gray-900 overflow-hidden transform hover:scale-105 transition duration-300">
                  {isAdmin && (
                    <div className="bg-gray-900 text-white p-4 flex items-center gap-4">
                      <input type="checkbox" checked={ttrpgVisibility['Animal Adventures']} onChange={() => toggleTTRPGVisibility('Animal Adventures', ttrpgVisibility['Animal Adventures'])} className="w-6 h-6 rounded" />
                      <span className="font-bold text-lg">Show Animal Adventures</span>
                    </div>
                  )}
                  <div className="p-10 text-center">
                    <img src="/Animal Adventures.png" alt="Animal Adventures" className="w-72 mx-auto mb-8" />
                    <select disabled className="w-full max-w-md mx-auto border-4 border-gray-400 rounded-xl px-6 py-4 text-lg mb-8 bg-gray-100 cursor-not-allowed">
                      <option>No characters yet</option>
                    </select>
                    <div className="flex justify-center gap-6">
                      <button disabled className="px-10 py-5 bg-gray-500 text-gray-300 font-bold text-xl rounded-xl cursor-not-allowed">Edit</button>
                      <button disabled className="px-10 py-5 bg-gray-500 text-gray-300 font-bold text-xl rounded-xl cursor-not-allowed">Overview</button>
                      <button disabled className="px-10 py-5 bg-gray-500 text-gray-300 font-bold text-xl rounded-xl cursor-not-allowed">Create</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}