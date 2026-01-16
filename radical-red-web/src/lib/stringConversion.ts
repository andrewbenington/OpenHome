// Gen 3 string conversion utilities

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
]

export const gen3StringToUTF = (bytes: Uint8Array, start: number, maxLength: number): string => {
  let result = ''
  for (let i = start; i < start + maxLength && i < bytes.length; i++) {
    const byte = bytes[i]
    if (byte === 0xff || byte === 0x00) break // Terminator
    if (byte < Gen3CharacterSet.length) {
      result += Gen3CharacterSet[byte]
    } else {
      result += '?'
    }
  }
  return result.trim()
}

export const utf8ToGen3String = (str: string, maxLength: number): Uint8Array => {
  const result = new Uint8Array(maxLength)
  result.fill(0xff) // Fill with terminators

  for (let i = 0; i < Math.min(str.length, maxLength); i++) {
    const char = str[i]
    const index = Gen3CharacterSet.indexOf(char)
    result[i] = index >= 0 ? index : 0
  }

  return result
}
