import { GameOfOrigin } from 'consts';
import { GEN2_TRANSFER_RESTRICTIONS } from 'consts/TransferRestrictions';
import { uniq } from 'lodash';
import { OHPKM } from 'types/PKMTypes/OHPKM';
import { PK2 } from 'types/PKMTypes/PK2';
import { SaveType } from 'types/types';
import { bytesToUint16BigEndian, get8BitChecksum } from 'util/ByteLogic';
import {
  gen12StringToUTF,
  utf16StringToGen12,
} from 'util/Strings/StringConverter';
import { Box, SAV } from './SAV';

export class G2Box implements Box {
  name: string;

  pokemon: Array<PK2 | OHPKM | undefined>;

  constructor(name: string, boxSize: number) {
    this.name = name;
    this.pokemon = new Array(boxSize);
  }
}

export class G2SAV extends SAV {
  boxOffsets: number[];

  boxes: Array<G2Box>;

  pkmType = PK2;

  transferRestrictions = GEN2_TRANSFER_RESTRICTIONS;

  constructor(path: string, bytes: Uint8Array, fileCreated?: Date) {
    super(path, bytes);
    this.fileCreated = fileCreated;
    this.tid = bytesToUint16BigEndian(this.bytes, 0x2009);
    this.displayID = this.tid.toString().padStart(5, '0');
    this.name = gen12StringToUTF(this.bytes, 0x200b, 11);
    this.boxOffsets = [
      0x4000, 0x4450, 0x48a0, 0x4cf0, 0x5140, 0x5590, 0x59e0, 0x6000, 0x6450,
      0x68a0, 0x6cf0, 0x7140, 0x7590, 0x79e0,
    ];
    this.boxes = [];
    if (this.areGoldSilverChecksumsValid()) {
      this.saveType = SaveType.GS_I;
    } else if (this.areCrystalInternationalChecksumsValid()) {
      this.saveType = SaveType.C_I;
      this.origin = GameOfOrigin.Crystal;
    }
    switch (this.saveType) {
      case SaveType.GS_I:
      case SaveType.C_I:
        this.boxRows = 4;
        this.boxColumns = 5;
        break;
      default:
        this.invalid = true;
        return;
    }
    this.boxes = new Array<G2Box>(this.boxOffsets.length);
    if (this.saveType >= SaveType.GS_I && this.saveType <= SaveType.C_I) {
      const pokemonPerBox = this.boxRows * this.boxColumns;
      this.boxOffsets.forEach((offset, boxNumber) => {
        const monCount = bytes[offset];
        this.boxes[boxNumber] = new G2Box(
          `Box ${boxNumber + 1}`,
          pokemonPerBox
        );
        for (let monIndex = 0; monIndex < monCount; monIndex++) {
          const mon = new PK2(
            this.bytes.slice(
              offset + 1 + pokemonPerBox + 1 + monIndex * 0x20,
              offset + 1 + pokemonPerBox + 1 + (monIndex + 1) * 0x20
            )
          );
          mon.trainerName = gen12StringToUTF(
            this.bytes,
            offset +
              1 +
              pokemonPerBox +
              1 +
              pokemonPerBox * 0x20 +
              monIndex * 11,
            11
          );
          mon.nickname = gen12StringToUTF(
            this.bytes,
            offset +
              1 +
              pokemonPerBox +
              1 +
              pokemonPerBox * 0x20 +
              pokemonPerBox * 11 +
              monIndex * 11,
            11
          );
          mon.gameOfOrigin = this.saveType === SaveType.GS_I ? 40 : 41;
          mon.language = 'ENG';
          this.boxes[boxNumber].pokemon[monIndex] = mon;
        }
      });
    }
  }

  prepareBoxesForSaving() {
    const changedMonPKMs: OHPKM[] = [];
    const changedBoxes = uniq(this.updatedBoxSlots.map((coords) => coords.box));
    const pokemonPerBox = this.boxRows * this.boxColumns;
    changedBoxes.forEach((boxNumber) => {
      const boxByteOffset = this.boxOffsets[boxNumber];
      const box = this.boxes[boxNumber];
      // functions as an index, to skip empty slots
      let numMons = 0;
      box.pokemon.forEach((boxMon) => {
        if (boxMon) {
          if (boxMon instanceof OHPKM) {
            changedMonPKMs.push(boxMon);
          }
          const PK2Mon = boxMon instanceof PK2 ? boxMon : new PK2(boxMon);
          // set the mon's dex number in the box
          this.bytes[boxByteOffset + 1 + numMons] = PK2Mon.dexNum;
          // set the mon's data in the box
          this.bytes.set(
            PK2Mon.bytes,
            boxByteOffset + 1 + pokemonPerBox + 1 + numMons * 0x20
          );
          // set the mon's OT name in the box
          const trainerNameBuffer = utf16StringToGen12(
            PK2Mon.trainerName,
            11,
            true
          );
          this.bytes.set(
            trainerNameBuffer,
            boxByteOffset +
              1 +
              pokemonPerBox +
              1 +
              pokemonPerBox * 0x20 +
              numMons * 11
          );
          // set the mon's nickname in the box
          const nicknameBuffer = utf16StringToGen12(PK2Mon.nickname, 11, true);
          this.bytes.set(
            nicknameBuffer,
            boxByteOffset +
              1 +
              pokemonPerBox +
              1 +
              pokemonPerBox * 0x20 +
              pokemonPerBox * 11 +
              numMons * 11
          );
          numMons++;
        }
      });
      this.bytes[boxByteOffset] = numMons;
      const remainingSlots = pokemonPerBox - numMons;
      if (remainingSlots) {
        // set all dex numbers to 0
        this.bytes.set(
          new Uint8Array(remainingSlots + 1),
          boxByteOffset + 1 + numMons
        );
        // set all mon data to all 0s
        this.bytes.set(
          new Uint8Array(0x20 * remainingSlots),
          boxByteOffset + 1 + pokemonPerBox + 1 + numMons * 0x20
        );
        // set all OT names to all 0s
        this.bytes.set(
          new Uint8Array(11 * remainingSlots),
          boxByteOffset +
            1 +
            pokemonPerBox +
            1 +
            pokemonPerBox * 0x20 +
            numMons * 11
        );
        // set all nicknames to all 0s
        this.bytes.set(
          new Uint8Array(11 * remainingSlots),
          boxByteOffset +
            1 +
            pokemonPerBox +
            1 +
            pokemonPerBox * 0x20 +
            pokemonPerBox * 11 +
            numMons * 11
        );
      }
      // add terminator
      this.bytes[boxByteOffset + 1 + numMons] = 0xff;
    });
    switch (this.saveType) {
      case SaveType.GS_I:
        this.bytes[0x2d69] = this.getGoldSilverInternationalChecksum1();
        this.bytes[0x7e6d] = this.getGoldSilverInternationalChecksum2();
        break;
      case SaveType.C_I:
        this.bytes.set(this.bytes.slice(0x2009, 0x2b82), 0x1209);
        this.bytes[0x2d0d] = this.getCrystalInternationalChecksum1();
        this.bytes[0x1f0d] = this.getCrystalInternationalChecksum2();
        break;
    }
    return changedMonPKMs;
  }

  areGoldSilverChecksumsValid() {
    const checksum1 = this.getGoldSilverInternationalChecksum1();
    if (checksum1 !== this.bytes[0x2d69]) {
      return false;
    }
    const checksum2 = this.getGoldSilverInternationalChecksum2();
    return checksum2 === this.bytes[0x7e6d];
  }

  getGoldSilverInternationalChecksum1() {
    return get8BitChecksum(this.bytes, 0x2009, 0x2d68);
  }

  getGoldSilverInternationalChecksum2() {
    let checksum = 0;
    checksum += get8BitChecksum(this.bytes, 0x15c7, 0x17ec);
    checksum += get8BitChecksum(this.bytes, 0x3d96, 0x3f3f);
    checksum += get8BitChecksum(this.bytes, 0x0c6b, 0x10e7);
    checksum += get8BitChecksum(this.bytes, 0x7e39, 0x7e6c);
    checksum += get8BitChecksum(this.bytes, 0x10e8, 0x15c6);
    return checksum;
  }

  getCrystalInternationalChecksum1() {
    return get8BitChecksum(this.bytes, 0x2009, 0x2b82);
  }

  getCrystalInternationalChecksum2() {
    return get8BitChecksum(this.bytes, 0x1209, 0x1d82);
  }

  areCrystalInternationalChecksumsValid() {
    const checksum1 = this.getCrystalInternationalChecksum1();
    if (checksum1 !== this.bytes[0x2d0d]) {
      return false;
    }
    const checksum2 = this.getCrystalInternationalChecksum2();
    return checksum2 === this.bytes[0x1f0d];
  }
}
