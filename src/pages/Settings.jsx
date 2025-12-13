import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
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
  const [selectedSpecPerRace, setSelectedSpecPerRace] = useState({}); // { raceId: specId }
  const [availableSpecsPerRace, setAvailableSpecsPerRace] = useState({}); // { raceId: [specs] }
  const [availableRacesPerSpec, setAvailableRacesPerSpec] = useState({}); // { specId: [race objects] }
  const [selectedRacePerSpec, setSelectedRacePerSpec] = useState({}); // { specId: raceId }
  const raceRefs = useRef({});
  const careerRefs = useRef({});

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

  // Handle scrolling to race or career when URL params change
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const scrollToRaceId = searchParams.get('scrollToRace');
    const scrollToCareer = searchParams.get('scrollToCareer');

    if (scrollToRaceId && raceRefs.current[scrollToRaceId]) {
      setTimeout(() => {
        raceRefs.current[scrollToRaceId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Clear the param after scrolling
        searchParams.delete('scrollToRace');
        navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
      }, 300);
    }

    if (scrollToCareer && careerRefs.current[scrollToCareer]) {
      setTimeout(() => {
        careerRefs.current[scrollToCareer]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Clear the param after scrolling
        searchParams.delete('scrollToCareer');
        navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
      }, 300);
    }
  }, [location.search, raceData, careerData, navigate]);

  // -----------------------------------------------------------------
  // 5. Fetch Races + Pictures + Career/Spec
  // -----------------------------------------------------------------
  const loadRacesWithPicturesAndSpecs = async () => {
    setRacesLoading(true);
    setRacesError('');
    setRaceData([]);
    setSelectedSpecPerRace({});
    setAvailableSpecsPerRace({});

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
        .select('id, name, Force_Sensitive');

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

      // Build map of race -> specializations that have pictures
      const raceSpecsWithPics = {};
      pictures.forEach((pic) => {
        const raceId = pic.race_ID;
        const specId = pic.spec_ID;
        if (!raceSpecsWithPics[raceId]) raceSpecsWithPics[raceId] = new Set();
        raceSpecsWithPics[raceId].add(specId);
      });

      // Build available specs for each race (specs NOT in raceSpecsWithPics)
      const availablePerRace = {};
      races.forEach((race) => {
        const specsWithPics = raceSpecsWithPics[race.id] || new Set();
        let availableSpecs = specs.filter(
          (s) => !specsWithPics.has(s.id)
        );

        // For Droid race, filter out force-sensitive careers
        if (race.name === 'Droid') {
          availableSpecs = availableSpecs.filter((s) => {
            const career = careers.find(c => c.id === s.Career);
            return !career || !career.Force_Sensitive;
          });
        }

        // Enrich specs with career name for display
        availableSpecs = availableSpecs.map((s) => ({
          ...s,
          careerName: careerMap[s.Career] || 'Unknown'
        }));

        availablePerRace[race.id] = availableSpecs;
      });

      setAvailableSpecsPerRace(availablePerRace);

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
    setAvailableRacesPerSpec({});
    setSelectedRacePerSpec({});

    try {
      const { data: specs, error: specsError } = await supabase
        .from('SW_spec')
        .select('id, Career, spec_name');
      if (specsError) throw specsError;

      const { data: careers, error: careersError } = await supabase
        .from('SW_career')
        .select('id, name, Force_Sensitive');
      if (careersError) throw careersError;

      const careerMap = {};
      const forceSensitiveMap = {};
      careers.forEach((c) => {
        careerMap[c.id] = c.name;
        forceSensitiveMap[c.id] = c.Force_Sensitive;
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

      // For each spec, find races that do NOT have a face for that spec
      const availableRaces = {};
      specs.forEach((spec) => {
        const takenRaceIds = new Set(pictures.filter(p => p.spec_ID === spec.id).map(p => p.race_ID));
        let possibleRaces = races.filter(r => !takenRaceIds.has(r.id));
        // If force sensitive, remove Droid
        if (forceSensitiveMap[spec.Career]) {
          possibleRaces = possibleRaces.filter(r => r.name !== 'Droid');
        }
        availableRaces[spec.id] = possibleRaces;
      });
      setAvailableRacesPerSpec(availableRaces);

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
            careerName,
            forceSensitive: !!forceSensitiveMap[spec.Career],
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

  const handleCreatePrompt = async () => {
    try {
      // Fetch all races, careers, specializations, and pictures
      const [racesRes, careersRes, specsRes, picturesRes] = await Promise.all([
        supabase.from('races').select('id, name'),
        supabase.from('SW_career').select('id, name, description, Force_Sensitive'),
        supabase.from('SW_spec').select('id, Career, spec_name, description'),
        supabase.from('SW_pictures').select('id, race_ID, career_ID, spec_ID')
      ]);

      if (racesRes.error) throw racesRes.error;
      if (careersRes.error) throw careersRes.error;
      if (specsRes.error) throw specsRes.error;
      if (picturesRes.error) throw picturesRes.error;

      const races = racesRes.data || [];
      let careers = careersRes.data || [];
      const specs = specsRes.data || [];
      const pictures = picturesRes.data || [];

      // Count faces per race
      const raceFaceCounts = {};
      races.forEach(race => {
        const faceCount = pictures.filter(p => p.race_ID === race.id).length;
        raceFaceCounts[race.id] = { ...race, faceCount };
      });

      // Find minimum face count for races
      const minRaceFaceCount = Math.min(...Object.values(raceFaceCounts).map(r => r.faceCount));
      const racesWithMinFaces = Object.values(raceFaceCounts).filter(r => r.faceCount === minRaceFaceCount);
      
      // Randomly pick one race with minimum faces
      let selectedRace = racesWithMinFaces[Math.floor(Math.random() * racesWithMinFaces.length)];

      // Filter out force-sensitive careers if race is Droid
      if (selectedRace.name === 'Droid') {
        careers = careers.filter(c => !c.Force_Sensitive);
      }

      // Filter specializations to only those with careers available
      let availableCareerIds = new Set(careers.map(c => c.id));
      let availableSpecs = specs.filter(s => availableCareerIds.has(s.Career));

      // Count faces per specialization (using only available specs)
      const specFaceCounts = {};
      availableSpecs.forEach(spec => {
        const faceCount = pictures.filter(p => p.spec_ID === spec.id).length;
        specFaceCounts[spec.id] = { ...spec, faceCount };
      });

      // Find minimum face count for specializations
      const minSpecFaceCount = Math.min(...Object.values(specFaceCounts).map(s => s.faceCount));
      let specsWithMinFaces = Object.values(specFaceCounts).filter(s => s.faceCount === minSpecFaceCount);
      
      // Randomly pick one specialization with minimum faces
      let selectedSpec = specsWithMinFaces[Math.floor(Math.random() * specsWithMinFaces.length)];

      // Find the career for the selected specialization (Career field is the career ID)
      let selectedCareer = careers.find(c => c.id === selectedSpec.Career);

      if (!selectedCareer) {
        throw new Error(`Career not found for specialization ${selectedSpec.spec_name}`);
      }

      // Check if this combination (race + career + spec) exists in pictures
      let combinationExists = pictures.some(p => 
        p.race_ID === selectedRace.id && 
        p.career_ID === selectedCareer.id && 
        p.spec_ID === selectedSpec.id
      );

      // If combination exists, find alternatives
      if (combinationExists) {
        // Try to find a race that doesn't have this career/spec combination
        const alternativeRaces = racesWithMinFaces.filter(race => 
          !pictures.some(p => 
            p.race_ID === race.id && 
            p.career_ID === selectedCareer.id && 
            p.spec_ID === selectedSpec.id
          )
        );

        if (alternativeRaces.length > 0) {
          selectedRace = alternativeRaces[Math.floor(Math.random() * alternativeRaces.length)];
          combinationExists = false;
        }
      }

      // If still exists, try to find a different specialization
      if (combinationExists) {
        const alternativeSpecs = specsWithMinFaces.filter(spec => {
          const career = careers.find(c => c.id === spec.Career);
          return !pictures.some(p => 
            p.race_ID === selectedRace.id && 
            p.career_ID === career.id && 
            p.spec_ID === spec.id
          );
        });

        if (alternativeSpecs.length > 0) {
          selectedSpec = alternativeSpecs[Math.floor(Math.random() * alternativeSpecs.length)];
          selectedCareer = careers.find(c => c.id === selectedSpec.Career);
          combinationExists = false;
        }
      }

      // If still exists, try to find a different career
      if (combinationExists) {
        const alternativeCareers = careers.filter(career => {
          const careerSpecs = specs.filter(s => s.Career === career.id);
          return careerSpecs.some(spec => 
            !pictures.some(p => 
              p.race_ID === selectedRace.id && 
              p.career_ID === career.id && 
              p.spec_ID === spec.id
            )
          );
        });

        if (alternativeCareers.length > 0) {
          selectedCareer = alternativeCareers[Math.floor(Math.random() * alternativeCareers.length)];
          const careerSpecs = specs.filter(s => s.Career === selectedCareer.id);
          selectedSpec = careerSpecs[Math.floor(Math.random() * careerSpecs.length)];
        }
      }

      // Construct the prompt
      const gender = selectedRace.name === 'Droid' ? '' : (Math.random() < 0.5 ? 'male ' : 'female ');
      const helmetNote = selectedRace.name === 'Human (Mandolorian)' ? '. the helmet is on their head' : '';
      const prompt = `write a prompt for ${selectedCareer.description} then ${selectedSpec.description} the race is ${gender}${selectedRace.name}${helmetNote}. do not generate a picture`;

      // Copy to clipboard
      await navigator.clipboard.writeText(prompt);
      
      alert(`Prompt copied to clipboard!\n\nRace: ${selectedRace.name} (${selectedRace.faceCount} faces)\nSpecialization: ${selectedSpec.spec_name} (${selectedSpec.faceCount} faces)`);
    } catch (err) {
      console.error('Error creating prompt:', err);
      alert(`Failed to create prompt: ${err.message}`);
    }
  };

  const handleGeneratePromptForRace = async (raceId, raceName, specId) => {
    try {
      // Fetch careers, specs, and pictures
      const [careersRes, specsRes, picturesRes] = await Promise.all([
        supabase.from('SW_career').select('id, name, description'),
        supabase.from('SW_spec').select('id, Career, spec_name, description'),
        supabase.from('SW_pictures').select('id, race_ID, career_ID, spec_ID')
      ]);

      if (careersRes.error) throw careersRes.error;
      if (specsRes.error) throw specsRes.error;
      if (picturesRes.error) throw picturesRes.error;

      const careers = careersRes.data || [];
      const specs = specsRes.data || [];
      const pictures = picturesRes.data || [];

      // Find the selected specialization
      const selectedSpec = specs.find(s => s.id === specId);
      if (!selectedSpec) {
        throw new Error('Specialization not found');
      }

      // Find the career for this specialization
      const selectedCareer = careers.find(c => c.id === selectedSpec.Career);
      if (!selectedCareer) {
        throw new Error('Career not found for specialization');
      }

      // Check if this combination already exists in pictures
      const combinationExists = pictures.some(p => 
        p.race_ID === raceId && 
        p.career_ID === selectedCareer.id && 
        p.spec_ID === specId
      );

      if (combinationExists) {
        alert(`This race-career-specialization combination already exists in the pictures!`);
        return;
      }

      // Construct the prompt
      const gender = raceName === 'Droid' ? '' : (Math.random() < 0.5 ? 'male ' : 'female ');
      const helmetNote = raceName === 'Human (Mandolorian)' ? '. the helmet is on their head' : '';
      const prompt = `write a prompt for ${selectedCareer.description} then ${selectedSpec.description} the race is ${gender}${raceName}${helmetNote}. do not generate a picture`;

      // Copy to clipboard
      await navigator.clipboard.writeText(prompt);
      
      alert(`Prompt copied to clipboard!\\n\\nRace: ${raceName}\\nCareer: ${selectedCareer.name}\\nSpecialization: ${selectedSpec.spec_name}`);
    } catch (err) {
      console.error('Error generating prompt for race:', err);
      alert(`Failed to generate prompt: ${err.message}`);
    }
  };

  const handleAddToDatabaseForRace = async (raceId, raceName, specId) => {
    try {
      // Fetch careers, specs, and pictures
      const [careersRes, specsRes, picturesRes] = await Promise.all([
        supabase.from('SW_career').select('id, name, description'),
        supabase.from('SW_spec').select('id, Career, spec_name, description'),
        supabase.from('SW_pictures').select('id, race_ID, career_ID, spec_ID')
      ]);

      if (careersRes.error) throw careersRes.error;
      if (specsRes.error) throw specsRes.error;
      if (picturesRes.error) throw picturesRes.error;

      const careers = careersRes.data || [];
      const specs = specsRes.data || [];
      const pictures = picturesRes.data || [];

      // Find the selected specialization
      const selectedSpec = specs.find(s => s.id === specId);
      if (!selectedSpec) {
        throw new Error('Specialization not found');
      }

      // Find the career for this specialization
      const selectedCareer = careers.find(c => c.id === selectedSpec.Career);
      if (!selectedCareer) {
        throw new Error('Career not found for specialization');
      }

      // Check if this combination already exists in pictures
      const combinationExists = pictures.some(p => 
        p.race_ID === raceId && 
        p.career_ID === selectedCareer.id && 
        p.spec_ID === specId
      );

      if (combinationExists) {
        alert(`This race-career-specialization combination already exists in the database!`);
        return;
      }

      // Insert into SW_pictures
      const { data, error } = await supabase
        .from('SW_pictures')
        .insert([
          {
            race_ID: raceId,
            career_ID: selectedCareer.id,
            spec_ID: specId
          }
        ]);

      if (error) throw error;

      alert(`Successfully added to database!\\n\\nRace: ${raceName}\\nCareer: ${selectedCareer.name}\\nSpecialization: ${selectedSpec.spec_name}`);
      
      // Reload the race pictures data and scroll to the race
      await loadRacesWithPicturesAndSpecs();
      // Use navigate to add scroll param to URL
      const searchParams = new URLSearchParams(location.search);
      searchParams.set('scrollToRace', raceId);
      navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
    } catch (err) {
      console.error('Error adding to database:', err);
      alert(`Failed to add to database: ${err.message}`);
    }
  };

  // Generate prompt for career/spec + race
  const handleGeneratePromptForCareer = async (item, raceId) => {
    try {
      // Fetch the race
      const { data: race, error: raceError } = await supabase
        .from('races')
        .select('id, name')
        .eq('id', raceId)
        .single();
      if (raceError) throw raceError;
      const raceName = race.name;

      // Fetch the specialization (with description and Career)
      const { data: spec, error: specError } = await supabase
        .from('SW_spec')
        .select('id, Career, spec_name, description')
        .eq('id', item.specId)
        .single();
      if (specError) throw specError;

      // Fetch the career (with description)
      const { data: career, error: careerError } = await supabase
        .from('SW_career')
        .select('id, name, description')
        .eq('id', spec.Career)
        .single();
      if (careerError) throw careerError;

      const gender = raceName === 'Droid' ? '' : (Math.random() < 0.5 ? 'male ' : 'female ');
      const helmetNote = raceName === 'Human (Mandolorian)' ? '. the helmet is on their head' : '';
      const prompt = `write a prompt for ${career.description} then ${spec.description} the race is ${gender}${raceName}${helmetNote}. do not generate a picture`;
      await navigator.clipboard.writeText(prompt);
      alert(`Prompt copied to clipboard!\n\nRace: ${raceName}\nSpecialization: ${item.fullName}`);
    } catch (err) {
      console.error('Error generating prompt for career:', err);
      alert(`Failed to generate prompt: ${err.message}`);
    }
  };

  // Add to database for career/spec + race
  const handleAddToDatabaseForCareer = async (item, raceId) => {
    try {
      const { data: race, error: raceError } = await supabase
        .from('races')
        .select('id, name')
        .eq('id', raceId)
        .single();
      if (raceError) throw raceError;
      // Insert into SW_pictures
      const { error } = await supabase
        .from('SW_pictures')
        .insert([
          {
            race_ID: raceId,
            career_ID: null, // not used, but for completeness
            spec_ID: item.specId
          }
        ]);
      if (error) throw error;
      alert(`Successfully added to database!\n\nRace: ${race.name}\nSpecialization: ${item.fullName}`);
      await loadCareersWithSpecsAndPictures();
      // Use navigate to add scroll param to URL
      const searchParams = new URLSearchParams(location.search);
      searchParams.set('scrollToCareer', item.specId);
      navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
    } catch (err) {
      console.error('Error adding to database for career:', err);
      alert(`Failed to add to database: ${err.message}`);
    }
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
                  <tr 
                    key={race.id} 
                    ref={(el) => (raceRefs.current[race.id] = el)}
                    className="hover:bg-gray-50"
                  >
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
                      <div className="flex flex-col gap-6">
                        {/* Pictures Section */}
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

                        {/* Generate Prompt Box */}
                        {availableSpecsPerRace[race.id] && availableSpecsPerRace[race.id].length > 0 && (
                          <div className="border border-blue-400 rounded p-4 bg-blue-50">
                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                              Generate Prompt for Missing Specialization:
                            </label>
                            <select
                              value={selectedSpecPerRace[race.id] || ''}
                              onChange={(e) =>
                                setSelectedSpecPerRace({
                                  ...selectedSpecPerRace,
                                  [race.id]: parseInt(e.target.value),
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded mb-3 text-sm"
                            >
                              <option value="">-- Select Specialization --</option>
                              {[...availableSpecsPerRace[race.id]].sort((a, b) => a.spec_name.localeCompare(b.spec_name)).map((spec) => (
                                <option key={spec.id} value={spec.id}>
                                  {spec.spec_name} [{spec.careerName}]
                                </option>
                              ))}
                            </select>
                            <div className="flex gap-3">
                              <button
                                onClick={() => {
                                  const specs = availableSpecsPerRace[race.id];
                                  if (specs && specs.length > 0) {
                                    const randomSpec = specs[Math.floor(Math.random() * specs.length)];
                                    setSelectedSpecPerRace({
                                      ...selectedSpecPerRace,
                                      [race.id]: randomSpec.id,
                                    });
                                  }
                                }}
                                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition font-medium"
                              >
                                Random
                              </button>
                              <button
                                onClick={() => {
                                  const specId = selectedSpecPerRace[race.id];
                                  if (specId) {
                                    handleGeneratePromptForRace(race.id, race.name, specId);
                                  } else {
                                    alert('Please select a specialization');
                                  }
                                }}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
                              >
                                Generate Prompt
                              </button>
                              <button
                                onClick={() => {
                                  const specId = selectedSpecPerRace[race.id];
                                  if (specId) {
                                    handleAddToDatabaseForRace(race.id, race.name, specId);
                                  } else {
                                    alert('Please select a specialization');
                                  }
                                }}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-medium"
                              >
                                Add to Database
                              </button>
                            </div>
                          </div>
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
                  <tr 
                    key={item.specId} 
                    ref={(el) => (careerRefs.current[item.specId] = el)}
                    className="hover:bg-gray-50"
                  >
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
                      <div className="flex flex-col gap-6">
                        {/* Pictures Section */}
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
                        {/* Generate Prompt Box for missing races */}
                        {availableRacesPerSpec[item.specId] && availableRacesPerSpec[item.specId].length > 0 && (
                          <div className="border border-blue-400 rounded p-4 bg-blue-50 mt-4">
                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                              Generate Prompt for Missing Species:
                            </label>
                            <select
                              value={selectedRacePerSpec[item.specId] || ''}
                              onChange={(e) =>
                                setSelectedRacePerSpec({
                                  ...selectedRacePerSpec,
                                  [item.specId]: parseInt(e.target.value),
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded mb-3 text-sm"
                            >
                              <option value="">-- Select Species --</option>
                              {[...availableRacesPerSpec[item.specId]].sort((a, b) => a.name.localeCompare(b.name)).map((race) => (
                                <option key={race.id} value={race.id}>
                                  {race.name}
                                </option>
                              ))}
                            </select>
                            <div className="flex gap-3">
                              <button
                                onClick={() => {
                                  const races = availableRacesPerSpec[item.specId];
                                  if (races && races.length > 0) {
                                    const randomRace = races[Math.floor(Math.random() * races.length)];
                                    setSelectedRacePerSpec({
                                      ...selectedRacePerSpec,
                                      [item.specId]: randomRace.id,
                                    });
                                  }
                                }}
                                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition font-medium"
                              >
                                Random
                              </button>
                              <button
                                onClick={() => {
                                  const raceId = selectedRacePerSpec[item.specId];
                                  if (raceId) {
                                    handleGeneratePromptForCareer(item, raceId);
                                  } else {
                                    alert('Please select a species');
                                  }
                                }}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
                              >
                                Generate Prompt
                              </button>
                              <button
                                onClick={() => {
                                  const raceId = selectedRacePerSpec[item.specId];
                                  if (raceId) {
                                    handleAddToDatabaseForCareer(item, raceId);
                                  } else {
                                    alert('Please select a species');
                                  }
                                }}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-medium"
                              >
                                Add to Database
                              </button>
                            </div>
                          </div>
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
            <>
              <button
                onClick={handleCreatePrompt}
                className="w-full px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition font-medium mb-4"
              >
                Create Prompt
              </button>
              
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
            </>
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