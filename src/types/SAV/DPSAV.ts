import { PK4 } from '../PKM/PK4';
import {
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
} from '../../util/ByteLogic';
import { gen4StringToUTF } from '../../util/Strings/StringConverter';
import { G4Box, G4SAV } from './G4SAV';
import { RegionalForms } from 'types/TransferRestrictions';

export class DPSAV extends G4SAV {
  transferRestrictions = {
    maxDexNum: 493,
    excludedForms: {
      ...RegionalForms,
      479: [1, 2, 3, 4, 5],
      483: [1],
      484: [1],
      487: [1],
      492: [1],
    },
  };

  static TRAINER_OFFSET = 0x64;
  static BOX_SIZE = 0xff0;
  static GENERAL_BLOCK_OFFSET = 0x0000;
  static GENERAL_BLOCK_SIZE = 0xc100;
  static STORAGE_BLOCK_OFFSET = 0xc100;
  static STORAGE_BLOCK_SIZE = 0x121e0;
  static BOX_NAMES_OFFSET = 0x11ee0;

  currentSaveStorageBlockOffset: number = DPSAV.STORAGE_BLOCK_OFFSET;
  storageBlockSize: number = DPSAV.STORAGE_BLOCK_SIZE;
  boxSize: number = DPSAV.BOX_SIZE;
  boxNamesOffset: number;

  constructor(path: string, bytes: Uint8Array) {
    super(path, bytes);
    // current storage block could be either the first or second one,
    // depending on save count
    if (
      this.getCurrentSaveCount(
        DPSAV.STORAGE_BLOCK_OFFSET,
        DPSAV.STORAGE_BLOCK_SIZE
      ) <
      this.getCurrentSaveCount(
        DPSAV.STORAGE_BLOCK_OFFSET + 0x40000,
        DPSAV.STORAGE_BLOCK_SIZE
      )
    ) {
      this.currentSaveStorageBlockOffset += 0x40000;
    }
    this.currentSaveBoxStartOffset = this.currentSaveStorageBlockOffset + 4;
    this.boxNamesOffset =
      this.currentSaveStorageBlockOffset + DPSAV.BOX_NAMES_OFFSET;
    this.name = gen4StringToUTF(bytes, DPSAV.TRAINER_OFFSET, 8);
    this.buildBoxes();

    console.log(this.getStorageChecksum(), this.calculateStorageChecksum());
  }

  getCurrentSaveCount(blockOffset: number, blockSize: number) {
    console.log((blockOffset + blockSize).toString(16));
    return bytesToUint32LittleEndian(
      this.bytes,
      blockOffset + blockSize - this.footerSize
    );
  }
}
