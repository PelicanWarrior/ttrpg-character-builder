import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

export default function Settings() {
  const location = useLocation();
  const navigate = useNavigate();

  // Get playerId from location state
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
  const [uploadPicturesEnabled, setUploadPicturesEnabled] = useState(false);
  const [savingUploadPictures, setSavingUploadPictures] = useState(false);

  // -----------------------------------------------------------------
  // 2. Star Wars Section State
  // -----------------------------------------------------------------
  const [showStarWarsSection, setShowStarWarsSection] = useState(false);
  const [showRacePictures, setShowRacePictures] = useState(false);
  const [showCareerPictures, setShowCareerPictures] = useState(false);
  const [showAddSpeciesForm, setShowAddSpeciesForm] = useState(false);
  const [showAddSpecializationForm, setShowAddSpecializationForm] = useState(false);
  const [showAddEquipmentForm, setShowAddEquipmentForm] = useState(false);
  const [showAddCareerForm, setShowAddCareerForm] = useState(false);
  const [showAddForceTreeForm, setShowAddForceTreeForm] = useState(false);

  // -----------------------------------------------------------------
  // 2a. Pathfinder Section State
  // -----------------------------------------------------------------
  const [showPathfinderSection, setShowPathfinderSection] = useState(false);
  const [showAddPathfinderRaceForm, setShowAddPathfinderRaceForm] = useState(false);
  const [pathfinderRaces, setPathfinderRaces] = useState([]); // [{ id, Name, ... }]
  const [selectedPRaceId, setSelectedPRaceId] = useState('__new__');
  const [pRaceName, setPRaceName] = useState('');
  const [pRaceDescription, setPRaceDescription] = useState('');
  const [pRaceStats, setPRaceStats] = useState('');
  const [pRaceSize, setPRaceSize] = useState('');
  const [pRaceSpeed, setPRaceSpeed] = useState('');
  const [pRaceModifySpeed, setPRaceModifySpeed] = useState(false);
  const [pRaceAbilities, setPRaceAbilities] = useState('');
  const [pRaceLanguages, setPRaceLanguages] = useState('');
  const [pRaceHighIntLanguages, setPRaceHighIntLanguages] = useState('');

  // -----------------------------------------------------------------
  // 2b. Specialization Form State
  // -----------------------------------------------------------------
  const [specName, setSpecName] = useState('');
  const [specCareer, setSpecCareer] = useState('');
  const [specDescription, setSpecDescription] = useState('');
  const [specSkills, setSpecSkills] = useState([]);
  const [specTalentTree, setSpecTalentTree] = useState({});
  const [specTalentDescriptions, setSpecTalentDescriptions] = useState({});
  const [specTalentActivations, setSpecTalentActivations] = useState({});
  const [specTalentLinks, setSpecTalentLinks] = useState({});
  const [customTalentInputMode, setCustomTalentInputMode] = useState({});
  const [isCustomTalent, setIsCustomTalent] = useState({});
  const [availableCareers, setAvailableCareers] = useState([]);
  const [careersWithIds, setCareersWithIds] = useState([]);
  const [availableTalentsForTree, setAvailableTalentsForTree] = useState([]);
  const [existingSpecs, setExistingSpecs] = useState([]);
  const [editingSpecId, setEditingSpecId] = useState(null);
  const [savingSpec, setSavingSpec] = useState(false);
  const [specConflict, setSpecConflict] = useState(null);
  const [abilityConflicts, setAbilityConflicts] = useState([]);
  const [abilityConflictAction, setAbilityConflictAction] = useState(null);
  const [abilityMapById, setAbilityMapById] = useState({});
  const [forceTreeAbilities, setForceTreeAbilities] = useState({});
  const [forceTreeCustomInputMode, setForceTreeCustomInputMode] = useState({});
  const [forceTreeIsCustom, setForceTreeIsCustom] = useState({});
  const [availableForceAbilities, setAvailableForceAbilities] = useState([]);

  // -----------------------------------------------------------------
  // 2c. Species Form State
  // -----------------------------------------------------------------
  const [speciesName, setSpeciesName] = useState('');
  const [speciesSourceBook, setSpeciesSourceBook] = useState('');
  const [speciesDescription, setSpeciesDescription] = useState('');
  const [speciesBrawn, setSpeciesBrawn] = useState('');
  const [speciesAgility, setSpeciesAgility] = useState('');
  const [speciesIntellect, setSpeciesIntellect] = useState('');
  const [speciesCunning, setSpeciesCunning] = useState('');
  const [speciesWillpower, setSpeciesWillpower] = useState('');
  const [speciesPresence, setSpeciesPresence] = useState('');
  const [speciesWound, setSpeciesWound] = useState('');
  const [speciesStrain, setSpeciesStrain] = useState('');
  const [speciesRaceAttack, setSpeciesRaceAttack] = useState('');
  const [speciesEXP, setSpeciesEXP] = useState('');
  const [speciesTalents, setSpeciesTalents] = useState([]);
  const [speciesSkills, setSpeciesSkills] = useState([]);
  const [speciesAbility, setSpeciesAbility] = useState('');
  const [availableSkills, setAvailableSkills] = useState([]);
  const [availableTalents, setAvailableTalents] = useState([]);
  const [availableBooks, setAvailableBooks] = useState([]); // [{ id, Book_name }]
  const [existingSpecies, setExistingSpecies] = useState([]); // full rows for editing
  const [editingSpeciesId, setEditingSpeciesId] = useState(null);

  // -----------------------------------------------------------------
  // 2d. Career Form State
  // -----------------------------------------------------------------
  const [careerName, setCareerName] = useState('');
  const [careerDescription, setCareerDescription] = useState('');
  const [careerSkills, setCareerSkills] = useState([]);
  const [careerSourceBook, setCareerSourceBook] = useState('');
  const [careerForceSensitive, setCareerForceSensitive] = useState(false);
  const [availableSkillsForCareer, setAvailableSkillsForCareer] = useState([]);
  const [existingCareers, setExistingCareers] = useState([]);
  const [editingCareerId, setEditingCareerId] = useState(null);
  const [savingCareer, setSavingCareer] = useState(false);
  const [careerBooks, setCareerBooks] = useState([]);

  // -----------------------------------------------------------------
  // 2e. Equipment Form State
  // -----------------------------------------------------------------
  const [equipmentName, setEquipmentName] = useState('');
  const [equipmentDescription, setEquipmentDescription] = useState('');
  const [equipmentSkill, setEquipmentSkill] = useState('');
  const [equipmentSkillId, setEquipmentSkillId] = useState('');
  const [equipmentDamage, setEquipmentDamage] = useState('');
  const [equipmentRange, setEquipmentRange] = useState('');
  const [equipmentEncumbrance, setEquipmentEncumbrance] = useState('');
  const [equipmentPrice, setEquipmentPrice] = useState('');
  const [equipmentRarity, setEquipmentRarity] = useState('');
  const [equipmentDamageMelee, setEquipmentDamageMelee] = useState('');
  const [equipmentConsumable, setEquipmentConsumable] = useState(false);
  const [equipmentCritical, setEquipmentCritical] = useState('');
  const [equipmentHP, setEquipmentHP] = useState('');
  const [equipmentSpecial, setEquipmentSpecial] = useState('');
  const [equipmentSoak, setEquipmentSoak] = useState('');
  const [equipmentDamageRange, setEquipmentDamageRange] = useState('');

  // -----------------------------------------------------------------
  // 2f. Pathfinder Race Form State
  // -----------------------------------------------------------------
  const [savingPRace, setSavingPRace] = useState(false);
  const [showAddAbilityTreeForm, setShowAddAbilityTreeForm] = useState(false);

  // -----------------------------------------------------------------
  // 2g. Force Tree Form State
  // -----------------------------------------------------------------
  const [forceTreeName, setForceTreeName] = useState('');
  const [forceTreeDescription, setForceTreeDescription] = useState('');
  const [forceTreeTopAbility, setForceTreeTopAbility] = useState('');
  const [forceTreeTopCost, setForceTreeTopCost] = useState('');
  const [forceTreeTopDescription, setForceTreeTopDescription] = useState('');
  const [forceTreeTopActivation, setForceTreeTopActivation] = useState('Passive');
  const [forceTreeMerged, setForceTreeMerged] = useState({});
  const [forceTreeLinks, setForceTreeLinks] = useState({});

  // -----------------------------------------------------------------
  // 3. Race and Career Display State
  // -----------------------------------------------------------------
  const [raceData, setRaceData] = useState([]);
  const [careerData, setCareerData] = useState([]);
  const [racesLoading, setRacesLoading] = useState(false);
  const [racesError, setRacesError] = useState('');
  const [careersLoading, setCareersLoading] = useState(false);
  const [careersError, setCareersError] = useState('');
  const [selectedSpecPerRace, setSelectedSpecPerRace] = useState({});
  const [availableSpecsPerRace, setAvailableSpecsPerRace] = useState({});
  const [availableRacesPerSpec, setAvailableRacesPerSpec] = useState({});
  const [selectedRacePerSpec, setSelectedRacePerSpec] = useState({});
  const raceRefs = useRef({});
  const careerRefs = useRef({});

  const handleSaveSpecialization = async (options = {}) => {
    const { abilityModeOverride, updateSpec = false, specIdOverride = null } = options;
    try {
      setSpecConflict(null);
      setAbilityConflicts([]);
      if (!specName.trim()) {
        alert('Specialization name is required');
        return;
      }
      if (!specCareer) {
        alert('Please select a career');
        return;
      }
      setSavingSpec(true);
      const abilityConflictsFound = new Set();
      const abilityMode = abilityModeOverride || abilityConflictAction || null;
      const skipSpecConflictCheck = updateSpec || !!specIdOverride;
      const forceCreateSpec = false;
      // 0) Check for existing spec by name
      const { data: existingSpec, error: existingSpecErr } = await supabase
        .from('SW_spec')
        .select('id')
        .eq('spec_name', specName)
        .maybeSingle();
      if (existingSpecErr) {
        console.error('Error checking existing spec:', existingSpecErr);
      }
      if (existingSpec?.id && !forceCreateSpec && !updateSpec && !skipSpecConflictCheck) {
        setSpecConflict({ id: existingSpec.id, name: specName });
        setSavingSpec(false);
        return;
      }
      // 1) Resolve Career ID
      const { data: careerRow, error: careerErr } = await supabase
        .from('SW_career')
        .select('id')
        .eq('name', specCareer)
        .single();
      if (careerErr || !careerRow) {
        console.error('Error resolving career:', careerErr);
        alert('Failed to find career id');
        setSavingSpec(false);
        return;
      }
      const careerId = careerRow.id;
      // 2) Insert or update SW_spec
      let specId = specIdOverride || existingSpec?.id || null;
      if (updateSpec) {
        if (!specId) {
          alert('No specialization selected to update');
          setSavingSpec(false);
          return;
        }
        const { error: updErr } = await supabase
          .from('SW_spec')
          .update({
            spec_name: specName,
            Career: careerId,
            description: specDescription,
            spec_skills: (specSkills || []).join(', ')
          })
          .eq('id', existingSpec.id);
        if (updErr) {
          console.error('Error updating specialization:', updErr);
          alert('Failed to update specialization');
          setSavingSpec(false);
          return;
        }
        specId = specIdOverride || existingSpec?.id;
      } else if (!existingSpec?.id || forceCreateSpec) {
        const { data: specInsert, error: specErr } = await supabase
          .from('SW_spec')
          .insert([{
            spec_name: specName,
            Career: careerId,
            description: specDescription,
            spec_skills: (specSkills || []).join(', ')
          }])
          .select('id')
          .single();
        if (specErr || !specInsert) {
          console.error('Error inserting specialization:', specErr);
          alert('Failed to save specialization');
          setSavingSpec(false);
          return;
        }
        specId = specInsert.id;
      }
      // Helpers to resolve/insert abilities and get IDs
      const getAbilityId = async (abilityName, description, activation, isCustom) => {
        if (!abilityName) return null;
        // Try fetch id from SW_abilities
        let { data: abRow, error: abErr } = await supabase
          .from('SW_abilities')
          .select('id')
          .eq('ability', abilityName)
          .maybeSingle();
        if (abErr) {
          console.warn('Lookup SW_abilities failed:', abErr?.message);
        }
        // If found and custom
        if (abRow?.id && isCustom) {
          if (!abilityMode) {
            abilityConflictsFound.add(abilityName);
            throw new Error('ABILITY_CONFLICT');
          }
          if (abilityMode === 'update') {
            // Update description/activation
            let updRes = await supabase
              .from('SW_abilities')
              .update({ description: description || '', activation: activation || 'Passive' })
              .eq('id', abRow.id);
            return abRow.id;
          }
          // abilityMode === 'addNew' -> fall through to insert
        }
        if (abRow?.id) return abRow.id;
        // If custom, insert into abilities table
        if (isCustom) {
          // Prefer plural table; fallback to singular
          let insertRes = await supabase
            .from('SW_abilities')
            .insert([{ ability: abilityName, description: description || '', activation: activation || 'Passive' }])
            .select('id')
            .single();
          if (insertRes.error) return null;
          return insertRes.data?.id || null;
        }
        return null;
      };
      for (let r = 0; r < 5; r++) {
        for (let c = 1; c <= 4; c++) {
          const boxIndex = r * 4 + (c - 1);
          const abilityName = specTalentTree[boxIndex] || '';
          const isCustom = !!isCustomTalent[boxIndex];
          const desc = specTalentDescriptions[boxIndex] || '';
          const activation = specTalentActivations[boxIndex] || '';
          const abilityId = await getAbilityId(abilityName, desc, activation, isCustom);
          const fieldBase = `ability_${rows[r]}_${c}`;
          treePayload[fieldBase] = abilityId;
          const links = [];
          // Check for links to the left (from the space to the left of this talent)
          if (c > 1 && specTalentLinks[`${r}_${c - 2}_right`]) links.push('Left');
          // Check for links to the right (from the space to the right of this talent)
          if (c < 4 && specTalentLinks[`${r}_${c - 1}_right`]) links.push('Right');
          // Check for links up (from the space above this talent)
          if (r > 0 && specTalentLinks[`${r - 1}_${c - 1}_down`]) links.push('Up');
          // Check for links down (from the space below this talent)
          if (r < 4 && specTalentLinks[`${r}_${c - 1}_down`]) links.push('Down');
          treePayload[`${fieldBase}_links`] = links.join(', ');
        }
      }
      // 4) Insert or replace SW_spec_tree (spec_ID column)
      if (specId && (updateSpec || specIdOverride)) {
        const { error: deleteErr } = await supabase
          .from('SW_spec_tree')
          .delete()
          .eq('spec_ID', specId);
        if (deleteErr) {
          console.error('Error clearing existing spec tree:', deleteErr);
          alert('Failed to replace existing talent tree');
          setSavingSpec(false);
          return;
        }
      }
      const { error: treeErr } = await supabase
        .from('SW_spec_tree')
        .insert([{ ...treePayload, spec_ID: specId }]);
      if (treeErr) {
        console.error('Error saving spec tree:', treeErr);
        alert('Saved specialization, but failed saving talent tree');
        setSavingSpec(false);
        return;
      }
      alert('Specialization and Talent Tree saved!');
      // Reset form
      setSpecName('');
      setSpecCareer('');
      setSpecDescription('');
      setSpecSkills([]);
      setSpecTalentTree({});
      setSpecTalentDescriptions({});
      setSpecTalentActivations({});
      setSpecTalentLinks({});
      setCustomTalentInputMode({});
      setIsCustomTalent({});
      setAbilityConflictAction(null);
      setEditingSpecId(null);
      setShowAddSpecializationForm(false);
    } catch (err) {
      console.error('Save specialization failed:', err);
      if (err.message === 'ABILITY_CONFLICT') {
        setAbilityConflicts(Array.from(new Set(Array.from(abilityConflictsFound))).map(name => ({ name })));
        alert('Custom abilities already exist. Choose Add New or Update Existing.');
      } else {
        alert('Failed to save specialization');
      }
    } finally {
      setSavingSpec(false);
    }
  };

  // Fetch careers when Add Career form is shown
  useEffect(() => {
    const fetchCareers = async () => {
      if (!showAddCareerForm) return;

      try {
        const { data, error } = await supabase
          .from('SW_career')
          .select('id, name, description, skills, source_book, Force_Sensitive')
          .order('name');

        if (error) throw error;

        setExistingCareers(data || []);
      } catch (err) {
        console.error('Failed to fetch careers:', err);
      }
    };

    fetchCareers();
  }, [showAddCareerForm]);

  // Fetch books when Add Career form is shown
  useEffect(() => {
    const fetchBooks = async () => {
      if (!showAddCareerForm) return;

      try {
        const { data, error } = await supabase
          .from('SW_books')
          .select('id, Book_name')
          .order('Book_name');

        if (error) throw error;

        setCareerBooks(data || []);
      } catch (err) {
        console.error('Failed to fetch books:', err);
      }
    };

    fetchBooks();
  }, [showAddCareerForm]);

  // Fetch talents when Add Species form is shown
  useEffect(() => {
    const fetchTalents = async () => {
      if (!showAddSpeciesForm) return;

      try {
        const { data, error } = await supabase
          .from('SW_abilities')
          .select('ability')
          .order('ability');

        if (error) throw error;

        setAvailableTalents(data?.map(t => t.ability) || []);
      } catch (err) {
        console.error('Failed to fetch talents:', err);
      }
    };

    fetchTalents();
  }, [showAddSpeciesForm]);

  // Fetch books when Add Species form is shown
  useEffect(() => {
    const fetchBooks = async () => {
      if (!showAddSpeciesForm) return;

      try {
        const { data, error } = await supabase
          .from('SW_books')
          .select('id, Book_name')
          .order('Book_name');

        if (error) throw error;

        setAvailableBooks(data || []);
      } catch (err) {
        console.error('Failed to fetch books:', err);
      }
    };

    fetchBooks();
  }, [showAddSpeciesForm]);

  // Fetch existing species for editing when form is shown
  useEffect(() => {
    const fetchSpecies = async () => {
      if (!showAddSpeciesForm) return;

      try {
        const { data, error } = await supabase
          .from('races')
          .select('id, name, description, brawn, agility, intellect, cunning, willpower, presence, wound, Strain, Race_Attack, EXP, Starting_Talents, Starting_Skill, ability, source_book');

        if (error) throw error;

        setExistingSpecies(data || []);
      } catch (err) {
        console.error('Failed to fetch species list:', err);
      }
    };

    fetchSpecies();
  }, [showAddSpeciesForm]);

  // Fetch careers when Add Specialization form is shown
  useEffect(() => {
    const fetchCareers = async () => {
      if (!showAddSpecializationForm) return;

      try {
        const { data, error } = await supabase
          .from('SW_career')
          .select('id, name')
          .order('name');

        if (error) throw error;

        setAvailableCareers(data?.map(c => c.name) || []);
        setCareersWithIds(data || []);
      } catch (err) {
        console.error('Failed to fetch careers:', err);
      }
    };

    fetchCareers();
  }, [showAddSpecializationForm]);

  // Fetch talents for tree when Add Specialization form is shown
  useEffect(() => {
    const fetchTalentsForTree = async () => {
      if (!showAddSpecializationForm) return;

      try {
        const { data, error } = await supabase
          .from('SW_abilities')
          .select('ability')
          .order('ability');

        if (error) throw error;

        setAvailableTalentsForTree(data?.map(t => t.ability) || []);
      } catch (err) {
        console.error('Failed to fetch talents:', err);
      }
    };

    fetchTalentsForTree();
  }, [showAddSpecializationForm]);

  // Fetch force talents when Add Force Tree form is shown
  useEffect(() => {
    const fetchForceAbilities = async () => {
      if (!showAddForceTreeForm) return;

      try {
        const { data, error } = await supabase
          .from('SW_force_talents')
          .select('talent_name')
          .order('talent_name');

        if (error) throw error;

        setAvailableForceAbilities(data?.map(t => t.talent_name) || []);
      } catch (err) {
        console.error('Failed to fetch force talents:', err);
      }
    };

    fetchForceAbilities();
  }, [showAddForceTreeForm]);

  // Fetch existing specs and ability map for editing when form is shown
  useEffect(() => {
    const fetchSpecsAndAbilities = async () => {
      if (!showAddSpecializationForm) return;

      try {
        const [specsRes, abilitiesRes] = await Promise.all([
          supabase.from('SW_spec').select('id, Career, spec_name, description, spec_skills'),
          supabase.from('SW_abilities').select('id, ability, description, activation')
        ]);

        if (specsRes.error) throw specsRes.error;
        if (abilitiesRes.error) throw abilitiesRes.error;

        setExistingSpecs(specsRes.data || []);

        const abilityMap = {};
        (abilitiesRes.data || []).forEach(a => {
          abilityMap[a.id] = {
            name: a.ability,
            description: a.description || '',
            activation: a.activation || ''
          };
        });
        setAbilityMapById(abilityMap);
      } catch (err) {
        console.error('Failed to fetch specs/abilities:', err);
      }
    };

    fetchSpecsAndAbilities();
  }, [showAddSpecializationForm]);

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

  useEffect(() => {
    if (showAddPathfinderRaceForm && isAdmin) {
      loadPathfinderRaces();
    }
  }, [showAddPathfinderRaceForm, isAdmin]);

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

  const handleToggleUploadPictures = async () => {
    setSavingUploadPictures(true);
    try {
      const { error } = await supabase
        .from('Admin_Control')
        .update({ Upload_pictures: !uploadPicturesEnabled })
        .eq('id', 1);

      if (error) throw error;

      setUploadPicturesEnabled(!uploadPicturesEnabled);
      setSuccess('Upload Pictures setting updated');
    } catch (err) {
      setError('Failed to update Upload Pictures setting');
      console.error(err);
    } finally {
      setSavingUploadPictures(false);
    }
  };

  const handleBack = () => {
    navigate('/select-ttrpg');
  };

  const handleStarWarsStats = () => {
    setShowStarWarsSection(!showStarWarsSection);
    setShowRacePictures(false);
    setShowCareerPictures(false);
    setShowAddSpeciesForm(false);
    setShowAddSpecializationForm(false);
    setShowAddEquipmentForm(false);
    setShowAddCareerForm(false);
    // Collapse Pathfinder section and its forms
    setShowPathfinderSection(false);
    setShowAddPathfinderRaceForm(false);
  };

  const handlePathfinderStats = () => {
    setShowPathfinderSection(!showPathfinderSection);
    // Collapse SW-specific subviews when toggling Pathfinder section
    setShowStarWarsSection(false);
    setShowRacePictures(false);
    setShowCareerPictures(false);
    setShowAddSpeciesForm(false);
    setShowAddSpecializationForm(false);
    setShowAddEquipmentForm(false);
    setShowAddCareerForm(false);
    setShowAddPathfinderRaceForm(false);
  };

  const handleAddPathfinderRace = () => {
    setShowAddPathfinderRaceForm(true);
    setShowRacePictures(false);
    setShowCareerPictures(false);
    setShowAddSpeciesForm(false);
    setShowAddSpecializationForm(false);
    setShowAddEquipmentForm(false);
    setShowAddCareerForm(false);
    loadPathfinderRaces();
  };


  const handleRacePictures = () => {
    setShowRacePictures(true);
    setShowCareerPictures(false);
    setShowAddSpeciesForm(false);
    setShowAddSpecializationForm(false);
    setShowAddCareerForm(false);
  };

  const handleCareerPictures = () => {
    setShowCareerPictures(true);
    setShowRacePictures(false);
    setShowAddSpeciesForm(false);
    setShowAddSpecializationForm(false);
    setShowAddCareerForm(false);
  };

  const handleAddSpecies = () => {
    setShowAddSpeciesForm(true);
    setShowAddSpecializationForm(false);
    setShowAddEquipmentForm(false);
    setShowAddCareerForm(false);
    setShowRacePictures(false);
    setShowCareerPictures(false);
  };

  const handleAddSpecialization = () => {
    setShowAddSpecializationForm(true);
    setShowAddSpeciesForm(false);
    setShowAddEquipmentForm(false);
    setShowAddCareerForm(false);
    setShowRacePictures(false);
    setShowCareerPictures(false);
  };

  const handleAddCareer = () => {
    setShowAddCareerForm(true);
    setShowAddSpeciesForm(false);
    setShowAddSpecializationForm(false);
    setShowAddEquipmentForm(false);
    setShowRacePictures(false);
    setShowCareerPictures(false);
  };

  const handleAddEquipment = () => {
    setShowAddEquipmentForm(true);
    setShowAddSpeciesForm(false);
    setShowAddSpecializationForm(false);
    setShowAddCareerForm(false);
    setShowRacePictures(false);
    setShowCareerPictures(false);
  };

  const handleAddForceTree = () => {
    setShowAddForceTreeForm(true);
    setShowAddSpeciesForm(false);
    setShowAddSpecializationForm(false);
    setShowAddEquipmentForm(false);
    setShowAddCareerForm(false);
    setShowRacePictures(false);
    setShowCareerPictures(false);
  };

  const handleAddAbilityTree = () => {
    setShowAddAbilityTreeForm(true);
    setShowAddSpeciesForm(false);
    setShowAddSpecializationForm(false);
    setShowAddEquipmentForm(false);
    setShowAddCareerForm(false);
    setShowRacePictures(false);
    setShowCareerPictures(false);
  };

  const handleAddSkill = (skill) => {
    if (skill && !speciesSkills.includes(skill)) {
      setSpeciesSkills([...speciesSkills, skill]);
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSpeciesSkills(speciesSkills.filter(s => s !== skillToRemove));
  };

  const handleAddTalent = (talent) => {
    if (talent && !speciesTalents.includes(talent)) {
      setSpeciesTalents([...speciesTalents, talent]);
    }
  };

  const handleRemoveTalent = (talentToRemove) => {
    setSpeciesTalents(speciesTalents.filter(t => t !== talentToRemove));
  };

  const handleAddSpecSkill = (skill) => {
    if (skill && !specSkills.includes(skill)) {
      setSpecSkills([...specSkills, skill]);
    }
  };

  const handleRemoveSpecSkill = (skillToRemove) => {
    setSpecSkills(specSkills.filter(s => s !== skillToRemove));
  };

  const handleTalentTreeChange = async (boxIndex, talentName) => {
    if (talentName === '__ADD_NEW__') {
      setCustomTalentInputMode(prev => ({ ...prev, [boxIndex]: true }));
      setIsCustomTalent(prev => ({ ...prev, [boxIndex]: true }));
      setSpecTalentTree(prev => ({ ...prev, [boxIndex]: '' }));
      setSpecTalentDescriptions(prev => ({ ...prev, [boxIndex]: '' }));
      setSpecTalentActivations(prev => ({ ...prev, [boxIndex]: 'Passive' }));
    } else if (talentName) {
      setCustomTalentInputMode(prev => ({ ...prev, [boxIndex]: false }));
      setSpecTalentTree(prev => ({
        ...prev,
        [boxIndex]: talentName
      }));

      // Fetch description from SW_abilities
      try {
        const { data, error } = await supabase
          .from('SW_abilities')
          .select('description')
          .eq('ability', talentName)
          .single();

        if (error) {
          console.error('Error fetching talent description:', error);
          setSpecTalentDescriptions(prev => ({ ...prev, [boxIndex]: 'Description not found' }));
          setIsCustomTalent(prev => ({ ...prev, [boxIndex]: true }));
        } else {
          setSpecTalentDescriptions(prev => ({ ...prev, [boxIndex]: data?.description || '' }));
          setIsCustomTalent(prev => ({ ...prev, [boxIndex]: false }));
        }
      } catch (err) {
        console.error('Failed to fetch description:', err);
        setSpecTalentDescriptions(prev => ({ ...prev, [boxIndex]: '' }));
        setIsCustomTalent(prev => ({ ...prev, [boxIndex]: true }));
      }
    } else {
      setSpecTalentTree(prev => ({ ...prev, [boxIndex]: '' }));
      setSpecTalentDescriptions(prev => ({ ...prev, [boxIndex]: '' }));
      setSpecTalentActivations(prev => ({ ...prev, [boxIndex]: '' }));
      setIsCustomTalent(prev => ({ ...prev, [boxIndex]: false }));
    }
  };

  const handleCustomTalentInput = (boxIndex, value) => {
    setSpecTalentTree(prev => ({
      ...prev,
      [boxIndex]: value
    }));
  };

  const handleCustomTalentBlur = (boxIndex) => {
    const customTalent = specTalentTree[boxIndex];
    if (customTalent && customTalent.trim() && !availableTalentsForTree.includes(customTalent)) {
      setAvailableTalentsForTree(prev => [...prev, customTalent].sort());
    }
    if (customTalent && customTalent.trim()) {
      setIsCustomTalent(prev => ({ ...prev, [boxIndex]: true }));
    }
    setCustomTalentInputMode(prev => ({ ...prev, [boxIndex]: false }));
  };

  const handleDescriptionChange = (boxIndex, description) => {
    setSpecTalentDescriptions(prev => ({
      ...prev,
      [boxIndex]: description
    }));
  };

  const handleActivationChange = (boxIndex, activation) => {
    setSpecTalentActivations(prev => ({
      ...prev,
      [boxIndex]: activation
    }));
  };

  // Save a custom ability immediately to SW_abilities and update the UI
  const handleSaveCustomAbility = async (boxIndex) => {
    const name = (specTalentTree[boxIndex] || '').trim();
    const description = (specTalentDescriptions[boxIndex] || '').trim();
    const activation = specTalentActivations[boxIndex] || 'Passive';

    if (!name) {
      alert('Ability name is required');
      return;
    }

    try {
      // Check if ability exists
      const { data: existing, error: selectErr } = await supabase
        .from('SW_abilities')
        .select('id')
        .eq('ability', name);

      if (selectErr) {
        console.error('Error checking ability:', selectErr);
        alert('Failed to check existing abilities');
        return;
      }

      if (existing && existing.length > 0) {
        const { error: updateErr } = await supabase
          .from('SW_abilities')
          .update({ description, activation })
          .eq('ability', name);
        if (updateErr) {
          console.error('Error updating ability:', updateErr);
          alert('Failed to update ability');
          return;
        }
      } else {
        const { error: insertErr } = await supabase
          .from('SW_abilities')
          .insert([{ ability: name, description, activation }]);
        if (insertErr) {
          console.error('Error saving ability:', insertErr);
          alert('Failed to save ability');
          return;
        }
      }

      // Ensure it's available in the talent dropdown list
      setAvailableTalentsForTree(prev => (
        prev.includes(name) ? prev : [...prev, name].sort()
      ));

      // Switch the box to use the saved ability as a normal (non-custom) entry
      setCustomTalentInputMode(prev => ({ ...prev, [boxIndex]: false }));
      setIsCustomTalent(prev => ({ ...prev, [boxIndex]: false }));

      alert('Ability saved');
    } catch (err) {
      console.error('Failed to save custom ability:', err);
      alert('Failed to save custom ability');
    }
  };

  const handleLinkChange = (linkKey, checked) => {
    setSpecTalentLinks(prev => ({
      ...prev,
      [linkKey]: checked
    }));
  };

  // Force Tree Ability Handlers
  const handleForceAbilityChange = (boxIndex, value) => {
    if (value === '__ADD_NEW__') {
      setForceTreeCustomInputMode(prev => ({ ...prev, [boxIndex]: true }));
    } else {
      setForceTreeAbilities(prev => ({ ...prev, [boxIndex]: value }));
      setForceTreeCustomInputMode(prev => ({ ...prev, [boxIndex]: false }));

      // Check for vertically adjacent boxes with same name
      checkForMergeableBoxes(boxIndex, value);
    }
  };

  const handleForceCustomAbilityInput = (boxIndex, value) => {
    setForceTreeAbilities(prev => ({ ...prev, [boxIndex]: value }));
  };

  const handleForceCustomAbilityBlur = (boxIndex) => {
    const customAbility = forceTreeAbilities[boxIndex];
    if (customAbility && customAbility.trim() && !availableForceAbilities.includes(customAbility)) {
      setAvailableForceAbilities(prev => [...prev, customAbility].sort());
    }
    if (customAbility && customAbility.trim()) {
      setForceTreeIsCustom(prev => ({ ...prev, [boxIndex]: true }));
    }
    setForceTreeCustomInputMode(prev => ({ ...prev, [boxIndex]: false }));

    // Check for vertically adjacent boxes with same name
    checkForMergeableBoxes(boxIndex, customAbility);
  };

  const resetEquipmentForm = () => {
    setEquipmentName('');
    setEquipmentDescription('');
    setEquipmentSkill('');
    setEquipmentDamage('');
    setEquipmentRange('');
    setEquipmentEncumbrance('');
    setEquipmentPrice('');
    setEquipmentRarity('');
    setEquipmentDamageMelee('');
    setEquipmentConsumable(false);
  };

  const handleSaveEquipment = async () => {
    if (!equipmentName.trim()) {
      alert('Please enter equipment name');
      return;
    }

    try {
      const payload = {
        equipment_name: equipmentName.trim(),
        description: equipmentDescription.trim(),
        skill_id: equipmentSkillId || null,
        range: equipmentRange || null,
        encumbrance: equipmentEncumbrance ? parseInt(equipmentEncumbrance, 10) : null,
        price: equipmentPrice ? parseInt(equipmentPrice, 10) : null,
        rarity: equipmentRarity ? parseInt(equipmentRarity, 10) : null,
        damage: equipmentDamage || null,
        critical: equipmentCritical || null,
        hp: equipmentHP ? parseInt(equipmentHP, 10) : null,
        special: equipmentSpecial || null,
        soak: equipmentSoak ? parseInt(equipmentSoak, 10) : null,
        damage_range: equipmentDamageRange || null,
        damage_melee: equipmentDamageMelee || null,
        consumable: equipmentConsumable
      };

      const { error } = await supabase
        .from('SW_equipment')
        .insert([payload]);

      if (error) {
        console.error('Error saving equipment:', error);
        alert('Failed to save equipment');
        return;
      }

      alert('Equipment saved successfully!');
      resetEquipmentForm();
      setShowAddEquipmentForm(false);
    } catch (err) {
      console.error('Error saving equipment:', err);
      alert('Failed to save equipment');
    }
  };

  const resetSpeciesForm = () => {
    setEditingSpeciesId(null);
    setSpeciesName('');
    setSpeciesSourceBook('');
    setSpeciesDescription('');
    setSpeciesBrawn('');
    setSpeciesAgility('');
    setSpeciesIntellect('');
    setSpeciesCunning('');
    setSpeciesWillpower('');
    setSpeciesPresence('');
    setSpeciesWound('');
    setSpeciesStrain('');
    setSpeciesRaceAttack('');
    setSpeciesEXP('');
    setSpeciesTalents([]);
    setSpeciesSkills([]);
    setSpeciesAbility('');
  };

  const resetCareerForm = () => {
    setEditingCareerId(null);
    setCareerName('');
    setCareerDescription('');
    setCareerSkills([]);
    setCareerSourceBook('');
    setCareerForceSensitive(false);
  };

  const resetPRaceForm = () => {
    setSelectedPRaceId('__new__');
    setPRaceName('');
    setPRaceDescription('');
    setPRaceStats('');
    setPRaceSize('');
    setPRaceSpeed('');
    setPRaceModifySpeed(false);
    setPRaceAbilities('');
    setPRaceLanguages('');
    setPRaceHighIntLanguages('');
  };

  const handleSelectCareer = (careerId) => {
    if (!careerId) {
      resetCareerForm();
      return;
    }

    const selected = existingCareers.find(c => String(c.id) === String(careerId));
    if (!selected) return;

    setEditingCareerId(selected.id);
    setCareerName(selected.name || '');
    setCareerDescription(selected.description || '');
    setCareerSkills((selected.skills || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean));
    setCareerSourceBook(selected.source_book ? String(selected.source_book) : '');
    setCareerForceSensitive(selected.Force_Sensitive === true);
  };

  const handleAddCareerSkill = (skill) => {
    if (skill && !careerSkills.includes(skill)) {
      setCareerSkills([...careerSkills, skill]);
    }
  };

  const handleRemoveCareerSkill = (skillToRemove) => {
    setCareerSkills(careerSkills.filter(s => s !== skillToRemove));
  };

  const handleSaveCareer = async () => {
    try {
      if (!careerName.trim()) {
        alert('Career name is required');
        return;
      }

      setSavingCareer(true);

      const bookId = careerSourceBook ? parseInt(careerSourceBook, 10) : null;

      const payload = {
        name: careerName,
        description: careerDescription,
        skills: careerSkills.join(', '),
        source_book: bookId,
        Force_Sensitive: careerForceSensitive
      };

      if (editingCareerId) {
        const { error } = await supabase
          .from('SW_career')
          .update(payload)
          .eq('id', editingCareerId);
        if (error) {
          console.error('Error updating career:', error);
          alert('Failed to update career: ' + error.message);
          return;
        }
        alert('Career updated successfully!');
      } else {
        const { data: maxIdData, error: maxIdError } = await supabase
          .from('SW_career')
          .select('id')
          .order('id', { ascending: false })
          .limit(1)
          .single();
        let nextId = 1;
        if (!maxIdError && maxIdData?.id) nextId = maxIdData.id + 1;

        const { error } = await supabase
          .from('SW_career')
          .insert([{ id: nextId, ...payload }]);
        if (error) {
          console.error('Error saving career:', error);
          alert('Failed to save career: ' + error.message);
          return;
        }
        alert('Career saved successfully!');
      }

      resetCareerForm();
      setShowAddCareerForm(false);
    } catch (err) {
      console.error('Error saving career:', err);
      alert('Failed to save career');
    } finally {
      setSavingCareer(false);
    }
  };

  const handleSavePRace = async () => {
    try {
      if (!pRaceName.trim()) {
        alert('Race name is required');
        return;
      }

      setSavingPRace(true);

      const payload = {
        Name: pRaceName.trim(),
        Description: pRaceDescription.trim(),
        Race_Stats: pRaceStats.trim(),
        Size: pRaceSize.trim(),
        Speed: pRaceSpeed ? parseInt(pRaceSpeed, 10) : null,
        Modify_Speed: !!pRaceModifySpeed,
        Abilities: pRaceAbilities.trim(),
        Languages: pRaceLanguages.trim(),
        Lang_High_Int: pRaceHighIntLanguages.trim(),
      };
      let error;
      if (selectedPRaceId && selectedPRaceId !== '__new__') {
        ({ error } = await supabase
          .from('P_races')
          .update(payload)
          .eq('id', selectedPRaceId));
      } else {
        ({ error } = await supabase
          .from('P_races')
          .insert([payload]));
      }

      if (error) {
        console.error('Error saving Pathfinder race:', error);
        alert('Failed to save race: ' + error.message);
        return;
      }

      alert('Pathfinder race saved successfully!');
      resetPRaceForm();
      setShowAddPathfinderRaceForm(false);
      await loadPathfinderRaces();
    } catch (err) {
      console.error('Error saving Pathfinder race:', err);
      alert('Failed to save race');
    } finally {
      setSavingPRace(false);
    }
  };

  const loadPathfinderRaces = async () => {
    try {
      const { data, error } = await supabase
        .from('P_races')
        .select('id, Name, Description, Race_Stats, Size, Speed, Modify_Speed, Abilities, Languages, Lang_High_Int')
        .order('Name');
      if (error) throw error;
      setPathfinderRaces(data || []);
    } catch (err) {
      console.error('Failed to load Pathfinder races:', err);
    }
  };

  const handleSelectSpecies = (speciesId) => {
    if (!speciesId) {
      resetSpeciesForm();
      return;
    }

    const selected = existingSpecies.find(s => String(s.id) === String(speciesId));
    if (!selected) return;

    setEditingSpeciesId(selected.id);
    setSpeciesName(selected.name || '');
    setSpeciesSourceBook(selected.source_book ? String(selected.source_book) : '');
    setSpeciesDescription(selected.description || '');
    setSpeciesBrawn(selected.brawn ?? '');
    setSpeciesAgility(selected.agility ?? '');
    setSpeciesIntellect(selected.intellect ?? '');
    setSpeciesCunning(selected.cunning ?? '');
    setSpeciesWillpower(selected.willpower ?? '');
    setSpeciesPresence(selected.presence ?? '');
    setSpeciesWound(selected.wound ?? '');
    setSpeciesStrain(selected.Strain ?? '');
    setSpeciesRaceAttack(selected.Race_Attack || '');
    setSpeciesEXP(selected.EXP ?? '');
    setSpeciesTalents((selected.Starting_Talents || '')
      .split(',')
      .map(t => t.trim())
      .filter(Boolean));
    setSpeciesSkills((selected.Starting_Skill || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean));
    setSpeciesAbility(selected.ability || '');
  };

  const resetSpecializationForm = () => {
    setEditingSpecId(null);
    setSpecName('');
    setSpecCareer('');
    setSpecDescription('');
    setSpecSkills([]);
    setSpecTalentTree({});
    setSpecTalentDescriptions({});
    setSpecTalentActivations({});
    setSpecTalentLinks({});
    setCustomTalentInputMode({});
    setIsCustomTalent({});
    setSpecConflict(null);
    setAbilityConflicts([]);
    setAbilityConflictAction(null);
  };

  const handleSelectSpecialization = async (specId) => {
    if (!specId) {
      resetSpecializationForm();
      return;
    }

    const selected = existingSpecs.find(s => String(s.id) === String(specId));
    if (!selected) return;

    setEditingSpecId(selected.id);
    setSpecName(selected.spec_name || '');
    const careerName = careersWithIds.find(c => c.id === selected.Career)?.name || '';
    setSpecCareer(careerName);
    setSpecDescription(selected.description || '');
    setSpecSkills((selected.spec_skills || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean));

    try {
      const { data: treeRow, error: treeErr } = await supabase
        .from('SW_spec_tree')
        .select('*')
        .eq('spec_ID', specId)
        .maybeSingle();

      if (treeErr) {
        console.error('Failed to load specialization tree:', treeErr);
      }

      if (!treeRow) {
        resetSpecializationForm();
        setSpecName(selected.spec_name || '');
        setSpecCareer(careerName);
        setSpecDescription(selected.description || '');
        setSpecSkills((selected.spec_skills || '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean));
        setEditingSpecId(selected.id);
        return;
      }

      const rows = [5, 10, 15, 20, 25];
      const newTree = {};
      const newDescriptions = {};
      const newActivations = {};
      const newLinks = {};
      const newCustomFlags = {};
      const newCustomModes = {};

      for (let r = 0; r < 5; r++) {
        for (let c = 1; c <= 4; c++) {
          const boxIndex = r * 4 + (c - 1);
          const fieldBase = `ability_${rows[r]}_${c}`;
          const abilityId = treeRow[fieldBase];
          if (abilityId) {
            const abilityInfo = abilityMapById[abilityId];
            const abilityName = abilityInfo?.name || '';
            newTree[boxIndex] = abilityName;
            newDescriptions[boxIndex] = abilityInfo?.description || '';
            newActivations[boxIndex] = abilityInfo?.activation || '';
            newCustomFlags[boxIndex] = false;
            newCustomModes[boxIndex] = false;
          }

          const linkStr = treeRow[`${fieldBase}_links`] || '';
          const links = linkStr
            .split(',')
            .map(l => l.trim())
            .filter(Boolean);

          // Convert links back to checkbox positions
          // "Right" link means checkbox to the right of this talent (at position r, c-1)
          if (links.includes('Right') && c < 4) {
            newLinks[`${r}_${c - 1}_right`] = true;
          }
          // "Down" link means checkbox below this talent (at position r, c-1)
          if (links.includes('Down') && r < 4) {
            newLinks[`${r}_${c - 1}_down`] = true;
          }
          // "Left" link means checkbox to the left of this talent (at position r, c-2)
          if (links.includes('Left') && c > 1) {
            newLinks[`${r}_${c - 2}_right`] = true;
          }
          // "Up" link means checkbox above this talent (at position r-1, c-1)
          if (links.includes('Up') && r > 0) {
            newLinks[`${r - 1}_${c - 1}_down`] = true;
          }
        }
      }

      setSpecTalentTree(newTree);
      setSpecTalentDescriptions(newDescriptions);
      setSpecTalentActivations(newActivations);
      setSpecTalentLinks(newLinks);
      setIsCustomTalent(newCustomFlags);
      setCustomTalentInputMode(newCustomModes);
    } catch (err) {
      console.error('Failed to load specialization details:', err);
    }
  };

  const handleSaveSpecies = async () => {
    try {
      if (!speciesName.trim()) {
        alert('Species name is required');
        return;
      }

      const bookId = speciesSourceBook ? parseInt(speciesSourceBook, 10) : null;

      const payload = {
        name: speciesName,
        description: speciesDescription,
        brawn: parseInt(speciesBrawn) || 0,
        agility: parseInt(speciesAgility) || 0,
        intellect: parseInt(speciesIntellect) || 0,
        cunning: parseInt(speciesCunning) || 0,
        willpower: parseInt(speciesWillpower) || 0,
        presence: parseInt(speciesPresence) || 0,
        wound: parseInt(speciesWound) || 0,
        Strain: parseInt(speciesStrain) || 0,
        Race_Attack: speciesRaceAttack,
        EXP: parseInt(speciesEXP) || 0,
        Starting_Talents: speciesTalents.join(', '),
        Starting_Skill: speciesSkills.join(', '),
        ability: speciesAbility,
        source_book: bookId
      };

      if (editingSpeciesId) {
        const { error } = await supabase
          .from('races')
          .update(payload)
          .eq('id', editingSpeciesId);
        if (error) {
          console.error('Error updating species:', error);
          alert('Failed to update species: ' + error.message);
          return;
        }
        alert('Species updated successfully!');
      } else {
        const { data: maxIdData, error: maxIdError } = await supabase
          .from('races')
          .select('id')
          .order('id', { ascending: false })
          .limit(1)
          .single();
        let nextId = 1;
        if (!maxIdError && maxIdData?.id) nextId = maxIdData.id + 1;

        const { error } = await supabase
          .from('races')
          .insert([{ id: nextId, ...payload }]);
        if (error) {
          console.error('Error saving species:', error);
          alert('Failed to save species: ' + error.message);
          return;
        }
        alert('Species saved successfully!');
      }

      resetSpeciesForm();
      setShowAddSpeciesForm(false);
    } catch (err) {
      console.error('Error saving species:', err);
      alert('Failed to save species');
    }
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
            career_ID: item.careerId,
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
  // 6b. Fetch Careers + Specs + Pictures + Race Names
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
            careerId: spec.Career,
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


      {/* Admin Tabs */}
      {isAdmin && (
        <div className="w-3/4 max-w-md flex gap-4 mb-8">
          <button
            className={`flex-1 px-6 py-2 rounded font-semibold transition border-b-4 ${showStarWarsSection ? 'bg-indigo-100 border-indigo-600 text-indigo-800' : 'bg-gray-100 border-transparent text-gray-600'}`}
            onClick={() => {
              setShowStarWarsSection(true);
              setShowPathfinderSection(false);
            }}
          >
            Star Wars
          </button>
          <button
            className={`flex-1 px-6 py-2 rounded font-semibold transition border-b-4 ${showPathfinderSection ? 'bg-red-100 border-red-600 text-red-800' : 'bg-gray-100 border-transparent text-gray-600'}`}
            onClick={() => {
              setShowStarWarsSection(false);
              setShowPathfinderSection(true);
            }}
          >
            Pathfinder
          </button>
        </div>
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

      <button
        onClick={handleBack}
        className="mt-8 px-6 py-3 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
      >
        Back
      </button>

      <div className="w-3/4 max-w-md text-center mb-8">
        <p className="text-gray-600">No other settings available yet.</p>
      </div>

      {isAdmin && (
        <div className="w-3/4 max-w-md space-y-4">
          <div className="flex gap-3">
            <button
              onClick={handlePathfinderStats}
              className="flex-1 px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition font-medium"
            >
              Pathfinder Stats
            </button>
            <button
              onClick={handleStarWarsStats}
              className="flex-1 px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition font-medium"
            >
              Star Wars Stats
            </button>
          </div>

          {/* Upload Pictures Setting */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={uploadPicturesEnabled}
                onChange={handleToggleUploadPictures}
                disabled={savingUploadPictures}
                className="w-4 h-4 cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-800">
                Allow Non-Admin Users to Upload Pictures
              </span>
            </label>
            {savingUploadPictures && <p className="text-xs text-gray-600 mt-2">Saving...</p>}
          </div>

          {showPathfinderSection && (
            <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
              <button
                onClick={handleAddPathfinderRace}
                className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition font-medium"
              >
                Add Race
              </button>

              {showAddPathfinderRaceForm && (
                <div className="p-6 bg-gray-100 rounded-lg border border-gray-300">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">Add Race (Pathfinder)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <select
                        value={selectedPRaceId}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '__new__') {
                            resetPRaceForm();
                            setSelectedPRaceId('__new__');
                          } else {
                            setSelectedPRaceId(val);
                            const found = pathfinderRaces.find((r) => String(r.id) === String(val));
                            if (found) {
                              setPRaceName(found.Name || '');
                              setPRaceDescription(found.Description || '');
                              setPRaceStats(found.Race_Stats || '');
                              setPRaceSize(found.Size || '');
                              setPRaceSpeed(found.Speed ?? '');
                              setPRaceModifySpeed(!!found.Modify_Speed);
                              setPRaceAbilities(found.Abilities || '');
                              setPRaceLanguages(found.Languages || '');
                              setPRaceHighIntLanguages(found.Lang_High_Int || '');
                            }
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      >
                        <option value="__new__">-- New Race --</option>
                        {pathfinderRaces.map((race) => (
                          <option key={race.id} value={race.id}>{race.Name}</option>
                        ))}
                      </select>
                      {selectedPRaceId === '__new__' ? (
                        <input
                          type="text"
                          value={pRaceName}
                          onChange={(e) => setPRaceName(e.target.value)}
                          placeholder="Enter race name"
                          className="mt-2 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        />
                      ) : (
                        <input
                          type="text"
                          value={pRaceName}
                          onChange={(e) => setPRaceName(e.target.value)}
                          className="mt-2 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                      <select
                        value={pRaceSize}
                        onChange={(e) => setPRaceSize(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Select Size --</option>
                        <option value="Small">Small</option>
                        <option value="Medium">Medium</option>
                        <option value="Large">Large</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={pRaceDescription}
                        onChange={(e) => setPRaceDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        rows={3}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Race Stats</label>
                      <textarea
                        value={pRaceStats}
                        onChange={(e) => setPRaceStats(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Speed</label>
                      <input
                        type="number"
                        value={pRaceSpeed}
                        onChange={(e) => setPRaceSpeed(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        min="0"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={pRaceModifySpeed}
                        onChange={(e) => setPRaceModifySpeed(e.target.checked)}
                        className="w-4 h-4 border border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">Modify Speed</span>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Abilities</label>
                      <textarea
                        value={pRaceAbilities}
                        onChange={(e) => setPRaceAbilities(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        rows={3}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Languages</label>
                      <textarea
                        value={pRaceLanguages}
                        onChange={(e) => setPRaceLanguages(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        rows={2}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">High Intelligence Languages</label>
                      <textarea
                        value={pRaceHighIntLanguages}
                        onChange={(e) => setPRaceHighIntLanguages(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        rows={2}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3 flex-wrap">
                    <button
                      onClick={handleSavePRace}
                      disabled={savingPRace}
                      className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-bold disabled:opacity-60"
                    >
                      {savingPRace ? 'Saving...' : (selectedPRaceId && selectedPRaceId !== '__new__' ? 'Update Race' : 'Save Race')}
                    </button>
                    <button
                      onClick={() => { resetPRaceForm(); setShowAddPathfinderRaceForm(false); }}
                      className="px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

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

              <div className="flex space-x-3 mt-4">
                <button
                  onClick={handleAddSpecies}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-medium"
                >
                  Add Species
                </button>


                <button
                  onClick={handleAddCareer}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm font-medium"
                >
                  Add Career
                </button>
                <button
                  onClick={handleAddSpecialization}
                  className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition text-sm font-medium"
                >
                  Add Specialization
                </button>
                <button
                  onClick={handleAddEquipment}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition text-sm font-medium"
                >
                  Add Equipment
                </button>
                <button
                  onClick={handleAddForceTree}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition text-sm font-medium"
                >
                  Add Force Tree
                </button>
              </div>

              {showAddSpeciesForm && (
                <div className="mt-6 p-6 bg-gray-100 rounded-lg border border-gray-300">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">Add or Edit Species</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Existing Species</label>
                      <select
                        value={editingSpeciesId || ''}
                        onChange={(e) => handleSelectSpecies(e.target.value || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Create New Species --</option>
                        {existingSpecies
                          .slice()
                          .sort((a,b) => (a.name||'').localeCompare(b.name||''))
                          .map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={speciesName}
                        onChange={(e) => setSpeciesName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Source Book</label>
                      <select
                        value={speciesSourceBook}
                        onChange={(e) => setSpeciesSourceBook(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Select a source book --</option>
                        {availableBooks.map((book) => (
                          <option key={book.id} value={book.id}>
                            {book.Book_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                      <div className="space-y-2">
                        {/* Selected skills as tags */}
                        {speciesSkills.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {speciesSkills.map((skill, index) => (
                              <div
                                key={index}
                                className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                              >
                                <span>{skill}</span>
                                <button
                                  onClick={() => handleRemoveSkill(skill)}
                                  className="ml-2 text-blue-600 hover:text-blue-800 font-bold"
                                  type="button"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Dropdown to add more skills */}
                        <select
                          onChange={(e) => {
                            handleAddSkill(e.target.value);
                            e.target.value = '';
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                          value=""
                        >
                          <option value="">-- Select a skill to add --</option>
                          {availableSkills
                            .filter(skill => !speciesSkills.includes(skill))
                            .map((skill, index) => (
                              <option key={index} value={skill}>
                                {skill}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ability</label>
                      <textarea
                        value={speciesAbility}
                        onChange={(e) => setSpeciesAbility(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        rows={3}
                      />
                    </div>

                    <button
                      onClick={handleSaveSpecies}
                      className="w-full px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition shadow-lg"
                    >
                      {editingSpeciesId ? 'Update Species' : 'Save Species'}
                    </button>
                  </div>
                </div>
              )}

              {showAddCareerForm && (
                <div className="mt-6 p-6 bg-gray-100 rounded-lg border border-gray-300">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">Add or Edit Career</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Existing Career</label>
                      <select
                        value={editingCareerId || ''}
                        onChange={(e) => handleSelectCareer(e.target.value || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Create New Career --</option>
                        {existingCareers
                          .slice()
                          .sort((a,b) => (a.name||'').localeCompare(b.name||''))
                          .map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={careerName}
                        onChange={(e) => setCareerName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={careerDescription}
                        onChange={(e) => setCareerDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        rows={4}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Source Book</label>
                      <select
                        value={careerSourceBook}
                        onChange={(e) => setCareerSourceBook(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Select a source book --</option>
                        {careerBooks.map((book) => (
                          <option key={book.id} value={book.id}>
                            {book.Book_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="flex items-center text-sm font-medium text-gray-700">
                        <input
                          type="checkbox"
                          checked={careerForceSensitive}
                          onChange={(e) => setCareerForceSensitive(e.target.checked)}
                          className="mr-2 w-4 h-4 border border-gray-300 rounded focus:outline-none"
                        />
                        Force Sensitive
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                      <div className="space-y-2">
                        {careerSkills.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {careerSkills.map((skill, index) => (
                              <div
                                key={index}
                                className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                              >
                                <span>{skill}</span>
                                <button
                                  onClick={() => handleRemoveCareerSkill(skill)}
                                  className="ml-2 text-blue-600 hover:text-blue-800 font-bold"
                                  type="button"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <select
                          onChange={(e) => {
                            handleAddCareerSkill(e.target.value);
                            e.target.value = '';
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                          value=""
                        >
                          <option value="">-- Select a skill to add --</option>
                          {availableSkills
                            .filter(skill => !careerSkills.includes(skill))
                            .map((skill, index) => (
                              <option key={index} value={skill}>
                                {skill}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={handleSaveCareer}
                      disabled={savingCareer}
                      className="w-full px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-60 transition shadow-lg"
                    >
                      {savingCareer ? 'Saving...' : (editingCareerId ? 'Update Career' : 'Save Career')}
                    </button>
                  </div>
                </div>
              )}

              {showAddSpecializationForm && (
                <div className="mt-6 p-6 bg-gray-100 rounded-lg border border-gray-300">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">Add or Edit Specialization</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Existing Specialization</label>
                      <select
                        value={editingSpecId || ''}
                        onChange={(e) => handleSelectSpecialization(e.target.value || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Create New Specialization --</option>
                        {existingSpecs
                          .slice()
                          .sort((a,b)=> (a.spec_name||'').localeCompare(b.spec_name||''))
                          .map((s) => (
                            <option key={s.id} value={s.id}>{s.spec_name}</option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={specName}
                        onChange={(e) => setSpecName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Career</label>
                      <select
                        value={specCareer}
                        onChange={(e) => setSpecCareer(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Select a career --</option>
                        {availableCareers.map((career, index) => (
                          <option key={index} value={career}>
                            {career}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={specDescription}
                        onChange={(e) => setSpecDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        rows={4}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                      <div className="space-y-2">
                        {/* Selected skills as tags */}
                        {specSkills.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {specSkills.map((skill, index) => (
                              <div
                                key={index}
                                className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                              >
                                <span>{skill}</span>
                                <button
                                  onClick={() => handleRemoveSpecSkill(skill)}
                                  className="ml-2 text-blue-600 hover:text-blue-800 font-bold"
                                  type="button"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Dropdown to add more skills */}
                        <select
                          onChange={(e) => {
                            handleAddSpecSkill(e.target.value);
                            e.target.value = '';
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                          value=""
                        >
                          <option value="">-- Select a skill to add --</option>
                          {availableSkills
                            .filter(skill => !specSkills.includes(skill))
                            .map((skill, index) => (
                              <option key={index} value={skill}>
                                {skill}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Talent Tree</label>
                      <div className="overflow-y-auto border border-gray-300 rounded-lg p-4 bg-white" style={{ minHeight: '500px', maxHeight: '700px', width: 'fit-content' }}>
                        <table className="border-separate text-center text-xs" style={{ borderSpacing: '0' }}>
                          <tbody>
                            {Array.from({ length: 10 }, (_, rowIndex) => {
                              const expValues = [5, 10, 15, 20, 25];
                              const isTalentRow = rowIndex % 2 === 0 && rowIndex < 10;
                              const adjustedRowIndex = Math.floor(rowIndex / 2);
                              const expToShow = isTalentRow ? expValues[adjustedRowIndex] : null;
                              
                              return (
                                <tr key={rowIndex} className="bg-gray-50" style={{ height: isTalentRow ? 'auto' : '16px' }}>
                                  {Array.from({ length: 8 }, (_, colIndex) => {
                                    const talentIndex = Math.floor(colIndex / 2);
                                    const isTalentBox = colIndex % 2 === 0 && colIndex < 8 && isTalentRow;
                                    const isHorizontalSpace = colIndex % 2 === 1 && colIndex < 7 && isTalentRow;
                                    const isVerticalSpace = colIndex % 2 === 0 && !isTalentRow && rowIndex > 0 && rowIndex < 9;
                                    const boxIndex = adjustedRowIndex * 4 + talentIndex;
                                    
                                    return (
                                      <td key={colIndex} className={isTalentBox ? 'p-2 align-top' : 'p-2'} style={{
                                        position: 'relative',
                                        border: isTalentBox ? '2px solid black' : 'none',
                                        width: isTalentBox ? '260px' : '24px',
                                        height: isTalentBox ? '190px' : '24px',
                                        textAlign: 'center',
                                        verticalAlign: 'middle'
                                      }}>
                                        {isTalentBox && (
                                          <div
                                            className="talent-box"
                                            style={{
                                              width: '260px',
                                              height: '190px',
                                              textAlign: 'left',
                                              padding: '8px',
                                              position: 'relative',
                                              boxSizing: 'border-box',
                                              backgroundColor: '#e0f7fa',
                                              border: '1px solid #999'
                                            }}
                                          >
                                            <div className="border-b border-gray-400 pb-1">
                                              {customTalentInputMode[boxIndex] ? (
                                                <input
                                                  type="text"
                                                  value={specTalentTree[boxIndex] || ''}
                                                  onChange={(e) => handleCustomTalentInput(boxIndex, e.target.value)}
                                                  onBlur={() => handleCustomTalentBlur(boxIndex)}
                                                  placeholder="Enter talent name..."
                                                  className="w-full text-xs font-semibold border border-gray-300 rounded px-1 py-1 focus:outline-none focus:border-blue-500"
                                                  autoFocus
                                                />
                                              ) : (
                                                <select
                                                  value={specTalentTree[boxIndex] || ''}
                                                  onChange={(e) => handleTalentTreeChange(boxIndex, e.target.value)}
                                                  className="w-full text-xs font-semibold border border-gray-300 rounded px-1 py-1 focus:outline-none focus:border-blue-500"
                                                >
                                                  <option value="">-- Select Talent --</option>
                                                  <option value="__ADD_NEW__">+ Add New Ability</option>
                                                  {availableTalentsForTree.map((talent, idx) => (
                                                    <option key={idx} value={talent}>
                                                      {talent}
                                                    </option>
                                                  ))}
                                                </select>
                                              )}
                                            </div>
                                            <div className="text-xs text-gray-700 mt-1" style={{ minHeight: '80px', maxHeight: '110px', overflowY: 'auto' }}>
                                              {isCustomTalent[boxIndex] ? (
                                                <>
                                                  <textarea
                                                    value={specTalentDescriptions[boxIndex] || ''}
                                                    onChange={(e) => handleDescriptionChange(boxIndex, e.target.value)}
                                                    placeholder="Enter description..."
                                                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500 resize-none"
                                                    rows={2}
                                                  />
                                                  <select
                                                    value={specTalentActivations[boxIndex] || 'Passive'}
                                                    onChange={(e) => handleActivationChange(boxIndex, e.target.value)}
                                                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 mt-1 focus:outline-none focus:border-blue-500"
                                                  >
                                                    <option value="Passive">Passive</option>
                                                    <option value="Active">Active</option>
                                                  </select>
                                                  <div className="mt-2 flex justify-end">
                                                    <button
                                                      type="button"
                                                      onClick={() => handleSaveCustomAbility(boxIndex)}
                                                      className="px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700"
                                                    >
                                                      Save Ability
                                                    </button>
                                                  </div>
                                                </>
                                              ) : (
                                                <div className="text-xs">{specTalentDescriptions[boxIndex] || 'Select a talent to see description'}</div>
                                              )}
                                            </div>
                                            <div className="absolute bottom-2 right-2 text-right text-xs font-semibold">
                                              <div>{expToShow} EXP</div>
                                            </div>
                                          </div>
                                        )}
                                        {isHorizontalSpace && (
                                          <input
                                            type="checkbox"
                                            checked={specTalentLinks[`${adjustedRowIndex}_${talentIndex}_right`] || false}
                                            onChange={(e) => handleLinkChange(`${adjustedRowIndex}_${talentIndex}_right`, e.target.checked)}
                                            className="cursor-pointer"
                                            style={{ width: '16px', height: '16px' }}
                                            title="Link to right talent"
                                          />
                                        )}
                                        {isVerticalSpace && (
                                          <input
                                            type="checkbox"
                                            checked={specTalentLinks[`${adjustedRowIndex}_${talentIndex}_down`] || false}
                                            onChange={(e) => handleLinkChange(`${adjustedRowIndex}_${talentIndex}_down`, e.target.checked)}
                                            className="cursor-pointer"
                                            style={{ width: '16px', height: '16px' }}
                                            title="Link to talent below"
                                          />
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <button
                        onClick={() => editingSpecId ? handleSaveSpecialization({ updateSpec: true, specIdOverride: editingSpecId }) : handleSaveSpecialization()}
                        disabled={savingSpec}
                        className="mt-4 w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition shadow-lg"
                      >
                        {savingSpec ? 'Saving...' : (editingSpecId ? 'Update Specialization' : 'Save Specialization')}
                      </button>
                      {specConflict && (
                        <div className="mt-3 p-3 border border-yellow-400 rounded bg-yellow-50">
                          <div className="text-sm font-semibold text-yellow-800 mb-2">
                            A specialization named "{specConflict.name}" already exists.
                          </div>
                          <div className="flex gap-2 text-sm">
                            <button
                              onClick={() => handleSaveSpecialization({ updateSpec: true })}
                              className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                              disabled={savingSpec}
                            >
                              Update Existing
                            </button>
                            <button
                              onClick={() => handleSaveSpecialization({ forceCreateSpec: true })}
                              className="px-3 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
                              disabled={savingSpec}
                            >
                              Add As New
                            </button>
                          </div>
                        </div>
                      )}
                      {abilityConflicts.length > 0 && (
                        <div className="mt-3 p-3 border border-orange-400 rounded bg-orange-50">
                          <div className="text-sm font-semibold text-orange-800">Custom abilities already exist:</div>
                          <ul className="text-sm text-orange-900 list-disc ml-5 mt-1">
                            {abilityConflicts.map((a, idx) => (
                              <li key={`${a.name}-${idx}`}>{a.name}</li>
                            ))}
                          </ul>
                          <div className="flex gap-2 mt-2 text-sm">
                            <button
                              onClick={() => { setAbilityConflictAction('update'); handleSaveSpecialization({ abilityMode: 'update' }); }}
                              className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                              disabled={savingSpec}
                            >
                              Update Existing Abilities
                            </button>
                            <button
                              onClick={() => { setAbilityConflictAction('addNew'); handleSaveSpecialization({ abilityMode: 'addNew' }); }}
                              className="px-3 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
                              disabled={savingSpec}
                            >
                              Add As New Abilities
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {showAddEquipmentForm && (
                <div className="mt-6 p-6 bg-gray-100 rounded-lg border border-gray-300">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">Add Equipment</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={equipmentName}
                        onChange={(e) => setEquipmentName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Skill</label>
                      <select
                        value={equipmentSkillId}
                        onChange={(e) => setEquipmentSkillId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Select a skill --</option>
                        {availableSkillsDetailed
                          .filter((s) => (s.type || '').toLowerCase() === 'combat')
                          .map((s) => (
                            <option key={s.id} value={s.id}>{s.skill}</option>
                          ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={equipmentDescription}
                        onChange={(e) => setEquipmentDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Range</label>
                      <select
                        value={equipmentRange}
                        onChange={(e) => setEquipmentRange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Select range --</option>
                        <option value="Engaged">Engaged</option>
                        <option value="Short">Short</option>
                        <option value="Medium">Medium</option>
                        <option value="Long">Long</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Encumbrance</label>
                      <input
                        type="number"
                        value={equipmentEncumbrance}
                        onChange={(e) => setEquipmentEncumbrance(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                      <input
                        type="number"
                        value={equipmentPrice}
                        onChange={(e) => setEquipmentPrice(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rarity</label>
                      <input
                        type="number"
                        value={equipmentRarity}
                        onChange={(e) => setEquipmentRarity(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Damage</label>
                      <input
                        type="number"
                        value={equipmentDamage}
                        onChange={(e) => setEquipmentDamage(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Critical</label>
                      <input
                        type="number"
                        value={equipmentCritical}
                        onChange={(e) => setEquipmentCritical(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">HP</label>
                      <input
                        type="number"
                        value={equipmentHP}
                        onChange={(e) => setEquipmentHP(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Special Abilities</label>
                      <textarea
                        value={equipmentSpecial}
                        onChange={(e) => setEquipmentSpecial(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Soak</label>
                      <input
                        type="number"
                        value={equipmentSoak}
                        onChange={(e) => setEquipmentSoak(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Defence Range</label>
                      <input
                        type="text"
                        value={equipmentDamageRange}
                        onChange={(e) => setEquipmentDamageRange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Defence Melee</label>
                      <input
                        type="text"
                        value={equipmentDamageMelee}
                        onChange={(e) => setEquipmentDamageMelee(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={equipmentConsumable}
                        onChange={(e) => setEquipmentConsumable(e.target.checked)}
                        className="w-4 h-4 border border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">Consumable</span>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3 flex-wrap">
                    <button
                      onClick={handleSaveEquipment}
                      className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-bold"
                    >
                      Save Equipment
                    </button>
                    <button
                      onClick={() => { resetEquipmentForm(); setShowAddEquipmentForm(false); }}
                      className="px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {showAddForceTreeForm && (
                <div className="mt-6 p-6 bg-gray-100 rounded-lg border border-gray-300">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">Add or Edit Force Tree</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Force Tree Name</label>
                      <input
                        type="text"
                        value={forceTreeName}
                        onChange={(e) => setForceTreeName(e.target.value)}
                        placeholder="e.g., Jedi Consular"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={forceTreeDescription}
                        onChange={(e) => setForceTreeDescription(e.target.value)}
                        placeholder="Enter description..."
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 resize-none"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Force Prerequisite</label>
                      <input
                        type="text"
                        value={forceTreeTopPrerequisite}
                        onChange={(e) => setForceTreeTopPrerequisite(e.target.value)}
                        placeholder="Enter prerequisite..."
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>


                    <div className="border-t pt-4">
                      <h4 className="text-lg font-semibold text-gray-800 mb-3">Ability Tree</h4>
                      {/* Top Ability Orange Box - now part of the table as a full-width row */}
                      <div className="overflow-y-auto border border-gray-300 rounded-lg p-4 bg-white" style={{ minHeight: '500px', maxHeight: '700px', width: 'fit-content' }}>
                        <table className="border-separate text-center text-xs" style={{ borderSpacing: '0' }}>
                          <tbody>
                            {/* Top Ability Row */}
                            <tr>
                              <td colSpan={8} style={{ padding: 0, border: 'none' }}>
                                <div
                                  className="talent-box"
                                  style={{
                                    width: '100%',
                                    maxWidth: '1080px',
                                    height: '190px',
                                    textAlign: 'left',
                                    padding: '8px',
                                    position: 'relative',
                                    boxSizing: 'border-box',
                                    backgroundColor: '#ffedd5', // orange-100
                                    border: '2px solid #fb923c', // orange-400
                                    marginBottom: '12px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'flex-start',
                                  }}
                                >
                                  <div className="border-b border-orange-400 pb-1 font-bold text-orange-700">
                                    <input
                                      type="text"
                                      value={forceTreeTopAbility}
                                      onChange={(e) => setForceTreeTopAbility(e.target.value)}
                                      placeholder="Top Ability Name..."
                                      className="w-full text-xs font-semibold border border-orange-300 rounded px-1 py-1 focus:outline-none focus:border-orange-500 bg-orange-50"
                                    />
                                  </div>
                                  <div className="text-xs text-orange-800 mt-1" style={{ minHeight: '80px', maxHeight: '110px', overflowY: 'auto' }}>
                                    <textarea
                                      value={forceTreeTopDescription}
                                      onChange={(e) => setForceTreeTopDescription(e.target.value)}
                                      placeholder="Description..."
                                      className="w-full text-xs border border-orange-300 rounded px-2 py-1 focus:outline-none focus:border-orange-500 resize-none bg-orange-50"
                                      rows={2}
                                    />
                                    <input
                                      type="text"
                                      value={forceTreeTopCost}
                                      onChange={(e) => setForceTreeTopCost(e.target.value)}
                                      placeholder="Cost..."
                                      className="w-full text-xs border border-orange-300 rounded px-2 py-1 mt-1 focus:outline-none focus:border-orange-500 bg-orange-50"
                                    />
                                  </div>
                                  <div className="absolute bottom-2 right-2 text-right text-xs font-semibold text-orange-700">
                                    {forceTreeTopCost ? `${forceTreeTopCost} EXP` : ''}
                                  </div>
                                </div>
                              </td>
                            </tr>
                            {/* Ability Tree Rows */}
                            {Array.from({ length: 8 }, (_, rowIndex) => {
                              const isTalentRow = rowIndex % 2 === 0 && rowIndex < 8;
                              const adjustedRowIndex = Math.floor(rowIndex / 2);

                              return (
                                <tr key={rowIndex} className="bg-gray-50" style={{ height: isTalentRow ? 'auto' : '16px' }}>
                                  {Array.from({ length: 8 }, (_, colIndex) => {
                                    const talentIndex = Math.floor(colIndex / 2);
                                    const isTalentBox = colIndex % 2 === 0 && colIndex < 8 && isTalentRow;
                                    const isHorizontalSpace = colIndex % 2 === 1 && colIndex < 7 && isTalentRow;
                                    const isVerticalSpace = colIndex % 2 === 0 && !isTalentRow && rowIndex > 0 && rowIndex < 7;
                                    const boxIndex = adjustedRowIndex * 4 + talentIndex;

                                    return (
                                      <td key={colIndex} className={isTalentBox ? 'p-2 align-top' : 'p-2'} style={{
                                        position: 'relative',
                                        border: isTalentBox ? '2px solid black' : 'none',
                                        width: isTalentBox ? '260px' : '24px',
                                        height: isTalentBox ? '190px' : '24px',
                                        textAlign: 'center',
                                        verticalAlign: 'middle'
                                      }}>
                                        {isTalentBox && (
                                          <div
                                            className="talent-box"
                                            style={{
                                              width: '260px',
                                              height: '190px',
                                              textAlign: 'left',
                                              padding: '8px',
                                              position: 'relative',
                                              boxSizing: 'border-box',
                                              backgroundColor: '#e0f7fa',
                                              border: '1px solid #999'
                                            }}
                                          >
                                            <div className="border-b border-gray-400 pb-1">
                                              {forceTreeCustomInputMode[boxIndex] ? (
                                                <input
                                                  type="text"
                                                  value={forceTreeAbilities[boxIndex] || ''}
                                                  onChange={(e) => handleForceCustomAbilityInput(boxIndex, e.target.value)}
                                                  onBlur={() => handleForceCustomAbilityBlur(boxIndex)}
                                                  placeholder="Enter ability name..."
                                                  className="w-full text-xs font-semibold border border-gray-300 rounded px-1 py-1 focus:outline-none focus:border-blue-500"
                                                  autoFocus
                                                />
                                              ) : (
                                                <select
                                                  value={forceTreeAbilities[boxIndex] || ''}
                                                  onChange={(e) => handleForceAbilityChange(boxIndex, e.target.value)}
                                                  className="w-full text-xs font-semibold border border-gray-300 rounded px-1 py-1 focus:outline-none focus:border-blue-500"
                                                >
                                                  <option value="">-- Select Ability --</option>
                                                  <option value="__ADD_NEW__">+ Add New Ability</option>
                                                  {availableForceAbilities.map((ability, idx) => (
                                                    <option key={idx} value={ability}>
                                                      {ability}
                                                    </option>
                                                  ))}
                                                </select>
                                              )}
                                            </div>
                                            <div className="text-xs text-gray-700 mt-1" style={{ minHeight: '80px', maxHeight: '110px', overflowY: 'auto' }}>
                                              <textarea
                                                value={forceTreeDescriptions[boxIndex] || ''}
                                                onChange={(e) => setForceTreeDescriptions(prev => ({ ...prev, [boxIndex]: e.target.value }))}
                                                placeholder="Description..."
                                                className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500 resize-none"
                                                rows={2}
                                              />
                                              <input
                                                type="text"
                                                value={forceTreeCosts[boxIndex] || ''}
                                                onChange={(e) => setForceTreeCosts(prev => ({ ...prev, [boxIndex]: e.target.value }))}
                                                placeholder="Cost..."
                                                className="w-full text-xs border border-gray-300 rounded px-2 py-1 mt-1 focus:outline-none focus:border-blue-500"
                                              />
                                            </div>
                                          </div>
                                        )}
                                        {isHorizontalSpace && (
                                          <input
                                            type="checkbox"
                                            className="cursor-pointer"
                                            style={{ width: '16px', height: '16px' }}
                                            title="Link boxes horizontally"
                                          />
                                        )}
                                        {isVerticalSpace && (
                                          <input
                                            type="checkbox"
                                            className="cursor-pointer"
                                            style={{ width: '16px', height: '16px' }}
                                            title="Link boxes vertically"
                                          />
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="flex gap-3 flex-wrap">
                      <button
                        onClick={() => {
                          // TODO: Implement save force tree
                          alert('Save Force Tree functionality coming soon');
                        }}
                        disabled={savingForceTree}
                        className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition shadow-lg"
                      >
                        {savingForceTree ? 'Saving...' : 'Save Force Tree'}
                      </button>
                      <button
                        onClick={() => {
                          setForceTreeName('');
                          setForceTreeDescription('');
                          setForceTreeTopAbility('');
                          setForceTreeTopCost('');
                          setForceTreeTopDescription('');
                          setForceTreeTopActivation('Passive');
                          setForceTreeAbilities({});
                          setForceTreeCosts({});
                          setForceTreeDescriptions({});
                          setForceTreeActivations({});
                          setForceTreeLinks({});
                          setForceTreeMerged({});
                          setShowAddForceTreeForm(false);
                        }}
                        className="px-6 py-3 bg-gray-400 text-white font-bold rounded-lg hover:bg-gray-500 transition shadow-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Ability Tree Form removed */}
            </>
          )}
        </div>
      )}
    </div>
  );
}