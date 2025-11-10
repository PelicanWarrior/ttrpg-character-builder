import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function SWCharacterOverview() {
  const [characterName, setCharacterName] = useState('');
  const [race, setRace] = useState('');
  const [brawn, setBrawn] = useState(0);
  const [agility, setAgility] = useState(0);
  const [intellect, setIntellect] = useState(0);
  const [cunning, setCunning] = useState(0);
  const [willpower, setWillpower] = useState(0);
  const [presence, setPresence] = useState(0);
  const [career, setCareer] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [backstory, setBackstory] = useState('');
  const [skills, setSkills] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [inventory, setInventory] = useState([]); // For non-armour items
  const [armour, setArmour] = useState([]); // For armour items
  const [characterId, setCharacterId] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [woundThreshold, setWoundThreshold] = useState(0);
  const [strainThreshold, setStrainThreshold] = useState(0);
  const [woundCurrent, setWoundCurrent] = useState(0);
  const [strainCurrent, setStrainCurrent] = useState(0);
  const [credits, setCredits] = useState(0);
  const [totalSoak, setTotalSoak] = useState(0); // New state for total Soak
  const [activeTab, setActiveTab] = useState('skills'); // New state for tab management
  const [abilities, setAbilities] = useState([]); // New state for abilities
  const [skillBonuses, setSkillBonuses] = useState({}); // New: { skill: 'BB' }
  const [previousSoak, setPreviousSoak] = useState(null); // Track previous soak for logging
  const [raceAbilities, setRaceAbilities] = useState({ Race_Attack: '', ability: '' }); // New: race abilities

  const location = useLocation();
  const navigate = useNavigate();

  // Helper functions to get equipment details
  const getEquipment = () => {
    return equipment.find(e => e.name === selectedEquipment);
  };

  const getEquipmentSkill = () => {
    const equip = getEquipment();
    if (!equip || !equip.skill) return '';
    const skillData = skills.find(s => s.id === equip.skill);
    return skillData ? skillData.skill : '';
  };

  const getDicePoolForSkill = () => {
    const equip = getEquipment();
    if (!equip || !equip.skill) return '';
    const skillData = skills.find(s => s.id === equip.skill);
    return skillData ? getFinalDicePool(skillData.skill, skillData.stat) : '';
  };

  const getEquipmentRange = () => {
    const equip = getEquipment();
    return equip?.range || 'N/A';
  };

  const getEquipmentDamage = () => {
    const equip = getEquipment();
    return equip?.damage || '';
  };

  const getEquipmentCritical = () => {
    const equip = getEquipment();
    return equip?.critical || '';
  };

  const getEquipmentSpecial = () => {
    const equip = getEquipment();
    return equip?.special || '';
  };

  const getEquipmentSoak = () => {
    const equip = getEquipment();
    return equip?.soak || '';
  };

  const getEquipmentDefenceMelee = () => {
    const equip = getEquipment();
    return equip?.defence_melee || '';
  };

  const getEquipmentDefenceRange = () => {
    const equip = getEquipment();
    return equip?.defence_range || '';
  };

  // Enhanced dice pool with [Blue] from talents
  const getFinalDicePool = (skillName, statName) => {
    const baseStat = { brawn, agility, intellect, cunning, willpower, presence }[statName.toLowerCase()] || 0;
    const rank = skills.find(s => s.skill === skillName)?.rank || 0;
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
    // Add [Blue] from talents
    const blueBonus = skillBonuses[skillName] || '';
    return dicePool + blueBonus;
  };

  useEffect(() => {
    const fetchCharacterData = async () => {
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

      const playerId = userData.id;
      setPlayerId(playerId);

      const loadedCharacterId = localStorage.getItem('loadedCharacterId');
      if (!loadedCharacterId) {
        console.error('No character ID found in localStorage');
        return;
      }

      const { data: characterData, error: charError } = await supabase
        .from('SW_player_characters')
        .select('*, wound_threshold, strain_threshold, wound_current, strain_current, credits, talents')
        .eq('user_number', playerId)
        .eq('id', loadedCharacterId)
        .single();

      if (charError || !characterData) {
        console.error('Error fetching character data:', charError);
        return;
      }

      setCharacterId(characterData.id);
      setCharacterName(characterData.name || '');
      setRace(characterData.race || '');
      setBrawn(characterData.brawn || 0);
      setAgility(characterData.agility || 0);
      setIntellect(characterData.intellect || 0);
      setCunning(characterData.cunning || 0);
      setWillpower(characterData.willpower || 0);
      setPresence(characterData.presence || 0);
      setCareer(characterData.career || '');
      setSpecialization(characterData.spec || '');
      setBackstory(characterData.backstory || '');
      setCredits(characterData.credits ?? 0);

      // Base thresholds
      let baseWoundThreshold = characterData.wound_threshold || 0;
      let baseStrainThreshold = characterData.strain_threshold || 0;

      const woundCurrentValue = characterData.wound_current ?? baseWoundThreshold;
      const strainCurrentValue = characterData.strain_current ?? baseStrainThreshold;
      setWoundCurrent(woundCurrentValue);
      setStrainCurrent(strainCurrentValue);

      if (characterData.wound_current === null || characterData.wMeter_current === undefined) {
        const { error: updateError } = await supabase
          .from('SW_player_characters')
          .update({ wound_current: woundCurrentValue })
          .eq('id', loadedCharacterId);
        if (updateError) console.error('Error updating wound_current:', updateError);
      }
      if (characterData.strain_current === null || characterData.strain_current === undefined) {
        const { error: updateError } = await supabase
          .from('SW_player_characters')
          .update({ strain_current: strainCurrentValue })
          .eq('id', loadedCharacterId);
        if (updateError) console.error('Error updating strain_current:', updateError);
      }

      const skillRanks = characterData.skills_rank
        ? characterData.skills_rank.split(',').reduce((acc, skill) => {
            const trimmedSkill = skill.trim();
            acc[trimmedSkill] = (acc[trimmedSkill] || 0) + 1;
            return acc;
          }, {})
        : {};

      const { data: allSkills, error: skillsError } = await supabase.from('skills').select('id, skill, stat');
      if (skillsError || !allSkills) {
        console.error('Error fetching skills:', skillsError);
        return;
      }

      setSkills(allSkills.map(skill => ({
        id: skill.id,
        skill: skill.skill,
        rank: skillRanks[skill.skill] || 0,
        stat: skill.stat,
      })));

      // Fetch equipment with range included
      const { data: equipmentData, error: equipError } = await supabase
        .from('SW_equipment')
        .select('id, name, skill, damage, critical, special, soak, defence_melee, defence_range, range');
      if (equipError || !equipmentData) {
        console.error('Error fetching equipment:', equipError);
        return;
      }
      setEquipment(equipmentData);

      if (characterId) {
        const { data: inventoryData, error: invError } = await supabase
          .from('SW_character_equipment')
          .select('id, characterID, equipmentID, equipped')
          .eq('characterID', characterId);
        if (invError) {
          console.error('Error fetching inventory:', invError);
        } else if (inventoryData) {
          const enrichedInventory = await Promise.all(inventoryData.map(async (item) => {
            const equipId = parseInt(item.equipmentID, 10) || 0;
            const equipData = equipmentData.find(e => e.id === equipId);
            const skillData = allSkills.find(s => s.id === equipData?.skill);
            if (equipData?.soak) {
              return {
                id: item.id || 0,
                equipment_name: equipData?.name || '',
                soak: equipData?.soak || 0,
                defence_melee: equipData?.defence_melee || '',
                defence_range: equipData?.defence_range || '',
                special: equipData?.special || '',
                equipped: item.equipped || false,
              };
            } else {
              return {
                id: item.id || 0,
                equipment_name: equipData?.name || '',
                skill: skillData?.skill || '',
                damage: equipData?.damage || '',
                critical: equipData?.critical || '',
                special: equipData?.special || '',
                range: equipData?.range || 'N/A',
                equipped: item.equipped || false,
              };
            }
          }));
          setInventory(enrichedInventory.filter(item => !item.soak));
          setArmour(enrichedInventory.filter(item => item.soak));
        }
      }

      // ---- Talents / Abilities ----
      const talents = characterData.talents ? characterData.talents.split(',').map(t => t.trim()) : [];
      const talentCount = talents.reduce((acc, talent) => {
        // Strip (Melee), (Ranged), etc.
        const cleanName = talent.replace(/\s*\(.*\)$/, '').trim();
        acc[cleanName] = (acc[cleanName] || 0) + 1;
        return acc;
      }, {});
      const uniqueCleanTalents = Object.keys(talentCount);

      const { data: abilitiesData, error: abilitiesError } = await supabase
        .from('SW_abilities')
        .select('ability, description, activation, increase_stat')
        .in('ability', uniqueCleanTalents);
      if (abilitiesError || !abilitiesData) {
        console.error('Error fetching abilities:', abilitiesError);
        setAbilities([]);
        setSkillBonuses({});
      } else {
        const processedAbilities = abilitiesData.map(ability => {
          // Find original talent string (with brackets) to preserve for display
          const originalTalent = talents.find(t => t.replace(/\s*\(.*\)$/, '').trim() === ability.ability);
          // Extract skill from brackets: (Melee) → Melee
          const bracketMatch = originalTalent?.match(/\(([^)]+)\)/);
          const bracketSkill = bracketMatch ? bracketMatch[1].trim() : null;
          // Remove brackets for display name
          const displayName = originalTalent ? originalTalent.replace(/\s*\(.*\)$/, '').trim() : ability.ability;

          // Process description
          let finalDescription = ability.description;

          // Exception: Dedication — keep full description
          if (ability.ability !== 'Dedication' && bracketSkill) {
            // Remove first sentence up to first period
            const firstPeriodIndex = finalDescription.indexOf('.');
            if (firstPeriodIndex !== -1) {
              finalDescription = finalDescription.substring(firstPeriodIndex + 1).trim();
            }
            // Replace "that skill" with bracket skill
            finalDescription = finalDescription.replace(/\bthat skill\b/gi, bracketSkill);
          }

          // Special case: Dedication — inject bracket skill into description
          if (ability.ability === 'Dedication' && bracketSkill) {
            finalDescription = `Gain +1 to a single characteristic (${bracketSkill}). This cannot bring a characteristic above 6.`;
          }

          return {
            ...ability,
            displayName,
            finalDescription,
            rank: talentCount[ability.ability] || 1,
          };
        });

        // Sort abilities A-Z within each activation group
        const sortedAbilities = processedAbilities.sort((a, b) => {
          return a.displayName.localeCompare(b.displayName);
        });

        setAbilities(sortedAbilities);

        // Process increase_stat — only once per ability
        let woundBonus = 0;
        let strainBonus = 0;

        sortedAbilities.forEach(ability => {
          if (ability.increase_stat) {
            const stats = ability.increase_stat.split(',').map(s => s.trim());
            stats.forEach(stat => {
              if (stat === 'Wound') {
                woundBonus += ability.rank;
                console.log(`Ability "${ability.displayName}" (Rank ${ability.rank}) increases Wound Threshold by +${ability.rank}`);
              } else if (stat === 'Strain') {
                strainBonus += ability.rank;
                console.log(`Ability "${ability.displayName}" (Rank ${ability.rank}) increases Strain Threshold by +${ability.rank}`);
              }
            });
          }
        });

        // Apply bonuses
        const finalWoundThreshold = baseWoundThreshold + woundBonus;
        const finalStrainThreshold = baseStrainThreshold + strainBonus;

        setWoundThreshold(finalWoundThreshold);
        setStrainThreshold(finalStrainThreshold);

        setWoundCurrent(prev => Math.min(prev, finalWoundThreshold));
        setStrainCurrent(prev => Math.min(prev, finalStrainThreshold));

        // ---- [Blue] Dice Bonuses from Talents ----
        const newSkillBonuses = {};

        sortedAbilities.forEach(ability => {
          const desc = ability.description;
          const blueMatch = desc.match(/Add \[Blue\] per rank of [^ ]+ to all (.+?) checks/i);
          if (blueMatch) {
            const targetSkills = blueMatch[1].split(' and ').map(s => s.trim());
            const talentRank = ability.rank;
            const blueDice = 'B'.repeat(talentRank);
            targetSkills.forEach(skill => {
              if (allSkills.some(s => s.skill === skill)) {
                newSkillBonuses[skill] = (newSkillBonuses[skill] || '') + blueDice;
                console.log(`Talent "${ability.displayName}" (Rank ${talentRank}) adds ${blueDice} to ${skill} checks`);
              }
            });
          }
        });

        setSkillBonuses(newSkillBonuses);
      }

      // ---- Fetch Race Abilities ----
      if (characterData.race) {
        const { data: raceData, error: raceError } = await supabase
          .from('races')
          .select('Race_Attack, ability')
          .eq('name', characterData.race)
          .single();

        if (raceError || !raceData) {
          console.error('Error fetching race abilities:', raceError);
          setRaceAbilities({ Race_Attack: '', ability: '' });
        } else {
          const attack = raceData.Race_Attack?.trim() || '';
          const ability = raceData.ability?.trim() || '';
          setRaceAbilities({
            Race_Attack: attack === 'None' ? '' : attack,
            ability: ability === 'None' ? '' : ability,
          });
        }
      }

      // Initialize soak to Brawn on character load
      setTotalSoak(characterData.brawn || 0);
      setPreviousSoak(characterData.brawn || 0);
    };

    fetchCharacterData();
  }, [location, characterId]);

  // Recalculate total soak: Brawn + equipped armor soak
  const calculateTotalSoak = () => {
    const armorSoak = armour
      .filter(item => item.equipped && item.soak)
      .reduce((sum, item) => sum + (item.soak || 0), 0);
    return Math.max(0, brawn + armorSoak);
  };

  useEffect(() => {
    const newSoak = calculateTotalSoak();
    if (previousSoak === null) {
      // First load: initialize without logging
      setPreviousSoak(newSoak);
      setTotalSoak(newSoak);
    } else if (newSoak !== previousSoak) {
      const diff = newSoak - previousSoak;
      if (diff > 0) {
        console.log(`Soak increased by +${diff} → Total: ${newSoak} (Brawn: ${brawn} + Armor: ${newSoak - brawn})`);
      } else if (diff < 0) {
        console.log(`Soak decreased by ${diff} → Total: ${newSoak} (Brawn: ${brawn} + Armor: ${newSoak - brawn})`);
      }
      setPreviousSoak(newSoak);
      setTotalSoak(newSoak);
    }
  }, [brawn, armour, previousSoak]);

  const handleChooseTTRPG = () => {
    navigate('/select-ttrpg');
  };

  const handleAddToInventory = async () => {
    if (selectedEquipment && characterId) {
      const equipmentToAdd = equipment.find(e => e.name === selectedEquipment);
      if (equipmentToAdd) {
        const skillData = skills.find(s => s.id === equipmentToAdd.skill);
        if (equipmentToAdd.soak) {
          // Insert into DB first
          const { data, error } = await supabase
            .from('SW_character_equipment')
            .insert({
              characterID: characterId,
              equipmentID: equipmentToAdd.id,
              equipped: false,
            })
            .select();

          if (error) {
            console.error('Error adding armour to inventory:', error);
          } else if (data && data[0]) {
            const newArmourItem = {
              id: data[0].id,
              equipment_name: equipmentToAdd.name,
              soak: equipmentToAdd.soak || 0,
              defence_melee: equipmentToAdd.defence_melee || '',
              defence_range: equipmentToAdd.defence_range || '',
              special: equipmentToAdd.special || '',
              equipped: false,
            };
            setArmour(prev => [...prev, newArmourItem]);
            console.log('Armour added to inventory:', selectedEquipment);
            setSelectedEquipment('');
          }
        } else {
          const { data, error } = await supabase
            .from('SW_character_equipment')
            .insert({
              characterID: characterId,
              equipmentID: equipmentToAdd.id,
              equipped: false,
            })
            .select();

          if (error) {
            console.error('Error adding equipment to inventory:', error);
          } else if (data && data[0]) {
            const newInventoryItem = {
              id: data[0].id,
              equipment_name: equipmentToAdd.name,
              skill: skillData?.skill || '',
              damage: equipmentToAdd.damage,
              critical: equipmentToAdd.critical,
              special: equipmentToAdd.special || '',
              range: equipmentToAdd.range || 'N/A',
              equipped: false,
            };
            setInventory(prev => [...prev, newInventoryItem]);
            console.log('Equipment added to inventory:', selectedEquipment);
            setSelectedEquipment('');
          }
        }
      }
    }
  };

  // Fixed: Separate handlers for armour and weapons
  const handleArmourEquipToggle = async (index) => {
    const updatedArmour = [...armour];
    const currentEquipped = updatedArmour[index].equipped;
    updatedArmour[index].equipped = !currentEquipped;
    const itemId = updatedArmour[index].id;

    if (itemId && characterId) {
      const { error } = await supabase
        .from('SW_character_equipment')
        .update({ equipped: !currentEquipped })
        .eq('id', itemId);

      if (error) {
        console.error('Error updating armour equipped status:', error);
      } else {
        setArmour(updatedArmour);
      }
    }
  };

  const handleWeaponEquipToggle = async (index) => {
    const updatedInventory = [...inventory];
    const currentEquipped = updatedInventory[index].equipped;
    updatedInventory[index].equipped = !currentEquipped;
    const equipId = equipment.find(e => e.name === updatedInventory[index].equipment_name)?.id;

    if (equipId && characterId) {
      const { error } = await supabase
        .from('SW_character_equipment')
        .update({ equipped: !currentEquipped })
        .eq('characterID', characterId)
        .eq('equipmentID', equipId);

      if (error) {
        console.error('Error updating weapon equipped status:', error);
      } else {
        setInventory(updatedInventory);
      }
    }
  };

  const handleDeleteEquipment = async (index, isArmour = false) => {
    if (isArmour) {
      const itemToDelete = armour[index];
      if (itemToDelete.id && characterId) {
        const confirmDelete = confirm(`Do you really want to delete ${itemToDelete.equipment_name}?`);
        if (confirmDelete) {
          const { error } = await supabase
            .from('SW_character_equipment')
            .delete()
            .eq('id', itemToDelete.id);
          if (error) {
            console.error('Error deleting armour from inventory:', error);
          } else {
            const updatedArmour = [...armour];
            updatedArmour.splice(index, 1);
            setArmour(updatedArmour);
            console.log('Armour deleted from inventory:', itemToDelete.equipment_name);
          }
        }
      }
    } else {
      const itemToDelete = inventory[index];
      if (itemToDelete.id && characterId) {
        const confirmDelete = confirm(`Do you really want to delete ${itemToDelete.equipment_name}?`);
        if (confirmDelete) {
          const { error } = await supabase
            .from('SW_character_equipment')
            .delete()
            .eq('id', itemToDelete.id);
          if (error) {
            console.error('Error deleting equipment from inventory:', error);
          } else {
            const updatedInventory = [...inventory];
            updatedInventory.splice(index, 1);
            setInventory(updatedInventory);
            console.log('Equipment deleted from inventory:', itemToDelete.equipment_name);
          }
        }
      }
    }
  };

  const handleWoundChange = async (change) => {
    const newWoundCurrent = Math.max(0, Math.min(woundCurrent + change, woundThreshold));
    setWoundCurrent(newWoundCurrent);
    const { error } = await supabase
      .from('SW_player_characters')
      .update({ wound_current: newWoundCurrent })
      .eq('id', characterId);
    if (error) console.error('Error updating wound_current:', error);
  };

  const handleStrainChange = async (change) => {
    const newStrainCurrent = Math.max(0, Math.min(strainCurrent + change, strainThreshold));
    setStrainCurrent(newStrainCurrent);
    const { error } = await supabase
      .from('SW_player_characters')
      .update({ strain_current: newStrainCurrent })
      .eq('id', characterId);
    if (error) console.error('Error updating strain_current:', error);
  };

  const handleCreditsChange = async (e) => {
    const newCredits = parseInt(e.target.value) || 0;
    setCredits(newCredits);
    const { error } = await supabase
      .from('SW_player_characters')
      .update({ credits: newCredits })
      .eq('id', characterId);
    if (error) console.error('Error updating credits:', error);
  };

  // Build array of racial abilities for table
  const racialAbilityList = [];
  if (raceAbilities.Race_Attack) {
    const parts = raceAbilities.Race_Attack.split(':');
    const name = parts[0].trim();
    const description = parts.slice(1).join(':').trim();
    if (name && description) {
      racialAbilityList.push({ name, description });
    }
  }
  if (raceAbilities.ability) {
    const parts = raceAbilities.ability.split(':');
    const name = parts[0].trim();
    const description = parts.slice(1).join(':').trim();
    if (name && description) {
      racialAbilityList.push({ name, description });
    }
  }

  return (
    <div className="flex flex-col items-start min-h-screen bg-white py-10" style={{ maxWidth: '1600px', minWidth: '1600px', margin: '0 auto' }}>
      <div className="border-2 border-black rounded-lg p-4 w-full text-center mb-4">
        <button
          onClick={handleChooseTTRPG}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Choose TTRPG
        </button>
      </div>
      <h1 className="font-bold text-2xl mb-2">{characterName}</h1>
      <div className="flex items-center mb-4">
        <p>{race ? `${race} ${career} - ${specialization}` : `${career} - ${specialization}`}</p>
      </div>
      <div className="flex space-x-6 mb-4">
        <div className="border-2 border-black rounded-lg p-2 text-center w-28">
          <div className="font-bold">Brawn</div>
          <div>{brawn}</div>
        </div>
        <div className="border-2 border-black rounded-lg p-2 text-center w-28">
          <div className="font-bold">Agility</div>
          <div>{agility}</div>
        </div>
        <div className="border-2 border-black rounded-lg p-2 text-center w-28">
          <div className="font-bold">Intellect</div>
          <div>{intellect}</div>
        </div>
        <div className="border-2 border-black rounded-lg p-2 text-center w-28">
          <div className="font-bold">Cunning</div>
          <div>{cunning}</div>
        </div>
        <div className="border-2 border-black rounded-lg p-2 text-center w-28">
          <div className="font-bold">Willpower</div>
          <div>{willpower}</div>
        </div>
        <div className="border-2 border-black rounded-lg p-2 text-center w-28">
          <div className="font-bold">Presence</div>
          <div>{presence}</div>
        </div>
        <div className="border-2 border-black rounded-lg p-2 text-center w-28" style={{ color: 'white' }}>
          empty box
        </div>
        <div className="ml-4"></div>
        <div className="border-2 border-black rounded-lg p-2 text-center w-28">
          <div className="font-bold">Wound</div>
          <div className="flex justify-center items-center">
            <button
              onClick={() => handleWoundChange(-1)}
              className="px-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              -
            </button>
            <span className="mx-1">{woundCurrent}</span>
            <span className="mr-1">/ {woundThreshold}</span>
            <button
              onClick={() => handleWoundChange(1)}
              className="px-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              +
            </button>
          </div>
        </div>
        <div className="border-2 border-black rounded-lg p-2 text-center w-28">
          <div className="font-bold">Strain</div>
          <div className="flex justify-center items-center">
            <button
              onClick={() => handleStrainChange(-1)}
              className="px-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              -
            </button>
            <span className="mx-1">{strainCurrent}</span>
            <span className="mr-1">/ {strainThreshold}</span>
            <button
              onClick={() => handleStrainChange(1)}
              className="px-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              +
            </button>
          </div>
        </div>
        <div className="border-2 border-black rounded-lg p-2 text-center w-28" style={{ color: 'white' }}>
          Blank Box
        </div>
        <div className="border-2 border-black rounded-lg p-2 text-center w-28">
          <div className="font-bold">Soak</div>
          <div>{totalSoak}</div>
        </div>
      </div>
      <div className="w-full">
        <div className="flex border-b-2 border-black mb-4">
          <button
            className={`px-4 py-2 font-bold ${activeTab === 'skills' ? 'border-b-2 border-green-600 bg-gray-100' : ''}`}
            onClick={() => setActiveTab('skills')}
          >
            Skills
          </button>
          <button
            className={`px-4 py-2 font-bold ${activeTab === 'equipment' ? 'border-b-2 border-green-600 bg-gray-100' : ''}`}
            onClick={() => setActiveTab('equipment')}
          >
            Equipment
          </button>
          <button
            className={`px-4 py-2 font-bold ${activeTab === 'actions' ? 'border-b-2 border-green-600 bg-gray-100' : ''}`}
            onClick={() => setActiveTab('actions')}
          >
            Actions
          </button>
        </div>

        {/* ==== SKILLS TAB ==== */}
        {activeTab === 'skills' && (
          <div className="border-2 border-black rounded-lg p-4 text-left w-1/2 mr-4" style={{ minHeight: '400px' }}>
            <h2 className="font-bold text-lg mb-3">Skills</h2>
            <table className="border border-black text-left w-full" style={{ tableLayout: 'auto', margin: '0' }}>
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
                    <td className="border border-black py-1" style={{ color: 'black' }}>{skill.rank}</td>
                    <td className="border border-black py-1" style={{ color: 'black' }}>
                      {getFinalDicePool(skill.skill, skill.stat)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ==== EQUIPMENT TAB ==== */}
        {activeTab === 'equipment' && (
          <div className="flex-1 text-left" style={{ minHeight: '600px' }}>
            <h2 className="font-bold text-lg mb-3">Equipment</h2>
            <div className="mb-4">
              <div className="mt-4 text-right">
                <label className="mr-2 font-bold">Credits:</label>
                <input
                  type="number"
                  value={credits}
                  onChange={handleCreditsChange}
                  className="border-2 border-black rounded-lg p-1 w-24"
                  min="0"
                />
              </div>
              <select
                value={selectedEquipment}
                onChange={(e) => setSelectedEquipment(e.target.value)}
                className="border-2 border-black rounded-lg p-2 w-full mt-4"
              >
                <option value="">Select Equipment</option>
                {equipment
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((item, index) => (
                    <option key={index} value={item.name}>{item.name}</option>
                  ))}
              </select>
              {selectedEquipment && (
                <table className="border border-black w-full text-left mt-4" style={{ tableLayout: 'fixed' }}>
                  <thead>
                    <tr className="bg-gray-100">
                      {getEquipment()?.soak ? (
                        <>
                          <th className="border border-black py-1" style={{ minWidth: '75px' }}>Soak</th>
                          <th className="border border-black py-1" style={{ minWidth: '75px' }}>Defence Melee</th>
                          <th className="border border-black py-1" style={{ minWidth: '75px' }}>Defence Range</th>
                          <th className="border border-black py-1" style={{ minWidth: '700px', wordWrap: 'break-word' }}>Special</th>
                        </>
                      ) : (
                        <>
                          <th className="border border-black py-1" style={{ minWidth: '250px', wordWrap: 'break-word' }}>Skill (Dice Pool)</th>
                          <th className="border border-black py-1" style={{ minWidth: '150px' }}>Range</th>
                          <th className="border border-black py-1" style={{ minWidth: '50px' }}>Damage</th>
                          <th className="border border-black py-1" style={{ minWidth: '50px' }}>Critical</th>
                          <th className="border border-black py-1" style={{ minWidth: '700px', wordWrap: 'break-word' }}>Special</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-gray-100">
                      {getEquipment()?.soak ? (
                        <>
                          <td className="border border-black py-1" style={{ minWidth: '75px' }}>{getEquipmentSoak()}</td>
                          <td className="border border-black py-1" style={{ minWidth: '75px' }}>{getEquipmentDefenceMelee()}</td>
                          <td className="border border-black py-1" style={{ minWidth: '75px' }}>{getEquipmentDefenceRange()}</td>
                          <td className="border border-black py-1" style={{ minWidth: '700px', wordWrap: 'break-word' }}>{getEquipmentSpecial()}</td>
                        </>
                      ) : (
                        <>
                          <td className="border border-black py-1" style={{ minWidth: '250px', wordWrap: 'break-word' }}>
                            {getEquipmentSkill()} ({getDicePoolForSkill()})
                          </td>
                          <td className="border border-black py-1" style={{ minWidth: '150px' }}>
                            {getEquipmentRange()}
                          </td>
                          <td className="border border-black py-1" style={{ minWidth: '50px' }}>
                            {getEquipmentDamage()}
                          </td>
                          <td className="border border-black py-1" style={{ minWidth: '50px' }}>
                            {getEquipmentCritical()}
                          </td>
                          <td className="border border-black py-1" style={{ minWidth: '700px', wordWrap: 'break-word' }}>
                            {getEquipmentSpecial()}
                          </td>
                        </>
                      )}
                    </tr>
                  </tbody>
                </table>
              )}
              <div className="mt-4">
                <button
                  onClick={handleAddToInventory}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Add to Inventory
                </button>
              </div>

              <h3 className="font-bold text-lg mt-4">Weapons</h3>
              <table className="border border-black w-full text-left mt-4" style={{ tableLayout: 'fixed' }}>
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black py-1">Equipped</th>
                    <th className="border border-black py-1" style={{ minWidth: '250px', wordWrap: 'break-word' }}>Name</th>
                    <th className="border border-black py-1" style={{ minWidth: '250px', wordWrap: 'break-word' }}>Skill (Dice Pool)</th>
                    <th className="border border-black py-1" style={{ minWidth: '150px' }}>Range</th>
                    <th className="border border-black py-1" style={{ minWidth: '50px' }}>Damage</th>
                    <th className="border border-black py-1" style={{ minWidth: '50px' }}>Critical</th>
                    <th className="border border-black py-1" style={{ minWidth: '700px', wordWrap: 'break-word' }}>Special</th>
                    <th className="border border-black py-1">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item, index) => (
                    <tr key={index} className="bg-gray-100">
                      <td className="border border-black py-1">
                        <input
                          type="checkbox"
                          checked={item.equipped}
                          onChange={() => handleWeaponEquipToggle(index)}
                        />
                      </td>
                      <td className="border border-black py-1" style={{ minWidth: '250px', wordWrap: 'break-word' }}>{item.equipment_name}</td>
                      <td className="border border-black py-1" style={{ minWidth: '250px', wordWrap: 'break-word' }}>
                        {item.skill} ({getFinalDicePool(item.skill, skills.find(s => s.skill === item.skill)?.stat || 'agility')})
                      </td>
                      <td className="border border-black py-1" style={{ minWidth: '150px' }}>{item.range}</td>
                      <td className="border border-black py-1" style={{ minWidth: '50px' }}>{item.damage || ''}</td>
                      <td className="border border-black py-1" style={{ minWidth: '50px' }}>{item.critical || ''}</td>
                      <td className="border border-black py-1" style={{ minWidth: '700px', wordWrap: 'break-word' }}>{item.special || ''}</td>
                      <td className="border border-black py-1">
                        <button
                          onClick={() => handleDeleteEquipment(index)}
                          className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h3 className="font-bold text-lg mt-4">Armour</h3>
              <table className="border border-black w-full text-left mt-4" style={{ tableLayout: 'fixed' }}>
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black py-1">Equipped</th>
                    <th className="border border-black py-1" style={{ minWidth: '250px', wordWrap: 'break-word' }}>Name</th>
                    <th className="border border-black py-1" style={{ minWidth: '75px' }}>Soak</th>
                    <th className="border border-black py-1" style={{ minWidth: '75px' }}>Defence Melee</th>
                    <th className="border border-black py-1" style={{ minWidth: '75px' }}>Defence Range</th>
                    <th className="border border-black py-1" style={{ minWidth: '700px', wordWrap: 'break-word' }}>Special</th>
                    <th className="border border-black py-1">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {armour.map((item, index) => (
                    <tr key={index} className="bg-gray-100">
                      <td className="border border-black py-1">
                        <input
                          type="checkbox"
                          checked={item.equipped}
                          onChange={() => handleArmourEquipToggle(index)}
                        />
                      </td>
                      <td className="border border-black py-1" style={{ minWidth: '250px', wordWrap: 'break-word' }}>{item.equipment_name}</td>
                      <td className="border border-black py-1" style={{ minWidth: '75px' }}>{item.soak}</td>
                      <td className="border border-black py-1" style={{ minWidth: '75px' }}>{item.defence_melee}</td>
                      <td className="border border-black py-1" style={{ minWidth: '75px' }}>{item.defence_range}</td>
                      <td className="border border-black py-1" style={{ minWidth: '700px', wordWrap: 'break-word' }}>{item.special}</td>
                      <td className="border border-black py-1">
                        <button
                          onClick={() => handleDeleteEquipment(index, true)}
                          className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==== ACTIONS TAB ==== */}
        {activeTab === 'actions' && (
          <div className="border-2 border-black rounded-lg p-4 text-left w-1/2 mr-4" style={{ minHeight: '400px' }}>
            <h2 className="font-bold text-lg mb-3">Equipped Weapons</h2>
            <table className="border border-black w-full text-left" style={{ tableLayout: 'fixed' }}>
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black py-1" style={{ minWidth: '200px', wordWrap: 'break-word' }}>Name</th>
                  <th className="border border-black py-1" style={{ minWidth: '250px', wordWrap: 'break-word' }}>Skill (Dice Pool)</th>
                  <th className="border border-black py-1" style={{ minWidth: '150px' }}>Range</th>
                  <th className="border border-black py-1" style={{ minWidth: '100px' }}>Damage</th>
                  <th className="border border-black py-1" style={{ minWidth: '100px' }}>Critical</th>
                  <th className="border border-black py-1" style={{ minWidth: '700px', wordWrap: 'break-word' }}>Special</th>
                </tr>
              </thead>
              <tbody>
                {inventory
                  .filter(item => item.equipped && item.skill)
                  .map((item, index) => (
                    <tr key={index} className="bg-gray-100">
                      <td className="border border-black py-1" style={{ minWidth: '200px', wordWrap: 'break-word' }}>{item.equipment_name}</td>
                      <td className="border border-black py-1" style={{ minWidth: '250px', wordWrap: 'break-word' }}>
                        {item.skill} ({getFinalDicePool(item.skill, skills.find(s => s.skill === item.skill)?.stat || 'agility')})
                      </td>
                      <td className="border border-black py-1" style={{ minWidth: '150px' }}>{item.range}</td>
                      <td className="border border-black py-1" style={{ minWidth: '100px' }}>{item.damage || ''}</td>
                      <td className="border border-black py-1" style={{ minWidth: '100px' }}>{item.critical || ''}</td>
                      <td className="border border-black py-1" style={{ minWidth: '700px', wordWrap: 'break-word' }}>{item.special || ''}</td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {/* ---- Racial Abilities Table ---- */}
            {racialAbilityList.length > 0 && (
              <div className="mt-6">
                <h3 className="font-bold text-lg mb-3">Racial Abilities</h3>
                <table className="border border-black w-full text-left" style={{ tableLayout: 'fixed' }}>
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-black py-1" style={{ minWidth: '300px', wordWrap: 'break-word' }}>Ability</th>
                      <th className="border border-black py-1" style={{ minWidth: '700px', wordWrap: 'break-word' }}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {racialAbilityList
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((ability, idx) => (
                        <tr key={idx} className="bg-gray-100">
                          <td className="border border-black py-1" style={{ minWidth: '300px', wordWrap: 'break-word' }}>
                            {ability.name}
                          </td>
                          <td className="border border-black py-1" style={{ minWidth: '700px', wordWrap: 'break-word' }}>
                            {ability.description}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ---- Abilities (grouped by activation, Active first, then A-Z within each) ---- */}
            {Array.from(new Set(abilities.map(a => a.activation)))
              .sort((a, b) => a.localeCompare(b))
              .map(activation => {
                const sortedInGroup = abilities
                  .filter(a => a.activation === activation)
                  .sort((a, b) => a.displayName.localeCompare(b.displayName));

                return (
                  <div key={activation} className="mt-6">
                    <h3 className="font-bold text-lg mb-3">{activation} Abilities</h3>
                    <table className="border border-black w-full text-left" style={{ tableLayout: 'fixed' }}>
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-black py-1" style={{ minWidth: '300px', wordWrap: 'break-word' }}>Ability</th>
                          <th className="border border-black py-1" style={{ minWidth: '700px', wordWrap: 'break-word' }}>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedInGroup.map((ability, idx) => (
                          <tr key={idx} className="bg-gray-100">
                            <td className="border border-black py-1" style={{ minWidth: '300px', wordWrap: 'break-word' }}>
                              {ability.displayName} (Rank {ability.rank})
                            </td>
                            <td className="border border-black py-1" style={{ minWidth: '700px', wordWrap: 'break-word' }}>
                              {ability.finalDescription}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {backstory && (
        <div className="border-2 border-black rounded-lg p-4 w-full text-center mt-4" style={{ minHeight: '500px' }}>
          <h3 className="font-bold text-lg mb-3">Backstory</h3>
          <p className="text-left">{backstory}</p>
        </div>
      )}
    </div>
  );
}