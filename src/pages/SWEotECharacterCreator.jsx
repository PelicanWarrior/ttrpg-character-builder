import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function SWEotECharacterCreator() {
  const [characterName, setCharacterName] = useState('');
  const [characterId, setCharacterId] = useState(null);
  const [races, setRaces] = useState([]);
  const [selectedRace, setSelectedRace] = useState(null);
  const [tempSelectedRace, setTempSelectedRace] = useState(null);
  const [tempSelectedRaceIndex, setTempSelectedRaceIndex] = useState(null);
  const [baseStats, setBaseStats] = useState({});
  const [skills, setSkills] = useState([]);
  const [statCosts, setStatCosts] = useState([]);
  const [exp, setExp] = useState(0);
  const [activeTab, setActiveTab] = useState('Species');

  // Starting Skills — Two dropdowns for "X and Y" species
  const [startingSkillOptions1, setStartingSkillOptions1] = useState([]); // First dropdown
  const [startingSkillOptions2, setStartingSkillOptions2] = useState([]); // Second dropdown (only for "and")
  const [selectedStartingSkill1, setSelectedStartingSkill1] = useState('');
  const [selectedStartingSkill2, setSelectedStartingSkill2] = useState('');
  const [isPairedSkillRace, setIsPairedSkillRace] = useState(false);
  const [showSecondMandalorianSkill, setShowSecondMandalorianSkill] = useState(false);

  const [skillRanks, setSkillRanks] = useState({});
  const [careers, setCareers] = useState([]);
  const [selectedCareer, setSelectedCareer] = useState('');
  const [selectedCareerSkills, setSelectedCareerSkills] = useState(['', '', '', '']);
  const [tempSelectedCareer, setTempSelectedCareer] = useState(null);
  const [tempSelectedCareerIndex, setTempSelectedCareerIndex] = useState(null);
  const [specializations, setSpecializations] = useState([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [selectedSpecSkill1, setSelectedSpecSkill1] = useState('');
  const [selectedSpecSkill2, setSelectedSpecSkill2] = useState('');
  const [selectedSpecSkill3, setSelectedSpecSkill3] = useState('');
  const [tempSelectedSpec, setTempSelectedSpec] = useState(null);
  const [tempSelectedSpecIndex, setTempSelectedSpecIndex] = useState(null);
  const [talentTree, setTalentTree] = useState([]);
  const [abilities, setAbilities] = useState([]);
  const [clickableTalents, setClickableTalents] = useState([]);
  const [selectedTalents, setSelectedTalents] = useState([]);
  const [talentChoices, setTalentChoices] = useState({});
  const [dedicationChoices, setDedicationChoices] = useState({});
  const [backstory, setBackstory] = useState('');
  const [woundThreshold, setWoundThreshold] = useState(0);
  const [strainThreshold, setStrainThreshold] = useState(0);
  const [startingTalents, setStartingTalents] = useState([]);
  const [modalStartingTalents, setModalStartingTalents] = useState([]);
  const [modalStartingSkillOptions1, setModalStartingSkillOptions1] = useState([]);
  const [modalStartingSkillOptions2, setModalStartingSkillOptions2] = useState([]);
  const [racePictures, setRacePictures] = useState([]);
  const [selectedPictureId, setSelectedPictureId] = useState(null);
  const [isForceSensitiveCareer, setIsForceSensitiveCareer] = useState(false);
  const [isDroidSpecies, setIsDroidSpecies] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [careerPictures, setCareerPictures] = useState([]);
  const [selectedCareerPictureId, setSelectedCareerPictureId] = useState(null);
  const [specPictures, setSpecPictures] = useState([]);
  const [selectedSpecPictureId, setSelectedSpecPictureId] = useState(null);
  const [talentTreeTab, setTalentTreeTab] = useState('Career Tree');
  const [forcePowerTrees, setForcePowerTrees] = useState([]);
  const [selectedForceTreeTab, setSelectedForceTreeTab] = useState(null);
  const [forceTalents, setForceTalents] = useState([]);
  const [publishForceTrees, setPublishForceTrees] = useState(false);
  const [availableCharacterPictures, setAvailableCharacterPictures] = useState([]);
  const [selectedCharacterPictureId, setSelectedCharacterPictureId] = useState(null);
  const [showCharacterPictureSelector, setShowCharacterPictureSelector] = useState(false);

  const handlePublishForceTreesChange = async (e) => {
    const newValue = e.target.checked;
    setPublishForceTrees(newValue);
    
    // Update the Admin Control table
    const { error } = await supabase
      .from('Admin_Control')
      .update({ Force_trees: newValue })
      .eq('id', 1); // Assuming there's a single row with id=1
    
    if (error) {
      console.error('Error updating admin control:', error);
    }
  };

  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const createCharacter = queryParams.get('create_character') === 'true';

  const CHARACTERISTICS = ['Brawn', 'Agility', 'Intellect', 'Cunning', 'Willpower', 'Presence'];

  // Parse "X and Y" or single skill
  const parseStartingSkills = (text) => {
    if (!text || typeof text !== 'string') return { isPaired: false, firstSkills: [], secondSkills: [] };
    const trimmed = text.trim();
    const andMatch = trimmed.match(/^(.+?)\s+and\s+(.+)$/i);
    if (andMatch) {
      // First skill before "and"
      const firstSkill = andMatch[1].trim();
      // Second part after "and" - may contain comma-separated skills
      const secondPart = andMatch[2].trim();
      const secondSkills = secondPart.split(',').map(s => s.trim()).filter(Boolean);
      return {
        isPaired: true,
        firstSkills: [firstSkill],
        secondSkills: secondSkills
      };
    }
    // No "and" - treat as single choice from comma-separated list
    return {
      isPaired: false,
      firstSkills: trimmed.split(',').map(s => s.trim()).filter(Boolean),
      secondSkills: []
    };
  };

  useEffect(() => {
    const fetchAndLoadData = async () => {
      const username = localStorage.getItem('username');
      
      // Fetch admin status
      if (username) {
        const { data: userData } = await supabase
          .from('user')
          .select('admin')
          .eq('username', username)
          .single();
        
        if (userData) {
          setIsAdmin(!!userData.admin);
        }
      }

      const [
        raceResponse,
        skillResponse,
        statCostResponse,
        careerResponse,
        specResponse,
        abilityResponse,
        treeResponse,
        pictureResponse,
        forceTreeResponse,
        forceTalentResponse
      ] = await Promise.all([
        supabase.from('races').select('*'),
        supabase.from('skills').select('*'),
        supabase.from('SW_stat_increase').select('*'),
        supabase.from('SW_career').select('*'),
        supabase.from('SW_spec').select('*'),
        supabase.from('SW_abilities').select('*'),
        supabase.from('SW_spec_tree').select('*'),
        supabase.from('SW_pictures').select('*'),
        supabase.from('SW_force_power_tree').select('*'),
        supabase.from('SW_force_talents').select('*'),
      ]);

      if (raceResponse.error) console.error('Error fetching races:', raceResponse.error);
      else {
        const sortedRaces = (raceResponse.data || []).sort((a, b) => a.name.localeCompare(b.name));
        setRaces(sortedRaces);
      }

      if (skillResponse.error) console.error('Error fetching skills:', skillResponse.error);
      else {
        const sortedSkills = (skillResponse.data || []).sort((a, b) => a.skill.localeCompare(b.skill));
        setSkills(sortedSkills);
        const initialRanks = {};
        sortedSkills.forEach((skill) => {
          initialRanks[skill.skill] = 0;
        });
        setSkillRanks(initialRanks);
      }

      if (statCostResponse.error) console.error('Error fetching stat costs:', statCostResponse.error);
      else setStatCosts(statCostResponse.data || []);

      if (careerResponse.error) console.error('Error fetching careers:', careerResponse.error);
      else setCareers(careerResponse.data || []);

      if (specResponse.error) console.error('Error fetching specializations:', specResponse.error);
      else setSpecializations(specResponse.data || []);

      if (abilityResponse.error) console.error('Error fetching abilities:', abilityResponse.error);
      else setAbilities(abilityResponse.data || []);

      if (treeResponse.error) console.error('Error fetching talent tree:', treeResponse.error);
      else setTalentTree(treeResponse.data || []);

      if (pictureResponse.error) console.error('Error fetching pictures:', pictureResponse.error);
      else {
        console.log('Pictures fetched:', pictureResponse.data);
        setRacePictures(pictureResponse.data || []);
      }

      if (forceTreeResponse.error) console.error('Error fetching force power trees:', forceTreeResponse.error);
      else {
        const forceTrees = forceTreeResponse.data || [];
        setForcePowerTrees(forceTrees);
        if (forceTrees.length > 0 && !selectedForceTreeTab) {
          setSelectedForceTreeTab(forceTrees[0].PowerTreeName);
        }
      }

      if (forceTalentResponse.error) console.error('Error fetching force talents:', forceTalentResponse.error);
      else setForceTalents(forceTalentResponse.data || []);

      // Fetch Admin Control settings for force trees
      const { data: adminControl, error: adminControlError } = await supabase
        .from('Admin_Control')
        .select('Force_trees')
        .single();
      if (adminControlError) {
        console.error('Error fetching admin control:', adminControlError);
      } else {
        setPublishForceTrees(adminControl?.Force_trees || false);
      }

      // Separate race and career pictures
      const allPictures = pictureResponse.data || [];
      const careerPicsOnly = allPictures.filter(pic => pic.career_ID);
      const specPicsOnly = allPictures.filter(pic => pic.spec_ID);
      setCareerPictures(careerPicsOnly);
      setSpecPictures(specPicsOnly);

      if (createCharacter) {
        // Clear any previous character data when creating new character
        localStorage.removeItem('loadedCharacterId');
        setClickableTalents([0, 1, 2, 3]);
      } else if (!createCharacter) {
        const loadedCharacterId = localStorage.getItem('loadedCharacterId');
        if (loadedCharacterId) {
          const username = localStorage.getItem('username');
          if (username) {
            const { data: playerData, error: playerError } = await supabase
              .from('SW_player_characters')
              .select('*')
              .eq('user_number', (await supabase.from('user').select('id').eq('username', username).single()).data.id)
              .eq('id', loadedCharacterId)
              .single();

            if (playerError) console.error('Error fetching player data:', playerError);
            else if (playerData) {
              setCharacterId(playerData.id);
              setCharacterName(playerData.name || '');
              const raceMatch = raceResponse.data?.find(r => r.name === playerData.race);
              setSelectedRace({
                ...raceMatch,
                brawn: playerData.brawn,
                agility: playerData.agility,
                intellect: playerData.intellect,
                cunning: playerData.cunning,
                willpower: playerData.willpower,
                presence: playerData.presence,
                EXP: playerData.exp,
              });
              if (raceMatch) {
                setBaseStats({
                  brawn: raceMatch.brawn,
                  agility: raceMatch.agility,
                  intellect: raceMatch.intellect,
                  cunning: raceMatch.cunning,
                  willpower: raceMatch.willpower,
                  presence: raceMatch.presence,
                });
              }
              setExp(playerData.exp || 0);
              setBackstory(playerData.backstory || '');
              setWoundThreshold(playerData.wound_threshold || 0);
              setStrainThreshold(playerData.strain_threshold || 0);
              // On load: if a saved picture exists, use it; else default to 0
              if (typeof playerData.picture === 'number') {
                setSelectedCharacterPictureId(playerData.picture);
              } else {
                setSelectedCharacterPictureId(0);
              }

              if (playerData.starting_skill) {
                const skillsArray = playerData.starting_skill.split(',').map(s => s.trim()).filter(s => s);
                if (skillsArray.length > 0) setSelectedStartingSkill1(skillsArray[0]);
                if (skillsArray.length > 1) setSelectedStartingSkill2(skillsArray[1]);
              }

              // Check for Mandalorian second skill visibility after loading starting skills
              if (playerData.race === 'Human (Mandolorian)' && playerData.starting_skill) {
                const skillsArray = playerData.starting_skill.split(',').map(s => s.trim()).filter(s => s);
                if (skillsArray.length > 0) {
                  const skillType = skillResponse.data?.find(s => s.skill === skillsArray[0])?.type;
                  if (skillType === 'Knowledge') {
                    setShowSecondMandalorianSkill(true);
                  }
                }
              }

              if (playerData.career) {
                setSelectedCareer(playerData.career);
                const careerRecord = careerResponse.data?.find(c => c.name === playerData.career);
                setIsForceSensitiveCareer(!!careerRecord?.Force_Sensitive);
              }
              if (playerData.career_skills) {
                const loadedCareerSkills = playerData.career_skills.split(',').map(skill => skill.trim()).filter(skill => skill);
                setSelectedCareerSkills(loadedCareerSkills.concat(Array(4 - loadedCareerSkills.length).fill('')).slice(0, 4));
              }

              if (playerData.spec) setSelectedSpecialization(playerData.spec);

              if (playerData.spec_skills) {
                const specSkills = playerData.spec_skills.split(',').map(skill => skill.trim()).filter(skill => skill);
                if (specSkills.length > 0) setSelectedSpecSkill1(specSkills[0] || '');
                if (specSkills.length > 1) setSelectedSpecSkill2(specSkills[1] || '');
              }

              const skillsRankData = playerData.skills_rank || '';
              if (skillsRankData) {
                const skillList = skillsRankData.split(',').map(skill => skill.trim());
                const rankMap = {};
                skillList.forEach(skill => {
                  rankMap[skill] = (rankMap[skill] || 0) + 1;
                });
                setSkillRanks(prevRanks => ({
                  ...prevRanks,
                  ...rankMap,
                }));
              }

              const choices = {};
              if (playerData.talent_tree && playerData.talent_tree.trim()) {
                const talentList = playerData.talent_tree.split(',').map(t => t.trim()).filter(t => t);
                talentList.forEach(t => {
                  const match = t.match(/ability_\d+_\d+\(([^)]+)\)/);
                  if (match) {
                    const [_, row, col] = t.match(/ability_(\d+)_(\d+)/) || [];
                    if (row && col) {
                      const index = (parseInt(row) / 5 - 1) * 4 + (parseInt(col) - 1);
                      choices[index] = match[1];
                    }
                  }
                });
              }
              setTalentChoices(choices);

              const clickable = new Set([0, 1, 2, 3]);

              if (playerData.talent_tree && playerData.talent_tree.trim()) {
                const talentList = playerData.talent_tree.split(',').map(t => t.trim()).filter(t => t);
                const talentIndices = talentList.map(t => {
                  const [_, row, col] = t.match(/ability_(\d+)_(\d+)/) || [];
                  return row && col ? (parseInt(row) / 5 - 1) * 4 + (parseInt(col) - 1) : -1;
                }).filter(i => i >= 0);
                setSelectedTalents(talentIndices);

                const specTree = treeResponse.data.find(t => 
                  t.spec_ID === specResponse.data.find(s => s.spec_name === playerData.spec)?.id
                );

                if (specTree) {
                  talentIndices.forEach(index => {
                    clickable.add(index);
                    const row = Math.floor(index / 4);
                    const col = index % 4;
                    const field = `ability_${(row + 1) * 5}_${col + 1}_links`;
                    const links = specTree[field] ? specTree[field].split(',').map(l => l.trim()) : [];

                    links.forEach(link => {
                      if (link === 'Down' && row < 4) clickable.add((row + 1) * 4 + col);
                      if (link === 'Up' && row > 0) clickable.add((row - 1) * 4 + col);
                      if (link === 'Left' && col > 0) clickable.add(row * 4 + (col - 1));
                      if (link === 'Right' && col < 3) clickable.add(row * 4 + (col + 1));
                    });
                  });
                }
              }

              setClickableTalents(Array.from(clickable));

              if (playerData.talent_tree && playerData.talent_tree.trim()) {
                const talentList = playerData.talent_tree.split(',').map(t => t.trim()).filter(t => t);
                talentList.forEach(t => {
                  const [_, row, col] = t.match(/ability_(\d+)_(\d+)/) || [];
                  if (row && col) {
                    const index = (parseInt(row) / 5 - 1) * 4 + (parseInt(col) - 1);
                    const talentData = getTalentTreeData()[index];
                    if (talentData && talentData.abilityId) {
                      const ability = abilities.find(a => a.id === talentData.abilityId);
                      if (ability && ability.increase_stat) {
                        const increases = ability.increase_stat.split(',').map(s => s.trim());
                        const woundCount = increases.filter(s => s === 'Wound').length;
                        const strainCount = increases.filter(s => s === 'Strain').length;
                        setWoundThreshold(prev => prev + woundCount);
                        setStrainThreshold(prev => prev + strainCount);
                      }
                    }
                  }
                });
              }
            }
          }
          localStorage.removeItem('loadedCharacterId');
        }
      }
    };
    fetchAndLoadData();
  }, [createCharacter]);

  // Update starting skill dropdowns when race changes
  useEffect(() => {
    if (!selectedRace || !skills.length) {
      setStartingSkillOptions1([]);
      setStartingSkillOptions2([]);
      setIsPairedSkillRace(false);
      setSelectedStartingSkill1('');
      setSelectedStartingSkill2('');
      return;
    }

    // Reset previous ranks
    if (selectedStartingSkill1) {
      setSkillRanks(prev => ({ ...prev, [selectedStartingSkill1]: Math.max(0, prev[selectedStartingSkill1] - 1) }));
    }
    if (selectedStartingSkill2) {
      setSkillRanks(prev => ({ ...prev, [selectedStartingSkill2]: Math.max(0, prev[selectedStartingSkill2] - 1) }));
    }

    let firstOptions = [];
    let secondOptions = [];

    if (selectedRace.name === 'Human') {
      firstOptions = skills;
      secondOptions = skills;
    } else if (selectedRace.name === 'Human (Mandolorian)') {
      const combatKnowledge = skills.filter(s => s.type === 'Combat' || s.type === 'Knowledge');
      const knowledge = skills.filter(s => s.type === 'Knowledge');
      firstOptions = combatKnowledge;
      secondOptions = knowledge;
    } else if (selectedRace.Starting_Skill && selectedRace.Starting_Skill.trim()) {
      const { isPaired, firstSkills, secondSkills } = parseStartingSkills(selectedRace.Starting_Skill);

      if (isPaired) {
        setIsPairedSkillRace(true);
        firstOptions = skills.filter(s => firstSkills.includes(s.skill));
        secondOptions = skills.filter(s => secondSkills.includes(s.skill));
      } else {
        setIsPairedSkillRace(false);
        firstOptions = skills.filter(s => firstSkills.includes(s.skill));
        secondOptions = [];
      }

      // Auto-select single skill
      if (firstOptions.length === 1) {
        setSelectedStartingSkill1(firstOptions[0].skill);
        setSkillRanks(prev => ({ ...prev, [firstOptions[0].skill]: (prev[firstOptions[0].skill] || 0) + 1 }));
      }
      if (secondOptions.length === 1) {
        setSelectedStartingSkill2(secondOptions[0].skill);
        setSkillRanks(prev => ({ ...prev, [secondOptions[0].skill]: (prev[secondOptions[0].skill] || 0) + 1 }));
      }
    }

    setStartingSkillOptions1(firstOptions.sort((a, b) => a.skill.localeCompare(b.skill)));
    setStartingSkillOptions2(secondOptions.sort((a, b) => a.skill.localeCompare(b.skill)));
  }, [selectedRace, skills]);

  useEffect(() => {
    if (selectedRace && racePictures.length > 0) {
      // Get race-only pictures (no career_ID or spec_ID) for character portrait
      let raceOnlyPictures = racePictures.filter(pic => 
        pic.race_ID === selectedRace.id && !pic.career_ID && !pic.spec_ID
      );

      // If no race-only pictures found, get any pictures with the race (for fallback)
      if (raceOnlyPictures.length === 0) {
        raceOnlyPictures = racePictures.filter(pic => pic.race_ID === selectedRace.id);
      }

      // Update available options for selector without adding/removing id 0
      setAvailableCharacterPictures(raceOnlyPictures);

      // For species display: randomly select a face of that race (exclude id 0)
      const speciesPickerPool = raceOnlyPictures.filter(p => p.id !== 0);
      const fallbackPool = racePictures.filter(p => p.race_ID === selectedRace.id && p.id !== 0);
      const pool = speciesPickerPool.length > 0 ? speciesPickerPool : fallbackPool;
      if (pool.length > 0) {
        const randomPic = pool[Math.floor(Math.random() * pool.length)];
        setSelectedPictureId(randomPic.id);
      } else {
        setSelectedPictureId(null);
      }
    } else {
      setAvailableCharacterPictures([]);
    }
  }, [selectedRace, racePictures, selectedSpecialization, specializations, selectedCharacterPictureId]);

  useEffect(() => {
    if (selectedRace && selectedRace.Starting_Talents) {
      const talentNames = selectedRace.Starting_Talents.split(',').map(t => t.trim()).filter(t => t);
      const talentsWithDesc = talentNames.map(name => {
        const ability = abilities.find(a => a.ability === name);
        return {
          name,
          description: ability ? ability.description : 'No description found'
        };
      });
      setStartingTalents(talentsWithDesc);
    } else {
      setStartingTalents([]);
    }
  }, [selectedRace, abilities]);

  useEffect(() => {
    if (selectedRace) {
      let baseWound = (selectedRace.wound || 0) + (getBaseStatValue('brawn') || 0);
      let baseStrain = (selectedRace.Strain || 0) + (getBaseStatValue('willpower') || 0);

      selectedTalents.forEach(index => {
        const talentData = getTalentTreeData()[index];
        if (talentData && talentData.abilityId) {
          const ability = abilities.find(a => a.id === talentData.abilityId);
          if (ability && ability.increase_stat) {
            const increases = ability.increase_stat.split(',').map(s => s.trim());
            const woundCount = increases.filter(s => s === 'Wound').length;
            const strainCount = increases.filter(s => s === 'Strain').length;
            baseWound += woundCount;
            baseStrain += strainCount;
          }
        }
      });

      setWoundThreshold(baseWound);
      setStrainThreshold(baseStrain);
    }
  }, [selectedRace, selectedTalents, abilities, baseStats]);

  // Populate modal data when tempSelectedRace changes
  useEffect(() => {
    if (tempSelectedRace && abilities.length > 0 && skills.length > 0) {
      // Get starting talents for modal
      if (tempSelectedRace.Starting_Talents) {
        const talentNames = tempSelectedRace.Starting_Talents.split(',').map(t => t.trim()).filter(t => t);
        const talentsWithDesc = talentNames.map(name => {
          const ability = abilities.find(a => a.ability === name);
          return {
            name,
            description: ability ? ability.description : 'No description found'
          };
        });
        setModalStartingTalents(talentsWithDesc);
      } else {
        setModalStartingTalents([]);
      }

      // Parse starting skills for modal using the same logic as selectedRace
      const { isPaired, firstSkills, secondSkills } = parseStartingSkills(tempSelectedRace.Starting_Skill);
      
      let modalOptions1 = [];
      let modalOptions2 = [];
      
      if (isPaired) {
        modalOptions1 = skills.filter(s => firstSkills.includes(s.skill));
        modalOptions2 = skills.filter(s => secondSkills.includes(s.skill));
      } else {
        modalOptions1 = skills.filter(s => firstSkills.includes(s.skill));
        modalOptions2 = [];
      }

      setModalStartingSkillOptions1(modalOptions1.sort((a, b) => a.skill.localeCompare(b.skill)));
      setModalStartingSkillOptions2(modalOptions2.sort((a, b) => a.skill.localeCompare(b.skill)));
    } else {
      setModalStartingTalents([]);
      setModalStartingSkillOptions1([]);
      setModalStartingSkillOptions2([]);
    }
  }, [tempSelectedRace, abilities, skills]);

  const handleRaceChange = (e) => {
    const race = races.find((r) => r.name === e.target.value);
    const wasNonDroid = !isDroidSpecies;
    const isNowDroid = race?.name === 'Droid';

    if (selectedStartingSkill1) {
      setSkillRanks(prev => ({ ...prev, [selectedStartingSkill1]: Math.max(0, prev[selectedStartingSkill1] - 1) }));
    }
    if (selectedStartingSkill2) {
      setSkillRanks(prev => ({ ...prev, [selectedStartingSkill2]: Math.max(0, prev[selectedStartingSkill2] - 1) }));
    }

    setSelectedRace(race || null);
    setIsDroidSpecies(isNowDroid);
    setSelectedStartingSkill1('');
    setSelectedStartingSkill2('');
    setIsPairedSkillRace(false);
    setShowSecondMandalorianSkill(false);
    setStartingSkillOptions1([]);
    setStartingSkillOptions2([]);

    if (race) {
      setBaseStats({
        brawn: race.brawn,
        agility: race.agility,
        intellect: race.intellect,
        cunning: race.cunning,
        willpower: race.willpower,
        presence: race.presence,
      });
      setExp(race.EXP || 0);
      setWoundThreshold((race.wound || 0) + (race.brawn || 0));
      setStrainThreshold((race.Strain || 0) + (race.willpower || 0));
    }
    setSelectedTalents([]);
    setClickableTalents([0, 1, 2, 3]);
    setStartingTalents([]);

    // If switching away from Droid, remove extra skills
    if (wasNonDroid === false && isNowDroid === false) {
      // Switching from Droid to non-Droid: remove last 2 career skills
      const newCareerSkills = selectedCareerSkills.slice(0, 4);
      const skillsToRemove = selectedCareerSkills.slice(4);
      skillsToRemove.forEach(skill => {
        if (skill && skillRanks[skill] > 0) {
          setSkillRanks(prev => ({ ...prev, [skill]: prev[skill] - 1 }));
        }
      });
      setSelectedCareerSkills(newCareerSkills);

      // Remove last specialization skill(s)
      if (selectedSpecSkill2 && skillRanks[selectedSpecSkill2] > 0) {
        setSkillRanks(prev => ({ ...prev, [selectedSpecSkill2]: prev[selectedSpecSkill2] - 1 }));
      }
      if (selectedSpecSkill3 && skillRanks[selectedSpecSkill3] > 0) {
        setSkillRanks(prev => ({ ...prev, [selectedSpecSkill3]: prev[selectedSpecSkill3] - 1 }));
      }
      setSelectedSpecSkill2('');
      setSelectedSpecSkill3('');
    }
  };

  const handleStartingSkill1Change = (e) => {
    const newSkill = e.target.value;
    if (selectedStartingSkill1) {
      setSkillRanks(prev => ({ ...prev, [selectedStartingSkill1]: Math.max(0, prev[selectedStartingSkill1] - 1) }));
    }
    setSelectedStartingSkill1(newSkill);
    if (newSkill) {
      setSkillRanks(prev => ({ ...prev, [newSkill]: (prev[newSkill] || 0) + 1 }));
    }

    if (selectedRace?.name === 'Human (Mandolorian)') {
      const skillType = skills.find(s => s.skill === newSkill)?.type;
      if (skillType === 'Knowledge') {
        setShowSecondMandalorianSkill(true);
      } else {
        setShowSecondMandalorianSkill(false);
        if (selectedStartingSkill2) {
          setSkillRanks(prev => ({ ...prev, [selectedStartingSkill2]: Math.max(0, prev[selectedStartingSkill2] - 1) }));
          setSelectedStartingSkill2('');
        }
      }
    }
  };

  const handleStartingSkill2Change = (e) => {
    const newSkill = e.target.value;
    if (selectedStartingSkill2) {
      setSkillRanks(prev => ({ ...prev, [selectedStartingSkill2]: Math.max(0, prev[selectedStartingSkill2] - 1) }));
    }
    setSelectedStartingSkill2(newSkill);
    if (newSkill) {
      setSkillRanks(prev => ({ ...prev, [newSkill]: (prev[newSkill] || 0) + 1 }));
    }
  };

  const updateStat = (statName, delta) => {
    setSelectedRace(prevRace => {
      if (!prevRace) return prevRace;
      const baseValue = baseStats[statName.toLowerCase()] || 0;
      const currentValue = prevRace[statName.toLowerCase()] || baseValue;
      if (delta > 0) {
        const newRank = currentValue + delta;
        const cost = statCosts.find(c => c.rank === newRank)?.exp || 0;
        if (exp >= cost) {
          setExp(exp - cost);
          const updatedRace = { ...prevRace, [statName.toLowerCase()]: newRank };
          if (statName === 'brawn') setWoundThreshold(woundThreshold + delta);
          else if (statName === 'willpower') setStrainThreshold(strainThreshold + delta);
          return updatedRace;
        } else {
          alert('Not enough EXP');
          return prevRace;
        }
      } else if (delta < 0) {
        if (currentValue > baseValue) {
          const currentRank = currentValue;
          const cost = statCosts.find(c => c.rank === currentRank)?.exp || 0;
          setExp(exp + cost);
          const updatedRace = { ...prevRace, [statName.toLowerCase()]: currentValue + delta };
          if (statName === 'brawn') setWoundThreshold(woundThreshold + delta);
          else if (statName === 'willpower') setStrainThreshold(strainThreshold + delta);
          return updatedRace;
        } else {
          alert('Cannot decrease below base value');
          return prevRace;
        }
      }
      return prevRace;
    });
  };

  const updateSkillRank = (skillName, delta) => {
    setSkillRanks(prevRanks => {
      const currentRank = prevRanks[skillName] || 0;
      if (delta > 0) {
        const newRank = currentRank + delta;
        const cost = statCosts.find(c => c.rank === newRank)?.exp || 0;
        if (exp >= cost) {
          setExp(exp - cost);
          return { ...prevRanks, [skillName]: newRank };
        } else {
          alert('Not enough EXP');
          return prevRanks;
        }
      } else if (delta < 0) {
        if ((skillName === selectedStartingSkill1 || skillName === selectedStartingSkill2) && currentRank === 1) {
          alert('You cannot decrease your starting skill');
          return prevRanks;
        }
        if (currentRank > 0) {
          const currentCost = statCosts.find(c => c.rank === currentRank)?.exp || 0;
          setExp(exp + currentCost);
          return { ...prevRanks, [skillName]: currentRank + delta };
        }
      }
      return prevRanks;
    });
  };

  const getBaseStatValue = (statName) => {
    const key = statName.toLowerCase();
    return selectedRace?.[key] || 0;
  };

  const handleCareerChange = async (e) => {
    const careerName = e.target.value;

    selectedCareerSkills.forEach(skill => {
      if (skill && skillRanks[skill] > 0) {
        setSkillRanks(prevRanks => ({
          ...prevRanks,
          [skill]: prevRanks[skill] - 1,
        }));
      }
    });

    if (selectedSpecSkill1 && skillRanks[selectedSpecSkill1] > 0) {
      setSkillRanks(prevRanks => ({
        ...prevRanks,
        [selectedSpecSkill1]: Math.max(0, prevRanks[selectedSpecSkill1] - 1),
      }));
    }
    if (selectedSpecSkill2 && skillRanks[selectedSpecSkill2] > 0) {
      setSkillRanks(prevRanks => ({
        ...prevRanks,
        [selectedSpecSkill2]: Math.max(0, prevRanks[selectedSpecSkill2] - 1),
      }));
    }
    if (selectedSpecSkill3 && skillRanks[selectedSpecSkill3] > 0) {
      setSkillRanks(prevRanks => ({
        ...prevRanks,
        [selectedSpecSkill3]: Math.max(0, prevRanks[selectedSpecSkill3] - 1),
      }));
    }

    setSelectedCareer(careerName);
    const initialCareerSkills = isDroidSpecies ? ['', '', '', '', '', ''] : ['', '', '', ''];
    setSelectedCareerSkills(initialCareerSkills);
    setSelectedSpecialization('');
    setSelectedSpecSkill1('');
    setSelectedSpecSkill2('');
    setSelectedSpecSkill3('');
    setSelectedTalents([]);
    setClickableTalents([0, 1, 2, 3]);

    if (careerName) {
      const { data: careerData } = await supabase
        .from('SW_career')
        .select('id, Force_Sensitive')
        .eq('name', careerName)
        .single();
      setIsForceSensitiveCareer(!!careerData?.Force_Sensitive);

      // Find career picture(s) and randomly pick one
      if (careerData && careerPictures.length > 0) {
        const matchingPictures = careerPictures.filter(pic => pic.career_ID === careerData.id);
        if (matchingPictures.length > 0) {
          const randomPic = matchingPictures[Math.floor(Math.random() * matchingPictures.length)];
          setSelectedCareerPictureId(randomPic.id);
        } else {
          setSelectedCareerPictureId(null);
        }
      } else {
        setSelectedCareerPictureId(null);
      }
    } else {
      setIsForceSensitiveCareer(false);
      setSelectedCareerPictureId(null);
    }
  };

  const handleSpecializationChange = (e) => {
    const specName = e.target.value;
    if (selectedSpecSkill1 && skillRanks[selectedSpecSkill1] > 0) {
      setSkillRanks(prevRanks => ({
        ...prevRanks,
        [selectedSpecSkill1]: Math.max(0, prevRanks[selectedSpecSkill1] - 1),
      }));
    }
    if (selectedSpecSkill2 && skillRanks[selectedSpecSkill2] > 0) {
      setSkillRanks(prevRanks => ({
        ...prevRanks,
        [selectedSpecSkill2]: Math.max(0, prevRanks[selectedSpecSkill2] - 1),
      }));
    }
    setSelectedSpecialization(specName);
    setSelectedSpecSkill1('');
    setSelectedSpecSkill2('');
    setSelectedSpecSkill3('');
    setSelectedTalents([]);
    setClickableTalents([0, 1, 2, 3]);

    // Find spec picture(s) that match both race and specialization
    if (specName && selectedRace) {
      const spec = specializations.find(s => s.spec_name === specName);
      if (spec && specPictures.length > 0) {
        // First try to find a picture that matches both race and spec
        let matchingPictures = specPictures.filter(pic => 
          pic.spec_ID === spec.id && pic.race_ID === selectedRace.id
        );
        
        // If no race+spec picture found, fall back to spec-only pictures
        if (matchingPictures.length === 0) {
          matchingPictures = specPictures.filter(pic => pic.spec_ID === spec.id);
        }
        
        if (matchingPictures.length > 0) {
          // Filter out pictures that match the career picture
          const availablePictures = matchingPictures.filter(pic => pic.id !== selectedCareerPictureId);
          const picturesToChooseFrom = availablePictures.length > 0 ? availablePictures : matchingPictures;
          const randomPic = picturesToChooseFrom[Math.floor(Math.random() * picturesToChooseFrom.length)];
          setSelectedSpecPictureId(randomPic.id);
        } else {
          setSelectedSpecPictureId(null);
        }
      } else {
        setSelectedSpecPictureId(null);
      }
    } else {
      setSelectedSpecPictureId(null);
    }
  };

  const handleSpecSkill1Change = (e) => {
    const newSkill = e.target.value.trim();
    const oldSkill = selectedSpecSkill1;
    if (oldSkill && skillRanks[oldSkill] !== undefined) {
      setSkillRanks(prevRanks => ({
        ...prevRanks,
        [oldSkill]: Math.max(0, prevRanks[oldSkill] - 1),
      }));
    }
    if (newSkill) {
      setSkillRanks(prevRanks => ({
        ...prevRanks,
        [newSkill]: (prevRanks[newSkill] || 0) + 1,
      }));
    }
    setSelectedSpecSkill1(newSkill);
  };

  const handleSpecSkill2Change = (e) => {
    const newSkill = e.target.value.trim();
    const oldSkill = selectedSpecSkill2;
    if (oldSkill && skillRanks[oldSkill] !== undefined) {
      setSkillRanks(prevRanks => ({
        ...prevRanks,
        [oldSkill]: Math.max(0, prevRanks[oldSkill] - 1),
      }));
    }
    if (newSkill) {
      setSkillRanks(prevRanks => ({
        ...prevRanks,
        [newSkill]: (prevRanks[newSkill] || 0) + 1,
      }));
    }
    setSelectedSpecSkill2(newSkill);
  };

  const handleSpecSkill3Change = (e) => {
    const newSkill = e.target.value.trim();
    const oldSkill = selectedSpecSkill3;
    if (oldSkill && skillRanks[oldSkill] !== undefined) {
      setSkillRanks(prevRanks => ({
        ...prevRanks,
        [oldSkill]: Math.max(0, prevRanks[oldSkill] - 1),
      }));
    }
    if (newSkill) {
      setSkillRanks(prevRanks => ({
        ...prevRanks,
        [newSkill]: (prevRanks[newSkill] || 0) + 1,
      }));
    }
    setSelectedSpecSkill3(newSkill);
  };

  const handleCareerSkillChange = (index) => (e) => {
    const newSkill = e.target.value;
    const oldSkill = selectedCareerSkills[index];
    const newSkills = [...selectedCareerSkills];
    newSkills[index] = newSkill;
    setSelectedCareerSkills(newSkills);
    
    // Add rank for new skill
    if (newSkill) {
      setSkillRanks(prevRanks => ({
        ...prevRanks,
        [newSkill]: (prevRanks[newSkill] || 0) + 1,
      }));
    }
    
    // Remove rank for old skill if it exists and changed
    if (oldSkill && oldSkill !== newSkill) {
      const currentRank = skillRanks[oldSkill] || 0;
      if (currentRank > 0) {
        setSkillRanks(prevRanks => ({
          ...prevRanks,
          [oldSkill]: currentRank - 1,
        }));
      }
    }
  };

  const getAvailableSkills = (index) => {
    const selectedSkills = selectedCareerSkills.filter((skill, i) => skill && i !== index);
    const allSkills = careers.find(c => c.name === selectedCareer)?.skills?.split(',').map(skill => skill.trim()) || [];
    return allSkills.filter(skill => !selectedSkills.includes(skill)).sort();
  };

  const getSkillRank = (skillName) => {
    return skillRanks[skillName] !== undefined ? skillRanks[skillName] : 0;
  };

  const getDicePool = (skillName, statName) => {
    const baseStat = getBaseStatValue(statName);
    const rank = getSkillRank(skillName);
    let dicePool = 'G'.repeat(baseStat);
    if (rank > 0) {
      const yCount = Math.min(rank, dicePool.length);
      dicePool = dicePool.split('');
      for (let i = 0; i < yCount; i++) {
        dicePool[i] = 'Y';
      }
      dicePool = dicePool.join('');
    }
    return dicePool;
  };

  const buildTalentStrings = () => {
    const talentTreeEntries = [];
    const talentNameEntries = [];

    selectedTalents.forEach(index => {
      const row = Math.floor(index / 4) + 1;
      const col = (index % 4) + 1;
      const baseId = `ability_${row * 5}_${col}`;
      const talentData = getTalentTreeData()[index];
      const talentName = talentData?.name || 'N/A';

      if (talentChoices[index]) {
        const choice = talentChoices[index];
        talentTreeEntries.push(`${baseId}(${choice})`);
        talentNameEntries.push(`${talentName}(${choice})`);
      } else {
        talentTreeEntries.push(baseId);
        talentNameEntries.push(talentName);
      }
    });

    return {
      talentTreeString: talentTreeEntries.join(', '),
      talentString: talentNameEntries.join(', ')
    };
  };

  const buildStartingTalentsString = () => {
    return startingTalents.map(t => t.name).join(', ');
  };

  const getForceRating = () => (isForceSensitiveCareer ? 1 : 0);

  const handleSave = async () => {
    const username = localStorage.getItem('username');
    if (!username) {
      console.error('No username found in localStorage');
      return null;
    }

    const { data: userData, error: userError } = await supabase
      .from('user')
      .select('id')
      .eq('username', username)
      .single();

    if (userError || !userData) {
      console.error('Error fetching user id:', userError);
      return;
    }

    const userId = userData.id;

    let skillsRankString = '';
    for (const skill in skillRanks) {
      const rank = skillRanks[skill];
      if (rank > 0) {
        for (let i = 0; i < rank; i++) {
          skillsRankString += skill + (i < rank - 1 || Object.keys(skillRanks).some(s => skillRanks[s] > 0 && s !== skill) ? ', ' : '');
        }
      }
    }
    skillsRankString = skillsRankString.replace(/, $/, '');

    const careerSkillsString = selectedCareerSkills.filter(skill => skill).join(', ');
    const specSkillsString = [selectedSpecSkill1, selectedSpecSkill2, selectedSpecSkill3].filter(skill => skill).join(', ');
    const startingTalentsString = buildStartingTalentsString();
    const finalSpecSkills = [specSkillsString, startingTalentsString].filter(s => s).join(', ');

    const { talentTreeString, talentString } = buildTalentStrings();
    const startingTalentsForTalentsField = startingTalentsString ? (talentString ? `${talentString}, ${startingTalentsString}` : startingTalentsString) : talentString;

    const startingSkillCombined = selectedStartingSkill2 
      ? `${selectedStartingSkill1}, ${selectedStartingSkill2}` 
      : selectedStartingSkill1;

    const commonFields = {
      name: characterName,
      race: selectedRace?.name || '',
      brawn: selectedRace?.brawn || 0,
      agility: selectedRace?.agility || 0,
      intellect: selectedRace?.intellect || 0,
      cunning: selectedRace?.cunning || 0,
      willpower: selectedRace?.willpower || 0,
      presence: selectedRace?.presence || 0,
      exp: exp,
      starting_skill: startingSkillCombined,
      career: selectedCareer,
      career_skills: careerSkillsString,
      spec: selectedSpecialization,
      spec_skills: finalSpecSkills,
      talent_tree: talentTreeString,
      talents: startingTalentsForTalentsField,
      skills_rank: skillsRankString,
      backstory: backstory,
      wound_threshold: woundThreshold,
      strain_threshold: strainThreshold,
      force_rating: getForceRating(),
      picture: selectedCharacterPictureId,
    };

    if (characterId) {
      const { error: updateError } = await supabase
        .from('SW_player_characters')
        .update(commonFields)
        .eq('user_number', userId)
        .eq('id', characterId);

      if (updateError) {
        console.error('Error updating character:', updateError);
        return null;
      }

      alert(`${characterName} is saved`);
      return characterId;
    } else {
      const { data, error } = await supabase
        .from('SW_player_characters')
        .insert([{
          ...commonFields,
          user_number: userId,
          wound_current: woundThreshold,
          strain_current: strainThreshold,
        }])
        .select();

      if (error) {
        console.error('Error saving character:', error);
        return null;
      }

      const newId = data?.[0]?.id;
      if (newId) setCharacterId(newId);
      alert(`${characterName} is saved`);
      return newId || characterId;
    }
  };

  const handleFinishCharacter = async () => {
    const savedId = await handleSave();
    if (!savedId) return;
    localStorage.setItem('loadedCharacterId', savedId);
    navigate('/SW_character_overview');
  };

  const handleSelectTTRPG = () => {
    navigate('/select-ttrpg');
  };

  const getTalentTreeData = () => {
    if (!selectedSpecialization) return [];
    const specTree = talentTree.find(t => t.spec_ID === specializations.find(s => s.spec_name === selectedSpecialization)?.id);
    if (!specTree) return [];
    const treeData = [];
    for (let row = 5; row <= 25; row += 5) {
      for (let col = 1; col <= 4; col++) {
        const abilityField = `ability_${row}_${col}`;
        const linkField = `ability_${row}_${col}_links`;
        const abilityId = specTree[abilityField];
        const links = specTree[linkField] ? specTree[linkField].split(',').map(l => l.trim()).filter(l => l) : [];
        const ability = abilities.find(a => a.id === abilityId);
        const description = ability ? ability.description : '';
        const requiresChoice = description?.startsWith('When acquired, choose 1 ') || false;
        let choiceType = null;
        if (requiresChoice) {
          const match = description.match(/choose 1 (combat|knowledge|general)/i);
          if (match) choiceType = match[1].toLowerCase();
        }
        const isDedication = ability?.ability === 'Dedication';
        treeData.push({
          row,
          col,
          name: ability ? ability.ability : 'N/A',
          description,
          activation: ability ? ability.activation : 'N/A',
          links,
          abilityId: ability ? ability.id : null,
          requiresChoice,
          choiceType,
          isDedication,
        });
      }
    }
    return treeData;
  };

  const handleTalentClick = (index) => {
    const talentData = getTalentTreeData()[index];
    if (!clickableTalents.includes(index)) return;

    const row = Math.floor(index / 4);
    const expCost = [5, 10, 15, 20, 25][row];

    if (selectedTalents.includes(index)) {
      setExp(exp + expCost);
      const newSelectedTalents = selectedTalents.filter(t => t !== index);
      setSelectedTalents(newSelectedTalents);

      const ability = abilities.find(a => a.id === talentData.abilityId);
      if (ability && ability.increase_stat) {
        const increases = ability.increase_stat.split(',').map(s => s.trim());
        const woundCount = increases.filter(s => s === 'Wound').length;
        const strainCount = increases.filter(s => s === 'Strain').length;
        setWoundThreshold(prev => prev - woundCount);
        setStrainThreshold(prev => prev - strainCount);
      }

      setTalentChoices(prev => {
        const updated = { ...prev };
        delete updated[index];
        return updated;
      });

      if (talentData.isDedication && dedicationChoices[index]) {
        const prevStat = dedicationChoices[index];
        const statKey = prevStat.toLowerCase();
        setSelectedRace(prevRace => ({
          ...prevRace,
          [statKey]: Math.max(baseStats[statKey], prevRace[statKey] - 1)
        }));
        setDedicationChoices(prev => {
          const updated = { ...prev };
          delete updated[index];
          return updated;
        });
      }

      const newClickable = new Set([0, 1, 2, 3]);
      const specTree = talentTree.find(t => t.spec_ID === specializations.find(s => s.spec_name === selectedSpecialization)?.id);
      if (specTree) {
        newSelectedTalents.forEach(selIndex => {
          newClickable.add(selIndex);
          const selRow = Math.floor(selIndex / 4);
          const selCol = selIndex % 4;
          const field = `ability_${(selRow + 1) * 5}_${selCol + 1}_links`;
          const links = specTree[field] ? specTree[field].split(',').map(l => l.trim()) : [];
          links.forEach(link => {
            if (link === 'Down' && selRow < 4) newClickable.add((selRow + 1) * 4 + selCol);
            if (link === 'Up' && selRow > 0) newClickable.add((selRow - 1) * 4 + selCol);
            if (link === 'Left' && selCol > 0) newClickable.add(selRow * 4 + (selCol - 1));
            if (link === 'Right' && selCol < 3) newClickable.add(selRow * 4 + (selCol + 1));
          });
        });
      }
      setClickableTalents(Array.from(newClickable));
    } else if (exp >= expCost) {
      setExp(exp - expCost);
      const newSelectedTalents = [...selectedTalents, index];
      setSelectedTalents(newSelectedTalents);

      const ability = abilities.find(a => a.id === talentData.abilityId);
      if (ability && ability.increase_stat) {
        const increases = ability.increase_stat.split(',').map(s => s.trim());
        const woundCount = increases.filter(s => s === 'Wound').length;
        const strainCount = increases.filter(s => s === 'Strain').length;
        setWoundThreshold(prev => prev + woundCount);
        setStrainThreshold(prev => prev + strainCount);
      }

      const newClickable = new Set(clickableTalents);
      newClickable.add(index);
      if (talentData.links.includes('Down') && row < 4) newClickable.add((row + 1) * 4 + (index % 4));
      if (talentData.links.includes('Up') && row > 0) newClickable.add((row - 1) * 4 + (index % 4));
      if (talentData.links.includes('Left') && index % 4 > 0) newClickable.add(index - 1);
      if (talentData.links.includes('Right') && index % 4 < 3) newClickable.add(index + 1);
      setClickableTalents(Array.from(newClickable));
    } else {
      alert('Not enough EXP to unlock this talent');
    }
  };

  const handleDedicationChoice = (index, newChoice) => {
    const talentData = getTalentTreeData()[index];
    if (!talentData.isDedication) return;

    const prevChoice = dedicationChoices[index];
    const statKey = newChoice.toLowerCase();

    if (prevChoice && prevChoice !== newChoice) {
      const oldKey = prevChoice.toLowerCase();
      setSelectedRace(prevRace => ({
        ...prevRace,
        [oldKey]: Math.max(baseStats[oldKey], prevRace[oldKey] - 1)
      }));
    }

    if (newChoice) {
      setSelectedRace(prevRace => {
        const current = prevRace[statKey] || baseStats[statKey];
        if (current >= 6) {
          alert(`Cannot increase ${newChoice} beyond 6`);
          return prevRace;
        }
        return { ...prevRace, [statKey]: current + 1 };
      });
    }

    setDedicationChoices(prev => ({ ...prev, [index]: newChoice }));
    setTalentChoices(prev => ({ ...prev, [index]: newChoice }));
  };

  const handleExpChange = (delta) => {
    setExp(prev => Math.max(0, prev + delta));
  };

  const getSkillsByType = (type) => {
    if (type === 'combat') return skills.filter(s => s.type === 'Combat').map(s => s.skill).sort();
    if (type === 'knowledge') return skills.filter(s => s.type === 'Knowledge').map(s => s.skill).sort();
    if (type === 'general') return skills.filter(s => s.type === 'General').map(s => s.skill).sort();
    return [];
  };

  const handleTabClick = (tab) => {
    if (!selectedRace && (tab === 'Stats' || tab === 'Skills')) {
      alert('Please choose a Species first');
      setActiveTab('Species');
      return;
    }
    if (tab === 'Talent Tree' && !selectedSpecialization) {
      alert('Please choose a Specialization first');
      setActiveTab('Career');
      return;
    }
    setActiveTab(tab);
  };

  const formatCareerName = (career) => {
    return career.Force_Sensitive ? `${career.name} (Force Sensitive)` : career.name;
  };

  const getFilteredCareers = () => {
    const isDroid = selectedRace?.name?.toLowerCase() === 'droid';
    if (!isDroid) return careers;
    return careers.filter(c => !c.Force_Sensitive);
  };

  const handleCopyPrompt = () => {
    if (!selectedCareer || !selectedSpecialization || !selectedRace) {
      alert('Please select a career, specialization, and race first');
      return;
    }

    const careerData = careers.find(c => c.name === selectedCareer);
    const specData = specializations.find(s => s.spec_name === selectedSpecialization);
    
    const careerDesc = careerData?.description || 'No description';
    const specDesc = specData?.description || 'No description';
    const raceName = selectedRace.name;

    const prompt = `write a prompt for ${careerDesc} ${specDesc} the race is ${raceName}`;
    
    navigator.clipboard.writeText(prompt).then(() => {
      alert('Prompt copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert('Failed to copy prompt');
    });
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-white py-4 sm:py-6 md:py-10 px-2 sm:px-4" style={{ maxWidth: '100vw' }}>
      <img src={`/SW_Pictures/Logo.png?t=${Date.now()}`} alt="Star Wars: Edge of the Empire" className="w-40 sm:w-48 md:w-64 mb-4 sm:mb-6" />

      <div className="border-2 border-black rounded-lg p-2 sm:p-4 w-full text-center mb-4" style={{ minHeight: '80px' }}>
        <div className="flex flex-row gap-2">
          <button onClick={handleSave} className="flex-1 px-2 sm:px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm sm:text-base">Save</button>
          <button onClick={handleSelectTTRPG} className="flex-1 px-2 sm:px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm sm:text-base">Select TTRPG</button>
        </div>
      </div>

      <div className="w-full mb-4">
        <div className="flex flex-wrap border-2 border-black rounded-lg overflow-hidden">
          <button onClick={() => handleTabClick('Species')} className={`flex-1 px-2 sm:px-4 md:px-6 py-2 font-semibold text-xs sm:text-sm md:text-base ${activeTab === 'Species' ? 'bg-blue-600 text-white' : 'bg-black text-white hover:bg-gray-800'}`} style={{ minWidth: '0' }}>Species</button>
          <button onClick={() => handleTabClick('Stats')} className={`flex-1 px-2 sm:px-4 md:px-6 py-2 font-semibold text-xs sm:text-sm md:text-base ${activeTab === 'Stats' ? 'bg-blue-600 text-white' : 'bg-black text-white hover:bg-gray-800'}`} style={{ minWidth: '0' }}>Stats</button>
          <button onClick={() => handleTabClick('Skills')} className={`flex-1 px-2 sm:px-4 md:px-6 py-2 font-semibold text-xs sm:text-sm md:text-base ${activeTab === 'Skills' ? 'bg-blue-600 text-white' : 'bg-black text-white hover:bg-gray-800'}`} style={{ minWidth: '0' }}>Skills</button>
          <button onClick={() => handleTabClick('Career')} className={`flex-1 px-2 sm:px-4 md:px-6 py-2 font-semibold text-xs sm:text-sm md:text-base ${activeTab === 'Career' ? 'bg-blue-600 text-white' : 'bg-black text-white hover:bg-gray-800'}`} style={{ minWidth: '0' }}>Career</button>
          <button onClick={() => handleTabClick('Talent Tree')} className={`flex-1 px-2 sm:px-4 md:px-6 py-2 font-semibold text-xs sm:text-sm md:text-base ${activeTab === 'Talent Tree' ? 'bg-blue-600 text-white' : 'bg-black text-white hover:bg-gray-800'}`} style={{ minWidth: '0' }}>Talent Tree</button>
          <button onClick={() => handleTabClick('Backstory')} className={`flex-1 px-2 sm:px-4 md:px-6 py-2 font-semibold text-xs sm:text-sm md:text-base ${activeTab === 'Backstory' ? 'bg-blue-600 text-white' : 'bg-black text-white hover:bg-gray-800'}`} style={{ minWidth: '0' }}>Backstory</button>
          <button onClick={() => handleTabClick('Finish')} className={`flex-1 px-2 sm:px-4 md:px-6 py-2 font-semibold text-xs sm:text-sm md:text-base ${activeTab === 'Finish' ? 'bg-blue-600 text-white' : 'bg-black text-white hover:bg-gray-800'}`} style={{ minWidth: '0' }}>Finish</button>
        </div>
      </div>

      <div className="border-2 border-black rounded-lg p-3 sm:p-6 w-full text-center mb-4">
        <div className="flex flex-col items-center space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 w-full">
            {/* Character Picture Display */}
            <div className="flex flex-col items-center gap-2">
              <img
                src={selectedCharacterPictureId ? `/SW_Pictures/Picture ${selectedCharacterPictureId} Face.png?t=${Date.now()}` : `/SW_Pictures/Picture 0 Face.png?t=${Date.now()}`}
                alt="Character"
                className="rounded-lg object-contain"
                style={{ width: '80px', height: '100px' }}
                onError={(e) => {
                  console.log('Image failed to load:', e.target.src);
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="100"%3E%3Crect fill="%23ddd" width="80" height="100"/%3E%3C/svg%3E';
                }}
              />
              <button
                onClick={() => setShowCharacterPictureSelector(!showCharacterPictureSelector)}
                className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm sm:text-base font-semibold"
              >
                Change Picture
              </button>
              
              {/* Picture Selector Dropdown */}
              {showCharacterPictureSelector && selectedRace && availableCharacterPictures.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center max-w-xs mt-2 p-2 border border-gray-300 rounded-lg bg-gray-50">
                  {availableCharacterPictures.map((pic) => (
                    <img
                      key={pic.id}
                      src={`/SW_Pictures/Picture ${pic.id} Face.png?t=${Date.now()}`}
                      alt={`Character option ${pic.id}`}
                      className={`rounded-lg cursor-pointer object-contain`}
                      style={{ width: '80px', height: '100px' }}
                      onClick={() => {
                        setSelectedCharacterPictureId(pic.id);
                        setShowCharacterPictureSelector(false);
                      }}
                      onError={(e) => console.log('Picture failed to load:', pic.id)}
                    />
                  ))}
                </div>
              )}
              {showCharacterPictureSelector && (!selectedRace || availableCharacterPictures.length === 0) && (
                <div className="text-gray-500 text-sm mt-2">
                  {!selectedRace ? 'Select a race first' : 'No pictures available'}
                </div>
              )}
            </div>
            
            {/* Character Name */}
            <div className="w-full sm:flex-1">
              <label className="block font-bold text-base sm:text-lg mb-2">Character Name</label>
              <input
                type="text"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                className="border border-black rounded px-3 sm:px-4 py-2 w-full text-center text-lg sm:text-xl"
                placeholder="Enter character name"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
            <h2 className="font-bold text-lg sm:text-xl">EXP:</h2>
            <div className="flex items-center gap-2 sm:gap-0 sm:space-x-2">
              <button onClick={() => handleExpChange(-1)} className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-base sm:text-lg">-</button>
              <span className="border-4 border-black rounded px-4 sm:px-8 py-2 sm:py-3 font-bold text-2xl sm:text-3xl min-w-20 sm:min-w-32 text-center">{exp}</span>
              <button onClick={() => handleExpChange(1)} className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-base sm:text-lg">+</button>
            </div>
          </div>
        </div>
      </div>

      <>
        {/* Tab Content */}
        {activeTab === 'Species' && (
        <div className="border-2 border-black rounded-lg p-3 sm:p-4 w-full text-center mb-4" style={{ minHeight: '500px' }}>
          {!selectedRace ? (
            <>
              <h2 className="font-bold text-lg mb-6">Select Species</h2>

              {/* Species Card Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {races.flatMap((race, idx) => {
                  const elems = [];

                  // Get a random picture for this race (prefer race-only faces, exclude Picture 0)
                  let raceSpecificPictures = racePictures.filter(pic => 
                    pic.race_ID === race.id && !pic.career_ID && !pic.spec_ID && pic.id !== 0
                  );
                  if (raceSpecificPictures.length === 0) {
                    raceSpecificPictures = racePictures.filter(pic => pic.race_ID === race.id && pic.id !== 0);
                  }
                  const randomPicture = raceSpecificPictures.length > 0 
                    ? raceSpecificPictures[Math.floor(Math.random() * raceSpecificPictures.length)] 
                    : null;

                  elems.push(
                    <div
                      key={race.id}
                      onClick={() => {
                        // If clicking the same race that's open, act like Cancel and close the box
                        if (tempSelectedRaceIndex === idx && tempSelectedRace?.id === race.id) {
                          setTempSelectedRace(null);
                          setTempSelectedRaceIndex(null);
                          return;
                        }
                        setTempSelectedRace(race);
                        setTempSelectedRaceIndex(idx);
                      }}
                      className="border-2 border-black rounded-lg p-3 bg-white hover:bg-gray-100 cursor-pointer transition-colors flex items-center gap-3"
                      style={{ minHeight: '120px' }}
                    >
                      <div className="flex-shrink-0">
                        {randomPicture ? (
                          <img 
                            src={`/SW_Pictures/Picture ${randomPicture.id} Face.png`} 
                            alt={`${race.name} portrait`} 
                            className="rounded object-contain" 
                            style={{ width: '80px', height: '100px' }} 
                          />
                        ) : (
                          <div className="w-20 h-24 border border-dashed border-gray-400 rounded flex items-center justify-center bg-gray-100">
                            <p className="text-gray-500 text-xs text-center">No image</p>
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <p className="font-bold text-sm sm:text-base">{race.name}</p>
                      </div>

                      <div className="flex-shrink-0">
                        <img 
                          src="/Blue_Arrow.png" 
                          alt="Select" 
                          className="object-contain" 
                          style={{ width: '30px', height: '30px' }} 
                        />
                      </div>
                    </div>
                  );

                  if (tempSelectedRace && tempSelectedRaceIndex === idx) {
                    elems.push(
                      <div
                        key={`race-detail-${idx}`}
                        className="col-span-full w-full rounded-lg p-4 sm:p-6 bg-black text-left text-white"
                        style={{
                          gridColumn: '1 / -1',
                          backgroundColor: '#000000',
                          color: '#ffffff',
                          border: '4px solid #dc2626', // red border
                        }}
                      >
                        <h3 className="font-bold text-xl sm:text-2xl mb-4 text-white">{tempSelectedRace.name}</h3>

                        <div className="mb-6">
                          <h4 className="font-bold text-base mb-2 text-white">Description</h4>
                          <div className="text-left p-3 sm:p-4 border border-white rounded bg-black text-sm sm:text-base text-white">
                            {tempSelectedRace.description || 'No description available'}
                          </div>
                        </div>

                        {modalStartingSkillOptions1.length > 0 && (
                          <div className="mb-6">
                            <h4 className="font-bold text-base mb-3 text-white">Can Choose</h4>
                            <div className="space-y-2 text-white">
                              {modalStartingSkillOptions1.map((s, i) => (
                                <div key={i} className="border border-white rounded p-3 bg-black text-sm sm:text-base text-white">
                                  {s.skill} ({s.type})
                                </div>
                              ))}
                              {modalStartingSkillOptions2.length > 0 && (
                                <>
                                  <p className="font-semibold mt-4 text-white">And</p>
                                  {modalStartingSkillOptions2.map((s, i) => (
                                    <div key={i + modalStartingSkillOptions1.length} className="border border-white rounded p-3 bg-black text-sm sm:text-base text-white">
                                      {s.skill} ({s.type})
                                    </div>
                                  ))}
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        {tempSelectedRace.name === 'Human' && modalStartingSkillOptions2.length === 0 && (
                          <div className="mb-6">
                            <h4 className="font-bold text-base mb-3 text-white">Can Choose</h4>
                            <div className="text-sm sm:text-base text-white">
                              <p className="mb-3">One skill, then a free second skill from any available skills</p>
                            </div>
                          </div>
                        )}

                        {tempSelectedRace.name === 'Human (Mandolorian)' && modalStartingSkillOptions2.length === 0 && (
                          <div className="mb-6">
                            <h4 className="font-bold text-base mb-3 text-white">Can Choose</h4>
                            <div className="text-sm sm:text-base text-white">
                              <p className="mb-3">One skill. If Knowledge, can choose an additional Knowledge skill</p>
                            </div>
                          </div>
                        )}

                        {modalStartingTalents.length > 0 && (
                          <div className="mb-6">
                            <h4 className="font-bold text-base mb-2 text-white">Starting Talents</h4>
                            <div className="space-y-2">
                              {modalStartingTalents.map((talent, idx2) => (
                                <div key={idx2} className="border border-white rounded p-3 bg-black text-left text-sm sm:text-base text-white">
                                  <span className="font-semibold">{talent.name}:</span> {talent.description}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {tempSelectedRace.ability && (
                          <div className="mb-6">
                            <h4 className="font-bold text-base mb-2 text-white">Ability</h4>
                            <div className="border border-white rounded p-3 bg-black text-left text-sm sm:text-base text-white">
                              {tempSelectedRace.ability}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 justify-end">
                          <button
                            onClick={() => {
                              setTempSelectedRace(null);
                              setTempSelectedRaceIndex(null);
                            }}
                            className="px-4 sm:px-6 py-2 border-2 border-white rounded font-semibold bg-white hover:bg-gray-200 text-sm sm:text-base"
                            style={{ color: '#000000' }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              handleRaceChange({ target: { value: tempSelectedRace.name } });
                              setTempSelectedRace(null);
                              setTempSelectedRaceIndex(null);
                            }}
                            className="px-4 sm:px-6 py-2 border-2 border-white rounded font-semibold bg-white hover:bg-gray-200 text-sm sm:text-base"
                            style={{ color: '#000000' }}
                          >
                            Confirm
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return elems;
                })}
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                <h2 className="font-bold text-lg">{selectedRace.name}</h2>
                <button
                  onClick={() => setSelectedRace(null)}
                  className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm sm:text-base mt-4 sm:mt-0"
                >
                  Choose Another Species
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-4 md:gap-8 mb-6">
                <div className="flex flex-col items-center md:flex-none">
                  <h3 className="font-bold text-base mb-2">Species Image</h3>
                  {selectedPictureId ? (
                    <img src={`/SW_Pictures/Picture ${selectedPictureId} Face.png`} alt={`${selectedRace.name} portrait`} className="rounded object-contain" style={{ maxHeight: '200px', width: 'auto' }} />
                  ) : (
                    <div className="w-40 sm:w-48 h-40 sm:h-48 border border-dashed border-gray-400 rounded flex items-center justify-center bg-gray-100">
                      <p className="text-gray-500 text-sm">No image</p>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-bold text-base mb-2">Species Description</h3>
                  <div className="text-left p-3 sm:p-4 border border-black rounded bg-white h-48 overflow-y-auto text-sm sm:text-base text-gray-800">
                    {selectedRace.description || 'No description available'}
                  </div>

                  <div className="mt-4">
                    <h3 className="font-bold text-base mb-2">Starting Skills & Talents</h3>
                    <div className="text-left p-3 sm:p-4 border border-black rounded bg-white h-64 overflow-y-auto space-y-4 text-sm sm:text-base text-gray-800">

                      <div>
                        <h4 className="font-semibold">Starting Skill Selection</h4>

                        {/* First Skill Dropdown */}
                        <div className="mt-2">
                          <label className="block font-semibold">Skill 1</label>
                          <select
                            value={selectedStartingSkill1}
                            onChange={handleStartingSkill1Change}
                            className="border border-black rounded px-2 py-1 w-full mt-1"
                            disabled={startingSkillOptions1.length === 0}
                          >
                            <option value="">
                              {startingSkillOptions1.length === 0 ? 'No starting skill' : 'Select Skill'}
                            </option>
                            {startingSkillOptions1.map((s, i) => (
                              <option key={i} value={s.skill}>{s.skill} ({s.type})</option>
                            ))}
                          </select>
                        </div>

                        {/* Second Skill Dropdown — only for "and" species */}
                        {isPairedSkillRace && (
                          <div className="mt-3">
                            <label className="block font-semibold">Skill 2</label>
                            <select
                              value={selectedStartingSkill2}
                              onChange={handleStartingSkill2Change}
                              className="border border-black rounded px-2 py-1 w-full mt-1"
                            >
                              <option value="">Select Skill</option>
                              {startingSkillOptions2
                                .filter(s => s.skill !== selectedStartingSkill1)
                                .map((s, i) => (
                                  <option key={i} value={s.skill}>{s.skill} ({s.type})</option>
                                ))}
                            </select>
                          </div>
                        )}

                        {/* Human gets free choice for second skill */}
                        {selectedRace.name === 'Human' && selectedStartingSkill1 && !isPairedSkillRace && (
                          <div className="mt-3">
                            <label className="block font-semibold">Free Second Skill</label>
                            <select
                              value={selectedStartingSkill2}
                              onChange={handleStartingSkill2Change}
                              className="border border-black rounded px-2 py-1 w-full mt-1"
                            >
                              <option value="">Select Any Skill</option>
                              {startingSkillOptions2
                                .filter(s => s.skill !== selectedStartingSkill1)
                                .map((s, i) => (
                                  <option key={i} value={s.skill}>{s.skill} ({s.type})</option>
                                ))}
                            </select>
                          </div>
                        )}

                        {/* Mandalorian gets additional knowledge skill if first is knowledge */}
                        {selectedRace.name === 'Human (Mandolorian)' && selectedStartingSkill1 && showSecondMandalorianSkill && !isPairedSkillRace && (
                          <div className="mt-3">
                            <label className="block font-semibold">Additional Knowledge Skill</label>
                            <select
                              value={selectedStartingSkill2}
                              onChange={handleStartingSkill2Change}
                              className="border border-black rounded px-2 py-1 w-full mt-1"
                            >
                              <option value="">Select Knowledge Skill</option>
                              {startingSkillOptions2
                                .filter(s => s.skill !== selectedStartingSkill1)
                                .map((s, i) => (
                                  <option key={i} value={s.skill}>{s.skill} ({s.type})</option>
                                ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {startingTalents.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-semibold">Starting Talents</h4>
                          <div className="mt-2 space-y-2">
                            {startingTalents.map((talent, idx) => (
                              <div key={idx} className="border border-gray-400 rounded p-2 bg-white">
                                <span className="font-semibold">{talent.name}:</span> {talent.description}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {selectedRace && activeTab === 'Stats' && (
        <div className="border-2 border-black rounded-lg p-2 sm:p-4 w-full text-center mb-4 overflow-x-auto" style={{ minHeight: '400px', display: 'flex', justifyContent: 'center' }}>
          <h2 className="font-bold text-base sm:text-lg mb-3">Stats</h2>
          <table className="border border-black text-center text-xs sm:text-sm md:text-base" style={{ tableLayout: 'auto', margin: '0 auto' }}>
            <tbody>
              <tr className="bg-white"><th className="border border-black py-1">Brawn</th><td className="border border-black py-1" style={{ backgroundColor: 'white' }}><button onClick={() => updateStat('brawn', -1)} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">-</button><span style={{ color: 'black', margin: '0 8px' }}>{getBaseStatValue('brawn')}</span><button onClick={() => updateStat('brawn', 1)} className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">+</button></td></tr>
              <tr className="bg-white"><th className="border border-black py-1">Agility</th><td className="border border-black py-1" style={{ backgroundColor: 'white' }}><button onClick={() => updateStat('agility', -1)} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">-</button><span style={{ color: 'black', margin: '0 8px' }}>{getBaseStatValue('agility')}</span><button onClick={() => updateStat('agility', 1)} className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">+</button></td></tr>
              <tr className="bg-white"><th className="border border-black py-1">Intellect</th><td className="border border-black py-1" style={{ backgroundColor: 'white' }}><button onClick={() => updateStat('intellect', -1)} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">-</button><span style={{ color: 'black', margin: '0 8px' }}>{getBaseStatValue('intellect')}</span><button onClick={() => updateStat('intellect', 1)} className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">+</button></td></tr>
              <tr className="bg-white"><th className="border border-black py-1">Cunning</th><td className="border border-black py-1" style={{ backgroundColor: 'white' }}><button onClick={() => updateStat('cunning', -1)} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">-</button><span style={{ color: 'black', margin: '0 4px' }}>{getBaseStatValue('cunning')}</span><button onClick={() => updateStat('cunning', 1)} className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">+</button></td></tr>
              <tr className="bg-white"><th className="border border-black py-1">Willpower</th><td className="border border-black py-1" style={{ backgroundColor: 'white' }}><button onClick={() => updateStat('willpower', -1)} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">-</button><span style={{ color: 'black', margin: '0 8px' }}>{getBaseStatValue('willpower')}</span><button onClick={() => updateStat('willpower', 1)} className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">+</button></td></tr>
              <tr className="bg-white"><th className="border border-black py-1">Presence</th><td className="border border-black py-1" style={{ backgroundColor: 'white' }}><button onClick={() => updateStat('presence', -1)} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">-</button><span style={{ color: 'black', margin: '0 8px' }}>{getBaseStatValue('presence')}</span><button onClick={() => updateStat('presence', 1)} className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">+</button></td></tr>
              <tr className="bg-white"><th className="border border-black py-1">Wound Threshold</th><td className="border border-black py-1" style={{ color: 'black', backgroundColor: 'white' }}>{woundThreshold}</td></tr>
              <tr className="bg-white"><th className="border border-black py-1">Strain Threshold</th><td className="border border-black py-1" style={{ color: 'black', backgroundColor: 'white' }}>{strainThreshold}</td></tr>
              <tr className="bg-white"><th className="border border-black py-1">Species Attack</th><td className="border border-black py-1" style={{ color: 'black', backgroundColor: 'white' }}>{selectedRace.Race_Attack}</td></tr>
            </tbody>
            </table>
          </div>
        )}

      {selectedRace && activeTab === 'Skills' && skills.length > 0 && (
        <div className="border-2 border-black rounded-lg p-2 sm:p-4 w-full text-center mb-4" style={{ minHeight: '400px' }}>
          <h2 className="font-bold text-base sm:text-lg mb-3">Skills</h2>
          <div className="overflow-x-auto flex justify-center">
            <table className="border border-black text-center text-xs sm:text-sm md:text-base" style={{ tableLayout: 'auto' }}>
            <thead>
              <tr className="bg-white">
                <th className="border border-black py-1">Skill</th>
                <th className="border border-black py-1">Rank</th>
                <th className="border border-black py-1">Dice Pool</th>
              </tr>
            </thead>
            <tbody>
              {skills.map((skill, index) => (
                <tr key={index} className="bg-white">
                  <td className="border border-black py-1">{skill.skill}</td>
                  <td className="border border-black py-1" style={{ backgroundColor: 'white' }}>
                    <button onClick={() => updateSkillRank(skill.skill, -1)} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">-</button>
                    <span style={{ color: 'black', margin: '0 8px' }}>{getSkillRank(skill.skill)}</span>
                    <button onClick={() => updateSkillRank(skill.skill, 1)} className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">+</button>
                  </td>
                  <td className="border border-black py-1" style={{ color: 'black', backgroundColor: 'white' }}>
                    {getDicePool(skill.skill, skill.stat)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      )}

      {activeTab === 'Career' && careers.length > 0 && (
        <div className="border-2 border-black rounded-lg p-3 sm:p-4 w-full text-center mb-4" style={{ minHeight: '500px' }}>
          {!selectedCareer ? (
            <>
              <h2 className="font-bold text-lg mb-6">Select Career</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {getFilteredCareers()
                  .slice()
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .flatMap((career, idx) => {
                    const elems = [];
                    const careerPictures = racePictures.filter(pic => pic.career_ID === career.id);
                    const randomPicture = careerPictures.length > 0
                      ? careerPictures[Math.floor(Math.random() * careerPictures.length)]
                      : null;

                    elems.push(
                      <div
                        key={career.id}
                        onClick={() => {
                          if (tempSelectedCareerIndex === idx && tempSelectedCareer?.id === career.id) {
                            setTempSelectedCareer(null);
                            setTempSelectedCareerIndex(null);
                            return;
                          }
                          setTempSelectedCareer(career);
                          setTempSelectedCareerIndex(idx);
                        }}
                        className="border-2 border-black rounded-lg p-3 bg-white hover:bg-gray-100 cursor-pointer transition-colors flex items-center gap-3"
                        style={{ minHeight: '120px' }}
                      >
                        {randomPicture && (
                          <img
                            src={`/SW_Pictures/Picture ${randomPicture.id} Face.png`}
                            alt={career.name}
                            className="rounded object-cover"
                            style={{ width: '80px', height: '80px', flexShrink: 0 }}
                          />
                        )}
                        <div className="flex-1 text-left">
                          <h3 className="font-bold text-lg">{formatCareerName(career)}</h3>
                        </div>
                        <div className="text-blue-600 text-3xl" style={{ flexShrink: 0 }}>›</div>
                      </div>
                    );

                    if (tempSelectedCareerIndex === idx && tempSelectedCareer?.id === career.id) {
                      const detailPictures = racePictures.filter(pic => pic.career_ID === career.id);
                      const detailPicture = detailPictures.length > 0
                        ? detailPictures[Math.floor(Math.random() * detailPictures.length)]
                        : null;

                      elems.push(
                        <div
                          key={`detail-${career.id}`}
                          className="col-span-full w-full rounded-lg p-4 text-white"
                          style={{
                            gridColumn: '1 / -1',
                            backgroundColor: '#000000',
                            color: '#ffffff',
                            border: '4px solid #dc2626',
                          }}
                        >
                          <div className="flex-1">
                            <p className="mb-4">{career.description}</p>
                            <div className="mb-4">
                              <p className="font-bold mb-2"><strong>Available Skills:</strong></p>
                              <p className="text-sm">{career.skills}</p>
                            </div>
                            <div className="flex gap-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCareerChange({ target: { value: career.name } });
                                  setTempSelectedCareer(null);
                                  setTempSelectedCareerIndex(null);
                                }}
                                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold"
                              >
                                Choose Career
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTempSelectedCareer(null);
                                  setTempSelectedCareerIndex(null);
                                }}
                                className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 font-semibold"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return elems;
                  })}
              </div>
            </>
          ) : (
            <>
              <div className="border-2 border-black rounded-lg p-3 bg-white mb-4 flex items-center gap-3">
                {selectedCareerPictureId && (
                  <img
                    src={`/SW_Pictures/Picture ${selectedCareerPictureId} Face.png`}
                    alt={selectedCareer}
                    className="rounded object-cover"
                    style={{ width: '80px', height: '80px', flexShrink: 0 }}
                  />
                )}
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-lg">{formatCareerName(careers.find(c => c.name === selectedCareer))}</h3>
                </div>
                <button
                  onClick={() => {
                    setSelectedCareer('');
                    setSelectedCareerSkills([]);
                    setSelectedSpecialization('');
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold"
                >
                  Change Career
                </button>
              </div>

              <div className="border-2 border-black rounded-lg p-4 bg-white mb-4 text-left">
                <label className="block text-base font-bold mb-2">Career Skills{isDroidSpecies && ' (6 available)'}</label>
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
                  <div style={{ width: '520px', maxWidth: '100%' }}>
                    {Array.from({ length: isDroidSpecies ? 6 : 4 }).map((_, index) => (
                      <div key={index} className="mb-2">
                        <label className="block text-base mb-1" style={{fontWeight: 'bold'}}>Skill {index + 1}</label>
                        <select
                          value={selectedCareerSkills[index] || ''}
                          onChange={handleCareerSkillChange(index)}
                          className="border border-black rounded px-2 py-1 w-full text-center"
                        >
                          <option value="">Select Skill</option>
                          {getAvailableSkills(index).map((skill, i) => (
                            <option key={i} value={skill}>{skill}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {!selectedSpecialization ? (
                <>
                  <h2 className="font-bold text-lg mb-4">Select Specialization</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {specializations
                      .filter(spec => {
                        const career = careers.find(c => c.id === spec.Career);
                        return career && career.name === selectedCareer;
                      })
                      .sort((a, b) => a.spec_name.localeCompare(b.spec_name))
                      .flatMap((spec, idx) => {
                        const elems = [];
                        // Prioritize pictures with both spec_ID and race_ID, otherwise use spec-only pictures, finally fallback to any picture
                        const specWithRacePictures = racePictures.filter(pic => pic.spec_ID === spec.id && pic.race_ID === selectedRace?.id);
                        const specOnlyPictures = racePictures.filter(pic => pic.spec_ID === spec.id && !pic.race_ID);
                        let specPictures = specWithRacePictures.length > 0 ? specWithRacePictures : specOnlyPictures;
                        if (specPictures.length === 0 && racePictures.length > 0) {
                          specPictures = racePictures;
                        }
                        const randomPicture = specPictures.length > 0
                          ? specPictures[Math.floor(Math.random() * specPictures.length)]
                          : null;

                        elems.push(
                          <div
                            key={spec.id}
                            onClick={() => {
                              if (tempSelectedSpecIndex === idx && tempSelectedSpec?.id === spec.id) {
                                setTempSelectedSpec(null);
                                setTempSelectedSpecIndex(null);
                                return;
                              }
                              setTempSelectedSpec(spec);
                              setTempSelectedSpecIndex(idx);
                            }}
                            className="border-2 border-black rounded-lg p-3 bg-white hover:bg-gray-100 cursor-pointer transition-colors flex items-center gap-3"
                            style={{ minHeight: '120px' }}
                          >
                            {randomPicture && (
                              <img
                                src={`/SW_Pictures/Picture ${randomPicture.id} Face.png`}
                                alt={spec.spec_name}
                                className="rounded object-cover"
                                style={{ width: '80px', height: '80px', flexShrink: 0 }}
                              />
                            )}
                            <div className="flex-1 text-left">
                              <h3 className="font-bold text-lg">{spec.spec_name}</h3>
                            </div>
                            <div className="text-blue-600 text-3xl" style={{ flexShrink: 0 }}>›</div>
                          </div>
                        );

                        if (tempSelectedSpecIndex === idx && tempSelectedSpec?.id === spec.id) {
                          // Prioritize pictures with both spec_ID and race_ID, otherwise use spec-only pictures, finally fallback to any picture
                          const detailSpecWithRacePictures = racePictures.filter(pic => pic.spec_ID === spec.id && pic.race_ID === selectedRace?.id);
                          const detailSpecOnlyPictures = racePictures.filter(pic => pic.spec_ID === spec.id && !pic.race_ID);
                          let detailPictures = detailSpecWithRacePictures.length > 0 ? detailSpecWithRacePictures : detailSpecOnlyPictures;
                          if (detailPictures.length === 0 && racePictures.length > 0) {
                            detailPictures = racePictures;
                          }
                          const detailPicture = detailPictures.length > 0
                            ? detailPictures[Math.floor(Math.random() * detailPictures.length)]
                            : null;

                          elems.push(
                            <div
                              key={`detail-${spec.id}`}
                              className="col-span-full w-full rounded-lg p-4 text-white"
                              style={{
                                gridColumn: '1 / -1',
                                backgroundColor: '#000000',
                                color: '#ffffff',
                                border: '4px solid #dc2626',
                              }}
                            >
                              <div className="flex-1">
                                <p className="mb-4">{spec.description}</p>
                                <div className="mb-4">
                                  <p className="font-bold mb-2"><strong>Available Skills:</strong></p>
                                  <p className="text-sm">{spec.spec_skills}</p>
                                </div>
                                <div className="flex gap-3">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSpecializationChange({ target: { value: spec.spec_name } });
                                      setTempSelectedSpec(null);
                                      setTempSelectedSpecIndex(null);
                                    }}
                                    className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold"
                                  >
                                    Choose Specialization
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setTempSelectedSpec(null);
                                      setTempSelectedSpecIndex(null);
                                    }}
                                    className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 font-semibold"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        return elems;
                      })}
                  </div>
                </>
              ) : (
                <>
                  <div className="border-2 border-black rounded-lg p-3 bg-white mb-4 flex items-center gap-3">
                    {selectedSpecPictureId && (
                      <img
                        src={`/SW_Pictures/Picture ${selectedSpecPictureId} Face.png`}
                        alt={selectedSpecialization}
                        className="rounded object-cover"
                        style={{ width: '80px', height: '80px', flexShrink: 0 }}
                      />
                    )}
                    <div className="flex-1 text-left">
                      <h3 className="font-bold text-lg">{selectedSpecialization}</h3>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedSpecialization('');
                        setSelectedSpecSkill1('');
                        setSelectedSpecSkill2('');
                        setSelectedSpecSkill3('');
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold"
                    >
                      Change Specialization
                    </button>
                  </div>

                  <div className="border-2 border-black rounded-lg p-4 bg-white mb-4 text-left">
                    <label className="block text-base font-bold mb-2">Specialization Skills</label>
                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
                      <div style={{ width: '520px', maxWidth: '100%' }}>
                        {Array.from({ length: isDroidSpecies ? 3 : 2 }).map((_, index) => {
                          const specData = specializations.find(s => s.spec_name === selectedSpecialization);
                          const availableSkills = specData && specData.spec_skills
                            ? specData.spec_skills.split(',').map(s => s.trim()).filter(s => s)
                            : [];
                          
                          // Filter out the skills selected in the other dropdowns
                          const otherSelectedSkills = [
                            index !== 0 ? selectedSpecSkill1 : '',
                            index !== 1 ? selectedSpecSkill2 : '',
                            index !== 2 ? selectedSpecSkill3 : ''
                          ].filter(s => s);
                          
                          const filteredSkills = availableSkills.filter(skill => !otherSelectedSkills.includes(skill));
                          
                          return (
                            <div key={index} className="mb-2">
                              <label className="block text-base mb-1" style={{fontWeight: 'bold'}}>Specialization Skill {index + 1}</label>
                              <select
                                value={index === 0 ? selectedSpecSkill1 : index === 1 ? selectedSpecSkill2 : selectedSpecSkill3}
                                onChange={(e) => {
                                  const newValue = e.target.value;
                                  const oldValue = index === 0 ? selectedSpecSkill1 : index === 1 ? selectedSpecSkill2 : selectedSpecSkill3;
                                  
                                  // Decrease rank of previously selected skill
                                  if (oldValue && skillRanks[oldValue] > 0) {
                                    setSkillRanks(prev => ({ ...prev, [oldValue]: prev[oldValue] - 1 }));
                                  }
                                  
                                  // Increase rank of newly selected skill
                                  if (newValue) {
                                    setSkillRanks(prev => ({ ...prev, [newValue]: (prev[newValue] || 0) + 1 }));
                                  }
                                  
                                  // Update the state
                                  if (index === 0) setSelectedSpecSkill1(newValue);
                                  else if (index === 1) setSelectedSpecSkill2(newValue);
                                  else setSelectedSpecSkill3(newValue);
                                }}
                                className="border border-black rounded px-2 py-1 w-full text-center"
                              >
                                <option value="">Select Skill</option>
                                {filteredSkills.map((skillName, i) => (
                                  <option key={i} value={skillName}>{skillName}</option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {selectedRace && activeTab === 'Talent Tree' && specializations.length > 0 && (
        <div
          className="border-2 border-black rounded-lg p-2 sm:p-4 md:p-6 w-full text-center mb-4 overflow-auto"
          style={{
            minHeight: '500px',
            touchAction: 'pan-x pan-y',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
          }}
        >
          <h2 className="font-bold text-base sm:text-lg md:text-xl mb-4">Talent Tree</h2>
          
          {isAdmin && (
            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                id="publishForceTrees"
                checked={publishForceTrees}
                onChange={handlePublishForceTreesChange}
                className="mr-2 h-4 w-4"
              />
              <label htmlFor="publishForceTrees" className="text-sm sm:text-base font-semibold">
                Publish Force Trees
              </label>
            </div>
          )}
          
          {isForceSensitiveCareer && (publishForceTrees || isAdmin) && (
            <div className="flex border-2 border-black rounded-lg overflow-hidden mb-4">
              <button 
                onClick={() => setTalentTreeTab('Career Tree')}
                className={`flex-1 px-4 py-2 font-semibold text-sm sm:text-base ${talentTreeTab === 'Career Tree' ? 'bg-blue-600 text-white' : 'bg-black text-white hover:bg-gray-800'}`}
              >
                Career Tree
              </button>
              <button 
                onClick={() => setTalentTreeTab('Force Trees')}
                className={`flex-1 px-4 py-2 font-semibold text-sm sm:text-base ${talentTreeTab === 'Force Trees' ? 'bg-blue-600 text-white' : 'bg-black text-white hover:bg-gray-800'}`}
              >
                Force Trees
              </button>
            </div>
          )}
          
          {talentTreeTab === 'Career Tree' && selectedSpecialization && (
            <h3 className="font-bold text-base sm:text-lg md:text-xl mb-4">{selectedSpecialization} Ability Tree</h3>
          )}
          
          {talentTreeTab === 'Career Tree' && selectedSpecialization ? (
            <div
              className="flex"
              style={{ width: 'max-content', minWidth: '1650px', minHeight: '950px' }}
            >
              <table
                className="border-separate text-center text-xs sm:text-sm"
                style={{ borderSpacing: '0', width: 'max-content', minWidth: '1600px' }}
              >
                <tbody>
                  {Array.from({ length: 9 }, (_, rowIndex) => {
                    const expValues = [5, 10, 15, 20, 25];
                    const isTalentRow = rowIndex % 2 === 0 && rowIndex < 10;
                    const adjustedRowIndex = Math.floor(rowIndex / 2);
                    const expToShow = isTalentRow ? expValues[adjustedRowIndex] : null;
                    return (
                      <tr key={rowIndex} className="bg-gray-100" style={{ height: isTalentRow ? 'auto' : '16px' }}>
                        {Array.from({ length: 7 }, (_, colIndex) => {
                          const talentIndex = Math.floor(colIndex / 2);
                          const isTalentBox = colIndex % 2 === 0 && colIndex < 8 && isTalentRow;
                          const index = adjustedRowIndex * 4 + talentIndex;
                          const talent = isTalentBox ? getTalentTreeData()[index] : null;
                          return (
                            <td key={colIndex} className={isTalentBox ? 'p-2 align-top' : 'p-2'} style={{
                              position: 'relative',
                              border: isTalentBox ? '2px solid black' : 'none',
                              width: isTalentBox ? '388.8px' : '16px',
                              height: isTalentBox ? '176px' : '16px',
                            }}>
                              {isTalentBox && (
                                <div
                                  className="talent-box"
                                  style={{
                                    width: '388.8px',
                                    height: '176px',
                                    textAlign: 'left',
                                    padding: '8px',
                                    position: 'relative',
                                    boxSizing: 'border-box',
                                    cursor: clickableTalents.includes(index) ? 'pointer' : 'not-allowed',
                                    backgroundColor: selectedTalents.includes(index) ? '#ffff00' : (clickableTalents.includes(index) ? '#e0f7fa' : '#f0f0f0'),
                                  }}
                                  onClick={() => handleTalentClick(index)}
                                >
                                  <div className="border-b-2 border-black pb-1 font-semibold">
                                    {talent ? `${talent.name} (${talent.activation})` : 'N/A (N/A)'}
                                  </div>
                                  <div className="text-xs text-gray-700 mt-1">
                                    {talent ? talent.description : 'No ability assigned'}
                                  </div>
                                  <div className="absolute bottom-2 right-2 text-right text-xs">
                                    <div>{expToShow} EXP</div>
                                  </div>

                                  {selectedTalents.includes(index) && talent?.requiresChoice && (
                                    <div className="absolute inset-x-0 bottom-12 left-0 right-0 px-2">
                                      <select
                                        value={talentChoices[index] || ''}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          setTalentChoices(prev => ({ ...prev, [index]: value }));
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full text-xs border border-black rounded px-1 py-0.5"
                                      >
                                        <option value="">Choose...</option>
                                        {talent.choiceType && getSkillsByType(talent.choiceType).map(skill => (
                                          <option key={skill} value={skill}>{skill}</option>
                                        ))}
                                      </select>
                                    </div>
                                  )}

                                  {selectedTalents.includes(index) && talent?.isDedication && (
                                    <div className="absolute inset-x-0 bottom-12 left-0 right-0 px-2">
                                      <select
                                        value={talentChoices[index] || ''}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          handleDedicationChoice(index, value);
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full text-xs border border-black rounded px-1 py-0.5"
                                      >
                                        <option value="">Choose Characteristic...</option>
                                        {CHARACTERISTICS.map(char => (
                                          <option key={char} value={char} disabled={getBaseStatValue(char.toLowerCase()) >= 6}>
                                            {char} ({getBaseStatValue(char.toLowerCase())})
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  )}
                                </div>
                              )}
                              {isTalentBox && talent && talent.links && talent.links.length > 0 && (
                                <>
                                  {talent.links.includes('Up') && adjustedRowIndex > 0 && (
                                    <div style={{ position: 'absolute', top: '-26px', left: '50%', width: '2px', height: '26px', backgroundColor: 'black', transform: 'translateX(-50%)' }} />
                                  )}
                                  {talent.links.includes('Down') && adjustedRowIndex < 4 && (
                                    <div style={{ position: 'absolute', bottom: '-26px', left: '50%', width: '2px', height: '26px', backgroundColor: 'black', transform: 'translateX(-50%)' }} />
                                  )}
                                  {talent.links.includes('Left') && talentIndex > 0 && (
                                    <div style={{ position: 'absolute', top: '50%', left: '-10px', width: '10px', height: '2px', backgroundColor: 'black', transform: 'translateY(-50%)' }} />
                                  )}
                                  {talent.links.includes('Right') && talentIndex < 3 && (
                                    <div style={{ position: 'absolute', top: '50%', right: '-10px', width: '10px', height: '2px', backgroundColor: 'black', transform: 'translateY(-50%)' }} />
                                  )}
                                </>
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
          ) : !selectedSpecialization && talentTreeTab === 'Career Tree' ? (
            <p className="text-gray-700">Select a specialization to view its talent tree.</p>
          ) : null}
          
          {talentTreeTab === 'Force Trees' && isForceSensitiveCareer && (publishForceTrees || isAdmin) && (
            <>
              {forcePowerTrees.length > 0 && (
                <div className="flex border-2 border-black rounded-lg overflow-hidden mb-4 flex-wrap">
                  {forcePowerTrees.map((forceTree) => (
                    <button
                      key={forceTree.PowerTreeName}
                      onClick={() => setSelectedForceTreeTab(forceTree.PowerTreeName)}
                      className={`flex-1 px-4 py-2 font-semibold text-sm sm:text-base min-w-max ${selectedForceTreeTab === forceTree.PowerTreeName ? 'bg-blue-600 text-white' : 'bg-black text-white hover:bg-gray-800'}`}
                    >
                      {forceTree.PowerTreeName}
                    </button>
                  ))}
                </div>
              )}
              
              {selectedForceTreeTab && (
                <>
                  {forcePowerTrees.find(ft => ft.PowerTreeName === selectedForceTreeTab) && (
                    <div className="border-2 border-black rounded-lg p-4 bg-white mb-4">
                      <div className="mb-4 text-left">
                        <p className="font-bold text-lg">Force Prerequisite: {forcePowerTrees.find(ft => ft.PowerTreeName === selectedForceTreeTab)?.ForcePrerequisite || 'N/A'}</p>
                      </div>
                      
                      {(() => {
                        const currentTree = forcePowerTrees.find(ft => ft.PowerTreeName === selectedForceTreeTab);
                        
                        // Build grid data: 4 columns, 5 rows
                        const gridData = [];
                        for (let row = 1; row <= 5; row++) {
                          const rowData = [];
                          for (let col = 1; col <= 4; col++) {
                            const fieldName = `ability_${row}_${col}`;
                            const costFieldName = `ability_${row}_${col}_cost`;
                            const talentId = currentTree[fieldName];
                            const cost = currentTree[costFieldName] || 0;
                            const talent = talentId ? forceTalents.find(t => t.id === talentId) : null;
                            rowData.push({ talentId, talent, cost, fieldName });
                          }
                          gridData.push(rowData);
                        }
                        
                        // Track merged cells
                        const merged = new Set();
                        
                        return (
                          <div className="flex" style={{ width: 'max-content', minWidth: '1650px', margin: '0 auto', overflow: 'auto' }}>
                            <table
                              className="border-separate text-center text-xs sm:text-sm"
                              style={{ borderSpacing: '0', width: '100%', minWidth: '1650px' }}
                            >
                              <tbody>
                                {gridData.map((row, rowIndex) => (
                                  <>
                                    {/* Empty row above each line of abilities (except top row) */}
                                    {rowIndex !== 0 && (
                                      <tr key={`empty-${rowIndex}`}>
                                        {row.map((cell, colIndex) => {
                                          const cellKey = `empty-${rowIndex}-${colIndex}`;
                                          let colSpan = 1;
                                          if (cell.talentId) {
                                            for (let i = colIndex + 1; i < row.length; i++) {
                                              if (row[i].talentId === cell.talentId) {
                                                colSpan++;
                                              } else {
                                                break;
                                              }
                                            }
                                          }
                                          // Skip if this cell was already counted in a previous colspan
                                          if (colIndex > 0 && row[colIndex - 1].talentId === cell.talentId) {
                                            return null;
                                          }
                                          return (
                                            <>
                                              <td key={cellKey} style={{ border: 'none', width: `${300 * colSpan}px`, height: '10px' }}></td>
                                              <td key={`${cellKey}-spacer`} style={{ border: 'none', width: '10px', height: '10px' }}></td>
                                            </>
                                          );
                                        })}
                                      </tr>
                                    )}
                                    <tr key={rowIndex} className="bg-gray-100">
                                    {rowIndex === 0 ? (
                                      // Top row: single cell stretches across all columns (abilities + empty boxes)
                                      <td
                                        key="top-ability"
                                        colSpan={row.length * 2}
                                        className="p-2 align-top"
                                        style={{
                                          position: 'relative',
                                          border: row[0].talent ? '2px solid black' : 'none',
                                          width: `${300 * row.length + 10 * (row.length - 1)}px`,
                                          height: '176px',
                                        }}
                                      >
                                        {row[0].talent && (
                                          <div className="text-xs sm:text-sm h-full overflow-hidden flex flex-col">
                                            <div className="font-bold text-left">{row[0].talent.talent_name}</div>
                                            <div className="border-b border-black my-1"></div>
                                            <div className="text-xs text-gray-700 flex-1">{row[0].talent.description}</div>
                                            <div className="text-right text-xs font-bold mt-auto">{row[0].cost} EXP</div>
                                          </div>
                                        )}
                                      </td>
                                    ) : (
                                      row.map((cell, colIndex) => {
                                        const cellKey = `${rowIndex}-${colIndex}`;
                                        if (merged.has(cellKey)) return null;
                                        // ...existing code...
                                        let colSpan = 1;
                                        if (cell.talentId) {
                                          for (let i = colIndex + 1; i < row.length; i++) {
                                            if (row[i].talentId === cell.talentId && !merged.has(`${rowIndex}-${i}`)) {
                                              colSpan++;
                                              merged.add(`${rowIndex}-${i}`);
                                            } else {
                                              break;
                                            }
                                          }
                                        }
                                        return (
                                          <>
                                            <td
                                              key={cellKey}
                                              colSpan={colSpan}
                                              className="p-2 align-top"
                                              style={{
                                                position: 'relative',
                                                border: cell.talent ? '2px solid black' : 'none',
                                                width: cell.talent ? `${300 * colSpan}px` : '0px',
                                                height: '176px',
                                              }}
                                            >
                                              {cell.talent && (
                                                <div className="text-xs sm:text-sm h-full overflow-hidden flex flex-col">
                                                  <div className="font-bold text-left">{cell.talent.talent_name}</div>
                                                  <div className="border-b border-black my-1"></div>
                                                  <div className="text-xs text-gray-700 flex-1">{cell.talent.description}</div>
                                                  <div className="text-right text-xs font-bold mt-auto">{cell.cost} EXP</div>
                                                </div>
                                              )}
                                              {cell.talent && (() => {
                                                const linksFieldName = `ability_${rowIndex + 1}_${colIndex + 1}_links`;
                                                const linksStr = currentTree[linksFieldName] || '';
                                                const linksList = linksStr.split(',').map(l => l.trim()).filter(l => l);
                                                return (
                                                  <>
                                                    {linksList.includes('Up') && (
                                                      <div style={{ position: 'absolute', top: rowIndex === 1 ? '-18px' : '-8px', left: '50%', width: '2px', height: rowIndex === 1 ? '18px' : '8px', backgroundColor: 'black', transform: 'translateX(-50%)' }} />
                                                    )}
                                                    {linksList.includes('Down') && rowIndex < gridData.length - 1 && (
                                                      <div style={{ position: 'absolute', bottom: '-8px', left: '50%', width: '2px', height: '8px', backgroundColor: 'black', transform: 'translateX(-50%)' }} />
                                                    )}
                                                    {linksList.includes('Left') && colIndex > 0 && (
                                                      <div style={{ position: 'absolute', top: '50%', left: '-10px', width: '10px', height: '2px', backgroundColor: 'black', transform: 'translateY(-50%)' }} />
                                                    )}
                                                    {linksList.includes('Right') && colIndex < 3 && (
                                                      <div style={{ position: 'absolute', top: '50%', right: '-10px', width: '10px', height: '2px', backgroundColor: 'black', transform: 'translateY(-50%)' }} />
                                                    )}
                                                  </>
                                                );
                                              })()}
                                            </td>
                                            <td style={{ border: 'none', width: '10px', height: '176px' }}></td>
                                          </>
                                        );
                                      })
                                    )}
                                  </tr>
                                  </>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'Backstory' && (
        <div className="border-2 border-black rounded-lg p-2 sm:p-4 w-full text-center mb-4" style={{ minHeight: '500px' }}>
          <h2 className="font-bold text-base sm:text-lg mb-3">Backstory</h2>
          <textarea
            value={backstory}
            onChange={(e) => setBackstory(e.target.value)}
            className="border border-black rounded p-2 w-full h-96 text-left text-sm sm:text-base"
            placeholder="Enter your character's backstory here..."
          />
        </div>
      )}

      {selectedRace && activeTab === 'Finish' && (
        <div className="border-2 border-black rounded-lg p-2 sm:p-4 w-full text-center mb-4" style={{ minHeight: '500px' }}>
          <h2 className="font-bold text-base sm:text-lg mb-6">Finish</h2>
          <button onClick={handleFinishCharacter} className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm sm:text-base">
            Finish Character
          </button>
        </div>
      )}

      {!selectedRace && activeTab !== 'Species' && (
        <div className="border-2 border-black rounded-lg p-4 sm:p-8 w-full text-center mb-4" style={{ minHeight: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p className="text-2xl sm:text-3xl font-bold text-red-600">Please choose a Species first</p>
        </div>
      )}
      </>

    </div>
  );
}