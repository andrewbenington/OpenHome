import Gen4ToUTFMap from './gen4ToUTFMap'
import UTFToGen4Map from './utfToGen4Map'

const G1_TERMINATOR = 0x50

const GBStringDict: { [key: number]: string } = {
  0x7f: ' ',
  0x80: 'A',
  0x81: 'B',
  0x82: 'C',
  0x83: 'D',
  0x84: 'E',
  0x85: 'F',
  0x86: 'G',
  0x87: 'H',
  0x88: 'I',
  0x89: 'J',
  0x8a: 'K',
  0x8b: 'L',
  0x8c: 'M',
  0x8d: 'N',
  0x8e: 'O',
  0x8f: 'P',
  0x90: 'Q',
  0x91: 'R',
  0x92: 'S',
  0x93: 'T',
  0x94: 'U',
  0x95: 'V',
  0x96: 'W',
  0x97: 'X',
  0x98: 'Y',
  0x99: 'Z',
  0x9a: '(',
  0x9b: ')',
  0x9c: ':',
  0x9d: ';',
  0x9e: '[',
  0x9f: ']',
  0xa0: 'a',
  0xa1: 'b',
  0xa2: 'c',
  0xa3: 'd',
  0xa4: 'e',
  0xa5: 'f',
  0xa6: 'g',
  0xa7: 'h',
  0xa8: 'i',
  0xa9: 'j',
  0xaa: 'k',
  0xab: 'l',
  0xac: 'm',
  0xad: 'n',
  0xae: 'o',
  0xaf: 'p',
  0xb0: 'q',
  0xb1: 'r',
  0xb2: 's',
  0xb3: 't',
  0xb4: 'u',
  0xb5: 'v',
  0xb6: 'w',
  0xb7: 'x',
  0xb8: 'y',
  0xb9: 'z',

  // unused characters
  0xba: 'à',
  0xbb: 'è',
  0xbc: 'é',
  0xbd: 'ù',
  0xbe: 'À',
  0xbf: 'Á', // Used in Spanish FALCÁN in-game trade: inaccessible from keyboard

  0xc0: 'Ä',
  0xc1: 'Ö',
  0xc2: 'Ü',
  0xc3: 'ä',
  0xc4: 'ö',
  0xc5: 'ü',

  // unused characters
  0xc6: 'È',
  0xc7: 'É',
  0xc8: 'Ì',
  0xc9: 'Í', // Used in Spanish MANÍA in-game trade: inaccessible from keyboard
  0xca: 'Ñ',
  0xcb: 'Ò',
  0xcc: 'Ó',
  0xcd: 'Ù',
  0xce: 'Ú',
  0xcf: 'á',
  0xd0: 'ì',
  0xd1: 'í',
  0xd2: 'ñ',
  0xd3: 'ò',
  0xd4: 'ó',
  0xd5: 'ú',

  0xe0: '’',
  0xe1: 'ᴘ' /* Pk */,
  0xe2: 'ᴍ' /* Mn */,
  0xe3: '-',
  0xe6: '?',
  0xe7: '!',
  0xe8: '.', // Alias decimal point to .
  0xef: '♂',
  0xf1: '×',
  0xf2: '.',
  0xf3: '/',
  0xf4: ',',
  0xf5: '♀',
  0xf6: '0',
  0xf7: '1',
  0xf8: '2',
  0xf9: '3',
  0xfa: '4',
  0xfb: '5',
  0xfc: '6',
  0xfd: '7',
  0xfe: '8',
  0xff: '9',
}

export type GBEncoding = 'Int' | 'Jpn'

/**
 * The Japanese Gen 1/2 character table. Katakana run from 0x80 but omit ヘ
 * and リ (the games share the hiragana glyphs for them); hiragana follow
 * from 0xB1. Dakuten/handakuten kana are precomposed glyphs stored at low
 * code points offset from their plain counterparts:
 *   katakana + dakuten:    plain byte - 0x80 (ガ 0x05 ... ド 0x13, バ行 0x19-0x1C)
 *   hiragana + dakuten:    plain byte - 0x90 (が 0x26 ... ど 0x34, ば行 0x3A-0x3E)
 *   katakana + handakuten: plain byte - 0x59 (パ 0x40 ... ポ 0x43)
 *   hiragana + handakuten: plain byte - 0x86 (ぱ 0x44 ... ぽ 0x48)
 * ベ/ペ share the hiragana べ/ぺ glyphs (as ヘ shares へ).
 */
const GBStringDictJpn: { [key: number]: string } = (() => {
  const dict: { [key: number]: string } = {
    0x7f: ' ',
    0xe3: 'ー',
    0xe9: 'ァ',
    0xea: 'ゥ',
    0xeb: 'ェ',
    0xef: '♂',
    0xf4: 'ォ',
    0xf5: '♀',
  }
  const katakana =
    'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフホマミムメモヤユヨラルレロワヲンッャュョィ'
  const hiragana =
    'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんっゃゅょ'

  ;[...katakana].forEach((char, i) => {
    dict[0x80 + i] = char
  })
  ;[...hiragana].forEach((char, i) => {
    dict[0xb1 + i] = char
  })
  for (let i = 0; i < 10; i++) {
    dict[0xf6 + i] = i.toString()
  }
  const dakuten: { [key: string]: string } = {
    カ: 'ガ',
    キ: 'ギ',
    ク: 'グ',
    ケ: 'ゲ',
    コ: 'ゴ',
    サ: 'ザ',
    シ: 'ジ',
    ス: 'ズ',
    セ: 'ゼ',
    ソ: 'ゾ',
    タ: 'ダ',
    チ: 'ヂ',
    ツ: 'ヅ',
    テ: 'デ',
    ト: 'ド',
    ハ: 'バ',
    ヒ: 'ビ',
    フ: 'ブ',
    ホ: 'ボ',
    か: 'が',
    き: 'ぎ',
    く: 'ぐ',
    け: 'げ',
    こ: 'ご',
    さ: 'ざ',
    し: 'じ',
    す: 'ず',
    せ: 'ぜ',
    そ: 'ぞ',
    た: 'だ',
    ち: 'ぢ',
    つ: 'づ',
    て: 'で',
    と: 'ど',
    は: 'ば',
    ひ: 'び',
    ふ: 'ぶ',
    へ: 'べ',
    ほ: 'ぼ',
  }
  const handakuten: { [key: string]: string } = {
    ハ: 'パ',
    ヒ: 'ピ',
    フ: 'プ',
    ホ: 'ポ',
    は: 'ぱ',
    ひ: 'ぴ',
    ふ: 'ぷ',
    へ: 'ぺ',
    ほ: 'ぽ',
  }

  Object.entries({ ...dict }).forEach(([byteStr, char]) => {
    const byte = parseInt(byteStr)

    if (dakuten[char]) {
      dict[byte - (byte < 0xb1 ? 0x80 : 0x90)] = dakuten[char]
    }
    if (handakuten[char]) {
      dict[byte - (byte < 0xb1 ? 0x59 : 0x86)] = handakuten[char]
    }
  })
  return dict
})()

const getGBStringDict = (encoding: GBEncoding) =>
  encoding === 'Jpn' ? GBStringDictJpn : GBStringDict

const buildEncodeMap = (dict: { [key: number]: string }) => {
  const map = new Map<string, number>()

  Object.entries(dict).forEach(([byteStr, char]) => {
    if (!map.has(char)) {
      map.set(char, parseInt(byteStr))
    }
  })
  return map
}

// katakana that share their hiragana counterpart's code point, since the
// games have no distinct glyph for them
const KANA_SHARED_CODE_POINTS: [katakana: string, hiragana: string][] = [
  ['ヘ', 'へ'],
  ['リ', 'り'],
  ['ベ', 'べ'],
  ['ペ', 'ぺ'],
]

const gbEncodeMaps: Record<GBEncoding, Map<string, number>> = (() => {
  const jpnMap = buildEncodeMap(GBStringDictJpn)

  KANA_SHARED_CODE_POINTS.forEach(([katakana, hiragana]) => {
    const byte = jpnMap.get(hiragana)

    if (byte !== undefined) {
      jpnMap.set(katakana, byte)
    }
  })
  return { Int: buildEncodeMap(GBStringDict), Jpn: jpnMap }
})()

/**
 * Convert string to Gen 1/Gen 2 encoded bytes. Uses a proprietary encoding,
 * terminated with 0xff character. Characters not in Gen 3 character
 * set will be replaced with '?'
 * @param str the string to encode
 * @param length character length of string
 * @param terminate include 0x50 at the end
 * @param encoding 'Int' (default) or 'Jpn'
 * @returns UInt8Array of Gen 1/2 bytes
 */
export const utf16StringToGen12 = (
  str: string,
  length: number,
  terminate: boolean,
  encoding: GBEncoding = 'Int'
) => {
  const bufView = new Uint8Array(length)
  const encodeMap = gbEncodeMaps[encoding]

  for (let i = 0; i < Math.min(str.length, length); i++) {
    const gen12Byte = encodeMap.get(str.charAt(i))

    if (str.charCodeAt(i) === 0) {
      break
    } else if (gen12Byte === undefined) {
      bufView[i] = 0xe6
    } else {
      bufView[i] = gen12Byte
    }
  }
  if (terminate) {
    const terminalIndex = Math.min(str.length, length - 1)

    bufView[terminalIndex] = G1_TERMINATOR
  }
  return bufView
}

/**
 * Convert Gen 1/Gen 2 encoded bytes to string. Uses a proprietary encoding,
 * terminated with 0x50 character
 * @param bytes the buffer from which to read
 * @param offset buffer offset to start at
 * @param length character length of string
 * @returns string of decoded Gen 1/2 bytes
 */
export const readGameBoyStringFromBytes = (
  dataView: DataView,
  offset: number,
  length: number,
  encoding: GBEncoding = 'Int'
) => {
  let str = ''
  const dict = getGBStringDict(encoding)

  for (let i = offset; i < offset + length; i += 1) {
    const character = dataView.getUint8(i)

    if (character === G1_TERMINATOR) {
      break
    }
    if (encoding === 'Jpn' && character === 0) {
      // some Japanese event mons (e.g. the ゲーフリ Mew) pad names with 0x00
      break
    }

    str += dict[character] ?? '?'
  }

  return str
}

/**
 * Convert string to Gen 1/Gen 2 encoded bytes. Uses a proprietary encoding,
 * terminated with 0xff character. Characters not in Gen 3 character
 * set will be replaced with '?'
 * @param str the string to encode
 * @param length character length of string
 * @param terminate include 0x50 at the end
 * @returns UInt8Array of Gen 1/2 bytes
 */
export const writeGameBoyStringToBytes = (
  dataView: DataView,
  str: string,
  offset: number,
  length: number,
  terminate: boolean,
  encoding: GBEncoding = 'Int'
) => {
  const encodeMap = gbEncodeMaps[encoding]

  for (let i = 0; i < Math.min(str.length, length); i++) {
    const gen12Byte = encodeMap.get(str.charAt(i))

    if (str.charCodeAt(i) === 0) {
      break
    } else if (gen12Byte === undefined) {
      dataView.setUint8(offset + i, 0xe6)
    } else {
      dataView.setUint8(offset + i, gen12Byte)
    }
  }

  if (terminate) {
    const terminalIndex = Math.min(str.length, length - 1)

    dataView.setUint8(offset + terminalIndex, G1_TERMINATOR)
  }
}

/**
 * Convert Gen 4 encoded bytes to string. Uses a proprietary encoding,
 * terminated with 0xffff character
 * @param dataView the DataView from which to read
 * @param offset buffer offset to start at
 * @param length character length of string (bytes * 2)
 * @returns string of decoded Gen 4 bytes
 */
export const readGen4StringFromBytes = (dataView: DataView, offset: number, length: number) => {
  let str = ''

  for (let i = 0; i < length; i += 1) {
    const value = dataView.getUint16(offset + 2 * i, true)

    if (value === 0xffff) {
      return str
    }

    str += String.fromCharCode(Gen4ToUTFMap[value])
  }

  return str
}

/**
 * Convert string to Gen 4 encoded bytes. Uses a proprietary encoding,
 * terminated with 0xffff character. Characters not in Gen 4 character
 * set will be replaced with '?'
 * @param str the string to encode
 * @param length character length of string (bytes * 2)
 * @param terminate include 0xffff at the end
 */
export const writeGen4StringToBytes = (
  dataView: DataView,
  str: string,
  offset: number,
  length: number
) => {
  for (let i = 0; i < Math.min(str.length, length); i++) {
    const val = str.charCodeAt(i)
    const gen4Char = UTFToGen4Map[val]

    if (gen4Char === -1) {
      // unsupported characters are now '?'
      dataView.setUint16(offset + i * 2, 0x01ac, true)
    } else {
      dataView.setUint16(offset + i * 2, gen4Char, true)
    }
  }

  if (str.length < length) {
    dataView.setUint16(offset + str.length * 2, 0xffff, true)
  }
}

/**
 * Convert Gen 5 encoded bytes to string. Equivalent to UTF-16, except
 * terminated with 0xffff character
 * @param bytes the buffer from which to read
 * @param offset buffer offset to start at
 * @param length character length of string (bytes / 2)
 * @returns string of decoded Gen 5 bytes
 */
export const readGen5StringFromBytes = (dataView: DataView, offset: number, length: number) => {
  let str = ''

  for (let i = 0; i < length; i += 1) {
    const value = dataView.getUint16(offset + 2 * i, true)

    if (value === 0xffff) {
      return str
    }

    str += String.fromCharCode(value)
  }

  return str
}

/**
 * Convert string to Gen 5 encoded bytes. Equivalent to UTF-16, except
 * terminated with 0xffff character
 * @param str the string to encode
 * @param length character length of string
 * @param terminate include 0xffff at the end
 * @returns UInt8Array of Gen 5 bytes
 */
export const writeGen5StringToBytes = (
  dataView: DataView,
  str: string,
  offset: number,
  length: number
) => {
  for (let i = 0; i < Math.min(str.length, length); i++) {
    const val = str.charCodeAt(i)

    if (val === 0 || i >= str.length) {
      break
    }

    dataView.setUint16(offset + i * 2, val, true)
  }

  if (str.length < length) {
    dataView.setUint16(offset + str.length * 2, 0xffff, true)
  }
}

/**
 * Convert UTF-16 encoded bytes to string
 * @param bytes the buffer from which to read
 * @param offset buffer offset to start at
 * @param length character length of string (bytes / 2)
 * @returns string of decoded utf-16 bytes
 */
export const utf16BytesToString = (
  bytes: ArrayBufferLike,
  offset: number,
  length: number,
  littleEndian: boolean = true
) => {
  const byteArray = new Uint16Array(length)
  const dataView = new DataView(bytes)

  for (let i = 0; i < length; i += 1) {
    const value = dataView.getUint16(offset + 2 * i, littleEndian)

    if (value === 0) {
      break
    }

    byteArray[i] = value
  }

  let stringLength = byteArray.indexOf(0)

  if (stringLength < 0) {
    stringLength = length
  }

  const str = new TextDecoder('utf-16').decode(byteArray.slice(0, stringLength))

  return str
}

/**
 * Convert string to UTF-16 encoded bytes
 * @param str the string to encode
 * @param length character length of string
 * @returns ArrayBufferLike of UTF-16 bytes
 */
export const writeUTF16StringToBytes = (
  dataView: DataView,
  str: string,
  offset: number,
  length: number,
  bigEndian: boolean = false
) => {
  for (let i = 0; i < Math.min(str.length, length); i++) {
    const val = str.charCodeAt(i)

    dataView.setUint16(offset + i * 2, val, !bigEndian)
  }
}
