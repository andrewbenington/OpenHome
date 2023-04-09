import { OHPKM } from '../PKMTypes';
import { CapPikachus, RegionalForms } from '../TransferRestrictions';
import { SaveType } from '../types';
import {
  bytesToUint16LittleEndian,
  uint16ToBytesLittleEndian,
} from '../../util/ByteLogic';
import { gen5StringToUTF } from '../../util/Strings/StringConverter';
import { PK5 } from '../PKMTypes/PK5';
import { Box, SAV } from './SAV';
import { CRC16_CCITT } from 'util/Encryption';
import _ from 'lodash';
import { GameOfOrigin } from 'consts';

const PC_OFFSET = 0x400;
const BOX_NAMES_OFFSET: number = 0x04;
const BOX_CHECKSUM_OFFSET: number = 0xff2;
const BOX_SIZE: number = 0x1000;

export class G5SAV extends SAV {
  static TRANSFER_RESTRICTIONS = {
    maxDexNum: 649,
    excludedForms: { ...RegionalForms, ...CapPikachus, 483: [1], 484: [1] },
  };
  transferRestrictions = G5SAV.TRANSFER_RESTRICTIONS;
  pkmType = PK5;
  trainerDataOffset: number = 0x19400;
  boxes: Array<G5Box>;
  saveType = SaveType.G5;
  checksumMirrorsOffset: number = 0x23f00;
  checksumMirrorsSize: number = 0x8c;
  checksumMirrorsChecksumOffset: number = 0x23f9a;
  constructor(path: string, bytes: Uint8Array) {
    super(path, bytes);
    this.name = gen5StringToUTF(
      this.bytes,
      this.trainerDataOffset + 0x04,
      0x10
    );
    this.tid = bytesToUint16LittleEndian(
      this.bytes,
      this.trainerDataOffset + 0x14
    );
    this.sid = bytesToUint16LittleEndian(
      this.bytes,
      this.trainerDataOffset + 0x16
    );
    this.currentPCBox = this.bytes[0];
    this.displayID = this.tid.toString().padStart(5, '0');
    this.origin = this.bytes[this.trainerDataOffset + 0x1f];
    if (this.origin >= GameOfOrigin.White2) {
      this.checksumMirrorsOffset = 0x25f00;
      this.checksumMirrorsSize = 0x94;
      this.checksumMirrorsChecksumOffset = 0x25fa2;
    }
    this.boxes = Array(24);
    for (let box = 0; box < 24; box++) {
      let boxName = gen5StringToUTF(
        this.bytes,
        BOX_NAMES_OFFSET + 40 * box,
        20
      );
      this.boxes[box] = new G5Box(boxName);
    }

    for (let box = 0; box < 24; box++) {
      for (let monIndex = 0; monIndex < 30; monIndex++) {
        try {
          let startByte = PC_OFFSET + BOX_SIZE * box + 136 * monIndex;
          let endByte = PC_OFFSET + BOX_SIZE * box + 136 * (monIndex + 1);
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

  updateBoxChecksum = (boxIndex: number) => {
    const oldChecksum = bytesToUint16LittleEndian(
      this.bytes,
      PC_OFFSET + boxIndex * BOX_SIZE + BOX_CHECKSUM_OFFSET
    );
    const newChecksum = CRC16_CCITT(
      this.bytes,
      PC_OFFSET + boxIndex * BOX_SIZE,
      BOX_CHECKSUM_OFFSET - 2
    );
    console.log(
      `old: ${oldChecksum.toString(16).padStart(4, '0')}, new: ${newChecksum
        .toString(16)
        .padStart(4, '0')}`
    );
    this.bytes.set(
      uint16ToBytesLittleEndian(newChecksum),
      PC_OFFSET + boxIndex * BOX_SIZE + BOX_CHECKSUM_OFFSET
    );
    this.bytes.set(
      uint16ToBytesLittleEndian(newChecksum),
      this.checksumMirrorsOffset + 2 * (boxIndex + 1)
    );
  };

  updateMirrorsChecksum = () => {
    const oldChecksum = bytesToUint16LittleEndian(
      this.bytes,
      this.checksumMirrorsChecksumOffset
    );
    const newChecksum = CRC16_CCITT(
      this.bytes,
      this.checksumMirrorsOffset,
      this.checksumMirrorsSize
    );
    console.log(
      `mirrors old: ${oldChecksum
        .toString(16)
        .padStart(4, '0')}, mirrors new: ${newChecksum
        .toString(16)
        .padStart(4, '0')}`
    );
    this.bytes.set(
      uint16ToBytesLittleEndian(newChecksum),
      this.checksumMirrorsChecksumOffset
    );
  };

  prepareBoxesForSaving() {
    const changedMonPKMs: OHPKM[] = [];
    console.log(this.changedMons);
    this.changedMons.forEach(({ box, index }) => {
      const changedMon = this.boxes[box].pokemon[index];
      // we don't want to save OHPKM files of mons that didn't leave the save
      // (and would still be PK4s)
      if (changedMon instanceof OHPKM) {
        changedMonPKMs.push(changedMon);
      }
      let writeIndex = PC_OFFSET + BOX_SIZE * box + 136 * index;
      // changedMon will be undefined if pokemon was moved from this slot
      // and the slot was left empty
      if (changedMon) {
        try {
          let mon = new PK5(changedMon);
          if (mon?.gameOfOrigin && mon?.dexNum) {
            mon.refreshChecksum();
            this.bytes.set(mon.toPCBytes(), writeIndex);
          }
        } catch (e) {
          console.log(e);
        }
      } else {
        console.log('writing empty bytes to', writeIndex.toString(16));
        this.bytes.set(new Uint8Array(136), writeIndex);
      }
    });
    _.uniq(this.changedMons.map((coords) => coords.box)).forEach((boxIndex) =>
      this.updateBoxChecksum(boxIndex)
    );
    this.updateMirrorsChecksum();
    return changedMonPKMs;
  }
}

export class G5Box implements Box {
  name: string;
  pokemon: Array<PK5 | OHPKM> = new Array(30);
  constructor(n: string) {
    this.name = n;
  }
}
