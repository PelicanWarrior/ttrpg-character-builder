import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function SelectTTRPG() {
  const [characters, setCharacters] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState('');
  const [feastlandsCharacters, setFeastlandsCharacters] = useState([]);
  const [selectedFeastlandsCharacter, setSelectedFeastlandsCharacter] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCharacters = async () => {
      const username = localStorage.getItem('username');
      if (!username) {
        console.error('No username found in localStorage');
        return;
      }

      // Fetch user data including admin status
      const { data: userData, error: userError } = await supabase
        .from('user')
        .select('id, admin')
        .eq('username', username)
        .single();

      if (userError || !userData) {
        console.error('Error fetching user:', userError);
        return;
      }

      const userId = userData.id;
      setIsAdmin(!!userData.admin); // Set admin status

      // Fetch Star Wars characters
      const { data: swCharData, error: swCharError } = await supabase
        .from('SW_player_characters')
        .select('id, name')
        .eq('user_number', userId);

      if (swCharError) {
        console.error('Error fetching Star Wars characters:', swCharError);
      } else {
        setCharacters(swCharData || []);
      }

      // Fetch Feastlands characters (still fetched, but not shown)
      const { data: flCharData, error: flCharError } = await supabase
        .from('FL_player_characters')
        .select('id, name')
        .eq('playerID', userId);

      if (flCharError) {
        console.error('Error fetching Feastlands characters:', flCharError);
      } else {
        setFeastlandsCharacters(flCharData || []);
      }
    };

    fetchCharacters();
  }, []);

  // === STAR WARS HANDLERS ===
  const handleCreateCharacter = () => {
    navigate('/sweote-character-creator', { state: { create_character: true } });
  };

  const handleEditCharacter = async () => {
    if (!selectedCharacter) {
      alert('Please select a character to edit.');
      return;
    }

    const username = localStorage.getItem('username');
    if (!username) return;

    const { data: userData, error: userError } = await supabase
      .from('user')
      .select('id')
      .eq('username', username)
      .single();

    if (userError || !userData) return;

    const userId = userData.id;
    const selectedChar = characters.find(char => char.name === selectedCharacter);
    if (!selectedChar) return;

    const { data: charData, error: charError } = await supabase
      .from('SW_player_characters')
      .select('*')
      .eq('user_number', userId)
      .eq('id', selectedChar.id)
      .single();

    if (charError || !charData) {
      console.error('Error fetching character data:', charError);
      return;
    }

    localStorage.setItem('loadedCharacterId', selectedChar.id);
    navigate('/sweote-character-creator', { state: { create_character: false } });
  };

  const handleCharacterOverview = async () => {
    if (!selectedCharacter) {
      alert('Please select a character.');
      return;
    }

    const username = localStorage.getItem('username');
    if (!username) return;

    const { data: userData, error: userError } = await supabase
      .from('user')
      .select('id')
      .eq('username', username)
      .single();

    if (userError || !userData) return;

    const userId = userData.id;
    const selectedChar = characters.find(char => char.name === selectedCharacter);
    if (!selectedChar) return;

    const { data: charData, error: charError } = await supabase
      .from('SW_player_characters')
      .select('*')
      .eq('user_number', userId)
      .eq('id', selectedChar.id)
      .single();

    if (charError || !charData) return;

    localStorage.setItem('loadedCharacterId', selectedChar.id);
    navigate('/SW_character_overview');
  };

  // === FEASTLANDS HANDLERS (kept but not used in UI) ===
  const handleFeastlandsCreateCharacter = () => {
    navigate('/feastlands-character-creator', { state: { create_character: true } });
  };

  const handleFeastlandsEditCharacter = async () => {
    if (!selectedFeastlandsCharacter) {
      alert('Please select a Feastlands character to edit.');
      return;
    }

    const username = localStorage.getItem('username');
    if (!username) return;

    const { data: userData, error: userError } = await supabase
      .from('user')
      .select('id')
      .eq('username', username)
      .single();

    if (userError || !userData) return;

    const userId = userData.id;
    const selectedChar = feastlandsCharacters.find(char => char.name === selectedFeastlandsCharacter);
    if (!selectedChar) return;

    const { data: charData, error: charError } = await supabase
      .from('FL_player_characters')
      .select('*')
      .eq('playerID', userId)
      .eq('id', selectedChar.id)
      .single();

    if (charError || !charData) return;

    localStorage.setItem('loadedFeastlandsCharacterId', selectedChar.id);
    navigate('/feastlands-character-creator', { state: { create_character: false } });
  };

  const handleFeastlandsCharacterOverview = async () => {
    if (!selectedFeastlandsCharacter) {
      alert('Please select a Feastlands character.');
      return;
    }

    const username = localStorage.getItem('username');
    if (!username) return;

    const { data: userData, error: userError } = await supabase
      .from('user')
      .select('id')
      .eq('username', username)
      .single();

    if (userError || !userData) return;

    const userId = userData.id;
    const selectedChar = feastlandsCharacters.find(char => char.name === selectedFeastlandsCharacter);
    if (!selectedChar) return;

    const { data: charData, error: charError } = await supabase
      .from('FL_player_characters')
      .select('*')
      .eq('playerID', userId)
      .eq('id', selectedChar.id)
      .single();

    if (charError || !charData) return;

    localStorage.setItem('loadedFeastlandsCharacterId', selectedChar.id);
    navigate('/FL_character_overview');
  };

  const handleLogOut = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('loadedCharacterId');
    localStorage.removeItem('loadedFeastlandsCharacterId');
    window.location.href = '/';
  };

  const username = localStorage.getItem('username') || 'Guest';

  return (
    <div className="flex flex-col items-center min-h-screen bg-white py-10">
      <h1 className="text-2xl font-bold mb-6">Select TTRPG</h1>
      <p className="mb-6">
        Welcome {username}
        {isAdmin && <span className="text-red-600 font-semibold"> (Admin)</span>}
      </p>

      {/* TTRPG Sections Container */}
      <div className="flex flex-row justify-center w-full max-w-4xl space-x-4">
        {/* Star Wars: Edge of the Empire Section */}
        <div className="flex flex-col items-center w-1/2">
          <img
            src="/SWEotE.webp"
            alt="Star Wars: Edge of the Empire"
            className="w-64 mb-6"
          />
          <div className="border-2 border-black rounded-lg p-4 w-full text-center mb-4">
            <label className="block font-semibold text-lg mb-2">Select Character</label>
            <select
              className="border border-black rounded px-2 py-1 w-1/2 text-center"
              value={selectedCharacter}
              onChange={(e) => setSelectedCharacter(e.target.value)}
            >
              <option value="">Select Character</option>
              {characters.map((char) => (
                <option key={char.id} value={char.name}>
                  {char.name}
                </option>
              ))}
            </select>
          </div>
          <div className="border-2 border-black rounded-lg p-4 w-full text-center mb-4">
            <button
              onClick={handleEditCharacter}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
            >
              Edit Character
            </button>
            <button
              onClick={handleCharacterOverview}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 mr-2"
            >
              Character Overview
            </button>
            <button
              onClick={handleCreateCharacter}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create Character
            </button>
          </div>
        </div>

        {/* Feastlands Section - HIDDEN FROM UI BUT CODE KEPT */}
        {/* <div className="flex flex-col items-center w-1/2">
          ... (all Feastlands JSX commented out below)
        </div> */}
        {/* Uncomment below when ready to re-enable Feastlands */}
        {/*
        <div className="flex flex-col items-center w-1/2">
          <img src="/Feastlands.png" alt="Feastlands" className="w-64 mb-6" />
          <div className="border-2 border-black rounded-lg p-4 w-full text-center mb-4">
            <label className="block font-semibold text-lg mb-2">Select Character</label>
            <select
              className="border border-black rounded px-2 py-1 w-1/2 text-center"
              value={selectedFeastlandsCharacter}
              onChange={(e) => setSelectedFeastlandsCharacter(e.target.value)}
            >
              <option value="">Select Character</option>
              {feastlandsCharacters.map((char) => (
                <option key={char.id} value={char.name}>
                  {char.name}
                </option>
              ))}
            </select>
          </div>
          <div className="border-2 border-black rounded-lg p-4 w-full text-center mb-4">
            <button
              onClick={handleFeastlandsEditCharacter}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
            >
              Edit Character
            </button>
            <button
              onClick={handleFeastlandsCharacterOverview}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 mr-2"
            >
              Character Overview
            </button>
            <button
              onClick={handleFeastlandsCreateCharacter}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create Character
            </button>
          </div>
        </div>
        */}
      </div>

      {/* Log Out Button */}
      <div className="w-3/4 max-w-lg text-center mt-8">
        <button
          onClick={handleLogOut}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}