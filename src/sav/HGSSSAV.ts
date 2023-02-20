import { PK4 } from '../pkm/PK4';
import {
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
} from '../util/ByteLogic';
import { gen4StringToUTF } from '../util/Strings/StringConverter';
import { G4Box, G4SAV } from './G4SAV';

export class HGSSSAV extends G4SAV {
  static TRAINER_OFFSET = 0x64;
  static BOX_SIZE = 0xff0 + 0x10;
  static GENERAL_BLOCK_OFFSET = 0x0000;
  static GENERAL_BLOCK_SIZE = 0xf628;
  static STORAGE_BLOCK_OFFSET = 0xf700;
  static STORAGE_BLOCK_SIZE = 0x12310;
  static BOX_NAMES_OFFSET = 0x12008;
  static BLOCK_FOOTER_SIZE = 0x10;

  currentStorageBlockOffset: number = HGSSSAV.STORAGE_BLOCK_OFFSET;
  storageBlockSize: number = HGSSSAV.STORAGE_BLOCK_SIZE;
  boxSize: number = HGSSSAV.BOX_SIZE;
  boxNamesOffset: number;
  footerSize: number = HGSSSAV.BLOCK_FOOTER_SIZE;

  constructor(path: string, bytes: Uint8Array) {
    super(path, bytes);
    // current storage block could be either the first or second one,
    // depending on save count
    if (
      this.getCurrentSaveCount(
        HGSSSAV.STORAGE_BLOCK_OFFSET,
        HGSSSAV.STORAGE_BLOCK_SIZE
      ) <
      this.getCurrentSaveCount(
        HGSSSAV.STORAGE_BLOCK_OFFSET + 0x40000,
        HGSSSAV.STORAGE_BLOCK_SIZE
      )
    ) {
      this.currentStorageBlockOffset += 0x40000;
    }
    this.boxNamesOffset =
      this.currentStorageBlockOffset + HGSSSAV.BOX_NAMES_OFFSET;
    this.name = gen4StringToUTF(bytes, HGSSSAV.TRAINER_OFFSET, 8);
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
