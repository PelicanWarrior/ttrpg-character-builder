import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oyqfyjfkqzvatdddngbp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWZ5amZrcXp2YXRkZGRuZ2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDQ0MTcsImV4cCI6MjA3MjcyMDQxN30.1HsQNoFT7VHu1-rFAEOhDRlXYq3SyxhnHcP2whWIVhU';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..');
const inputFilePath = path.join(workspaceRoot, 'TTRPG Rules', 'Escape_from_Mos_Shuuta_Solo_Adventure_Input.txt');

function parseBool(value) {
  return String(value || '').trim().toLowerCase() === 'true';
}

function parseIntSafe(value, fallback = 0) {
  const n = Number.parseInt(String(value || '').trim(), 10);
  return Number.isNaN(n) ? fallback : n;
}

function trimEmptyEdges(lines) {
  const copy = [...lines];
  while (copy.length > 0 && copy[0].trim() === '') copy.shift();
  while (copy.length > 0 && copy[copy.length - 1].trim() === '') copy.pop();
  return copy;
}

function parseAdventureInput(text) {
  const lines = text.replace(/\r/g, '').split('\n');

  const adventure = {
    Title: '',
    Description: '',
    TTRPG: '',
    Is_Published: false,
  };

  for (const line of lines) {
    if (line.startsWith('NODE_KEY:')) break;
    if (line.startsWith('Title:')) adventure.Title = line.slice('Title:'.length).trim();
    if (line.startsWith('Description:')) adventure.Description = line.slice('Description:'.length).trim();
    if (line.startsWith('TTRPG:')) adventure.TTRPG = line.slice('TTRPG:'.length).trim();
    if (line.startsWith('Is_Published:')) adventure.Is_Published = parseBool(line.slice('Is_Published:'.length));
  }

  const nodes = [];
  let i = 0;

  while (i < lines.length) {
    if (!lines[i].startsWith('NODE_KEY:')) {
      i += 1;
      continue;
    }

    const node = {
      NODE_KEY: lines[i].slice('NODE_KEY:'.length).trim(),
      Display_Order: 0,
      Is_Start: false,
      Node_Title: '',
      Node_Content: '',
      choices: [],
    };

    i += 1;

    while (i < lines.length && !lines[i].startsWith('NODE_KEY:')) {
      const raw = lines[i];

      if (raw.startsWith('Display_Order:')) {
        node.Display_Order = parseIntSafe(raw.slice('Display_Order:'.length), 0);
        i += 1;
        continue;
      }

      if (raw.startsWith('Is_Start:')) {
        node.Is_Start = parseBool(raw.slice('Is_Start:'.length));
        i += 1;
        continue;
      }

      if (raw.startsWith('Node_Title:')) {
        node.Node_Title = raw.slice('Node_Title:'.length).trim();
        i += 1;
        continue;
      }

      if (raw.startsWith('Node_Content:')) {
        i += 1;
        const contentLines = [];
        while (i < lines.length && !lines[i].startsWith('Choices:') && !lines[i].startsWith('NODE_KEY:')) {
          contentLines.push(lines[i]);
          i += 1;
        }
        node.Node_Content = trimEmptyEdges(contentLines).join('\n');
        continue;
      }

      if (raw.startsWith('Choices:')) {
        i += 1;

        while (i < lines.length && !lines[i].startsWith('NODE_KEY:')) {
          const choiceLine = lines[i];

          if (!choiceLine.startsWith('- Choice_Text:')) {
            i += 1;
            continue;
          }

          const choice = {
            Choice_Text: choiceLine.slice('- Choice_Text:'.length).trim(),
            Next_Node_Key: '',
            Check_Enabled: false,
            Check_Skill: '',
            Check_Difficulty: 0,
            Failure_Next_Node_Key: '',
            Display_Order: 0,
          };

          i += 1;
          while (i < lines.length) {
            const detailLine = lines[i];
            if (detailLine.startsWith('- Choice_Text:') || detailLine.startsWith('NODE_KEY:')) break;

            const detail = detailLine.trim();
            if (detail.startsWith('Next_Node_Key:')) {
              choice.Next_Node_Key = detail.slice('Next_Node_Key:'.length).trim();
            } else if (detail.startsWith('Check_Enabled:')) {
              choice.Check_Enabled = parseBool(detail.slice('Check_Enabled:'.length));
            } else if (detail.startsWith('Check_Skill:')) {
              choice.Check_Skill = detail.slice('Check_Skill:'.length).trim();
            } else if (detail.startsWith('Check_Difficulty:')) {
              choice.Check_Difficulty = parseIntSafe(detail.slice('Check_Difficulty:'.length), 0);
            } else if (detail.startsWith('Failure_Next_Node_Key:')) {
              choice.Failure_Next_Node_Key = detail.slice('Failure_Next_Node_Key:'.length).trim();
            } else if (detail.startsWith('Display_Order:')) {
              choice.Display_Order = parseIntSafe(detail.slice('Display_Order:'.length), 0);
            }

            i += 1;
          }

          node.choices.push(choice);
          continue;
        }

        continue;
      }

      i += 1;
    }

    nodes.push(node);
  }

  if (!adventure.Title) throw new Error('Could not parse adventure title.');
  if (!adventure.Description) throw new Error('Could not parse adventure description.');
  if (!adventure.TTRPG) throw new Error('Could not parse adventure TTRPG.');
  if (nodes.length === 0) throw new Error('No nodes were parsed from the input file.');

  return { adventure, nodes };
}

async function resolveTtrpgId(preferredName) {
  const { data: swByInitials, error: initialsError } = await supabase
    .from('TTRPGs')
    .select('id, TTRPG_name, Initials')
    .eq('Initials', 'SW')
    .limit(1);

  if (initialsError) throw initialsError;
  if ((swByInitials || []).length > 0) {
    return swByInitials[0].id;
  }

  const nameLike = `%${preferredName}%`;
  const { data: byName, error: nameError } = await supabase
    .from('TTRPGs')
    .select('id, TTRPG_name, Initials')
    .ilike('TTRPG_name', nameLike)
    .order('id', { ascending: true })
    .limit(1);

  if (nameError) throw nameError;
  if ((byName || []).length > 0) {
    return byName[0].id;
  }

  throw new Error(`Could not find a TTRPG row for ${preferredName}.`);
}

async function removeExistingAdventureByTitle(title) {
  const { data, error } = await supabase
    .from('Solo_Adventures')
    .select('id, Title')
    .eq('Title', title)
    .order('id', { ascending: true });

  if (error) throw error;

  const rows = data || [];
  if (rows.length === 0) return 0;

  for (const row of rows) {
    const { error: deleteError } = await supabase
      .from('Solo_Adventures')
      .delete()
      .eq('id', row.id);

    if (deleteError) throw deleteError;
  }

  return rows.length;
}

async function insertAdventure(adventure, ttrpgId) {
  const payload = {
    Title: adventure.Title,
    Description: adventure.Description,
    TTRPG: ttrpgId,
    Is_Published: adventure.Is_Published,
    Created_By: null,
  };

  const { data, error } = await supabase
    .from('Solo_Adventures')
    .insert([payload])
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

async function insertNodes(adventureId, nodes) {
  const nodeIdByKey = {};

  for (const node of nodes) {
    const payload = {
      Adventure_ID: adventureId,
      Node_Title: node.Node_Title,
      Node_Content: node.Node_Content,
      Display_Order: node.Display_Order,
      Is_Start: node.Is_Start,
    };

    const { data, error } = await supabase
      .from('Solo_Adventure_Nodes')
      .insert([payload])
      .select('id')
      .single();

    if (error) throw error;

    nodeIdByKey[node.NODE_KEY] = data.id;
  }

  return nodeIdByKey;
}

async function detectChoiceCheckColumnsSupport() {
  const probe = await supabase
    .from('Solo_Adventure_Choices')
    .select('id, Check_Enabled, Check_Skill, Check_Difficulty, Check_Failure_Next_Node_ID')
    .limit(1);

  if (!probe.error) return true;

  const message = String(probe.error.message || '').toLowerCase();
  if (message.includes('does not exist') || message.includes('could not find')) {
    return false;
  }

  throw probe.error;
}

async function insertChoices(nodes, nodeIdByKey, hasCheckColumns) {
  let choiceCount = 0;

  for (const node of nodes) {
    const nodeId = nodeIdByKey[node.NODE_KEY];
    if (!nodeId) throw new Error(`Node mapping not found for ${node.NODE_KEY}.`);

    for (const choice of node.choices) {
      const nextNodeId = choice.Next_Node_Key ? nodeIdByKey[choice.Next_Node_Key] : null;
      const failureNodeId = choice.Failure_Next_Node_Key ? nodeIdByKey[choice.Failure_Next_Node_Key] : null;

      if (choice.Next_Node_Key && !nextNodeId) {
        throw new Error(`Choice from ${node.NODE_KEY} references unknown Next_Node_Key ${choice.Next_Node_Key}.`);
      }

      if (choice.Failure_Next_Node_Key && !failureNodeId) {
        throw new Error(`Choice from ${node.NODE_KEY} references unknown Failure_Next_Node_Key ${choice.Failure_Next_Node_Key}.`);
      }

      const payload = {
        Node_ID: nodeId,
        Choice_Text: choice.Choice_Text,
        Next_Node_ID: nextNodeId,
        Display_Order: choice.Display_Order,
      };

      if (hasCheckColumns) {
        payload.Check_Enabled = choice.Check_Enabled;
        payload.Check_Skill = choice.Check_Enabled ? (choice.Check_Skill || null) : null;
        payload.Check_Difficulty = choice.Check_Enabled ? choice.Check_Difficulty : 0;
        payload.Check_Failure_Next_Node_ID = choice.Check_Enabled ? failureNodeId : null;
      }

      const { error } = await supabase
        .from('Solo_Adventure_Choices')
        .insert([payload]);

      if (error) throw error;
      choiceCount += 1;
    }
  }

  return choiceCount;
}

async function run() {
  const input = await fs.readFile(inputFilePath, 'utf8');
  const { adventure, nodes } = parseAdventureInput(input);

  console.log(`Parsed adventure: ${adventure.Title}`);
  console.log(`Parsed nodes: ${nodes.length}`);
  console.log(`Parsed choices: ${nodes.reduce((sum, n) => sum + n.choices.length, 0)}`);

  const ttrpgId = await resolveTtrpgId(adventure.TTRPG);
  console.log(`Resolved TTRPG id: ${ttrpgId}`);

  const removed = await removeExistingAdventureByTitle(adventure.Title);
  if (removed > 0) {
    console.log(`Removed existing adventure rows with same title: ${removed}`);
  }

  const adventureId = await insertAdventure(adventure, ttrpgId);
  console.log(`Inserted adventure id: ${adventureId}`);

  const nodeIdByKey = await insertNodes(adventureId, nodes);
  console.log(`Inserted nodes: ${Object.keys(nodeIdByKey).length}`);

  const hasCheckColumns = await detectChoiceCheckColumnsSupport();
  console.log(`Choices schema supports skill-check columns: ${hasCheckColumns}`);

  const choiceCount = await insertChoices(nodes, nodeIdByKey, hasCheckColumns);
  console.log(`Inserted choices: ${choiceCount}`);

  console.log('Import complete.');
}

run().catch((error) => {
  console.error('Import failed:');
  console.error(error);
  process.exitCode = 1;
});
