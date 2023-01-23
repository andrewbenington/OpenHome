import { getMetLocation } from "../MetLocation/MetLocation";
import { Gen3Ribbons, Gen9RibbonsPart1 } from "../consts/Ribbons";
import { bytesToUint16BigEndian, bytesToUint32BigEndian } from "../util/utils";
import { pkm } from "./pkm";
import { Abilities } from "../consts/Abilities";
import { Gen3Items, Items } from "../consts/Items";
import { MONS_LIST, NationalDex } from "../consts/Mons";
import { GameOfOrigin } from "../consts/GameOfOrigin";

export class colopkm extends pkm {
  constructor(bytes: Uint8Array) {
    super(bytes);
    this.format = "colopkm";
    this.personalityValue = bytesToUint32BigEndian(bytes, 0x04);
    this.dexNum = gen3IDs[bytesToUint16BigEndian(bytes, 0x00)];
    this.formNum = 0;
    this.heldItem = Gen3Items[bytesToUint16BigEndian(bytes, 0x88)];
    this.nature = this.personalityValue % 25;
    this.trainerID = bytesToUint16BigEndian(bytes, 0x14);
    this.secretID = bytesToUint16BigEndian(bytes, 0x16);
    this.displayID = this.trainerID;
    this.ball = bytes[0x0f];
    this.metLevel = bytes[0x0e];
    this.trainerGender = bytes[0x10];
    this.isShadow =
      bytesToUint16BigEndian(bytes, 0xd8) > 0 &&
      bytesToUint16BigEndian(bytes, 0xdc) === 0;
    this.moves = [
      bytesToUint16BigEndian(bytes, 0x78),
      bytesToUint16BigEndian(bytes, 0x7c),
      bytesToUint16BigEndian(bytes, 0x80),
      bytesToUint16BigEndian(bytes, 0x84),
    ];
    this.abilityNum = bytes[0xcc] + 1;
    this.ability =
      this.abilityNum === 1
        ? MONS_LIST[this.dexNum]?.formes[0].ability1
        : MONS_LIST[this.dexNum]?.formes[0].ability2 ?? "None";
    this.ivs = {
      hp: bytesToUint16BigEndian(bytes, 0xa4),
      atk: bytesToUint16BigEndian(bytes, 0xa6),
      def: bytesToUint16BigEndian(bytes, 0xa8),
      spa: bytesToUint16BigEndian(bytes, 0xaa),
      spd: bytesToUint16BigEndian(bytes, 0xac),
      spe: bytesToUint16BigEndian(bytes, 0xae),
    };
    this.evs = {
      hp: bytesToUint16BigEndian(bytes, 0x98),
      atk: bytesToUint16BigEndian(bytes, 0x9a),
      def: bytesToUint16BigEndian(bytes, 0x9c),
      spa: bytesToUint16BigEndian(bytes, 0x9e),
      spd: bytesToUint16BigEndian(bytes, 0xa0),
      spe: bytesToUint16BigEndian(bytes, 0xa2),
    };
    this.contest = {
      cool: bytes[0xb2],
      beauty: bytes[0xb3],
      cute: bytes[0xb4],
      smart: bytes[0xb5],
      tough: bytes[0xb6],
      sheen: bytes[0xbc],
    };
    let origin = GameOfOrigin.find((game) => game?.gc === bytes[0x08]) ?? null;
    this.gameOfOrigin = GameOfOrigin.indexOf(origin);
    let byteArray = new Uint16Array(12);
    for (let i = 0; i < 12; i += 1) {
      let byte = bytesToUint16BigEndian(bytes, 0x2e + 2 * i);
      if (byte == 0) {
        break;
      }
      byteArray[i] = byte;
    }
    this.nickname = new TextDecoder("utf-16").decode(byteArray);
    byteArray = new Uint16Array(12);
    for (let i = 0; i < 12; i += 1) {
      let byte = bytesToUint16BigEndian(bytes, 0x18 + 2 * i);
      if (byte == 0) {
        break;
      }
      byteArray[i] = byte;
    }
    this.trainerName = new TextDecoder("utf-16").decode(byteArray);
    this.ribbons = [];
    for (let index = 0; index < Gen3Ribbons.length; index++) {
      if (bytes[index + 0xbd] === 1) {
        this.ribbons.push(Gen3Ribbons[index]);
      }
    }
    this.metYear = bytes[0x7b];
    this.metMonth = bytes[0x7c];
    this.metDay = bytes[0x7d];
    this.metLocation =
      getMetLocation(this.gameOfOrigin, bytesToUint16BigEndian(bytes, 0x0c)) ??
      bytesToUint16BigEndian(bytes, 0x0c).toString();
    this.isShiny =
      (this.trainerID ^
        this.secretID ^
        bytesToUint16BigEndian(bytes, 0x00) ^
        bytesToUint16BigEndian(bytes, 0x02)) <
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
