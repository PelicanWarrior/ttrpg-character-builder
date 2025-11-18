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
  const [selectedStartingSkill, setSelectedStartingSkill] = useState('');
  const [selectedStartingSkill2, setSelectedStartingSkill2] = useState('');
  const [skillRanks, setSkillRanks] = useState({});
  const [careers, setCareers] = useState([]);
  const [selectedCareer, setSelectedCareer] = useState('');
  const [selectedCareerSkills, setSelectedCareerSkills] = useState(['', '', '', '']);
  const [specializations, setSpecializations] = useState([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [selectedSpecSkill1, setSelectedSpecSkill1] = useState('');
  const [selectedSpecSkill2, setSelectedSpecSkill2] = useState('');
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

  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const createCharacter = queryParams.get('create_character') === 'true';

  const CHARACTERISTICS = ['Brawn', 'Agility', 'Intellect', 'Cunning', 'Willpower', 'Presence'];

  useEffect(() => {
    const fetchAndLoadData = async () => {
      const [raceResponse, skillResponse, statCostResponse, careerResponse, specResponse, abilityResponse, treeResponse, pictureResponse] = await Promise.all([
        supabase.from('races').select('*'),
        supabase.from('skills').select('*'),
        supabase.from('SW_stat_increase').select('*'),
        supabase.from('SW_career').select('*'),
        supabase.from('SW_spec').select('*'),
        supabase.from('SW_abilities').select('*'),
        supabase.from('SW_spec_tree').select('*'),
        supabase.from('SW_pictures').select('*'),
      ]);

      if (raceResponse.error) {
        console.error('Error fetching races:', raceResponse.error);
      } else {
        const sortedRaces = (raceResponse.data || []).sort((a, b) => a.name.localeCompare(b.name));
        setRaces(sortedRaces);
      }

      if (skillResponse.error) {
        console.error('Error fetching skills:', skillResponse.error);
      } else {
        const sortedSkills = (skillResponse.data || []).sort((a, b) => a.skill.localeCompare(b.skill));
        setSkills(sortedSkills);
        const initialRanks = {};
        sortedSkills.forEach((skill) => {
          initialRanks[skill.skill] = 0;
        });
        setSkillRanks(initialRanks);
      }

      if (statCostResponse.error) {
        console.error('Error fetching stat costs:', statCostResponse.error);
      } else {
        setStatCosts(statCostResponse.data || []);
      }

      if (careerResponse.error) {
        console.error('Error fetching careers:', careerResponse.error);
      } else {
        setCareers(careerResponse.data || []);
      }

      if (specResponse.error) {
        console.error('Error fetching specializations:', specResponse.error);
      } else {
        setSpecializations(specResponse.data || []);
      }

      if (abilityResponse.error) {
        console.error('Error fetching abilities:', abilityResponse.error);
      } else {
        setAbilities(abilityResponse.data || []);
      }

      if (treeResponse.error) {
        console.error('Error fetching talent tree:', treeResponse.error);
      } else {
        setTalentTree(treeResponse.data || []);
      }

      if (pictureResponse.error) {
        console.error('Error fetching pictures:', pictureResponse.error);
      } else {
        setRacePictures(pictureResponse.data || []);
      }

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

            if (playerError) {
              console.error('Error fetching player data:', playerError);
            } else if (playerData) {
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
                if (skillsArray.length > 0) setSelectedStartingSkill(skillsArray[0]);
                if (skillsArray.length > 1) setSelectedStartingSkill2(skillsArray[1]);
              }

              if (playerData.career) {
                setSelectedCareer(playerData.career);
              }
              if (playerData.career_skills) {
                const loadedCareerSkills = playerData.career_skills.split(',').map(skill => skill.trim()).filter(skill => skill);
                setSelectedCareerSkills(loadedCareerSkills.concat(Array(4 - loadedCareerSkills.length).fill('')).slice(0, 4));
              }

              if (playerData.spec) {
                setSelectedSpecialization(playerData.spec);
              }

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
                      if (link === 'Down' && row < 4) {
                        const downIndex = (row + 1) * 4 + col;
                        clickable.add(downIndex);
                      }
                      if (link === 'Up' && row > 0) {
                        const upIndex = (row - 1) * 4 + col;
                        clickable.add(upIndex);
                      }
                      if (link === 'Left' && col > 0) {
                        const leftIndex = row * 4 + (col - 1);
                        clickable.add(leftIndex);
                      }
                      if (link === 'Right' && col < 3) {
                        const rightIndex = row * 4 + (col + 1);
                        clickable.add(rightIndex);
                      }
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

  useEffect(() => {
    if (selectedRace && racePictures.length > 0) {
      const matchingPictures = racePictures.filter(pic => pic.race_ID === selectedRace.id);
      console.log(`[DEBUG] Species: ${selectedRace.name} (ID: ${selectedRace.id})`);
      console.log(`[DEBUG] Matching pictures in SW_pictures:`, matchingPictures);
      
      if (matchingPictures.length > 0) {
        const randomPic = matchingPictures[Math.floor(Math.random() * matchingPictures.length)];
        setSelectedPictureId(randomPic.id);
        console.log(`[DEBUG] Selected picture ID: ${randomPic.id}`);
        console.log(`[DEBUG] Image URL: /SW_Pictures/Picture ${randomPic.id} Face.png`);
      } else {
        setSelectedPictureId(null);
        console.log('[DEBUG] No matching pictures found for this species.');
      }
    } else {
      setSelectedPictureId(null);
      if (selectedRace) {
        console.log(`[DEBUG] No pictures loaded or racePictures is empty. racePictures length: ${racePictures.length}`);
      }
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
    
    if (selectedStartingSkill && skillRanks[selectedStartingSkill] !== undefined) {
      setSkillRanks(prevRanks => ({
        ...prevRanks,
        [selectedStartingSkill]: Math.max(0, prevRanks[selectedStartingSkill] - 1),
      }));
    }
    if (selectedStartingSkill2 && skillRanks[selectedStartingSkill2] !== undefined) {
      setSkillRanks(prevRanks => ({
        ...prevRanks,
        [selectedStartingSkill2]: Math.max(0, prevRanks[selectedStartingSkill2] - 1),
      }));
    }

    setSelectedRace(race || null);
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
    setSelectedStartingSkill('');
    setSelectedStartingSkill2('');
    setSelectedTalents([]);
    setClickableTalents([0, 1, 2, 3]);
    setStartingTalents([]);
  };

  const updateStat = (statName, delta) => {
    setSelectedRace(prevRace => {
      if (!prevRace) return prevRace;
      const baseValue = baseStats[statName] || 0;
      const currentValue = prevRace[statName] || baseValue;
      if (delta > 0) {
        const newRank = currentValue + delta;
        const cost = statCosts.find(c => c.rank === newRank)?.exp || 0;
        if (exp >= cost) {
          setExp(exp - cost);
          const updatedRace = { ...prevRace, [statName]: newRank };
          if (statName === 'brawn') {
            setWoundThreshold(woundThreshold + delta);
          } else if (statName === 'willpower') {
            setStrainThreshold(strainThreshold + delta);
          }
          return updatedRace;
        } else {
          console.log('Not enough EXP to increase stat');
          return prevRace;
        }
      } else if (delta < 0) {
        if (currentValue > baseValue) {
          const currentRank = currentValue;
          const cost = statCosts.find(c => c.rank === currentRank)?.exp || 0;
          setExp(exp + cost);
          const updatedRace = { ...prevRace, [statName]: currentValue + delta };
          if (statName === 'brawn') {
            setWoundThreshold(woundThreshold + delta);
          } else if (statName === 'willpower') {
            setStrainThreshold(strainThreshold + delta);
          }
          return updatedRace;
        } else {
          console.log('Cannot decrease below base value');
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
        if (skillName === selectedStartingSkill && currentRank === 1) {
          alert('You cannot decrease your starter skill');
          return prevRanks;
        }
        if (currentRank > 0) {
          const currentCost = statCosts.find(c => c.rank === currentRank)?.exp || 0;
          setExp(exp + currentCost);
          return { ...prevRanks, [skillName]: currentRank + delta };
        } else {
          console.log('Cannot decrease below 0 rank');
          return prevRanks;
        }
      }
      return prevRanks;
    });
  };

  const getBaseStatValue = (statName) => {
    return selectedRace?.[statName.toLowerCase()] || 0;
  };

  const handleStartingSkillChange = (e) => {
    const newSkill = e.target.value;
    setSelectedStartingSkill(newSkill);
    
    if (selectedStartingSkill && skillRanks[selectedStartingSkill] !== undefined) {
      setSkillRanks((prevRanks) => ({
        ...prevRanks,
        [selectedStartingSkill]: Math.max(0, prevRanks[selectedStartingSkill] - 1),
      }));
    }

    if (newSkill) {
      setSkillRanks((prevRanks) => ({
        ...prevRanks,
        [newSkill]: (prevRanks[newSkill] || 0) + 1,
      }));
    }

    if (selectedStartingSkill2 && selectedStartingSkill2 === newSkill) {
      setSelectedStartingSkill2('');
    }
  };

  const handleStartingSkill2Change = (e) => {
    const newSkill = e.target.value;
    setSelectedStartingSkill2(newSkill);
    
    if (selectedStartingSkill2 && skillRanks[selectedStartingSkill2] !== undefined) {
      setSkillRanks((prevRanks) => ({
        ...prevRanks,
        [selectedStartingSkill2]: Math.max(0, prevRanks[selectedStartingSkill2] - 1),
      }));
    }

    if (newSkill) {
      setSkillRanks((prevRanks) => ({
        ...prevRanks,
        [newSkill]: (prevRanks[newSkill] || 0) + 1,
      }));
    }
  };

  const handleCareerChange = (e) => {
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

    setSelectedCareer(careerName);
    setSelectedCareerSkills(['', '', '', '']);
    setSelectedSpecialization('');
    setSelectedSpecSkill1('');
    setSelectedSpecSkill2('');
    setSelectedTalents([]);
    setClickableTalents([0, 1, 2, 3]);
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
    setSelectedTalents([]);
    setClickableTalents([0, 1, 2, 3]);
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

  const handleCareerSkillChange = (index) => (e) => {
    const newSkill = e.target.value;
    const oldSkill = selectedCareerSkills[index];
    const newSkills = [...selectedCareerSkills];
    newSkills[index] = newSkill;
    setSelectedCareerSkills(newSkills);
    if (newSkill) {
      setSkillRanks(prevRanks => ({
        ...prevRanks,
        [newSkill]: (prevRanks[newSkill] || 0) + 1,
      }));
    }
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

  const getStartingSkillOptions = () => {
    if (!selectedRace) return [];

    if (selectedRace.name === 'Human') {
      return skills.map(s => ({ name: s.skill, type: s.type })).sort((a, b) => a.name.localeCompare(b.name));
    }

    if (selectedRace.name === 'Human(Mandolorian)') {
      return skills
        .filter(s => s.type === 'Combat' || s.type === 'Knowledge')
        .map(s => ({ name: s.skill, type: s.type }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    return selectedRace.Starting_Skill?.split(',')
      .map(s => s.trim())
      .filter(s => s)
      .map(skillName => {
        const skill = skills.find(s => s.skill === skillName);
        return { name: skillName, type: skill?.type || '' };
      })
      .sort((a, b) => a.name.localeCompare(b.name)) || [];
  };

  const showSecondSkill = selectedRace?.name === 'Human' || 
    (selectedRace?.name === 'Human(Mandolorian)' && 
     selectedStartingSkill && 
     skills.find(s => s.skill === selectedStartingSkill)?.type === 'Knowledge');

  const getSecondSkillOptions = () => {
    if (!showSecondSkill) return [];
    
    if (selectedRace?.name === 'Human') {
      return skills
        .filter(s => s.skill !== selectedStartingSkill)
        .map(s => ({ name: s.skill, type: s.type }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    
    if (selectedRace?.name === 'Human(Mandolorian)' && selectedStartingSkill) {
      const firstSkillType = skills.find(s => s.skill === selectedStartingSkill)?.type;
      if (firstSkillType === 'Knowledge') {
        return skills
          .filter(s => s.type === 'Knowledge' && s.skill !== selectedStartingSkill)
          .map(s => ({ name: s.skill, type: s.type }))
          .sort((a, b) => a.name.localeCompare(b.name));
      }
    }
    
    return [];
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
    } else if (rank < 0) {
      const yCount = Math.max(0, baseStat + rank);
      dicePool = 'G'.repeat(yCount) + 'Y'.repeat(baseStat - yCount);
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
    const specSkillsString = [selectedSpecSkill1, selectedSpecSkill2].filter(skill => skill).join(', ');
    const startingTalentsString = buildStartingTalentsString();

    const finalSpecSkills = [specSkillsString, startingTalentsString].filter(s => s).join(', ');

    const { talentTreeString, talentString } = buildTalentStrings();
    const startingTalentsForTalentsField = startingTalentsString ? (talentString ? `${talentString}, ${startingTalentsString}` : startingTalentsString) : talentString;

    const startingSkillCombined = selectedStartingSkill2 
      ? `${selectedStartingSkill}, ${selectedStartingSkill2}` 
      : selectedStartingSkill;

    if (characterId) {
      const { error: updateError } = await supabase
        .from('SW_player_characters')
        .update({
          name: characterName,
          race: selectedRace?.name || '',
          brawn: selectedRace?.brawn,
          agility: selectedRace?.agility,
          intellect: selectedRace?.intellect,
          cunning: selectedRace?.cunning,
          willpower: selectedRace?.willpower,
          presence: selectedRace?.presence,
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
        })
        .eq('user_number', userId)
        .eq('id', characterId);

      if (updateError) {
        console.error('Error updating character:', updateError);
      } else {
        alert(`${characterName} is saved`);
      }
    } else {
      const { data, error } = await supabase.from('SW_player_characters').insert([
        {
          user_number: userId,
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
          wound_current: woundThreshold,
          strain_current: strainThreshold,
        },
      ]).select();

      if (error) {
        console.error('Error saving character:', error);
      } else {
        setCharacterId(data[0].id);
        alert(`${characterName} is saved`);
      }
    }
  };

  const handleFinishCharacter = async () => {
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
    const specSkillsString = [selectedSpecSkill1, selectedSpecSkill2].filter(skill => skill).join(', ');
    const startingTalentsString = buildStartingTalentsString();

    const finalSpecSkills = [specSkillsString, startingTalentsString].filter(s => s).join(', ');

    const { talentTreeString, talentString } = buildTalentStrings();
    const startingTalentsForTalentsField = startingTalentsString ? (talentString ? `${talentString}, ${startingTalentsString}` : startingTalentsString) : talentString;

    const startingSkillCombined = selectedStartingSkill2 
      ? `${selectedStartingSkill}, ${selectedStartingSkill2}` 
      : selectedStartingSkill;

    if (characterId) {
      const { error: updateError } = await supabase
        .from('SW_player_characters')
        .update({
          name: characterName,
          race: selectedRace?.name || '',
          brawn: selectedRace?.brawn,
          agility: selectedRace?.agility,
          intellect: selectedRace?.intellect,
          cunning: selectedRace?.cunning,
          willpower: selectedRace?.willpower,
          presence: selectedRace?.presence,
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
        })
        .eq('user_number', userId)
        .eq('id', characterId);

      if (updateError) {
        console.error('Error updating character:', updateError);
      } else {
        localStorage.setItem('loadedCharacterId', characterId);
        navigate('/SW_character_overview');
      }
    } else {
      const { data, error } = await supabase.from('SW_player_characters').insert([
        {
          user_number: userId,
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
          wound_current: woundThreshold,
          strain_current: strainThreshold,
        },
      ]).select();

      if (error) {
        console.error('Error saving character:', error);
      } else {
        setCharacterId(data[0].id);
        localStorage.setItem('loadedCharacterId', data[0].id);
        navigate('/SW_character_overview');
      }
    }
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
          if (match) {
            choiceType = match[1].toLowerCase();
          }
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
            if (link === 'Down' && selRow < 4) {
              newClickable.add((selRow + 1) * 4 + selCol);
            }
            if (link === 'Up' && selRow > 0) {
              newClickable.add((selRow - 1) * 4 + selCol);
            }
            if (link === 'Left' && selCol > 0) {
              newClickable.add(selRow * 4 + (selCol - 1));
            }
            if (link === 'Right' && selCol < 3) {
              newClickable.add(selRow * 4 + (selCol + 1));
            }
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
      if (talentData.links.includes('Down') && row < 4) {
        newClickable.add((row + 1) * 4 + (index % 4));
      }
      if (talentData.links.includes('Up') && row > 0) {
        newClickable.add((row - 1) * 4 + (index % 4));
      }
      if (talentData.links.includes('Left') && index % 4 > 0) {
        newClickable.add(index - 1);
      }
      if (talentData.links.includes('Right') && index % 4 < 3) {
        newClickable.add(index + 1);
      }
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

  return (
    <div className="flex flex-col items-center min-h-screen bg-white py-10" style={{ maxWidth: '1600px', minWidth: '1600px', margin: '0 auto' }}>
      <img
        src="/SWEotE.webp"
        alt="Star Wars: Edge of the Empire"
        className="w-64 mb-6"
      />

      <div className="border-2 border-black rounded-lg p-4 w-full text-center mb-4" style={{ minHeight: '100px' }}>
        <div className="flex space-x-2">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save
          </button>
          <button
            onClick={handleSelectTTRPG}
            className="flex-1 px-2 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Select TTRPG
          </button>
        </div>
      </div>

      <div className="border-2 border-black rounded-lg p-6 w-full text-center mb-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-1/2">
            <label className="block font-bold text-lg mb-2">Character Name</label>
            <input
              type="text"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              className="border border-black rounded px-4 py-2 w-full text-center text-xl"
              placeholder="Enter character name"
            />
          </div>

          <div className="flex items-center justify-center space-x-6">
            <h2 className="font-bold text-xl">EXP:</h2>
            <button
              onClick={() => handleExpChange(-1)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-lg"
            >
              −
            </button>
            <span className="border-4 border-black rounded px-8 py-3 font-bold text-3xl min-w-32 text-center">
              {exp}
            </span>
            <button
              onClick={() => handleExpChange(1)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-lg"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="w-full mb-4">
        <div className="flex border-2 border-black rounded-lg overflow-hidden">
          <button
            onClick={() => handleTabClick('Species')}
            className={`px-6 py-2 font-semibold ${activeTab === 'Species' ? 'bg-blue-600 text-white' : 'bg-white text-black hover:bg-gray-100'}`}
          >
            Species
          </button>
          <button
            onClick={() => handleTabClick('Stats')}
            className={`px-6 py-2 font-semibold ${activeTab === 'Stats' ? 'bg-blue-600 text-white' : 'bg-white text-black hover:bg-gray-100'}`}
          >
            Stats
          </button>
          <button
            onClick={() => handleTabClick('Skills')}
            className={`px-6 py-2 font-semibold ${activeTab === 'Skills' ? 'bg-blue-600 text-white' : 'bg-white text-black hover:bg-gray-100'}`}
          >
            Skills
          </button>
          <button
            onClick={() => handleTabClick('Career')}
            className={`px-6 py-2 font-semibold ${activeTab === 'Career' ? 'bg-blue-600 text-white' : 'bg-white text-black hover:bg-gray-100'}`}
          >
            Career
          </button>
          <button
            onClick={() => handleTabClick('Talent Tree')}
            className={`px-6 py-2 font-semibold ${activeTab === 'Talent Tree' ? 'bg-blue-600 text-white' : 'bg-white text-black hover:bg-gray-100'}`}
          >
            Talent Tree
          </button>
          <button
            onClick={() => handleTabClick('Backstory')}
            className={`px-6 py-2 font-semibold ${activeTab === 'Backstory' ? 'bg-blue-600 text-white' : 'bg-white text-black hover:bg-gray-100'}`}
          >
            Backstory
          </button>
          <button
            onClick={() => handleTabClick('Finish')}
            className={`px-6 py-2 font-semibold ${activeTab === 'Finish' ? 'bg-blue-600 text-white' : 'bg-white text-black hover:bg-gray-100'}`}
          >
            Finish
          </button>
        </div>
      </div>

      {activeTab === 'Species' && (
        <div className="border-2 border-black rounded-lg p-4 w-full text-center mb-4" style={{ minHeight: '500px' }}>
          <h2 className="font-bold text-lg mb-4">Select Species</h2>
          <div className="flex justify-center mb-6">
            <select
              onChange={handleRaceChange}
              className="border border-black rounded px-4 py-2 text-lg"
              value={selectedRace?.name || ''}
            >
              <option value="">Select Species</option>
              {races.map((race) => (
                <option key={race.id} value={race.name}>
                  {race.name}
                </option>
              ))}
            </select>
          </div>

          {selectedRace && (
            <>
              <div className="flex gap-8 mb-6">
                {/* Species Image - Shrunk to fit image only */}
                <div className="flex flex-col items-center">
                  <h3 className="font-bold text-base mb-2">Species Image</h3>
                  {selectedPictureId ? (
                    <img
                      src={`/SW_Pictures/Picture ${selectedPictureId} Face.png`}
                      alt={`${selectedRace.name} portrait`}
                      className="border border-black rounded object-contain"
                      style={{ maxHeight: '200px', width: 'auto' }}
                      onLoad={() => console.log(`[DEBUG] Image loaded: /SW_Pictures/Picture ${selectedPictureId} Face.png`)}
                      onError={(e) => {
                        console.error(`[DEBUG] Failed to load: /SW_Pictures/Picture ${selectedPictureId} Face.png`);
                        console.error('[DEBUG] Check filename and path.');
                      }}
                    />
                  ) : (
                    <div className="w-48 h-48 border border-dashed border-gray-400 rounded flex items-center justify-center bg-gray-100">
                      <p className="text-gray-500">No image</p>
                    </div>
                  )}
                </div>

                {/* Species Description */}
                <div className="flex-1">
                  <h3 className="font-bold text-base mb-2">Species Description</h3>
                  <div className="text-left p-4 border border-black rounded bg-gray-50 h-48 overflow-y-auto">
                    {selectedRace.description || 'No description available'}
                  </div>

                  {/* Starting Skills & Talents - Directly under Description */}
                  <div className="mt-4">
                    <h3 className="font-bold text-base mb-2">Starting Skills & Talents</h3>
                    <div className="text-left p-4 border border-black rounded bg-gray-50 h-48 overflow-y-auto space-y-3">
                      <div>
                        <h4 className="font-semibold">Starting Skill</h4>
                        <select
                          value={selectedStartingSkill}
                          onChange={handleStartingSkillChange}
                          className="border border-black rounded px-2 py-1 w-full mt-1"
                        >
                          <option value="">Select Starting Skill</option>
                          {getStartingSkillOptions().map((skill, index) => (
                            <option key={index} value={skill.name}>
                              {skill.name} ({skill.type})
                            </option>
                          ))}
                        </select>

                        {showSecondSkill && (
                          <div className="mt-3">
                            <label className="font-semibold block mb-1">Second Starting Skill</label>
                            <select
                              value={selectedStartingSkill2}
                              onChange={handleStartingSkill2Change}
                              className="border border-black rounded px-2 py-1 w-full"
                            >
                              <option value="">Select Second Skill</option>
                              {getSecondSkillOptions().map((skill, i) => (
                                <option key={i} value={skill.name}>
                                  {skill.name} ({skill.type})
                                </option>
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

      {!selectedRace && activeTab !== 'Species' && (
        <div className="border-2 border-black rounded-lg p-8 w-full text-center mb-4" style={{ minHeight: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p className="text-3xl font-bold text-red-600">Please choose a Species first</p>
        </div>
      )}

      {selectedRace && activeTab === 'Stats' && (
        <div className="border-2 border-black rounded-lg p-4 w-full text-center mb-4" style={{ minHeight: '400px', display: 'flex', justifyContent: 'center' }}>
          <h2 className="font-bold text-lg mb-3">Stats</h2>
          <table className="border border-black text-center" style={{ tableLayout: 'auto', margin: '0 auto' }}>
            <tbody>
              <tr className="bg-gray-100">
                <th className="border border-black py-1">Brawn</th>
                <td className="border border-black py-1">
                  <button onClick={() => updateStat('brawn', -1)} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">-</button>
                  <span style={{ color: 'black', margin: '0 8px' }}>{getBaseStatValue('brawn')}</span>
                  <button onClick={() => updateStat('brawn', 1)} classname="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">+</button>
                </td>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-black py-1">Agility</th>
                <td className="border border-black py-1">
                  <button onClick={() => updateStat('agility', -1)} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">-</button>
                  <span style={{ color: 'black', margin: '0 8px' }}>{getBaseStatValue('agility')}</span>
                  <button onClick={() => updateStat('agility', 1)} className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">+</button>
                </td>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-black py-1">Intellect</th>
                <td className="border border-black py-1">
                  <button onClick={() => updateStat('intellect', -1)} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">-</button>
                  <span style={{ color: 'black', margin: '0 8px' }}>{getBaseStatValue('intellect')}</span>
                  <button onClick={() => updateStat('intellect', 1)} className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">+</button>
                </td>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-black py-11">Cunning</th>
                <td className="border border-black py-1">
                  <button onClick={() => updateStat('cunning', -1)} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">-</button>
                  <span style={{ color: 'black', margin: '0 4px' }}>{getBaseStatValue('cunning')}</span>
                  <button onClick={() => updateStat('cunning', 1)} className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">+</button>
                </td>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-black py-1">Willpower</th>
                <td className="border border-black py-1">
                  <button onClick={() => updateStat('willpower', -1)} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">-</button>
                  <span style={{ color: 'black', margin: '0 8px' }}>{getBaseStatValue('willpower')}</span>
                  <button onClick={() => updateStat('willpower', 1)} className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">+</button>
                </td>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-black py-1">Presence</th>
                <td className="border border-black py-1">
                  <button onClick={() => updateStat('presence', -1)} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">-</button>
                  <span style={{ color: 'black', margin: '0 8px' }}>{getBaseStatValue('presence')}</span>
                  <button onClick={() => updateStat('presence', 1)} className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">+</button>
                </td>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-black py-1">Wound Threshold</th>
                <td className="border border-black py-1" style={{ color: 'black' }}>{woundThreshold}</td>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-black py-1">Strain Threshold</th>
                <td className="border border-black py-1" style={{ color: 'black' }}>{strainThreshold}</td>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-black py-1">Species Attack</th>
                <td className="border border-black py-1" style={{ color: 'black' }}>{selectedRace.Race_Attack}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {selectedRace && activeTab === 'Skills' && skills.length > 0 && (
        <div className="border-2 border-black rounded-lg p-4 w-full text-center mb-4" style={{ minHeight: '400px', display: 'flex', justifyContent: 'center' }}>
          <h2 className="font-bold text-lg mb-3">Skills</h2>
          <table className="border border-black text-center" style={{ tableLayout: 'auto', margin: '0 auto' }}>
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
        <div className="border-2 border-black rounded-lg p-4 w-full text-center mb-4" style={{ minHeight: '500px', position: 'relative' }}>
          <h2 className="font-bold text-lg mb-3">Career</h2>
          <div className="flex justify-between" style={{ minHeight: 'calc(100% - 40px)' }}>
            <div className="w-1/2 pr-4 text-left">
              <div className="mb-4">
                <label className="block font-bold text-base mb-2">Select Career</label>
                <select
                  value={selectedCareer}
                  onChange={handleCareerChange}
                  className="border border-black rounded px-2 py-1 w-full text-center"
                >
                  <option value="">Select Career</option>
                  {careers.map((career) => (
                    <option key={career.id} value={career.name}>
                      {career.name}
                    </option>
                  ))}
                </select>
              </div>
              {selectedCareer && (
                <div>
                  <h3 className="font-bold text-base mb-1">Description</h3>
                  <div className="text-gray-700 mb-4" style={{ maxHeight: '100px', overflowY: 'auto' }}>
                    {careers.find(c => c.name === selectedCareer)?.description || 'No description available'}
                  </div>
                  <div className="mt-4">
                    <h3 className="font-bold text-base mb-1">Career Skills</h3>
                    {['First Skill', 'Second Skill', 'Third Skill', 'Fourth Skill'].map((label, index) => (
                      <div key={index} className="mb-2">
                        <label className="block font-bold text-base mb-1">{label}</label>
                        <select
                          value={selectedCareerSkills[index] || ''}
                          onChange={handleCareerSkillChange(index)}
                          className="border border-black rounded px-2 py-1 w-full text-center"
                        >
                          <option value="">Select Skill</option>
                          {getAvailableSkills(index).map((skill, i) => (
                            <option key={i} value={skill}>
                              {skill}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="w-1/2 pl-4 text-left">
              <div className="mb-4">
                <h3 className="font-bold text-base mb-2">Career Specialization</h3>
                <select
                  value={selectedSpecialization}
                  onChange={handleSpecializationChange}
                  className="border border-black rounded px-2 py-1 w-full text-center"
                >
                  <option value="">Select Specialization</option>
                  {specializations
                    .filter(spec => {
                      const career = careers.find(c => c.id === spec.Career);
                      return career && career.name === selectedCareer;
                    })
                    .map((spec, index) => (
                      <option key={index} value={spec.spec_name}>
                        {spec.spec_name}
                      </option>
                    ))}
                </select>
              </div>
              {selectedSpecialization && (
                <div>
                  <h4 className="font-bold text-base mb-1">Description</h4>
                  <div className="text-gray-700 mb-4" style={{ maxHeight: '100px', overflowY: 'auto' }}>
                    {specializations.find(s => s.spec_name === selectedSpecialization)?.description || 'No description available'}
                  </div>
                  <div className="mt-2">
                    <label className="block font-bold text-base mb-1">Specialization Skill 1</label>
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
                    <label className="block font-bold text-base mb-1">Specialization Skill 2</label>
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
                </div>
              )}
            </div>
          </div>
          <div style={{ position: 'absolute', top: '40px', left: '50%', width: '2px', height: 'calc(100% - 40px)', backgroundColor: 'black', transform: 'translateX(-50%)' }}></div>
        </div>
      )}

      {selectedRace && activeTab === 'Talent Tree' && specializations.length > 0 && (
        <div className="border-2 border-black rounded-lg p-6 w-full text-center mb-4" style={{ minHeight: '500px' }}>
          <h2 className="font-bold text-lg mb-4">Talent Tree</h2>
          {selectedSpecialization ? (
            <div className="flex justify-center">
              <table className="border-separate text-center" style={{ borderSpacing: '0' }}>
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
                          const isFirstInRow = talentIndex === 0;
                          const isFirstInCol = adjustedRowIndex === 0;
                          return (
                            <td
                              key={colIndex}
                              className={isTalentBox ? 'p-2 align-top' : 'p-2'}
                              style={{
                                position: 'relative',
                                border: isTalentBox ? '2px solid black' : 'none',
                                width: isTalentBox ? '388.8px' : '16px',
                                height: isTalentBox ? '176px' : '16px',
                              }}
                            >
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
                                          setTalentChoices(prev => ({
                                            ...prev,
                                            [index]: value
                                          }));
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
                                          <option 
                                            key={char} 
                                            value={char}
                                            disabled={getBaseStatValue(char.toLowerCase()) >= 6}
                                          >
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
                                  {talent.links.includes('Up') && !isFirstInCol && adjustedRowIndex > 0 && (
                                    <div
                                      style={{
                                        position: 'absolute',
                                        top: '-26px',
                                        left: '50%',
                                        width: '2px',
                                        height: '26px',
                                        backgroundColor: 'black',
                                        transform: 'translateX(-50%)',
                                      }}
                                    />
                                  )}
                                  {talent.links.includes('Down') && adjustedRowIndex < 4 && (
                                    <div
                                      style={{
                                        position: 'absolute',
                                        bottom: '-26px',
                                        left: '50%',
                                        width: '2px',
                                        height: '26px',
                                        backgroundColor: 'black',
                                        transform: 'translateX(-50%)',
                                      }}
                                    />
                                  )}
                                  {talent.links.includes('Left') && !isFirstInRow && talentIndex > 0 && (
                                    <div
                                      style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '-10px',
                                        width: '10px',
                                        height: '2px',
                                        backgroundColor: 'black',
                                        transform: 'translateY(-50%)',
                                      }}
                                    />
                                  )}
                                  {talent.links.includes('Right') && talentIndex < 3 && (
                                    <div
                                      style={{
                                        position: 'absolute',
                                        top: '50%',
                                        right: '-10px',
                                        width: '10px',
                                        height: '2px',
                                        backgroundColor: 'black',
                                        transform: 'translateY(-50%)',
                                      }}
                                    />
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
        <div className="border-2 border-black rounded-lg p-4 w-full text-center mb-4" style={{ minHeight: '500px' }}>
          <h2 className="font-bold text-lg mb-3">Backstory</h2>
          <textarea
            value={backstory}
            onChange={(e) => setBackstory(e.target.value)}
            className="border border-black rounded p-2 w-full h-96 text-left"
            placeholder="Enter your character's backstory here..."
          />
        </div>
      )}

      {selectedRace && activeTab === 'Finish' && (
        <div className="border-2 border-black rounded-lg p-4 w-full text-center mb-4" style={{ minHeight: '500px' }}>
          <h2 className="font-bold text-lg mb-6">Finish</h2>
          <button
            onClick={handleFinishCharacter}
            className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Finish Character
          </button>
        </div>
      )}
    </div>
  );
}