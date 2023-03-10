import { PK5 } from '../PKMTypes/PK5';
import { bytesToUint16LittleEndian } from '../../util/ByteLogic';
import { Box, BoxCoordinates, SAV } from './SAV';

export class G5SAV extends SAV {
  static PC_OFFSET = 0x400;
  pkmType = PK5;
  constructor(path: string, bytes: Uint8Array) {
    super(path, bytes)
    this.boxes = Array(24)
    for (let box = 0; box < 24; box++) {
      let charArray = new Uint16Array(20);
      for (let i = 0; i < 20; i += 1) {
        let value = bytesToUint16LittleEndian(bytes, 0x04 + 40 * box + 2 * i);
        if (value === 0xffff) {
          break;
        }
        charArray[i] = value;
      }
      this.boxes[box] = new G5Box(new TextDecoder('utf-16').decode(charArray));
    }

    for (let box = 0; box < 24; box++) {
      for (let monIndex = 0; monIndex < 30; monIndex++) {
        try {
          let startByte = G5SAV.PC_OFFSET + 0x1000 * box + 136 * monIndex;
          let endByte = G5SAV.PC_OFFSET + 0x1000 * box + 136 * (monIndex + 1);
          let monData = bytes.slice(startByte, endByte);
          let mon = new PK5(monData, true);
          if (mon.gameOfOrigin !== 0 && mon.dexNum !== 0) {
            this.boxes[box].pokemon[monIndex] = mon;
          }
        } catch (e) {
          console.log(e);
        }
      }
    }
  }
}

export class G5Box implements Box {
  name: string;
  pokemon: Array<PK5> = new Array(30);
  constructor(n: string) {
    this.name = n;
  }
}
