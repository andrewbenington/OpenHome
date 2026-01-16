// Comprehensive test using the exact same logic as the web app
const fs = require('fs');

// Read the save file
const saveData = fs.readFileSync('/home/user/OpenHome/completed_rr.sav');
const bytes = new Uint8Array(saveData);

console.log('=== DETAILED SAVE PARSING TEST ===\n');

// Byte logic helpers (from byteLogic.ts)
const bytesToNumberBigEndian = (bytes) => {
  let value = 0;
  bytes.forEach((byte) => {
    value *= 256;
    value += byte;
  });
  return value;
};

const bytesToNumberLittleEndian = (bytes) => {
  return bytesToNumberBigEndian(bytes.slice().reverse());
};

const bytesToUint16LittleEndian = (bytes, index) => {
  return bytesToNumberLittleEndian(bytes.slice(index, index + 2));
};

const bytesToUint32LittleEndian = (bytes, index) => {
  return bytesToNumberLittleEndian(bytes.slice(index, index + 4));
};

// Gen3 string conversion (from stringConversion.ts)
const Gen3CharacterSet = [
  ' ', 'À', 'Á', 'Â', 'Ç', 'È', 'É', 'Ê', 'Ë', 'Ì', 'こ', 'Î', 'Ï', 'Ò', 'Ó', 'Ô',
  'Œ', 'Ù', 'Ú', 'Û', 'Ñ', 'ß', 'à', 'á', 'ね', 'Ç', 'È', 'é', 'ê', 'ë', 'ì', 'í',
  'î', 'ï', 'ò', 'ó', 'ô', 'œ', 'ù', 'ú', 'û', 'ñ', 'º', 'ª', '⒅', '&', '+', 'あ',
  'ぃ', 'ぅ', 'ぇ', 'ぉ', 'ゃ', '=', 'ょ', 'が', 'ぎ', 'ぐ', 'げ', 'ご', 'ざ', 'じ', 'ず',
  'ぜ', 'ぞ', 'だ', 'ぢ', 'づ', 'で', 'ど', 'ば', 'び', 'ぶ', 'べ', 'ぼ', 'ぱ', 'ぴ', 'ぷ',
  'ぺ', 'ぽ', 'っ', '¿', '¡', 'PK', 'MN', 'オ', 'カ', 'キ', 'ク', 'ケ', 'Í', 'コ', 'サ',
  'シ', 'ス', 'セ', 'ソ', 'タ', 'チ', 'ツ', 'テ', 'ト', 'ナ', 'ニ', 'ヌ', 'ネ', 'ノ', 'ハ',
  'ヒ', 'フ', 'ヘ', 'ホ', 'í', 'ミ', 'ム', 'メ', 'モ', 'ヤ', 'ユ', 'ヨ', 'ラ', 'リ', 'ル',
  'レ', 'ロ', 'ワ', 'ヲ', 'ン', 'ァ', 'ィ', 'ゥ', 'ェ', 'ォ', 'ャ', 'ュ', 'ョ', 'が', 'ぎ',
  'ぐ', 'げ', 'ご', 'ざ', 'じ', 'ず', 'ぜ', 'ぞ', 'だ', 'ぢ', 'づ', 'で', 'ど', 'ば', 'び',
  'ぶ', 'べ', 'ぼ', 'ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ', 'っ', '0', '1', '2', '3', '4', '5',
  '6', '7', '8', '9', '!', '?', '.', '-', '・', '...', '"', '"', "'", "'", '♂', '♀',
  '$', ',', '×', '/', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L',
  'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b',
  'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r',
  's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '▶', ':', 'Ä', 'Ö', 'Ü', 'ä', 'ö', 'ü',
];

const gen3StringToUTF = (bytes, start, maxLength) => {
  let result = '';
  for (let i = start; i < start + maxLength && i < bytes.length; i++) {
    const byte = bytes[i];
    if (byte === 0xff || byte === 0x00) break;
    if (byte < Gen3CharacterSet.length) {
      result += Gen3CharacterSet[byte];
    } else {
      result += '?';
    }
  }
  return result.trim();
};

// Helper to read bits
const getBits = (bytes, offset, bitOffset, bitLength) => {
  const byteIndex = offset;
  const byte1 = bytes[byteIndex] || 0;
  const byte2 = bytes[byteIndex + 1] || 0;
  const combined = byte1 | (byte2 << 8);
  const mask = (1 << bitLength) - 1;
  return (combined >> bitOffset) & mask;
};

// Parse Pokemon (from pokemonParser.ts)
const parsePokemon = (bytes) => {
  if (bytes.length < 58) return null;

  const speciesIndex = bytesToUint16LittleEndian(bytes, 0x1c);
  if (speciesIndex === 0) return null;

  const personalityValue = bytesToUint32LittleEndian(bytes, 0x00);
  const trainerID = bytesToUint16LittleEndian(bytes, 0x04);
  const secretID = bytesToUint16LittleEndian(bytes, 0x06);
  const nickname = gen3StringToUTF(bytes, 0x08, 10);
  const trainerName = gen3StringToUTF(bytes, 0x14, 7);
  const heldItem = bytesToUint16LittleEndian(bytes, 0x1e);
  const exp = bytesToUint32LittleEndian(bytes, 0x20);
  const friendship = bytes[0x25];
  const ball = bytes[0x26];

  const moves = [
    getBits(bytes, 0x27, 0, 10),
    getBits(bytes, 0x28, 2, 10),
    getBits(bytes, 0x29, 4, 10),
    getBits(bytes, 0x2a, 6, 10),
  ];

  const hpEV = bytes[0x2c];
  const attackEV = bytes[0x2d];
  const defenseEV = bytes[0x2e];
  const speedEV = bytes[0x2f];
  const spAtkEV = bytes[0x30];
  const spDefEV = bytes[0x31];

  const ivData = bytesToUint32LittleEndian(bytes, 0x36);
  const hpIV = ivData & 0x1f;
  const attackIV = (ivData >> 5) & 0x1f;
  const defenseIV = (ivData >> 10) & 0x1f;
  const speedIV = (ivData >> 15) & 0x1f;
  const spAtkIV = (ivData >> 20) & 0x1f;
  const spDefIV = (ivData >> 25) & 0x1f;
  const isEgg = ((ivData >> 30) & 0x1) === 1;

  const level = Math.floor(Math.pow(exp / 1000, 1/3)) + 1;
  const nature = personalityValue % 25;

  return {
    dexNum: speciesIndex,
    nickname,
    level,
    exp,
    hpIV,
    attackIV,
    defenseIV,
    spAtkIV,
    spDefIV,
    speedIV,
    hpEV,
    attackEV,
    defenseEV,
    spAtkEV,
    spDefEV,
    speedEV,
    moves,
    nature,
    heldItem,
    friendship,
    isEgg,
    trainerName,
    trainerID,
    secretID,
    ball,
  };
};

// Parse sector
const parseSector = (bytes, index) => {
  const data = bytes.slice(index * 0x1000, index * 0x1000 + 4080);
  const sectionID = bytesToUint16LittleEndian(bytes, index * 0x1000 + 0xff4);
  const checksum = bytesToUint16LittleEndian(bytes, index * 0x1000 + 0xff6);
  const signature = bytesToUint32LittleEndian(bytes, index * 0x1000 + 0xff8);
  const saveIndex = bytesToUint32LittleEndian(bytes, index * 0x1000 + 0xffc);
  return { data, sectionID, checksum, signature, saveIndex };
};

// Parse save (from saveParser.ts)
const parseSave = (bytes) => {
  const POKEMON_SIZE = 58;
  const POKEMON_PER_BOX = 30;
  const NUM_BOXES = 18;

  console.log('Save file size:', bytes.length);

  // Parse all 14 sectors
  const sectors = [];
  for (let i = 0; i < 14; i++) {
    sectors.push(parseSector(bytes, i));
  }

  console.log('\nSectors before sorting:');
  sectors.forEach((s, i) => {
    console.log(`  Physical sector ${i}: sectionID=${s.sectionID}, saveIndex=${s.saveIndex}`);
  });

  // Sort by section ID
  sectors.sort((a, b) => a.sectionID - b.sectionID);

  console.log('\nSectors after sorting:');
  sectors.forEach((s, i) => {
    console.log(`  Logical sector ${i}: sectionID=${s.sectionID}`);
  });

  // Extract trainer info
  const trainerName = gen3StringToUTF(sectors[0].data, 0x00, 7);
  const trainerID = bytesToUint16LittleEndian(sectors[0].data, 0x0a);
  const secretID = bytesToUint16LittleEndian(sectors[0].data, 0x0c);
  const securityKey = bytesToUint32LittleEndian(sectors[0].data, 0xaf8);
  const money = bytesToUint32LittleEndian(sectors[1].data, 0x290) ^ securityKey;

  console.log('\n--- Trainer Info ---');
  console.log('Name:', trainerName);
  console.log('ID:', trainerID);
  console.log('Secret ID:', secretID);
  console.log('Money:', money);
  console.log('Security Key:', securityKey.toString(16));

  // Concatenate PC data
  const fullSectionsUsed = Math.floor((NUM_BOXES * POKEMON_SIZE * POKEMON_PER_BOX) / 4080);
  const leftoverBytes = (NUM_BOXES * POKEMON_SIZE * POKEMON_PER_BOX) % 4080;

  console.log('\n--- PC Data ---');
  console.log('Total PC bytes:', NUM_BOXES * POKEMON_SIZE * POKEMON_PER_BOX);
  console.log('Full sections used:', fullSectionsUsed);
  console.log('Leftover bytes:', leftoverBytes);
  console.log('PC sectors:', `${5} to ${5 + fullSectionsUsed}`);

  const pcDataContiguous = new Uint8Array(4080 * fullSectionsUsed + leftoverBytes + 4);

  sectors.slice(5, 5 + fullSectionsUsed + 1).forEach((sector, i) => {
    const startOffset = i * 4080;
    const length = i < fullSectionsUsed ? 4080 : leftoverBytes + 4;
    pcDataContiguous.set(sector.data.slice(0, length), startOffset);
    console.log(`  Copying sector ${sector.sectionID}: ${length} bytes at offset ${startOffset}`);
  });

  console.log('PC buffer size:', pcDataContiguous.length);

  // Parse boxes
  console.log('\n--- Parsing Pokemon ---');
  const boxes = [];
  let totalPokemonFound = 0;

  for (let boxIdx = 0; boxIdx < NUM_BOXES; boxIdx++) {
    const box = {
      name: `Box ${boxIdx + 1}`,
      pokemon: new Array(POKEMON_PER_BOX).fill(null),
    };

    for (let slotIdx = 0; slotIdx < POKEMON_PER_BOX; slotIdx++) {
      const monIndex = boxIdx * POKEMON_PER_BOX + slotIdx;
      const offset = 4 + monIndex * POKEMON_SIZE;
      const pokemonBytes = pcDataContiguous.slice(offset, offset + POKEMON_SIZE);

      try {
        const pokemon = parsePokemon(pokemonBytes);
        if (pokemon) {
          box.pokemon[slotIdx] = pokemon;
          totalPokemonFound++;

          if (totalPokemonFound <= 10) {
            console.log(`Pokemon ${totalPokemonFound}:`, {
              box: boxIdx + 1,
              slot: slotIdx + 1,
              species: pokemon.dexNum,
              nickname: pokemon.nickname,
              level: pokemon.level,
              moves: pokemon.moves,
              IVs: `${pokemon.hpIV}/${pokemon.attackIV}/${pokemon.defenseIV}/${pokemon.spAtkIV}/${pokemon.spDefIV}/${pokemon.speedIV}`
            });
          }
        }
      } catch (e) {
        console.error(`Error at box ${boxIdx}, slot ${slotIdx}:`, e.message);
      }
    }

    boxes.push(box);
  }

  console.log('\nTotal Pokemon found:', totalPokemonFound);

  // Show box summary
  console.log('\n--- Box Summary ---');
  boxes.forEach((box, idx) => {
    const count = box.pokemon.filter(p => p !== null).length;
    if (count > 0) {
      console.log(`${box.name}: ${count} Pokemon`);
    }
  });

  return {
    boxes,
    trainerName,
    trainerID,
    secretID,
    money,
  };
};

// Run the test
try {
  const result = parseSave(bytes);
  console.log('\n✓ Save parsing completed successfully!');
} catch (error) {
  console.error('\n✗ Error parsing save:', error.message);
  console.error(error.stack);
}
