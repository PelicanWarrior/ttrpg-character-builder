import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function SWCharacterOverview() {
  const [characterName, setCharacterName] = useState('');
  const [race, setRace] = useState('');
  const [raceId, setRaceId] = useState(null);
  const [characterPictureId, setCharacterPictureId] = useState(0);
  const [availableCharacterPictures, setAvailableCharacterPictures] = useState([]);
  const [showPictureSelector, setShowPictureSelector] = useState(false);
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
  const [inventory, setInventory] = useState([]);
  const [armour, setArmour] = useState([]);
  const [otherItems, setOtherItems] = useState([]);
  const [characterId, setCharacterId] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [woundThreshold, setWoundThreshold] = useState(0);
  const [strainThreshold, setStrainThreshold] = useState(0);
  const [woundCurrent, setWoundCurrent] = useState(0);
  const [strainCurrent, setStrainCurrent] = useState(0);
  const [credits, setCredits] = useState(0);
  const [totalSoak, setTotalSoak] = useState(0);
  const [activeTab, setActiveTab] = useState('skills');
  const [abilities, setAbilities] = useState([]);
  const [skillBonuses, setSkillBonuses] = useState({});
  const [previousSoak, setPreviousSoak] = useState(null);
  const [raceAbilities, setRaceAbilities] = useState({ Race_Attack: '', ability: '' });
  const [isForceSensitive, setIsForceSensitive] = useState(false);
  const [forceRating, setForceRating] = useState(0);

  // NEW: Dynamic popup state
  const [dicePopup, setDicePopup] = useState(null); // { pool, details, x, y }
  const [selectedDifficulty, setSelectedDifficulty] = useState(0);
  const [rollResults, setRollResults] = useState(null); // { poolResults: [], diffResults: [] }

  const [diceMap, setDiceMap] = useState({});
  const [racePictures, setRacePictures] = useState([]);

  const location = useLocation();
  const navigate = useNavigate();

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

  const getEquipmentRange = () => getEquipment()?.range || 'N/A';
  const getEquipmentDamage = () => getEquipment()?.damage || '';
  const getEquipmentCritical = () => getEquipment()?.critical || '';
  const getEquipmentSpecial = () => getEquipment()?.special || '';
  const getEquipmentSoak = () => getEquipment()?.soak || '';
  const getEquipmentDefenceMelee = () => getEquipment()?.defence_melee || '';
  const getEquipmentDefenceRange = () => getEquipment()?.defence_range || '';

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
    const blueBonus = skillBonuses[skillName] || '';
    return dicePool + blueBonus;
  };

  // NEW: Click handler that captures position
  const handleDicePoolClick = (e, pool, label) => {
    if (!pool) return;
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    // Position at left edge of screen (x=0), just below the clicked pool button
    let x = 0;
    let y = rect.bottom + window.scrollY + 8;

    const details = pool.split('').map(color => ({
      color,
      name: diceMap[color] || 'Unknown'
    }));

    setDicePopup({ pool, details, x, y, label: label || pool, boosts: [], setbacks: [] });
    setRollResults(null); // clear previous roll results when opening a new popup
  };

  const getDiceColorStyle = (letter) => {
    // Map common dice letters to colours used by the UI. Adjust as needed.
    switch ((letter || '').toUpperCase()) {
      case 'G': return { backgroundColor: '#6bbf59' }; // green / Ability
      case 'Y': return { backgroundColor: '#ffd24d' }; // yellow / Proficiency
      case 'B': return { backgroundColor: '#6fb7ff' }; // blue / Boost
      case 'R': return { backgroundColor: '#ff6b6b' }; // red / Difficulty
      case 'P': return { backgroundColor: '#b36bff' }; // purple / Challenge
      case 'K': return { backgroundColor: '#333333' }; // black / Setback
      default: return { backgroundColor: '#e5e7eb' }; // neutral grey
    }
  };

  const formatResultInline = (text) => {
    if (text === null || text === undefined) return '';
    let s = String(text);
    // remove commas and collapse whitespace so result fits on one line
    s = s.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
    return s;
  };

  const splitResultLines = (text) => {
    if (text === null || text === undefined) return [''];
    const s = String(text).trim();
    if (!s.includes(',')) return [s];
    const parts = s.split(',');
    const first = parts[0].trim();
    const rest = parts.slice(1).join(',').trim();
    return [first, rest];
  };

  const parseRollResults = (poolResultsArray, diffResultsArray) => {
    // Count each result type from pool and difficulty results
    const counts = {
      success: 0,
      failure: 0,
      triumph: 0,
      despair: 0,
      advantage: 0,
      threat: 0,
    };

    const parseResultText = (text) => {
      if (!text) return;
      const lc = String(text).toLowerCase();
      
      // Count occurrences of each symbol (some dice have multiple symbols)
      const successMatches = lc.match(/success/g);
      const failureMatches = lc.match(/failure/g);
      const triumphMatches = lc.match(/triumph/g);
      const despairMatches = lc.match(/despair/g);
      const advantageMatches = lc.match(/advantage/g);
      const threatMatches = lc.match(/threat/g);
      
      if (successMatches) counts.success += successMatches.length;
      if (failureMatches) counts.failure += failureMatches.length;
      if (triumphMatches) counts.triumph += triumphMatches.length;
      if (despairMatches) counts.despair += despairMatches.length;
      if (advantageMatches) counts.advantage += advantageMatches.length;
      if (threatMatches) counts.threat += threatMatches.length;
    };

    // Parse pool results (includes pool dice, boosts)
    (poolResultsArray || []).forEach(r => parseResultText(r));
    // Parse difficulty/setback results
    (diffResultsArray || []).forEach(r => parseResultText(r));

    // Apply cancellation rules
    // Triumph counts as success; despair counts as failure
    const totalSuccess = counts.success + counts.triumph;
    const totalFailure = counts.failure + counts.despair;

    // Cancel success vs failure
    let netSuccess = 0;
    let netFailure = 0;
    if (totalSuccess > totalFailure) {
      netSuccess = totalSuccess - totalFailure;
    } else if (totalFailure > totalSuccess) {
      netFailure = totalFailure - totalSuccess;
    }
    // If equal, both cancel out to 0

    // Cancel advantage vs threat
    let netAdvantage = 0;
    let netThreat = 0;
    if (counts.advantage > counts.threat) {
      netAdvantage = counts.advantage - counts.threat;
    } else if (counts.threat > counts.advantage) {
      netThreat = counts.threat - counts.advantage;
    }
    // If equal, both cancel out to 0

    return {
      counts,
      netSuccess,
      netFailure,
      netAdvantage,
      netThreat,
      totalSuccess,
      totalFailure,
    };
  };

  const handleRoll = async () => {
    if (!dicePopup || !dicePopup.details) return;

    const poolResults = [];

    const combinedDice = [...(dicePopup.details || []), ...((dicePopup.boosts || []))];

    for (const die of combinedDice) {
      try {
        // Try single-row format first (columns like side1 .. Side 1 etc.)
        const { data: singleRow, error: singleErr } = await supabase
          .from('SW_dice')
          .select('*')
          .eq('colour', die.color)
          .single();

        let available = [];

        if (!singleErr && singleRow) {
          for (let s = 1; s <= 12; s++) {
            const variants = [`side${s}`, `Side${s}`, `Side ${s}`, `side ${s}`];
            for (const key of variants) {
              if (Object.prototype.hasOwnProperty.call(singleRow, key) && singleRow[key] != null) {
                available.push(singleRow[key]);
                break;
              }
            }
          }
        }

        // Fallback to one-row-per-side format
        if (available.length === 0) {
          const { data: rows } = await supabase
            .from('SW_dice')
            .select('side, result')
            .eq('colour', die.color)
            .in('side', Array.from({ length: 12 }, (_, i) => i + 1));
          if (rows && rows.length > 0) {
            available = rows.map(r => r.result).filter(r => r != null);
          }
        }

        if (available.length === 0) {
          poolResults.push('—');
        } else {
          poolResults.push(available[Math.floor(Math.random() * available.length)]);
        }
      } catch (err) {
        poolResults.push('—');
      }
    }

    // Difficulty / challenge dice (purple 'P')
    const diffResults = [];
    if (selectedDifficulty > 0) {
      try {
        const { data: pRow, error: pErr } = await supabase.from('SW_dice').select('*').eq('colour', 'P').single();
        let availableP = [];
        if (!pErr && pRow) {
          for (let s = 1; s <= 12; s++) {
            const variants = [`side${s}`, `Side${s}`, `Side ${s}`, `side ${s}`];
            for (const key of variants) {
              if (Object.prototype.hasOwnProperty.call(pRow, key) && pRow[key] != null) {
                availableP.push(pRow[key]);
                break;
              }
            }
          }
        }

        if (availableP.length === 0) {
          const { data: prowRows } = await supabase
            .from('SW_dice')
            .select('side, result')
            .eq('colour', 'P')
            .in('side', Array.from({ length: 12 }, (_, i) => i + 1));
          if (prowRows && prowRows.length > 0) availableP = prowRows.map(r => r.result).filter(r => r != null);
        }

        for (let i = 0; i < selectedDifficulty; i++) {
          if (availableP.length === 0) diffResults.push('—');
          else diffResults.push(availableP[Math.floor(Math.random() * availableP.length)]);
        }
      } catch (err) {
        for (let i = 0; i < selectedDifficulty; i++) diffResults.push('—');
      }
    }

    // Setback dice (black) — roll for each setback in popup.setbacks
    if (dicePopup.setbacks && dicePopup.setbacks.length > 0) {
      try {
        const { data: kRow, error: kErr } = await supabase.from('SW_dice').select('*').eq('colour', 'Black').single();
        let availableK = [];
        if (!kErr && kRow) {
          for (let s = 1; s <= 12; s++) {
            const variants = [`side${s}`, `Side${s}`, `Side ${s}`, `side ${s}`];
            for (const key of variants) {
              if (Object.prototype.hasOwnProperty.call(kRow, key) && kRow[key] != null) {
                availableK.push(kRow[key]);
                break;
              }
            }
          }
        }

        if (availableK.length === 0) {
          const { data: krowRows } = await supabase
            .from('SW_dice')
            .select('*')
            .eq('colour', 'Black');
          if (krowRows && krowRows.length > 0) {
            for (const row of krowRows) {
              for (let s = 1; s <= 12; s++) {
                const variants = [`side${s}`, `Side${s}`, `Side ${s}`, `side ${s}`];
                for (const key of variants) {
                  if (Object.prototype.hasOwnProperty.call(row, key) && row[key] != null) {
                    availableK.push(row[key]);
                    break;
                  }
                }
              }
            }
          }
        }

        for (let i = 0; i < dicePopup.setbacks.length; i++) {
          if (availableK.length === 0) diffResults.push('—');
          else diffResults.push(availableK[Math.floor(Math.random() * availableK.length)]);
        }
      } catch (err) {
        console.error('Error rolling setback dice:', err);
        for (let i = 0; i < (dicePopup.setbacks?.length || 0); i++) diffResults.push('—');
      }
    }

    setRollResults({ poolResults, diffResults });
  };

  // Close popup when clicking anywhere else
  useEffect(() => {
    if (!dicePopup) return;
    const handler = () => setDicePopup(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [dicePopup]);

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
        .select('*, wound_threshold, strain_threshold, wound_current, strain_current, credits, talents, force_rating')
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
      // Set picture: use saved value if present, otherwise default to 0
      if (typeof characterData.picture === 'number') {
        setCharacterPictureId(characterData.picture);
      } else {
        setCharacterPictureId(0);
      }
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
      setForceRating(characterData.force_rating ?? 0);

      if (characterData.career) {
        const { data: careerData, error: careerError } = await supabase
          .from('SW_career')
          .select('Force_Sensitive')
          .eq('career', characterData.career)
          .single();

        if (!careerError && careerData && careerData.Force_Sensitive === true) {
          setIsForceSensitive(true);
        } else {
          setIsForceSensitive(false);
        }
      } else {
        setIsForceSensitive(false);
      }

      let baseWoundThreshold = characterData.wound_threshold || 0;
      let baseStrainThreshold = characterData.strain_threshold || 0;

      const woundCurrentValue = characterData.wound_current ?? baseWoundThreshold;
      const strainCurrentValue = characterData.strain_current ?? baseStrainThreshold;
      setWoundCurrent(woundCurrentValue);
      setStrainCurrent(strainCurrentValue);

      if (characterData.wound_current === null || characterData.wound_current === undefined) {
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

      const enrichedSkills = allSkills.map(skill => ({
        id: skill.id,
        skill: skill.skill,
        rank: skillRanks[skill.skill] || 0,
        stat: skill.stat,
      }));

      const sortedSkills = enrichedSkills.sort((a, b) => a.skill.localeCompare(b.skill));
      setSkills(sortedSkills);

      const { data: equipmentData, error: equipError } = await supabase
        .from('SW_equipment')
        .select('id, name, skill, damage, critical, special, soak, defence_melee, defence_range, range, consumable, description');
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

            return {
              id: item.id || 0,
              equipment_name: equipData?.name || '',
              description: equipData?.description || '',
              skill: skillData?.skill || '',
              damage: equipData?.damage || '',
              critical: equipData?.critical || '',
              special: equipData?.special || '',
              range: equipData?.range || 'N/A',
              soak: equipData?.soak || 0,
              defence_melee: equipData?.defence_melee || '',
              defence_range: equipData?.defence_range || '',
              consumable: equipData?.consumable || false,
              equipped: item.equipped || false,
            };
          }));

          setInventory(enrichedInventory.filter(item => !item.soak && !item.consumable));
          setArmour(enrichedInventory.filter(item => item.soak));
          setOtherItems(enrichedInventory.filter(item => item.consumable));
        }
      }

      const talents = characterData.talents ? characterData.talents.split(',').map(t => t.trim()) : [];
      const talentCount = talents.reduce((acc, talent) => {
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
          const originalTalent = talents.find(t => t.replace(/\s*\(.*\)$/, '').trim() === ability.ability);
          const bracketMatch = originalTalent?.match(/\(([^)]+)\)/);
          const bracketSkill = bracketMatch ? bracketMatch[1].trim() : null;
          const displayName = originalTalent ? originalTalent.replace(/\s*\(.*\)$/, '').trim() : ability.ability;

          let finalDescription = ability.description;

          if (ability.ability !== 'Dedication' && bracketSkill) {
            const firstPeriodIndex = finalDescription.indexOf('.');
            if (firstPeriodIndex !== -1) {
              finalDescription = finalDescription.substring(firstPeriodIndex + 1).trim();
            }
            finalDescription = finalDescription.replace(/\bthat skill\b/gi, bracketSkill);
          }

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

        const sortedAbilities = processedAbilities.sort((a, b) => a.displayName.localeCompare(b.displayName));
        setAbilities(sortedAbilities);

        let woundBonus = 0;
        let strainBonus = 0;

        sortedAbilities.forEach(ability => {
          if (ability.increase_stat) {
            const stats = ability.increase_stat.split(',').map(s => s.trim());
            stats.forEach(stat => {
              if (stat === 'Wound') woundBonus += ability.rank;
              else if (stat === 'Strain') strainBonus += ability.rank;
            });
          }
        });

        const finalWoundThreshold = baseWoundThreshold + woundBonus;
        const finalStrainThreshold = baseStrainThreshold + strainBonus;

        setWoundThreshold(finalWoundThreshold);
        setStrainThreshold(finalStrainThreshold);

        setWoundCurrent(prev => Math.min(prev, finalWoundThreshold));
        setStrainCurrent(prev => Math.min(prev, finalStrainThreshold));

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
              }
            });
          }
        });
        setSkillBonuses(newSkillBonuses);
      }

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

      const { data: diceData, error: diceError } = await supabase.from('SW_dice').select('colour, name');
      if (diceError) {
        console.error('Error fetching dice data:', diceError);
      } else {
        const map = diceData.reduce((acc, d) => {
          acc[d.colour] = d.name;
          return acc;
        }, {});
        setDiceMap(map);
      }

      // Fetch all pictures for the character's race
      const { data: pictureData, error: pictureError } = await supabase
        .from('SW_pictures')
        .select('*');
      if (pictureError) {
        console.error('Error fetching pictures:', pictureError);
      } else {
        setRacePictures(pictureData || []);
      }

      // Fetch race ID by looking up the race name
      if (characterData.race) {
        const { data: raceData, error: raceError } = await supabase
          .from('races')
          .select('id')
          .eq('name', characterData.race)
          .single();
        if (!raceError && raceData) {
          setRaceId(raceData.id);
        } else {
          console.error('Error fetching race ID:', raceError);
        }
      }

      setTotalSoak(characterData.brawn || 0);
      setPreviousSoak(characterData.brawn || 0);
    };

    fetchCharacterData();
  }, [location, characterId]);

  const calculateTotalSoak = () => {
    const armorSoak = armour
      .filter(item => item.equipped && item.soak)
      .reduce((sum, item) => sum + (item.soak || 0), 0);
    return Math.max(0, brawn + armorSoak);
  };

  // Update available pictures when race or racePictures change
  useEffect(() => {
    if (racePictures.length > 0 && raceId) {
      // Filter pictures by race ID and include Picture 0
      const racePics = racePictures.filter(pic => pic.race_ID === raceId || pic.id === 0);
      // Remove duplicates
      const uniquePics = Array.from(new Map(racePics.map(p => [p.id, p])).values());
      console.log(`Available pictures for race ID ${raceId}:`, uniquePics);
      setAvailableCharacterPictures(uniquePics);
    } else {
      setAvailableCharacterPictures([]);
    }
  }, [raceId, racePictures]);

  // Handle picture change - update database automatically
  const handleChangePicture = async (pictureId) => {
    setCharacterPictureId(pictureId);
    if (characterId) {
      const { error } = await supabase
        .from('SW_player_characters')
        .update({ picture: pictureId })
        .eq('id', characterId);
      if (error) {
        console.error('Error updating picture:', error);
      }
    }
    setShowPictureSelector(false);
  };

  useEffect(() => {
    const newSoak = calculateTotalSoak();
    if (previousSoak === null) {
      setPreviousSoak(newSoak);
      setTotalSoak(newSoak);
    } else if (newSoak !== previousSoak) {
      const diff = newSoak - previousSoak;
      if (diff > 0) {
        console.log(`Soak increased by +${diff} to Total: ${newSoak}`);
      } else if (diff < 0) {
        console.log(`Soak decreased by ${diff} to Total: ${newSoak}`);
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

        const { data, error } = await supabase
          .from('SW_character_equipment')
          .insert({
            characterID: characterId,
            equipmentID: equipmentToAdd.id,
            equipped: false,
          })
          .select();

        if (error) {
          console.error('Error adding item to inventory:', error);
        } else if (data && data[0]) {
          const newItem = {
            id: data[0].id,
            equipment_name: equipmentToAdd.name,
            description: equipmentToAdd.description || '',
            skill: skillData?.skill || '',
            damage: equipmentToAdd.damage || '',
            critical: equipmentToAdd.critical || '',
            special: equipmentToAdd.special || '',
            range: equipmentToAdd.range || 'N/A',
            soak: equipmentToAdd.soak || 0,
            defence_melee: equipmentToAdd.defence_melee || '',
            defence_range: equipmentToAdd.defence_range || '',
            consumable: equipmentToAdd.consumable || false,
            equipped: false,
          };

          if (equipmentToAdd.consumable) {
            setOtherItems(prev => [...prev, newItem]);
          } else if (equipmentToAdd.soak) {
            setArmour(prev => [...prev, newItem]);
          } else {
            setInventory(prev => [...prev, newItem]);
          }
          setSelectedEquipment('');
        }
      }
    }
  };

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

  const handleOtherItemDelete = async (index) => {
    const itemToDelete = otherItems[index];
    if (itemToDelete.id && characterId) {
      const confirmDelete = confirm(`Do you really want to delete ${itemToDelete.equipment_name}?`);
      if (confirmDelete) {
        const { error } = await supabase
          .from('SW_character_equipment')
          .delete()
          .eq('id', itemToDelete.id);
        if (error) {
          console.error('Error deleting other item:', error);
        } else {
          const updatedOtherItems = [...otherItems];
          updatedOtherItems.splice(index, 1);
          setOtherItems(updatedOtherItems);
        }
      }
    }
  };

  const handleUseConsumable = async (name) => {
    const itemsToUse = otherItems.filter(item => item.equipment_name === name);
    if (itemsToUse.length === 0) return;

    const itemToRemove = itemsToUse[0];
    const { error } = await supabase
      .from('SW_character_equipment')
      .delete()
      .eq('id', itemToRemove.id);

    if (error) {
      console.error('Error using consumable:', error);
    } else {
      setOtherItems(prev => prev.filter(item => item.id !== itemToRemove.id));
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
            console.error('Error deleting armour:', error);
          } else {
            const updatedArmour = [...armour];
            updatedArmour.splice(index, 1);
            setArmour(updatedArmour);
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
            console.error('Error deleting weapon:', error);
          } else {
            const updatedInventory = [...inventory];
            updatedInventory.splice(index, 1);
            setInventory(updatedInventory);
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

  const consolidatedConsumables = otherItems.reduce((acc, item) => {
    if (!acc[item.equipment_name]) {
      acc[item.equipment_name] = {
        name: item.equipment_name,
        count: 0,
        description: item.description,
        special: item.special,
        ids: [],
      };
    }
    acc[item.equipment_name].count += 1;
    acc[item.equipment_name].ids.push(item.id);
    return acc;
  }, {});

  const consumableList = Object.values(consolidatedConsumables);

  const StatBox = ({ statName, value }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      img.onload = () => {
        ctx.clearRect(0, 0, 112, 112);
        ctx.drawImage(img, 0, 0, 112, 112);

        ctx.font = 'bold 34px "Arial Black", Arial, sans-serif';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const x = 56;
        const y = 56;
        
        for (let i = 0; i < 4; i++) {
          ctx.strokeText(value, x + i, y);
          ctx.strokeText(value, x - i, y);
          ctx.strokeText(value, x, y + i);
          ctx.strokeText(value, x, y - i);
        }
        for (let dx = -2; dx <= 2; dx += 4) {
          for (let dy = -2; dy <= 2; dy += 4) {
            if (dx !== 0 || dy !== 0) {
              ctx.strokeText(value, x + dx, y + dy);
            }
          }
        }
        
        ctx.fillText(value, x, y);
      };
      
      img.onerror = () => {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0, 0, 112, 112);
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeText(statName[0], 56, 56);
        ctx.fillText(statName[0], 56, 56);
      };
      
      img.src = `/SW_${statName}.png?t=${Date.now()}`;
    }, [statName, value]);

    return (
      <canvas
        ref={canvasRef}
        width={112}
        height={112}
        className="w-28 h-28 inline-block align-top"
        style={{ imageRendering: 'pixelated' }}
      />
    );
  };

  const ForceRatingBox = ({ value }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || value <= 0) return;

      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        ctx.clearRect(0, 0, 112, 112);
        ctx.drawImage(img, 0, 0, 112, 112);

        ctx.font = 'bold 34px "Arial Black", Arial, sans-serif';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const x = 56;
        const y = 56;

        for (let i = 0; i < 4; i++) {
          ctx.strokeText(value, x + i, y);
          ctx.strokeText(value, x - i, y);
          ctx.strokeText(value, x, y + i);
          ctx.strokeText(value, x, y - i);
        }
        for (let dx = -2; dx <= 2; dx += 4) {
          for (let dy = -2; dy <= 2; dy += 4) {
            if (dx !== 0 || dy !== 0) {
              ctx.strokeText(value, x + dx, y + dy);
            }
          }
        }

        ctx.fillText(value, x, y);
      };

      img.onerror = () => {
        ctx.fillStyle = '#4B0082';
        ctx.fillRect(0, 0, 112, 112);
        ctx.font = 'bold 34px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(value, 56, 56);
      };

      img.src = '/SW_Force_Rating.png?t=' + Date.now();
    }, [value]);

    return value > 0 ? (
      <canvas
        ref={canvasRef}
        width={112}
        height={112}
        className="w-28 h-28 inline-block align-top mr-6"
        style={{ imageRendering: 'pixelated' }}
      />
    ) : null;
  };

  const SoakBox = ({ value }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      img.onload = () => {
        ctx.clearRect(0, 0, 112, 112);
        ctx.drawImage(img, 0, 0, 112, 112);

        ctx.font = 'bold 34px "Arial Black", Arial, sans-serif';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 4;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const x = 56;
        const y = 56;
        
        for (let i = 0; i < 4; i++) {
          ctx.strokeText(value, x + i, y);
          ctx.strokeText(value, x - i, y);
          ctx.strokeText(value, x, y + i);
          ctx.strokeText(value, x, y - i);
        }
        for (let dx = -2; dx <= 2; dx += 4) {
          for (let dy = -2; dy <= 2; dy += 4) {
            if (dx !== 0 || dy !== 0) {
              ctx.strokeText(value, x + dx, y + dy);
            }
          }
        }
        
        ctx.fillText(value, x, y);
      };
      
      img.onerror = () => {
        ctx.fillStyle = '#666';
        ctx.fillRect(0, 0, 112, 112);
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeText('S', 56, 56);
        ctx.fillText('S', 56, 56);
      };
      
      img.src = `/SW_Soak.png?t=${Date.now()}`;
    }, [value]);

    return (
      <canvas
        ref={canvasRef}
        width={112}
        height={112}
        className="w-28 h-28 inline-block align-top"
        style={{ imageRendering: 'pixelated' }}
      />
    );
  };

  const WoundStrainSingleBox = ({ type, threshold, current, onChange }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        ctx.clearRect(0, 0, 112, 112);
        ctx.drawImage(img, 0, 0, 112, 112);

        ctx.font = 'bold 24px "Arial Black", Arial, sans-serif';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const y = 56;
        const leftX = 38;
        const rightX = 74;

        for (let i = 0; i < 3; i++) {
          ctx.strokeText(threshold, leftX + i, y);
          ctx.strokeText(threshold, leftX - i, y);
          ctx.strokeText(threshold, leftX, y + i);
          ctx.strokeText(threshold, leftX, y - i);
          ctx.strokeText(current, rightX + i, y);
          ctx.strokeText(current, rightX - i, y);
          ctx.strokeText(current, rightX, y + i);
          ctx.strokeText(current, rightX, y - i);
        }
        ctx.fillText(threshold, leftX, y);
        ctx.fillText(current, rightX, y);
      };
      
      img.onerror = () => {
        ctx.fillStyle = type === 'wound' ? '#8B0000' : '#008B8B';
        ctx.fillRect(0, 0, 112, 112);
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeText(type.toUpperCase().slice(0, 3), 56, 56);
        ctx.fillText(type.toUpperCase().slice(0, 3), 56, 56);
      };
      
      img.src = type === 'wound' ? '/SW_Wounds.png' : '/SW_Strain.png?t=' + Date.now();
    }, [threshold, current, type]);

    return (
      <div className="flex items-center">
        <canvas
          ref={canvasRef}
          width={112}
          height={112}
          className="w-28 h-28 inline-block align-top"
          style={{ imageRendering: 'pixelated' }}
        />
        <div className="flex flex-col">
          <button 
            onClick={() => onChange(1)}
            className="w-8 h-8 bg-green-600 text-white text-lg font-bold rounded-full hover:bg-green-700 shadow-md flex items-center justify-center -ml-2"
          >
            +
          </button>
          <button 
            onClick={() => onChange(-1)}
            className="w-8 h-8 bg-red-600 text-white text-lg font-bold rounded-full hover:bg-red-700 shadow-md flex items-center justify-center -ml-2 mt-1"
          >
            −
          </button>
        </div>
      </div>
    );
  };

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
      <div className="flex items-center gap-4 mb-4">
        <div className="flex flex-col items-center gap-2">
          <img 
            src={`/SW_Pictures/Picture ${characterPictureId} Face.png`}
            alt="Character portrait"
            className="rounded-lg object-contain"
            style={{ width: '80px', height: '100px' }}
            onError={(e) => {
              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="100"%3E%3Crect fill="%23ddd" width="80" height="100"/%3E%3C/svg%3E';
            }}
          />
          <button
            onClick={() => setShowPictureSelector(!showPictureSelector)}
            className="bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
            style={{ padding: '4px 8px', fontSize: '11px' }}
          >
            Change Picture
          </button>
        </div>
        <h1 className="font-bold text-2xl">{characterName}</h1>
      </div>

      {/* Picture Selector Box */}
      {showPictureSelector && availableCharacterPictures.length > 0 && (
        <div className="mb-4 p-3 border border-gray-300 rounded-lg bg-gray-50 flex gap-2 justify-start overflow-x-auto">
          {availableCharacterPictures.map((pic) => (
            <img
              key={pic.id}
              src={`/SW_Pictures/Picture ${pic.id} Face.png`}
              alt={`Picture ${pic.id}`}
              className="rounded-lg cursor-pointer object-contain flex-shrink-0"
              style={{
                width: '80px',
                height: '100px',
                border: characterPictureId === pic.id ? '3px solid #2563eb' : '3px solid #d1d5db'
              }}
              onClick={() => handleChangePicture(pic.id)}
              onError={(e) => console.log('Picture failed to load:', pic.id)}
            />
          ))}
        </div>
      )}
      <div className="flex items-center mb-4">
        <p>{race ? `${race} ${career} - ${specialization}` : `${career} - ${specialization}`}</p>
      </div>

      <div className="flex mb-8 items-center">
        <div className="mr-6"><StatBox statName="Brawn" value={brawn} /></div>
        <div className="mr-6"><StatBox statName="Agility" value={agility} /></div>
        <div className="mr-6"><StatBox statName="Intellect" value={intellect} /></div>
        <div className="mr-6"><StatBox statName="Cunning" value={cunning} /></div>
        <div className="mr-6"><StatBox statName="Willpower" value={willpower} /></div>
        <div className="mr-6"><StatBox statName="Presence" value={presence} /></div>

        <ForceRatingBox value={forceRating} />

        <div className="mr-6"><SoakBox value={totalSoak} /></div>

        <div className="flex items-center">
          <WoundStrainSingleBox 
            type="wound"
            threshold={woundThreshold}
            current={woundCurrent}
            onChange={handleWoundChange}
          />
        </div>

        <div className="flex items-center">
          <WoundStrainSingleBox 
            type="strain"
            threshold={strainThreshold}
            current={strainCurrent}
            onChange={handleStrainChange}
          />
        </div>
      </div>

      <div className="w-full">
        <div className="flex border-b-2 border-black mb-4">
          <button className={`px-4 py-2 font-bold ${activeTab === 'skills' ? 'border-b-2 border-green-600 bg-gray-100' : ''}`} onClick={() => setActiveTab('skills')}>Skills</button>
          <button className={`px-4 py-2 font-bold ${activeTab === 'equipment' ? 'border-b-2 border-green-600 bg-gray-100' : ''}`} onClick={() => setActiveTab('equipment')}>Equipment</button>
          <button className={`px-4 py-2 font-bold ${activeTab === 'actions' ? 'border-b-2 border-green-600 bg-gray-100' : ''}`} onClick={() => setActiveTab('actions')}>Actions</button>
        </div>

        {/* ==================== SKILLS TAB ==================== */}
        {activeTab === 'skills' && (
          <div className="border-2 border-black rounded-lg p-4 text-left w-1/2 mr-4" style={{ minHeight: '400px' }}>
            <h2 className="font-bold text-lg mb-3">Skills</h2>
            <table className="border border-black text-left w-full" style={{ tableLayout: 'fixed', margin: '0' }}>
              <colgroup>
                <col style={{ width: '200px' }} />
                <col style={{ width: '60px' }} />
                <col style={{ width: '80px' }} />
              </colgroup>
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black py-1 text-xs">Skill</th>
                  <th className="border border-black py-1 text-xs">Rank</th>
                  <th className="border border-black py-1 text-xs">Dice Pool</th>
                </tr>
              </thead>
              <tbody>
                {skills.map((skill, index) => {
                  const pool = getFinalDicePool(skill.skill, skill.stat);
                  return (
                    <tr key={index} className="bg-gray-100">
                      <td className="border border-black py-1 text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                        {skill.skill} ({skill.stat})
                      </td>
                      <td className="border border-black py-1 text-xs text-center font-bold">
                        {skill.rank}
                      </td>
                      <td className="border border-black py-1 text-xs text-center font-mono">
                        <span 
                          className="cursor-pointer hover:underline text-blue-700"
                          onClick={(e) => handleDicePoolClick(e, pool, skill.skill)}
                        >
                          {pool}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ==================== EQUIPMENT TAB ==================== */}
        {activeTab === 'equipment' && (
          <div className="flex-1 text-left" style={{ minHeight: '600px' }}>
            <h2 className="font-bold text-lg mb-3">Equipment</h2>
            <div className="mb-4">
              <div className="mt-4 text-right">
                <label className="mr-2 font-bold">Credits:</label>
                <input type="number" value={credits} onChange={handleCreditsChange} className="border-2 border-black rounded-lg p-1 w-24" min="0" />
              </div>
              <select value={selectedEquipment} onChange={(e) => setSelectedEquipment(e.target.value)} className="border-2 border-black rounded-lg p-2 w-full mt-4">
                <option value="">Select Equipment</option>
                {equipment.sort((a, b) => a.name.localeCompare(b.name)).map((item, index) => (
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
                            {getEquipmentSkill()} (
                            <span 
                              className="cursor-pointer hover:underline text-blue-700"
                              onClick={(e) => handleDicePoolClick(e, getDicePoolForSkill(), getEquipmentSkill())}
                            >
                              {getDicePoolForSkill()}
                            </span>
                            )
                          </td>
                          <td className="border border-black py-1" style={{ minWidth: '150px' }}>{getEquipmentRange()}</td>
                          <td className="border border-black py-1" style={{ minWidth: '50px' }}>{getEquipmentDamage()}</td>
                          <td className="border border-black py-1" style={{ minWidth: '50px' }}>{getEquipmentCritical()}</td>
                          <td className="border border-black py-1" style={{ minWidth: '700px', wordWrap: 'break-word' }}>{getEquipmentSpecial()}</td>
                        </>
                      )}
                    </tr>
                  </tbody>
                </table>
              )}
              <div className="mt-4">
                <button onClick={handleAddToInventory} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                  Add to Inventory
                </button>
              </div>

              {/* Weapons Table */}
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
                  {inventory.map((item, index) => {
                    const pool = getFinalDicePool(item.skill, skills.find(s => s.skill === item.skill)?.stat || 'agility');
                    return (
                      <tr key={index} className="bg-gray-100">
                        <td className="border border-black py-1">
                          <input type="checkbox" checked={item.equipped} onChange={() => handleWeaponEquipToggle(index)} />
                        </td>
                        <td className="border border-black py-1" style={{ minWidth: '250px', wordWrap: 'break-word' }}>{item.equipment_name}</td>
                        <td className="border border-black py-1" style={{ minWidth: '250px', wordWrap: 'break-word' }}>
                          {item.skill} (
                          <span 
                            className="cursor-pointer hover:underline text-blue-700"
                            onClick={(e) => handleDicePoolClick(e, pool, item.skill)}
                          >
                            {pool}
                          </span>
                          )
                        </td>
                        <td className="border border-black py-1" style={{ minWidth: '150px' }}>{item.range}</td>
                        <td className="border border-black py-1" style={{ minWidth: '50px' }}>{item.damage || ''}</td>
                        <td className="border border-black py-1" style={{ minWidth: '50px' }}>{item.critical || ''}</td>
                        <td className="border border-black py-1" style={{ minWidth: '700px', wordWrap: 'break-word' }}>{item.special || ''}</td>
                        <td className="border border-black py-1">
                          <button onClick={() => handleDeleteEquipment(index)} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Armour Table */}
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
                        <input type="checkbox" checked={item.equipped} onChange={() => handleArmourEquipToggle(index)} />
                      </td>
                      <td className="border border-black py-1" style={{ minWidth: '250px', wordWrap: 'break-word' }}>{item.equipment_name}</td>
                      <td className="border border-black py-1" style={{ minWidth: '75px' }}>{item.soak}</td>
                      <td className="border border-black py-1" style={{ minWidth: '75px' }}>{item.defence_melee}</td>
                      <td className="border border-black py-1" style={{ minWidth: '75px' }}>{item.defence_range}</td>
                      <td className="border border-black py-1" style={{ minWidth: '700px', wordWrap: 'break-word' }}>{item.special}</td>
                      <td className="border border-black py-1">
                        <button onClick={() => handleDeleteEquipment(index, true)} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Other Items */}
              <h3 className="font-bold text-lg mt-4">Other Items</h3>
              <table className="border border-black w-full text-left mt-4" style={{ tableLayout: 'fixed', width: '100%' }}>
                <colgroup>
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '58%' }} />
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '5%' }} />
                </colgroup>
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-black py-1">Name</th>
                    <th className="border border-black py-1">Description</th>
                    <th className="border border-black py-1">Special</th>
                    <th className="border border-black py-1">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {otherItems.map((item, index) => (
                    <tr key={index} className="bg-gray-100">
                      <td className="border border-black py-1" style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>
                        {item.equipment_name}
                      </td>
                      <td className="border border-black py-1" style={{ wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
                        {item.description || ''}
                      </td>
                      <td className="border border-black py-1" style={{ wordWrap: 'break-word' }}>
                        {item.special || ''}
                      </td>
                      <td className="border border-black py-1 text-center">
                        <button onClick={() => handleOtherItemDelete(index)} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== ACTIONS TAB ==================== */}
        {activeTab === 'actions' && (
          <div className="flex-1 text-left" style={{ minHeight: '600px' }}>
            <h2 className="font-bold text-lg mb-3">Actions</h2>

            <h3 className="font-bold text-lg mt-4 mb-3">Equipped Weapons</h3>
            <table className="border border-black w-full text-left mt-2" style={{ tableLayout: 'fixed' }}>
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
                  .map((item, index) => {
                    const pool = getFinalDicePool(item.skill, skills.find(s => s.skill === item.skill)?.stat || 'agility');
                    return (
                      <tr key={index} className="bg-gray-100">
                        <td className="border border-black py-1" style={{ minWidth: '200px', wordWrap: 'break-word' }}>{item.equipment_name}</td>
                        <td className="border border-black py-1" style={{ minWidth: '250px', wordWrap: 'break-word' }}>
                          {item.skill} (
                          <span 
                            className="cursor-pointer hover:underline text-blue-700"
                            onClick={(e) => handleDicePoolClick(e, pool, item.skill)}
                          >
                            {pool}
                          </span>
                          )
                        </td>
                        <td className="border border-black py-1" style={{ minWidth: '150px' }}>{item.range}</td>
                        <td className="border border-black py-1" style={{ minWidth: '100px' }}>{item.damage || ''}</td>
                        <td className="border border-black py-1" style={{ minWidth: '100px' }}>{item.critical || ''}</td>
                        <td className="border border-black py-1" style={{ minWidth: '700px', wordWrap: 'break-word' }}>{item.special || ''}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>

            {consumableList.length > 0 && (
              <div className="mt-6">
                <h3 className="font-bold text-lg mb-3">Consumables</h3>
                <table className="border border-black w-full text-left mt-2" style={{ tableLayout: 'fixed', width: '100%' }}>
                  <colgroup>
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '58%' }} />
                    <col style={{ width: '25%' }} />
                    <col style={{ width: '5%' }} />
                  </colgroup>
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-black py-1">Name</th>
                      <th className="border border-black py-1">Description</th>
                      <th className="border border-black py-1">Special</th>
                      <th className="border border-black py-1">Use</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consumableList.map((item, index) => (
                      <tr key={index} className="bg-gray-100">
                        <td className="border border-black py-1" style={{ wordWrap: 'break-word', whiteSpace: 'normal' }}>
                          {item.name} x{item.count}
                        </td>
                        <td className="border border-black py-1" style={{ wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
                          {item.description || ''}
                        </td>
                        <td className="border border-black py-1" style={{ wordWrap: 'break-word' }}>
                          {item.special || ''}
                        </td>
                        <td className="border border-black py-1 text-center">
                          <button
                            onClick={() => handleUseConsumable(item.name)}
                            disabled={item.count === 0}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                          >
                            Use
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {racialAbilityList.length > 0 && (
              <div className="mt-6">
                <h3 className="font-bold text-lg mb-3">Racial Abilities</h3>
                <table className="border border-black w-full text-left mt-2" style={{ tableLayout: 'fixed' }}>
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
                          <td className="border border-black py-1" style={{ minWidth: '300px', wordWrap: 'break-word' }}>{ability.name}</td>
                          <td className="border border-black py-1" style={{ minWidth: '700px', wordWrap: 'break-word' }}>{ability.description}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {Array.from(new Set(abilities.map(a => a.activation)))
              .sort((a, b) => a.localeCompare(b))
              .map(activation => {
                const sortedInGroup = abilities
                  .filter(a => a.activation === activation)
                  .sort((a, b) => a.displayName.localeCompare(b.displayName));

                return (
                  <div key={activation} className="mt-6">
                    <h3 className="font-bold text-lg mb-3">{activation} Abilities</h3>
                    <table className="border border-black w-full text-left mt-2" style={{ tableLayout: 'fixed' }}>
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

        {backstory && (
          <div className="border-2 border-black rounded-lg p-4 w-full text-center mt-4" style={{ minHeight: '500px' }}>
            <h3 className="font-bold text-lg mb-3">Backstory</h3>
            <p className="text-left">{backstory}</p>
          </div>
        )}

        {/* NEW: Dynamic Dice Pool Popup */}
        {dicePopup && (
          <div
              style={{
                position: 'absolute',
                left: `${dicePopup.x}px`,
                top: `${dicePopup.y}px`,
                backgroundColor: 'white',
                border: '3px solid black',
                padding: '18px',
                borderRadius: '10px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                zIndex: 9999,
                minWidth: '760px',
                display: 'flex',
                flexDirection: 'column',
                pointerEvents: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
            >
            <button
              onClick={() => setDicePopup(null)}
              style={{ position: 'absolute', top: 8, right: 8, zIndex: 10000 }}
              className="text-2xl font-bold text-red-600 hover:text-red-800 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md"
              aria-label="Close dice popup"
            >
              ×
            </button>
            <h3 className="font-bold text-lg mb-4" style={{ color: '#000' }}>{dicePopup.label || 'Dice Pool'}</h3>

            {/* MAIN FLEX: left column + outcome panel */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>

            {/* LEFT COLUMN: pool, boosts, setbacks, difficulty, roll */}
            <div style={{ flex: '0 0 420px' }}>

            <div className="flex items-end mb-1" style={{ gap: 8, alignItems: 'flex-end' }}>
              {dicePopup.details.map((d, i) => (
                <div key={i} className="flex flex-col items-center" style={{ minWidth: 56 }}>
                  <button
                    onClick={() => {
                      setDicePopup(prev => {
                        const updated = { ...prev };
                        updated.details = [...(prev?.details || [])];
                        updated.details.splice(i, 1);
                        return updated;
                      });
                      setRollResults(null);
                    }}
                    className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs font-bold mb-1"
                  >
                    Remove
                  </button>
                  {d.color === 'Y' ? (
                    <button
                      onClick={() => {
                        setDicePopup(prev => {
                          const updated = { ...prev };
                          updated.details = [...(prev?.details || [])];
                          updated.details[i] = { ...updated.details[i], color: 'G', name: diceMap['G'] || 'Ability' };
                          return updated;
                        });
                        setRollResults(null);
                      }}
                      className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-bold mb-1"
                    >
                      Downgrade
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setDicePopup(prev => {
                          const updated = { ...prev };
                          updated.details = [...(prev?.details || [])];
                          updated.details[i] = { ...updated.details[i], color: 'Y', name: diceMap['Y'] || 'Proficiency' };
                          return updated;
                        });
                        setRollResults(null);
                      }}
                      className="px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-xs font-bold mb-1"
                    >
                      Upgrade
                    </button>
                  )}
                  <div className="text-xs font-medium mb-1 text-center" style={{ maxWidth: 80, color: '#000' }}>{d.name}</div>
                  <div
                    aria-hidden
                    style={{
                      width: 48,
                      height: 48,
                      border: '3px solid black',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 4,
                      ...getDiceColorStyle(d.color),
                    }}
                  >
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', width: '100%' }}>
                        {splitResultLines(rollResults?.poolResults?.[i] || '').map((ln, idx) => (
                          <div key={idx} style={{ fontSize: 12, lineHeight: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 72, color: '#000' }}>
                            {ln}
                          </div>
                        ))}
                      </div>
                  </div>
                </div>
              ))}

              {/* Boost and Threat (setback) controls to the right of top dice */}
              <div style={{ display: 'flex', gap: 8, marginLeft: 6 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <button
                    onClick={() => {
                      setDicePopup(prev => ({ 
                        ...(prev || {}), 
                        details: [...(prev?.details || []), { color: 'G', name: diceMap['G'] || 'Ability' }] 
                      }));
                      setRollResults(null);
                    }}
                    className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-bold"
                  >
                    + Ability
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  {dicePopup?.boosts && dicePopup.boosts.length > 0 && (
                    <button
                      onClick={() => {
                        setDicePopup(prev => {
                          const cur = prev || {};
                          const curBoosts = cur.boosts || [];
                          return { ...cur, boosts: curBoosts.slice(0, -1) };
                        });
                        setRollResults(null);
                      }}
                      className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-bold"
                    >
                      - Boost
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setDicePopup(prev => ({ ...(prev || {}), boosts: [...(prev?.boosts || []), { color: 'B', name: diceMap['B'] || 'Boost' }] }));
                      setRollResults(null);
                    }}
                    className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-bold"
                  >
                    + Boost
                  </button>
                </div>
              </div>
            </div>

            {/* Render any boost dice underneath the top row */}
            {dicePopup.boosts && dicePopup.boosts.length > 0 && (
              <div className="flex items-end mt-2" style={{ gap: 8 }}>
                {dicePopup.boosts.map((b, bi) => {
                  const idx = (dicePopup.details?.length || 0) + bi;
                  return (
                    <div key={bi} className="flex flex-col items-center" style={{ minWidth: 56 }}>
                      <div className="text-xs font-medium mb-1 text-center" style={{ maxWidth: 80, color: '#000' }}>{b.name}</div>
                      <div
                        aria-hidden
                        style={{
                          width: 48,
                          height: 48,
                          border: '3px solid black',
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 4,
                          ...getDiceColorStyle(b.color),
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', width: '100%' }}>
                          {splitResultLines(rollResults?.poolResults?.[idx] || '').map((ln, idx2) => (
                            <div key={idx2} style={{ fontSize: 12, lineHeight: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 72, color: '#000' }}>
                              {ln}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            

            <div className="mt-6 pt-4 border-t border-gray-300">
              <label className="text-xs font-medium mb-2 block" style={{ color: '#000' }}>Difficulty (1-5)</label>
              <div className="flex gap-2 mb-3 items-center">
                {[1, 2, 3, 4, 5].map(num => (
                  <button
                    key={num}
                    onClick={() => setSelectedDifficulty(num)}
                    className={`w-8 h-8 rounded font-bold text-sm ${
                      selectedDifficulty === num
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {num}
                  </button>
                ))}

                {/* Setback controls to the right of difficulty numbers (to the right of 5) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginLeft: 8 }}>
                  {dicePopup?.setbacks && dicePopup.setbacks.length > 0 && (
                    <button
                      onClick={() => {
                        setDicePopup(prev => {
                          const cur = prev || {};
                          const curSetbacks = cur.setbacks || [];
                          return { ...cur, setbacks: curSetbacks.slice(0, -1) };
                        });
                        setRollResults(null);
                      }}
                      className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-bold"
                    >
                      - Setback
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setDicePopup(prev => ({ ...(prev || {}), setbacks: [...(prev?.setbacks || []), { color: 'K', name: diceMap['K'] || diceMap['Black'] || 'Setback' }] }));
                      setRollResults(null);
                    }}
                    className="px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-800 text-xs font-bold"
                  >
                    + Setback
                  </button>
                </div>
              </div>
              {selectedDifficulty > 0 && (
                <div className="flex items-end gap-2">
                  {Array.from({ length: selectedDifficulty }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: 48,
                        height: 48,
                        border: '3px solid black',
                        borderRadius: 6,
                        backgroundColor: '#b36bff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: '700',
                        padding: 4,
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                          {splitResultLines(rollResults?.diffResults?.[i] || '').map((ln, idx) => (
                          <div key={idx} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 48, lineHeight: '1rem' }}>
                            {ln}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Render any setback dice underneath difficulty */}
              {dicePopup?.setbacks && dicePopup.setbacks.length > 0 && (
                <div className="flex items-end gap-2 mt-2">
                  {dicePopup.setbacks.map((s, si) => {
                    const idx = (selectedDifficulty || 0) + si;
                    return (
                      <div
                        key={si}
                        style={{
                          width: 48,
                          height: 48,
                          border: '3px solid black',
                          borderRadius: 6,
                          backgroundColor: '#333333',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: '700',
                          padding: 4,
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                          {splitResultLines(rollResults?.diffResults?.[idx] || '').map((ln, idx2) => (
                            <div key={idx2} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 48, lineHeight: '1rem', color: '#fff' }}>
                              {ln}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-3">
                <button
                  onClick={handleRoll}
                  className="w-full px-3 py-2 bg-green-600 text-white rounded font-bold hover:bg-green-700"
                >
                  Roll
                </button>
              </div>

              {/* rollResults displayed inside the dice boxes; no separate results area */}
            </div>
            </div>

            {/* Outcome panel to the right */}
            <div style={{ flex: '0 0 260px', borderLeft: '1px solid #e5e7eb', paddingLeft: 12 }}>
              <h4 className="font-bold text-lg mb-2" style={{ color: '#000' }}>Outcome</h4>
              {!rollResults && (
                <div className="text-sm text-gray-500">No roll yet. Press <strong>Roll</strong> to show outcome.</div>
              )}

              {rollResults && (
                <div className="text-sm" style={{ color: '#000' }}>
                  {(() => {
                    const parsed = parseRollResults(rollResults.poolResults, rollResults.diffResults);
                    return (
                      <>
                        {parsed.netSuccess > 0 && (
                          <div className="mb-2">
                            {parsed.netSuccess} Success
                            {parsed.counts.triumph > 0 && (
                              <span className="text-xs text-gray-600"> (includes {parsed.counts.triumph} Triumph)</span>
                            )}
                          </div>
                        )}
                        {parsed.netFailure > 0 && (
                          <div className="mb-2">
                            {parsed.netFailure} Failure
                            {parsed.counts.despair > 0 && (
                              <span className="text-xs text-gray-600"> (includes {parsed.counts.despair} Despair)</span>
                            )}
                          </div>
                        )}
                        {parsed.netSuccess === 0 && parsed.netFailure === 0 && (
                          <div className="mb-2 text-gray-500">No net success/failure</div>
                        )}

                        {parsed.netAdvantage > 0 && (
                          <div className="mb-2">
                            {parsed.netAdvantage} Advantage (Positive Side Effect)
                          </div>
                        )}
                        {parsed.netThreat > 0 && (
                          <div className="mb-2">
                            {parsed.netThreat} Threat (Negative Side Effect)
                          </div>
                        )}
                        {parsed.netAdvantage === 0 && parsed.netThreat === 0 && (
                          <div className="mb-2 text-gray-500">No net advantage/threat</div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}