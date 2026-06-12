import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function AddNPCModal({ isOpen, onClose, onSave, campaignId, npcToEdit = null }) {
  const [npcName, setNpcName] = useState('');
  const [npcRaceId, setNpcRaceId] = useState('');
  const [npcDescription, setNpcDescription] = useState('');
  const [npcSoak, setNpcSoak] = useState('');
  const [npcWound, setNpcWound] = useState('');
  const [npcStrain, setNpcStrain] = useState('');
  const [npcBrawn, setNpcBrawn] = useState('');
  const [npcCunning, setNpcCunning] = useState('');
  const [npcPresence, setNpcPresence] = useState('');
  const [npcAgility, setNpcAgility] = useState('');
  const [npcIntellect, setNpcIntellect] = useState('');
  const [npcWillpower, setNpcWillpower] = useState('');
  const [npcForceRating, setNpcForceRating] = useState('0');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedAbilities, setSelectedAbilities] = useState([]);
  const [selectedForceAbilities, setSelectedForceAbilities] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const [showCreateEquipmentBox, setShowCreateEquipmentBox] = useState(false);
  const [newEquipmentName, setNewEquipmentName] = useState('');
  const [newEquipmentDescription, setNewEquipmentDescription] = useState('');
  const [newEquipmentSkillId, setNewEquipmentSkillId] = useState('');
  const [newEquipmentRange, setNewEquipmentRange] = useState('');
  const [newEquipmentEncumbrance, setNewEquipmentEncumbrance] = useState('');
  const [newEquipmentPrice, setNewEquipmentPrice] = useState('');
  const [newEquipmentRarity, setNewEquipmentRarity] = useState('');
  const [newEquipmentDamage, setNewEquipmentDamage] = useState('');
  const [newEquipmentCritical, setNewEquipmentCritical] = useState('');
  const [newEquipmentHP, setNewEquipmentHP] = useState('');
  const [newEquipmentSpecial, setNewEquipmentSpecial] = useState('');
  const [newEquipmentSoak, setNewEquipmentSoak] = useState('');
  const [newEquipmentDefenceRange, setNewEquipmentDefenceRange] = useState('');
  const [newEquipmentDefenceMelee, setNewEquipmentDefenceMelee] = useState('');
  const [newEquipmentConsumable, setNewEquipmentConsumable] = useState(false);
  const [savingEquipment, setSavingEquipment] = useState(false);
  const [pictureId, setPictureId] = useState('');
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [saving, setSaving] = useState(false);
  const [raceList, setRaceList] = useState([]);
  const [skillsList, setSkillsList] = useState([]);
  const [abilitiesList, setAbilitiesList] = useState([]);
  const [forceTalentsList, setForceTalentsList] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadLists();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (!npcToEdit) {
      setNpcName('');
      setNpcRaceId('');
      setNpcDescription('');
      setNpcSoak('');
      setNpcWound('');
      setNpcStrain('');
      setNpcBrawn('');
      setNpcCunning('');
      setNpcPresence('');
      setNpcAgility('');
      setNpcIntellect('');
      setNpcWillpower('');
      setNpcForceRating('0');
      setSelectedSkills([]);
      setSelectedAbilities([]);
      setSelectedForceAbilities([]);
      setSelectedEquipment([]);
      setPictureId('');
      setShowCreateEquipmentBox(false);
      setNewEquipmentName('');
      setNewEquipmentDescription('');
      setNewEquipmentSkillId('');
      setNewEquipmentRange('');
      setNewEquipmentEncumbrance('');
      setNewEquipmentPrice('');
      setNewEquipmentRarity('');
      setNewEquipmentDamage('');
      setNewEquipmentCritical('');
      setNewEquipmentHP('');
      setNewEquipmentSpecial('');
      setNewEquipmentSoak('');
      setNewEquipmentDefenceRange('');
      setNewEquipmentDefenceMelee('');
      setNewEquipmentConsumable(false);
      return;
    }

    setNpcName(npcToEdit.Name || '');
    setNpcRaceId(npcToEdit.Race ? String(npcToEdit.Race) : '');
    setNpcDescription(npcToEdit.Description || '');
    setNpcSoak(npcToEdit.Soak != null ? String(npcToEdit.Soak) : '');
    setNpcWound(npcToEdit.Wound != null ? String(npcToEdit.Wound) : '');
    setNpcStrain(npcToEdit.Strain != null ? String(npcToEdit.Strain) : '');
    setNpcBrawn(npcToEdit.Brawn != null ? String(npcToEdit.Brawn) : '');
    setNpcCunning(npcToEdit.Cunning != null ? String(npcToEdit.Cunning) : '');
    setNpcPresence(npcToEdit.Presence != null ? String(npcToEdit.Presence) : '');
    setNpcAgility(npcToEdit.Agility != null ? String(npcToEdit.Agility) : '');
    setNpcIntellect(npcToEdit.Intellect != null ? String(npcToEdit.Intellect) : '');
    setNpcWillpower(npcToEdit.Willpower != null ? String(npcToEdit.Willpower) : '');
    setNpcForceRating(npcToEdit.Force_Rating != null ? String(npcToEdit.Force_Rating) : '0');
    setSelectedSkills(npcToEdit.Skills ? String(npcToEdit.Skills).split(',').map((item) => item.trim()).filter(Boolean) : []);
    setSelectedAbilities(npcToEdit.Abilities ? String(npcToEdit.Abilities).split(',').map((item) => item.trim()).filter(Boolean) : []);
    setSelectedForceAbilities(npcToEdit.Force_Abilities ? String(npcToEdit.Force_Abilities).split(',').map((item) => item.trim()).filter(Boolean) : []);
    setSelectedEquipment(npcToEdit.Equipment ? String(npcToEdit.Equipment).split(',').map((item) => item.trim()).filter(Boolean) : []);
    setPictureId(npcToEdit.PictureID != null ? String(npcToEdit.PictureID) : '');
    setShowCreateEquipmentBox(false);
    setNewEquipmentName('');
    setNewEquipmentDescription('');
    setNewEquipmentSkillId('');
    setNewEquipmentRange('');
    setNewEquipmentEncumbrance('');
    setNewEquipmentPrice('');
    setNewEquipmentRarity('');
    setNewEquipmentDamage('');
    setNewEquipmentCritical('');
    setNewEquipmentHP('');
    setNewEquipmentSpecial('');
    setNewEquipmentSoak('');
    setNewEquipmentDefenceRange('');
    setNewEquipmentDefenceMelee('');
    setNewEquipmentConsumable(false);
  }, [isOpen, npcToEdit]);

  const loadLists = async () => {
    try {
      const [racesRes, skillsRes, abilitiesRes, forceTalentsRes, equipmentRes] = await Promise.all([
        supabase.from('races').select('id, name').order('name', { ascending: true }),
        supabase.from('skills').select('id, skill').order('skill'),
        supabase.from('SW_abilities').select('id, ability').order('ability'),
        supabase.from('SW_force_talents').select('id, talent_name').order('talent_name'),
        supabase.from('SW_equipment').select('id, name').order('name'),
      ]);

      if (racesRes.data) setRaceList(racesRes.data);
      if (skillsRes.data) setSkillsList(skillsRes.data);
      if (abilitiesRes.data) setAbilitiesList(abilitiesRes.data);
      if (forceTalentsRes.data) setForceTalentsList(forceTalentsRes.data);
      if (equipmentRes.data) setEquipmentList(equipmentRes.data);
    } catch (err) {
      console.error('Error loading lists:', err);
    }
  };

  const addToList = (item, list, setList) => {
    if (!item) return;
    setList([...list, item]);
  };

  const removeFromList = (item, list, setList) => {
    const index = list.indexOf(item);
    if (index === -1) return;
    setList([...list.slice(0, index), ...list.slice(index + 1)]);
  };

  const resetForm = () => {
    setNpcName('');
    setNpcRaceId('');
    setNpcDescription('');
    setNpcSoak('');
    setNpcWound('');
    setNpcStrain('');
    setNpcBrawn('');
    setNpcCunning('');
    setNpcPresence('');
    setNpcAgility('');
    setNpcIntellect('');
    setNpcWillpower('');
    setNpcForceRating('0');
    setSelectedSkills([]);
    setSelectedAbilities([]);
    setSelectedForceAbilities([]);
    setSelectedEquipment([]);
    setPictureId('');
    resetEquipmentCreateForm();
  };

  const handleUploadNpcPicture = async () => {
    const editingNpcId = npcToEdit?.id;

    if (!editingNpcId) {
      alert('Save the NPC before uploading a picture.');
      return;
    }

    try {
      const { data: userData, error: userError } = await supabase
        .from('user')
        .select('id')
        .eq('username', localStorage.getItem('username') || '')
        .single();

      if (userError || !userData?.id) {
        throw new Error('Failed to determine current user for upload.');
      }

      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.png';
      fileInput.onchange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.png')) {
          alert('Please select a PNG file');
          return;
        }

        setUploadingPicture(true);

        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('npcId', String(editingNpcId));
          formData.append('userId', String(userData.id));

          const uploadResponse = await fetch('/SW_Pictures/api/upload-npc-picture', {
            method: 'POST',
            body: formData,
          });

          const responseData = await uploadResponse.json().catch(() => null);

          if (!uploadResponse.ok) {
            throw new Error(responseData?.error || uploadResponse.statusText || 'Upload failed');
          }

          setPictureId(responseData?.pictureId != null ? String(responseData.pictureId) : pictureId);
          if (responseData?.pictureId != null) {
            onSave?.({ ...npcToEdit, PictureID: responseData.pictureId });
          }
          alert('NPC picture uploaded successfully!');
        } catch (err) {
          console.error('Error uploading NPC picture:', err);
          if (err instanceof TypeError && String(err.message || '').toLowerCase().includes('fetch')) {
            alert('Could not reach the upload server. Please ensure backend is running on port 3001.');
          } else {
            alert('Error uploading NPC picture: ' + (err.message || 'Unknown error'));
          }
        } finally {
          setUploadingPicture(false);
        }
      };

      fileInput.click();
    } catch (err) {
      alert(err.message || 'Failed to prepare NPC upload');
    }
  };

  const resetEquipmentCreateForm = () => {
    setShowCreateEquipmentBox(false);
    setNewEquipmentName('');
    setNewEquipmentDescription('');
    setNewEquipmentSkillId('');
    setNewEquipmentRange('');
    setNewEquipmentEncumbrance('');
    setNewEquipmentPrice('');
    setNewEquipmentRarity('');
    setNewEquipmentDamage('');
    setNewEquipmentCritical('');
    setNewEquipmentHP('');
    setNewEquipmentSpecial('');
    setNewEquipmentSoak('');
    setNewEquipmentDefenceRange('');
    setNewEquipmentDefenceMelee('');
    setNewEquipmentConsumable(false);
  };

  const handleCreateEquipment = async () => {
    if (!newEquipmentName.trim()) {
      alert('Equipment name is required');
      return;
    }

    setSavingEquipment(true);

    try {
      const payload = {
        name: newEquipmentName.trim(),
        description: newEquipmentDescription.trim(),
        skill: newEquipmentSkillId ? parseInt(newEquipmentSkillId, 10) : null,
        range: newEquipmentRange.trim(),
        encumbrance: newEquipmentEncumbrance ? parseInt(newEquipmentEncumbrance, 10) : null,
        price: newEquipmentPrice ? parseInt(newEquipmentPrice, 10) : null,
        rarity: newEquipmentRarity ? parseInt(newEquipmentRarity, 10) : null,
        damage: newEquipmentDamage ? parseInt(newEquipmentDamage, 10) : null,
        critical: newEquipmentCritical ? parseInt(newEquipmentCritical, 10) : null,
        HP: newEquipmentHP ? parseInt(newEquipmentHP, 10) : null,
        special: newEquipmentSpecial.trim(),
        soak: newEquipmentSoak ? parseInt(newEquipmentSoak, 10) : null,
        defence_range: newEquipmentDefenceRange !== '' ? parseInt(newEquipmentDefenceRange, 10) : null,
        defence_melee: newEquipmentDefenceMelee !== '' ? parseInt(newEquipmentDefenceMelee, 10) : null,
        consumable: newEquipmentConsumable,
      };

      const { data, error } = await supabase
        .from('SW_equipment')
        .insert([payload])
        .select('id, name')
        .single();

      if (error || !data) {
        console.error('Error saving equipment:', error);
        alert('Failed to save equipment');
        return;
      }

      setEquipmentList((prev) => [...prev, data].sort((left, right) => (left.name || '').localeCompare(right.name || '')));
      setSelectedEquipment((prev) => [...prev, data.name]);
      resetEquipmentCreateForm();
    } catch (err) {
      console.error('Unexpected error saving equipment:', err);
      alert('Failed to save equipment');
    } finally {
      setSavingEquipment(false);
    }
  };

  const handleSave = async () => {
    if (!npcName.trim()) {
      alert('NPC Name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        Name: npcName.trim(),
        Race: npcRaceId ? parseInt(npcRaceId, 10) : null,
        Description: npcDescription.trim(),
        Soak: npcSoak ? parseInt(npcSoak, 10) : 0,
        Wound: npcWound ? parseInt(npcWound, 10) : 0,
        Strain: npcStrain ? parseInt(npcStrain, 10) : 0,
        Brawn: npcBrawn ? parseInt(npcBrawn, 10) : null,
        Cunning: npcCunning ? parseInt(npcCunning, 10) : null,
        Presence: npcPresence ? parseInt(npcPresence, 10) : null,
        Agility: npcAgility ? parseInt(npcAgility, 10) : null,
        Intellect: npcIntellect ? parseInt(npcIntellect, 10) : null,
        Willpower: npcWillpower ? parseInt(npcWillpower, 10) : null,
        Force_Rating: npcForceRating ? parseInt(npcForceRating, 10) : 0,
        Skills: selectedSkills.join(','),
        Abilities: selectedAbilities.join(','),
        Force_Abilities: selectedForceAbilities.join(','),
        Equipment: selectedEquipment.join(','),
        CampaignID: campaignId ? parseInt(campaignId, 10) : null,
      };

      let npcResult = null;
      let error = null;

      if (npcToEdit?.id) {
        ({ data: npcResult, error } = await supabase
          .from('SW_campaign_NPC')
          .update(payload)
          .eq('id', npcToEdit.id)
          .select()
          .single());
      } else {
        ({ data: npcResult, error } = await supabase
          .from('SW_campaign_NPC')
          .insert([payload])
          .select()
          .single());
      }

      if (error) {
        console.error('Error saving NPC:', error);
        alert('Failed to save NPC: ' + error.message);
        return;
      }

      const savedNpc = npcResult || null;
      const npcId = savedNpc?.id;

      // Save equipment associations
      if (npcId) {
        try {
          await supabase
            .from('SW_campaign_npc_equipment')
            .delete()
            .eq('npcID', npcId);

          const { data: equipmentData, error: equipError } = await supabase
            .from('SW_equipment')
            .select('id, name')
            .in('name', selectedEquipment);

          if (!equipError && equipmentData && selectedEquipment.length > 0) {
            const equipmentRecords = equipmentData.map(e => ({
              npcID: npcId,
              equipmentID: e.id,
            }));

            const { error: linkError } = await supabase
              .from('SW_campaign_npc_equipment')
              .insert(equipmentRecords);

            if (linkError) {
              console.error('Error saving equipment links:', linkError);
              alert('NPC saved but failed to link equipment: ' + linkError.message);
              return;
            }
          }
        } catch (equipErr) {
          console.error('Error linking equipment:', equipErr);
          alert('NPC saved but failed to link equipment');
          return;
        }
      }

      alert(npcToEdit?.id ? 'NPC updated successfully!' : 'NPC saved successfully!');
      resetForm();
      onSave(savedNpc);
      onClose();
    } catch (err) {
      console.error('Error saving NPC:', err);
      alert('Failed to save NPC');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'white',
        border: '3px solid black',
        borderRadius: '10px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        zIndex: 9999,
        maxWidth: '600px',
        width: '90vw',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        pointerEvents: 'auto',
      }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{ padding: '24px', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#000' }}>{npcToEdit?.id ? 'Edit NPC' : 'Add NPC'}</h2>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 10000,
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#dc2626',
              backgroundColor: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            ×
          </button>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1,
              padding: '8px 12px',
              backgroundColor: '#a855f7',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '12px',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            style={{
              flex: 1,
              padding: '8px 12px',
              backgroundColor: '#9ca3af',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '12px',
            }}
          >
            Cancel
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px', paddingRight: '16px', minHeight: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px', marginTop: '16px' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Face Picture</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {pictureId && Number(pictureId) > 0 ? (
              <img
                src={`/SW_Pictures/Picture ${pictureId} Face.png?t=${Date.now()}`}
                alt="NPC face"
                style={{ width: '96px', height: '96px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ccc' }}
              />
            ) : (
              <div style={{ width: '96px', height: '96px', borderRadius: '8px', border: '1px dashed #9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '12px' }}>
                No face picture
              </div>
            )}
            <button
              type="button"
              onClick={handleUploadNpcPicture}
              disabled={!npcToEdit?.id || uploadingPicture}
              style={{ padding: '8px 12px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: npcToEdit?.id ? 'pointer' : 'not-allowed', fontWeight: 'bold', opacity: !npcToEdit?.id || uploadingPicture ? 0.6 : 1 }}
            >
              {uploadingPicture ? 'Uploading...' : 'Upload Face Picture'}
            </button>
            {!npcToEdit?.id && <span style={{ fontSize: '12px', color: '#6b7280' }}>Save the NPC first, then upload the face picture.</span>}
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>NPC Name</label>
          <input
            type="text"
            value={npcName}
            onChange={(e) => setNpcName(e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Force Rating</label>
          <input
            type="number"
            min="0"
            value={npcForceRating}
            onChange={(e) => setNpcForceRating(e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Race</label>
          <select
            value={npcRaceId}
            onChange={(e) => setNpcRaceId(e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          >
            <option value="">-- Select Race --</option>
            {raceList.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Description</label>
          <textarea
            value={npcDescription}
            onChange={(e) => setNpcDescription(e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', minHeight: '80px', fontFamily: 'inherit' }}
          />
        </div>

        {/* Attributes */}
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Brawn</label>
          <input type="number" value={npcBrawn} onChange={(e) => setNpcBrawn(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Cunning</label>
          <input type="number" value={npcCunning} onChange={(e) => setNpcCunning(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Presence</label>
          <input type="number" value={npcPresence} onChange={(e) => setNpcPresence(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Agility</label>
          <input type="number" value={npcAgility} onChange={(e) => setNpcAgility(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Intellect</label>
          <input type="number" value={npcIntellect} onChange={(e) => setNpcIntellect(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Willpower</label>
          <input type="number" value={npcWillpower} onChange={(e) => setNpcWillpower(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Soak</label>
          <input
            type="number"
            min="0"
            value={npcSoak}
            onChange={(e) => setNpcSoak(e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Wound Threshold</label>
          <input
            type="number"
            min="0"
            value={npcWound}
            onChange={(e) => setNpcWound(e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Strain Threshold</label>
          <input
            type="number"
            min="0"
            value={npcStrain}
            onChange={(e) => setNpcStrain(e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>

        {/* Skills multi-select */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Skills</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <select id="npc-skill-select" style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
              <option value="">-- Select Skill --</option>
              {skillsList.map((s) => (
                <option key={s.id} value={s.skill}>{s.skill}</option>
              ))}
            </select>
            <button
              onClick={() => {
                const el = document.getElementById('npc-skill-select');
                addToList(el.value, selectedSkills, setSelectedSkills);
              }}
              style={{ padding: '8px 12px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >Add</button>
          </div>
          {selectedSkills.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {selectedSkills.map((s, idx) => (
                <span key={`skill-${idx}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', fontSize: '12px', backgroundColor: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd', borderRadius: '4px' }}>
                  {s}
                  <button onClick={() => removeFromList(s, selectedSkills, setSelectedSkills)} style={{ color: '#1e40af', cursor: 'pointer', border: 'none', background: 'none', fontSize: '16px' }}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Abilities multi-select */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Abilities</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <select id="npc-ability-select" style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
              <option value="">-- Select Ability --</option>
              {abilitiesList.map((a) => (
                <option key={a.id} value={a.ability}>{a.ability}</option>
              ))}
            </select>
            <button
              onClick={() => {
                const el = document.getElementById('npc-ability-select');
                addToList(el.value, selectedAbilities, setSelectedAbilities);
              }}
              style={{ padding: '8px 12px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >Add</button>
          </div>
          {selectedAbilities.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {selectedAbilities.map((a, idx) => (
                <span key={`ability-${idx}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', fontSize: '12px', backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #86efac', borderRadius: '4px' }}>
                  {a}
                  <button onClick={() => removeFromList(a, selectedAbilities, setSelectedAbilities)} style={{ color: '#15803d', cursor: 'pointer', border: 'none', background: 'none', fontSize: '16px' }}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Equipment multi-select */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Force Abilities</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <select id="npc-force-ability-select" style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
              <option value="">-- Select Force Ability --</option>
              {forceTalentsList.map((a) => (
                <option key={a.id} value={a.talent_name}>{a.talent_name}</option>
              ))}
            </select>
            <button
              onClick={() => {
                const el = document.getElementById('npc-force-ability-select');
                addToList(el.value, selectedForceAbilities, setSelectedForceAbilities);
              }}
              style={{ padding: '8px 12px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >Add</button>
          </div>
          {selectedForceAbilities.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {selectedForceAbilities.map((a, idx) => (
                <span key={`force-ability-${idx}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', fontSize: '12px', backgroundColor: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe', borderRadius: '4px' }}>
                  {a}
                  <button onClick={() => removeFromList(a, selectedForceAbilities, setSelectedForceAbilities)} style={{ color: '#3730a3', cursor: 'pointer', border: 'none', background: 'none', fontSize: '16px' }}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Equipment multi-select */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Equipment</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <select id="npc-equipment-select" style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
              <option value="">-- Select Equipment --</option>
              {equipmentList.map((e) => (
                <option key={e.id} value={e.name}>{e.name}</option>
              ))}
            </select>
            <button
              onClick={() => {
                const el = document.getElementById('npc-equipment-select');
                addToList(el.value, selectedEquipment, setSelectedEquipment);
              }}
              style={{ padding: '8px 12px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >Add</button>
            <button
              type="button"
              onClick={() => setShowCreateEquipmentBox((prev) => !prev)}
              style={{ padding: '8px 12px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {showCreateEquipmentBox ? 'Cancel' : 'Create'}
            </button>
          </div>
          {showCreateEquipmentBox && (
            <div style={{ marginBottom: '12px', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Name</label>
                  <input type="text" value={newEquipmentName} onChange={(e) => setNewEquipmentName(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Skill</label>
                  <select value={newEquipmentSkillId} onChange={(e) => setNewEquipmentSkillId(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
                    <option value="">-- Select Skill --</option>
                    {skillsList.map((skill) => (
                      <option key={skill.id} value={skill.id}>{skill.skill}</option>
                    ))}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Description</label>
                  <textarea value={newEquipmentDescription} onChange={(e) => setNewEquipmentDescription(e.target.value)} rows={3} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontFamily: 'inherit' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Range</label>
                  <select value={newEquipmentRange} onChange={(e) => setNewEquipmentRange(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
                    <option value="">-- Select range --</option>
                    <option value="Engaged">Engaged</option>
                    <option value="Short">Short</option>
                    <option value="Medium">Medium</option>
                    <option value="Long">Long</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Encumbrance</label>
                  <input type="number" min="0" value={newEquipmentEncumbrance} onChange={(e) => setNewEquipmentEncumbrance(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Price</label>
                  <input type="number" min="0" value={newEquipmentPrice} onChange={(e) => setNewEquipmentPrice(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Rarity</label>
                  <input type="number" min="0" value={newEquipmentRarity} onChange={(e) => setNewEquipmentRarity(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Damage</label>
                  <input type="number" value={newEquipmentDamage} onChange={(e) => setNewEquipmentDamage(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Critical</label>
                  <input type="number" min="0" value={newEquipmentCritical} onChange={(e) => setNewEquipmentCritical(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>HP</label>
                  <input type="number" min="0" value={newEquipmentHP} onChange={(e) => setNewEquipmentHP(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Soak</label>
                  <input type="number" min="0" value={newEquipmentSoak} onChange={(e) => setNewEquipmentSoak(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Defence Range</label>
                  <input type="number" min="0" value={newEquipmentDefenceRange} onChange={(e) => setNewEquipmentDefenceRange(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Defence Melee</label>
                  <input type="number" min="0" value={newEquipmentDefenceMelee} onChange={(e) => setNewEquipmentDefenceMelee(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Special</label>
                  <textarea value={newEquipmentSpecial} onChange={(e) => setNewEquipmentSpecial(e.target.value)} rows={2} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', fontFamily: 'inherit' }} />
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" checked={newEquipmentConsumable} onChange={(e) => setNewEquipmentConsumable(e.target.checked)} />
                  <label style={{ fontSize: '14px', fontWeight: '500' }}>Consumable</label>
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleCreateEquipment}
                    disabled={savingEquipment}
                    style={{ padding: '8px 12px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', opacity: savingEquipment ? 0.6 : 1 }}
                  >
                    {savingEquipment ? 'Saving...' : 'Save Equipment'}
                  </button>
                  <button
                    type="button"
                    onClick={resetEquipmentCreateForm}
                    style={{ padding: '8px 12px', backgroundColor: '#9ca3af', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          {selectedEquipment.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {selectedEquipment.map((e, idx) => (
                <span key={`equipment-${idx}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', fontSize: '12px', backgroundColor: '#f3e8ff', color: '#6b21a8', border: '1px solid #e9d5ff', borderRadius: '4px' }}>
                  {e}
                  <button onClick={() => removeFromList(e, selectedEquipment, setSelectedEquipment)} style={{ color: '#6b21a8', cursor: 'pointer', border: 'none', background: 'none', fontSize: '16px' }}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>

      </div>
      </div>
    </div>
  );
}
