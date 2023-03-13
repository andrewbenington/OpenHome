import { GameOfOrigin } from 'consts';
import { RegionalForms } from 'types/TransferRestrictions';
import {
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
} from '../../util/ByteLogic';
import { gen4StringToUTF } from '../../util/Strings/StringConverter';
import { G4SAV } from './G4SAV';

export class PtSAV extends G4SAV {
  transferRestrictions = {
    maxDexNum: 493,
    excludedForms: { ...RegionalForms, 483: [1], 484: [1] },
  };

  static TRAINER_NAME_OFFSET = 0x68;
  static TRAINER_ID_OFFSET = 0x78;
  static BOX_SIZE = 0xff0;
  static GENERAL_BLOCK_OFFSET = 0x0000;
  static GENERAL_BLOCK_SIZE = 0xcf2c;
  static STORAGE_BLOCK_OFFSET = 0xcf2c;
  static STORAGE_BLOCK_SIZE = 0x121e4;
  static BOX_NAMES_OFFSET = 0x11ee0;

  currentSaveStorageBlockOffset: number = PtSAV.STORAGE_BLOCK_OFFSET;
  storageBlockSize: number = PtSAV.STORAGE_BLOCK_SIZE;
  boxSize: number = PtSAV.BOX_SIZE;
  boxNamesOffset: number;

  constructor(path: string, bytes: Uint8Array) {
    super(path, bytes);
    // current storage block could be either the first or second one,
    // depending on save count
    if (
      this.getCurrentSaveCount(
        PtSAV.STORAGE_BLOCK_OFFSET,
        PtSAV.STORAGE_BLOCK_SIZE
      ) <
      this.getCurrentSaveCount(
        PtSAV.STORAGE_BLOCK_OFFSET + 0x40000,
        PtSAV.STORAGE_BLOCK_SIZE
      )
    ) {
      this.currentSaveStorageBlockOffset += 0x40000;
    }
    this.currentSaveBoxStartOffset = this.currentSaveStorageBlockOffset + 4;
    this.boxNamesOffset =
      this.currentSaveStorageBlockOffset + PtSAV.BOX_NAMES_OFFSET;
    this.name = gen4StringToUTF(bytes, PtSAV.TRAINER_NAME_OFFSET, 8);
    this.tid = bytesToUint16LittleEndian(bytes, PtSAV.TRAINER_ID_OFFSET);
    this.displayID = this.tid.toString().padStart(5, '0');
    this.buildBoxes();
  }

  getCurrentSaveCount(blockOffset: number, blockSize: number) {
    console.log((blockOffset + blockSize).toString(16));
    return bytesToUint32LittleEndian(
      this.bytes,
      blockOffset + blockSize - this.footerSize
    );
  }
}
