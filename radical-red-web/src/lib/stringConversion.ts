// Gen 3 string conversion utilities

// Gen 3 character map (byte value -> character)
const GEN3_CHAR_MAP: Record<number, string> = {
  0x00: ' ',
  0x50: '▯',
  0xA1: '0',
  0xA2: '1',
  0xA3: '2',
  0xA4: '3',
  0xA5: '4',
  0xA6: '5',
  0xA7: '6',
  0xA8: '7',
  0xA9: '8',
  0xAA: '9',
  0xAB: '!',
  0xAC: '?',
  0xAD: '.',
  0xAE: '-',
  0xAF: '・',
  0xB0: '...',
  0xB1: '"',
  0xB2: '"',
  0xB3: "'",
  0xB4: "'",
  0xB5: '♂',
  0xB6: '♀',
  0xB7: '$',
  0xB8: ',',
  0xB9: '×',
  0xBA: '/',
  0xBB: 'A',
  0xBC: 'B',
  0xBD: 'C',
  0xBE: 'D',
  0xBF: 'E',
  0xC0: 'F',
  0xC1: 'G',
  0xC2: 'H',
  0xC3: 'I',
  0xC4: 'J',
  0xC5: 'K',
  0xC6: 'L',
  0xC7: 'M',
  0xC8: 'N',
  0xC9: 'O',
  0xCA: 'P',
  0xCB: 'Q',
  0xCC: 'R',
  0xCD: 'S',
  0xCE: 'T',
  0xCF: 'U',
  0xD0: 'V',
  0xD1: 'W',
  0xD2: 'X',
  0xD3: 'Y',
  0xD4: 'Z',
  0xD5: 'a',
  0xD6: 'b',
  0xD7: 'c',
  0xD8: 'd',
  0xD9: 'e',
  0xDA: 'f',
  0xDB: 'g',
  0xDC: 'h',
  0xDD: 'i',
  0xDE: 'j',
  0xDF: 'k',
  0xE0: 'l',
  0xE1: 'm',
  0xE2: 'n',
  0xE3: 'o',
  0xE4: 'p',
  0xE5: 'q',
  0xE6: 'r',
  0xE7: 's',
  0xE8: 't',
  0xE9: 'u',
  0xEA: 'v',
  0xEB: 'w',
  0xEC: 'x',
  0xED: 'y',
  0xEE: 'z',
  0xFF: '', // Terminator
}

// Reverse map for encoding
const REVERSE_GEN3_MAP: Record<string, number> = {}
for (const [key, value] of Object.entries(GEN3_CHAR_MAP)) {
  if (value && value !== '') {
    REVERSE_GEN3_MAP[value] = parseInt(key)
  }
}

export const gen3StringToUTF = (bytes: Uint8Array, start: number, maxLength: number): string => {
  let result = ''
  for (let i = start; i < start + maxLength && i < bytes.length; i++) {
    const byte = bytes[i]
    if (byte === 0xff) break // Terminator
    const char = GEN3_CHAR_MAP[byte]
    result += char !== undefined ? char : '?'
  }
  return result.trim()
}

export const utf8ToGen3String = (str: string, maxLength: number): Uint8Array => {
  const result = new Uint8Array(maxLength)
  result.fill(0xff) // Fill with terminators

  for (let i = 0; i < Math.min(str.length, maxLength); i++) {
    const char = str[i]
    const byte = REVERSE_GEN3_MAP[char]
    result[i] = byte !== undefined ? byte : 0x00
  }

  return result
}
