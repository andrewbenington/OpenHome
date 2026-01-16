// Test script to parse the save file
const fs = require('fs');

// Read the save file
const saveData = fs.readFileSync('/home/user/OpenHome/completed_rr.sav');
const bytes = new Uint8Array(saveData);

console.log('Save file size:', bytes.length, 'bytes');
console.log('Expected sizes:', [0x20000, 0x20010]);

// Helper functions from byteLogic.ts
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

// Check if it's a Radical Red save
const securityKey = bytesToUint32LittleEndian(bytes, 0xf20);
const securityKeyCopy = bytesToUint32LittleEndian(bytes, 0xf24);

console.log('\nSecurity keys:');
console.log('  Security key at 0xf20:', securityKey.toString(16));
console.log('  Security key copy at 0xf24:', securityKeyCopy.toString(16));
console.log('  Is Radical Red save?', securityKey === 0 || securityKey !== securityKeyCopy);

// Parse sectors
const parseSector = (bytes, index) => {
  const data = bytes.slice(index * 0x1000, index * 0x1000 + 4080);
  const sectionID = bytesToUint16LittleEndian(bytes, index * 0x1000 + 0xff4);
  const checksum = bytesToUint16LittleEndian(bytes, index * 0x1000 + 0xff6);
  const signature = bytesToUint32LittleEndian(bytes, index * 0x1000 + 0xff8);
  const saveIndex = bytesToUint32LittleEndian(bytes, index * 0x1000 + 0xffc);

  return { data, sectionID, checksum, signature, saveIndex };
};

console.log('\nParsing first 14 sectors:');
const sectors = [];
for (let i = 0; i < 14; i++) {
  const sector = parseSector(bytes, i);
  sectors.push(sector);
  console.log(`Sector ${i}:`, {
    sectionID: sector.sectionID,
    checksum: sector.checksum.toString(16),
    signature: sector.signature.toString(16),
    saveIndex: sector.saveIndex
  });
}

// Sort sectors by section ID
sectors.sort((a, b) => a.sectionID - b.sectionID);

console.log('\nSectors after sorting by section ID:');
sectors.forEach((sector, i) => {
  console.log(`Sector ${i}: sectionID=${sector.sectionID}, saveIndex=${sector.saveIndex}`);
});

// Gen3 string conversion
const gen3StringToUTF = (bytes, offset, maxLength) => {
  const GEN3_CHAR_MAP = {
    0x00: ' ', 0xBB: 'A', 0xBC: 'B', 0xBD: 'C', 0xBE: 'D', 0xBF: 'E',
    0xC0: 'F', 0xC1: 'G', 0xC2: 'H', 0xC3: 'I', 0xC4: 'J', 0xC5: 'K',
    0xC6: 'L', 0xC7: 'M', 0xC8: 'N', 0xC9: 'O', 0xCA: 'P', 0xCB: 'Q',
    0xCC: 'R', 0xCD: 'S', 0xCE: 'T', 0xCF: 'U', 0xD0: 'V', 0xD1: 'W',
    0xD2: 'X', 0xD3: 'Y', 0xD4: 'Z', 0xD5: 'a', 0xD6: 'b', 0xD7: 'c',
    0xD8: 'd', 0xD9: 'e', 0xDA: 'f', 0xDB: 'g', 0xDC: 'h', 0xDD: 'i',
    0xDE: 'j', 0xDF: 'k', 0xE0: 'l', 0xE1: 'm', 0xE2: 'n', 0xE3: 'o',
    0xE4: 'p', 0xE5: 'q', 0xE6: 'r', 0xE7: 's', 0xE8: 't', 0xE9: 'u',
    0xEA: 'v', 0xEB: 'w', 0xEC: 'x', 0xED: 'y', 0xEE: 'z', 0xA1: '0',
    0xA2: '1', 0xA3: '2', 0xA4: '3', 0xA5: '4', 0xA6: '5', 0xA7: '6',
    0xA8: '7', 0xA9: '8', 0xAA: '9', 0xFF: '', 0x50: '▯'
  };

  let result = '';
  for (let i = 0; i < maxLength; i++) {
    const byte = bytes[offset + i];
    if (byte === 0xFF) break;
    result += GEN3_CHAR_MAP[byte] || '?';
  }
  return result.trim();
};

// Extract trainer info from sector 0
console.log('\n--- Trainer Info (Sector 0) ---');
const trainerName = gen3StringToUTF(sectors[0].data, 0x00, 7);
const trainerID = bytesToUint16LittleEndian(sectors[0].data, 0x0a);
const secretID = bytesToUint16LittleEndian(sectors[0].data, 0x0c);
const securityKeyFromSector = bytesToUint32LittleEndian(sectors[0].data, 0xaf8);

console.log('Trainer name:', trainerName);
console.log('Trainer ID:', trainerID);
console.log('Secret ID:', secretID);
console.log('Security key from sector 0:', securityKeyFromSector.toString(16));

// Money from sector 1
const money = bytesToUint32LittleEndian(sectors[1].data, 0x290) ^ securityKeyFromSector;
console.log('Money:', money);

// Check PC data
console.log('\n--- PC Data Info ---');
const POKEMON_SIZE = 58;
const POKEMON_PER_BOX = 30;
const NUM_BOXES = 18;

const fullSectionsUsed = Math.floor((NUM_BOXES * POKEMON_SIZE * POKEMON_PER_BOX) / 4080);
const leftoverBytes = (NUM_BOXES * POKEMON_SIZE * POKEMON_PER_BOX) % 4080;

console.log('Total PC data size:', NUM_BOXES * POKEMON_SIZE * POKEMON_PER_BOX, 'bytes');
console.log('Full sectors needed:', fullSectionsUsed);
console.log('Leftover bytes:', leftoverBytes);
console.log('PC data should be in sectors:', `5-${5 + fullSectionsUsed}`);

// Concatenate PC data from sectors 5-11
const pcDataContiguous = new Uint8Array(4080 * fullSectionsUsed + leftoverBytes + 4);

sectors.slice(5, 5 + fullSectionsUsed + 1).forEach((sector, i) => {
  const startOffset = i * 4080;
  const length = i < fullSectionsUsed ? 4080 : leftoverBytes + 4;
  pcDataContiguous.set(sector.data.slice(0, length), startOffset);
  console.log(`  Copying sector ${sector.sectionID}: ${length} bytes at offset ${startOffset}`);
});

console.log('PC data buffer size:', pcDataContiguous.length);

// Parse first few Pokemon to see what we get
console.log('\n--- First few Pokemon ---');
for (let i = 0; i < 6; i++) {
  const offset = 4 + i * POKEMON_SIZE;
  const pokemonBytes = pcDataContiguous.slice(offset, offset + POKEMON_SIZE);

  const speciesIndex = bytesToUint16LittleEndian(pokemonBytes, 0x1c);
  const nickname = gen3StringToUTF(pokemonBytes, 0x08, 10);
  const trainerName = gen3StringToUTF(pokemonBytes, 0x14, 7);

  console.log(`Pokemon ${i}:`, {
    species: speciesIndex,
    nickname: nickname,
    trainerName: trainerName,
    exists: speciesIndex !== 0
  });
}
