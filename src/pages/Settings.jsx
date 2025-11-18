import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Settings() {
  const location = useLocation();
  const navigate = useNavigate();

  const playerId = location.state?.playerId;

  // -----------------------------------------------------------------
  // 1. General State
  // -----------------------------------------------------------------
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // -----------------------------------------------------------------
  // 2. Star Wars Section State
  // -----------------------------------------------------------------
  const [showStarWarsSection, setShowStarWarsSection] = useState(false);
  const [showRacePictures, setShowRacePictures] = useState(false);
  const [showCareerPictures, setShowCareerPictures] = useState(false);

  // -----------------------------------------------------------------
  // 3. Data
  // -----------------------------------------------------------------
  const [raceData, setRaceData] = useState([]); // { id, name, pictures: [{ id, careerSpec }] }
  const [careerData, setCareerData] = useState([]); // { specId, fullName, pictures: [{ id, raceName }] }
  const [racesLoading, setRacesLoading] = useState(false);
  const [careersLoading, setCareersLoading] = useState(false);
  const [racesError, setRacesError] = useState('');
  const [careersError, setCareersError] = useState('');

  // -----------------------------------------------------------------
  // 4. Fetch Admin Status
  // -----------------------------------------------------------------
  useEffect(() => {
    console.log('Player ID:', playerId ?? '—');

    const fetchAdminStatus = async () => {
      if (!playerId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user')
          .select('admin')
          .eq('id', playerId)
          .single();

        if (error) throw error;

        setIsAdmin(data?.admin === true);
      } catch (err) {
        console.error('Failed to fetch admin status:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStatus();
  }, [playerId]);

  // -----------------------------------------------------------------
  // 5. Fetch Races + Pictures + Career/Spec
  // -----------------------------------------------------------------
  const loadRacesWithPicturesAndSpecs = async () => {
    setRacesLoading(true);
    setRacesError('');
    setRaceData([]);

    try {
      const { data: races, error: racesError } = await supabase
        .from('races')
        .select('id, name')
        .order('name', { ascending: true });

      if (racesError) throw racesError;

      const { data: specs, error: specsError } = await supabase
        .from('SW_spec')
        .select('id, Career, spec_name');

      if (specsError) throw specsError;

      const { data: careers, error: careersError } = await supabase
        .from('SW_career')
        .select('id, name');

      if (careersError) throw careersError;

      const careerMap = {};
      careers.forEach((c) => {
        careerMap[c.id] = c.name;
      });

      const specMap = {};
      specs.forEach((s) => {
        const careerName = careerMap[s.Career] || 'Unknown';
        specMap[s.id] = `${careerName} - ${s.spec_name}`;
      });

      const { data: pictures, error: picsError } = await supabase
        .from('SW_pictures')
        .select('id, race_ID, spec_ID');

      if (picsError) throw picsError;

      const pictureMap = {};
      pictures.forEach((pic) => {
        const raceId = pic.race_ID;
        const careerSpec = specMap[pic.spec_ID] || 'Unknown';
        if (!pictureMap[raceId]) pictureMap[raceId] = [];
        pictureMap[raceId].push({ id: pic.id, careerSpec });
      });

      const enriched = races.map((race) => ({
        id: race.id,
        name: race.name,
        pictures: pictureMap[race.id] || [],
      }));

      setRaceData(enriched);
    } catch (err) {
      console.error('Failed to load race pictures:', err);
      setRacesError('Failed to load races and pictures.');
    } finally {
      setRacesLoading(false);
    }
  };

  useEffect(() => {
    if (showRacePictures && isAdmin) {
      loadRacesWithPicturesAndSpecs();
    }
  }, [showRacePictures, isAdmin]);

  // -----------------------------------------------------------------
  // 6. Fetch Careers + Specs + Pictures + Race Names
  // -----------------------------------------------------------------
  const loadCareersWithSpecsAndPictures = async () => {
    setCareersLoading(true);
    setCareersError('');
    setCareerData([]);

    try {
      const { data: specs, error: specsError } = await supabase
        .from('SW_spec')
        .select('id, Career, spec_name');

      if (specsError) throw specsError;

      const { data: careers, error: careersError } = await supabase
        .from('SW_career')
        .select('id, name');

      if (careersError) throw careersError;

      const careerMap = {};
      careers.forEach((c) => {
        careerMap[c.id] = c.name;
      });

      const { data: races, error: racesError } = await supabase
        .from('races')
        .select('id, name');

      if (racesError) throw racesError;

      const raceMap = {};
      races.forEach((r) => {
        raceMap[r.id] = r.name;
      });

      const { data: pictures, error: picsError } = await supabase
        .from('SW_pictures')
        .select('id, spec_ID, race_ID');

      if (picsError) throw picsError;

      const pictureMap = {};
      pictures.forEach((pic) => {
        const specId = pic.spec_ID;
        const raceName = raceMap[pic.race_ID] || 'Unknown';
        if (!pictureMap[specId]) pictureMap[specId] = [];
        pictureMap[specId].push({ id: pic.id, raceName });
      });

      const enriched = specs
        .map((spec) => {
          const careerName = careerMap[spec.Career];
          if (!careerName) return null;

          return {
            specId: spec.id,
            fullName: `${careerName} - ${spec.spec_name}`,
            pictures: pictureMap[spec.id] || [],
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.fullName.localeCompare(b.fullName));

      setCareerData(enriched);
    } catch (err) {
      console.error('Failed to load careers and pictures:', err);
      setCareersError('Failed to load careers and specializations.');
    } finally {
      setCareersLoading(false);
    }
  };

  useEffect(() => {
    if (showCareerPictures && isAdmin) {
      loadCareersWithSpecsAndPictures();
    }
  }, [showCareerPictures, isAdmin]);

  // -----------------------------------------------------------------
  // 7. Handlers
  // -----------------------------------------------------------------
  const handleChangePasswordClick = () => {
    setShowPasswordForm(true);
    setError('');
    setSuccess('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleApplyPassword = async () => {
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!playerId) {
      setError('Player ID is missing. Cannot update password.');
      return;
    }

    try {
      const { error } = await supabase
        .from('user')
        .update({ password: newPassword })
        .eq('id', playerId);

      if (error) throw error;

      setSuccess('Password changed');
      setShowPasswordForm(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Password update failed:', err);
      setError('Failed to update password. Please try again.');
    }
  };

  const handleBack = () => {
    navigate('/select-ttrpg');
  };

  const handleStarWarsStats = () => {
    setShowStarWarsSection(!showStarWarsSection);
    setShowRacePictures(false);
    setShowCareerPictures(false);
  };

  const handleRacePictures = () => {
    setShowRacePictures(true);
    setShowCareerPictures(false);
  };

  const handleCareerPictures = () => {
    setShowCareerPictures(true);
    setShowRacePictures(false);
  };

  const handleBackFromPictures = () => {
    setShowRacePictures(false);
    setShowCareerPictures(false);
  };

  // -----------------------------------------------------------------
  // 8. Render: Race Pictures View (Fixed 100px cells)
  // -----------------------------------------------------------------
  if (showRacePictures && isAdmin) {
    return (
      <div className="flex flex-col items-center min-h-screen bg-white py-10 px-4">
        <h1 className="text-3xl font-bold mb-6">Race Pictures</h1>

        <button
          onClick={handleBackFromPictures}
          className="mb-6 px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
        >
          Back to Settings
        </button>

        {racesLoading && <p className="text-gray-600">Loading races and pictures...</p>}
        {racesError && <p className="text-red-600">{racesError}</p>}

        {!racesLoading && !racesError && raceData.length > 0 && (
          <div className="w-full max-w-5xl overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-gray-400 px-6 py-3 bg-gray-100 text-left font-semibold text-lg">
                    Race Name
                  </th>
                  <th className="border border-gray-400 px-6 py-3 bg-gray-100 text-center font-semibold text-lg">
                    Pictures
                  </th>
                </tr>
              </thead>
              <tbody>
                {raceData.map((race) => (
                  <tr key={race.id} className="hover:bg-gray-50">
                    <td
                      className="
                        border border-gray-400 px-6 py-4 
                        text-left align-middle 
                        text-2xl font-bold text-gray-800
                      "
                    >
                      {race.name}
                    </td>
                    <td className="border border-gray-400 px-6 py-4">
                      <div className="flex flex-wrap gap-4 justify-start">
                        {race.pictures.length > 0 ? (
                          race.pictures.map((pic) => {
                            const imagePath = `/SW_Pictures/Picture ${pic.id} Face.png`;
                            return (
                              <div
                                key={pic.id}
                                className="flex flex-col items-center border border-gray-300 rounded p-2 bg-white shadow-sm min-w-[100px] w-[100px]"
                              >
                                <img
                                  src={imagePath}
                                  alt={`Picture ${pic.id}`}
                                  className="w-[100px] h-[100px] object-cover rounded"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                                <p className="mt-1 text-xs font-medium text-gray-700 text-center break-words max-w-full">
                                  {pic.careerSpec}
                                </p>
                              </div>
                            );
                          })
                        ) : (
                          <span className="text-gray-400 text-sm self-center">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!racesLoading && !racesError && raceData.length === 0 && (
          <p className="text-gray-500">No races found.</p>
        )}
      </div>
    );
  }

  // -----------------------------------------------------------------
  // 9. Render: Career Pictures View (Fixed 100px cells)
  // -----------------------------------------------------------------
  if (showCareerPictures && isAdmin) {
    return (
      <div className="flex flex-col items-center min-h-screen bg-white py-10 px-4">
        <h1 className="text-3xl font-bold mb-6">Career Pictures</h1>

        <button
          onClick={handleBackFromPictures}
          className="mb-6 px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
        >
          Back to Settings
        </button>

        {careersLoading && <p className="text-gray-600">Loading careers and pictures...</p>}
        {careersError && <p className="text-red-600">{careersError}</p>}

        {!careersLoading && !careersError && careerData.length > 0 && (
          <div className="w-full max-w-5xl overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-gray-400 px-6 py-3 bg-gray-100 text-left font-semibold text-lg">
                    Career - Specialization
                  </th>
                  <th className="border border-gray-400 px-6 py-3 bg-gray-100 text-center font-semibold text-lg">
                    Pictures
                  </th>
                </tr>
              </thead>
              <tbody>
                {careerData.map((item) => (
                  <tr key={item.specId} className="hover:bg-gray-50">
                    <td
                      className="
                        border border-gray-400 px-6 py-4 
                        text-left align-middle 
                        text-2xl font-bold text-gray-800
                      "
                    >
                      {item.fullName}
                    </td>
                    <td className="border border-gray-400 px-6 py-4">
                      <div className="flex flex-wrap gap-4 justify-start">
                        {item.pictures.length > 0 ? (
                          item.pictures.map((pic) => {
                            const imagePath = `/SW_Pictures/Picture ${pic.id} Face.png`;
                            return (
                              <div
                                key={pic.id}
                                className="flex flex-col items-center border border-gray-300 rounded p-2 bg-white shadow-sm min-w-[100px] w-[100px]"
                              >
                                <img
                                  src={imagePath}
                                  alt={`Picture ${pic.id}`}
                                  className="w-[100px] h-[100px] object-cover rounded"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                                <p className="mt-1 text-xs font-medium text-gray-700 text-center break-words max-w-full">
                                  {pic.raceName}
                                </p>
                              </div>
                            );
                          })
                        ) : (
                          <span className="text-gray-400 text-sm self-center">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!careersLoading && !careersError && careerData.length === 0 && (
          <p className="text-gray-500">No careers or specializations found.</p>
        )}
      </div>
    );
  }

  // -----------------------------------------------------------------
  // 10. Render: Main Settings View
  // -----------------------------------------------------------------
  return (
    <div className="flex flex-col items-center min-h-screen bg-white py-10">
      <h1 className="text-3xl font-bold mb-2">Settings</h1>

      {isAdmin && (
        <p className="text-lg font-semibold text-purple-700 mb-8">Admin</p>
      )}

      {!showPasswordForm && (
        <button
          onClick={handleChangePasswordClick}
          className="mb-8 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Change Password
        </button>
      )}

      {showPasswordForm && (
        <div className="w-3/4 max-w-md mb-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter new password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Confirm new password"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm font-medium">{success}</p>}

          <button
            onClick={handleApplyPassword}
            className="w-full px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Apply Password
          </button>
        </div>
      )}

      <div className="w-3/4 max-w-md text-center mb-8">
        <p className="text-gray-600">No other settings available yet.</p>
      </div>

      {isAdmin && (
        <div className="w-3/4 max-w-md space-y-4">
          <button
            onClick={handleStarWarsStats}
            className="w-full px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition font-medium"
          >
            Star Wars Stats
          </button>

          <hr className="border-gray-300" />

          {showStarWarsSection && (
            <div className="flex space-x-3">
              <button
                onClick={handleRacePictures}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition text-sm font-medium"
              >
                Race Pictures
              </button>

              <button
                onClick={handleCareerPictures}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition text-sm font-medium"
              >
                Career Pictures
              </button>
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleBack}
        className="mt-8 px-6 py-3 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
      >
        Back
      </button>
    </div>
  );
}