
import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, Fragment } from 'react';
import { supabase } from '../supabaseClient';

// Force Power Tree Talent Name dropdown state
// (must be after imports)


export default function Settings() {
  const location = useLocation();
  const navigate = useNavigate();

  // --- Force Power Tree Talent Name dropdown state ---
  const [forceTalentNames, setForceTalentNames] = useState([]);
  const [selectedForceTalentName, setSelectedForceTalentName] = useState('');
  const [selectedForceTalentDescription, setSelectedForceTalentDescription] = useState('');
  const [forceTalentCost, setForceTalentCost] = useState('');
  // State for grid talents (16 boxes: 1-4 in first row, 5-8 in second, etc.)
  const [gridTalents, setGridTalents] = useState(Array(16).fill(null).map(() => ({ name: '', cost: '', description: '' })));
  // State for tracking merged boxes: { "0-1": true } means boxes 0 and 1 are merged
  const [mergedBoxes, setMergedBoxes] = useState({});
  // State for merge confirmation dialog
  const [mergePending, setMergePending] = useState(null); // { boxIndex, direction, mergeKey }
  // State for tracking which boxes are in "add new talent" mode
  const [addingNewTalent, setAddingNewTalent] = useState({}); // { boxIndex: true }
  const [newTalentNames, setNewTalentNames] = useState({}); // { boxIndex: 'name' }
  const [newTalentDescriptions, setNewTalentDescriptions] = useState({}); // { boxIndex: 'description' }
  // State for top talent box add new mode
  const [addingNewTopTalent, setAddingNewTopTalent] = useState(false);
  const [newTopTalentName, setNewTopTalentName] = useState('');
  const [newTopTalentDescription, setNewTopTalentDescription] = useState('');
  // State for checkbox links - tracks which checkboxes are checked
  // For grid: gridCheckboxLinks[boxIndex] = { up: bool, down: bool, left: bool, right: bool }
  const [gridCheckboxLinks, setGridCheckboxLinks] = useState(Array(16).fill(null).map(() => ({ up: false, down: false, left: false, right: false })));
  const [forceLinkEditorIndex, setForceLinkEditorIndex] = useState(0);

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
  // Add Force Tree tab state
  const [showAddForceTreeForm, setShowAddForceTreeForm] = useState(false);
  const [powerTreeName, setPowerTreeName] = useState('');
  const [forcePrerequisite, setForcePrerequisite] = useState('');
  const [existingForceTrees, setExistingForceTrees] = useState([]);
  const [selectedForceTreeId, setSelectedForceTreeId] = useState('__new__');
  const [showAddEquipmentForm, setShowAddEquipmentForm] = useState(false);
  const [showAddShipForm, setShowAddShipForm] = useState(false);
  const [showAddCareerForm, setShowAddCareerForm] = useState(false);
  const [existingCareers, setExistingCareers] = useState([]);
  const [careerBooks, setCareerBooks] = useState([]);
  const [editingCareerId, setEditingCareerId] = useState(null);
  const [careerName, setCareerName] = useState('');
  const [careerDescription, setCareerDescription] = useState('');
  const [careerSkills, setCareerSkills] = useState([]);
  const [careerSourceBook, setCareerSourceBook] = useState('');
  const [careerForceSensitive, setCareerForceSensitive] = useState(false);
  const [savingCareer, setSavingCareer] = useState(false);

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
  const [savingPRace, setSavingPRace] = useState(false);

  // -----------------------------------------------------------------
  // 2b. DND Section State
  // -----------------------------------------------------------------
  const [showDndSection, setShowDndSection] = useState(false);
  const [showAddDndClassForm, setShowAddDndClassForm] = useState(false);
  const [showAddDndSubclassForm, setShowAddDndSubclassForm] = useState(false);
  const [showAddDndSubRaceForm, setShowAddDndSubRaceForm] = useState(false);
  const [showDndRacePictures, setShowDndRacePictures] = useState(false);
  const [showDndClassPictures, setShowDndClassPictures] = useState(false);
  const [showAddDndRaceForm, setShowAddDndRaceForm] = useState(false);
  const [showAddDndPictureForm, setShowAddDndPictureForm] = useState(false);
  const [showAddDndBackgroundForm, setShowAddDndBackgroundForm] = useState(false);
  const [showAddDndEquipmentForm, setShowAddDndEquipmentForm] = useState(false);
  const [showAddDndSpellForm, setShowAddDndSpellForm] = useState(false);
  const [existingDndClasses, setExistingDndClasses] = useState([]); // All existing DND classes
  const [existingDndSubclasses, setExistingDndSubclasses] = useState([]);
  const [existingDndSubRaces, setExistingDndSubRaces] = useState([]);
  const [existingDndRaces, setExistingDndRaces] = useState([]);
  const [existingDndPictures, setExistingDndPictures] = useState([]);
  const [existingDndBackgrounds, setExistingDndBackgrounds] = useState([]);
  const [existingDndEquipment, setExistingDndEquipment] = useState([]);
  const [existingDndSpells, setExistingDndSpells] = useState([]);
  const [selectedDndClassId, setSelectedDndClassId] = useState('__new__');
  const [selectedDndSubclassId, setSelectedDndSubclassId] = useState('__new__');
  const [selectedDndSubRaceId, setSelectedDndSubRaceId] = useState('__new__');
  const [selectedDndRaceId, setSelectedDndRaceId] = useState('__new__');
  const [selectedDndPictureLinkId, setSelectedDndPictureLinkId] = useState('__new__');
  const [selectedDndClassPerRacePicture, setSelectedDndClassPerRacePicture] = useState({});
  const [selectedDndRacePerClassPicture, setSelectedDndRacePerClassPicture] = useState({});
  const [selectedDndBackgroundId, setSelectedDndBackgroundId] = useState('__new__');
  const [selectedDndEquipmentId, setSelectedDndEquipmentId] = useState('__new__');
  const [selectedDndSpellId, setSelectedDndSpellId] = useState('__new__');
  const [availableDndTTRPGs, setAvailableDndTTRPGs] = useState([]); // TTRPGs with DND_Mod = true
  const [selectedDndTTRPGs, setSelectedDndTTRPGs] = useState([]); // Selected TTRPG IDs
  const [dndClassName, setDndClassName] = useState('');
  const [dndSubclassName, setDndSubclassName] = useState('');
  const [dndSubclassDescription, setDndSubclassDescription] = useState('');
  const [dndSubclassClassId, setDndSubclassClassId] = useState('');
  const [savingDndSubclass, setSavingDndSubclass] = useState(false);
  const [dndClassDescription, setDndClassDescription] = useState('');
  const [dndHitDice, setDndHitDice] = useState('');
  const [dndProfArmour, setDndProfArmour] = useState('');
  const [dndProfWeapons, setDndProfWeapons] = useState('');
  const [dndProfSavingThrows, setDndProfSavingThrows] = useState('');
  const [dndProfSkills, setDndProfSkills] = useState('');
  const [dndPointsName, setDndPointsName] = useState('');
  const [dndAttire, setDndAttire] = useState('');
  const [dndExtraLevelFieldInput, setDndExtraLevelFieldInput] = useState('');
  const [dndExtraLevelFields, setDndExtraLevelFields] = useState([]);
  const [dndMod, setDndMod] = useState('');
  const [savingDndClass, setSavingDndClass] = useState(false);
  const createDndClassLevels = () => Array.from({ length: 20 }, () => ({
    proficiencyBonus: '',
    features: [],
    cantrips: '',
    spells: '',
    points: '',
    extraValues: {}
  }));
  const [dndClassLevels, setDndClassLevels] = useState(createDndClassLevels);
  const createDndSubclassLevels = () => Array.from({ length: 20 }, () => ({
    features: [],
  }));
  const [dndSubclassLevels, setDndSubclassLevels] = useState(createDndSubclassLevels);
  const [dndClassFeatures, setDndClassFeatures] = useState([]);
  const [loadingDndClassFeatures, setLoadingDndClassFeatures] = useState(false);
  const [showAddFeatureForm, setShowAddFeatureForm] = useState(false);
  const [newFeatureName, setNewFeatureName] = useState('');
  const [newFeatureText, setNewFeatureText] = useState('');
  const [savingDndFeature, setSavingDndFeature] = useState(false);
  const [activeFeaturePickerIndex, setActiveFeaturePickerIndex] = useState(null);
  const [featureTargetLevelIndex, setFeatureTargetLevelIndex] = useState(null);
  const [showAddSubclassFeatureForm, setShowAddSubclassFeatureForm] = useState(false);
  const [newSubclassFeatureName, setNewSubclassFeatureName] = useState('');
  const [newSubclassFeatureText, setNewSubclassFeatureText] = useState('');
  const [savingDndSubclassFeature, setSavingDndSubclassFeature] = useState(false);
  const [activeSubclassFeaturePickerIndex, setActiveSubclassFeaturePickerIndex] = useState(null);
  const [subclassFeatureTargetLevelIndex, setSubclassFeatureTargetLevelIndex] = useState(null);

  const [dndRaceName, setDndRaceName] = useState('');
  const [dndRaceDescription, setDndRaceDescription] = useState('');
  const [dndRaceLook, setDndRaceLook] = useState('');
  const [dndRaceSkinColour, setDndRaceSkinColour] = useState('');
  const [dndRaceSize, setDndRaceSize] = useState('');
  const [dndRaceSpeed, setDndRaceSpeed] = useState('');
  const [dndRaceLanguages, setDndRaceLanguages] = useState('');
  const [dndRaceSelectedTraits, setDndRaceSelectedTraits] = useState([]);
  const [dndRaceTraitPickerValue, setDndRaceTraitPickerValue] = useState('');
  const [showAddDndRaceTraitForm, setShowAddDndRaceTraitForm] = useState(false);
  const [newDndRaceTraitName, setNewDndRaceTraitName] = useState('');
  const [newDndRaceTraitText, setNewDndRaceTraitText] = useState('');
  const [savingDndRaceTrait, setSavingDndRaceTrait] = useState(false);
  const createDefaultDndRaceAbilityBonusRules = () => ({
    fixed: [],
    choices: [],
  });
  const [dndRaceAbilityBonusRules, setDndRaceAbilityBonusRules] = useState(createDefaultDndRaceAbilityBonusRules);
  const [savingDndRace, setSavingDndRace] = useState(false);

  const [dndSubRaceName, setDndSubRaceName] = useState('');
  const [dndSubRaceDescription, setDndSubRaceDescription] = useState('');
  const [dndSubRaceRaceId, setDndSubRaceRaceId] = useState('');
  const [dndSubRaceSelectedTraits, setDndSubRaceSelectedTraits] = useState([]);
  const [dndSubRaceTraitPickerValue, setDndSubRaceTraitPickerValue] = useState('');
  const [showAddDndSubRaceTraitForm, setShowAddDndSubRaceTraitForm] = useState(false);
  const [newDndSubRaceTraitName, setNewDndSubRaceTraitName] = useState('');
  const [newDndSubRaceTraitText, setNewDndSubRaceTraitText] = useState('');
  const [savingDndSubRaceTrait, setSavingDndSubRaceTrait] = useState(false);
  const createDefaultDndSubRaceAbilityBonusRules = () => ({
    fixed: [],
    choices: [],
  });
  const [dndSubRaceAbilityBonusRules, setDndSubRaceAbilityBonusRules] = useState(createDefaultDndSubRaceAbilityBonusRules);
  const [savingDndSubRace, setSavingDndSubRace] = useState(false);

  const [dndPictureClassId, setDndPictureClassId] = useState('');
  const [dndPictureRaceId, setDndPictureRaceId] = useState('');
  const [dndPictureId, setDndPictureId] = useState('');
  const [savingDndPicture, setSavingDndPicture] = useState(false);

  const [dndBackgroundName, setDndBackgroundName] = useState('');
  const [dndBackgroundDescription, setDndBackgroundDescription] = useState('');
  const [dndBackgroundSkillProficiencies, setDndBackgroundSkillProficiencies] = useState('');
  const [dndBackgroundToolProficiencies, setDndBackgroundToolProficiencies] = useState('');
  const [dndBackgroundLanguages, setDndBackgroundLanguages] = useState('');
  const [dndBackgroundFeatureName, setDndBackgroundFeatureName] = useState('');
  const [dndBackgroundFeatureText, setDndBackgroundFeatureText] = useState('');
  const [dndBackgroundStartingEquipment, setDndBackgroundStartingEquipment] = useState('');
  const [savingDndBackground, setSavingDndBackground] = useState(false);

  const [dndEquipmentName, setDndEquipmentName] = useState('');
  const [dndEquipmentCategory, setDndEquipmentCategory] = useState('');
  const [dndEquipmentDescription, setDndEquipmentDescription] = useState('');
  const [dndEquipmentCost, setDndEquipmentCost] = useState('');
  const [dndEquipmentWeight, setDndEquipmentWeight] = useState('');
  const [dndEquipmentProperties, setDndEquipmentProperties] = useState('');
  const [dndEquipmentDamage, setDndEquipmentDamage] = useState('');
  const [dndEquipmentDamageType, setDndEquipmentDamageType] = useState('');
  const [dndEquipmentArmorClass, setDndEquipmentArmorClass] = useState('');
  const [dndEquipmentAllowedClasses, setDndEquipmentAllowedClasses] = useState('');
  const [savingDndEquipment, setSavingDndEquipment] = useState(false);

  const [dndSpellName, setDndSpellName] = useState('');
  const [dndSpellLevel, setDndSpellLevel] = useState('0');
  const [dndSpellSchool, setDndSpellSchool] = useState('');
  const [dndSpellCastingTime, setDndSpellCastingTime] = useState('');
  const [dndSpellRange, setDndSpellRange] = useState('');
  const [dndSpellComponents, setDndSpellComponents] = useState('');
  const [dndSpellDuration, setDndSpellDuration] = useState('');
  const [dndSpellDescription, setDndSpellDescription] = useState('');
  const [dndSpellClassList, setDndSpellClassList] = useState('');
  const [savingDndSpell, setSavingDndSpell] = useState(false);

  // -----------------------------------------------------------------
  // 2c. Add Species Form State
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
  // 2c. Add Specialization Form State
  // -----------------------------------------------------------------
  const [specName, setSpecName] = useState('');
  const [specCareer, setSpecCareer] = useState('');
  const [specDescription, setSpecDescription] = useState('');
  const [specSkills, setSpecSkills] = useState([]);
  const [specTalentTree, setSpecTalentTree] = useState({}); // { boxIndex: talentName }
  const [specTalentDescriptions, setSpecTalentDescriptions] = useState({}); // { boxIndex: description }
  const [specTalentActivations, setSpecTalentActivations] = useState({}); // { boxIndex: 'Passive'|'Active' }
  const [specTalentLinks, setSpecTalentLinks] = useState({}); // { 'row_col_direction': true/false }
  const [customTalentInputMode, setCustomTalentInputMode] = useState({}); // { boxIndex: true/false }
  const [isCustomTalent, setIsCustomTalent] = useState({}); // { boxIndex: true/false }
  const [availableCareers, setAvailableCareers] = useState([]);
  const [careersWithIds, setCareersWithIds] = useState([]);
  const [availableTalentsForTree, setAvailableTalentsForTree] = useState([]);
  const [existingSpecs, setExistingSpecs] = useState([]); // full rows for editing
  const [editingSpecId, setEditingSpecId] = useState(null);
  const [abilityMapById, setAbilityMapById] = useState({}); // { id: { name, description, activation } }
  const [savingSpec, setSavingSpec] = useState(false);
  const [specConflict, setSpecConflict] = useState(null); // { id, name }
  const [abilityConflicts, setAbilityConflicts] = useState([]); // [{ name, id }]
  const [abilityConflictAction, setAbilityConflictAction] = useState(null); // 'addNew' | 'update'

  // -----------------------------------------------------------------
  // 2e. Add Equipment Form State
  // -----------------------------------------------------------------
  const [equipmentName, setEquipmentName] = useState('');
  const [equipmentDescription, setEquipmentDescription] = useState('');
  const [equipmentSkillId, setEquipmentSkillId] = useState('');
  const [equipmentRange, setEquipmentRange] = useState('');
  const [equipmentEncumbrance, setEquipmentEncumbrance] = useState('');
  const [equipmentPrice, setEquipmentPrice] = useState('');
  const [equipmentRarity, setEquipmentRarity] = useState('');
  const [equipmentDamage, setEquipmentDamage] = useState('');
  const [equipmentCritical, setEquipmentCritical] = useState('');
  const [equipmentHP, setEquipmentHP] = useState('');
  const [equipmentSpecial, setEquipmentSpecial] = useState('');
  const [equipmentSoak, setEquipmentSoak] = useState('');
  const [equipmentDamageRange, setEquipmentDamageRange] = useState('');
  const [equipmentDamageMelee, setEquipmentDamageMelee] = useState('');
  const [equipmentConsumable, setEquipmentConsumable] = useState(false);
  const [availableSkillsDetailed, setAvailableSkillsDetailed] = useState([]); // [{ id, skill }]
  const [existingSwEquipment, setExistingSwEquipment] = useState([]);
  const [selectedSwEquipmentId, setSelectedSwEquipmentId] = useState('__new__');

  // -----------------------------------------------------------------
  // 2f. Add Ship Form State
  // -----------------------------------------------------------------
  const [shipName, setShipName] = useState('');
  const [shipClass, setShipClass] = useState('');
  const [shipSilhouette, setShipSilhouette] = useState('');
  const [shipSpeed, setShipSpeed] = useState('');
  const [shipHandling, setShipHandling] = useState('');
  const [shipArmor, setShipArmor] = useState('');
  const [shipDefenceFore, setShipDefenceFore] = useState('');
  const [shipDefencePort, setShipDefencePort] = useState('');
  const [shipDefenceStarboard, setShipDefenceStarboard] = useState('');
  const [shipDefenceAft, setShipDefenceAft] = useState('');
  const [shipHullThreshold, setShipHullThreshold] = useState('');
  const [shipSystemThreshold, setShipSystemThreshold] = useState('');
  const [shipManufacturer, setShipManufacturer] = useState('');
  const [shipHyperdrivePrimary, setShipHyperdrivePrimary] = useState('');
  const [shipHyperdriveBackup, setShipHyperdriveBackup] = useState('');
  const [shipNavicomputer, setShipNavicomputer] = useState('');
  const [shipSensorRange, setShipSensorRange] = useState('');
  const [shipComplement, setShipComplement] = useState('');
  const [shipEncumbranceCapacity, setShipEncumbranceCapacity] = useState('');
  const [shipPassengerCapacity, setShipPassengerCapacity] = useState('');
  const [shipConsumables, setShipConsumables] = useState('');
  const [shipPriceCredits, setShipPriceCredits] = useState('');
  const [shipRarity, setShipRarity] = useState('');
  const [shipCustomizationHardPoints, setShipCustomizationHardPoints] = useState('');
  const [shipWeapons, setShipWeapons] = useState('');
  const [shipSource, setShipSource] = useState('');
  const [shipDescription, setShipDescription] = useState('');
  const [existingSwShips, setExistingSwShips] = useState([]);
  const [selectedSwShipId, setSelectedSwShipId] = useState('__new__');

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
  // 4. Fetch Admin Status and Upload Pictures Setting
  // -----------------------------------------------------------------
  useEffect(() => {
    console.log('Player ID:', playerId ?? '—');

    const fetchAdminStatus = async () => {
      try {
        if (!playerId) {
          setLoading(false);
          return;
        }

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

  // Fetch Upload Pictures setting
  useEffect(() => {
    const fetchUploadPicturesSetting = async () => {
      try {
        const { data, error } = await supabase
          .from('user')
          .select('Upload_pictures')
          .eq('id', 1)
          .single();

        if (error) throw error;

        setUploadPicturesEnabled(data?.Upload_pictures === true);
      } catch (err) {
        console.error('Failed to fetch Upload Pictures setting:', err);
      }
    };

    if (isAdmin) {
      fetchUploadPicturesSetting();
    }
  }, [isAdmin]);

  // Fetch skills when Add Species, Add Specialization, Add Career, or Add Equipment form is shown
  useEffect(() => {
    const fetchSkills = async () => {
      if (!showAddSpeciesForm && !showAddSpecializationForm && !showAddCareerForm && !showAddEquipmentForm) return;

      try {
        const { data, error } = await supabase
          .from('skills')
          .select('id, skill, type')
          .order('skill');

        if (error) throw error;

        const skillNames = data?.map(s => s.skill) || [];
        setAvailableSkills(skillNames);
        setAvailableSkillsDetailed(data || []);
      } catch (err) {
        console.error('Failed to fetch skills:', err);
      }
    };

    fetchSkills();
  }, [showAddSpeciesForm, showAddSpecializationForm, showAddCareerForm, showAddEquipmentForm]);

  // Fetch existing careers when Add Career form is shown
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

  // Fetch existing SW equipment for editing/deleting when form is shown
  useEffect(() => {
    const fetchSwEquipment = async () => {
      if (!showAddEquipmentForm) return;

      try {
        const { data, error } = await supabase
          .from('SW_equipment')
          .select('id, name, description, skill, range, encumbrance, price, rarity, damage, critical, HP, special, soak, defence_range, defence_melee, consumable')
          .order('name');

        if (error) throw error;

        setExistingSwEquipment(data || []);
      } catch (err) {
        console.error('Failed to fetch SW equipment:', err);
      }
    };

    fetchSwEquipment();
  }, [showAddEquipmentForm]);

  // Fetch existing SW ships for editing/deleting when form is shown
  useEffect(() => {
    const fetchSwShips = async () => {
      if (!showAddShipForm) return;

      try {
        const { data, error } = await supabase
          .from('SW_ships')
          .select('id, name, class, silhouette, speed, handling, armor, defence_fore, defence_port, defence_starboard, defence_aft, hull_trauma_threshold, system_strain_threshold, manufacturer, hyperdrive_primary, hyperdrive_backup, navicomputer, sensor_range, ship_complement, encumbrance_capacity, passenger_capacity, consumables, price_credits, rarity, customization_hard_points, weapons, source, description')
          .order('name');

        if (error) throw error;

        setExistingSwShips(data || []);
      } catch (err) {
        console.error('Failed to fetch SW ships:', err);
      }
    };

    fetchSwShips();
  }, [showAddShipForm]);

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

  const createEmptyForceGrid = () => Array(16).fill(null).map(() => ({ name: '', cost: '', description: '' }));
  const createEmptyForceLinks = () => Array(16).fill(null).map(() => ({ up: false, down: false, left: false, right: false }));
  const parseJsonArray = (value) => {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const getMergedRangeForIndex = (idx, merges = mergedBoxes) => {
    const rowStart = Math.floor(idx / 4) * 4;
    const rowEnd = rowStart + 3;

    let start = idx;
    while (start > rowStart && merges[`${start - 1}-${start}`]) {
      start -= 1;
    }

    let end = idx;
    while (end < rowEnd && merges[`${end}-${end + 1}`]) {
      end += 1;
    }

    return { start, end, span: end - start + 1 };
  };

  const resetForceTreeForm = () => {
    setSelectedForceTreeId('__new__');
    setPowerTreeName('');
    setForcePrerequisite('');
    setSelectedForceTalentName('');
    setSelectedForceTalentDescription('');
    setForceTalentCost('');
    setGridTalents(createEmptyForceGrid());
    setMergedBoxes({});
    setGridCheckboxLinks(createEmptyForceLinks());
    setForceLinkEditorIndex(0);
    setAddingNewTopTalent(false);
    setNewTopTalentName('');
    setNewTopTalentDescription('');
    setAddingNewTalent({});
    setNewTalentNames({});
    setNewTalentDescriptions({});
    setMergePending(null);
  };

  const loadForceTreeIntoForm = (forceTree, availableTalents) => {
    if (!forceTree) return;

    const talentById = {};
    (availableTalents || forceTalentNames).forEach((talent) => {
      talentById[talent.id] = talent;
    });

    setSelectedForceTreeId(String(forceTree.id));
    setPowerTreeName(forceTree.PowerTreeName || '');
    setForcePrerequisite(forceTree.ForcePrerequisite || '');

    const nodes = parseJsonArray(forceTree.tree_nodes);
    const links = parseJsonArray(forceTree.tree_links);

    const topNode = nodes.find((node) => Number(node.row) === 1 && Number(node.col) === 1);
    const topTalentId = topNode?.talent_id ?? topNode?.talentId ?? null;
    const topTalent = talentById[topTalentId];
    setSelectedForceTalentName(topTalent?.talent_name || '');
    setSelectedForceTalentDescription(topTalent?.description || '');
    setForceTalentCost(topNode?.cost != null ? String(topNode.cost) : '');

    const loadedGrid = createEmptyForceGrid();
    const loadedLinks = createEmptyForceLinks();

    const loadedMerges = {};

    nodes.forEach((node) => {
      const row = Number(node.row);
      const col = Number(node.col);
      if (!Number.isInteger(row) || !Number.isInteger(col)) return;
      if (row < 2 || row > 5 || col < 1 || col > 4) return;

      const talentId = node.talent_id ?? node.talentId;
      const talent = talentById[talentId];
      const boxIndex = (row - 2) * 4 + (col - 1);

      loadedGrid[boxIndex] = {
        name: talent?.talent_name || '',
        description: talent?.description || '',
        cost: node.cost != null ? String(node.cost) : '',
      };

      const colSpan = Number(node.col_span ?? node.colSpan ?? 1);
      if (colSpan > 1 && col < 4) {
        const maxSpan = Math.min(colSpan, 5 - col);
        for (let offset = 0; offset < maxSpan - 1; offset++) {
          loadedMerges[`${boxIndex + offset}-${boxIndex + offset + 1}`] = true;
        }
      }
    });

    const applyLink = (fromRow, fromCol, toRow, toCol) => {
      if (fromRow === 1 && toRow === 2 && fromCol === 1 && toCol >= 1 && toCol <= 4) {
        const topIndex = toCol - 1;
        loadedLinks[topIndex] = { ...loadedLinks[topIndex], up: true };
        return;
      }

      if (fromRow < 2 || fromRow > 5 || fromCol < 1 || fromCol > 4) return;
      const boxIndex = (fromRow - 2) * 4 + (fromCol - 1);
      const current = loadedLinks[boxIndex] || { up: false, down: false, left: false, right: false };

      if (toRow === fromRow - 1 && toCol === fromCol) loadedLinks[boxIndex] = { ...current, up: true };
      if (toRow === fromRow + 1 && toCol === fromCol) loadedLinks[boxIndex] = { ...current, down: true };
      if (toRow === fromRow && toCol === fromCol - 1) loadedLinks[boxIndex] = { ...current, left: true };
      if (toRow === fromRow && toCol === fromCol + 1) loadedLinks[boxIndex] = { ...current, right: true };
    };

    links.forEach((link) => {
      const fromRow = Number(link.from_row ?? link.fromRow ?? link.from?.row);
      const fromCol = Number(link.from_col ?? link.fromCol ?? link.from?.col);
      const toRow = Number(link.to_row ?? link.toRow ?? link.to?.row);
      const toCol = Number(link.to_col ?? link.toCol ?? link.to?.col);

      if (![fromRow, fromCol, toRow, toCol].every(Number.isInteger)) return;
      applyLink(fromRow, fromCol, toRow, toCol);
    });

    setGridTalents(loadedGrid);
    setGridCheckboxLinks(loadedLinks);
    setForceLinkEditorIndex(0);
    setMergedBoxes(loadedMerges);
    setAddingNewTopTalent(false);
    setNewTopTalentName('');
    setNewTopTalentDescription('');
    setAddingNewTalent({});
    setNewTalentNames({});
    setNewTalentDescriptions({});
    setMergePending(null);
  };

  // Fetch Force Talents and Force Trees for Add/Edit Force Tree form
  useEffect(() => {
    const fetchForceTreeAdminData = async () => {
      try {
        const { data: talentsData, error: talentsError } = await supabase
          .from('SW_force_talents')
          .select('id, talent_name, description');

        if (talentsError) {
          console.error('Error fetching force talents:', talentsError);
          return;
        }

        const { data: treesData, error: treesError } = await supabase
          .from('SW_force_power_tree')
          .select('id, PowerTreeName, ForcePrerequisite, tree_nodes, tree_links')
          .order('PowerTreeName');
        
        if (treesError) {
          console.error('Error fetching force trees:', treesError);
          return;
        }

        if (talentsData) {
          const sortedTalents = talentsData.sort((a, b) => a.talent_name.localeCompare(b.talent_name));
          setForceTalentNames(sortedTalents);

          const sortedTrees = (treesData || []).slice().sort((a, b) =>
            String(a.PowerTreeName || '').localeCompare(String(b.PowerTreeName || ''))
          );
          setExistingForceTrees(sortedTrees);

          if (selectedForceTreeId !== '__new__') {
            const selectedTree = sortedTrees.find((tree) => String(tree.id) === String(selectedForceTreeId));
            if (selectedTree) {
              loadForceTreeIntoForm(selectedTree, sortedTalents);
            }
          }
        }
      } catch (err) {
        console.error('Unexpected error fetching force tree admin data:', err);
      }
    };

    if (showAddForceTreeForm && isAdmin) {
      fetchForceTreeAdminData();
    }
  }, [showAddForceTreeForm, isAdmin]);

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
        .from('user')
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
    setShowAddShipForm(false);
    setShowAddCareerForm(false);
    // Collapse Pathfinder section and its forms
    setShowPathfinderSection(false);
    setShowAddPathfinderRaceForm(false);
    setShowDndSection(false);
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
    setShowAddShipForm(false);
    setShowAddCareerForm(false);
    setShowAddPathfinderRaceForm(false);
    setShowDndSection(false);
  };

  const handleDndStats = () => {
    setShowDndSection(!showDndSection);
    // Collapse other sections when toggling DND
    setShowStarWarsSection(false);
    setShowPathfinderSection(false);
    setShowRacePictures(false);
    setShowCareerPictures(false);
    setShowAddSpeciesForm(false);
    setShowAddSpecializationForm(false);
    setShowAddEquipmentForm(false);
    setShowAddShipForm(false);
    setShowAddCareerForm(false);
    setShowAddForceTreeForm(false);
    setShowAddPathfinderRaceForm(false);
  };

  const handleAddPathfinderRace = () => {
    setShowAddPathfinderRaceForm(true);
    setShowRacePictures(false);
    setShowCareerPictures(false);
    setShowAddSpeciesForm(false);
    setShowAddSpecializationForm(false);
    setShowAddEquipmentForm(false);
    setShowAddShipForm(false);
    setShowAddCareerForm(false);
    loadPathfinderRaces();
  };


  const handleRacePictures = () => {
    setShowRacePictures(true);
    setShowCareerPictures(false);
    setShowAddSpeciesForm(false);
    setShowAddSpecializationForm(false);
    setShowAddShipForm(false);
    setShowAddCareerForm(false);
  };

  const handleCareerPictures = () => {
    setShowCareerPictures(true);
    setShowRacePictures(false);
    setShowAddSpeciesForm(false);
    setShowAddSpecializationForm(false);
    setShowAddShipForm(false);
    setShowAddCareerForm(false);
  };

  const handleAddSpecies = () => {
    setShowAddSpeciesForm(true);
    setShowAddSpecializationForm(false);
    setShowAddEquipmentForm(false);
    setShowAddShipForm(false);
    setShowAddCareerForm(false);
    setShowRacePictures(false);
    setShowCareerPictures(false);
  };


  const handleAddSpecialization = () => {
    setShowAddSpecializationForm(true);
    setShowAddForceTreeForm(false);
    setShowAddSpeciesForm(false);
    setShowAddEquipmentForm(false);
    setShowAddShipForm(false);
    setShowAddCareerForm(false);
    setShowRacePictures(false);
    setShowCareerPictures(false);
  };

  const handleAddForceTree = () => {
    setShowAddForceTreeForm(true);
    setShowAddSpecializationForm(false);
    setShowAddSpeciesForm(false);
    setShowAddEquipmentForm(false);
    setShowAddShipForm(false);
    setShowAddCareerForm(false);
    setShowRacePictures(false);
    setShowCareerPictures(false);
    resetForceTreeForm();
  };

  const handleForceTreeSelectionChange = (selectedId) => {
    if (selectedId === '__new__') {
      resetForceTreeForm();
      return;
    }

    const selectedTree = existingForceTrees.find((tree) => String(tree.id) === String(selectedId));
    if (!selectedTree) {
      alert('Unable to load the selected force tree');
      return;
    }

    loadForceTreeIntoForm(selectedTree, forceTalentNames);
  };

  const handleSaveForceTree = async () => {
    try {
      const isEditing = selectedForceTreeId !== '__new__';
      const normalizedPowerTreeName = String(powerTreeName ?? '').trim();
      const normalizedForcePrerequisite = String(forcePrerequisite ?? '').trim();

      // Validate required fields
      if (!normalizedPowerTreeName) {
        alert('Please enter a Power Tree Name');
        return;
      }

      if (!selectedForceTalentName) {
        alert('Please select a talent for the top ability');
        return;
      }

      // Helper function to get talent ID from name
      const getTalentId = (talentName) => {
        const talent = forceTalentNames.find(t => t.talent_name === talentName);
        return talent?.id || null;
      };

      // Validate that top talent has a valid ID
      const topTalentId = getTalentId(selectedForceTalentName);
      if (!topTalentId) {
        alert('Top talent not found in database');
        return;
      }

      const parseCost = (value) => {
        const parsed = parseInt(value, 10);
        return Number.isNaN(parsed) ? null : parsed;
      };

      const getGridIndex = (row, col) => (row - 2) * 4 + (col - 1);

      const isCellOccupied = (row, col) => {
        if (row < 2 || row > 5 || col < 1 || col > 4) return false;
        const idx = getGridIndex(row, col);
        if (gridTalents[idx]?.name) return true;
        const mergedRange = getMergedRangeForIndex(idx, mergedBoxes);
        if (mergedRange.start !== idx && gridTalents[mergedRange.start]?.name) {
          return true;
        }
        return false;
      };

      const uniqueLinkSet = new Set();
      const pushLink = (fromRow, fromCol, toRow, toCol) => {
        const key = `${fromRow}_${fromCol}_${toRow}_${toCol}`;
        if (!uniqueLinkSet.has(key)) {
          uniqueLinkSet.add(key);
        }
      };

      const treeNodes = [];
      treeNodes.push({
        row: 1,
        col: 1,
        talent_id: topTalentId,
        cost: parseCost(forceTalentCost) ?? 0,
        col_span: 4,
      });

      for (let row = 2; row <= 5; row++) {
        for (let col = 1; col <= 4; col++) {
          const idx = getGridIndex(row, col);
          const mergedRange = getMergedRangeForIndex(idx, mergedBoxes);
          if (mergedRange.start !== idx) continue;

          const talentName = gridTalents[idx]?.name?.trim();
          if (!talentName) continue;
          const talentId = getTalentId(talentName);
          if (!talentId) continue;

          const colSpan = mergedRange.span;

          treeNodes.push({
            row,
            col,
            talent_id: talentId,
            cost: parseCost(gridTalents[idx]?.cost) ?? 0,
            col_span: colSpan,
          });
        }
      }

      for (let col = 1; col <= 4; col++) {
        const topLinkIndex = col - 1;
        if (gridCheckboxLinks[topLinkIndex]?.up && isCellOccupied(2, col)) {
          pushLink(1, 1, 2, col);
        }
      }

      for (let row = 2; row <= 5; row++) {
        for (let col = 1; col <= 4; col++) {
          const idx = getGridIndex(row, col);
          if (!isCellOccupied(row, col)) continue;

          const mergedRange = getMergedRangeForIndex(idx, mergedBoxes);
          if (mergedRange.start !== idx) continue;

          const colSpan = mergedRange.span;

          for (let offset = 0; offset < colSpan; offset++) {
            const sourceIdx = idx + offset;
            const sourceCol = col + offset;
            const sourceLinkState = gridCheckboxLinks[sourceIdx] || {};

            if (sourceLinkState.up && row > 2 && isCellOccupied(row - 1, sourceCol)) {
              pushLink(row, sourceCol, row - 1, sourceCol);
            }

            if (sourceLinkState.down && row < 5 && isCellOccupied(row + 1, sourceCol)) {
              pushLink(row, sourceCol, row + 1, sourceCol);
            }
          }

          const rightSourceIdx = idx + (colSpan - 1);
          const rightSourceCol = col + (colSpan - 1);
          const rightLinkState = gridCheckboxLinks[rightSourceIdx] || {};
          const rightTargetCol = rightSourceCol + 1;
          if (rightLinkState.right && rightTargetCol <= 4 && isCellOccupied(row, rightTargetCol)) {
            pushLink(row, rightSourceCol, row, rightTargetCol);
          }

          const leftLinkState = gridCheckboxLinks[idx] || {};
          if (leftLinkState.left && col > 1 && isCellOccupied(row, col - 1)) {
            pushLink(row, col, row, col - 1);
          }
        }
      }

      const treeLinks = Array.from(uniqueLinkSet).map((key) => {
        const [fromRow, fromCol, toRow, toCol] = key.split('_').map(Number);
        return {
          from_row: fromRow,
          from_col: fromCol,
          to_row: toRow,
          to_col: toCol,
        };
      });

      const forceTreeData = {
        PowerTreeName: normalizedPowerTreeName,
        ForcePrerequisite: normalizedForcePrerequisite || null,
        tree_nodes: treeNodes,
        tree_links: treeLinks,
      };

      let saveError = null;

      if (isEditing) {
        const { error } = await supabase
          .from('SW_force_power_tree')
          .update(forceTreeData)
          .eq('id', selectedForceTreeId);
        saveError = error;
      } else {
        const { error } = await supabase
          .from('SW_force_power_tree')
          .insert([forceTreeData]);
        saveError = error;
      }

      if (saveError) {
        console.error('Error saving force tree:', saveError);
        alert('Failed to save force tree: ' + saveError.message);
        return;
      }

      alert(isEditing ? 'Force tree updated successfully!' : 'Force tree saved successfully!');
      resetForceTreeForm();

      const { data: treesData, error: treesError } = await supabase
        .from('SW_force_power_tree')
        .select('id, PowerTreeName, ForcePrerequisite, tree_nodes, tree_links')
        .order('PowerTreeName');

      if (!treesError) {
        setExistingForceTrees(treesData || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Failed to save force tree: ' + err.message);
    }
  };

  const handleAddCareer = () => {
    setShowAddCareerForm(true);
    setShowAddForceTreeForm(false);
    setShowAddSpecializationForm(false);
    setShowAddSpeciesForm(false);
    setShowAddEquipmentForm(false);
    setShowAddShipForm(false);
    setShowRacePictures(false);
    setShowCareerPictures(false);
  };

  const handleAddEquipment = () => {
    setShowAddEquipmentForm(true);
    setShowAddForceTreeForm(false);
    setShowAddSpecializationForm(false);
    setShowAddSpeciesForm(false);
    setShowAddCareerForm(false);
    setShowAddShipForm(false);
    setShowRacePictures(false);
    setShowCareerPictures(false);
  };

  const handleAddShip = () => {
    setShowAddShipForm(true);
    setShowAddEquipmentForm(false);
    setShowAddForceTreeForm(false);
    setShowAddSpecializationForm(false);
    setShowAddSpeciesForm(false);
    setShowAddCareerForm(false);
    setShowRacePictures(false);
    setShowCareerPictures(false);
  };

  const parseNumberOrNull = (value) => {
    const trimmed = String(value || '').trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const parseDndTtrpgIdsFromMod = (value) => {
    if (!value) return [];
    const names = String(value)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    return names
      .map((name) => {
        const ttrpg = availableDndTTRPGs.find((item) => item.TTRPG_name === name);
        return ttrpg ? ttrpg.id : null;
      })
      .filter((id) => id != null);
  };

  const getSelectedDndModValue = () => (
    selectedDndTTRPGs.length > 0
      ? selectedDndTTRPGs
        .map((id) => {
          const ttrpg = availableDndTTRPGs.find((item) => item.id === id);
          return ttrpg ? ttrpg.TTRPG_name : '';
        })
        .filter((name) => name)
        .join(',')
      : ''
  );

  const DND_ABILITY_STATS = ['STRENGTH', 'DEXTERITY', 'CONSTITUTION', 'INTELLIGENCE', 'WISDOM', 'CHARISMA'];
  const DND_ABILITY_STAT_LABELS = {
    STRENGTH: 'STR',
    DEXTERITY: 'DEX',
    CONSTITUTION: 'CON',
    INTELLIGENCE: 'INT',
    WISDOM: 'WIS',
    CHARISMA: 'CHA',
  };
  const DND_ABILITY_STAT_ALIASES = {
    STR: 'STRENGTH',
    DEX: 'DEXTERITY',
    CON: 'CONSTITUTION',
    INT: 'INTELLIGENCE',
    WIS: 'WISDOM',
    CHA: 'CHARISMA',
    STRENGTH: 'STRENGTH',
    DEXTERITY: 'DEXTERITY',
    CONSTITUTION: 'CONSTITUTION',
    INTELLIGENCE: 'INTELLIGENCE',
    WISDOM: 'WISDOM',
    CHARISMA: 'CHARISMA',
  };

  const normalizeDndAbilityStat = (value) => {
    const normalized = String(value || '').trim().toUpperCase();
    return DND_ABILITY_STAT_ALIASES[normalized] || '';
  };

  const normalizeDndRaceAbilityBonusRules = (value) => {
    const parsed = (() => {
      if (!value) return {};
      if (typeof value === 'string') {
        try {
          const json = JSON.parse(value);
          return json && typeof json === 'object' ? json : {};
        } catch {
          return {};
        }
      }
      return value && typeof value === 'object' ? value : {};
    })();

    const fixed = Array.isArray(parsed.fixed)
      ? parsed.fixed
        .map((entry) => ({
          stat: normalizeDndAbilityStat(entry?.stat),
          amount: parseNumberOrNull(entry?.amount) ?? 0,
        }))
        .filter((entry) => entry.stat && entry.amount !== 0)
      : [];

    const choices = Array.isArray(parsed.choices)
      ? parsed.choices
        .map((entry, index) => {
          const count = Math.max(1, parseNumberOrNull(entry?.count) ?? 1);
          const amount = parseNumberOrNull(entry?.amount) ?? 1;
          const options = [...new Set(
            (Array.isArray(entry?.options) ? entry.options : [])
              .map((option) => normalizeDndAbilityStat(option))
              .filter(Boolean)
          )];

          return {
            id: String(entry?.id || `choice-${index + 1}`),
            count,
            amount,
            options,
          };
        })
        .filter((entry) => entry.options.length > 0 && entry.amount !== 0)
      : [];

    return { fixed, choices };
  };

  const buildLegacyDndRaceAbilityBonuses = (rules) => {
    const totals = {
      STRENGTH: 0,
      DEXTERITY: 0,
      CONSTITUTION: 0,
      INTELLIGENCE: 0,
      WISDOM: 0,
      CHARISMA: 0,
    };

    (rules?.fixed || []).forEach((entry) => {
      if (!entry?.stat || !Object.prototype.hasOwnProperty.call(totals, entry.stat)) return;
      totals[entry.stat] += parseNumberOrNull(entry.amount) ?? 0;
    });

    return {
      AbilityBonus_Str: totals.STRENGTH,
      AbilityBonus_Dex: totals.DEXTERITY,
      AbilityBonus_Con: totals.CONSTITUTION,
      AbilityBonus_Int: totals.INTELLIGENCE,
      AbilityBonus_Wis: totals.WISDOM,
      AbilityBonus_Cha: totals.CHARISMA,
    };
  };

  const parseDndRaceAbilityBonusRules = (raceRow) => {
    const fromRules = normalizeDndRaceAbilityBonusRules(raceRow?.AbilityBonusRules);
    if (fromRules.fixed.length > 0 || fromRules.choices.length > 0) {
      return fromRules;
    }

    const legacyFixed = [
      { stat: 'STRENGTH', amount: parseNumberOrNull(raceRow?.AbilityBonus_Str) ?? 0 },
      { stat: 'DEXTERITY', amount: parseNumberOrNull(raceRow?.AbilityBonus_Dex) ?? 0 },
      { stat: 'CONSTITUTION', amount: parseNumberOrNull(raceRow?.AbilityBonus_Con) ?? 0 },
      { stat: 'INTELLIGENCE', amount: parseNumberOrNull(raceRow?.AbilityBonus_Int) ?? 0 },
      { stat: 'WISDOM', amount: parseNumberOrNull(raceRow?.AbilityBonus_Wis) ?? 0 },
      { stat: 'CHARISMA', amount: parseNumberOrNull(raceRow?.AbilityBonus_Cha) ?? 0 },
    ].filter((entry) => entry.amount !== 0);

    return {
      fixed: legacyFixed,
      choices: [],
    };
  };

  const buildEmptyDndRaceChoiceRule = (index = 0) => ({
    id: `choice-${Date.now()}-${index}`,
    count: 1,
    amount: 1,
    options: ['STRENGTH', 'DEXTERITY'],
  });

  const parseDndTraitList = (value) => [...new Set(
    String(value || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  )];

  const parseDndRaceTraits = (value) => parseDndTraitList(value);

  const setDndRaceTraitsFromList = (value) => {
    const normalized = [...new Set(
      (Array.isArray(value) ? value : [value])
        .map((item) => String(item || '').trim())
        .filter(Boolean)
    )];
    setDndRaceSelectedTraits(normalized);
    return normalized;
  };

  const addDndRaceTrait = (traitName) => {
    const next = setDndRaceTraitsFromList([...dndRaceSelectedTraits, traitName]);
    return next;
  };

  const removeDndRaceTrait = (traitName) => {
    const next = dndRaceSelectedTraits.filter((item) => item !== traitName);
    setDndRaceTraitsFromList(next);
  };

  const setDndSubRaceTraitsFromList = (value) => {
    const normalized = [...new Set(
      (Array.isArray(value) ? value : [value])
        .map((item) => String(item || '').trim())
        .filter(Boolean)
    )];
    setDndSubRaceSelectedTraits(normalized);
    return normalized;
  };

  const addDndSubRaceTrait = (traitName) => {
    const next = setDndSubRaceTraitsFromList([...dndSubRaceSelectedTraits, traitName]);
    return next;
  };

  const removeDndSubRaceTrait = (traitName) => {
    const next = dndSubRaceSelectedTraits.filter((item) => item !== traitName);
    setDndSubRaceTraitsFromList(next);
  };

  const addDndRaceFixedBonus = () => {
    setDndRaceAbilityBonusRules((prev) => ({
      ...prev,
      fixed: [...(prev.fixed || []), { stat: 'STRENGTH', amount: 1 }],
    }));
  };

  const updateDndRaceFixedBonus = (index, field, value) => {
    setDndRaceAbilityBonusRules((prev) => ({
      ...prev,
      fixed: (prev.fixed || []).map((entry, entryIndex) => {
        if (entryIndex !== index) return entry;
        if (field === 'stat') {
          return {
            ...entry,
            stat: normalizeDndAbilityStat(value) || 'STRENGTH',
          };
        }
        return {
          ...entry,
          amount: parseNumberOrNull(value) ?? 0,
        };
      }),
    }));
  };

  const removeDndRaceFixedBonus = (index) => {
    setDndRaceAbilityBonusRules((prev) => ({
      ...prev,
      fixed: (prev.fixed || []).filter((_, entryIndex) => entryIndex !== index),
    }));
  };

  const addDndRaceChoiceBonus = () => {
    setDndRaceAbilityBonusRules((prev) => ({
      ...prev,
      choices: [...(prev.choices || []), buildEmptyDndRaceChoiceRule((prev.choices || []).length)],
    }));
  };

  const updateDndRaceChoiceBonus = (index, field, value) => {
    setDndRaceAbilityBonusRules((prev) => ({
      ...prev,
      choices: (prev.choices || []).map((entry, entryIndex) => {
        if (entryIndex !== index) return entry;
        if (field === 'count') {
          return {
            ...entry,
            count: Math.max(1, parseNumberOrNull(value) ?? 1),
          };
        }
        if (field === 'amount') {
          return {
            ...entry,
            amount: parseNumberOrNull(value) ?? 0,
          };
        }
        return entry;
      }),
    }));
  };

  const toggleDndRaceChoiceBonusOption = (index, stat) => {
    const normalizedStat = normalizeDndAbilityStat(stat);
    if (!normalizedStat) return;

    setDndRaceAbilityBonusRules((prev) => ({
      ...prev,
      choices: (prev.choices || []).map((entry, entryIndex) => {
        if (entryIndex !== index) return entry;
        const current = Array.isArray(entry.options) ? entry.options : [];
        const exists = current.includes(normalizedStat);
        return {
          ...entry,
          options: exists
            ? current.filter((option) => option !== normalizedStat)
            : [...current, normalizedStat],
        };
      }),
    }));
  };

  const removeDndRaceChoiceBonus = (index) => {
    setDndRaceAbilityBonusRules((prev) => ({
      ...prev,
      choices: (prev.choices || []).filter((_, entryIndex) => entryIndex !== index),
    }));
  };

  const addDndSubRaceFixedBonus = () => {
    setDndSubRaceAbilityBonusRules((prev) => ({
      ...prev,
      fixed: [...(prev.fixed || []), { stat: 'STRENGTH', amount: 1 }],
    }));
  };

  const updateDndSubRaceFixedBonus = (index, field, value) => {
    setDndSubRaceAbilityBonusRules((prev) => ({
      ...prev,
      fixed: (prev.fixed || []).map((entry, entryIndex) => {
        if (entryIndex !== index) return entry;
        if (field === 'stat') {
          return {
            ...entry,
            stat: normalizeDndAbilityStat(value) || 'STRENGTH',
          };
        }
        return {
          ...entry,
          amount: parseNumberOrNull(value) ?? 0,
        };
      }),
    }));
  };

  const removeDndSubRaceFixedBonus = (index) => {
    setDndSubRaceAbilityBonusRules((prev) => ({
      ...prev,
      fixed: (prev.fixed || []).filter((_, entryIndex) => entryIndex !== index),
    }));
  };

  const addDndSubRaceChoiceBonus = () => {
    setDndSubRaceAbilityBonusRules((prev) => ({
      ...prev,
      choices: [...(prev.choices || []), buildEmptyDndRaceChoiceRule((prev.choices || []).length)],
    }));
  };

  const updateDndSubRaceChoiceBonus = (index, field, value) => {
    setDndSubRaceAbilityBonusRules((prev) => ({
      ...prev,
      choices: (prev.choices || []).map((entry, entryIndex) => {
        if (entryIndex !== index) return entry;
        if (field === 'count') {
          return {
            ...entry,
            count: Math.max(1, parseNumberOrNull(value) ?? 1),
          };
        }
        if (field === 'amount') {
          return {
            ...entry,
            amount: parseNumberOrNull(value) ?? 0,
          };
        }
        return entry;
      }),
    }));
  };

  const toggleDndSubRaceChoiceBonusOption = (index, stat) => {
    const normalizedStat = normalizeDndAbilityStat(stat);
    if (!normalizedStat) return;

    setDndSubRaceAbilityBonusRules((prev) => ({
      ...prev,
      choices: (prev.choices || []).map((entry, entryIndex) => {
        if (entryIndex !== index) return entry;
        const current = Array.isArray(entry.options) ? entry.options : [];
        const exists = current.includes(normalizedStat);
        return {
          ...entry,
          options: exists
            ? current.filter((option) => option !== normalizedStat)
            : [...current, normalizedStat],
        };
      }),
    }));
  };

  const removeDndSubRaceChoiceBonus = (index) => {
    setDndSubRaceAbilityBonusRules((prev) => ({
      ...prev,
      choices: (prev.choices || []).filter((_, entryIndex) => entryIndex !== index),
    }));
  };

  const isMissingDndRaceAbilityBonusRulesColumnError = (err) => {
    const message = `${err?.message || ''} ${err?.details || ''}`.toLowerCase();
    return message.includes('abilitybonusrules') && message.includes('column');
  };

  const isMissingDndRaceLookColumnError = (err) => {
    const message = `${err?.message || ''} ${err?.details || ''}`.toLowerCase();
    return message.includes('racelook') && message.includes('column');
  };

  const isMissingDndRaceSkinColourColumnError = (err) => {
    const message = `${err?.message || ''} ${err?.details || ''}`.toLowerCase();
    return message.includes('skincolour') && message.includes('column');
  };

  const isMissingDndSubRaceAbilityBonusRulesColumnError = (err) => {
    const message = `${err?.message || ''} ${err?.details || ''}`.toLowerCase();
    return message.includes('abilitybonusrules') && message.includes('column');
  };

  const DND_SUBCLASS_LEVELS_TABLE = 'DND_Subclass_Levels';

  const getDndModValueForClass = (classId) => {
    const parsedId = Number(classId);
    if (Number.isNaN(parsedId)) return '';
    const classRow = existingDndClasses.find((row) => Number(row.id) === parsedId);
    return classRow?.DNDMod || '';
  };

  const getDndModValueForRace = (raceId) => {
    const parsedId = Number(raceId);
    if (Number.isNaN(parsedId)) return '';
    const raceRow = existingDndRaces.find((row) => Number(row.id) === parsedId);
    return raceRow?.DNDMod || '';
  };

  const getDndClassNameById = (classId) => {
    const parsedId = Number(classId);
    if (Number.isNaN(parsedId)) return '';
    const classRow = existingDndClasses.find((row) => Number(row.id) === parsedId);
    return classRow?.ClassName || '';
  };

  const getDndRaceNameById = (raceId) => {
    const parsedId = Number(raceId);
    if (Number.isNaN(parsedId)) return '';
    const raceRow = existingDndRaces.find((row) => Number(row.id) === parsedId);
    return raceRow?.RaceName || '';
  };

  const runSubclassLevelsQuery = async (queryFactory) => {
    const primaryResult = await queryFactory(DND_SUBCLASS_LEVELS_TABLE);
    return primaryResult;
  };

  const normalizeDndExtraFieldNames = (value) => {
    const list = Array.isArray(value)
      ? value
      : String(value || '').split(/[\n,;|]+/);

    return [...new Set(list
      .map((item) => String(item || '').trim())
      .filter(Boolean))];
  };

  const normalizeDndExtraValues = (value, fieldNames) => {
    const source = value && typeof value === 'object' && !Array.isArray(value)
      ? value
      : {};

    const result = {};
    fieldNames.forEach((fieldName) => {
      const fieldValue = source[fieldName];
      result[fieldName] = fieldValue == null ? '' : String(fieldValue);
    });
    return result;
  };

  const setDndExtraFieldNames = (value) => {
    const normalized = normalizeDndExtraFieldNames(value);
    setDndExtraLevelFields(normalized);
    setDndExtraLevelFieldInput(normalized.join(', '));
    setDndClassLevels((prev) => prev.map((row) => ({
      ...row,
      extraValues: normalizeDndExtraValues(row.extraValues, normalized),
    })));
    return normalized;
  };

  const addDndExtraFieldNamesFromInput = () => {
    const toAdd = normalizeDndExtraFieldNames(dndExtraLevelFieldInput);
    if (toAdd.length === 0) return dndExtraLevelFields;
    const merged = normalizeDndExtraFieldNames([...dndExtraLevelFields, ...toAdd]);
    setDndExtraLevelFields(merged);
    setDndExtraLevelFieldInput('');
    setDndClassLevels((prev) => prev.map((row) => ({
      ...row,
      extraValues: normalizeDndExtraValues(row.extraValues, merged),
    })));
    return merged;
  };

  const removeDndExtraFieldName = (fieldName) => {
    const next = dndExtraLevelFields.filter((name) => name !== fieldName);
    setDndExtraFieldNames(next);
  };

  const parseDndModNames = (value) => String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const buildGroupedDndRows = (rows, nameKey) => {
    const groups = new Map();

    availableDndTTRPGs
      .map((item) => String(item.TTRPG_name || '').trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
      .forEach((name) => groups.set(name, []));

    const unassigned = [];

    rows.forEach((row) => {
      const modNames = parseDndModNames(row.DNDMod);

      if (modNames.length === 0) {
        unassigned.push(row);
        return;
      }

      const groupName = modNames[0];
      if (!groups.has(groupName)) {
        groups.set(groupName, []);
      }
      groups.get(groupName).push(row);
    });

    const sortedGroups = Array.from(groups.entries())
      .sort((a, b) => a[0].localeCompare(b[0], undefined, { sensitivity: 'base' }))
      .map(([label, items]) => ({
        label,
        items: [...items].sort((a, b) => String(a[nameKey] || '').localeCompare(String(b[nameKey] || ''), undefined, { sensitivity: 'base' })),
      }))
      .filter((group) => group.items.length > 0);

    if (unassigned.length > 0) {
      sortedGroups.push({
        label: 'Unassigned',
        items: [...unassigned].sort((a, b) => String(a[nameKey] || '').localeCompare(String(b[nameKey] || ''), undefined, { sensitivity: 'base' })),
      });
    }

    return sortedGroups;
  };

  const closeDndForms = () => {
    setShowDndRacePictures(false);
    setShowDndClassPictures(false);
    setShowAddDndClassForm(false);
    setShowAddDndSubclassForm(false);
    setShowAddDndSubRaceForm(false);
    setShowAddDndRaceForm(false);
    setShowAddDndPictureForm(false);
    setShowAddDndBackgroundForm(false);
    setShowAddDndEquipmentForm(false);
    setShowAddDndSpellForm(false);
  };

  const buildDndPicturePromptText = ({ raceName, raceLook, skinColour, className, classAttire, pictureId, gender }) => {
    const normalizedRaceLook = String(raceLook || '').trim();
    const normalizedSkinColour = String(skinColour || '').trim();
    const normalizedAttire = String(classAttire || '').trim();
    const raceLookText = normalizedRaceLook || 'not specified';
    const skinColourText = normalizedSkinColour || 'not specified';
    const attireText = normalizedAttire || 'not specified';
    return `write a portrait prompt for a ${raceName} ${className} in an action pose. gender is ${gender}. skin colour is ${skinColourText}. Race Look: ${raceLookText}. Class Attire: ${attireText}.`;
  };

  const getRandomDndPromptGender = () => (Math.random() < 0.5 ? 'Male' : 'Female');

  const parseDndSkinColourOptions = (skinColourSource) => (
    String(skinColourSource || '')
      .split(/[\n,;|]+/)
      .map((value) => value.trim())
      .filter(Boolean)
  );

  const getRandomDndPromptSkinColour = (skinColourSource) => {
    const options = parseDndSkinColourOptions(skinColourSource);

    if (options.length === 0) {
      return 'not specified';
    }

    const randomIndex = Math.floor(Math.random() * options.length);
    return options[randomIndex];
  };

  const getNextDndPictureId = () => {
    const maxId = existingDndPictures.reduce((acc, row) => {
      const parsed = parseNumberOrNull(row?.PictureID) || 0;
      return Math.max(acc, parsed);
    }, 0);
    return maxId + 1;
  };

  const handleShowDndRacePictures = () => {
    closeDndForms();
    setShowDndRacePictures(true);
    loadDndRaces();
    loadDndClasses();
    loadDndPictures();
  };

  const handleShowDndClassPictures = () => {
    closeDndForms();
    setShowDndClassPictures(true);
    loadDndRaces();
    loadDndClasses();
    loadDndPictures();
  };

  const handleGenerateDndPromptForRace = async (raceRow, classId) => {
    const classRow = existingDndClasses.find((row) => Number(row.id) === Number(classId));
    if (!classRow) {
      alert('Please select a class first.');
      return;
    }
    try {
      const pictureId = getNextDndPictureId();
      const gender = getRandomDndPromptGender();
      const skinColour = getRandomDndPromptSkinColour(raceRow.SkinColour);
      const prompt = buildDndPicturePromptText({
        raceName: raceRow.RaceName,
        raceLook: raceRow.RaceLook,
        skinColour,
        className: classRow.ClassName,
        classAttire: classRow.Attire,
        pictureId,
        gender,
      });
      await navigator.clipboard.writeText(prompt);
      alert(`Prompt copied to clipboard!\n\nRace: ${raceRow.RaceName}\nClass: ${classRow.ClassName}\nGender: ${gender}\nSkin Colour: ${skinColour}\nNext Picture ID: ${pictureId}`);
    } catch (err) {
      console.error('Failed generating DND race prompt:', err);
      alert(`Failed to copy prompt: ${err.message}`);
    }
  };

  const handleGenerateDndPromptForClass = async (classRow, raceId) => {
    const raceRow = existingDndRaces.find((row) => Number(row.id) === Number(raceId));
    if (!raceRow) {
      alert('Please select a race first.');
      return;
    }
    try {
      const pictureId = getNextDndPictureId();
      const gender = getRandomDndPromptGender();
      const skinColour = getRandomDndPromptSkinColour(raceRow.SkinColour);
      const prompt = buildDndPicturePromptText({
        raceName: raceRow.RaceName,
        raceLook: raceRow.RaceLook,
        skinColour,
        className: classRow.ClassName,
        classAttire: classRow.Attire,
        pictureId,
        gender,
      });
      await navigator.clipboard.writeText(prompt);
      alert(`Prompt copied to clipboard!\n\nClass: ${classRow.ClassName}\nRace: ${raceRow.RaceName}\nGender: ${gender}\nSkin Colour: ${skinColour}\nNext Picture ID: ${pictureId}`);
    } catch (err) {
      console.error('Failed generating DND class prompt:', err);
      alert(`Failed to copy prompt: ${err.message}`);
    }
  };

  const handleCreateDndPictureForRace = async (raceRow, classId) => {
    const classRow = existingDndClasses.find((row) => Number(row.id) === Number(classId));
    if (!classRow) {
      alert('Please select a class first.');
      return;
    }

    const duplicate = existingDndPictures.some((row) => Number(row.Race) === Number(raceRow.id) && Number(row.Class) === Number(classRow.id));
    if (duplicate) {
      alert('This race/class picture mapping already exists.');
      return;
    }

    try {
      const pictureId = getNextDndPictureId();
      const { error } = await supabase
        .from('DND_Pictures')
        .insert([
          {
            Race: raceRow.id,
            Class: classRow.id,
            PictureID: pictureId,
            DNDMod: classRow.DNDMod || raceRow.DNDMod || null,
          },
        ]);
      if (error) throw error;

      await loadDndPictures();
      alert(`Created DND picture mapping.\n\nRace: ${raceRow.RaceName}\nClass: ${classRow.ClassName}\nPicture ID: ${pictureId}`);
    } catch (err) {
      console.error('Failed creating DND race picture mapping:', err);
      alert(`Failed to create mapping: ${err.message}`);
    }
  };

  const handleCreateDndPictureForClass = async (classRow, raceId) => {
    const raceRow = existingDndRaces.find((row) => Number(row.id) === Number(raceId));
    if (!raceRow) {
      alert('Please select a race first.');
      return;
    }

    const duplicate = existingDndPictures.some((row) => Number(row.Race) === Number(raceRow.id) && Number(row.Class) === Number(classRow.id));
    if (duplicate) {
      alert('This class/race picture mapping already exists.');
      return;
    }

    try {
      const pictureId = getNextDndPictureId();
      const { error } = await supabase
        .from('DND_Pictures')
        .insert([
          {
            Race: raceRow.id,
            Class: classRow.id,
            PictureID: pictureId,
            DNDMod: classRow.DNDMod || raceRow.DNDMod || null,
          },
        ]);
      if (error) throw error;

      await loadDndPictures();
      alert(`Created DND picture mapping.\n\nClass: ${classRow.ClassName}\nRace: ${raceRow.RaceName}\nPicture ID: ${pictureId}`);
    } catch (err) {
      console.error('Failed creating DND class picture mapping:', err);
      alert(`Failed to create mapping: ${err.message}`);
    }
  };

  const getAvailableDndClassesForRace = (raceId) => {
    const raceRow = existingDndRaces.find((row) => Number(row.id) === Number(raceId));
    const raceModNames = new Set(parseDndModNames(raceRow?.DNDMod).map((name) => name.toLowerCase()));
    const usedClassIds = new Set(
      existingDndPictures
        .filter((row) => Number(row.Race) === Number(raceId))
        .map((row) => Number(row.Class))
    );

    return existingDndClasses.filter((row) => {
      if (usedClassIds.has(Number(row.id))) return false;

      const classModNames = new Set(parseDndModNames(row.DNDMod).map((name) => name.toLowerCase()));
      if (raceModNames.size === 0 || classModNames.size === 0) {
        return raceModNames.size === classModNames.size;
      }
      return Array.from(raceModNames).some((name) => classModNames.has(name));
    });
  };

  const getAvailableDndRacesForClass = (classId) => {
    const classRow = existingDndClasses.find((row) => Number(row.id) === Number(classId));
    const classModNames = new Set(parseDndModNames(classRow?.DNDMod).map((name) => name.toLowerCase()));
    const usedRaceIds = new Set(
      existingDndPictures
        .filter((row) => Number(row.Class) === Number(classId))
        .map((row) => Number(row.Race))
    );

    return existingDndRaces.filter((row) => {
      if (usedRaceIds.has(Number(row.id))) return false;

      const raceModNames = new Set(parseDndModNames(row.DNDMod).map((name) => name.toLowerCase()));
      if (classModNames.size === 0 || raceModNames.size === 0) {
        return classModNames.size === raceModNames.size;
      }
      return Array.from(classModNames).some((name) => raceModNames.has(name));
    });
  };

  const handleAddDndClass = () => {
    closeDndForms();
    setShowAddDndClassForm(true);
    resetDndClassForm();
    loadDndTTRPGs();
    loadDndClasses();
    loadDndClassFeatures();
  };

  const handleAddDndSubclass = () => {
    closeDndForms();
    setShowAddDndSubclassForm(true);
    resetDndSubclassForm();
    loadDndClasses();
    loadDndSubclasses();
    loadDndClassFeatures();
  };

  const handleAddDndRace = () => {
    closeDndForms();
    setShowAddDndRaceForm(true);
    resetDndRaceForm();
    loadDndTTRPGs();
    loadDndRaces();
    loadDndClassFeatures();
  };

  const handleAddDndSubRace = () => {
    closeDndForms();
    setShowAddDndSubRaceForm(true);
    resetDndSubRaceForm();
    loadDndRaces();
    loadDndSubRaces();
    loadDndClassFeatures();
  };

  const handleAddDndPicture = () => {
    closeDndForms();
    setShowAddDndPictureForm(true);
    resetDndPictureForm();
    loadDndClasses();
    loadDndRaces();
    loadDndPictures();
  };

  const handleAddDndBackground = () => {
    closeDndForms();
    setShowAddDndBackgroundForm(true);
    resetDndBackgroundForm();
    loadDndTTRPGs();
    loadDndBackgrounds();
  };

  const handleAddDndEquipment = () => {
    closeDndForms();
    setShowAddDndEquipmentForm(true);
    resetDndEquipmentForm();
    loadDndTTRPGs();
    loadDndEquipmentRows();
  };

  const handleAddDndSpell = () => {
    closeDndForms();
    setShowAddDndSpellForm(true);
    resetDndSpellForm();
    loadDndTTRPGs();
    loadDndSpells();
  };

  const loadDndTTRPGs = async () => {
    try {
      const { data, error } = await supabase
        .from('TTRPGs')
        .select('id, TTRPG_name')
        .eq('DND_Mod', true)
        .order('TTRPG_name');

      if (error) throw error;

      setAvailableDndTTRPGs(data || []);
    } catch (err) {
      console.error('Failed to fetch DND TTRPGs:', err);
      setError('Failed to load DND TTRPGs');
    }
  };

  const loadDndClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('DND_Classes')
        .select('id, ClassName, Attire, DNDMod')
        .order('ClassName');

      if (error) throw error;

      setExistingDndClasses(data || []);
    } catch (err) {
      console.error('Failed to fetch DND Classes:', err);
      setError('Failed to load DND Classes');
    }
  };

  const loadDndSubclasses = async () => {
    try {
      const { data, error } = await supabase
        .from('DND_Subclasses')
        .select('id, SubclassName, Class, DNDMod')
        .order('SubclassName');

      if (error) throw error;

      setExistingDndSubclasses(data || []);
    } catch (err) {
      console.error('Failed to fetch DND Subclasses:', err);
      setError('Failed to load DND Subclasses');
    }
  };

  const loadDndRaces = async () => {
    try {
      const { data, error } = await supabase
        .from('DND_Races')
        .select('id, RaceName, RaceLook, SkinColour, DNDMod')
        .order('RaceName');

      if (error) throw error;

      setExistingDndRaces(data || []);
    } catch (err) {
      console.error('Failed to fetch DND Races:', err);
      setError('Failed to load DND Races');
    }
  };

  const loadDndSubRaces = async () => {
    try {
      const { data, error } = await supabase
        .from('DND_SubRaces')
        .select('id, SubRaceName, Race, DNDMod')
        .order('SubRaceName');

      if (error) throw error;

      setExistingDndSubRaces(data || []);
    } catch (err) {
      console.error('Failed to fetch DND Sub Races:', err);
      setError('Failed to load DND Sub Races');
    }
  };

  const loadDndPictures = async () => {
    try {
      const { data, error } = await supabase
        .from('DND_Pictures')
        .select('id, PictureID, Class, Race, DNDMod')
        .order('PictureID');

      if (error) throw error;

      setExistingDndPictures(data || []);
    } catch (err) {
      console.error('Failed to fetch DND Pictures:', err);
      setError('Failed to load DND Pictures');
    }
  };

  const loadDndBackgrounds = async () => {
    try {
      const { data, error } = await supabase
        .from('DND_Backgrounds')
        .select('id, BackgroundName')
        .order('BackgroundName');

      if (error) throw error;

      setExistingDndBackgrounds(data || []);
    } catch (err) {
      console.error('Failed to fetch DND Backgrounds:', err);
      setError('Failed to load DND Backgrounds');
    }
  };

  const loadDndEquipmentRows = async () => {
    try {
      const { data, error } = await supabase
        .from('DND_Equipment')
        .select('id, ItemName')
        .order('ItemName');

      if (error) throw error;

      setExistingDndEquipment(data || []);
    } catch (err) {
      console.error('Failed to fetch DND Equipment:', err);
      setError('Failed to load DND Equipment');
    }
  };

  const loadDndSpells = async () => {
    try {
      const { data, error } = await supabase
        .from('DND_Spells')
        .select('id, SpellName')
        .order('SpellName');

      if (error) throw error;

      setExistingDndSpells(data || []);
    } catch (err) {
      console.error('Failed to fetch DND Spells:', err);
      setError('Failed to load DND Spells');
    }
  };

  const loadDndClassFeatures = async () => {
    setLoadingDndClassFeatures(true);
    try {
      const { data, error } = await supabase
        .from('DND_ClassFeatures')
        .select('id, FeatureName, FeatureText')
        .order('FeatureName');

      if (error) throw error;

      setDndClassFeatures(data || []);
    } catch (err) {
      console.error('Failed to fetch DND Class Features:', err);
      setError('Failed to load DND Class Features');
    } finally {
      setLoadingDndClassFeatures(false);
    }
  };

  const loadDndClassData = async (classId) => {
    try {
      const { data, error } = await supabase
        .from('DND_Classes')
        .select('*')
        .eq('id', classId)
        .single();

      if (error) throw error;

      if (data) {
        setDndClassName(data.ClassName || '');
        setDndClassDescription(data.Description || '');
        setDndHitDice(data.HitDice || '');
        setDndProfArmour(data.Prof_Armour || '');
        setDndProfWeapons(data.Prof_Weapons || '');
        setDndProfSavingThrows(data.Prof_SavingThrows || '');
        setDndProfSkills(data.Prof_Skills || '');
        setDndPointsName(data.PointsName || '');
        setDndAttire(data.Attire || '');
        const extraFieldNames = setDndExtraFieldNames(data.ExtraLevelFields);

        // Parse DNDMod to get TTRPG IDs
        if (data.DNDMod) {
          const ttrpgNames = data.DNDMod.split(',').map(name => name.trim());
          const ttrpgIds = ttrpgNames
            .map(name => {
              const ttrpg = availableDndTTRPGs.find(t => t.TTRPG_name === name);
              return ttrpg ? ttrpg.id : null;
            })
            .filter(id => id !== null);
          setSelectedDndTTRPGs(ttrpgIds);
        } else {
          setSelectedDndTTRPGs([]);
        }

        let featureSource = dndClassFeatures;
        if (featureSource.length === 0) {
          const { data: featureData, error: featureError } = await supabase
            .from('DND_ClassFeatures')
            .select('id, FeatureName, FeatureText')
            .order('FeatureName');

          if (featureError) throw featureError;
          featureSource = featureData || [];
          setDndClassFeatures(featureSource);
        }

        const featureById = new Map(featureSource.map((feature) => [feature.id, feature.FeatureName]));

        let levelData = [];
        const levelWithExtras = await supabase
          .from('DND_Class_Levels')
          .select('Level, ProfBonus, Features, Cantrips, SpellsKnown, Points, ExtraValues')
          .eq('Class', classId)
          .order('Level', { ascending: true });

        if (levelWithExtras.error) {
          const levelFallback = await supabase
            .from('DND_Class_Levels')
            .select('Level, ProfBonus, Features, Cantrips, SpellsKnown, Points')
            .eq('Class', classId)
            .order('Level', { ascending: true });
          if (levelFallback.error) throw levelFallback.error;
          levelData = levelFallback.data || [];
        } else {
          levelData = levelWithExtras.data || [];
        }

        if (levelData && levelData.length > 0) {
          const baseLevels = createDndClassLevels();
          levelData.forEach((row) => {
            const index = Math.max(0, Math.min(19, (row.Level || 1) - 1));
            const featureIds = String(row.Features || '')
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean)
              .map((value) => Number(value))
              .filter((value) => !Number.isNaN(value));
            const featureList = featureIds
              .map((id) => featureById.get(id))
              .filter(Boolean);
            baseLevels[index] = {
              proficiencyBonus: row.ProfBonus != null ? String(row.ProfBonus) : '',
              features: featureList,
              cantrips: row.Cantrips != null ? String(row.Cantrips) : '',
              spells: row.SpellsKnown != null ? String(row.SpellsKnown) : '',
              points: row.Points != null ? String(row.Points) : '',
              extraValues: normalizeDndExtraValues(row.ExtraValues, extraFieldNames),
            };
          });
          setDndClassLevels(baseLevels);
        } else {
          setDndClassLevels(createDndClassLevels());
        }
      }
    } catch (err) {
      console.error('Failed to fetch DND Class data:', err);
      setError('Failed to load class data');
    }
  };

  const loadDndSubclassData = async (subclassId) => {
    try {
      const { data, error } = await supabase
        .from('DND_Subclasses')
        .select('*')
        .eq('id', subclassId)
        .single();

      if (error) throw error;

      if (data) {
        setDndSubclassName(data.SubclassName || '');
        setDndSubclassDescription(data.Description || '');
        setDndSubclassClassId(data.Class != null ? String(data.Class) : '');

        let featureSource = dndClassFeatures;
        if (featureSource.length === 0) {
          const { data: featureData, error: featureError } = await supabase
            .from('DND_ClassFeatures')
            .select('id, FeatureName, FeatureText')
            .order('FeatureName');
          if (featureError) throw featureError;
          featureSource = featureData || [];
          setDndClassFeatures(featureSource);
        }

        const featureById = new Map(featureSource.map((feature) => [feature.id, feature.FeatureName]));

        const levelResult = await runSubclassLevelsQuery((tableName) => (
          supabase
            .from(tableName)
            .select('Level, Features')
            .eq('Subclass', subclassId)
            .order('Level', { ascending: true })
        ));
        if (levelResult.error) throw levelResult.error;
        const levelData = levelResult.data || [];

        if (levelData.length > 0) {
          const baseLevels = createDndSubclassLevels();
          levelData.forEach((row) => {
            const index = Math.max(0, Math.min(19, (row.Level || 1) - 1));
            const featureIds = String(row.Features || '')
              .split(',')
              .map((item) => item.trim())
              .filter(Boolean)
              .map((value) => Number(value))
              .filter((value) => !Number.isNaN(value));
            const featureList = featureIds
              .map((id) => featureById.get(id))
              .filter(Boolean);

            baseLevels[index] = {
              features: featureList,
            };
          });
          setDndSubclassLevels(baseLevels);
        } else {
          setDndSubclassLevels(createDndSubclassLevels());
        }
      }
    } catch (err) {
      console.error('Failed to fetch DND Subclass data:', err);
      setError('Failed to load subclass data');
    }
  };

  const loadDndRaceData = async (raceId) => {
    try {
      const { data, error } = await supabase
        .from('DND_Races')
        .select('*')
        .eq('id', raceId)
        .single();

      if (error) throw error;

      if (data) {
        setDndRaceName(data.RaceName || '');
        setDndRaceDescription(data.Description || '');
        setDndRaceLook(data.RaceLook || '');
        setDndRaceSkinColour(data.SkinColour || '');
        setDndRaceSize(data.Size || '');
        setDndRaceSpeed(data.Speed != null ? String(data.Speed) : '');
        setDndRaceLanguages(data.Languages || '');
        setDndRaceTraitsFromList(parseDndRaceTraits(data.Traits));
        setDndRaceAbilityBonusRules(parseDndRaceAbilityBonusRules(data));
        setSelectedDndTTRPGs(parseDndTtrpgIdsFromMod(data.DNDMod));
      }
    } catch (err) {
      console.error('Failed to fetch DND Race data:', err);
      setError('Failed to load race data');
    }
  };

  const loadDndSubRaceData = async (subRaceId) => {
    try {
      const { data, error } = await supabase
        .from('DND_SubRaces')
        .select('*')
        .eq('id', subRaceId)
        .single();

      if (error) throw error;

      if (data) {
        setDndSubRaceName(data.SubRaceName || '');
        setDndSubRaceDescription(data.Description || '');
        setDndSubRaceRaceId(data.Race != null ? String(data.Race) : '');
        setDndSubRaceTraitsFromList(parseDndTraitList(data.Traits));
        setDndSubRaceAbilityBonusRules(parseDndRaceAbilityBonusRules(data));
        setSelectedDndTTRPGs(parseDndTtrpgIdsFromMod(data.DNDMod));
      }
    } catch (err) {
      console.error('Failed to fetch DND Sub Race data:', err);
      setError('Failed to load sub race data');
    }
  };

  const loadDndPictureData = async (pictureLinkId) => {
    try {
      const { data, error } = await supabase
        .from('DND_Pictures')
        .select('*')
        .eq('id', pictureLinkId)
        .single();

      if (error) throw error;

      if (data) {
        setDndPictureClassId(data.Class != null ? String(data.Class) : '');
        setDndPictureRaceId(data.Race != null ? String(data.Race) : '');
        setDndPictureId(data.PictureID != null ? String(data.PictureID) : '');
      }
    } catch (err) {
      console.error('Failed to fetch DND Picture mapping data:', err);
      setError('Failed to load DND picture mapping data');
    }
  };

  const loadDndBackgroundData = async (backgroundId) => {
    try {
      const { data, error } = await supabase
        .from('DND_Backgrounds')
        .select('*')
        .eq('id', backgroundId)
        .single();

      if (error) throw error;

      if (data) {
        setDndBackgroundName(data.BackgroundName || '');
        setDndBackgroundDescription(data.Description || '');
        setDndBackgroundSkillProficiencies(data.SkillProficiencies || '');
        setDndBackgroundToolProficiencies(data.ToolProficiencies || '');
        setDndBackgroundLanguages(data.Languages || '');
        setDndBackgroundFeatureName(data.FeatureName || '');
        setDndBackgroundFeatureText(data.FeatureText || '');
        setDndBackgroundStartingEquipment(data.StartingEquipment || '');
        setSelectedDndTTRPGs(parseDndTtrpgIdsFromMod(data.DNDMod));
      }
    } catch (err) {
      console.error('Failed to fetch DND Background data:', err);
      setError('Failed to load background data');
    }
  };

  const loadDndEquipmentData = async (equipmentId) => {
    try {
      const { data, error } = await supabase
        .from('DND_Equipment')
        .select('*')
        .eq('id', equipmentId)
        .single();

      if (error) throw error;

      if (data) {
        setDndEquipmentName(data.ItemName || '');
        setDndEquipmentCategory(data.Category || '');
        setDndEquipmentDescription(data.Description || '');
        setDndEquipmentCost(data.Cost || '');
        setDndEquipmentWeight(data.Weight || '');
        setDndEquipmentProperties(data.Properties || '');
        setDndEquipmentDamage(data.Damage || '');
        setDndEquipmentDamageType(data.DamageType || '');
        setDndEquipmentArmorClass(data.ArmorClass || '');
        setDndEquipmentAllowedClasses(data.AllowedClasses || '');
        setSelectedDndTTRPGs(parseDndTtrpgIdsFromMod(data.DNDMod));
      }
    } catch (err) {
      console.error('Failed to fetch DND Equipment data:', err);
      setError('Failed to load equipment data');
    }
  };

  const loadDndSpellData = async (spellId) => {
    try {
      const { data, error } = await supabase
        .from('DND_Spells')
        .select('*')
        .eq('id', spellId)
        .single();

      if (error) throw error;

      if (data) {
        setDndSpellName(data.SpellName || '');
        setDndSpellLevel(String(data.SpellLevel ?? 0));
        setDndSpellSchool(data.School || '');
        setDndSpellCastingTime(data.CastingTime || '');
        setDndSpellRange(data.Range || '');
        setDndSpellComponents(data.Components || '');
        setDndSpellDuration(data.Duration || '');
        setDndSpellDescription(data.Description || '');
        setDndSpellClassList(data.ClassList || '');
        setSelectedDndTTRPGs(parseDndTtrpgIdsFromMod(data.DNDMod));
      }
    } catch (err) {
      console.error('Failed to fetch DND Spell data:', err);
      setError('Failed to load spell data');
    }
  };

  const resetDndClassForm = () => {
    setSelectedDndClassId('__new__');
    setDndClassName('');
    setDndClassDescription('');
    setDndHitDice('');
    setDndProfArmour('');
    setDndProfWeapons('');
    setDndProfSavingThrows('');
    setDndProfSkills('');
    setDndPointsName('');
    setDndAttire('');
    setDndExtraLevelFieldInput('');
    setDndExtraLevelFields([]);
    setDndMod('');
    setSelectedDndTTRPGs([]);
    setDndClassLevels(createDndClassLevels());
    setActiveFeaturePickerIndex(null);
    setShowAddFeatureForm(false);
    setNewFeatureName('');
    setNewFeatureText('');
    setFeatureTargetLevelIndex(null);
  };

  const resetDndSubclassForm = () => {
    setSelectedDndSubclassId('__new__');
    setDndSubclassName('');
    setDndSubclassDescription('');
    setDndSubclassClassId('');
    setDndSubclassLevels(createDndSubclassLevels());
    setActiveSubclassFeaturePickerIndex(null);
    setShowAddSubclassFeatureForm(false);
    setNewSubclassFeatureName('');
    setNewSubclassFeatureText('');
    setSubclassFeatureTargetLevelIndex(null);
  };

  const resetDndRaceForm = () => {
    setSelectedDndRaceId('__new__');
    setSelectedDndTTRPGs([]);
    setDndRaceName('');
    setDndRaceDescription('');
    setDndRaceLook('');
    setDndRaceSkinColour('');
    setDndRaceSize('');
    setDndRaceSpeed('');
    setDndRaceLanguages('');
    setDndRaceSelectedTraits([]);
    setDndRaceTraitPickerValue('');
    setShowAddDndRaceTraitForm(false);
    setNewDndRaceTraitName('');
    setNewDndRaceTraitText('');
    setDndRaceAbilityBonusRules(createDefaultDndRaceAbilityBonusRules());
  };

  const resetDndSubRaceForm = () => {
    setSelectedDndSubRaceId('__new__');
    setSelectedDndTTRPGs([]);
    setDndSubRaceName('');
    setDndSubRaceDescription('');
    setDndSubRaceRaceId('');
    setDndSubRaceSelectedTraits([]);
    setDndSubRaceTraitPickerValue('');
    setShowAddDndSubRaceTraitForm(false);
    setNewDndSubRaceTraitName('');
    setNewDndSubRaceTraitText('');
    setDndSubRaceAbilityBonusRules(createDefaultDndSubRaceAbilityBonusRules());
  };

  const resetDndPictureForm = () => {
    setSelectedDndPictureLinkId('__new__');
    setDndPictureClassId('');
    setDndPictureRaceId('');
    setDndPictureId('');
  };

  const resetDndBackgroundForm = () => {
    setSelectedDndBackgroundId('__new__');
    setSelectedDndTTRPGs([]);
    setDndBackgroundName('');
    setDndBackgroundDescription('');
    setDndBackgroundSkillProficiencies('');
    setDndBackgroundToolProficiencies('');
    setDndBackgroundLanguages('');
    setDndBackgroundFeatureName('');
    setDndBackgroundFeatureText('');
    setDndBackgroundStartingEquipment('');
  };

  const resetDndEquipmentForm = () => {
    setSelectedDndEquipmentId('__new__');
    setSelectedDndTTRPGs([]);
    setDndEquipmentName('');
    setDndEquipmentCategory('');
    setDndEquipmentDescription('');
    setDndEquipmentCost('');
    setDndEquipmentWeight('');
    setDndEquipmentProperties('');
    setDndEquipmentDamage('');
    setDndEquipmentDamageType('');
    setDndEquipmentArmorClass('');
    setDndEquipmentAllowedClasses('');
  };

  const resetDndSpellForm = () => {
    setSelectedDndSpellId('__new__');
    setSelectedDndTTRPGs([]);
    setDndSpellName('');
    setDndSpellLevel('0');
    setDndSpellSchool('');
    setDndSpellCastingTime('');
    setDndSpellRange('');
    setDndSpellComponents('');
    setDndSpellDuration('');
    setDndSpellDescription('');
    setDndSpellClassList('');
  };

  const updateDndClassLevel = (index, field, value) => {
    setDndClassLevels((prev) => prev.map((row, rowIndex) => (
      rowIndex === index ? { ...row, [field]: value } : row
    )));
  };

  const updateDndClassLevelExtra = (index, fieldName, value) => {
    setDndClassLevels((prev) => prev.map((row, rowIndex) => {
      if (rowIndex !== index) return row;
      return {
        ...row,
        extraValues: {
          ...(row.extraValues || {}),
          [fieldName]: value,
        },
      };
    }));
  };

  const addFeatureToLevel = (index, featureName) => {
    if (!featureName) return;
    setDndClassLevels((prev) => prev.map((row, rowIndex) => {
      if (rowIndex !== index) return row;
      if (row.features.includes(featureName)) return row;
      return { ...row, features: [...row.features, featureName] };
    }));
  };

  const addFeatureToSubclassLevel = (index, featureName) => {
    if (!featureName) return;
    setDndSubclassLevels((prev) => prev.map((row, rowIndex) => {
      if (rowIndex !== index) return row;
      if (row.features.includes(featureName)) return row;
      return { ...row, features: [...row.features, featureName] };
    }));
  };

  const removeFeatureFromLevel = (index, featureName) => {
    setDndClassLevels((prev) => prev.map((row, rowIndex) => (
      rowIndex === index
        ? { ...row, features: row.features.filter((item) => item !== featureName) }
        : row
    )));
  };

  const removeFeatureFromSubclassLevel = (index, featureName) => {
    setDndSubclassLevels((prev) => prev.map((row, rowIndex) => (
      rowIndex === index
        ? { ...row, features: row.features.filter((item) => item !== featureName) }
        : row
    )));
  };

  const handleSaveDndFeature = async () => {
    if (!newFeatureName.trim()) {
      setError('Feature name is required');
      return;
    }
    setSavingDndFeature(true);
    try {
      const { data, error } = await supabase
        .from('DND_ClassFeatures')
        .insert([
          {
            FeatureName: newFeatureName.trim(),
            FeatureText: newFeatureText.trim()
          }
        ])
        .select('id, FeatureName, FeatureText')
        .single();

      if (error) throw error;

      const created = data || { FeatureName: newFeatureName.trim(), FeatureText: newFeatureText.trim() };
      setDndClassFeatures((prev) => [...prev, created].sort((a, b) => a.FeatureName.localeCompare(b.FeatureName)));

      if (featureTargetLevelIndex != null) {
        addFeatureToLevel(featureTargetLevelIndex, created.FeatureName);
      }

      setShowAddFeatureForm(false);
      setNewFeatureName('');
      setNewFeatureText('');
      setFeatureTargetLevelIndex(null);
    } catch (err) {
      console.error('Failed to save DND Feature:', err);
      setError('Failed to save DND Feature. Please try again.');
    } finally {
      setSavingDndFeature(false);
    }
  };

  const handleSaveDndRaceTrait = async () => {
    if (!newDndRaceTraitName.trim()) {
      setError('Trait name is required');
      return;
    }
    setSavingDndRaceTrait(true);
    try {
      const { data, error } = await supabase
        .from('DND_ClassFeatures')
        .insert([
          {
            FeatureName: newDndRaceTraitName.trim(),
            FeatureText: newDndRaceTraitText.trim()
          }
        ])
        .select('id, FeatureName, FeatureText')
        .single();

      if (error) throw error;

      const created = data || { FeatureName: newDndRaceTraitName.trim(), FeatureText: newDndRaceTraitText.trim() };
      setDndClassFeatures((prev) => [...prev, created].sort((a, b) => a.FeatureName.localeCompare(b.FeatureName)));
      addDndRaceTrait(created.FeatureName);
      setShowAddDndRaceTraitForm(false);
      setNewDndRaceTraitName('');
      setNewDndRaceTraitText('');
      setDndRaceTraitPickerValue('');
    } catch (err) {
      console.error('Failed to save DND Race Trait:', err);
      setError('Failed to save DND Race Trait. Please try again.');
    } finally {
      setSavingDndRaceTrait(false);
    }
  };

  const handleSaveDndSubRaceTrait = async () => {
    if (!newDndSubRaceTraitName.trim()) {
      setError('Trait name is required');
      return;
    }
    setSavingDndSubRaceTrait(true);
    try {
      const { data, error } = await supabase
        .from('DND_ClassFeatures')
        .insert([
          {
            FeatureName: newDndSubRaceTraitName.trim(),
            FeatureText: newDndSubRaceTraitText.trim()
          }
        ])
        .select('id, FeatureName, FeatureText')
        .single();

      if (error) throw error;

      const created = data || { FeatureName: newDndSubRaceTraitName.trim(), FeatureText: newDndSubRaceTraitText.trim() };
      setDndClassFeatures((prev) => [...prev, created].sort((a, b) => a.FeatureName.localeCompare(b.FeatureName)));
      addDndSubRaceTrait(created.FeatureName);
      setShowAddDndSubRaceTraitForm(false);
      setNewDndSubRaceTraitName('');
      setNewDndSubRaceTraitText('');
      setDndSubRaceTraitPickerValue('');
    } catch (err) {
      console.error('Failed to save DND Sub Race Trait:', err);
      setError('Failed to save DND Sub Race Trait. Please try again.');
    } finally {
      setSavingDndSubRaceTrait(false);
    }
  };

  const handleSaveDndSubclassFeature = async () => {
    if (!newSubclassFeatureName.trim()) {
      setError('Feature name is required');
      return;
    }
    setSavingDndSubclassFeature(true);
    try {
      const { data, error } = await supabase
        .from('DND_ClassFeatures')
        .insert([
          {
            FeatureName: newSubclassFeatureName.trim(),
            FeatureText: newSubclassFeatureText.trim()
          }
        ])
        .select('id, FeatureName, FeatureText')
        .single();

      if (error) throw error;

      const created = data || { FeatureName: newSubclassFeatureName.trim(), FeatureText: newSubclassFeatureText.trim() };
      setDndClassFeatures((prev) => [...prev, created].sort((a, b) => a.FeatureName.localeCompare(b.FeatureName)));

      if (subclassFeatureTargetLevelIndex != null) {
        addFeatureToSubclassLevel(subclassFeatureTargetLevelIndex, created.FeatureName);
      }

      setShowAddSubclassFeatureForm(false);
      setNewSubclassFeatureName('');
      setNewSubclassFeatureText('');
      setSubclassFeatureTargetLevelIndex(null);
    } catch (err) {
      console.error('Failed to save DND Subclass Feature:', err);
      setError('Failed to save DND Feature. Please try again.');
    } finally {
      setSavingDndSubclassFeature(false);
    }
  };

  const handleSaveDndClass = async () => {
    setSavingDndClass(true);
    try {
      if (!dndClassName.trim()) {
        setError('Class name is required');
        setSavingDndClass(false);
        return;
      }

      const dndModValue = getSelectedDndModValue();
      const normalizedExtraFields = setDndExtraFieldNames([
        ...dndExtraLevelFields,
        ...normalizeDndExtraFieldNames(dndExtraLevelFieldInput),
      ]);
      let savedWithoutExtraClassColumns = false;
      let savedWithoutExtraLevelColumns = false;

      let classIdToUse = selectedDndClassId;

      if (selectedDndClassId === '__new__') {
        // Insert new class
        const classInsertPayload = {
          ClassName: dndClassName,
          Description: dndClassDescription,
          HitDice: dndHitDice,
          Prof_Armour: dndProfArmour,
          Prof_Weapons: dndProfWeapons,
          Prof_SavingThrows: dndProfSavingThrows,
          Prof_Skills: dndProfSkills,
          PointsName: dndPointsName,
          Attire: dndAttire,
          ExtraLevelFields: normalizedExtraFields,
          DNDMod: dndModValue
        };
        const { data: insertData, error } = await supabase
          .from('DND_Classes')
          .insert([classInsertPayload])
          .select('id')
          .single();

        if (error) {
          const { ExtraLevelFields, Attire, ...legacyClassPayload } = classInsertPayload;
          const legacyInsertResult = await supabase
            .from('DND_Classes')
            .insert([legacyClassPayload])
            .select('id')
            .single();

          if (legacyInsertResult.error) throw legacyInsertResult.error;
          savedWithoutExtraClassColumns = true;
          classIdToUse = legacyInsertResult.data?.id;
        } else {
          classIdToUse = insertData?.id;
        }
      } else {
        // Update existing class
        const classUpdatePayload = {
          ClassName: dndClassName,
          Description: dndClassDescription,
          HitDice: dndHitDice,
          Prof_Armour: dndProfArmour,
          Prof_Weapons: dndProfWeapons,
          Prof_SavingThrows: dndProfSavingThrows,
          Prof_Skills: dndProfSkills,
          PointsName: dndPointsName,
          Attire: dndAttire,
          ExtraLevelFields: normalizedExtraFields,
          DNDMod: dndModValue
        };

        const { error } = await supabase
          .from('DND_Classes')
          .update(classUpdatePayload)
          .eq('id', selectedDndClassId);

        if (error) {
          const { ExtraLevelFields, Attire, ...legacyClassPayload } = classUpdatePayload;
          const legacyUpdateResult = await supabase
            .from('DND_Classes')
            .update(legacyClassPayload)
            .eq('id', selectedDndClassId);
          if (legacyUpdateResult.error) throw legacyUpdateResult.error;
          savedWithoutExtraClassColumns = true;
        }
      }

      if (!classIdToUse) {
        throw new Error('Failed to resolve Class ID for level save');
      }

      const featureNameToId = new Map(dndClassFeatures.map((feature) => [feature.FeatureName, feature.id]));

      const levelRows = dndClassLevels.map((row, index) => ({
        Class: classIdToUse,
        Level: index + 1,
        ProfBonus: parseNumberOrNull(row.proficiencyBonus),
        Features: row.features.length
          ? row.features
            .map((name) => featureNameToId.get(name))
            .filter((id) => id != null)
            .join(', ')
          : null,
        Cantrips: parseNumberOrNull(row.cantrips),
        SpellsKnown: parseNumberOrNull(row.spells),
        Points: parseNumberOrNull(row.points),
        ExtraValues: normalizedExtraFields.reduce((acc, fieldName) => {
          const fieldValue = row.extraValues?.[fieldName];
          if (fieldValue == null || String(fieldValue).trim() === '') return acc;
          acc[fieldName] = String(fieldValue);
          return acc;
        }, {})
      }));

      const { error: deleteError } = await supabase
        .from('DND_Class_Levels')
        .delete()
        .eq('Class', classIdToUse);

      if (deleteError) throw deleteError;

      const { error: levelInsertError } = await supabase
        .from('DND_Class_Levels')
        .insert(levelRows);

      if (levelInsertError) {
        const legacyLevelRows = levelRows.map(({ ExtraValues, ...legacyRow }) => legacyRow);
        const legacyInsertResult = await supabase
          .from('DND_Class_Levels')
          .insert(legacyLevelRows);
        if (legacyInsertResult.error) throw legacyInsertResult.error;
        savedWithoutExtraLevelColumns = true;
      }

      if (savedWithoutExtraClassColumns || savedWithoutExtraLevelColumns) {
        setSuccess('DND Class saved, but custom level columns require the latest DND migration to persist.');
      } else {
        setSuccess('DND Class saved successfully');
      }
      resetDndClassForm();
      setShowAddDndClassForm(false);
    } catch (err) {
      console.error('Failed to save DND Class:', err);
      setError('Failed to save DND Class. Please try again.');
    } finally {
      setSavingDndClass(false);
    }
  };

  const handleSaveDndSubclass = async () => {
    setSavingDndSubclass(true);
    try {
      if (!dndSubclassName.trim()) {
        setError('Subclass name is required');
        setSavingDndSubclass(false);
        return;
      }

      if (!dndSubclassClassId) {
        setError('Please select the parent class for this subclass');
        setSavingDndSubclass(false);
        return;
      }

      const dndModValue = getDndModValueForClass(dndSubclassClassId);
      let subclassIdToUse = selectedDndSubclassId;

      if (selectedDndSubclassId === '__new__') {
        const subclassInsertPayload = {
          SubclassName: dndSubclassName,
          Description: dndSubclassDescription,
          Class: parseInt(dndSubclassClassId, 10),
          DNDMod: dndModValue || null,
        };

        const { data: insertData, error } = await supabase
          .from('DND_Subclasses')
          .insert([subclassInsertPayload])
          .select('id')
          .single();
        if (error) throw error;
        subclassIdToUse = insertData?.id;
      } else {
        const subclassUpdatePayload = {
          SubclassName: dndSubclassName,
          Description: dndSubclassDescription,
          Class: parseInt(dndSubclassClassId, 10),
          DNDMod: dndModValue || null,
        };

        const { error } = await supabase
          .from('DND_Subclasses')
          .update(subclassUpdatePayload)
          .eq('id', selectedDndSubclassId);
        if (error) throw error;
      }

      if (!subclassIdToUse) {
        throw new Error('Failed to resolve Subclass ID for level save');
      }

      const featureNameToId = new Map(dndClassFeatures.map((feature) => [feature.FeatureName, feature.id]));

      const levelRows = dndSubclassLevels.map((row, index) => ({
        Subclass: subclassIdToUse,
        Level: index + 1,
        Features: row.features.length
          ? row.features
            .map((name) => featureNameToId.get(name))
            .filter((id) => id != null)
            .join(', ')
          : null,
      }));

      const deleteResult = await runSubclassLevelsQuery((tableName) => (
        supabase
          .from(tableName)
          .delete()
          .eq('Subclass', subclassIdToUse)
      ));
      if (deleteResult.error) throw deleteResult.error;

      const insertResult = await runSubclassLevelsQuery((tableName) => (
        supabase
          .from(tableName)
          .insert(levelRows)
      ));
      if (insertResult.error) throw insertResult.error;

      setSuccess('DND Subclass saved successfully');
      resetDndSubclassForm();
      setShowAddDndSubclassForm(false);
      loadDndSubclasses();
    } catch (err) {
      console.error('Failed to save DND Subclass:', err);
      setError('Failed to save DND Subclass. Please try again.');
    } finally {
      setSavingDndSubclass(false);
    }
  };

  const handleSaveDndRace = async () => {
    if (!dndRaceName.trim()) {
      setError('Race name is required');
      return;
    }

    setSavingDndRace(true);
    try {
      const normalizedAbilityRules = normalizeDndRaceAbilityBonusRules(dndRaceAbilityBonusRules);
      const legacyAbilityBonuses = buildLegacyDndRaceAbilityBonuses(normalizedAbilityRules);
      const payload = {
        RaceName: dndRaceName,
        DNDMod: getSelectedDndModValue(),
        Description: dndRaceDescription,
        RaceLook: dndRaceLook,
        SkinColour: dndRaceSkinColour,
        Size: dndRaceSize,
        Speed: parseNumberOrNull(dndRaceSpeed),
        Languages: dndRaceLanguages,
        Traits: dndRaceSelectedTraits.join(', '),
        AbilityBonusRules: JSON.stringify(normalizedAbilityRules),
        ...legacyAbilityBonuses,
      };

      const legacyPayload = { ...payload };
      delete legacyPayload.AbilityBonusRules;
      delete legacyPayload.RaceLook;
      delete legacyPayload.SkinColour;

      if (selectedDndRaceId === '__new__') {
        const { error } = await supabase.from('DND_Races').insert([payload]);
        if (error) {
          if (!isMissingDndRaceAbilityBonusRulesColumnError(error) && !isMissingDndRaceLookColumnError(error) && !isMissingDndRaceSkinColourColumnError(error)) throw error;
          const fallbackInsert = await supabase.from('DND_Races').insert([legacyPayload]);
          if (fallbackInsert.error) throw fallbackInsert.error;
          setSuccess('DND Race saved, but Race Look/Skin Colour and/or bonus-choice rules require the latest DND migration to persist.');
        } else {
          setSuccess('DND Race saved successfully');
        }
      } else {
        const { error } = await supabase
          .from('DND_Races')
          .update(payload)
          .eq('id', selectedDndRaceId);
        if (error) {
          if (!isMissingDndRaceAbilityBonusRulesColumnError(error) && !isMissingDndRaceLookColumnError(error) && !isMissingDndRaceSkinColourColumnError(error)) throw error;
          const fallbackUpdate = await supabase
            .from('DND_Races')
            .update(legacyPayload)
            .eq('id', selectedDndRaceId);
          if (fallbackUpdate.error) throw fallbackUpdate.error;
          setSuccess('DND Race saved, but Race Look/Skin Colour and/or bonus-choice rules require the latest DND migration to persist.');
        } else {
          setSuccess('DND Race saved successfully');
        }
      }

      resetDndRaceForm();
      setShowAddDndRaceForm(false);
      loadDndRaces();
    } catch (err) {
      console.error('Failed to save DND Race:', err);
      setError('Failed to save DND Race. Please try again.');
    } finally {
      setSavingDndRace(false);
    }
  };

  const handleSaveDndSubRace = async () => {
    if (!dndSubRaceName.trim()) {
      setError('Sub race name is required');
      return;
    }

    if (!dndSubRaceRaceId) {
      setError('Associated race is required');
      return;
    }

    setSavingDndSubRace(true);
    try {
      const normalizedAbilityRules = normalizeDndRaceAbilityBonusRules(dndSubRaceAbilityBonusRules);
      const legacyAbilityBonuses = buildLegacyDndRaceAbilityBonuses(normalizedAbilityRules);
      const payload = {
        SubRaceName: dndSubRaceName,
        Description: dndSubRaceDescription,
        Race: parseInt(dndSubRaceRaceId, 10),
        DNDMod: getDndModValueForRace(dndSubRaceRaceId) || null,
        Traits: dndSubRaceSelectedTraits.join(', '),
        AbilityBonusRules: JSON.stringify(normalizedAbilityRules),
        ...legacyAbilityBonuses,
      };

      const legacyPayload = { ...payload };
      delete legacyPayload.AbilityBonusRules;

      if (selectedDndSubRaceId === '__new__') {
        const { error } = await supabase.from('DND_SubRaces').insert([payload]);
        if (error) {
          if (!isMissingDndSubRaceAbilityBonusRulesColumnError(error)) throw error;
          const fallbackInsert = await supabase.from('DND_SubRaces').insert([legacyPayload]);
          if (fallbackInsert.error) throw fallbackInsert.error;
          setSuccess('DND Sub Race saved, but bonus-choice rules require the latest DND migration to persist.');
        } else {
          setSuccess('DND Sub Race saved successfully');
        }
      } else {
        const { error } = await supabase
          .from('DND_SubRaces')
          .update(payload)
          .eq('id', selectedDndSubRaceId);
        if (error) {
          if (!isMissingDndSubRaceAbilityBonusRulesColumnError(error)) throw error;
          const fallbackUpdate = await supabase
            .from('DND_SubRaces')
            .update(legacyPayload)
            .eq('id', selectedDndSubRaceId);
          if (fallbackUpdate.error) throw fallbackUpdate.error;
          setSuccess('DND Sub Race saved, but bonus-choice rules require the latest DND migration to persist.');
        } else {
          setSuccess('DND Sub Race saved successfully');
        }
      }

      resetDndSubRaceForm();
      setShowAddDndSubRaceForm(false);
      loadDndSubRaces();
    } catch (err) {
      console.error('Failed to save DND Sub Race:', err);
      setError('Failed to save DND Sub Race. Please try again.');
    } finally {
      setSavingDndSubRace(false);
    }
  };

  const handleSaveDndPicture = async () => {
    const parsedPictureId = parseNumberOrNull(dndPictureId);

    if (!dndPictureClassId) {
      setError('Class is required for picture mapping');
      return;
    }

    if (!dndPictureRaceId) {
      setError('Race is required for picture mapping');
      return;
    }

    if (parsedPictureId == null || parsedPictureId <= 0) {
      setError('Picture ID must be a positive number');
      return;
    }

    setSavingDndPicture(true);
    try {
      const payload = {
        Class: parseInt(dndPictureClassId, 10),
        Race: parseInt(dndPictureRaceId, 10),
        PictureID: parsedPictureId,
        DNDMod: getDndModValueForClass(dndPictureClassId) || getDndModValueForRace(dndPictureRaceId) || null,
      };

      if (selectedDndPictureLinkId === '__new__') {
        const { error } = await supabase.from('DND_Pictures').insert([payload]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('DND_Pictures')
          .update(payload)
          .eq('id', selectedDndPictureLinkId);
        if (error) throw error;
      }

      setSuccess('DND Picture mapping saved successfully');
      resetDndPictureForm();
      setShowAddDndPictureForm(false);
      loadDndPictures();
    } catch (err) {
      console.error('Failed to save DND Picture mapping:', err);
      setError('Failed to save DND Picture mapping. Please try again.');
    } finally {
      setSavingDndPicture(false);
    }
  };

  const handleSaveDndBackground = async () => {
    if (!dndBackgroundName.trim()) {
      setError('Background name is required');
      return;
    }

    setSavingDndBackground(true);
    try {
      const payload = {
        BackgroundName: dndBackgroundName,
        DNDMod: getSelectedDndModValue(),
        Description: dndBackgroundDescription,
        SkillProficiencies: dndBackgroundSkillProficiencies,
        ToolProficiencies: dndBackgroundToolProficiencies,
        Languages: dndBackgroundLanguages,
        FeatureName: dndBackgroundFeatureName,
        FeatureText: dndBackgroundFeatureText,
        StartingEquipment: dndBackgroundStartingEquipment,
      };

      if (selectedDndBackgroundId === '__new__') {
        const { error } = await supabase.from('DND_Backgrounds').insert([payload]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('DND_Backgrounds')
          .update(payload)
          .eq('id', selectedDndBackgroundId);
        if (error) throw error;
      }

      setSuccess('DND Background saved successfully');
      resetDndBackgroundForm();
      setShowAddDndBackgroundForm(false);
      loadDndBackgrounds();
    } catch (err) {
      console.error('Failed to save DND Background:', err);
      setError('Failed to save DND Background. Please try again.');
    } finally {
      setSavingDndBackground(false);
    }
  };

  const handleSaveDndEquipment = async () => {
    if (!dndEquipmentName.trim()) {
      setError('Equipment name is required');
      return;
    }

    setSavingDndEquipment(true);
    try {
      const payload = {
        ItemName: dndEquipmentName,
        DNDMod: getSelectedDndModValue(),
        Category: dndEquipmentCategory,
        Description: dndEquipmentDescription,
        Cost: dndEquipmentCost,
        Weight: dndEquipmentWeight,
        Properties: dndEquipmentProperties,
        Damage: dndEquipmentDamage,
        DamageType: dndEquipmentDamageType,
        ArmorClass: dndEquipmentArmorClass,
        AllowedClasses: dndEquipmentAllowedClasses,
      };

      if (selectedDndEquipmentId === '__new__') {
        const { error } = await supabase.from('DND_Equipment').insert([payload]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('DND_Equipment')
          .update(payload)
          .eq('id', selectedDndEquipmentId);
        if (error) throw error;
      }

      setSuccess('DND Equipment saved successfully');
      resetDndEquipmentForm();
      setShowAddDndEquipmentForm(false);
      loadDndEquipmentRows();
    } catch (err) {
      console.error('Failed to save DND Equipment:', err);
      setError('Failed to save DND Equipment. Please try again.');
    } finally {
      setSavingDndEquipment(false);
    }
  };

  const handleSaveDndSpell = async () => {
    if (!dndSpellName.trim()) {
      setError('Spell name is required');
      return;
    }

    setSavingDndSpell(true);
    try {
      const payload = {
        SpellName: dndSpellName,
        DNDMod: getSelectedDndModValue(),
        SpellLevel: parseNumberOrNull(dndSpellLevel) ?? 0,
        School: dndSpellSchool,
        CastingTime: dndSpellCastingTime,
        Range: dndSpellRange,
        Components: dndSpellComponents,
        Duration: dndSpellDuration,
        Description: dndSpellDescription,
        ClassList: dndSpellClassList,
      };

      if (selectedDndSpellId === '__new__') {
        const { error } = await supabase.from('DND_Spells').insert([payload]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('DND_Spells')
          .update(payload)
          .eq('id', selectedDndSpellId);
        if (error) throw error;
      }

      setSuccess('DND Spell saved successfully');
      resetDndSpellForm();
      setShowAddDndSpellForm(false);
      loadDndSpells();
    } catch (err) {
      console.error('Failed to save DND Spell:', err);
      setError('Failed to save DND Spell. Please try again.');
    } finally {
      setSavingDndSpell(false);
    }
  };

  const handleDeleteDndClass = async () => {
    if (selectedDndClassId === '__new__') return;
    if (!confirm('Delete this DND class and all class levels?')) return;

    try {
      const classId = parseInt(selectedDndClassId, 10);

      const { error: levelDeleteError } = await supabase
        .from('DND_Class_Levels')
        .delete()
        .eq('Class', classId);
      if (levelDeleteError) throw levelDeleteError;

      const { error } = await supabase
        .from('DND_Classes')
        .delete()
        .eq('id', classId);
      if (error) throw error;

      setSuccess('DND Class deleted successfully');
      resetDndClassForm();
      loadDndClasses();
    } catch (err) {
      console.error('Failed to delete DND Class:', err);
      setError('Failed to delete DND Class. It may still be referenced by characters.');
    }
  };

  const handleDeleteDndSubclass = async () => {
    if (selectedDndSubclassId === '__new__') return;
    if (!confirm('Delete this DND subclass and all subclass levels?')) return;

    try {
      const subclassId = parseInt(selectedDndSubclassId, 10);

      const levelDeleteResult = await runSubclassLevelsQuery((tableName) => (
        supabase
          .from(tableName)
          .delete()
          .eq('Subclass', subclassId)
      ));
      if (levelDeleteResult.error) throw levelDeleteResult.error;

      const { error } = await supabase
        .from('DND_Subclasses')
        .delete()
        .eq('id', subclassId);
      if (error) throw error;

      setSuccess('DND Subclass deleted successfully');
      resetDndSubclassForm();
      loadDndSubclasses();
    } catch (err) {
      console.error('Failed to delete DND Subclass:', err);
      setError('Failed to delete DND Subclass. It may still be referenced by characters.');
    }
  };

  const handleDeleteDndRace = async () => {
    if (selectedDndRaceId === '__new__') return;
    if (!confirm('Delete this DND race?')) return;

    try {
      const { error } = await supabase
        .from('DND_Races')
        .delete()
        .eq('id', parseInt(selectedDndRaceId, 10));
      if (error) throw error;

      setSuccess('DND Race deleted successfully');
      resetDndRaceForm();
      loadDndRaces();
    } catch (err) {
      console.error('Failed to delete DND Race:', err);
      setError('Failed to delete DND Race. It may still be referenced by characters.');
    }
  };

  const handleDeleteDndSubRace = async () => {
    if (selectedDndSubRaceId === '__new__') return;
    if (!confirm('Delete this DND sub race?')) return;

    try {
      const { error } = await supabase
        .from('DND_SubRaces')
        .delete()
        .eq('id', parseInt(selectedDndSubRaceId, 10));
      if (error) throw error;

      setSuccess('DND Sub Race deleted successfully');
      resetDndSubRaceForm();
      loadDndSubRaces();
    } catch (err) {
      console.error('Failed to delete DND Sub Race:', err);
      setError('Failed to delete DND Sub Race. It may still be referenced by characters.');
    }
  };

  const handleDeleteDndPicture = async () => {
    if (selectedDndPictureLinkId === '__new__') return;
    if (!confirm('Delete this DND picture mapping?')) return;

    try {
      const { error } = await supabase
        .from('DND_Pictures')
        .delete()
        .eq('id', parseInt(selectedDndPictureLinkId, 10));
      if (error) throw error;

      setSuccess('DND Picture mapping deleted successfully');
      resetDndPictureForm();
      loadDndPictures();
    } catch (err) {
      console.error('Failed to delete DND Picture mapping:', err);
      setError('Failed to delete DND Picture mapping.');
    }
  };

  const handleDeleteDndBackground = async () => {
    if (selectedDndBackgroundId === '__new__') return;
    if (!confirm('Delete this DND background?')) return;

    try {
      const { error } = await supabase
        .from('DND_Backgrounds')
        .delete()
        .eq('id', parseInt(selectedDndBackgroundId, 10));
      if (error) throw error;

      setSuccess('DND Background deleted successfully');
      resetDndBackgroundForm();
      loadDndBackgrounds();
    } catch (err) {
      console.error('Failed to delete DND Background:', err);
      setError('Failed to delete DND Background. It may still be referenced by characters.');
    }
  };

  const handleDeleteDndEquipment = async () => {
    if (selectedDndEquipmentId === '__new__') return;
    if (!confirm('Delete this DND equipment item?')) return;

    try {
      const { error } = await supabase
        .from('DND_Equipment')
        .delete()
        .eq('id', parseInt(selectedDndEquipmentId, 10));
      if (error) throw error;

      setSuccess('DND Equipment deleted successfully');
      resetDndEquipmentForm();
      loadDndEquipmentRows();
    } catch (err) {
      console.error('Failed to delete DND Equipment:', err);
      setError('Failed to delete DND Equipment.');
    }
  };

  const handleDeleteDndSpell = async () => {
    if (selectedDndSpellId === '__new__') return;
    if (!confirm('Delete this DND spell?')) return;

    try {
      const { error } = await supabase
        .from('DND_Spells')
        .delete()
        .eq('id', parseInt(selectedDndSpellId, 10));
      if (error) throw error;

      setSuccess('DND Spell deleted successfully');
      resetDndSpellForm();
      loadDndSpells();
    } catch (err) {
      console.error('Failed to delete DND Spell:', err);
      setError('Failed to delete DND Spell.');
    }
  };

  const handleToggleDndTTRPG = (ttrpgId) => {
    setSelectedDndTTRPGs((prev) =>
      prev.includes(ttrpgId)
        ? prev.filter((id) => id !== ttrpgId)
        : [...prev, ttrpgId]
    );
  };

  const handleAddSkill = (skill) => {
    if (skill && !speciesSkills.includes(skill)) {
      setSpeciesSkills([...speciesSkills, skill]);
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSpeciesSkills(speciesSkills.filter(s => s !== skillToRemove));
  };

  const handleAddSpecSkill = (skill) => {
    if (skill && !specSkills.includes(skill)) {
      setSpecSkills([...specSkills, skill]);
    }
  };

  const handleRemoveSpecSkill = (skillToRemove) => {
    setSpecSkills(specSkills.filter(s => s !== skillToRemove));
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

  const handleTalentTreeChange = (boxIndex, value) => {
    if (value === '__ADD_NEW__') {
      setCustomTalentInputMode(prev => ({ ...prev, [boxIndex]: true }));
      setSpecTalentTree(prev => ({ ...prev, [boxIndex]: '' }));
    } else {
      setSpecTalentTree(prev => ({
        ...prev,
        [boxIndex]: value
      }));
      setIsCustomTalent(prev => ({ ...prev, [boxIndex]: false }));
    }
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

  const resetEquipmentForm = () => {
    setSelectedSwEquipmentId('__new__');
    setEquipmentName('');
    setEquipmentDescription('');
    setEquipmentSkillId('');
    setEquipmentRange('');
    setEquipmentEncumbrance('');
    setEquipmentPrice('');
    setEquipmentRarity('');
    setEquipmentDamage('');
    setEquipmentCritical('');
    setEquipmentHP('');
    setEquipmentSpecial('');
    setEquipmentSoak('');
    setEquipmentDamageRange('');
    setEquipmentDamageMelee('');
    setEquipmentConsumable(false);
  };

  const handleSelectEquipment = (equipmentId) => {
    if (!equipmentId || equipmentId === '__new__') {
      resetEquipmentForm();
      return;
    }

    const selected = existingSwEquipment.find((item) => String(item.id) === String(equipmentId));
    if (!selected) return;

    setSelectedSwEquipmentId(String(selected.id));
    setEquipmentName(selected.name || '');
    setEquipmentDescription(selected.description || '');
    setEquipmentSkillId(selected.skill != null ? String(selected.skill) : '');
    setEquipmentRange(selected.range || '');
    setEquipmentEncumbrance(selected.encumbrance != null ? String(selected.encumbrance) : '');
    setEquipmentPrice(selected.price != null ? String(selected.price) : '');
    setEquipmentRarity(selected.rarity != null ? String(selected.rarity) : '');
    setEquipmentDamage(selected.damage != null ? String(selected.damage) : '');
    setEquipmentCritical(selected.critical != null ? String(selected.critical) : '');
    setEquipmentHP(selected.HP != null ? String(selected.HP) : '');
    setEquipmentSpecial(selected.special || '');
    setEquipmentSoak(selected.soak != null ? String(selected.soak) : '');
    setEquipmentDamageRange(selected.defence_range != null ? String(selected.defence_range) : '');
    setEquipmentDamageMelee(selected.defence_melee != null ? String(selected.defence_melee) : '');
    setEquipmentConsumable(selected.consumable === true);
  };

  const resetShipForm = () => {
    setSelectedSwShipId('__new__');
    setShipName('');
    setShipClass('');
    setShipSilhouette('');
    setShipSpeed('');
    setShipHandling('');
    setShipArmor('');
    setShipDefenceFore('');
    setShipDefencePort('');
    setShipDefenceStarboard('');
    setShipDefenceAft('');
    setShipHullThreshold('');
    setShipSystemThreshold('');
    setShipManufacturer('');
    setShipHyperdrivePrimary('');
    setShipHyperdriveBackup('');
    setShipNavicomputer('');
    setShipSensorRange('');
    setShipComplement('');
    setShipEncumbranceCapacity('');
    setShipPassengerCapacity('');
    setShipConsumables('');
    setShipPriceCredits('');
    setShipRarity('');
    setShipCustomizationHardPoints('');
    setShipWeapons('');
    setShipSource('');
    setShipDescription('');
  };

  const handleSelectShip = (shipId) => {
    if (!shipId || shipId === '__new__') {
      resetShipForm();
      return;
    }

    const selected = existingSwShips.find((item) => String(item.id) === String(shipId));
    if (!selected) return;

    setSelectedSwShipId(String(selected.id));
    setShipName(selected.name || '');
    setShipClass(selected.class || '');
    setShipSilhouette(selected.silhouette != null ? String(selected.silhouette) : '');
    setShipSpeed(selected.speed != null ? String(selected.speed) : '');
    setShipHandling(selected.handling != null ? String(selected.handling) : '');
    setShipArmor(selected.armor != null ? String(selected.armor) : '');
    setShipDefenceFore(selected.defence_fore != null ? String(selected.defence_fore) : '');
    setShipDefencePort(selected.defence_port != null ? String(selected.defence_port) : '');
    setShipDefenceStarboard(selected.defence_starboard != null ? String(selected.defence_starboard) : '');
    setShipDefenceAft(selected.defence_aft != null ? String(selected.defence_aft) : '');
    setShipHullThreshold(selected.hull_trauma_threshold != null ? String(selected.hull_trauma_threshold) : '');
    setShipSystemThreshold(selected.system_strain_threshold != null ? String(selected.system_strain_threshold) : '');
    setShipManufacturer(selected.manufacturer || '');
    setShipHyperdrivePrimary(selected.hyperdrive_primary || '');
    setShipHyperdriveBackup(selected.hyperdrive_backup || '');
    setShipNavicomputer(selected.navicomputer || '');
    setShipSensorRange(selected.sensor_range || '');
    setShipComplement(selected.ship_complement || '');
    setShipEncumbranceCapacity(selected.encumbrance_capacity || '');
    setShipPassengerCapacity(selected.passenger_capacity || '');
    setShipConsumables(selected.consumables || '');
    setShipPriceCredits(selected.price_credits != null ? String(selected.price_credits) : '');
    setShipRarity(selected.rarity != null ? String(selected.rarity) : '');
    setShipCustomizationHardPoints(selected.customization_hard_points != null ? String(selected.customization_hard_points) : '');
    setShipWeapons(selected.weapons || '');
    setShipSource(selected.source || '');
    setShipDescription(selected.description || '');
  };

  const handleSaveShip = async () => {
    if (!shipName.trim()) {
      alert('Ship name is required');
      return;
    }

    const payload = {
      name: shipName.trim(),
      class: shipClass.trim() || null,
      silhouette: parseNumberOrNull(shipSilhouette),
      speed: parseNumberOrNull(shipSpeed),
      handling: parseNumberOrNull(shipHandling),
      armor: parseNumberOrNull(shipArmor),
      defence_fore: parseNumberOrNull(shipDefenceFore),
      defence_port: parseNumberOrNull(shipDefencePort),
      defence_starboard: parseNumberOrNull(shipDefenceStarboard),
      defence_aft: parseNumberOrNull(shipDefenceAft),
      hull_trauma_threshold: parseNumberOrNull(shipHullThreshold) ?? 0,
      system_strain_threshold: parseNumberOrNull(shipSystemThreshold) ?? 0,
      manufacturer: shipManufacturer.trim() || null,
      hyperdrive_primary: shipHyperdrivePrimary.trim() || null,
      hyperdrive_backup: shipHyperdriveBackup.trim() || null,
      navicomputer: shipNavicomputer.trim() || null,
      sensor_range: shipSensorRange.trim() || null,
      ship_complement: shipComplement.trim() || null,
      encumbrance_capacity: shipEncumbranceCapacity.trim() || null,
      passenger_capacity: shipPassengerCapacity.trim() || null,
      consumables: shipConsumables.trim() || null,
      price_credits: parseNumberOrNull(shipPriceCredits),
      rarity: parseNumberOrNull(shipRarity),
      customization_hard_points: parseNumberOrNull(shipCustomizationHardPoints),
      weapons: shipWeapons.trim() || null,
      source: shipSource.trim() || null,
      description: shipDescription.trim() || null,
    };

    try {
      let error;
      if (selectedSwShipId && selectedSwShipId !== '__new__') {
        ({ error } = await supabase
          .from('SW_ships')
          .update(payload)
          .eq('id', selectedSwShipId));
      } else {
        ({ error } = await supabase
          .from('SW_ships')
          .insert(payload));
      }

      if (error) {
        console.error('Error saving ship:', error);
        alert('Failed to save ship.');
        return;
      }

      alert(selectedSwShipId && selectedSwShipId !== '__new__' ? 'Ship updated' : 'Ship saved');
      resetShipForm();
      setShowAddShipForm(false);
    } catch (err) {
      console.error('Unexpected error saving ship:', err);
      alert('Failed to save ship.');
    }
  };

  const handleSaveEquipment = async () => {
    if (!equipmentName.trim()) {
      alert('Name is required');
      return;
    }

    try {
      const payload = {
        name: equipmentName.trim(),
        description: equipmentDescription.trim(),
        skill: equipmentSkillId ? parseInt(equipmentSkillId, 10) : null,
        range: equipmentRange.trim(),
        encumbrance: equipmentEncumbrance ? parseInt(equipmentEncumbrance, 10) : null,
        price: equipmentPrice ? parseInt(equipmentPrice, 10) : null,
        rarity: equipmentRarity ? parseInt(equipmentRarity, 10) : null,
        damage: equipmentDamage ? parseInt(equipmentDamage, 10) : null,
        critical: equipmentCritical ? parseInt(equipmentCritical, 10) : null,
        HP: equipmentHP ? parseInt(equipmentHP, 10) : null,
        special: equipmentSpecial.trim(),
        soak: equipmentSoak ? parseInt(equipmentSoak, 10) : null,
        defence_range: equipmentDamageRange !== '' ? parseInt(equipmentDamageRange, 10) : null,
        defence_melee: equipmentDamageMelee !== '' ? parseInt(equipmentDamageMelee, 10) : null,
        consumable: equipmentConsumable,
      };

      let error;
      if (selectedSwEquipmentId && selectedSwEquipmentId !== '__new__') {
        ({ error } = await supabase
          .from('SW_equipment')
          .update(payload)
          .eq('id', selectedSwEquipmentId));
      } else {
        ({ error } = await supabase
          .from('SW_equipment')
          .insert(payload));
      }

      if (error) {
        console.error('Error saving equipment:', error);
        alert('Failed to save equipment');
        return;
      }

      alert(selectedSwEquipmentId && selectedSwEquipmentId !== '__new__' ? 'Equipment updated' : 'Equipment saved');
      resetEquipmentForm();
      setShowAddEquipmentForm(false);
    } catch (err) {
      console.error('Unexpected error saving equipment:', err);
      alert('Failed to save equipment');
    }
  };

  const handleDeleteSpecies = async () => {
    if (!editingSpeciesId) return;
    if (!confirm('Delete this species?')) return;

    const { error } = await supabase
      .from('races')
      .delete()
      .eq('id', editingSpeciesId);

    if (error) {
      console.error('Failed to delete species:', error);
      alert('Failed to delete species.');
      return;
    }

    setExistingSpecies((prev) => prev.filter((row) => row.id !== editingSpeciesId));
    resetSpeciesForm();
    alert('Species deleted.');
  };

  const handleDeleteCareer = async () => {
    if (!editingCareerId) return;
    if (!confirm('Delete this career?')) return;

    const { error } = await supabase
      .from('SW_career')
      .delete()
      .eq('id', editingCareerId);

    if (error) {
      console.error('Failed to delete career:', error);
      alert('Failed to delete career. It may still be referenced by specializations.');
      return;
    }

    setExistingCareers((prev) => prev.filter((row) => row.id !== editingCareerId));
    resetCareerForm();
    alert('Career deleted.');
  };

  const handleDeleteSpecialization = async () => {
    if (!editingSpecId) return;
    if (!confirm('Delete this specialization and its tree?')) return;

    const { error: treeError } = await supabase
      .from('SW_spec_tree')
      .delete()
      .eq('spec_ID', editingSpecId);

    if (treeError) {
      console.error('Failed to delete specialization tree:', treeError);
      alert('Failed to delete specialization tree.');
      return;
    }

    const { error } = await supabase
      .from('SW_spec')
      .delete()
      .eq('id', editingSpecId);

    if (error) {
      console.error('Failed to delete specialization:', error);
      alert('Failed to delete specialization.');
      return;
    }

    setExistingSpecs((prev) => prev.filter((row) => row.id !== editingSpecId));
    resetSpecializationForm();
    alert('Specialization deleted.');
  };

  const handleDeleteForceTree = async () => {
    if (!selectedForceTreeId || selectedForceTreeId === '__new__') return;
    if (!confirm('Delete this force tree?')) return;

    const { error } = await supabase
      .from('SW_force_power_tree')
      .delete()
      .eq('id', selectedForceTreeId);

    if (error) {
      console.error('Failed to delete force tree:', error);
      alert('Failed to delete force tree.');
      return;
    }

    setExistingForceTrees((prev) => prev.filter((row) => String(row.id) !== String(selectedForceTreeId)));
    resetForceTreeForm();
    alert('Force tree deleted.');
  };

  const handleDeleteEquipment = async () => {
    if (!selectedSwEquipmentId || selectedSwEquipmentId === '__new__') return;
    if (!confirm('Delete this equipment item?')) return;

    const { error } = await supabase
      .from('SW_equipment')
      .delete()
      .eq('id', selectedSwEquipmentId);

    if (error) {
      console.error('Failed to delete equipment:', error);
      alert('Failed to delete equipment.');
      return;
    }

    setExistingSwEquipment((prev) => prev.filter((row) => String(row.id) !== String(selectedSwEquipmentId)));
    resetEquipmentForm();
    alert('Equipment deleted.');
  };

  const handleDeleteShip = async () => {
    if (!selectedSwShipId || selectedSwShipId === '__new__') return;
    if (!confirm('Delete this ship?')) return;

    const { error } = await supabase
      .from('SW_ships')
      .delete()
      .eq('id', selectedSwShipId);

    if (error) {
      console.error('Failed to delete ship:', error);
      alert('Failed to delete ship.');
      return;
    }

    setExistingSwShips((prev) => prev.filter((row) => String(row.id) !== String(selectedSwShipId)));
    resetShipForm();
    alert('Ship deleted.');
  };

  const handleSaveSpecialization = async ({ forceCreateSpec = false, updateSpec = false, abilityMode: abilityModeOverride = null, specIdOverride = null } = {}) => {
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
            await supabase
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

      // 3) Build spec tree payload
      const rows = [5, 10, 15, 20, 25];
      const treePayload = {}; // spec_ID added on insert
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
          if (specTalentLinks[`${r}_${c - 1}_right`]) links.push('Right');
          if (specTalentLinks[`${r}_${c - 1}_down`]) links.push('Down');
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
          const linkKeyBase = `${r}_${c - 1}`;
          if (links.includes('Right')) newLinks[`${linkKeyBase}_right`] = true;
          if (links.includes('Down')) newLinks[`${linkKeyBase}_down`] = true;
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
      const { error } = await supabase
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

                        {showAddFeatureForm && (
                          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 py-10">
                            <div className="w-full max-w-lg bg-white border border-gray-300 rounded-lg shadow-xl p-4">
                              <h5 className="text-sm font-semibold text-gray-800 mb-3">Add Feature</h5>
                              <div className="grid grid-cols-1 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Feature Name</label>
                                  <input
                                    type="text"
                                    value={newFeatureName}
                                    onChange={(e) => setNewFeatureName(e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Feature Text</label>
                                  <textarea
                                    value={newFeatureText}
                                    onChange={(e) => setNewFeatureText(e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                    rows={4}
                                  />
                                </div>
                              </div>
                              <div className="mt-4 flex gap-2">
                                <button
                                  type="button"
                                  onClick={handleSaveDndFeature}
                                  disabled={savingDndFeature}
                                  className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-60"
                                >
                                  {savingDndFeature ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowAddFeatureForm(false);
                                    setNewFeatureName('');
                                    setNewFeatureText('');
                                    setFeatureTargetLevelIndex(null);
                                  }}
                                  className="px-3 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

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
            <button
              onClick={handleDndStats}
              className="flex-1 px-6 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition font-medium"
            >
              DND Stats
            </button>
            <button
              onClick={() => navigate('/settings/www-admin')}
              className="flex-1 px-6 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 transition font-medium"
            >
              WWW Admin
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

          {showDndSection && (
            <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
              <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1">
                <button
                  onClick={handleShowDndRacePictures}
                  className={`flex-none whitespace-nowrap px-4 py-2 rounded transition font-medium ${showDndRacePictures ? 'bg-teal-700 text-white' : 'bg-teal-600 text-white hover:bg-teal-700'}`}
                >
                  Race Pictures
                </button>
                <button
                  onClick={handleShowDndClassPictures}
                  className={`flex-none whitespace-nowrap px-4 py-2 rounded transition font-medium ${showDndClassPictures ? 'bg-orange-700 text-white' : 'bg-orange-600 text-white hover:bg-orange-700'}`}
                >
                  Class Pictures
                </button>
              </div>

              <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1">
                <button
                  onClick={handleAddDndClass}
                  className="flex-none whitespace-nowrap px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition font-medium"
                >
                  DND Classes
                </button>
                <button
                  onClick={handleAddDndSubclass}
                  className="flex-none whitespace-nowrap px-4 py-2 bg-fuchsia-600 text-white rounded hover:bg-fuchsia-700 transition font-medium"
                >
                  DND Subclasses
                </button>
                <button
                  onClick={handleAddDndRace}
                  className="flex-none whitespace-nowrap px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition font-medium"
                >
                  DND Races
                </button>
                <button
                  onClick={handleAddDndSubRace}
                  className="flex-none whitespace-nowrap px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700 transition font-medium"
                >
                  DND Sub Races
                </button>
                <button
                  onClick={handleAddDndPicture}
                  className="flex-none whitespace-nowrap px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition font-medium"
                >
                  DND Pictures
                </button>
                <button
                  onClick={handleAddDndBackground}
                  className="flex-none whitespace-nowrap px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
                >
                  DND Backgrounds
                </button>
                <button
                  onClick={handleAddDndEquipment}
                  className="flex-none whitespace-nowrap px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 transition font-medium"
                >
                  DND Equipment
                </button>
                <button
                  onClick={handleAddDndSpell}
                  className="flex-none whitespace-nowrap px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition font-medium"
                >
                  DND Spells
                </button>
              </div>

              {showDndRacePictures && (
                <div className="p-6 bg-gray-100 rounded-lg border border-gray-300">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">DND Race Pictures</h3>

                  {existingDndRaces.length === 0 ? (
                    <p className="text-gray-600">No DND races found.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border border-gray-300 text-sm">
                        <thead className="bg-gray-200">
                          <tr>
                            <th className="border border-gray-300 px-3 py-2 text-left">Race</th>
                            <th className="border border-gray-300 px-3 py-2 text-left">Pictures</th>
                          </tr>
                        </thead>
                        <tbody>
                          {buildGroupedDndRows(existingDndRaces, 'RaceName').map((group) => (
                            <Fragment key={`dnd-race-picture-group-${group.label}`}>
                              <tr className="bg-slate-200">
                                <td colSpan={2} className="border border-gray-300 px-3 py-2 text-sm font-bold text-slate-900">
                                  {group.label}
                                </td>
                              </tr>
                              {group.items.map((race) => {
                                const racePictures = existingDndPictures.filter((row) => Number(row.Race) === Number(race.id));
                                const availableClasses = getAvailableDndClassesForRace(race.id);
                                const selectedClassIdCandidate = String(selectedDndClassPerRacePicture[race.id] || '');
                                const selectedClassId = availableClasses.some((row) => String(row.id) === selectedClassIdCandidate)
                                  ? selectedClassIdCandidate
                                  : String(availableClasses[0]?.id || '');

                                return (
                                  <tr key={`dnd-race-picture-row-${race.id}`} className="bg-white align-top">
                                    <td className="border border-gray-300 px-3 py-2 min-w-[220px]">
                                      <p className="text-base font-semibold text-gray-800">{race.RaceName}</p>
                                    </td>
                                    <td className="border border-gray-300 px-3 py-2">
                                      <div className="flex flex-wrap gap-3">
                                        {racePictures.length > 0 ? (
                                          racePictures.map((row) => (
                                            <div key={`dnd-race-picture-${race.id}-${row.id}`} className="flex flex-col items-center border border-gray-300 rounded p-2 bg-white shadow-sm min-w-[100px] w-[100px]">
                                              <img
                                                src={`/F_Pictures/Picture ${row.PictureID} Face.png`}
                                                alt={`Picture ${row.PictureID} Face`}
                                                className="w-[100px] h-[100px] object-cover rounded"
                                                onError={(e) => {
                                                  e.currentTarget.style.display = 'none';
                                                }}
                                              />
                                              <p className="mt-1 text-xs font-medium text-gray-700 text-center break-words max-w-full">
                                                {getDndClassNameById(row.Class) || `Class ${row.Class}`}
                                              </p>
                                            </div>
                                          ))
                                        ) : (
                                          <span className="text-gray-500 text-sm">No pictures yet.</span>
                                        )}
                                      </div>

                                      {availableClasses.length > 0 ? (
                                        <div className="mt-4 border border-blue-400 rounded p-4 bg-blue-50">
                                          <label className="block text-sm font-semibold text-gray-800 mb-2">Generate Prompt for Missing Class:</label>
                                          <select
                                            value={selectedClassId}
                                            onChange={(e) => {
                                              const value = e.target.value;
                                              setSelectedDndClassPerRacePicture((prev) => ({ ...prev, [race.id]: value }));
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                          >
                                            {availableClasses.map((row) => (
                                              <option key={`dnd-race-missing-class-${race.id}-${row.id}`} value={row.id}>{row.ClassName}</option>
                                            ))}
                                          </select>

                                          <div className="mt-3 flex flex-wrap gap-2">
                                            <button
                                              onClick={() => {
                                                const randomClass = availableClasses[Math.floor(Math.random() * availableClasses.length)];
                                                setSelectedDndClassPerRacePicture((prev) => ({ ...prev, [race.id]: String(randomClass.id) }));
                                              }}
                                              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition font-medium"
                                            >
                                              Random
                                            </button>
                                            <button
                                              onClick={() => handleGenerateDndPromptForRace(race, selectedClassId)}
                                              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
                                            >
                                              Generate Prompt
                                            </button>
                                            <button
                                              onClick={() => handleCreateDndPictureForRace(race, selectedClassId)}
                                              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-medium"
                                            >
                                              Create Picture
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <p className="mt-4 text-xs text-gray-600">All matching classes already have a picture mapping for this race.</p>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {showDndClassPictures && (
                <div className="p-6 bg-gray-100 rounded-lg border border-gray-300">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">DND Class Pictures</h3>

                  {existingDndClasses.length === 0 ? (
                    <p className="text-gray-600">No DND classes found.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border border-gray-300 text-sm">
                        <thead className="bg-gray-200">
                          <tr>
                            <th className="border border-gray-300 px-3 py-2 text-left">Class</th>
                            <th className="border border-gray-300 px-3 py-2 text-left">Pictures</th>
                          </tr>
                        </thead>
                        <tbody>
                          {buildGroupedDndRows(existingDndClasses, 'ClassName').map((group) => (
                            <Fragment key={`dnd-class-picture-group-${group.label}`}>
                              <tr className="bg-slate-200">
                                <td colSpan={2} className="border border-gray-300 px-3 py-2 text-sm font-bold text-slate-900">
                                  {group.label}
                                </td>
                              </tr>
                              {group.items.map((classRow) => {
                                const classPictures = existingDndPictures.filter((row) => Number(row.Class) === Number(classRow.id));
                                const availableRaces = getAvailableDndRacesForClass(classRow.id);
                                const selectedRaceIdCandidate = String(selectedDndRacePerClassPicture[classRow.id] || '');
                                const selectedRaceId = availableRaces.some((row) => String(row.id) === selectedRaceIdCandidate)
                                  ? selectedRaceIdCandidate
                                  : String(availableRaces[0]?.id || '');

                                return (
                                  <tr key={`dnd-class-picture-row-${classRow.id}`} className="bg-white align-top">
                                    <td className="border border-gray-300 px-3 py-2 min-w-[220px]">
                                      <p className="text-base font-semibold text-gray-800">{classRow.ClassName}</p>
                                    </td>
                                    <td className="border border-gray-300 px-3 py-2">
                                      <div className="flex flex-wrap gap-3">
                                        {classPictures.length > 0 ? (
                                          classPictures.map((row) => (
                                            <div key={`dnd-class-picture-${classRow.id}-${row.id}`} className="flex flex-col items-center border border-gray-300 rounded p-2 bg-white shadow-sm min-w-[100px] w-[100px]">
                                              <img
                                                src={`/F_Pictures/Picture ${row.PictureID} Face.png`}
                                                alt={`Picture ${row.PictureID} Face`}
                                                className="w-[100px] h-[100px] object-cover rounded"
                                                onError={(e) => {
                                                  e.currentTarget.style.display = 'none';
                                                }}
                                              />
                                              <p className="mt-1 text-xs font-medium text-gray-700 text-center break-words max-w-full">
                                                {getDndRaceNameById(row.Race) || `Race ${row.Race}`}
                                              </p>
                                            </div>
                                          ))
                                        ) : (
                                          <span className="text-gray-500 text-sm">No pictures yet.</span>
                                        )}
                                      </div>

                                      {availableRaces.length > 0 ? (
                                        <div className="mt-4 border border-blue-400 rounded p-4 bg-blue-50">
                                          <label className="block text-sm font-semibold text-gray-800 mb-2">Generate Prompt for Missing Race:</label>
                                          <select
                                            value={selectedRaceId}
                                            onChange={(e) => {
                                              const value = e.target.value;
                                              setSelectedDndRacePerClassPicture((prev) => ({ ...prev, [classRow.id]: value }));
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                          >
                                            {availableRaces.map((row) => (
                                              <option key={`dnd-class-missing-race-${classRow.id}-${row.id}`} value={row.id}>{row.RaceName}</option>
                                            ))}
                                          </select>

                                          <div className="mt-3 flex flex-wrap gap-2">
                                            <button
                                              onClick={() => {
                                                const randomRace = availableRaces[Math.floor(Math.random() * availableRaces.length)];
                                                setSelectedDndRacePerClassPicture((prev) => ({ ...prev, [classRow.id]: String(randomRace.id) }));
                                              }}
                                              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition font-medium"
                                            >
                                              Random
                                            </button>
                                            <button
                                              onClick={() => handleGenerateDndPromptForClass(classRow, selectedRaceId)}
                                              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
                                            >
                                              Generate Prompt
                                            </button>
                                            <button
                                              onClick={() => handleCreateDndPictureForClass(classRow, selectedRaceId)}
                                              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-medium"
                                            >
                                              Create Picture
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <p className="mt-4 text-xs text-gray-600">All matching races already have a picture mapping for this class.</p>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {showAddDndClassForm && (
                <div className="p-6 bg-gray-100 rounded-lg border border-gray-300">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">Add DND Class</h3>

                  <div className="flex flex-row gap-6 items-start overflow-x-auto">
                    <div className="flex-1 min-w-[360px]">
                      <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-300">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Class Name</label>
                        <select
                          value={selectedDndClassId}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '__new__') {
                              resetDndClassForm();
                              setSelectedDndClassId('__new__');
                            } else {
                              setSelectedDndClassId(val);
                              loadDndClassData(parseInt(val));
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        >
                          <option value="__new__">-- Create New Class --</option>
                          {buildGroupedDndRows(existingDndClasses, 'ClassName').map((group) => (
                            <optgroup key={`dnd-class-group-${group.label}`} label={group.label}>
                              {group.items.map((cls) => (
                                <option key={`dnd-class-${group.label}-${cls.id}`} value={cls.id}>
                                  {cls.ClassName}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>

                      <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-300">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select TTRPGs</label>
                        <select
                          multiple
                          value={selectedDndTTRPGs.map(String)}
                          onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions, (option) => parseInt(option.value));
                            setSelectedDndTTRPGs(selected);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                          size={Math.min(availableDndTTRPGs.length || 3, 6)}
                        >
                          {availableDndTTRPGs.length > 0 ? (
                            availableDndTTRPGs.map((ttrpg) => (
                              <option key={ttrpg.id} value={ttrpg.id}>
                                {ttrpg.TTRPG_name}
                              </option>
                            ))
                          ) : null}
                        </select>
                        {availableDndTTRPGs.length === 0 && (
                          <p className="text-sm text-gray-500 italic mt-2">No DND-enabled TTRPGs available</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
                          <input
                            type="text"
                            value={dndClassName}
                            onChange={(e) => setDndClassName(e.target.value)}
                            placeholder="Enter class name"
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Hit Dice</label>
                          <input
                            type="text"
                            value={dndHitDice}
                            onChange={(e) => setDndHitDice(e.target.value)}
                            placeholder="e.g., d8, d10, d12"
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <textarea
                            value={dndClassDescription}
                            onChange={(e) => setDndClassDescription(e.target.value)}
                            placeholder="Enter class description"
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                            rows={3}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Proficiency in Armor</label>
                          <textarea
                            value={dndProfArmour}
                            onChange={(e) => setDndProfArmour(e.target.value)}
                            placeholder="Enter armor proficiencies"
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                            rows={2}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Proficiency in Weapons</label>
                          <textarea
                            value={dndProfWeapons}
                            onChange={(e) => setDndProfWeapons(e.target.value)}
                            placeholder="Enter weapon proficiencies"
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                            rows={2}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Proficiency in Saving Throws</label>
                          <select
                            multiple
                            value={dndProfSavingThrows.split(',').filter(s => s.trim())}
                            onChange={(e) => {
                              const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                              setDndProfSavingThrows(selected.join(','));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                            size={6}
                          >
                            <option value="Strength">Strength</option>
                            <option value="Dexterity">Dexterity</option>
                            <option value="Constitution">Constitution</option>
                            <option value="Intelligence">Intelligence</option>
                            <option value="Wisdom">Wisdom</option>
                            <option value="Charisma">Charisma</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Proficiency in Skills</label>
                          <textarea
                            value={dndProfSkills}
                            onChange={(e) => setDndProfSkills(e.target.value)}
                            placeholder="Enter skill proficiencies"
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                            rows={2}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Points Name</label>
                          <input
                            type="text"
                            value={dndPointsName}
                            onChange={(e) => setDndPointsName(e.target.value)}
                            placeholder="Enter points name"
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Attire</label>
                            <textarea
                              value={dndAttire}
                              onChange={(e) => setDndAttire(e.target.value)}
                              placeholder="Enter class attire"
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                              rows={2}
                            />
                          </div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Extra Level Columns</label>
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <input
                              type="text"
                              value={dndExtraLevelFieldInput}
                              onChange={(e) => setDndExtraLevelFieldInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addDndExtraFieldNamesFromInput();
                                }
                              }}
                              placeholder="Type one or more names (comma/new line), then Add"
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                            />
                            <button
                              type="button"
                              onClick={addDndExtraFieldNamesFromInput}
                              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition font-medium whitespace-nowrap"
                            >
                              Add Columns
                            </button>
                          </div>
                          {dndExtraLevelFields.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {dndExtraLevelFields.map((fieldName) => (
                                <span
                                  key={`extra-column-chip-${fieldName}`}
                                  className="inline-flex items-center gap-1 rounded bg-indigo-100 px-2 py-1 text-xs text-indigo-900"
                                >
                                  {fieldName}
                                  <button
                                    type="button"
                                    onClick={() => removeDndExtraFieldName(fieldName)}
                                    className="text-indigo-700 hover:text-indigo-900"
                                    aria-label={`Remove ${fieldName}`}
                                  >
                                    x
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="mt-1 text-xs text-gray-600">Add as many as needed. They appear in the level table and character creator for this class.</p>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-3">
                        <button
                          onClick={handleSaveDndClass}
                          disabled={savingDndClass}
                          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-bold disabled:opacity-60"
                        >
                          {savingDndClass ? 'Saving...' : 'Save'}
                        </button>
                        {selectedDndClassId !== '__new__' && (
                          <button
                            onClick={handleDeleteDndClass}
                            className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition font-bold"
                          >
                            Delete
                          </button>
                        )}
                        <button
                          onClick={() => {
                            resetDndClassForm();
                            setShowAddDndClassForm(false);
                          }}
                          className="px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition font-bold"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>

                    <div className="w-full min-w-[360px] lg:w-1/2">
                      <div className="p-3 bg-gray-50 rounded border border-gray-300">
                        <h4 className="text-lg font-semibold text-gray-800 mb-3">Class Levels</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-xs text-gray-800 border border-gray-300">
                            <thead className="bg-gray-200">
                              <tr>
                                <th className="border border-gray-300 px-2 py-1 text-left">Level</th>
                                <th className="border border-gray-300 px-2 py-1 text-left">Proficiency Bonus</th>
                                <th className="border border-gray-300 px-2 py-1 text-left">Features</th>
                                <th className="border border-gray-300 px-2 py-1 text-left">Cantrips</th>
                                <th className="border border-gray-300 px-2 py-1 text-left">Spells</th>
                                {dndPointsName.trim() && (
                                  <th className="border border-gray-300 px-2 py-1 text-left">{dndPointsName} Points</th>
                                )}
                                {dndExtraLevelFields.map((fieldName) => (
                                  <th key={`dnd-level-extra-header-${fieldName}`} className="border border-gray-300 px-2 py-1 text-left">{fieldName}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {dndClassLevels.map((row, index) => (
                                <Fragment key={`level-${index + 1}`}>
                                  <tr className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="border border-gray-300 px-2 py-1">{index + 1}</td>
                                    <td className="border border-gray-300 px-2 py-1">
                                      <input
                                        type="text"
                                        value={row.proficiencyBonus}
                                        onChange={(e) => updateDndClassLevel(index, 'proficiencyBonus', e.target.value)}
                                        className="w-full bg-transparent outline-none"
                                      />
                                    </td>
                                    <td className="border border-gray-300 px-2 py-1 align-top">
                                      <div className="flex flex-col gap-2">
                                        <div className="flex items-start gap-2">
                                          <button
                                            type="button"
                                            onClick={() => setActiveFeaturePickerIndex(index)}
                                            className="px-2 py-0.5 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                          >
                                            +
                                          </button>
                                          <div className="flex flex-wrap gap-1">
                                            {row.features.length === 0 && (
                                              <span className="text-gray-400 text-xs">No features</span>
                                            )}
                                            {row.features.map((feature) => (
                                              <span key={`${feature}-${index}`} className="inline-flex items-center gap-1 bg-gray-200 text-gray-800 px-2 py-0.5 rounded text-xs">
                                                {feature}
                                                <button
                                                  type="button"
                                                  onClick={() => removeFeatureFromLevel(index, feature)}
                                                  className="text-gray-600 hover:text-gray-900"
                                                >
                                                  x
                                                </button>
                                              </span>
                                            ))}
                                          </div>
                                        </div>

                                        {activeFeaturePickerIndex === index && (
                                          <select
                                            value=""
                                            onChange={(e) => {
                                              const value = e.target.value;
                                              if (!value) return;
                                              if (value === '__add__') {
                                                setShowAddFeatureForm(true);
                                                setFeatureTargetLevelIndex(index);
                                                setActiveFeaturePickerIndex(null);
                                                return;
                                              }
                                              addFeatureToLevel(index, value);
                                              setActiveFeaturePickerIndex(null);
                                            }}
                                            className="w-full rounded border-gray-300 text-xs"
                                          >
                                            <option value="">Select feature</option>
                                            <option value="__add__">Add Feature</option>
                                            {loadingDndClassFeatures && (
                                              <option disabled>Loading...</option>
                                            )}
                                            {!loadingDndClassFeatures && dndClassFeatures.map((feature) => (
                                              <option key={feature.id} value={feature.FeatureName}>
                                                {feature.FeatureName}
                                              </option>
                                            ))}
                                          </select>
                                        )}
                                      </div>
                                    </td>
                                    <td className="border border-gray-300 px-2 py-1">
                                      <input
                                        type="text"
                                        value={row.cantrips}
                                        onChange={(e) => updateDndClassLevel(index, 'cantrips', e.target.value)}
                                        className="w-full bg-transparent outline-none"
                                      />
                                    </td>
                                    <td className="border border-gray-300 px-2 py-1">
                                      <input
                                        type="text"
                                        value={row.spells}
                                        onChange={(e) => updateDndClassLevel(index, 'spells', e.target.value)}
                                        className="w-full bg-transparent outline-none"
                                      />
                                    </td>
                                    {dndPointsName.trim() && (
                                      <td className="border border-gray-300 px-2 py-1">
                                        <input
                                          type="text"
                                          value={row.points}
                                          onChange={(e) => updateDndClassLevel(index, 'points', e.target.value)}
                                          className="w-full bg-transparent outline-none"
                                        />
                                      </td>
                                    )}
                                    {dndExtraLevelFields.map((fieldName) => (
                                      <td key={`dnd-level-extra-${index + 1}-${fieldName}`} className="border border-gray-300 px-2 py-1">
                                        <input
                                          type="text"
                                          value={row.extraValues?.[fieldName] || ''}
                                          onChange={(e) => updateDndClassLevelExtra(index, fieldName, e.target.value)}
                                          className="w-full bg-transparent outline-none"
                                        />
                                      </td>
                                    ))}
                                  </tr>
                                  {showAddFeatureForm && featureTargetLevelIndex === index && (
                                    <tr className="bg-white">
                                      <td
                                        colSpan={5 + (dndPointsName.trim() ? 1 : 0) + dndExtraLevelFields.length}
                                        className="border border-gray-300 px-2 py-2"
                                      >
                                        <div className="p-3 bg-white border border-gray-300 rounded">
                                          <h5 className="text-sm font-semibold text-gray-800 mb-2">Add Feature</h5>
                                          <div className="grid grid-cols-1 gap-2">
                                            <div>
                                              <label className="block text-xs font-medium text-gray-700 mb-1">Feature Name</label>
                                              <input
                                                type="text"
                                                value={newFeatureName}
                                                onChange={(e) => setNewFeatureName(e.target.value)}
                                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-xs font-medium text-gray-700 mb-1">Feature Text</label>
                                              <textarea
                                                value={newFeatureText}
                                                onChange={(e) => setNewFeatureText(e.target.value)}
                                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                                rows={3}
                                              />
                                            </div>
                                          </div>
                                          <div className="mt-3 flex gap-2">
                                            <button
                                              type="button"
                                              onClick={handleSaveDndFeature}
                                              disabled={savingDndFeature}
                                              className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-60"
                                            >
                                              {savingDndFeature ? 'Saving...' : 'Save'}
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setShowAddFeatureForm(false);
                                                setNewFeatureName('');
                                                setNewFeatureText('');
                                                setFeatureTargetLevelIndex(null);
                                              }}
                                              className="px-3 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </Fragment>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {showAddDndSubclassForm && (
                <div className="p-6 bg-gray-100 rounded-lg border border-gray-300">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">Add DND Subclass</h3>

                  <div className="flex flex-row gap-6 items-start overflow-x-auto">
                    <div className="flex-1 min-w-[360px]">
                      <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-300">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Subclass Name</label>
                        <select
                          value={selectedDndSubclassId}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '__new__') {
                              resetDndSubclassForm();
                              setSelectedDndSubclassId('__new__');
                            } else {
                              setSelectedDndSubclassId(val);
                              loadDndSubclassData(parseInt(val, 10));
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        >
                          <option value="__new__">-- Create New Subclass --</option>
                          {buildGroupedDndRows(existingDndSubclasses, 'SubclassName').map((group) => (
                            <optgroup key={`dnd-subclass-group-${group.label}`} label={group.label}>
                              {group.items.map((subclass) => (
                                <option key={`dnd-subclass-${group.label}-${subclass.id}`} value={subclass.id}>
                                  {subclass.SubclassName}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Subclass Name</label>
                          <input
                            type="text"
                            value={dndSubclassName}
                            onChange={(e) => setDndSubclassName(e.target.value)}
                            placeholder="Enter subclass name"
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Parent Class</label>
                          <select
                            value={dndSubclassClassId}
                            onChange={(e) => setDndSubclassClassId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                          >
                            <option value="">-- Select Parent Class --</option>
                            {buildGroupedDndRows(existingDndClasses, 'ClassName').map((group) => (
                              <optgroup key={`dnd-parent-class-group-${group.label}`} label={group.label}>
                                {group.items.map((cls) => (
                                  <option key={`dnd-parent-class-${group.label}-${cls.id}`} value={cls.id}>
                                    {cls.ClassName}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <textarea
                            value={dndSubclassDescription}
                            onChange={(e) => setDndSubclassDescription(e.target.value)}
                            placeholder="Enter subclass description"
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                            rows={3}
                          />
                        </div>

                      </div>

                      <div className="mt-4 flex gap-3">
                        <button
                          onClick={handleSaveDndSubclass}
                          disabled={savingDndSubclass}
                          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-bold disabled:opacity-60"
                        >
                          {savingDndSubclass ? 'Saving...' : 'Save'}
                        </button>
                        {selectedDndSubclassId !== '__new__' && (
                          <button
                            onClick={handleDeleteDndSubclass}
                            className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition font-bold"
                          >
                            Delete
                          </button>
                        )}
                        <button
                          onClick={() => {
                            resetDndSubclassForm();
                            setShowAddDndSubclassForm(false);
                          }}
                          className="px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition font-bold"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>

                    <div className="w-full min-w-[360px] lg:w-1/2">
                      <div className="p-3 bg-gray-50 rounded border border-gray-300">
                        <h4 className="text-lg font-semibold text-gray-800 mb-3">Subclass Levels</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-xs text-gray-800 border border-gray-300">
                            <thead className="bg-gray-200">
                              <tr>
                                <th className="border border-gray-300 px-2 py-1 text-left">Level</th>
                                <th className="border border-gray-300 px-2 py-1 text-left">Features</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dndSubclassLevels.map((row, index) => (
                                <Fragment key={`subclass-level-${index + 1}`}>
                                  <tr className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="border border-gray-300 px-2 py-1">{index + 1}</td>
                                    <td className="border border-gray-300 px-2 py-1 align-top">
                                      <div className="flex flex-col gap-2">
                                        <div className="flex items-start gap-2">
                                          <button
                                            type="button"
                                            onClick={() => setActiveSubclassFeaturePickerIndex(index)}
                                            className="px-2 py-0.5 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                          >
                                            +
                                          </button>
                                          <div className="flex flex-wrap gap-1">
                                            {row.features.length === 0 && (
                                              <span className="text-gray-400 text-xs">No features</span>
                                            )}
                                            {row.features.map((feature) => (
                                              <span key={`${feature}-subclass-${index}`} className="inline-flex items-center gap-1 bg-gray-200 text-gray-800 px-2 py-0.5 rounded text-xs">
                                                {feature}
                                                <button
                                                  type="button"
                                                  onClick={() => removeFeatureFromSubclassLevel(index, feature)}
                                                  className="text-gray-600 hover:text-gray-900"
                                                >
                                                  x
                                                </button>
                                              </span>
                                            ))}
                                          </div>
                                        </div>

                                        {activeSubclassFeaturePickerIndex === index && (
                                          <select
                                            value=""
                                            onChange={(e) => {
                                              const value = e.target.value;
                                              if (!value) return;
                                              if (value === '__add__') {
                                                setShowAddSubclassFeatureForm(true);
                                                setSubclassFeatureTargetLevelIndex(index);
                                                setActiveSubclassFeaturePickerIndex(null);
                                                return;
                                              }
                                              addFeatureToSubclassLevel(index, value);
                                              setActiveSubclassFeaturePickerIndex(null);
                                            }}
                                            className="w-full rounded border-gray-300 text-xs"
                                          >
                                            <option value="">Select feature</option>
                                            <option value="__add__">Add Feature</option>
                                            {loadingDndClassFeatures && (
                                              <option disabled>Loading...</option>
                                            )}
                                            {!loadingDndClassFeatures && dndClassFeatures.map((feature) => (
                                              <option key={`subclass-feature-option-${feature.id}`} value={feature.FeatureName}>
                                                {feature.FeatureName}
                                              </option>
                                            ))}
                                          </select>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                  {showAddSubclassFeatureForm && subclassFeatureTargetLevelIndex === index && (
                                    <tr className="bg-white">
                                      <td
                                        colSpan={2}
                                        className="border border-gray-300 px-2 py-2"
                                      >
                                        <div className="p-3 bg-white border border-gray-300 rounded">
                                          <h5 className="text-sm font-semibold text-gray-800 mb-2">Add Feature</h5>
                                          <div className="grid grid-cols-1 gap-2">
                                            <div>
                                              <label className="block text-xs font-medium text-gray-700 mb-1">Feature Name</label>
                                              <input
                                                type="text"
                                                value={newSubclassFeatureName}
                                                onChange={(e) => setNewSubclassFeatureName(e.target.value)}
                                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                              />
                                            </div>
                                            <div>
                                              <label className="block text-xs font-medium text-gray-700 mb-1">Feature Text</label>
                                              <textarea
                                                value={newSubclassFeatureText}
                                                onChange={(e) => setNewSubclassFeatureText(e.target.value)}
                                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                                rows={3}
                                              />
                                            </div>
                                          </div>
                                          <div className="mt-3 flex gap-2">
                                            <button
                                              type="button"
                                              onClick={handleSaveDndSubclassFeature}
                                              disabled={savingDndSubclassFeature}
                                              className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-60"
                                            >
                                              {savingDndSubclassFeature ? 'Saving...' : 'Save'}
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setShowAddSubclassFeatureForm(false);
                                                setNewSubclassFeatureName('');
                                                setNewSubclassFeatureText('');
                                                setSubclassFeatureTargetLevelIndex(null);
                                              }}
                                              className="px-3 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500"
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </Fragment>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {showAddDndSubRaceForm && (
                <div className="p-6 bg-gray-100 rounded-lg border border-gray-300">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">Add DND Sub Race</h3>

                  <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-300">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sub Race</label>
                    <select
                      value={selectedDndSubRaceId}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '__new__') {
                          resetDndSubRaceForm();
                          setSelectedDndSubRaceId('__new__');
                        } else {
                          setSelectedDndSubRaceId(value);
                          loadDndSubRaceData(parseInt(value, 10));
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    >
                      <option value="__new__">-- Create New Sub Race --</option>
                      {buildGroupedDndRows(existingDndSubRaces, 'SubRaceName').map((group) => (
                        <optgroup key={`dnd-sub-race-group-${group.label}`} label={group.label}>
                          {group.items.map((row) => (
                            <option key={`dnd-sub-race-${group.label}-${row.id}`} value={row.id}>{row.SubRaceName}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sub Race Name</label>
                      <input
                        type="text"
                        value={dndSubRaceName}
                        onChange={(e) => setDndSubRaceName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Associated Race</label>
                      <select
                        value={dndSubRaceRaceId}
                        onChange={(e) => setDndSubRaceRaceId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Select Race --</option>
                        {buildGroupedDndRows(existingDndRaces, 'RaceName').map((group) => (
                          <optgroup key={`dnd-sub-race-parent-${group.label}`} label={group.label}>
                            {group.items.map((row) => (
                              <option key={`dnd-sub-race-parent-opt-${group.label}-${row.id}`} value={row.id}>{row.RaceName}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={dndSubRaceDescription}
                        onChange={(e) => setDndSubRaceDescription(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Traits</label>
                      <select
                        value={dndSubRaceTraitPickerValue}
                        onChange={(e) => {
                          const value = e.target.value;
                          setDndSubRaceTraitPickerValue(value);
                          if (!value) return;
                          if (value === '__add__') {
                            setShowAddDndSubRaceTraitForm(true);
                            return;
                          }
                          addDndSubRaceTrait(value);
                          setDndSubRaceTraitPickerValue('');
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Select Trait --</option>
                        <option value="__add__">Add New Trait</option>
                        {loadingDndClassFeatures && <option disabled>Loading traits...</option>}
                        {!loadingDndClassFeatures && dndClassFeatures.map((feature) => (
                          <option key={`dnd-sub-race-trait-${feature.id}`} value={feature.FeatureName}>{feature.FeatureName}</option>
                        ))}
                      </select>
                      {dndSubRaceSelectedTraits.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {dndSubRaceSelectedTraits.map((traitName) => (
                            <span
                              key={`dnd-sub-race-trait-chip-${traitName}`}
                              className="inline-flex items-center gap-1 rounded bg-violet-100 px-2 py-1 text-xs text-violet-900"
                            >
                              {traitName}
                              <button
                                type="button"
                                onClick={() => removeDndSubRaceTrait(traitName)}
                                className="text-violet-700 hover:text-violet-900"
                                aria-label={`Remove ${traitName}`}
                              >
                                x
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      {showAddDndSubRaceTraitForm && (
                        <div className="mt-2 p-3 bg-white border border-gray-300 rounded">
                          <div className="grid grid-cols-1 gap-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Trait Name</label>
                              <input
                                type="text"
                                value={newDndSubRaceTraitName}
                                onChange={(e) => setNewDndSubRaceTraitName(e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Trait Text</label>
                              <textarea
                                value={newDndSubRaceTraitText}
                                onChange={(e) => setNewDndSubRaceTraitText(e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                rows={3}
                              />
                            </div>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={handleSaveDndSubRaceTrait}
                              disabled={savingDndSubRaceTrait}
                              className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-60"
                            >
                              {savingDndSubRaceTrait ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddDndSubRaceTraitForm(false);
                                setNewDndSubRaceTraitName('');
                                setNewDndSubRaceTraitText('');
                                setDndSubRaceTraitPickerValue('');
                              }}
                              className="px-3 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2 p-3 bg-white border border-gray-300 rounded space-y-3">
                      <h4 className="text-sm font-semibold text-gray-800">Ability Score Bonus Rules</h4>

                      <div
                        className="grid grid-cols-2 gap-3"
                        style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}
                      >
                        <div className="rounded border border-gray-200 p-2 bg-gray-50 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <h5 className="text-xs font-semibold text-gray-800">Fixed Bonus Scores</h5>
                            <button
                              type="button"
                              onClick={addDndSubRaceFixedBonus}
                              className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                            >
                              Add Fixed
                            </button>
                          </div>

                          {dndSubRaceAbilityBonusRules.fixed.length === 0 && (
                            <p className="text-xs text-gray-600">No fixed bonuses yet.</p>
                          )}

                          <div className="space-y-2">
                            {dndSubRaceAbilityBonusRules.fixed.map((entry, index) => (
                              <div key={`dnd-sub-race-fixed-${index}`} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Stat</label>
                                  <select
                                    value={entry.stat}
                                    onChange={(e) => updateDndSubRaceFixedBonus(index, 'stat', e.target.value)}
                                    className="w-full sm:max-w-24 px-1.5 py-1 border border-gray-300 rounded text-xs"
                                  >
                                    {DND_ABILITY_STATS.map((stat) => (
                                      <option key={`sub-race-fixed-stat-${index}-${stat}`} value={stat}>{DND_ABILITY_STAT_LABELS[stat]}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Bonus</label>
                                  <input
                                    type="number"
                                    value={entry.amount}
                                    onChange={(e) => updateDndSubRaceFixedBonus(index, 'amount', e.target.value)}
                                    className="w-full sm:max-w-20 px-1.5 py-1 border border-gray-300 rounded text-xs"
                                  />
                                </div>
                                <div>
                                  <button
                                    type="button"
                                    onClick={() => removeDndSubRaceFixedBonus(index)}
                                    className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded border border-gray-200 p-2 bg-gray-50 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <h5 className="text-xs font-semibold text-gray-800">Choice Rules</h5>
                            <button
                              type="button"
                              onClick={addDndSubRaceChoiceBonus}
                              className="px-2 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700"
                            >
                              Add Choice
                            </button>
                          </div>

                          {dndSubRaceAbilityBonusRules.choices.length === 0 && (
                            <p className="text-xs text-gray-600">No choose-one style bonuses yet.</p>
                          )}

                          <div className="space-y-2">
                            {dndSubRaceAbilityBonusRules.choices.map((choice, choiceIndex) => (
                              <div key={choice.id || `sub-race-choice-${choiceIndex}`} className="rounded border border-gray-200 p-2 bg-white space-y-2">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Pick Count</label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={choice.count}
                                      onChange={(e) => updateDndSubRaceChoiceBonus(choiceIndex, 'count', e.target.value)}
                                      className="w-full sm:max-w-20 px-1.5 py-1 border border-gray-300 rounded text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Bonus Each</label>
                                    <input
                                      type="number"
                                      value={choice.amount}
                                      onChange={(e) => updateDndSubRaceChoiceBonus(choiceIndex, 'amount', e.target.value)}
                                      className="w-full sm:max-w-20 px-1.5 py-1 border border-gray-300 rounded text-xs"
                                    />
                                  </div>
                                  <div>
                                    <button
                                      type="button"
                                      onClick={() => removeDndSubRaceChoiceBonus(choiceIndex)}
                                      className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                                    >
                                      Remove Rule
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-xs font-medium text-gray-700 mb-1">Choose from:</p>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                    {DND_ABILITY_STATS.map((stat) => {
                                      const checked = (choice.options || []).includes(stat);
                                      return (
                                        <label key={`${choice.id || `sub-race-${choiceIndex}`}-${stat}`} className="inline-flex items-center gap-1 text-xs text-gray-800">
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => toggleDndSubRaceChoiceBonusOption(choiceIndex, stat)}
                                          />
                                          {DND_ABILITY_STAT_LABELS[stat]}
                                        </label>
                                      );
                                    })}
                                  </div>
                                  {choice.count > (choice.options || []).length && (
                                    <p className="mt-1 text-xs text-amber-700">
                                      This rule picks {choice.count}, but only {(choice.options || []).length} option{(choice.options || []).length === 1 ? '' : 's'} selected.
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={handleSaveDndSubRace}
                      disabled={savingDndSubRace}
                      className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-bold disabled:opacity-60"
                    >
                      {savingDndSubRace ? 'Saving...' : 'Save'}
                    </button>
                    {selectedDndSubRaceId !== '__new__' && (
                      <button
                        onClick={handleDeleteDndSubRace}
                        className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition font-bold"
                      >
                        Delete
                      </button>
                    )}
                    <button
                      onClick={() => {
                        resetDndSubRaceForm();
                        setShowAddDndSubRaceForm(false);
                      }}
                      className="px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {showAddDndPictureForm && (
                <div className="p-6 bg-gray-100 rounded-lg border border-gray-300">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">DND Picture Links</h3>

                  <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-300">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Picture Mapping</label>
                    <select
                      value={selectedDndPictureLinkId}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '__new__') {
                          resetDndPictureForm();
                          setSelectedDndPictureLinkId('__new__');
                        } else {
                          setSelectedDndPictureLinkId(value);
                          loadDndPictureData(parseInt(value, 10));
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    >
                      <option value="__new__">-- Create New Picture Mapping --</option>
                      {existingDndPictures.map((row) => (
                        <option key={`dnd-picture-map-${row.id}`} value={row.id}>
                          Picture {row.PictureID} - {getDndRaceNameById(row.Race) || `Race ${row.Race}`} / {getDndClassNameById(row.Class) || `Class ${row.Class}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Race</label>
                      <select
                        value={dndPictureRaceId}
                        onChange={(e) => setDndPictureRaceId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Select Race --</option>
                        {buildGroupedDndRows(existingDndRaces, 'RaceName').map((group) => (
                          <optgroup key={`dnd-picture-race-group-${group.label}`} label={group.label}>
                            {group.items.map((row) => (
                              <option key={`dnd-picture-race-${group.label}-${row.id}`} value={row.id}>{row.RaceName}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Class (Career)</label>
                      <select
                        value={dndPictureClassId}
                        onChange={(e) => setDndPictureClassId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Select Class --</option>
                        {buildGroupedDndRows(existingDndClasses, 'ClassName').map((group) => (
                          <optgroup key={`dnd-picture-class-group-${group.label}`} label={group.label}>
                            {group.items.map((row) => (
                              <option key={`dnd-picture-class-${group.label}-${row.id}`} value={row.id}>{row.ClassName}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Picture ID</label>
                      <input
                        type="number"
                        min="1"
                        value={dndPictureId}
                        onChange={(e) => setDndPictureId(e.target.value)}
                        placeholder="e.g. 1"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-600">Uses files like <code>public/F_Pictures/Picture N.png</code> and <code>Picture N Face.png</code>.</p>
                    </div>
                  </div>

                  {dndPictureId && parseNumberOrNull(dndPictureId) != null && parseNumberOrNull(dndPictureId) > 0 && (
                    <div className="mt-4 p-3 bg-white border border-gray-300 rounded">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Preview</p>
                      <img
                        src={`/F_Pictures/Picture ${parseNumberOrNull(dndPictureId)} Face.png`}
                        alt={`Picture ${parseNumberOrNull(dndPictureId)} Face`}
                        className="w-28 h-28 object-cover rounded border border-gray-300"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={handleSaveDndPicture}
                      disabled={savingDndPicture}
                      className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-bold disabled:opacity-60"
                    >
                      {savingDndPicture ? 'Saving...' : 'Save'}
                    </button>
                    {selectedDndPictureLinkId !== '__new__' && (
                      <button
                        onClick={handleDeleteDndPicture}
                        className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition font-bold"
                      >
                        Delete
                      </button>
                    )}
                    <button
                      onClick={() => {
                        resetDndPictureForm();
                        setShowAddDndPictureForm(false);
                      }}
                      className="px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition font-bold"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="mt-6 overflow-x-auto">
                    <table className="min-w-full border border-gray-300 text-sm">
                      <thead className="bg-gray-200">
                        <tr>
                          <th className="border border-gray-300 px-3 py-2 text-left">Picture ID</th>
                          <th className="border border-gray-300 px-3 py-2 text-left">Race</th>
                          <th className="border border-gray-300 px-3 py-2 text-left">Class</th>
                          <th className="border border-gray-300 px-3 py-2 text-left">Face Preview</th>
                        </tr>
                      </thead>
                      <tbody>
                        {existingDndPictures.length === 0 && (
                          <tr>
                            <td className="border border-gray-300 px-3 py-2 text-gray-500" colSpan={4}>No DND picture mappings yet.</td>
                          </tr>
                        )}
                        {existingDndPictures.map((row) => (
                          <tr key={`dnd-picture-row-${row.id}`} className="bg-white">
                            <td className="border border-gray-300 px-3 py-2">{row.PictureID}</td>
                            <td className="border border-gray-300 px-3 py-2">{getDndRaceNameById(row.Race) || `Race ${row.Race}`}</td>
                            <td className="border border-gray-300 px-3 py-2">{getDndClassNameById(row.Class) || `Class ${row.Class}`}</td>
                            <td className="border border-gray-300 px-3 py-2">
                              <img
                                src={`/F_Pictures/Picture ${row.PictureID} Face.png`}
                                alt={`Picture ${row.PictureID} Face`}
                                className="w-14 h-14 object-cover rounded border border-gray-300"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {showAddDndRaceForm && (
                <div className="p-6 bg-gray-100 rounded-lg border border-gray-300">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">Add DND Race</h3>

                  <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-300">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Race</label>
                    <select
                      value={selectedDndRaceId}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '__new__') {
                          resetDndRaceForm();
                          setSelectedDndRaceId('__new__');
                        } else {
                          setSelectedDndRaceId(value);
                          loadDndRaceData(parseInt(value, 10));
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    >
                      <option value="__new__">-- Create New Race --</option>
                      {buildGroupedDndRows(existingDndRaces, 'RaceName').map((group) => (
                        <optgroup key={`dnd-race-group-${group.label}`} label={group.label}>
                          {group.items.map((row) => (
                            <option key={`dnd-race-${group.label}-${row.id}`} value={row.id}>{row.RaceName}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-300">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select TTRPGs</label>
                    <select
                      multiple
                      value={selectedDndTTRPGs.map(String)}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, (option) => parseInt(option.value, 10));
                        setSelectedDndTTRPGs(selected);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      size={Math.min(availableDndTTRPGs.length || 3, 6)}
                    >
                      {availableDndTTRPGs.map((ttrpg) => (
                        <option key={ttrpg.id} value={ttrpg.id}>{ttrpg.TTRPG_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Race Name</label>
                      <input
                        type="text"
                        value={dndRaceName}
                        onChange={(e) => setDndRaceName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Race Look</label>
                      <input
                        type="text"
                        value={dndRaceLook}
                        onChange={(e) => setDndRaceLook(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Skin Colours (comma or new line separated)</label>
                      <textarea
                        value={dndRaceSkinColour}
                        onChange={(e) => setDndRaceSkinColour(e.target.value)}
                        placeholder={"pale\ntan\nolive\ndark brown"}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Add multiple options and the prompt generator will randomly choose one.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                      <select
                        value={dndRaceSize}
                        onChange={(e) => setDndRaceSize(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Select Size --</option>
                        <option value="Tiny">Tiny</option>
                        <option value="Small">Small</option>
                        <option value="Medium">Medium</option>
                        <option value="Large">Large</option>
                        <option value="Huge">Huge</option>
                        <option value="Gargantuan">Gargantuan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Speed</label>
                      <input
                        type="number"
                        value={dndRaceSpeed}
                        onChange={(e) => setDndRaceSpeed(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={dndRaceDescription}
                        onChange={(e) => setDndRaceDescription(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Languages</label>
                      <textarea
                        value={dndRaceLanguages}
                        onChange={(e) => setDndRaceLanguages(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Traits</label>
                      <select
                        value={dndRaceTraitPickerValue}
                        onChange={(e) => {
                          const value = e.target.value;
                          setDndRaceTraitPickerValue(value);
                          if (!value) return;
                          if (value === '__add__') {
                            setShowAddDndRaceTraitForm(true);
                            return;
                          }
                          addDndRaceTrait(value);
                          setDndRaceTraitPickerValue('');
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      >
                        <option value="">-- Select Trait --</option>
                        <option value="__add__">Add New Trait</option>
                        {loadingDndClassFeatures && <option disabled>Loading traits...</option>}
                        {!loadingDndClassFeatures && dndClassFeatures.map((feature) => (
                          <option key={`dnd-race-trait-${feature.id}`} value={feature.FeatureName}>{feature.FeatureName}</option>
                        ))}
                      </select>
                      {dndRaceSelectedTraits.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {dndRaceSelectedTraits.map((traitName) => (
                            <span
                              key={`dnd-race-trait-chip-${traitName}`}
                              className="inline-flex items-center gap-1 rounded bg-indigo-100 px-2 py-1 text-xs text-indigo-900"
                            >
                              {traitName}
                              <button
                                type="button"
                                onClick={() => removeDndRaceTrait(traitName)}
                                className="text-indigo-700 hover:text-indigo-900"
                                aria-label={`Remove ${traitName}`}
                              >
                                x
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      {showAddDndRaceTraitForm && (
                        <div className="mt-2 p-3 bg-white border border-gray-300 rounded">
                          <div className="grid grid-cols-1 gap-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Trait Name</label>
                              <input
                                type="text"
                                value={newDndRaceTraitName}
                                onChange={(e) => setNewDndRaceTraitName(e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Trait Text</label>
                              <textarea
                                value={newDndRaceTraitText}
                                onChange={(e) => setNewDndRaceTraitText(e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                rows={3}
                              />
                            </div>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={handleSaveDndRaceTrait}
                              disabled={savingDndRaceTrait}
                              className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-60"
                            >
                              {savingDndRaceTrait ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddDndRaceTraitForm(false);
                                setNewDndRaceTraitName('');
                                setNewDndRaceTraitText('');
                                setDndRaceTraitPickerValue('');
                              }}
                              className="px-3 py-1 bg-gray-400 text-white rounded text-xs hover:bg-gray-500"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="md:col-span-2 p-3 bg-white border border-gray-300 rounded space-y-3">
                      <h4 className="text-sm font-semibold text-gray-800">Ability Score Bonus Rules</h4>

                      <div
                        className="grid grid-cols-2 gap-3"
                        style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}
                      >
                        <div className="rounded border border-gray-200 p-2 bg-gray-50 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <h5 className="text-xs font-semibold text-gray-800">Fixed Bonus Scores</h5>
                            <button
                              type="button"
                              onClick={addDndRaceFixedBonus}
                              className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                            >
                              Add Fixed
                            </button>
                          </div>

                          {dndRaceAbilityBonusRules.fixed.length === 0 && (
                            <p className="text-xs text-gray-600">No fixed bonuses yet.</p>
                          )}

                          <div className="space-y-2">
                            {dndRaceAbilityBonusRules.fixed.map((entry, index) => (
                              <div key={`dnd-race-fixed-${index}`} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Stat</label>
                                  <select
                                    value={entry.stat}
                                    onChange={(e) => updateDndRaceFixedBonus(index, 'stat', e.target.value)}
                                    className="w-full sm:max-w-24 px-1.5 py-1 border border-gray-300 rounded text-xs"
                                  >
                                    {DND_ABILITY_STATS.map((stat) => (
                                      <option key={`fixed-stat-${index}-${stat}`} value={stat}>{DND_ABILITY_STAT_LABELS[stat]}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Bonus</label>
                                  <input
                                    type="number"
                                    value={entry.amount}
                                    onChange={(e) => updateDndRaceFixedBonus(index, 'amount', e.target.value)}
                                    className="w-full sm:max-w-20 px-1.5 py-1 border border-gray-300 rounded text-xs"
                                  />
                                </div>
                                <div>
                                  <button
                                    type="button"
                                    onClick={() => removeDndRaceFixedBonus(index)}
                                    className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded border border-gray-200 p-2 bg-gray-50 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <h5 className="text-xs font-semibold text-gray-800">Choice Rules</h5>
                            <button
                              type="button"
                              onClick={addDndRaceChoiceBonus}
                              className="px-2 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700"
                            >
                              Add Choice
                            </button>
                          </div>

                          {dndRaceAbilityBonusRules.choices.length === 0 && (
                            <p className="text-xs text-gray-600">No choose-one style bonuses yet.</p>
                          )}

                          <div className="space-y-2">
                            {dndRaceAbilityBonusRules.choices.map((choice, choiceIndex) => (
                              <div key={choice.id || `choice-${choiceIndex}`} className="rounded border border-gray-200 p-2 bg-white space-y-2">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Pick Count</label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={choice.count}
                                      onChange={(e) => updateDndRaceChoiceBonus(choiceIndex, 'count', e.target.value)}
                                      className="w-full sm:max-w-20 px-1.5 py-1 border border-gray-300 rounded text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Bonus Each</label>
                                    <input
                                      type="number"
                                      value={choice.amount}
                                      onChange={(e) => updateDndRaceChoiceBonus(choiceIndex, 'amount', e.target.value)}
                                      className="w-full sm:max-w-20 px-1.5 py-1 border border-gray-300 rounded text-xs"
                                    />
                                  </div>
                                  <div>
                                    <button
                                      type="button"
                                      onClick={() => removeDndRaceChoiceBonus(choiceIndex)}
                                      className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                                    >
                                      Remove Rule
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-xs font-medium text-gray-700 mb-1">Choose from:</p>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                    {DND_ABILITY_STATS.map((stat) => {
                                      const checked = (choice.options || []).includes(stat);
                                      return (
                                        <label key={`${choice.id}-${stat}`} className="inline-flex items-center gap-1 text-xs text-gray-800">
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => toggleDndRaceChoiceBonusOption(choiceIndex, stat)}
                                          />
                                          {DND_ABILITY_STAT_LABELS[stat]}
                                        </label>
                                      );
                                    })}
                                  </div>
                                  {choice.count > (choice.options || []).length && (
                                    <p className="mt-1 text-xs text-amber-700">
                                      This rule picks {choice.count}, but only {(choice.options || []).length} option{(choice.options || []).length === 1 ? '' : 's'} selected.
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={handleSaveDndRace}
                      disabled={savingDndRace}
                      className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-bold disabled:opacity-60"
                    >
                      {savingDndRace ? 'Saving...' : 'Save'}
                    </button>
                    {selectedDndRaceId !== '__new__' && (
                      <button
                        onClick={handleDeleteDndRace}
                        className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition font-bold"
                      >
                        Delete
                      </button>
                    )}
                    <button
                      onClick={() => {
                        resetDndRaceForm();
                        setShowAddDndRaceForm(false);
                      }}
                      className="px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {showAddDndBackgroundForm && (
                <div className="p-6 bg-gray-100 rounded-lg border border-gray-300">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">Add DND Background</h3>

                  <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-300">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Background</label>
                    <select
                      value={selectedDndBackgroundId}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '__new__') {
                          resetDndBackgroundForm();
                          setSelectedDndBackgroundId('__new__');
                        } else {
                          setSelectedDndBackgroundId(value);
                          loadDndBackgroundData(parseInt(value, 10));
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    >
                      <option value="__new__">-- Create New Background --</option>
                      {existingDndBackgrounds.map((row) => (
                        <option key={row.id} value={row.id}>{row.BackgroundName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-300">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select TTRPGs</label>
                    <select
                      multiple
                      value={selectedDndTTRPGs.map(String)}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, (option) => parseInt(option.value, 10));
                        setSelectedDndTTRPGs(selected);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      size={Math.min(availableDndTTRPGs.length || 3, 6)}
                    >
                      {availableDndTTRPGs.map((ttrpg) => (
                        <option key={ttrpg.id} value={ttrpg.id}>{ttrpg.TTRPG_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Background Name</label>
                      <input type="text" value={dndBackgroundName} onChange={(e) => setDndBackgroundName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Feature Name</label>
                      <input type="text" value={dndBackgroundFeatureName} onChange={(e) => setDndBackgroundFeatureName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea value={dndBackgroundDescription} onChange={(e) => setDndBackgroundDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Skill Proficiencies</label>
                      <textarea value={dndBackgroundSkillProficiencies} onChange={(e) => setDndBackgroundSkillProficiencies(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tool Proficiencies</label>
                      <textarea value={dndBackgroundToolProficiencies} onChange={(e) => setDndBackgroundToolProficiencies(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Languages</label>
                      <textarea value={dndBackgroundLanguages} onChange={(e) => setDndBackgroundLanguages(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Starting Equipment</label>
                      <textarea value={dndBackgroundStartingEquipment} onChange={(e) => setDndBackgroundStartingEquipment(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Feature Text</label>
                      <textarea value={dndBackgroundFeatureText} onChange={(e) => setDndBackgroundFeatureText(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded" />
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={handleSaveDndBackground}
                      disabled={savingDndBackground}
                      className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-bold disabled:opacity-60"
                    >
                      {savingDndBackground ? 'Saving...' : 'Save'}
                    </button>
                    {selectedDndBackgroundId !== '__new__' && (
                      <button
                        onClick={handleDeleteDndBackground}
                        className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition font-bold"
                      >
                        Delete
                      </button>
                    )}
                    <button
                      onClick={() => {
                        resetDndBackgroundForm();
                        setShowAddDndBackgroundForm(false);
                      }}
                      className="px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {showAddDndEquipmentForm && (
                <div className="p-6 bg-gray-100 rounded-lg border border-gray-300">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">Add DND Equipment</h3>

                  <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-300">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Equipment</label>
                    <select
                      value={selectedDndEquipmentId}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '__new__') {
                          resetDndEquipmentForm();
                          setSelectedDndEquipmentId('__new__');
                        } else {
                          setSelectedDndEquipmentId(value);
                          loadDndEquipmentData(parseInt(value, 10));
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    >
                      <option value="__new__">-- Create New Equipment --</option>
                      {existingDndEquipment.map((row) => (
                        <option key={row.id} value={row.id}>{row.ItemName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-300">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select TTRPGs</label>
                    <select
                      multiple
                      value={selectedDndTTRPGs.map(String)}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, (option) => parseInt(option.value, 10));
                        setSelectedDndTTRPGs(selected);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      size={Math.min(availableDndTTRPGs.length || 3, 6)}
                    >
                      {availableDndTTRPGs.map((ttrpg) => (
                        <option key={ttrpg.id} value={ttrpg.id}>{ttrpg.TTRPG_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                      <input type="text" value={dndEquipmentName} onChange={(e) => setDndEquipmentName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <input type="text" value={dndEquipmentCategory} onChange={(e) => setDndEquipmentCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cost</label>
                      <input type="text" value={dndEquipmentCost} onChange={(e) => setDndEquipmentCost(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                      <input type="text" value={dndEquipmentWeight} onChange={(e) => setDndEquipmentWeight(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Damage</label>
                      <input type="text" value={dndEquipmentDamage} onChange={(e) => setDndEquipmentDamage(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Damage Type</label>
                      <input type="text" value={dndEquipmentDamageType} onChange={(e) => setDndEquipmentDamageType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Armor Class</label>
                      <input type="text" value={dndEquipmentArmorClass} onChange={(e) => setDndEquipmentArmorClass(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Allowed Classes</label>
                      <input type="text" value={dndEquipmentAllowedClasses} onChange={(e) => setDndEquipmentAllowedClasses(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Properties</label>
                      <textarea value={dndEquipmentProperties} onChange={(e) => setDndEquipmentProperties(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea value={dndEquipmentDescription} onChange={(e) => setDndEquipmentDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded" />
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={handleSaveDndEquipment}
                      disabled={savingDndEquipment}
                      className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-bold disabled:opacity-60"
                    >
                      {savingDndEquipment ? 'Saving...' : 'Save'}
                    </button>
                    {selectedDndEquipmentId !== '__new__' && (
                      <button
                        onClick={handleDeleteDndEquipment}
                        className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition font-bold"
                      >
                        Delete
                      </button>
                    )}
                    <button
                      onClick={() => {
                        resetDndEquipmentForm();
                        setShowAddDndEquipmentForm(false);
                      }}
                      className="px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {showAddDndSpellForm && (
                <div className="p-6 bg-gray-100 rounded-lg border border-gray-300">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">Add DND Spell</h3>

                  <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-300">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Spell</label>
                    <select
                      value={selectedDndSpellId}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '__new__') {
                          resetDndSpellForm();
                          setSelectedDndSpellId('__new__');
                        } else {
                          setSelectedDndSpellId(value);
                          loadDndSpellData(parseInt(value, 10));
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    >
                      <option value="__new__">-- Create New Spell --</option>
                      {existingDndSpells.map((row) => (
                        <option key={row.id} value={row.id}>{row.SpellName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-300">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select TTRPGs</label>
                    <select
                      multiple
                      value={selectedDndTTRPGs.map(String)}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, (option) => parseInt(option.value, 10));
                        setSelectedDndTTRPGs(selected);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      size={Math.min(availableDndTTRPGs.length || 3, 6)}
                    >
                      {availableDndTTRPGs.map((ttrpg) => (
                        <option key={ttrpg.id} value={ttrpg.id}>{ttrpg.TTRPG_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Spell Name</label>
                      <input type="text" value={dndSpellName} onChange={(e) => setDndSpellName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Spell Level</label>
                      <input type="number" min="0" value={dndSpellLevel} onChange={(e) => setDndSpellLevel(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
                      <input type="text" value={dndSpellSchool} onChange={(e) => setDndSpellSchool(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Casting Time</label>
                      <input type="text" value={dndSpellCastingTime} onChange={(e) => setDndSpellCastingTime(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Range</label>
                      <input type="text" value={dndSpellRange} onChange={(e) => setDndSpellRange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                      <input type="text" value={dndSpellDuration} onChange={(e) => setDndSpellDuration(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Components</label>
                      <input type="text" value={dndSpellComponents} onChange={(e) => setDndSpellComponents(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Class List</label>
                      <textarea value={dndSpellClassList} onChange={(e) => setDndSpellClassList(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea value={dndSpellDescription} onChange={(e) => setDndSpellDescription(e.target.value)} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded" />
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={handleSaveDndSpell}
                      disabled={savingDndSpell}
                      className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-bold disabled:opacity-60"
                    >
                      {savingDndSpell ? 'Saving...' : 'Save'}
                    </button>
                    {selectedDndSpellId !== '__new__' && (
                      <button
                        onClick={handleDeleteDndSpell}
                        className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition font-bold"
                      >
                        Delete
                      </button>
                    )}
                    <button
                      onClick={() => {
                        resetDndSpellForm();
                        setShowAddDndSpellForm(false);
                      }}
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
                  className={`flex-1 px-4 py-2 rounded transition text-sm font-medium ${showAddSpecializationForm ? 'bg-yellow-700 text-white' : 'bg-yellow-600 text-white hover:bg-yellow-700'}`}
                >
                  Add Specialization
                </button>

                <button
                  onClick={handleAddForceTree}
                  className={`flex-1 px-4 py-2 rounded transition text-sm font-medium ${showAddForceTreeForm ? 'bg-cyan-700 text-white' : 'bg-cyan-600 text-white hover:bg-cyan-700'}`}
                >
                  Add Force Tree
                </button>

                <button
                  onClick={handleAddEquipment}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition text-sm font-medium"
                >
                  Add Equipment
                </button>

                <button
                  onClick={handleAddShip}
                  className="flex-1 px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 transition text-sm font-medium"
                >
                  Add Ship
                </button>
              </div>

              {showAddForceTreeForm && (
                <div className="mt-6 p-6 bg-gray-100 rounded-lg border border-gray-300">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">Add or Edit Force Power Tree</h3>
                  <div className="mb-4 p-3 bg-white border border-gray-300 rounded">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Existing Force Tree</label>
                    <div className="flex gap-2 items-center">
                      <select
                        value={selectedForceTreeId}
                        onChange={(e) => handleForceTreeSelectionChange(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      >
                        <option value="__new__">-- Create New Force Tree --</option>
                        {existingForceTrees.map((tree) => (
                          <option key={tree.id} value={tree.id}>{tree.PowerTreeName}</option>
                        ))}
                      </select>
                      {selectedForceTreeId !== '__new__' && (
                        <button
                          onClick={resetForceTreeForm}
                          className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-medium"
                        >
                          New
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Tree Header Section - moved directly under main header */}
                  <div className="mb-4 flex flex-col gap-2">
                    <label className="text-2xl font-bold text-blue-700 flex items-center">
                      Power Tree Name:
                      <input
                        type="text"
                        value={powerTreeName}
                        onChange={e => setPowerTreeName(e.target.value)}
                        className="ml-2 px-2 py-1 border border-gray-400 rounded text-black text-lg font-normal"
                        style={{ minWidth: '220px' }}
                      />
                    </label>
                    <label className="text-lg font-semibold text-gray-800 flex items-center">
                      Force Prerequisite:
                      <input
                        type="text"
                        value={forcePrerequisite}
                        onChange={e => setForcePrerequisite(e.target.value)}
                        className="ml-2 px-2 py-1 border border-gray-400 rounded text-black text-base font-normal"
                        style={{ minWidth: '180px' }}
                      />
                    </label>
                  </div>
                    <div className="overflow-y-auto border border-gray-300 rounded-lg p-4 bg-white" style={{ minHeight: '500px', maxHeight: '700px', width: 'fit-content' }}>
                    <table className="border-separate text-center text-xs" style={{ borderSpacing: '0' }}>
                      <tbody>
                        {/* Top row: single merged ability box with Talent Name dropdown */}
                        <tr className="bg-gray-50">
                          <td colSpan={8} style={{
                            border: '2px solid #1976d2',
                            width: '1040px',
                            height: '190px',
                            textAlign: 'center',
                            verticalAlign: 'middle',
                            background: '#e3f2fd',
                            padding: 0,
                            position: 'relative'
                          }}>
                            <div
                              className="talent-box"
                              style={{
                                width: '100%',
                                height: '100%',
                                textAlign: 'left',
                                padding: '24px',
                                position: 'relative',
                                boxSizing: 'border-box',
                                backgroundColor: '#e3f2fd',
                                border: '1px solid #90caf9',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'flex-start',
                                color: '#1976d2',
                                fontWeight: 700,
                                fontSize: '1.3rem',
                                position: 'relative'
                              }}
                            >
                              
                              <div style={{ position: 'absolute', top: 12, left: 12, right: 12, zIndex: 2, display: 'flex', flexDirection: 'column', height: 'calc(100% - 24px)' }}>
                                <div style={{ display: 'flex', gap: '12px', marginBottom: '8px', alignItems: 'flex-start' }}>
                                  <div style={{ flex: 1 }}>
                                    <label className="block font-bold text-blue-900 mb-1" style={{ fontSize: '1.3rem' }}>Talent Name</label>
                                    {addingNewTopTalent ? (
                                      <input
                                        type="text"
                                        value={newTopTalentName}
                                        onChange={e => setNewTopTalentName(e.target.value)}
                                        placeholder="Enter new talent name..."
                                        className="px-2 py-1 border border-blue-400 rounded text-blue-900 bg-white font-semibold"
                                        style={{ fontSize: '1.3rem', width: '100%' }}
                                      />
                                    ) : (
                                      <select
                                        value={selectedForceTalentName}
                                        onChange={e => {
                                          if (e.target.value === '__ADD_NEW__') {
                                            setAddingNewTopTalent(true);
                                            setNewTopTalentName('');
                                            setNewTopTalentDescription('');
                                          } else {
                                            const selected = forceTalentNames.find(t => t.talent_name === e.target.value);
                                            setSelectedForceTalentName(e.target.value);
                                            setSelectedForceTalentDescription(selected ? selected.description || '' : '');
                                          }
                                        }}
                                        className="px-2 py-1 border border-blue-400 rounded text-blue-900 bg-white font-semibold"
                                        style={{ fontSize: '1.3rem', width: '100%' }}
                                      >
                                        <option value="">-- Select Talent --</option>
                                        <option value="__ADD_NEW__">+ Add New Talent</option>
                                        {forceTalentNames.map(talent => (
                                          <option key={talent.talent_name} value={talent.talent_name}>{talent.talent_name}</option>
                                        ))}
                                      </select>
                                    )}
                                  </div>
                                  <div style={{ width: '80px' }}>
                                    <label className="block font-bold text-blue-900 mb-1" style={{ fontSize: '1.3rem' }}>Cost</label>
                                    <input
                                      type="text"
                                      value={forceTalentCost}
                                      onChange={e => setForceTalentCost(e.target.value)}
                                      placeholder="###"
                                      className="px-2 py-1 border border-blue-400 rounded text-blue-900 bg-white font-semibold text-center"
                                      style={{ fontSize: '1.3rem', width: '100%' }}
                                    />
                                  </div>
                                </div>
                                {(selectedForceTalentDescription || addingNewTopTalent) && (
                                  <textarea
                                    value={addingNewTopTalent ? newTopTalentDescription : selectedForceTalentDescription}
                                    onChange={addingNewTopTalent ? (e => setNewTopTalentDescription(e.target.value)) : undefined}
                                    readOnly={!addingNewTopTalent}
                                    placeholder={addingNewTopTalent ? "Enter talent description..." : ""}
                                    className={`px-2 py-1 border border-blue-400 rounded text-blue-900 ${addingNewTopTalent ? 'bg-white' : 'bg-blue-50'} text-sm font-normal flex-1`}
                                    style={{ resize: 'none', width: '100%' }}
                                  />
                                )}
                                
                                {/* Save/Cancel buttons for new talent */}
                                {addingNewTopTalent && (
                                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                    <button
                                      onClick={async () => {
                                        const talentName = newTopTalentName.trim();
                                        const description = newTopTalentDescription.trim();
                                        
                                        if (!talentName) {
                                          alert('Please enter a talent name');
                                          return;
                                        }
                                        
                                        try {
                                          const { data, error } = await supabase
                                            .from('SW_force_talents')
                                            .insert([{ talent_name: talentName, description: description || '' }])
                                            .select();
                                          
                                          if (error) {
                                            console.error('Error saving talent:', error);
                                            alert('Failed to save talent: ' + error.message);
                                            return;
                                          }
                                          
                                          // Refresh talent list
                                          const { data: talents, error: fetchError } = await supabase
                                            .from('SW_force_talents')
                                            .select('id, talent_name, description');
                                          
                                          if (!fetchError && talents) {
                                            const sortedTalents = talents.sort((a, b) => a.talent_name.localeCompare(b.talent_name));
                                            setForceTalentNames(sortedTalents);
                                          }
                                          
                                          // Set the new talent as selected
                                          setSelectedForceTalentName(talentName);
                                          setSelectedForceTalentDescription(description || '');
                                          
                                          // Exit add mode
                                          setAddingNewTopTalent(false);
                                        } catch (err) {
                                          console.error('Unexpected error:', err);
                                          alert('Failed to save talent');
                                        }
                                      }}
                                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700"
                                      style={{ fontSize: '1rem' }}
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setAddingNewTopTalent(false)}
                                      className="flex-1 px-3 py-2 bg-gray-400 text-white rounded font-semibold hover:bg-gray-500"
                                      style={{ fontSize: '1rem' }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>

                        {/* Remaining rows: 4 ability boxes per row, as before */}
                        {(() => {
                          // Hardcoded demo links array for 4x4 grid: each cell has an array of directions ("Up", "Down", "Left", "Right")
                          // You can later replace this with dynamic data from your backend or user input
                          const linksGrid = [
                            [ ["Up", "Down", "Right"], ["Up", "Down", "Left", "Right"], ["Up", "Down", "Left", "Right"], ["Up", "Down", "Left"] ],
                            [ ["Up", "Down", "Right"], ["Up", "Down", "Left", "Right"], ["Up", "Down", "Left", "Right"], ["Up", "Down", "Left"] ],
                            [ ["Up", "Down", "Right"], ["Up", "Down", "Left", "Right"], ["Up", "Down", "Left", "Right"], ["Up", "Down", "Left"] ],
                            [ ["Up", "Right"], ["Up", "Left", "Right"], ["Up", "Left", "Right"], ["Up", "Left"] ]
                          ];
                          return Array.from({ length: 4 }, (_, rowIndex) => (
                          <tr key={`force-row-${rowIndex}`} className="bg-gray-50">
                            {Array.from({ length: 4 }, (_, colIndex) => {
                              const boxIndex = (rowIndex) * 4 + colIndex;
                              const links = linksGrid[rowIndex][colIndex];
                              const talent = gridTalents[boxIndex];
                              
                              // Check if this box is part of a merged set
                              const mergedRange = getMergedRangeForIndex(boxIndex, mergedBoxes);
                              const mergeSpan = mergedRange.span;
                              const isMerged = mergeSpan > 1;
                              const isMergedLead = isMerged && mergedRange.start === boxIndex;
                              const isMergedChild = isMerged && mergedRange.start !== boxIndex;
                              const currentMergeKey = isMerged ? `${mergedRange.start}-${mergedRange.end}` : null;
                              const mergedWidth = mergeSpan * 260 + (mergeSpan - 1) * 24;
                              const rightmostColIndex = colIndex + mergeSpan - 1;
                              
                              // Get links for the merged box (use second box's right link if merged)
                              const rightBoxLinks = isMergedLead && rightmostColIndex < 4 ? linksGrid[rowIndex][rightmostColIndex] : [];
                              const mergedLinks = isMergedLead ? {
                                up: links.includes('Up'),
                                down: links.includes('Down'),
                                left: links.includes('Left'),
                                right: rightBoxLinks.includes('Right') // Use right box's right link
                              } : null;
                              
                              const handleTalentSelect = (talentName) => {
                                const selected = forceTalentNames.find(t => t.talent_name === talentName);
                                const newGridTalents = [...gridTalents];
                                newGridTalents[boxIndex] = {
                                  name: talentName,
                                  cost: newGridTalents[boxIndex].cost,
                                  description: selected ? selected.description || '' : ''
                                };
                                setGridTalents(newGridTalents);
                                
                                // Check for merge opportunities with adjacent boxes
                                if (talentName !== '') {
                                  // Check right box
                                  const rightBoxIndex = boxIndex + 1;
                                  const isRightAdjacent = colIndex < 3; // Not on the right edge
                                  
                                  if (isRightAdjacent && newGridTalents[rightBoxIndex]?.name === talentName) {
                                    // Same talent in adjacent right box, ask to merge
                                    const mergeKey = `${boxIndex}-${rightBoxIndex}`;
                                    setMergePending({ boxIndex, direction: 'right', mergeKey });
                                    return;
                                  }
                                  
                                  // Check left box
                                  const leftBoxIndex = boxIndex - 1;
                                  const isLeftAdjacent = colIndex > 0; // Not on the left edge
                                  
                                  if (isLeftAdjacent && newGridTalents[leftBoxIndex]?.name === talentName) {
                                    // Same talent in adjacent left box, ask to merge
                                    const mergeKey = `${leftBoxIndex}-${boxIndex}`;
                                    setMergePending({ boxIndex: leftBoxIndex, direction: 'right', mergeKey });
                                    return;
                                  }
                                }
                              };
                              
                              const handleCostChange = (cost) => {
                                const newGridTalents = [...gridTalents];
                                newGridTalents[boxIndex] = {
                                  ...newGridTalents[boxIndex],
                                  cost: cost
                                };
                                setGridTalents(newGridTalents);
                              };
                              
                              const handleUnmerge = () => {
                                const newMergedBoxes = { ...mergedBoxes };
                                for (let i = mergedRange.start; i < mergedRange.end; i++) {
                                  delete newMergedBoxes[`${i}-${i + 1}`];
                                }
                                setMergedBoxes(newMergedBoxes);
                              };
                              
                              return (
                                <>
                                  <td 
                                    key={`force-td-${colIndex}`} 
                                    style={{
                                      position: isMergedChild ? 'static' : 'relative',
                                      border: isMergedChild ? 'none' : '2px solid #1976d2',
                                      width: '260px',
                                      height: '190px',
                                      textAlign: 'center',
                                      verticalAlign: 'middle',
                                      background: isMergedChild ? 'transparent' : '#e3f2fd',
                                      padding: '8px',
                                      overflow: isMergedChild ? 'hidden' : 'visible'
                                    }}
                                  >
                                    {!isMergedChild && (
                                      <div
                                        className="talent-box"
                                        style={{
                                          width: isMerged ? `${mergedWidth}px` : '100%',
                                          height: '100%',
                                          textAlign: 'left',
                                          padding: '8px',
                                          position: isMerged ? 'absolute' : 'relative',
                                          top: isMerged ? '8px' : undefined,
                                          left: isMerged ? '8px' : undefined,
                                          boxSizing: 'border-box',
                                          backgroundColor: '#e3f2fd',
                                          border: '1px solid #90caf9',
                                          borderRadius: '6px',
                                          display: 'flex',
                                          flexDirection: 'column',
                                          color: '#1976d2',
                                          fontWeight: 600,
                                          zIndex: isMerged ? 10 : 1
                                        }}
                                      >
                                      {/* Checkboxes - only render Right and Down to avoid duplicates */}
                                      {/* Each box owns its right and down checkboxes */}
                                      
                                      {/* Down checkboxes - show for all rows except last row */}
                                      {rowIndex < 3 && !isMerged && (
                                        <input 
                                          type="checkbox" 
                                          checked={gridCheckboxLinks[boxIndex]?.down || false}
                                          onChange={e => {
                                            const newLinks = [...gridCheckboxLinks];
                                            newLinks[boxIndex] = { ...newLinks[boxIndex], down: e.target.checked };
                                            setGridCheckboxLinks(newLinks);
                                          }}
                                          style={{ position: 'absolute', bottom: '-18px', left: '50%', transform: 'translateX(-50%)', width: '22px', height: '22px' }} 
                                          title="Down" 
                                        />
                                      )}
                                      
                                      {/* Down checkboxes for merged boxes - one at left edge, one at right edge */}
                                      {rowIndex < 3 && isMergedLead && (
                                        <>
                                          {Array.from({ length: mergeSpan }, (_, offset) => (
                                            <input
                                              key={`down-${boxIndex + offset}`}
                                              type="checkbox"
                                              checked={gridCheckboxLinks[boxIndex + offset]?.down || false}
                                              onChange={e => {
                                                const newLinks = [...gridCheckboxLinks];
                                                newLinks[boxIndex + offset] = { ...newLinks[boxIndex + offset], down: e.target.checked };
                                                setGridCheckboxLinks(newLinks);
                                              }}
                                              style={{
                                                position: 'absolute',
                                                bottom: '-18px',
                                                left: `${132 + (offset * 284)}px`,
                                                transform: 'translateX(-50%)',
                                                width: '22px',
                                                height: '22px'
                                              }}
                                              title="Down"
                                            />
                                          ))}
                                        </>
                                      )}
                                      
                                      {/* Right checkbox - show for non-merged boxes except last column */}
                                      {!isMerged && colIndex < 3 && (
                                        <input 
                                          type="checkbox" 
                                          checked={gridCheckboxLinks[boxIndex]?.right || false}
                                          onChange={e => {
                                            const newLinks = [...gridCheckboxLinks];
                                            newLinks[boxIndex] = { ...newLinks[boxIndex], right: e.target.checked };
                                            setGridCheckboxLinks(newLinks);
                                          }}
                                          style={{ position: 'absolute', right: '-18px', top: '50%', transform: 'translateY(-50%)', width: '22px', height: '22px' }} 
                                          title="Right" 
                                        />
                                      )}
                                      
                                      {/* Right checkbox for merged boxes - position at the right edge of merged area */}
                                      {isMergedLead && rightmostColIndex < 3 && (
                                        <input 
                                          type="checkbox" 
                                          checked={gridCheckboxLinks[mergedRange.end]?.right || false}
                                          onChange={e => {
                                            const newLinks = [...gridCheckboxLinks];
                                            newLinks[mergedRange.end] = { ...newLinks[mergedRange.end], right: e.target.checked };
                                            setGridCheckboxLinks(newLinks);
                                          }}
                                          style={{ position: 'absolute', right: '-18px', top: '50%', transform: 'translateY(-50%)', width: '22px', height: '22px' }} 
                                          title="Right" 
                                        />
                                      )}
                                      
                                      {/* Up checkboxes - only for first row to connect to top talent box */}
                                      {rowIndex === 0 && !isMerged && (
                                        <input 
                                          type="checkbox" 
                                          checked={gridCheckboxLinks[boxIndex]?.up || false}
                                          onChange={e => {
                                            const newLinks = [...gridCheckboxLinks];
                                            newLinks[boxIndex] = { ...newLinks[boxIndex], up: e.target.checked };
                                            setGridCheckboxLinks(newLinks);
                                          }}
                                          style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', width: '22px', height: '22px' }} 
                                          title="Up" 
                                        />
                                      )}
                                      
                                      {/* Up checkboxes for merged boxes - one at left edge, one at right edge */}
                                      {rowIndex === 0 && isMergedLead && (
                                        <>
                                          {Array.from({ length: mergeSpan }, (_, offset) => (
                                            <input
                                              key={`up-${boxIndex + offset}`}
                                              type="checkbox"
                                              checked={gridCheckboxLinks[boxIndex + offset]?.up || false}
                                              onChange={e => {
                                                const newLinks = [...gridCheckboxLinks];
                                                newLinks[boxIndex + offset] = { ...newLinks[boxIndex + offset], up: e.target.checked };
                                                setGridCheckboxLinks(newLinks);
                                              }}
                                              style={{
                                                position: 'absolute',
                                                top: '-18px',
                                                left: `${132 + (offset * 284)}px`,
                                                transform: 'translateX(-50%)',
                                                width: '22px',
                                                height: '22px'
                                              }}
                                              title="Up"
                                            />
                                          ))}
                                        </>
                                      )}
                                      
                                      {/* Talent Name and Cost */}
                                      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px', width: '100%' }}>
                                        {addingNewTalent[boxIndex] ? (
                                          <input
                                            type="text"
                                            value={newTalentNames[boxIndex] || ''}
                                            onChange={e => setNewTalentNames({ ...newTalentNames, [boxIndex]: e.target.value })}
                                            placeholder="Enter new talent name..."
                                            className="flex-1 px-1 py-0 border border-blue-400 rounded text-blue-900 bg-white font-semibold text-xs"
                                            style={{ minHeight: '24px', flex: 1 }}
                                          />
                                        ) : (
                                          <select
                                            value={talent.name}
                                            onChange={e => {
                                              if (e.target.value === '__ADD_NEW__') {
                                                setAddingNewTalent({ ...addingNewTalent, [boxIndex]: true });
                                                setNewTalentNames({ ...newTalentNames, [boxIndex]: '' });
                                                setNewTalentDescriptions({ ...newTalentDescriptions, [boxIndex]: '' });
                                              } else {
                                                handleTalentSelect(e.target.value);
                                              }
                                            }}
                                            className="flex-1 px-1 py-0 border border-blue-400 rounded text-blue-900 bg-white font-semibold text-xs"
                                            style={{ minHeight: '24px', flex: 1 }}
                                          >
                                            <option value="">Select</option>
                                            <option value="__ADD_NEW__">+ Add New Talent</option>
                                            {forceTalentNames.map(t => (
                                              <option key={t.talent_name} value={t.talent_name}>{t.talent_name}</option>
                                            ))}
                                          </select>
                                        )}
                                        <input
                                          type="text"
                                          value={talent.cost}
                                          onChange={e => handleCostChange(e.target.value)}
                                          placeholder="Cost"
                                          className="px-1 py-0 border border-blue-400 rounded text-blue-900 bg-white font-semibold text-xs text-center"
                                          style={{ minHeight: '24px', width: '60px' }}
                                        />
                                      </div>
                                      
                                      {/* Description */}
                                      {(talent.description || addingNewTalent[boxIndex]) && (
                                        <textarea
                                          value={addingNewTalent[boxIndex] ? (newTalentDescriptions[boxIndex] || '') : talent.description}
                                          onChange={addingNewTalent[boxIndex] ? (e => setNewTalentDescriptions({ ...newTalentDescriptions, [boxIndex]: e.target.value })) : undefined}
                                          readOnly={!addingNewTalent[boxIndex]}
                                          placeholder={addingNewTalent[boxIndex] ? "Enter talent description..." : ""}
                                          className={`flex-1 px-1 py-1 border border-blue-400 rounded text-blue-900 ${addingNewTalent[boxIndex] ? 'bg-white' : 'bg-blue-50'} text-xs font-normal`}
                                          style={{ resize: 'none', width: '100%', minHeight: addingNewTalent[boxIndex] ? '100px' : '130px', overflowY: 'auto' }}
                                        />
                                      )}
                                      
                                      {/* Save/Cancel buttons for new talent */}
                                      {addingNewTalent[boxIndex] && (
                                        <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                          <button
                                            onClick={async () => {
                                              const talentName = newTalentNames[boxIndex]?.trim();
                                              const description = newTalentDescriptions[boxIndex]?.trim();
                                              
                                              if (!talentName) {
                                                alert('Please enter a talent name');
                                                return;
                                              }
                                              
                                              try {
                                                const { data, error } = await supabase
                                                  .from('SW_force_talents')
                                                  .insert([{ talent_name: talentName, description: description || '' }])
                                                  .select();
                                                
                                                if (error) {
                                                  console.error('Error saving talent:', error);
                                                  alert('Failed to save talent: ' + error.message);
                                                  return;
                                                }
                                                
                                                // Refresh talent list
                                                const { data: talents, error: fetchError } = await supabase
                                                  .from('SW_force_talents')
                                                  .select('id, talent_name, description');
                                                
                                                if (!fetchError && talents) {
                                                  const sortedTalents = talents.sort((a, b) => a.talent_name.localeCompare(b.talent_name));
                                                  setForceTalentNames(sortedTalents);
                                                }
                                                
                                                // Update grid with new talent
                                                const newGridTalents = [...gridTalents];
                                                newGridTalents[boxIndex] = {
                                                  name: talentName,
                                                  cost: newGridTalents[boxIndex].cost,
                                                  description: description || ''
                                                };
                                                setGridTalents(newGridTalents);
                                                
                                                // Exit add mode
                                                const newAddingState = { ...addingNewTalent };
                                                delete newAddingState[boxIndex];
                                                setAddingNewTalent(newAddingState);
                                              } catch (err) {
                                                console.error('Unexpected error:', err);
                                                alert('Failed to save talent');
                                              }
                                            }}
                                            className="flex-1 px-2 py-1 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700"
                                          >
                                            Save
                                          </button>
                                          <button
                                            onClick={() => {
                                              const newAddingState = { ...addingNewTalent };
                                              delete newAddingState[boxIndex];
                                              setAddingNewTalent(newAddingState);
                                            }}
                                            className="flex-1 px-2 py-1 bg-gray-400 text-white rounded text-xs font-semibold hover:bg-gray-500"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      )}
                                      
                                      {/* Unmerge button - only show for merged boxes */}
                                      {isMergedLead && (
                                        <button
                                          onClick={handleUnmerge}
                                          className="px-2 py-1 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700"
                                          style={{ position: 'absolute', bottom: '4px', right: '4px' }}
                                        >
                                          Unmerge
                                        </button>
                                      )}
                                      </div>
                                    )}
                                  </td>
                                  {colIndex < 3 && (
                                    <td key={`force-hspacer-${colIndex}`} style={{ width: '24px', textAlign: 'center', background: 'transparent', border: 'none', padding: 0 }} />
                                  )}
                                </>
                              );
                            })}
                          </tr>
                        ));
                        })()}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ marginTop: '14px', padding: '10px', border: '1px solid #90caf9', borderRadius: '6px', background: '#f8fbff' }}>
                    <div style={{ fontWeight: 700, color: '#1976d2', marginBottom: '8px' }}>Link Editor (fallback)</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <label style={{ fontSize: '0.9rem', color: '#0d47a1' }}>Cell</label>
                      <select
                        value={String(forceLinkEditorIndex)}
                        onChange={(e) => setForceLinkEditorIndex(parseInt(e.target.value, 10) || 0)}
                        style={{ minWidth: '260px', border: '1px solid #64b5f6', borderRadius: '4px', padding: '2px 6px' }}
                      >
                        {Array.from({ length: 16 }, (_, idx) => {
                          const row = Math.floor(idx / 4) + 2;
                          const col = (idx % 4) + 1;
                          const talentName = gridTalents[idx]?.name || '(empty)';
                          return (
                            <option key={`force-link-cell-${idx}`} value={idx}>
                              {`Row ${row}, Col ${col} - ${talentName}`}
                            </option>
                          );
                        })}
                      </select>

                      {['up', 'down', 'left', 'right'].map((direction) => (
                        <label key={`fallback-link-${direction}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', color: '#0d47a1' }}>
                          <input
                            type="checkbox"
                            checked={gridCheckboxLinks[forceLinkEditorIndex]?.[direction] || false}
                            onChange={(e) => {
                              const newLinks = [...gridCheckboxLinks];
                              const current = newLinks[forceLinkEditorIndex] || { up: false, down: false, left: false, right: false };
                              newLinks[forceLinkEditorIndex] = { ...current, [direction]: e.target.checked };
                              setGridCheckboxLinks(newLinks);
                            }}
                          />
                          {direction.charAt(0).toUpperCase() + direction.slice(1)}
                        </label>
                      ))}
                    </div>
                    <div style={{ marginTop: '6px', fontSize: '0.8rem', color: '#546e7a' }}>
                      Use this when the edge checkbox is hard to click. It edits the same saved link flags.
                    </div>
                  </div>
                  
                  {/* Save Force Tree Button */}
                  <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={handleSaveForceTree}
                      className="px-8 py-3 bg-green-600 text-white rounded font-bold hover:bg-green-700 transition text-lg"
                    >
                      {selectedForceTreeId === '__new__' ? 'Save Force Tree' : 'Update Force Tree'}
                    </button>
                    {selectedForceTreeId !== '__new__' && (
                      <button
                        onClick={handleDeleteForceTree}
                        className="px-8 py-3 bg-red-600 text-white rounded font-bold hover:bg-red-700 transition text-lg"
                      >
                        Delete
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowAddForceTreeForm(false);
                        resetForceTreeForm();
                      }}
                      className="px-8 py-3 bg-gray-400 text-white rounded font-bold hover:bg-gray-500 transition text-lg"
                    >
                      Cancel
                    </button>
                  </div>
                  
                  {/* Merge Confirmation Dialog */}
                  {mergePending && (
                    <>
                      <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 999
                      }} />
                      <div style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: 'white',
                        border: '2px solid #1976d2',
                        borderRadius: '8px',
                        padding: '20px',
                        zIndex: 1000,
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                        minWidth: '300px'
                      }}>
                        <h3 style={{ marginTop: 0, color: '#1976d2', fontSize: '1.2rem' }}>Merge Talents?</h3>
                        <p>These horizontally adjacent boxes have the same talent. Would you like to merge them?</p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setMergePending(null)}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#e0e0e0',
                              border: '1px solid #999',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: 'bold'
                            }}
                          >
                            No
                          </button>
                          <button
                            onClick={() => {
                              setMergedBoxes({
                                ...mergedBoxes,
                                [mergePending.mergeKey]: true
                              });
                              setMergePending(null);
                            }}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#1976d2',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: 'bold'
                            }}
                          >
                            Yes, Merge
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={speciesDescription}
                        onChange={(e) => setSpeciesDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        rows={4}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Brawn</label>
                        <input
                          type="number"
                          value={speciesBrawn}
                          onChange={(e) => setSpeciesBrawn(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Agility</label>
                        <input
                          type="number"
                          value={speciesAgility}
                          onChange={(e) => setSpeciesAgility(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Intellect</label>
                        <input
                          type="number"
                          value={speciesIntellect}
                          onChange={(e) => setSpeciesIntellect(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cunning</label>
                        <input
                          type="number"
                          value={speciesCunning}
                          onChange={(e) => setSpeciesCunning(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Willpower</label>
                        <input
                          type="number"
                          value={speciesWillpower}
                          onChange={(e) => setSpeciesWillpower(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Presence</label>
                        <input
                          type="number"
                          value={speciesPresence}
                          onChange={(e) => setSpeciesPresence(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Wound</label>
                        <input
                          type="number"
                          value={speciesWound}
                          onChange={(e) => setSpeciesWound(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Strain</label>
                        <input
                          type="number"
                          value={speciesStrain}
                          onChange={(e) => setSpeciesStrain(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Race Attack</label>
                        <input
                          type="text"
                          value={speciesRaceAttack}
                          onChange={(e) => setSpeciesRaceAttack(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">EXP</label>
                        <input
                          type="number"
                          value={speciesEXP}
                          onChange={(e) => setSpeciesEXP(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Talents</label>
                      <div className="space-y-2">
                        {/* Selected talents as tags */}
                        {speciesTalents.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {speciesTalents.map((talent, index) => (
                              <div
                                key={index}
                                className="inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                              >
                                <span>{talent}</span>
                                <button
                                  onClick={() => handleRemoveTalent(talent)}
                                  className="ml-2 text-green-600 hover:text-green-800 font-bold"
                                  type="button"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Dropdown to add more talents */}
                        <select
                          onChange={(e) => {
                            handleAddTalent(e.target.value);
                            e.target.value = '';
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                          value=""
                        >
                          <option value="">-- Select a talent to add --</option>
                          {availableTalents
                            .filter(talent => !speciesTalents.includes(talent))
                            .map((talent, index) => (
                              <option key={index} value={talent}>
                                {talent}
                              </option>
                            ))}
                        </select>
                      </div>
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

                    <div className="flex gap-3 flex-wrap">
                      <button
                        onClick={handleSaveSpecies}
                        className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition shadow-lg"
                      >
                        {editingSpeciesId ? 'Update Species' : 'Save Species'}
                      </button>
                      {editingSpeciesId && (
                        <button
                          onClick={handleDeleteSpecies}
                          className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition shadow-lg"
                        >
                          Delete Species
                        </button>
                      )}
                    </div>
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

                    <div className="flex gap-3 flex-wrap">
                      <button
                        onClick={handleSaveCareer}
                        disabled={savingCareer}
                        className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-60 transition shadow-lg"
                      >
                        {savingCareer ? 'Saving...' : (editingCareerId ? 'Update Career' : 'Save Career')}
                      </button>
                      {editingCareerId && (
                        <button
                          onClick={handleDeleteCareer}
                          className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition shadow-lg"
                        >
                          Delete Career
                        </button>
                      )}
                    </div>
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
                                          />
                                        )}
                                        {isVerticalSpace && (
                                          <input
                                            type="checkbox"
                                            checked={specTalentLinks[`${adjustedRowIndex}_${talentIndex}_down`] || false}
                                            onChange={(e) => handleLinkChange(`${adjustedRowIndex}_${talentIndex}_down`, e.target.checked)}
                                            className="cursor-pointer"
                                            style={{ width: '16px', height: '16px' }}
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
                      <div className="mt-4 flex gap-3 flex-wrap">
                        <button
                          onClick={() => editingSpecId ? handleSaveSpecialization({ updateSpec: true, specIdOverride: editingSpecId }) : handleSaveSpecialization()}
                          disabled={savingSpec}
                          className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition shadow-lg"
                        >
                          {savingSpec ? 'Saving...' : (editingSpecId ? 'Update Specialization' : 'Save Specialization')}
                        </button>
                        {editingSpecId && (
                          <button
                            onClick={handleDeleteSpecialization}
                            className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition shadow-lg"
                          >
                            Delete Specialization
                          </button>
                        )}
                      </div>
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
                  <div className="mb-4 p-3 bg-white border border-gray-300 rounded">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Existing Equipment</label>
                    <select
                      value={selectedSwEquipmentId}
                      onChange={(e) => handleSelectEquipment(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    >
                      <option value="__new__">-- Create New Equipment --</option>
                      {existingSwEquipment
                        .slice()
                        .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                        .map((item) => (
                          <option key={item.id} value={String(item.id)}>{item.name}</option>
                        ))}
                    </select>
                  </div>
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
                      {selectedSwEquipmentId !== '__new__' ? 'Update Equipment' : 'Save Equipment'}
                    </button>
                    {selectedSwEquipmentId !== '__new__' && (
                      <button
                        onClick={handleDeleteEquipment}
                        className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition font-bold"
                      >
                        Delete Equipment
                      </button>
                    )}
                    <button
                      onClick={() => { resetEquipmentForm(); setShowAddEquipmentForm(false); }}
                      className="px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {showAddShipForm && (
                <div className="mt-6 p-6 bg-gray-100 rounded-lg border border-gray-300">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">Add Ship</h3>
                  <div className="mb-4 p-3 bg-white border border-gray-300 rounded">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Existing Ship</label>
                    <select
                      value={selectedSwShipId}
                      onChange={(e) => handleSelectShip(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    >
                      <option value="__new__">-- Create New Ship --</option>
                      {existingSwShips
                        .slice()
                        .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
                        .map((item) => (
                          <option key={item.id} value={String(item.id)}>{item.name}</option>
                        ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={shipName}
                        onChange={(e) => setShipName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hull Type/Class</label>
                      <input
                        type="text"
                        value={shipClass}
                        onChange={(e) => setShipClass(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Silhouette</label>
                      <input
                        type="number"
                        value={shipSilhouette}
                        onChange={(e) => setShipSilhouette(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Speed</label>
                      <input
                        type="number"
                        value={shipSpeed}
                        onChange={(e) => setShipSpeed(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Handling</label>
                      <input
                        type="number"
                        value={shipHandling}
                        onChange={(e) => setShipHandling(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Armor</label>
                      <input
                        type="number"
                        value={shipArmor}
                        onChange={(e) => setShipArmor(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Defence Fore</label>
                      <input
                        type="number"
                        value={shipDefenceFore}
                        onChange={(e) => setShipDefenceFore(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Defence Port</label>
                      <input
                        type="number"
                        value={shipDefencePort}
                        onChange={(e) => setShipDefencePort(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Defence Starboard</label>
                      <input
                        type="number"
                        value={shipDefenceStarboard}
                        onChange={(e) => setShipDefenceStarboard(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Defence Aft</label>
                      <input
                        type="number"
                        value={shipDefenceAft}
                        onChange={(e) => setShipDefenceAft(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hull Trauma Threshold</label>
                      <input
                        type="number"
                        min="0"
                        value={shipHullThreshold}
                        onChange={(e) => setShipHullThreshold(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">System Strain Threshold</label>
                      <input
                        type="number"
                        min="0"
                        value={shipSystemThreshold}
                        onChange={(e) => setShipSystemThreshold(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                      <input
                        type="text"
                        value={shipManufacturer}
                        onChange={(e) => setShipManufacturer(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hyperdrive Primary</label>
                      <input
                        type="text"
                        value={shipHyperdrivePrimary}
                        onChange={(e) => setShipHyperdrivePrimary(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hyperdrive Backup</label>
                      <input
                        type="text"
                        value={shipHyperdriveBackup}
                        onChange={(e) => setShipHyperdriveBackup(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Navicomputer</label>
                      <input
                        type="text"
                        value={shipNavicomputer}
                        onChange={(e) => setShipNavicomputer(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sensor Range</label>
                      <input
                        type="text"
                        value={shipSensorRange}
                        onChange={(e) => setShipSensorRange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ship's Complement</label>
                      <input
                        type="text"
                        value={shipComplement}
                        onChange={(e) => setShipComplement(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Encumbrance Capacity</label>
                      <input
                        type="text"
                        value={shipEncumbranceCapacity}
                        onChange={(e) => setShipEncumbranceCapacity(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Passenger Capacity</label>
                      <input
                        type="text"
                        value={shipPassengerCapacity}
                        onChange={(e) => setShipPassengerCapacity(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Consumables</label>
                      <input
                        type="text"
                        value={shipConsumables}
                        onChange={(e) => setShipConsumables(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price (Credits)</label>
                      <input
                        type="number"
                        min="0"
                        value={shipPriceCredits}
                        onChange={(e) => setShipPriceCredits(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rarity</label>
                      <input
                        type="number"
                        min="0"
                        value={shipRarity}
                        onChange={(e) => setShipRarity(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Customization Hard Points</label>
                      <input
                        type="number"
                        min="0"
                        value={shipCustomizationHardPoints}
                        onChange={(e) => setShipCustomizationHardPoints(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                      <input
                        type="text"
                        value={shipSource}
                        onChange={(e) => setShipSource(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Weapons</label>
                      <textarea
                        value={shipWeapons}
                        onChange={(e) => setShipWeapons(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={shipDescription}
                        onChange={(e) => setShipDescription(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3 flex-wrap">
                    <button
                      onClick={handleSaveShip}
                      className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition font-bold"
                    >
                      {selectedSwShipId !== '__new__' ? 'Update Ship' : 'Save Ship'}
                    </button>
                    {selectedSwShipId !== '__new__' && (
                      <button
                        onClick={handleDeleteShip}
                        className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition font-bold"
                      >
                        Delete Ship
                      </button>
                    )}
                    <button
                      onClick={() => { resetShipForm(); setShowAddShipForm(false); }}
                      className="px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}