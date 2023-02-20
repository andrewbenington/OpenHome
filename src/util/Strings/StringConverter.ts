import { bytesToUint16LittleEndian } from '../ByteLogic';
import Gen4ToUTFMap from './Gen4ToUTFMap';
import UTFToGen4Map from './UTFToGen4Map';

export const G1_TERMINATOR = 0x50;
export const G1_TRADE_OT = 0x5d;

export const GBStringDict: { [key: number]: string } = {
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
  0xe1: 'Pk' /* Pk */,
  0xe2: 'Mn' /* Mn */,
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
};

export const gen12StringToUTF = (
  bytes: Uint8Array,
  offset: number,
  length: number
) => {
  let str = '';
  for (let i = offset; i < offset + length; i += 1) {
    if (bytes[i] === G1_TERMINATOR) {
      break;
    }
    str += GBStringDict[bytes[i]] ?? '';
  }
  return str;
};

export const utf16StringToGen12 = (
  str: string,
  length: number,
  terminate: boolean
) => {
  var bufView = new Uint8Array(length);
  console.log(str);
  for (var i = 0; i < Math.min(str.length, length); i++) {
    let gen12DictEntry = Object.entries(GBStringDict).find(
      ([key, val]) => val === str.charAt(i)
    );
    console.log(str.charCodeAt(i));
    console.log(gen12DictEntry);
    if (str.charCodeAt(i) === 0) {
      break;
    } else if (!gen12DictEntry) {
      bufView[i] = 0xe6;
    } else {
      bufView[i] = parseInt(gen12DictEntry[0]);
    }
  }
  if (terminate) {
    let terminalIndex = Math.min(str.length, length - 1);
    bufView[terminalIndex] = G1_TERMINATOR;
  }
  return bufView;
};

export const gen3StringToUTF = (
  bytes: Uint8Array,
  offset: number,
  length: number
) => {
  let str = '';
  for (let i = offset; i < offset + length; i += 1) {
    if (bytes[i] === 0xff) {
      return str;
    }
    str += Gen3CharacterSet[bytes[i]];
  }
  return str;
};

export const utf16StringToGen3 = (
  str: string,
  length: number,
  terminate: boolean
) => {
  var bufView = new Uint8Array(length);
  for (var i = 0; i < Math.min(str.length, length); i++) {
    console.log(str.charCodeAt(i));
    let gen3Char = Gen3CharacterSet.indexOf(str.charAt(i));
    if (str.charCodeAt(i) === 0) {
      break;
    } else if (gen3Char === -1) {
      // missing characters are now '?'
      bufView[i] = 172;
    } else {
      bufView[i] = gen3Char;
    }
  }
  if (terminate && Math.min(str.indexOf('\0'), str.length - 1) < length - 1) {
    const terminalIndex = Math.min(str.indexOf('\0'), str.length - 1);
    bufView[terminalIndex] = 0xff;
  }
  return bufView;
};

export const gen4StringToUTF = (
  bytes: Uint8Array,
  offset: number,
  length: number
) => {
  let str = '';
  for (let i = 0; i < length; i += 1) {
    let value = bytesToUint16LittleEndian(bytes, offset + 2 * i);
    if (value === 0xffff) {
      return str;
    }
    str += String.fromCharCode(Gen4ToUTFMap[value]);
  }
  return str;
};

export const utf16StringToGen4 = (
  str: string,
  length: number,
  terminate: boolean
) => {
  var buf = new ArrayBuffer(length * 2);
  var bufView = new Uint16Array(buf);
  for (var i = 0; i < Math.min(str.length, length); i++) {
    let gen4Char = UTFToGen4Map[str.charCodeAt(i)];
    console.log(str.charAt(i), str.charCodeAt(i), gen4Char)
    if (str.charCodeAt(i) === 0) {
      break;
    } else if (gen4Char === -1) {
      // missing characters are now '?'
      bufView[i] = 0x01ac;
    } else {
      bufView[i] = gen4Char;
    }
  }
  if (terminate) {
    let terminalIndex = Math.min(str.length, length - 1);
    bufView[terminalIndex] = 0xffff;
  }
  return new Uint8Array(buf);
};

export const utf16BytesToString = (
  bytes: Uint8Array,
  offset: number,
  length: number
) => {
  let byteArray = new Uint16Array(length);
  for (let i = 0; i < length; i += 1) {
    let value = bytesToUint16LittleEndian(bytes, offset + 2 * i);
    if (value === 0) {
      break;
    }
    byteArray[i] = value;
  }
  let stringLength = byteArray.indexOf(0);
  if (stringLength < 0) {
    stringLength = length;
  }
  return new TextDecoder('utf-16').decode(byteArray.slice(0, stringLength));
};

export const utf16StringToBytes = (str: string, length: number) => {
  var buf = new ArrayBuffer(length * 2);
  var bufView = new Uint16Array(buf);
  for (var i = 0; i < Math.min(str.length, length); i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return new Uint8Array(buf);
};

const Gen3CharacterSet = [
  ' ',
  'À',
  'Á',
  'Â',
  'Ç',
  'È',
  'É',
  'Ê',
  'Ë',
  'Ì',
  'こ',
  'Î',
  'Ï',
  'Ò',
  'Ó',
  'Ô',
  'Œ',
  'Ù',
  'Ú',
  'Û',
  'Ñ',
  'ß',
  'à',
  'á',
  'ね',
  'Ç',
  'È',
  'é',
  'ê',
  'ë',
  'ì',
  'í',
  'î',
  'ï',
  'ò',
  'ó',
  'ô',
  'œ',
  'ù',
  'ú',
  'û',
  'ñ',
  'º',
  'ª',
  '⒅',
  '&',
  '+',
  'あ',
  'ぃ',
  'ぅ',
  'ぇ',
  'ぉ',
  'ゃ',
  '=',
  'ょ',
  'が',
  'ぎ',
  'ぐ',
  'げ',
  'ご',
  'ざ',
  'じ',
  'ず',
  'ぜ', // 3
  'ぞ',
  'だ',
  'ぢ',
  'づ',
  'で',
  'ど',
  'ば',
  'び',
  'ぶ',
  'べ',
  'ぼ',
  'ぱ',
  'ぴ',
  'ぷ',
  'ぺ',
  'ぽ', // 4
  'っ',
  '¿',
  '¡',
  'PK',
  'MN',
  'オ',
  'カ',
  'キ',
  'ク',
  'ケ',
  'Í',
  'コ',
  'サ',
  'ス',
  'セ',
  'ソ', // 5
  'タ',
  'チ',
  'ツ',
  'テ',
  'ト',
  'ナ',
  'ニ',
  'ヌ',
  'â',
  'ノ',
  'ハ',
  'ヒ',
  'フ',
  'ヘ',
  'ホ',
  'í',
  'ミ',
  'ム',
  'メ',
  'モ',
  'ヤ',
  'ユ',
  'ヨ',
  'ラ',
  'リ',
  'ル',
  'レ',
  'ロ',
  'ワ',
  'ヲ',
  'ン',
  'ァ',
  'ィ',
  'ゥ',
  'ェ',
  'ォ',
  'ャ',
  'ュ',
  'ョ',
  'ガ',
  'ギ',
  'グ',
  'ゲ',
  'ゴ',
  'ザ',
  'ジ',
  'ズ',
  'ゼ',
  'ゾ',
  'ダ',
  'ヂ',
  'ヅ',
  'デ',
  'ド',
  'バ',
  'ビ',
  'ブ',
  'ベ',
  'ボ',
  'パ',
  'ピ',
  'プ',
  'ペ',
  'ポ',
  'ッ',
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '!',
  '?',
  '.',
  '-',
  '・',
  '…',
  '“',
  '”',
  '‘',
  '’',
  '♂',
  '♀',
  '$',
  ',',
  '⑧',
  '/',
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U', // C
  'V',
  'W',
  'X',
  'Y',
  'Z',
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'q',
  'r',
  's',
  't',
  'u',
  'v',
  'w',
  'x',
  'y',
  'z',
  '0',
  ':',
  'Ä',
  'Ö',
  'Ü',
  'ä',
  'ö',
  'ü',
];
