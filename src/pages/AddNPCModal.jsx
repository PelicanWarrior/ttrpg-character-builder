import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function AddNPCModal({ isOpen, onClose, onSave, campaignId }) {
  const [npcName, setNpcName] = useState('');
  const [npcRaceId, setNpcRaceId] = useState('');
  const [npcDescription, setNpcDescription] = useState('');
  const [npcBrawn, setNpcBrawn] = useState('');
  const [npcCunning, setNpcCunning] = useState('');
  const [npcPresence, setNpcPresence] = useState('');
  const [npcAgility, setNpcAgility] = useState('');
  const [npcIntellect, setNpcIntellect] = useState('');
  const [npcWillpower, setNpcWillpower] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedAbilities, setSelectedAbilities] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const [npcPlaceId, setNpcPlaceId] = useState('');
  const [saving, setSaving] = useState(false);
  const [raceList, setRaceList] = useState([]);
  const [skillsList, setSkillsList] = useState([]);
  const [abilitiesList, setAbilitiesList] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [existingPlaces, setExistingPlaces] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadLists();
    }
  }, [isOpen]);

  const loadLists = async () => {
    try {
      const [racesRes, skillsRes, abilitiesRes, equipmentRes] = await Promise.all([
        supabase.from('races').select('id, name').order('name', { ascending: true }),
        supabase.from('skills').select('id, skill').order('skill'),
        supabase.from('SW_abilities').select('id, ability').order('ability'),
        supabase.from('SW_equipment').select('id, name').order('name'),
      ]);

      if (racesRes.data) setRaceList(racesRes.data);
      if (skillsRes.data) setSkillsList(skillsRes.data);
      if (abilitiesRes.data) setAbilitiesList(abilitiesRes.data);
      if (equipmentRes.data) setEquipmentList(equipmentRes.data);

      // Load places
      if (campaignId) {
        const { data: placesData } = await supabase
          .from('SW_campaign_places')
          .select('id, Place_Name')
          .eq('CampaignID', parseInt(campaignId))
          .order('Place_Name', { ascending: true });
        if (placesData) setExistingPlaces(placesData);
      }
    } catch (err) {
      console.error('Error loading lists:', err);
    }
  };

  const addToList = (item, list, setList) => {
    if (item && !list.includes(item)) {
      setList([...list, item]);
    }
  };

  const removeFromList = (item, list, setList) => {
    setList(list.filter(i => i !== item));
  };

  const resetForm = () => {
    setNpcName('');
    setNpcRaceId('');
    setNpcDescription('');
    setNpcBrawn('');
    setNpcCunning('');
    setNpcPresence('');
    setNpcAgility('');
    setNpcIntellect('');
    setNpcWillpower('');
    setSelectedSkills([]);
    setSelectedAbilities([]);
    setSelectedEquipment([]);
    setNpcPlaceId('');
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
        Brawn: npcBrawn ? parseInt(npcBrawn, 10) : null,
        Cunning: npcCunning ? parseInt(npcCunning, 10) : null,
        Presence: npcPresence ? parseInt(npcPresence, 10) : null,
        Agility: npcAgility ? parseInt(npcAgility, 10) : null,
        Intellect: npcIntellect ? parseInt(npcIntellect, 10) : null,
        Willpower: npcWillpower ? parseInt(npcWillpower, 10) : null,
        Skills: selectedSkills.join(','),
        Abilities: selectedAbilities.join(','),
        Equipment: selectedEquipment.join(','),
        Part_of_Place: npcPlaceId ? parseInt(npcPlaceId, 10) : null,
        CampaignID: campaignId ? parseInt(campaignId, 10) : null,
      };

      const { data: npcData, error } = await supabase
        .from('SW_campaign_NPC')
        .insert([payload])
        .select();

      if (error) {
        console.error('Error saving NPC:', error);
        alert('Failed to save NPC: ' + error.message);
        return;
      }

      const npcId = npcData?.[0]?.id;

      // Save equipment associations
      if (npcId && selectedEquipment.length > 0) {
        try {
          const { data: equipmentData, error: equipError } = await supabase
            .from('SW_equipment')
            .select('id, name')
            .in('name', selectedEquipment);

          if (!equipError && equipmentData) {
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

      alert('NPC saved successfully!');
      resetForm();
      onSave(npcData?.[0]);
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
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#000' }}>Add NPC</h2>
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
          </div>
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

        {/* Part of Place */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>Part of Place</label>
          <select
            value={npcPlaceId}
            onChange={(e) => setNpcPlaceId(e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          >
            <option value="">-- None --</option>
            {existingPlaces.map((p) => (
              <option key={p.id} value={p.id}>{p.Place_Name}</option>
            ))}
          </select>
        </div>
      </div>
      </div>
    </div>
  );
}
