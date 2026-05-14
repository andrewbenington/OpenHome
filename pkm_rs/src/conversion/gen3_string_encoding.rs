use pkm_rs_types::Language;
#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum Gen3Encoding {
    Int,
    #[default]
    Jpn,
}

impl Gen3Encoding {
    pub const fn decode(self, key: u8) -> char {
        let table = match self {
            Gen3Encoding::Int => ENCODING_INT,
            Gen3Encoding::Jpn => ENCODING_JPN,
        };

        table[key as usize]
    }

    pub fn encode(self, value: char) -> Option<u8> {
        let table = match self {
            Gen3Encoding::Int => ENCODING_INT,
            Gen3Encoding::Jpn => ENCODING_JPN,
        };

        table.iter().enumerate().find_map(|(index, val)| {
            if *val == value {
                Some(index as u8)
            } else {
                None
            }
        })
    }

    pub const fn from_language(language: Language) -> Self {
        match language {
            Language::Japanese => Self::Jpn,
            _ => Self::Int,
        }
    }
}

pub const TERMINATOR: char = '\u{FFFF}';

const ENCODING_INT: [char; 256] = [
    ' ', 'À', 'Á', 'Â', 'Ç', 'È', 'É', 'Ê', 'Ë', 'Ì', 'こ', 'Î', 'Ï', 'Ò', 'Ó', 'Ô', // 0x0n
    'Œ', 'Ù', 'Ú', 'Û', 'Ñ', 'ß', 'à', 'á', 'ね', 'ç', 'è', 'é', 'ê', 'ë', 'ì', 'ま', // 0x1n
    'î', 'ï', 'ò', 'ó', 'ô', 'œ', 'ù', 'ú', 'û', 'ñ', 'º', 'ª', '⑩', '&', '+', 'あ', // 0x2n
    'ぃ', 'ぅ', 'ぇ', 'ぉ', 'ゃ', '=', ';', 'が', 'ぎ', 'ぐ', 'げ', 'ご', 'ざ', 'じ', 'ず',
    'ぜ', // 0x3n
    'ぞ', 'だ', 'ぢ', 'づ', 'で', 'ど', 'ば', 'び', 'ぶ', 'べ', 'ぼ', 'ぱ', 'ぴ', 'ぷ', 'ぺ',
    'ぽ', // 0x4n
    'っ', '¿', '¡', '⒆', '⒇', 'オ', 'カ', 'キ', 'ク', 'ケ', 'Í', '%', '(', ')', 'セ',
    'ソ', // 0x5n
    'タ', 'チ', 'ツ', 'テ', 'ト', 'ナ', 'ニ', 'ヌ', 'â', 'ノ', 'ハ', 'ヒ', 'フ', 'ヘ', 'ホ',
    'í', // 0x6n
    'ミ', 'ム', 'メ', 'モ', 'ヤ', 'ユ', 'ヨ', 'ラ', 'リ', '↑', '↓', '←', '＋', 'ヲ', 'ン',
    'ァ', // 0x7n
    'ィ', 'ゥ', 'ェ', 'ォ', '⒅', '<', '>', 'ガ', 'ギ', 'グ', 'ゲ', 'ゴ', 'ザ', 'ジ', 'ズ',
    'ゼ', // 0x8n
    'ゾ', 'ダ', 'ヂ', 'ヅ', 'デ', 'ド', 'バ', 'ビ', 'ブ', 'ベ', 'ボ', 'パ', 'ピ', 'プ', 'ペ',
    'ポ', // 0x9n
    'ッ', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '!', '?', '.', '-', '･', // 0xAn
    '⑬', '“', '”', '‘', '\'', '♂', '♀', '$', ',', '⑧', '/', 'A', 'B', 'C', 'D', 'E', // 0xBn
    'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', // 0xCn
    'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', // 0xDn
    'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '►', // 0xEn
    ':', 'Ä', 'Ö', 'Ü', 'ä', 'ö', 'ü', // 0xFn
    // 256 length so indexing by a u8 (to usize) is always valid
    TERMINATOR, TERMINATOR, TERMINATOR, TERMINATOR, TERMINATOR, TERMINATOR, TERMINATOR, TERMINATOR,
    TERMINATOR,
];

const ENCODING_JPN: [char; 256] = [
    ' ', 'À', 'Á', 'Â', 'Ç', 'È', 'É', 'Ê', 'Ë', 'Ì', 'こ', 'Î', 'Ï', 'Ò', 'Ó', 'Ô', // 0x0n
    'Œ', 'Ù', 'Ú', 'Û', 'Ñ', 'ß', 'à', 'á', 'ね', 'ç', 'è', 'é', 'ê', 'ë', 'ì', 'ま', // 0x1n
    'î', 'ï', 'ò', 'ó', 'ô', 'œ', 'ù', 'ú', 'û', 'ñ', 'º', 'ª', '⑩', '&', '+', 'あ', // 0x2n
    'ぃ', 'ぅ', 'ぇ', 'ぉ', 'ゃ', '=', ';', 'が', 'ぎ', 'ぐ', 'げ', 'ご', 'ざ', 'じ', 'ず',
    'ぜ', // 0x3n
    'ぞ', 'だ', 'ぢ', 'づ', 'で', 'ど', 'ば', 'び', 'ぶ', 'べ', 'ぼ', 'ぱ', 'ぴ', 'ぷ', 'ぺ',
    'ぽ', // 0x4n
    'っ', '¿', '¡', '⒆', '⒇', 'オ', 'カ', 'キ', 'ク', 'ケ', 'Í', '%', '(', ')', 'セ',
    'ソ', // 0x5n
    'タ', 'チ', 'ツ', 'テ', 'ト', 'ナ', 'ニ', 'ヌ', 'â', 'ノ', 'ハ', 'ヒ', 'フ', 'ヘ', 'ホ',
    'í', // 0x6n
    'ミ', 'ム', 'メ', 'モ', 'ヤ', 'ユ', 'ヨ', 'ラ', 'リ', '↑', '↓', '←', '＋', 'ヲ', 'ン',
    'ァ', // 0x7n
    'ィ', 'ゥ', 'ェ', 'ォ', '⒅', '<', '>', 'ガ', 'ギ', 'グ', 'ゲ', 'ゴ', 'ザ', 'ジ', 'ズ',
    'ゼ', // 0x8n
    'ゾ', 'ダ', 'ヂ', 'ヅ', 'デ', 'ド', 'バ', 'ビ', 'ブ', 'ベ', 'ボ', 'パ', 'ピ', 'プ', 'ペ',
    'ポ', // 0x9n
    'ッ', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '!', '?', '.', '-', '･', // 0xAn
    '⑬', '“', '”', '‘', '\'', '♂', '♀', '$', ',', '⑧', '/', 'A', 'B', 'C', 'D', 'E', // 0xBn
    'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', // 0xCn
    'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', // 0xDn
    'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '►', // 0xEn
    ':', 'Ä', 'Ö', 'Ü', 'ä', 'ö', 'ü', TERMINATOR, TERMINATOR, TERMINATOR, TERMINATOR, TERMINATOR,
    TERMINATOR, TERMINATOR, TERMINATOR,
    TERMINATOR, // F
                // 256 length so indexing by a u8 (to usize) is always valid
];
