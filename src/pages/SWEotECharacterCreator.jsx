import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function SWEotECharacterCreator() {
  const [characterName, setCharacterName] = useState('');
  const [characterId, setCharacterId] = useState(null);
  const [races, setRaces] = useState([]);
  const [selectedRace, setSelectedRace] = useState(null);
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
  const [specializations, setSpecializations] = useState([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [selectedSpecSkill1, setSelectedSpecSkill1] = useState('');
  const [selectedSpecSkill2, setSelectedSpecSkill2] = useState('');
  const [selectedSpecSkill3, setSelectedSpecSkill3] = useState('');
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
  const [racePictures, setRacePictures] = useState([]);
  const [selectedPictureId, setSelectedPictureId] = useState(null);
  const [isForceSensitiveCareer, setIsForceSensitiveCareer] = useState(false);
  const [isDroidSpecies, setIsDroidSpecies] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [careerPictures, setCareerPictures] = useState([]);
  const [selectedCareerPictureId, setSelectedCareerPictureId] = useState(null);
  const [specPictures, setSpecPictures] = useState([]);
  const [selectedSpecPictureId, setSelectedSpecPictureId] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const createCharacter = queryParams.get('create_character') === 'true';

  const CHARACTERISTICS = ['Brawn', 'Agility', 'Intellect', 'Cunning', 'Willpower', 'Presence'];

  // Parse "X and Y" or single skill
  const parseStartingSkills = (text) => {
    if (!text || typeof text !== 'string') return { isPaired: false, skills: [] };
    const trimmed = text.trim();
    const andMatch = trimmed.match(/^(.+?)\s+and\s+(.+)$/i);
    if (andMatch) {
      return {
        isPaired: true,
        skills: [andMatch[1].trim(), andMatch[2].trim()]
      };
    }
    return {
      isPaired: false,
      skills: trimmed.split(',').map(s => s.trim()).filter(Boolean)
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
        pictureResponse
      ] = await Promise.all([
        supabase.from('races').select('*'),
        supabase.from('skills').select('*'),
        supabase.from('SW_stat_increase').select('*'),
        supabase.from('SW_career').select('*'),
        supabase.from('SW_spec').select('*'),
        supabase.from('SW_abilities').select('*'),
        supabase.from('SW_spec_tree').select('*'),
        supabase.from('SW_pictures').select('*'),
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
      else setRacePictures(pictureResponse.data || []);

      // Separate race and career pictures
      const allPictures = pictureResponse.data || [];
      const careerPicsOnly = allPictures.filter(pic => pic.career_ID);
      const specPicsOnly = allPictures.filter(pic => pic.spec_ID);
      setCareerPictures(careerPicsOnly);
      setSpecPictures(specPicsOnly);

      if (!createCharacter) {
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

              if (playerData.starting_skill) {
                const skillsArray = playerData.starting_skill.split(',').map(s => s.trim()).filter(s => s);
                if (skillsArray.length > 0) setSelectedStartingSkill1(skillsArray[0]);
                if (skillsArray.length > 1) setSelectedStartingSkill2(skillsArray[1]);
              }

              // Check for Mandalorian second skill visibility after loading starting skills
              if (playerData.race === 'Human(Mandolorian)' && playerData.starting_skill) {
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
      } else {
        setClickableTalents([0, 1, 2, 3]);
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
    } else if (selectedRace.name === 'Human(Mandolorian)') {
      const combatKnowledge = skills.filter(s => s.type === 'Combat' || s.type === 'Knowledge');
      const knowledge = skills.filter(s => s.type === 'Knowledge');
      firstOptions = combatKnowledge;
      secondOptions = knowledge;
    } else if (selectedRace.Starting_Skill && selectedRace.Starting_Skill.trim()) {
      const { isPaired, skills: parsedSkills } = parseStartingSkills(selectedRace.Starting_Skill);

      if (isPaired) {
        setIsPairedSkillRace(true);
        firstOptions = skills.filter(s => s.skill === parsedSkills[0]);
        secondOptions = skills.filter(s => s.skill === parsedSkills[1]);
      } else {
        setIsPairedSkillRace(false);
        firstOptions = skills.filter(s => parsedSkills.includes(s.skill));
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
      const matchingPictures = racePictures.filter(pic => pic.race_ID === selectedRace.id);
      if (matchingPictures.length > 0) {
        const randomPic = matchingPictures[Math.floor(Math.random() * matchingPictures.length)];
        setSelectedPictureId(randomPic.id);
      } else {
        setSelectedPictureId(null);
      }
    } else {
      setSelectedPictureId(null);
    }
  }, [selectedRace, racePictures]);

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

    if (selectedRace?.name === 'Human(Mandolorian)') {
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

    // Find spec picture(s) and randomly pick one, ensuring it's different from career picture
    if (specName) {
      const spec = specializations.find(s => s.spec_name === specName);
      if (spec && specPictures.length > 0) {
        const matchingPictures = specPictures.filter(pic => pic.spec_ID === spec.id);
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
      return;
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
    };

    if (characterId) {
      const { error: updateError } = await supabase
        .from('SW_player_characters')
        .update(commonFields)
        .eq('user_number', userId)
        .eq('id', characterId);

      if (updateError) console.error('Error updating character:', updateError);
      else alert(`${characterName} is saved`);
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

      if (error) console.error('Error saving character:', error);
      else {
        setCharacterId(data[0].id);
        alert(`${characterName} is saved`);
      }
    }
  };

  const handleFinishCharacter = async () => {
    await handleSave();
    localStorage.setItem('loadedCharacterId', characterId || localStorage.getItem('loadedCharacterId'));
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
    if (!selectedRace && tab !== 'Species') {
      alert('Please choose a Species first');
      setActiveTab('Species');
    } else {
      setActiveTab(tab);
    }
  };

  const formatCareerName = (career) => {
    return career.Force_Sensitive ? `${career.name} (Force Sensitive)` : career.name;
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
      <img src="/SWEotE.webp" alt="Star Wars: Edge of the Empire" className="w-40 sm:w-48 md:w-64 mb-4 sm:mb-6" />

      <div className="border-2 border-black rounded-lg p-2 sm:p-4 w-full text-center mb-4" style={{ minHeight: '80px' }}>
        <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
          <button onClick={handleSave} className="flex-1 px-2 sm:px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm sm:text-base">Save</button>
          <button onClick={handleSelectTTRPG} className="flex-1 px-2 sm:px-2 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm sm:text-base">Select TTRPG</button>
        </div>
      </div>

      <div className="border-2 border-black rounded-lg p-3 sm:p-6 w-full text-center mb-4">
        <div className="flex flex-col items-center space-y-3 sm:space-y-4">
          <div className="w-full sm:w-1/2">
            <label className="block font-bold text-base sm:text-lg mb-2">Character Name</label>
            <input
              type="text"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              className="border border-black rounded px-3 sm:px-4 py-2 w-full text-center text-lg sm:text-xl"
              placeholder="Enter character name"
            />
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

      <div className="w-full mb-4">
        <div className="flex flex-wrap border-2 border-black rounded-lg overflow-hidden">
          <button onClick={() => handleTabClick('Species')} className={`flex-1 min-w-max px-2 sm:px-4 md:px-6 py-2 font-semibold text-xs sm:text-sm md:text-base ${activeTab === 'Species' ? 'bg-blue-600 text-white' : 'bg-white text-black hover:bg-gray-100'}`}>Species</button>
          <button onClick={() => handleTabClick('Stats')} className={`flex-1 min-w-max px-2 sm:px-4 md:px-6 py-2 font-semibold text-xs sm:text-sm md:text-base ${activeTab === 'Stats' ? 'bg-blue-600 text-white' : 'bg-white text-black hover:bg-gray-100'}`}>Stats</button>
          <button onClick={() => handleTabClick('Skills')} className={`flex-1 min-w-max px-2 sm:px-4 md:px-6 py-2 font-semibold text-xs sm:text-sm md:text-base ${activeTab === 'Skills' ? 'bg-blue-600 text-white' : 'bg-white text-black hover:bg-gray-100'}`}>Skills</button>
          <button onClick={() => handleTabClick('Career')} className={`flex-1 min-w-max px-2 sm:px-4 md:px-6 py-2 font-semibold text-xs sm:text-sm md:text-base ${activeTab === 'Career' ? 'bg-blue-600 text-white' : 'bg-white text-black hover:bg-gray-100'}`}>Career</button>
          <button onClick={() => handleTabClick('Talent Tree')} className={`flex-1 min-w-max px-2 sm:px-4 md:px-6 py-2 font-semibold text-xs sm:text-sm md:text-base ${activeTab === 'Talent Tree' ? 'bg-blue-600 text-white' : 'bg-white text-black hover:bg-gray-100'}`}>Talent Tree</button>
          <button onClick={() => handleTabClick('Backstory')} className={`flex-1 min-w-max px-2 sm:px-4 md:px-6 py-2 font-semibold text-xs sm:text-sm md:text-base ${activeTab === 'Backstory' ? 'bg-blue-600 text-white' : 'bg-white text-black hover:bg-gray-100'}`}>Backstory</button>
          <button onClick={() => handleTabClick('Finish')} className={`flex-1 min-w-max px-2 sm:px-4 md:px-6 py-2 font-semibold text-xs sm:text-sm md:text-base ${activeTab === 'Finish' ? 'bg-blue-600 text-white' : 'bg-white text-black hover:bg-gray-100'}`}>Finish</button>
        </div>
      </div>

      {activeTab === 'Species' && (
        <div className="border-2 border-black rounded-lg p-3 sm:p-4 w-full text-center mb-4" style={{ minHeight: '500px' }}>
          <h2 className="font-bold text-lg mb-4">Select Species</h2>
          <div className="flex justify-center mb-6">
            <select onChange={handleRaceChange} className="border border-black rounded px-3 sm:px-4 py-2 text-base sm:text-lg" value={selectedRace?.name || ''}>
              <option value="">Select Species</option>
              {races.map((race) => (
                <option key={race.id} value={race.name}>{race.name}</option>
              ))}
            </select>
          </div>

          {selectedRace && (
            <>
              <div className="flex flex-col md:flex-row gap-4 md:gap-8 mb-6">
                <div className="flex flex-col items-center md:flex-none">
                  <h3 className="font-bold text-base mb-2">Species Image</h3>
                  {selectedPictureId ? (
                    <img src={`/SW_Pictures/Picture ${selectedPictureId} Face.png`} alt={`${selectedRace.name} portrait`} className="border border-black rounded object-contain" style={{ maxHeight: '200px', width: 'auto' }} />
                  ) : (
                    <div className="w-40 sm:w-48 h-40 sm:h-48 border border-dashed border-gray-400 rounded flex items-center justify-center bg-gray-100">
                      <p className="text-gray-500 text-sm">No image</p>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-bold text-base mb-2">Species Description</h3>
                  <div className="text-left p-3 sm:p-4 border border-black rounded bg-gray-50 h-48 overflow-y-auto text-sm sm:text-base">
                    {selectedRace.description || 'No description available'}
                  </div>

                  <div className="mt-4">
                    <h3 className="font-bold text-base mb-2">Starting Skills & Talents</h3>
                    <div className="text-left p-3 sm:p-4 border border-black rounded bg-gray-50 h-64 overflow-y-auto space-y-4 text-sm sm:text-base">

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
                        {selectedRace.name === 'Human(Mandolorian)' && selectedStartingSkill1 && showSecondMandalorianSkill && !isPairedSkillRace && (
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
              <tr className="bg-gray-100"><th className="border border-black py-1">Brawn</th><td className="border border-black py-1"><button onClick={() => updateStat('brawn', -1)} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">-</button><span style={{ color: 'black', margin: '0 8px' }}>{getBaseStatValue('brawn')}</span><button onClick={() => updateStat('brawn', 1)} className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">+</button></td></tr>
              <tr className="bg-gray-100"><th className="border border-black py-1">Agility</th><td className="border border-black py-1"><button onClick={() => updateStat('agility', -1)} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">-</button><span style={{ color: 'black', margin: '0 8px' }}>{getBaseStatValue('agility')}</span><button onClick={() => updateStat('agility', 1)} className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">+</button></td></tr>
              <tr className="bg-gray-100"><th className="border border-black py-1">Intellect</th><td className="border border-black py-1"><button onClick={() => updateStat('intellect', -1)} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">-</button><span style={{ color: 'black', margin: '0 8px' }}>{getBaseStatValue('intellect')}</span><button onClick={() => updateStat('intellect', 1)} className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">+</button></td></tr>
              <tr className="bg-gray-100"><th className="border border-black py-1">Cunning</th><td className="border border-black py-1"><button onClick={() => updateStat('cunning', -1)} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">-</button><span style={{ color: 'black', margin: '0 4px' }}>{getBaseStatValue('cunning')}</span><button onClick={() => updateStat('cunning', 1)} className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">+</button></td></tr>
              <tr className="bg-gray-100"><th className="border border-black py-1">Willpower</th><td className="border border-black py-1"><button onClick={() => updateStat('willpower', -1)} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">-</button><span style={{ color: 'black', margin: '0 8px' }}>{getBaseStatValue('willpower')}</span><button onClick={() => updateStat('willpower', 1)} className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">+</button></td></tr>
              <tr className="bg-gray-100"><th className="border border-black py-1">Presence</th><td className="border border-black py-1"><button onClick={() => updateStat('presence', -1)} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">-</button><span style={{ color: 'black', margin: '0 8px' }}>{getBaseStatValue('presence')}</span><button onClick={() => updateStat('presence', 1)} className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">+</button></td></tr>
              <tr className="bg-gray-100"><th className="border border-black py-1">Wound Threshold</th><td className="border border-black py-1" style={{ color: 'black' }}>{woundThreshold}</td></tr>
              <tr className="bg-gray-100"><th className="border border-black py-1">Strain Threshold</th><td className="border border-black py-1" style={{ color: 'black' }}>{strainThreshold}</td></tr>
              <tr className="bg-gray-100"><th className="border border-black py-1">Species Attack</th><td className="border border-black py-1" style={{ color: 'black' }}>{selectedRace.Race_Attack}</td></tr>
            </tbody>
          </table>
        </div>
      )}

      {selectedRace && activeTab === 'Skills' && skills.length > 0 && (
        <div className="border-2 border-black rounded-lg p-2 sm:p-4 w-full text-center mb-4 overflow-x-auto" style={{ minHeight: '400px', display: 'flex', justifyContent: 'center' }}>
          <h2 className="font-bold text-base sm:text-lg mb-3">Skills</h2>
          <table className="border border-black text-center text-xs sm:text-sm md:text-base" style={{ tableLayout: 'auto', margin: '0 auto' }}>
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black py-1">Skill</th>
                <th className="border border-black py-1">Rank</th>
                <th className="border border-black py-1">Dice Pool</th>
              </tr>
            </thead>
            <tbody>
              {skills.map((skill, index) => (
                <tr key={index} className="bg-gray-100">
                  <td className="border border-black py-1">{skill.skill}</td>
                  <td className="border border-black py-1">
                    <button onClick={() => updateSkillRank(skill.skill, -1)} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">-</button>
                    <span style={{ color: 'black', margin: '0 8px' }}>{getSkillRank(skill.skill)}</span>
                    <button onClick={() => updateSkillRank(skill.skill, 1)} className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">+</button>
                  </td>
                  <td className="border border-black py-1" style={{ color: 'black' }}>
                    {getDicePool(skill.skill, skill.stat)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedRace && activeTab === 'Career' && careers.length > 0 && (
        <div className="border-2 border-black rounded-lg p-2 sm:p-4 w-full text-center mb-4" style={{ minHeight: '500px', position: 'relative' }}>
          <h2 className="font-bold text-lg mb-3">Career</h2>
          <div className="flex flex-col md:flex-row justify-between" style={{ minHeight: 'calc(100% - 40px)' }}>
            <div className="w-full md:w-1/2 md:pr-4 text-left mb-4 md:mb-0">
              <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="block text-base whitespace-nowrap" style={{fontWeight: 'bold'}}>Select Career</label>
                <select
                  value={selectedCareer}
                  onChange={handleCareerChange}
                  className="border border-black rounded px-2 py-1 w-full sm:flex-1 text-center"
                >
                  <option value="">Select Career</option>
                  {careers
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((career) => (
                      <option key={career.id} value={career.name}>
                        {formatCareerName(career)}
                      </option>
                    ))}
                </select>
              </div>
              {selectedCareer && (
                <>
                  <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                    {selectedCareerPictureId && (
                      <img 
                        src={`/SW_Pictures/Picture ${selectedCareerPictureId}.png`} 
                        alt={`${selectedCareer} portrait`} 
                        className="rounded object-contain"
                        style={{ 
                          maxWidth: '120px', 
                          height: 'auto',
                          marginRight: '16px',
                          marginBottom: '16px',
                          flexShrink: 0
                        }} 
                      />
                    )}
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <label className="block text-base mb-1" style={{fontWeight: 'bold'}}>Description</label>
                      <div className="text-gray-700 mb-4" style={{ height: '140px' }}>
                        {careers.find(c => c.name === selectedCareer)?.description || 'No description available'}
                      </div>
                    </div>
                  </div>
                  <label className="block text-base mt-4" style={{fontWeight: 'bold'}}>Career Skills{isDroidSpecies && ' (6 available)'}</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '150px' }}>
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
                </>
              )}
            </div>
            <div className="w-full md:w-1/2 md:pl-4 text-left">
              <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <label className="block text-base whitespace-nowrap" style={{fontWeight: 'bold'}}>Career Specialization</label>
                <select
                  value={selectedSpecialization}
                  onChange={handleSpecializationChange}
                  className="border border-black rounded px-2 py-1 w-full sm:flex-1 text-center"
                >
                  <option value="">Select Specialization</option>
                  {specializations
                    .filter(spec => {
                      const career = careers.find(c => c.id === spec.Career);
                      return career && career.name === selectedCareer;
                    })
                    .sort((a, b) => a.spec_name.localeCompare(b.spec_name))
                    .map((spec, index) => (
                      <option key={index} value={spec.spec_name}>
                        {spec.spec_name}
                      </option>
                    ))}
                </select>
              </div>
              {selectedSpecialization && (
                <>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    {selectedSpecPictureId && (
                      <img 
                        src={`/SW_Pictures/Picture ${selectedSpecPictureId}.png`} 
                        alt={`${selectedSpecialization} portrait`} 
                        className="rounded object-contain"
                        style={{ 
                          maxWidth: '120px', 
                          height: 'auto',
                          marginRight: '16px',
                          marginBottom: '16px',
                          flexShrink: 0
                        }} 
                      />
                    )}
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <label className="block text-base mb-1" style={{fontWeight: 'bold'}}>Description</label>
                      <div className="text-gray-700 mb-4" style={{ height: '140px' }}>
                        {specializations.find(s => s.spec_name === selectedSpecialization)?.description || 'No description available'}
                      </div>
                    </div>
                  </div>
                  <label className="block text-base mt-4" style={{fontWeight: 'bold'}}>Specialization Skills</label>
                  <div>
                    <div className="mt-2">
                      <label className="block text-base mb-1" style={{fontWeight: 'bold'}}>Skill 1</label>
                      <select
                        value={selectedSpecSkill1}
                        onChange={handleSpecSkill1Change}
                        className="border border-black rounded px-2 py-1 w-full text-center"
                      >
                        <option value="">Select Skill</option>
                        {specializations
                          .find(s => s.spec_name === selectedSpecialization)
                          ?.spec_skills?.split(',')
                          .map((skill, i) => (
                            <option key={i} value={skill.trim()} disabled={skill.trim() === selectedSpecSkill2}>
                              {skill.trim()}
                            </option>
                          )) || []}
                      </select>
                    </div>
                    <div className="mt-2">
                      <label className="block text-base mb-1" style={{fontWeight: 'bold'}}>Skill 2</label>
                      <select
                        value={selectedSpecSkill2}
                        onChange={handleSpecSkill2Change}
                        className="border border-black rounded px-2 py-1 w-full text-center"
                      >
                        <option value="">Select Skill</option>
                        {specializations
                          .find(s => s.spec_name === selectedSpecialization)
                          ?.spec_skills?.split(',')
                          .map((skill, i) => (
                            <option key={i} value={skill.trim()} disabled={skill.trim() === selectedSpecSkill1}>
                              {skill.trim()}
                            </option>
                          )) || []}
                      </select>
                    </div>
                    {isDroidSpecies && (
                      <div className="mt-2">
                        <label className="block text-base mb-1" style={{fontWeight: 'bold'}}>Skill 3</label>
                        <select
                          value={selectedSpecSkill3 || ''}
                          onChange={handleSpecSkill3Change}
                          className="border border-black rounded px-2 py-1 w-full text-center"
                        >
                          <option value="">Select Skill</option>
                          {specializations
                            .find(s => s.spec_name === selectedSpecialization)
                            ?.spec_skills?.split(',')
                            .map((skill, i) => (
                              <option key={i} value={skill.trim()} disabled={skill.trim() === selectedSpecSkill1 || skill.trim() === selectedSpecSkill2}>
                                {skill.trim()}
                              </option>
                            )) || []}
                        </select>
                      </div>
                    )}
                    {isAdmin && (
                      <div className="mt-4">
                        <button
                          onClick={handleCopyPrompt}
                          className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 font-semibold"
                        >
                          Copy Prompt
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="hidden md:block" style={{ position: 'absolute', top: '40px', left: '50%', width: '2px', height: 'calc(100% - 40px)', backgroundColor: 'black', transform: 'translateX(-50%)' }}></div>
        </div>
      )}

      {selectedRace && activeTab === 'Talent Tree' && specializations.length > 0 && (
        <div className="border-2 border-black rounded-lg p-2 sm:p-4 md:p-6 w-full text-center mb-4 overflow-x-auto" style={{ minHeight: '500px' }}>
          <h2 className="font-bold text-base sm:text-lg md:text-xl mb-4">Talent Tree</h2>
          {selectedSpecialization ? (
            <div className="flex justify-center">
              <table className="border-separate text-center text-xs sm:text-sm" style={{ borderSpacing: '0' }}>
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
          ) : (
            <p className="text-gray-700">Select a specialization to view its talent tree.</p>
          )}
        </div>
      )}

      {selectedRace && activeTab === 'Backstory' && (
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
    </div>
  );
}