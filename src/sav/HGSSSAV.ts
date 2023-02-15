import { pk4 } from '../pkm/pk4';
import { bytesToUint16LittleEndian } from '../util/ByteLogic';
import { gen4StringToUTF } from '../util/Strings/StringConverter';
import { G4Box, G4SAV } from './G4SAV';

export class HGSSSAV extends G4SAV {
  static TRAINER_OFFSET = 0x0ff4 * 0;
  static TEAM_ITEMS_OFFSET = 0x0ff4 * 1;
  static PC_OFFSET = 0xf700;
  static BOX_NAMES_OFFSET = 0x21708;
  static BOX_SIZE = 4080 + 0x10;
  constructor(path: string, bytes: Uint8Array) {
    super(path, bytes);
    for (let box = 0; box < 18; box++) {
      let charArray = new Uint16Array(20);
      let boxLabel = gen4StringToUTF(
        bytes,
        HGSSSAV.BOX_NAMES_OFFSET + 40 * box,
        20
      );
      for (let i = 0; i < 20; i += 1) {
        let value = bytesToUint16LittleEndian(
          bytes,
          HGSSSAV.BOX_NAMES_OFFSET + 40 * box + 2 * i
        );
        if (value === 0xffff) {
          break;
        }
        if (value === 0) {
          charArray[i] = 0x3000;
        } else if (value <= 0xa1 && value >= 2) {
          charArray[i] = value + 0x3039;
        } else if (value <= 0xe1) {
          charArray[i] = value + 0xfe6e;
        } else if (value <= 0x012a && value >= 0x0121) {
          charArray[i] = value - 0xf1;
        } else if (value <= 324 && value >= 299) {
          charArray[i] = value - 234;
        } else if (value <= 350 && value >= 325) {
          charArray[i] = value - 228;
        } else if (value === 0x01de) {
          charArray[i] = 0x0020;
        } else {
          charArray[i] = value;
        }
      }
      this.boxes[box] = new G4Box(boxLabel);
    }

    for (let box = 0; box < 18; box++) {
      for (let monIndex = 0; monIndex < 30; monIndex++) {
        try {
          let startByte =
            HGSSSAV.PC_OFFSET + HGSSSAV.BOX_SIZE * box + 136 * monIndex;
          let endByte =
            HGSSSAV.PC_OFFSET + HGSSSAV.BOX_SIZE * box + 136 * (monIndex + 1);
          let monData = bytes.slice(startByte, endByte);
          let mon = new pk4(monData, true);
          if (mon.dexNum !== 0 && mon.gameOfOrigin !== 0) {
            this.boxes[box].pokemon[monIndex] = mon;
          }
        } catch (e) {
          console.log(e);
        }
      }
    }
  }
}
