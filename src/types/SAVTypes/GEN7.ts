import { PK7 } from 'pokemon-files';
import { GameOfOrigin } from 'pokemon-resources';
import {
  SM_TRANSFER_RESTRICTIONS
  USUM_TRANSFER_RESTRICTIONS
} from '../../consts/TransferRestrictions';
import {
  bytesToUint16LittleEndian,
  uint16ToBytesLittleEndian
} from '../../util/ByteLogic';
import { CRC16_CCITT } from '../../util/Encryption';
import { utf16BytesToString } from '../../util/Strings/StringConverter';
import { OHPKM } from '../pkm/OHPKM';
import { SaveType } from '../types';
import { Box, SAV } from './SAV';
import { ParsedPath } from './path';

const SM_PC_OFFSET = 0x4E00;
const SM_PC_CHECKSUM_OFFSET = 0x656C2;
const BOX_NAMES_OFFSET: number = 0x04800;

// Box size doesn't change from GEN 7
// https://github.com/kwsch/PKHeX/blob/c666183e6c19430667cc854716cce4f0d2293504/PKHeX.Core/PKM/PK7.cs#L14C7-L15C25
const BOX_SIZE: number = 232 * 30;

export class G7SAV extends SAV<PK7> {
  trainerDataOffset: number = 0x14000;

  boxes: Array<Box<PK7>>;

  saveType = SaveType.G7;

  boxChecksumOffset: number = SM_PC_CHECKSUM_OFFSET;

  pcOffset = SM_PC_OFFSET;
  pcChecksumOffset = SM_PC_CHECKSUM_OFFSET;

  constructor(path: ParsedPath, bytes: Uint8Array) {
    super(path, bytes);

    // https://github.com/kwsch/PKHeX/blob/c666183e6c19430667cc854716cce4f0d2293504/PKHeX.Core/Saves/SAV7.cs#L423C1-L427C10
    this.name = utf16BytesToString(this.bytes, this.trainerDataOffset + 0x38, 0x12);

    // https://github.com/kwsch/PKHeX/blob/c666183e6c19430667cc854716cce4f0d2293504/PKHeX.Core/Saves/SAV7.cs#L339C1-L353
    this.tid = bytesToUint16LittleEndian(this.bytes, this.trainerDataOffset);
    this.sid = bytesToUint16LittleEndian(this.bytes, this.trainerDataOffset + 2);
    this.origin = this.bytes[this.trainerDataOffset + 4];

    this.currentPCBox = this.bytes[0]; // ?
    this.displayID = this.tid.toString().padStart(5, '0');

    this.pcOffset = SM_PC_OFFSET;
    this.pcChecksumOffset = SM_PC_CHECKSUM_OFFSET;

    switch (this.origin) {
      case GameOfOrigin.Sun:
      case GameOfOrigin.Moon:
        this.transferRestrictions = SM_TRANSFER_RESTRICTIONS;
        break;
      case GameOfOrigin.UltraSun:
      case GameOfOrigin.UltraMoon:
        this.transferRestrictions = USUM_TRANSFER_RESTRICTIONS;
    }

    this.boxes = Array(32);
    for (let box = 0; box < 32; box++) {
      const boxName = utf16BytesToString(this.bytes, BOX_NAMES_OFFSET + 34 * box, 17);
      this.boxes[box] = new Box(boxName, 30);
    }

    for (let box = 0; box < 32; box++) {
      for (let monIndex = 0; monIndex < 30; monIndex++) {
        try {
          const startByte = this.pcOffset + BOX_SIZE * box + 232 * monIndex;
          const endByte = this.pcOffset + BOX_SIZE * box + 232 * (monIndex + 1);
          const monData = bytes.slice(startByte, endByte);
          const mon = new PK7(monData.buffer, true);
          if (mon.gameOfOrigin !== 0 && mon.dexNum !== 0) {
            this.boxes[box].pokemon[monIndex] = mon;
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }

  prepareBoxesForSaving() {
    const changedMonPKMs: OHPKM[] = [];
    this.updatedBoxSlots.forEach(({ box, index }) => {
      const changedMon = this.boxes[box].pokemon[index];
      if (changedMon instanceof OHPKM) {
        changedMonPKMs.push(changedMon);
      }
      const writeIndex = this.pcOffset + BOX_SIZE * box + 232 * index;
      if (changedMon) {
        try {
          const mon = changedMon instanceof OHPKM ? new PK7(changedMon) : changedMon;
          if (mon?.gameOfOrigin && mon?.dexNum) {
            mon.refreshChecksum();
            this.bytes.set(new Uint8Array(mon.toPCBytes()), writeIndex);
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        const mon = new PK7(new Uint8Array(232).buffer);
        this.bytes.set(new Uint8Array(mon.toPCBytes()), writeIndex);
      }
    });

    // Compute checksum for Gen 7 data structure and update save file
    this.bytes.set(
      uint16ToBytesLittleEndian(CRC16_CCITT(this.bytes, this.pcOffset, 0x34ad0)),
      this.pcChecksumOffset
    );

    return changedMonPKMs;
  }
}
