use pkm_rs_types::Language;
use serde::{Deserialize, Serialize};
use std::{fmt::Display, marker::PhantomData};

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;
#[cfg(feature = "randomize")]
use rand::RngExt;

#[cfg(feature = "wasm")]
use tsify::Tsify;
#[cfg(feature = "wasm")]
use wasm_bindgen::{JsValue, convert::*, describe::*, prelude::*};

const TERMINATOR: u8 = 0xff;

pub type Gen3NicknameString<const N: usize> = Gen3String<N, SingleTerminator>;
pub type Gen3TrainerString<const N: usize> = Gen3String<N, TerminatorFill>;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Gen3String<const N: usize, TS: TerminatorStrategy> {
    raw: [u8; N],
    encoding: Gen3Encoding,
    _terminator_strategy: PhantomData<TS>,
}

impl<const N: usize, TS: TerminatorStrategy> Gen3String<N, TS> {
    pub(crate) const fn from_raw(raw: [u8; N], encoding: Gen3Encoding) -> Self {
        Self {
            raw,
            encoding,
            _terminator_strategy: PhantomData,
        }
    }

    fn from_str_inner(s: &str, encoding: Gen3Encoding) -> Self {
        let mut raw = [0; N];
        let encoded: Vec<u8> = s.chars().filter_map(|c| encoding.encode(c)).collect();

        let len = encoded.len().min(N);
        raw[..len].copy_from_slice(&encoded[..len]);

        TS::set_terminators(&mut raw, len);

        Self::from_raw(raw, encoding)
    }

    pub fn from_stringlike(value: impl Into<String>, encoding: Gen3Encoding) -> Self {
        Self::from_str_inner(&value.into(), encoding)
    }

    // because both have the same N, both are enforced to be the same length and no length check is needed
    pub fn identical_until_terminator(&self, other: &Gen3String<N, TS>) -> bool {
        self.raw
            .into_iter()
            .take_while(|byte| *byte != TERMINATOR)
            .enumerate()
            .all(|(index, byte)| other.raw[index] == byte)
    }

    pub fn convert_to_string(&self) -> String {
        self.raw
            .iter()
            .copied()
            .take_while(|c| *c != TERMINATOR)
            .map(|index| self.encoding.decode(index))
            .collect()
    }

    pub const fn bytes(&self) -> [u8; N] {
        self.raw
    }
}

pub trait TerminatorStrategy {
    fn set_terminators<const N: usize>(raw: &mut [u8; N], str_len: usize);
}

#[derive(Debug, Clone, Copy)]
pub struct SingleTerminator;

impl TerminatorStrategy for SingleTerminator {
    fn set_terminators<const N: usize>(raw: &mut [u8; N], str_len: usize) {
        if str_len < N {
            raw[str_len] = TERMINATOR;
        }
    }
}

#[derive(Debug, Clone, Copy)]
pub struct TerminatorFill;

impl TerminatorStrategy for TerminatorFill {
    fn set_terminators<const N: usize>(raw: &mut [u8; N], str_len: usize) {
        (str_len..N).for_each(|i| {
            raw[i] = TERMINATOR;
        });
    }
}

impl<const N: usize, TS: TerminatorStrategy> Display for Gen3String<N, TS> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        self.convert_to_string().fmt(f)
    }
}

impl<const N: usize, TS: TerminatorStrategy> Default for Gen3String<N, TS> {
    fn default() -> Self {
        Self::from_raw([0; N], Gen3Encoding::default())
    }
}

impl<const N: usize, TS: TerminatorStrategy> Serialize for Gen3String<N, TS> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        self.to_string().serialize(serializer)
    }
}

#[cfg(feature = "randomize")]
impl<const N: usize, TS: TerminatorStrategy> Randomize for Gen3String<N, TS> {
    fn randomized<R: rand::Rng>(rng: &mut R) -> Self {
        let mut raw = [0u8; N];
        let length: usize = rng.random_range(0..N);
        let encoding = Gen3Encoding::randomized(rng);
        for character in raw.iter_mut().take(length) {
            *character = loop {
                let encoded = rng.random_range(0..=255u8);
                if encoded != TERMINATOR && encoding.decode(encoded) != INVALID {
                    break encoded;
                }
            };
        }

        if length < N {
            raw[length] = TERMINATOR;
        }

        Self::from_raw(raw, Gen3Encoding::randomized(rng))
    }
}

impl<const N: usize, TS: TerminatorStrategy> WasmDescribe for Gen3String<N, TS> {
    fn describe() {
        js_sys::JsString::describe()
    }
}

impl<const N: usize, TS: TerminatorStrategy> IntoWasmAbi for Gen3String<N, TS> {
    type Abi = <js_sys::JsString as IntoWasmAbi>::Abi;

    fn into_abi(self) -> Self::Abi {
        JsValue::from_str(&self.to_string()).into_abi()
    }
}

#[cfg_attr(feature = "wasm", derive(Tsify, Serialize, Deserialize))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
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

const INVALID: char = '\u{FFFF}';

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
    INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID, INVALID,
];

const ENCODING_JPN: [char; 256] = [
    '　', 'あ', 'い', 'う', 'え', 'お', 'か', 'き', 'く', 'け', 'こ', 'さ', 'し', 'す', 'せ',
    'そ', // 0
    'た', 'ち', 'つ', 'て', 'と', 'な', 'に', 'ぬ', 'ね', 'の', 'は', 'ひ', 'ふ', 'へ', 'ほ',
    'ま', // 1
    'み', 'む', 'め', 'も', 'や', 'ゆ', 'よ', 'ら', 'り', 'る', 'れ', 'ろ', 'わ', 'を', 'ん',
    'ぁ', // 2
    'ぃ', 'ぅ', 'ぇ', 'ぉ', 'ゃ', 'ゅ', 'ょ', 'が', 'ぎ', 'ぐ', 'げ', 'ご', 'ざ', 'じ', 'ず',
    'ぜ', // 3
    'ぞ', 'だ', 'ぢ', 'づ', 'で', 'ど', 'ば', 'び', 'ぶ', 'べ', 'ぼ', 'ぱ', 'ぴ', 'ぷ', 'ぺ',
    'ぽ', // 4
    'っ', 'ア', 'イ', 'ウ', 'エ', 'オ', 'カ', 'キ', 'ク', 'ケ', 'コ', 'サ', 'シ', 'ス', 'セ',
    'ソ', // 5
    'タ', 'チ', 'ツ', 'テ', 'ト', 'ナ', 'ニ', 'ヌ', 'ネ', 'ノ', 'ハ', 'ヒ', 'フ', 'ヘ', 'ホ',
    'マ', // 6
    'ミ', 'ム', 'メ', 'モ', 'ヤ', 'ユ', 'ヨ', 'ラ', 'リ', 'ル', 'レ', 'ロ', 'ワ', 'ヲ', 'ン',
    'ァ', // 7
    'ィ', 'ゥ', 'ェ', 'ォ', 'ャ', 'ュ', 'ョ', 'ガ', 'ギ', 'グ', 'ゲ', 'ゴ', 'ザ', 'ジ', 'ズ',
    'ゼ', // 8
    'ゾ', 'ダ', 'ヂ', 'ヅ', 'デ', 'ド', 'バ', 'ビ', 'ブ', 'ベ', 'ボ', 'パ', 'ピ', 'プ', 'ペ',
    'ポ', // 9
    'ッ', '０', '１', '２', '３', '４', '５', '６', '７', '８', '９', '！', '？', '。', 'ー',
    '・', // A
    '…', '『', '』', '「', '」', '♂', '♀', '円', '．', '×', '／', 'Ａ', 'Ｂ', 'Ｃ', 'Ｄ',
    'Ｅ', // B
    'Ｆ', 'Ｇ', 'Ｈ', 'Ｉ', 'Ｊ', 'Ｋ', 'Ｌ', 'Ｍ', 'Ｎ', 'Ｏ', 'Ｐ', 'Ｑ', 'Ｒ', 'Ｓ', 'Ｔ',
    'Ｕ', // C
    'Ｖ', 'Ｗ', 'Ｘ', 'Ｙ', 'Ｚ', 'ａ', 'ｂ', 'ｃ', 'ｄ', 'ｅ', 'ｆ', 'ｇ', 'ｈ', 'ｉ', 'ｊ',
    'ｋ', // D
    'ｌ', 'ｍ', 'ｎ', 'ｏ', 'ｐ', 'ｑ', 'ｒ', 'ｓ', 'ｔ', 'ｕ', 'ｖ', 'ｗ', 'ｘ', 'ｙ', 'ｚ',
    '►', // E
    '：', 'Ä', 'Ö', 'Ü', 'ä', 'ö', 'ü', '↑', '↓', '←', '→', '＋', INVALID, INVALID, INVALID,
    INVALID, // F
             // 256 length so indexing by a u8 (to usize) is always valid
];

#[cfg(feature = "wasm")]
#[wasm_bindgen]
pub struct Gen3Strings;

#[cfg(feature = "wasm")]
#[wasm_bindgen]
impl Gen3Strings {
    #[wasm_bindgen(js_name = encodeTo7BytesSingleTerminator)]
    pub fn encode_to_7_bytes_single_terminator(value: String, encoding: Gen3Encoding) -> Vec<u8> {
        Gen3String::<7, SingleTerminator>::from_stringlike(value, encoding)
            .bytes()
            .to_vec()
    }

    #[wasm_bindgen(js_name = encodeTo10BytesSingleTerminator)]
    pub fn encode_to_10_bytes_single_terminator(value: String, encoding: Gen3Encoding) -> Vec<u8> {
        Gen3String::<10, SingleTerminator>::from_stringlike(value, encoding)
            .bytes()
            .to_vec()
    }

    #[wasm_bindgen(js_name = decode7Bytes)]
    pub fn decode_7_bytes(bytes: Vec<u8>, encoding: Gen3Encoding) -> String {
        let mut byte_array = [0u8; 7];
        let byte_count = bytes.len().min(7);
        byte_array[0..byte_count].copy_from_slice(&bytes[0..byte_count]);
        Gen3String::<7, SingleTerminator>::from_raw(byte_array, encoding).convert_to_string()
    }

    #[wasm_bindgen(js_name = decode10Bytes)]
    pub fn decode_10_bytes(bytes: Vec<u8>, encoding: Gen3Encoding) -> String {
        let mut byte_array = [0u8; 10];
        let byte_count = bytes.len().min(10);
        byte_array[0..byte_count].copy_from_slice(&bytes[0..byte_count]);
        Gen3String::<10, SingleTerminator>::from_raw(byte_array, encoding).convert_to_string()
    }
}
