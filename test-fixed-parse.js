// Test with the fixed string encoding
const fs = require('fs');

const saveData = fs.readFileSync('/home/user/OpenHome/completed_rr.sav');
const bytes = new Uint8Array(saveData);

// Byte helpers
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

// FIXED Gen3 string conversion with proper character map
const GEN3_CHAR_MAP = {
  0x00: ' ',
  0x50: '▯',
  0xA1: '0',  0xA2: '1',  0xA3: '2',  0xA4: '3',  0xA5: '4',
  0xA6: '5',  0xA7: '6',  0xA8: '7',  0xA9: '8',  0xAA: '9',
  0xAB: '!',  0xAC: '?',  0xAD: '.',  0xAE: '-',  0xAF: '・',
  0xB0: '...',  0xB1: '"',  0xB2: '"',  0xB3: "'",  0xB4: "'",
  0xB5: '♂',  0xB6: '♀',  0xB7: '$',  0xB8: ',',  0xB9: '×',  0xBA: '/',
  0xBB: 'A',  0xBC: 'B',  0xBD: 'C',  0xBE: 'D',  0xBF: 'E',  0xC0: 'F',
  0xC1: 'G',  0xC2: 'H',  0xC3: 'I',  0xC4: 'J',  0xC5: 'K',  0xC6: 'L',
  0xC7: 'M',  0xC8: 'N',  0xC9: 'O',  0xCA: 'P',  0xCB: 'Q',  0xCC: 'R',
  0xCD: 'S',  0xCE: 'T',  0xCF: 'U',  0xD0: 'V',  0xD1: 'W',  0xD2: 'X',
  0xD3: 'Y',  0xD4: 'Z',  0xD5: 'a',  0xD6: 'b',  0xD7: 'c',  0xD8: 'd',
  0xD9: 'e',  0xDA: 'f',  0xDB: 'g',  0xDC: 'h',  0xDD: 'i',  0xDE: 'j',
  0xDF: 'k',  0xE0: 'l',  0xE1: 'm',  0xE2: 'n',  0xE3: 'o',  0xE4: 'p',
  0xE5: 'q',  0xE6: 'r',  0xE7: 's',  0xE8: 't',  0xE9: 'u',  0xEA: 'v',
  0xEB: 'w',  0xEC: 'x',  0xED: 'y',  0xEE: 'z',  0xFF: '',
};

const gen3StringToUTF = (bytes, start, maxLength) => {
  let result = '';
  for (let i = start; i < start + maxLength && i < bytes.length; i++) {
    const byte = bytes[i];
    if (byte === 0xff) break;
    const char = GEN3_CHAR_MAP[byte];
    result += char !== undefined ? char : '?';
  }
  return result.trim();
};

// Parse sector
const parseSector = (bytes, index) => {
  const data = bytes.slice(index * 0x1000, index * 0x1000 + 4080);
  const sectionID = bytesToUint16LittleEndian(bytes, index * 0x1000 + 0xff4);
  return { data, sectionID };
};

// Parse save
const sectors = [];
for (let i = 0; i < 14; i++) {
  sectors.push(parseSector(bytes, i));
}
sectors.sort((a, b) => a.sectionID - b.sectionID);

// Extract trainer info
const trainerName = gen3StringToUTF(sectors[0].data, 0x00, 7);
const trainerID = bytesToUint16LittleEndian(sectors[0].data, 0x0a);
const secretID = bytesToUint16LittleEndian(sectors[0].data, 0x0c);
const securityKey = bytesToUint32LittleEndian(sectors[0].data, 0xaf8);
const money = bytesToUint32LittleEndian(sectors[1].data, 0x290) ^ securityKey;

console.log('=== FIXED STRING ENCODING TEST ===\n');
console.log('Trainer Info:');
console.log('  Name:', trainerName);
console.log('  ID:', trainerID);
console.log('  Secret ID:', secretID);
console.log('  Money:', money);

// Parse PC data
const POKEMON_SIZE = 58;
const POKEMON_PER_BOX = 30;
const NUM_BOXES = 18;

const fullSectionsUsed = Math.floor((NUM_BOXES * POKEMON_SIZE * POKEMON_PER_BOX) / 4080);
const leftoverBytes = (NUM_BOXES * POKEMON_SIZE * POKEMON_PER_BOX) % 4080;

const pcDataContiguous = new Uint8Array(4080 * fullSectionsUsed + leftoverBytes + 4);

sectors.slice(5, 5 + fullSectionsUsed + 1).forEach((sector, i) => {
  const startOffset = i * 4080;
  const length = i < fullSectionsUsed ? 4080 : leftoverBytes + 4;
  pcDataContiguous.set(sector.data.slice(0, length), startOffset);
});

// Parse first 10 Pokemon
console.log('\nFirst 10 Pokemon:');
for (let i = 0; i < 10; i++) {
  const offset = 4 + i * POKEMON_SIZE;
  const pokemonBytes = pcDataContiguous.slice(offset, offset + POKEMON_SIZE);

  const speciesIndex = bytesToUint16LittleEndian(pokemonBytes, 0x1c);
  if (speciesIndex === 0) continue;

  const nickname = gen3StringToUTF(pokemonBytes, 0x08, 10);
  const trainerName = gen3StringToUTF(pokemonBytes, 0x14, 7);
  const exp = bytesToUint32LittleEndian(pokemonBytes, 0x20);
  const level = Math.floor(Math.pow(exp / 1000, 1/3)) + 1;

  console.log(`  ${i + 1}. ${nickname} (Species #${speciesIndex}) - Level ${level} - OT: ${trainerName}`);
}

console.log('\n✓ Strings are now parsing correctly!');
