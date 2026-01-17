/**
 * Fetches Radical Red move data from the source repository
 * and creates a moves-data.json file with correct IDs
 */

import fs from 'fs';
import https from 'https';

const MOVES_H_URL = 'https://raw.githubusercontent.com/Klendy/radical_red/master/include/constants/moves.h';
const BATTLE_MOVES_URL = 'https://raw.githubusercontent.com/Klendy/radical_red/master/src/Tables/battle_moves.c';

async function fetchFile(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseMovesH(content) {
  const moves = {};
  const lines = content.split('\n');

  for (const line of lines) {
    // Match lines like: #define MOVE_POUND 0x1
    const match = line.match(/^#define\s+MOVE_(\w+)\s+(0x[0-9A-Fa-f]+|\d+)/);
    if (match) {
      const name = match[1];
      const id = match[2].startsWith('0x')
        ? parseInt(match[2], 16)
        : parseInt(match[2], 10);

      // Skip MAX and GMAX moves as they're calculated values
      if (!name.includes('MOVES_COUNT') && !name.includes('_MAX_') && !name.includes('_GMAX_')) {
        // Convert MOVE_NAME to proper case: MOVE_POUND -> Pound
        const properName = name
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');

        moves[id] = {
          id,
          name: properName,
          constantName: `MOVE_${name}`
        };
      }
    }
  }

  return moves;
}

function parseBattleMovesC(content, moves) {
  const lines = content.split('\n');
  let currentMove = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Match move entry start: [MOVE_POUND] =
    const moveMatch = line.match(/\[MOVE_(\w+)\]\s*=/);
    if (moveMatch) {
      const moveName = moveMatch[1];
      const constantName = `MOVE_${moveName}`;

      // Find the move ID from our parsed moves
      const moveEntry = Object.values(moves).find(m => m.constantName === constantName);
      if (moveEntry) {
        currentMove = moveEntry.id;
      }
      continue;
    }

    if (currentMove !== null && moves[currentMove]) {
      // Extract move properties
      if (line.includes('.power')) {
        const match = line.match(/\.power\s*=\s*(\d+)/);
        if (match) moves[currentMove].power = parseInt(match[1]);
      }

      if (line.includes('.type')) {
        const match = line.match(/\.type\s*=\s*TYPE_(\w+)/);
        if (match) moves[currentMove].type = match[1].toLowerCase();
      }

      if (line.includes('.accuracy')) {
        const match = line.match(/\.accuracy\s*=\s*(\d+)/);
        if (match) moves[currentMove].accuracy = parseInt(match[1]);
      }

      if (line.includes('.pp')) {
        const match = line.match(/\.pp\s*=\s*(\d+)/);
        if (match) moves[currentMove].pp = parseInt(match[1]);
      }

      if (line.includes('.split')) {
        const match = line.match(/\.split\s*=\s*SPLIT_(\w+)/);
        if (match) moves[currentMove].class = match[1].toLowerCase();
      }

      // End of move entry
      if (line.includes('},')) {
        currentMove = null;
      }
    }
  }

  return moves;
}

async function main() {
  try {
    console.log('Fetching Radical Red move constants...');
    const movesH = await fetchFile(MOVES_H_URL);

    console.log('Parsing move IDs and names...');
    let moves = parseMovesH(movesH);

    console.log(`Found ${Object.keys(moves).length} moves`);

    console.log('Fetching Radical Red move data...');
    const battleMovesC = await fetchFile(BATTLE_MOVES_URL);

    console.log('Parsing move properties...');
    moves = parseBattleMovesC(battleMovesC, moves);

    // Convert to the format expected by the app: object with string keys
    const movesData = {};
    Object.values(moves).forEach(move => {
      movesData[move.id] = {
        id: move.id,
        name: move.name,
        type: move.type || 'normal',
        power: move.power || 0,
        accuracy: move.accuracy || 0,
        pp: move.pp || 0,
        class: move.class || 'status'
      };
    });

    // Write to file
    const outputPath = './src/lib/moves-data.json';
    fs.writeFileSync(outputPath, JSON.stringify(movesData, null, 2));

    console.log(`\n✓ Successfully created ${outputPath}`);
    console.log(`✓ Total moves: ${Object.keys(movesData).length}`);

    // Verify the problematic moves
    console.log('\nVerifying key moves:');
    const testMoves = {
      'Black Hole Eclipse (P)': 0x304,
      'Circle Throw': 0x1BD,
      'Reflect Type': 0x28E,
      'Spacial Rend': 0x1ED,
      'Hyperspace Hole': 0x1FD
    };

    for (const [name, id] of Object.entries(testMoves)) {
      const move = movesData[id];
      console.log(`  ${name} (ID ${id}): ${move ? move.name : 'NOT FOUND'}`);
    }

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
