import OHPKM from 'pkm/OHPKM';
import { PK2 } from 'pkm/PK2';
import { getMonFileIdentifier, getMonGen12Identifier } from 'pkm/util';
import { SaveType } from 'renderer/types/types';
import { readGen12Lookup } from 'renderer/util/ipcFunctions';
import {
  bytesToUint16LittleEndian,
  bytesToUint32LittleEndian,
  bytesToUint64LittleEndian,
} from 'util/ByteLogic';
import { G2SAV } from './G2SAV';
import { G3SAV } from './G3SAV';
import { G5SAV } from './G5SAV';
import { HGSSSAV } from './HGSSSAV';

const SIZE_GEN2 = 0x8000;
const SIZE_GEN3 = 0x20000;
const SIZE_GEN45 = 0x80000;

export const buildSaveFile = (
  filePath: string,
  fileBytes: Uint8Array,
  saveType: SaveType,
  homeMonMap?: { [key: string]: OHPKM } | undefined,
  gen12MonMap?: { [key: string]: string } | undefined
) => {
  let saveFile;
  switch (saveType) {
    case SaveType.C_I:
    case SaveType.GS_I:
      saveFile = new G2SAV(filePath, fileBytes);
      if (homeMonMap && gen12MonMap) {
        saveFile.boxes.forEach((box) => {
          box.pokemon.forEach((mon, monIndex) => {
            if (!(mon instanceof PK2)) return;
            // GameBoy PKM files don't have a personality value to track the mons with OpenHome data,
            // so they need to be identified with their IVs and OT
            const gen12identifier = getMonGen12Identifier(mon);
            if (!gen12identifier) return;
            const homeIdentifier = gen12MonMap[gen12identifier];
            if (!homeIdentifier) return;
            // console.log(identifier.slice(0, identifier.length - 3))
            const result = Object.entries(homeMonMap).find(
              (entry) => entry[0] === homeIdentifier
            );
            if (result) {
              console.log('home mon found:', result[1]);
              box.pokemon[monIndex] = result[1];
            }
          });
        });
      }
      return saveFile;
    case SaveType.RS:
    case SaveType.FRLG:
    case SaveType.E:
      saveFile = new G3SAV(filePath, fileBytes);
      if (homeMonMap) {
        saveFile.boxes.forEach((box) => {
          box.pokemon.forEach((mon, monIndex) => {
            if (!mon) return;
            const identifier = getMonFileIdentifier(mon);
            if (!identifier) return;
            const result = Object.entries(homeMonMap).find(
              (entry) =>
                entry[0].slice(0, entry[0].length - 3) ===
                identifier.slice(0, identifier.length - 3)
            );
            if (result) {
              console.log('home mon found:', result[1]);
              box.pokemon[monIndex] = result[1];
            }
          });
        });
      }
      return saveFile;
    case SaveType.HGSS:
      saveFile = new HGSSSAV(filePath, fileBytes);
      // if (homeMonMap) {
      //   saveFile.boxes.forEach((box) => {
      //     box.pokemon.forEach((mon, monIndex) => {
      //       if (!mon) return;
      //       const identifier = getMonFileIdentifier(mon);
      //       if (!identifier) return;
      //       const result = Object.entries(homeMonMap).find(
      //         (entry) =>
      //           entry[0].slice(0, entry[0].length - 3) ===
      //           identifier.slice(0, identifier.length - 3)
      //       );
      //       if (result) {
      //         console.log('home mon found:', result[1]);
      //         box.pokemon[monIndex] = result[1];
      //       }
      //     });
      //   });
      // }
      return saveFile;
    case SaveType.G5:
      return new G5SAV(filePath, fileBytes);
  }
};

export const getSaveType = (bytes: Uint8Array): SaveType => {
  // Gen 4 saves include a size and hex "date" that can identify save type
  const validGen4DateAndSize = (offset: number) => {
    const size = bytesToUint32LittleEndian(bytes, offset - 0xc);
    if (size != (offset & 0xffff)) return false;
    var date = bytesToUint32LittleEndian(bytes, offset - 0x8);

    const DATE_INT = 0x20060623;
    const DATE_KO = 0x20070903;
    return date === DATE_INT || date === DATE_KO;
  };
  const validGen5Footer = (mainSize: number, infoLength: number) => {
    const footer = bytes.slice(
      mainSize - 0x100,
      mainSize - 0x100 + infoLength + 0x10
    );
    const stored = bytesToUint16LittleEndian(footer, 2);
    const actual = 0; //Checksums.CRC16_CCITT(footer[..infoLength]);
    return stored == actual;
  };
  if (bytes.length >= SIZE_GEN45) {
    console.log('Gen45 length');
    if (validGen4DateAndSize(0x4c100)) {
      return SaveType.DP;
    } else if (validGen4DateAndSize(0x4cf2c)) {
      return SaveType.Pt;
    } else if (validGen4DateAndSize(0x4f628)) {
      return SaveType.HGSS;
    } else return SaveType.G5;
  } else if (bytes.length >= SIZE_GEN3) {
    console.log('gen 3');
    const valueAtAC = bytesToUint32LittleEndian(bytes, 0xac);
    console.log(valueAtAC);
    switch (valueAtAC) {
      case 1:
        return SaveType.FRLG;
      case 0:
        return SaveType.RS;
      default:
        for (let i = 0x890; i < 0xf2c; i += 4) {
          if (bytesToUint64LittleEndian(bytes, i) != 0) return SaveType.E;
        }
        return SaveType.RS;
    }
  } else if (bytes.length >= SIZE_GEN2) {
    // hacky
    const save = new G2SAV('', bytes);
    if (save.areCrystalInternationalChecksumsValid()) {
      return SaveType.C_I;
    } else if (save.areGoldSilverChecksumsValid()) {
      return SaveType.GS_I;
    }
  }
  return SaveType.UNKNOWN;
};
