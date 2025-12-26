import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// Dynamically import character creator components
const characterCreators = {
  'F': () => import('./F_character_creator').then(m => m.default),
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
          if (characterCreators[initials]) {
            const component = await characterCreators[initials]();
            setCharacterCreatorComponent(() => component);
          } else {
            setErrorMsg(`Character creator not found for ${initials}`);
          }
        } else if (page === 'player_characters') {
          const table = `${upperInitials}_player_characters`;
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
  }, [initials, page, userId]);

  const goBack = () => navigate('/select-ttrpg');

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
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="bg-gray-50">
                <td className="border border-black py-1 px-2">{r.id}</td>
                <td className="border border-black py-1 px-2">{r.name || r.character_name || JSON.stringify(r)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
