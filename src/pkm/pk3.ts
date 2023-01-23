import { Abilities } from "../consts/Abilities";
import { Gen3Items } from "../consts/Items";
import { Languages } from "../consts/Languages";
import { MONS_LIST } from "../consts/Mons";
import { Gen3Ribbons } from "../consts/Ribbons";
import { getMetLocation } from "../MetLocation/MetLocation";
import { bytesToUint16LittleEndian, bytesToUint32LittleEndian } from "../util/utils";
import { pkm } from "./pkm";

export class pk3 extends pkm {
  constructor(bytes: Uint8Array) {
    super(bytes);
    this.format = "pk3";
    this.personalityValue = bytesToUint32LittleEndian(bytes, 0x00);
    this.dexNum = gen3ToNational(bytesToUint16LittleEndian(bytes, 0x20));
    this.formNum = 0;
    this.heldItem = Gen3Items[bytesToUint16LittleEndian(bytes, 0x22)];
    this.language = Languages[bytes[0x12]]
    this.ability = Abilities[bytesToUint16LittleEndian(bytes, 0x15)];
    this.nature = this.personalityValue % 25;
    this.trainerID = bytesToUint16LittleEndian(bytes, 0x04);
    this.secretID = bytesToUint16LittleEndian(bytes, 0x06);
    this.displayID = this.trainerID;
    let metData = bytesToUint16LittleEndian(bytes, 0x46);
    this.ball = metData >> 11 & 0xf;
    this.metLevel = metData & 0x7f;
    this.trainerGender = (metData >> 15) & 1;
    this.moves = [
      bytesToUint16LittleEndian(bytes, 0x2c),
      bytesToUint16LittleEndian(bytes, 0x2e),
      bytesToUint16LittleEndian(bytes, 0x30),
      bytesToUint16LittleEndian(bytes, 0x32),
    ];
    let ivBytes = bytesToUint32LittleEndian(bytes, 0x48);
    this.abilityNum = ivBytes >> 31 === 1 ? 1 : 2;
    this.ability = this.abilityNum === 1 ? MONS_LIST[this.dexNum].formes[0].ability1 : MONS_LIST[this.dexNum].formes[0].ability1 ?? "None"
    this.ivs = {
      hp: ivBytes & 0x1f,
      atk: (ivBytes >> 5) & 0x1f,
      def: (ivBytes >> 10) & 0x1f,
      spa: (ivBytes >> 15) & 0x1f,
      spd: (ivBytes >> 20) & 0x1f,
      spe: (ivBytes >> 25) & 0x1f,
    };
    this.evs = {
      hp: bytes[0x38],
      atk: bytes[0x39],
      def: bytes[0x3a],
      spa: bytes[0x3b],
      spd: bytes[0x3c],
      spe: bytes[0x3d],
    };
    this.contest = {
      cool: bytes[0x3e],
      beauty: bytes[0x3f],
      cute: bytes[0x40],
      smart: bytes[0x41],
      tough: bytes[0x42],
      sheen: bytes[0x43],
    };
    this.gameOfOrigin = (metData >> 7) & 0xf;
    this.nickname = "";
    for (let i = 0; i < 10; i += 1) {
      if (bytes[0x08 + i] === 0xff) {
        break;
      }
      this.nickname += Gen3CharacterSet[bytes[0x08 + i]];
    }
    this.trainerName = "";
    for (let i = 0; i < 10; i += 1) {
      if (bytes[0x14 + i] === 0xff) {
        break;
      }
      this.trainerName += Gen3CharacterSet[bytes[0x14 + i]];
    }
    this.ribbons = [];
    let ribbonsValue = bytesToUint32LittleEndian(bytes, 0x4c);
    for (let ribbon = 0; ribbon < Gen3Ribbons.length; ribbon++) {
      if (ribbonsValue & (1 << (15 + ribbon))) {
        this.ribbons.push(Gen3Ribbons[ribbon]);
      }
    }
    this.metYear = bytes[0x7b];
    this.metMonth = bytes[0x7c];
    this.metDay = bytes[0x7d];
    this.metLocation =
      getMetLocation(this.gameOfOrigin, bytes[0x45]) ?? bytes[0x45].toString();
    this.isShiny =
      (this.trainerID ^
        this.secretID ^
        bytesToUint16LittleEndian(bytes, 0x00) ^
        bytesToUint16LittleEndian(bytes, 0x02)) <
      8;
  }
}

export function gen3ToNational(value: number) {
  return value < gen3IDs.length ? gen3IDs[value] : 0;
}

let gen3IDs = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
  22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
  41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59,
  60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78,
  79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97,
  98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113,
  114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128,
  129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143,
  144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158,
  159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173,
  174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188,
  189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203,
  204, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218,
  219, 220, 221, 222, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233,
  234, 235, 236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246, 247, 248,
  249, 250, 251, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 252, 253, 254, 255, 256, 257, 258, 259, 260, 261, 262, 263, 264,
  265, 266, 267, 268, 269, 270, 271, 272, 273, 274, 275, 290, 291, 292, 276,
  277, 285, 286, 327, 278, 279, 283, 284, 320, 321, 300, 301, 352, 343, 344,
  299, 324, 302, 339, 340, 370, 341, 342, 349, 350, 318, 319, 328, 329, 330,
  296, 297, 309, 310, 322, 323, 363, 364, 365, 331, 332, 361, 362, 337, 338,
  298, 325, 326, 311, 312, 303, 307, 308, 333, 334, 360, 355, 356, 315, 287,
  288, 289, 316, 317, 357, 293, 294, 295, 366, 367, 368, 359, 353, 354, 336,
  335, 369, 304, 305, 306, 351, 313, 314, 345, 346, 347, 348, 280, 281, 282,
  371, 372, 373, 374, 375, 376, 377, 378, 379, 382, 383, 384, 380, 381, 385,
  386, 358,
];

const Gen3CharacterSet = [
  " ",
  "À",
  "Á",
  "Â",
  "Ç",
  "È",
  "É",
  "Ê",
  "Ë",
  "Ì",
  "こ",
  "Î",
  "Ï",
  "Ò",
  "Ó",
  "Ô", // 0
  "Œ",
  "Ù",
  "Ú",
  "Û",
  "Ñ",
  "ß",
  "à",
  "á",
  "ね",
  "Ç",
  "È",
  "é",
  "ê",
  "ë",
  "ì",
  "í", // 1
  "î",
  "ï",
  "ò",
  "ó",
  "ô",
  "œ",
  "ù",
  "ú",
  "û",
  "ñ",
  "º",
  "ª",
  "⒅",
  "&",
  "+",
  "あ", // 2
  "ぃ",
  "ぅ",
  "ぇ",
  "ぉ",
  "ゃ",
  "=",
  "ょ",
  "が",
  "ぎ",
  "ぐ",
  "げ",
  "ご",
  "ざ",
  "じ",
  "ず",
  "ぜ", // 3
  "ぞ",
  "だ",
  "ぢ",
  "づ",
  "で",
  "ど",
  "ば",
  "び",
  "ぶ",
  "べ",
  "ぼ",
  "ぱ",
  "ぴ",
  "ぷ",
  "ぺ",
  "ぽ", // 4
  "っ",
  "¿",
  "¡",
  "PK",
  "MN",
  "オ",
  "カ",
  "キ",
  "ク",
  "ケ",
  "Í",
  "コ",
  "サ",
  "ス",
  "セ",
  "ソ", // 5
  "タ",
  "チ",
  "ツ",
  "テ",
  "ト",
  "ナ",
  "ニ",
  "ヌ",
  "â",
  "ノ",
  "ハ",
  "ヒ",
  "フ",
  "ヘ",
  "ホ",
  "í", // 6
  "ミ",
  "ム",
  "メ",
  "モ",
  "ヤ",
  "ユ",
  "ヨ",
  "ラ",
  "リ",
  "ル",
  "レ",
  "ロ",
  "ワ",
  "ヲ",
  "ン",
  "ァ", // 7
  "ィ",
  "ゥ",
  "ェ",
  "ォ",
  "ャ",
  "ュ",
  "ョ",
  "ガ",
  "ギ",
  "グ",
  "ゲ",
  "ゴ",
  "ザ",
  "ジ",
  "ズ",
  "ゼ", // 8
  "ゾ",
  "ダ",
  "ヂ",
  "ヅ",
  "デ",
  "ド",
  "バ",
  "ビ",
  "ブ",
  "ベ",
  "ボ",
  "パ",
  "ピ",
  "プ",
  "ペ",
  "ポ", // 9
  "ッ",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "!",
  "?",
  ".",
  "-",
  "・", // A
  "…",
  "“",
  "”",
  "‘",
  "’",
  "♂",
  "♀",
  "$",
  ",",
  "⑧",
  "/",
  "A",
  "B",
  "C",
  "D",
  "E", // B
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U", // C
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k", // D
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "0", // E
  ":",
  "Ä",
  "Ö",
  "Ü",
  "ä",
  "ö",
  "ü",
];
