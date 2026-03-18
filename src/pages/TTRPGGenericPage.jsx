import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// Dynamically import character creator components
const characterCreators = {
  'FA': () => import('./F_character_creator').then(m => m.default),
  // Add more TTRPGs here as needed
};

export default function TTRPGGenericPage() {
  const navigate = useNavigate();
  const { initials, page } = useParams();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [rows, setRows] = useState([]);
  const [userId, setUserId] = useState(null);
  const [CharacterCreatorComponent, setCharacterCreatorComponent] = useState(null);

  const upperInitials = (initials || '').toUpperCase();
  const isFallout = upperInitials === 'FA' || upperInitials === 'F';

  useEffect(() => {
    const init = async () => {
      try {
        const username = localStorage.getItem('username');
        if (username) {
          const { data: userData } = await supabase
            .from('user')
            .select('id')
            .eq('username', username)
            .single();
          setUserId(userData?.id || null);
        }

        if (page === 'character_creator') {
          // Dynamically load the character creator component
          if (characterCreators[upperInitials]) {
            const component = await characterCreators[upperInitials]();
            setCharacterCreatorComponent(() => component);
          } else {
            setErrorMsg(`Character creator not found for ${initials}`);
          }
        } else if (page === 'player_characters') {
          const table = isFallout
            ? 'Fa_player_characters'
            : `${upperInitials}_player_characters`;
          const { data, error } = await supabase
            .from(table)
            .select('*');
          if (error) {
            setErrorMsg(`Please create ${table}`);
          } else {
            let filtered = data || [];
            if (userId != null) {
              filtered = filtered.filter(r => (
                r.playerID === userId ||
                r.user_number === userId ||
                r.userID === userId ||
                r.user_id === userId
              ));
            }
            setRows(filtered);
          }
        } else {
          const name = `${upperInitials}_${page}`;
          setErrorMsg(`Please create ${name}`);
        }
      } catch (err) {
        setErrorMsg('Unexpected error loading data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [initials, page, upperInitials, userId, isFallout]);

  const goBack = () => navigate('/select-ttrpg');

  const handleFalloutEdit = (id) => {
    localStorage.setItem('loadedCharacterId', String(id));
    navigate('/Fa_character_creator');
  };

  const handleFalloutOverview = (id) => {
    localStorage.setItem('loadedCharacterId', String(id));
    navigate('/Fa_character_overview');
  };

  const handleFalloutDelete = async (id, displayName) => {
    const ok = window.confirm(`Delete ${displayName || 'this character'}?`);
    if (!ok) return;

    const { error } = await supabase
      .from('Fa_player_characters')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete Fallout character:', error);
      window.alert('Failed to delete Fallout character.');
      return;
    }

    setRows((prev) => prev.filter((row) => row.id !== id));
    const loaded = localStorage.getItem('loadedCharacterId');
    if (loaded && String(loaded) === String(id)) {
      localStorage.removeItem('loadedCharacterId');
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <button onClick={goBack} className="mb-4 px-4 py-2 bg-gray-700 text-white rounded">Back</button>
        <div>Loading...</div>
      </div>
    );
  }

  if (page === 'character_creator') {
    if (errorMsg) {
      return (
        <div className="max-w-5xl mx-auto p-6">
          <button onClick={goBack} className="mb-4 px-4 py-2 bg-gray-700 text-white rounded">Back</button>
          <div className="text-red-700 font-semibold">{errorMsg}</div>
        </div>
      );
    }
    if (CharacterCreatorComponent) {
      return <CharacterCreatorComponent />;
    }
    return <div>Loading character creator...</div>;
  }

  if (errorMsg) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <button onClick={goBack} className="mb-4 px-4 py-2 bg-gray-700 text-white rounded">Back</button>
        <div className="text-red-700 font-semibold">{errorMsg}</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <button onClick={goBack} className="mb-4 px-4 py-2 bg-gray-700 text-white rounded">Back</button>
      <h1 className="text-2xl font-bold mb-4">{upperInitials} Player Characters</h1>
      {rows.length === 0 ? (
        <div>No characters found.</div>
      ) : (
        <table className="w-full border border-black text-left">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black py-1 px-2">ID</th>
              <th className="border border-black py-1 px-2">Name</th>
              {isFallout && <th className="border border-black py-1 px-2">Race</th>}
              {isFallout && <th className="border border-black py-1 px-2">Level</th>}
              {isFallout && <th className="border border-black py-1 px-2">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="bg-gray-50">
                <td className="border border-black py-1 px-2">{r.id}</td>
                <td className="border border-black py-1 px-2">{r.name || r.character_name || JSON.stringify(r)}</td>
                {isFallout && <td className="border border-black py-1 px-2">{r.race || r.species || '—'}</td>}
                {isFallout && <td className="border border-black py-1 px-2">{r.level ?? '—'}</td>}
                {isFallout && (
                  <td className="border border-black py-1 px-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleFalloutEdit(r.id)}
                        className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleFalloutOverview(r.id)}
                        className="rounded bg-purple-600 px-3 py-1 text-xs font-semibold text-white hover:bg-purple-700"
                      >
                        Overview
                      </button>
                      <button
                        onClick={() => handleFalloutDelete(r.id, r.name || r.character_name)}
                        className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
