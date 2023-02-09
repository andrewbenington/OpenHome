import { Abilities } from "../consts/Abilities";
import { Gen3Items } from "../consts/Items";
import { Languages } from "../consts/Languages";
import { MONS_LIST } from "../consts/Mons";
import { Gen3Ribbons } from "../consts/Ribbons";
import { getMetLocation } from "../MetLocation/MetLocation";
import { gen3ToNational } from "../util/ConvertPokemonID";
import { decryptByteArrayGen3, unshuffleBlocksGen3 } from "../util/Encryption";
import { getGen3To5Gender } from "../util/GenderCalc";
import {
  getHPGen3Onward,
  getLevelGen3Onward,
  getStatGen3Onward,
} from "../util/StatCalc";
import { gen3StringToUTF } from "../util/Strings/StringConverter";
import {
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
} from "../util/ByteLogic";
import { pkm } from "./pkm";

export class pk3 extends pkm {
  constructor(...args: any[]) {
    if (args.length >= 1 && args[0] instanceof Uint8Array) {
      const bytes = args[0]
      const encrypted = args[1] ?? false
      if (encrypted) {
        let unencryptedBytes = decryptByteArrayGen3(bytes);
        let unshuffledBytes = unshuffleBlocksGen3(unencryptedBytes);
        super(unshuffledBytes);
      } else {
        super(bytes);
      }
      this.format = "pk3";
      this.personalityValue = bytesToUint32LittleEndian(bytes, 0x00);
      this.trainerID = bytesToUint16LittleEndian(bytes, 0x04);
      this.secretID = bytesToUint16LittleEndian(bytes, 0x06);
      this.displayID = this.trainerID;
      this.dexNum = gen3ToNational(bytesToUint16LittleEndian(bytes, 0x20));
      this.gender = getGen3To5Gender(this.personalityValue, this.dexNum);
      this.exp = bytesToUint32LittleEndian(bytes, 0x24);
      this.level =
        this.dexNum > 0 ? getLevelGen3Onward(this.dexNum, this.exp) : 0;
      if (this.dexNum === 201) {
        let letterValue = (this.personalityValue >> 24) & 0x3;
        letterValue =
          ((this.personalityValue >> 16) & 0x3) | (letterValue << 2);
        letterValue = ((this.personalityValue >> 8) & 0x3) | (letterValue << 2);
        letterValue = (this.personalityValue & 0x3) | (letterValue << 2);
        this.formNum = letterValue % 28;
      }
      this.heldItem =
        Gen3Items[bytesToUint16LittleEndian(bytes, 0x22)] ?? "None";
      this.language = Languages[bytes[0x12]];
      this.ability = Abilities[bytesToUint16LittleEndian(bytes, 0x15)];
      this.nature = this.personalityValue % 25;
      let metData = bytesToUint16LittleEndian(bytes, 0x46);
      this.ball = (metData >> 11) & 0xf;
      this.metLevel = metData & 0x7f;
      this.trainerGender = (metData >> 15) & 1;
      this.moves = [
        bytesToUint16LittleEndian(bytes, 0x2c),
        bytesToUint16LittleEndian(bytes, 0x2e),
        bytesToUint16LittleEndian(bytes, 0x30),
        bytesToUint16LittleEndian(bytes, 0x32),
      ];
      let ivBytes = bytesToUint32LittleEndian(bytes, 0x48);
      this.abilityNum = (ivBytes >> 31) & 1 ? 2 : 1;
      this.ability =
        this.abilityNum === 1
          ? MONS_LIST[this.dexNum]?.formes[0].ability1
          : MONS_LIST[this.dexNum]?.formes[0].ability1 ?? "None";
      this.ivs = {
        hp: ivBytes & 0x1f,
        atk: (ivBytes >> 5) & 0x1f,
        def: (ivBytes >> 10) & 0x1f,
        spe: (ivBytes >> 15) & 0x1f,
        spa: (ivBytes >> 20) & 0x1f,
        spd: (ivBytes >> 25) & 0x1f,
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
      this.stats = {
        hp: getHPGen3Onward(this),
        atk: getStatGen3Onward("Atk", this),
        def: getStatGen3Onward("Def", this),
        spe: getStatGen3Onward("Spe", this),
        spa: getStatGen3Onward("SpA", this),
        spd: getStatGen3Onward("SpD", this),
      };
      this.gameOfOrigin = (metData >> 7) & 0xf;
      this.nickname = gen3StringToUTF(bytes, 0x08, 10);
      this.trainerName = gen3StringToUTF(bytes, 0x14, 7);
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
        getMetLocation(this.gameOfOrigin, bytes[0x45]) ??
        bytes[0x45].toString();
      this.isShiny =
        (this.trainerID ^
          this.secretID ^
          bytesToUint16LittleEndian(bytes, 0x00) ^
          bytesToUint16LittleEndian(bytes, 0x02)) <
        8;
    } else if (args.length === 1 && args[0] instanceof pkm) {
      super(new Uint8Array())
      Object.assign(this, args[0])
      this.format = "pk3"
      return
    } else {
      return
    }
  }
}
