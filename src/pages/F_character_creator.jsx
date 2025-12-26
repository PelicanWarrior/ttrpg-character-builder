import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function FCharacterCreator() {
  const [races, setRaces] = useState([]);
  const [selectedRace, setSelectedRace] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [activeTab, setActiveTab] = useState('Species');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRaces = async () => {
      const { data: raceData, error: raceError } = await supabase
        .from('FL_races')
        .select('race_name');

      if (raceError) {
        console.error('Error fetching races:', raceError);
      } else {
        setRaces(raceData || []);
      }
    };
    fetchRaces();
  }, []);

  const handleChooseTTRPG = () => {
    navigate('/select-ttrpg');
  };

  const handleRaceSelect = (raceName) => {
    setSelectedRace(raceName);
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-white py-10">
      {/* ---------- FIXED POSITION ELEMENTS ---------- */}
      <img src="/F_Pictures/Logo.png" alt="Feastlands" className="w-64 mb-6" />

      <div className="w-3/4 max-w-lg text-center mb-6">
        <button
          onClick={handleChooseTTRPG}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Choose TTRPG
        </button>
      </div>

      <div className="border-2 border-black rounded-lg p-4 w-3/4 max-w-lg mb-4 flex items-center">
        <label className="font-semibold text-lg mr-4">Characters Name</label>
        <input
          type="text"
          value={characterName}
          onChange={(e) => setCharacterName(e.target.value)}
          className="border border-black rounded px-2 py-1 flex-1 text-center"
          placeholder="Enter character name"
        />
      </div>

      {/* ---------- TAB SYSTEM – 3× WIDER CONTENT ---------- */}
      <div className="w-full max-w-5xl"> {/* Wider race list */}
        {/* Tab Headers */}
        <div className="flex border-b-2 border-black">
          <button
            className={`flex-1 py-2 px-4 text-lg font-semibold text-center ${
              activeTab === 'Species'
                ? 'bg-gray-200 border-2 border-black border-b-0 rounded-t-lg'
                : 'bg-white'
            }`}
            onClick={() => setActiveTab('Species')}
          >
            Species
          </button>
          <button
            className={`flex-1 py-2 px-4 text-lg font-semibold text-center ${
              activeTab === 'Class'
                ? 'bg-gray-200 border-2 border-black border-b-0 rounded-t-lg'
                : 'bg-white'
            }`}
            onClick={() => setActiveTab('Class')}
          >
            Class
          </button>
        </div>

        {/* Fixed-height + scrollable content */}
        <div
          className="p-0 bg-white"
          style={{ height: '500px', overflowY: 'auto', overflowX: 'hidden' }}
        >
          {activeTab === 'Species' && (
            <div className="border-2 border-black rounded-b-lg p-4 h-full flex flex-col space-y-4 bg-white">
              {races.map((race, index) => (
                <div
                  key={index}
                  className={`rounded-lg p-2 flex items-center justify-between cursor-pointer w-full ${
                    selectedRace === race.race_name ? 'bg-gray-200' : ''
                  }`}
                  onClick={() => handleRaceSelect(race.race_name)}
                >
                  <div className="flex items-center">
                    <img
                      src={`/F_Pictures/${race.race_name}_Face.png`}
                      alt={`${race.race_name} Face`}
                      className="w-16 h-16 mr-4 border-2 border-black rounded"
                    />
                    <span className="text-lg">{race.race_name}</span>
                  </div>
                  <img src="/Blue_Arrow.png" alt="Blue Arrow" className="w-8 h-8" />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'Class' && (
            <div className="flex flex-col space-y-4 h-full justify-center items-center text-gray-500">
              <p>Class selection coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

