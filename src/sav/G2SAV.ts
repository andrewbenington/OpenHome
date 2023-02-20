import { MONS_LIST } from 'consts/Mons';
import OHPKM from 'pkm/OHPKM';
import { PK2 } from 'pkm/PK2';
import { pkm } from 'pkm/pkm';
import { SaveType } from 'renderer/types/types';
import {
  gen12StringToUTF,
  utf16StringToGen12,
} from 'util/Strings/StringConverter';
import { Box, SAV } from './SAV';

export class G2SAV extends SAV {
  boxOffsets: number[];
  boxes: Array<G2Box>;
  constructor(path: string, bytes: Uint8Array) {
    super(path, bytes);
    this.boxOffsets = [
      0x4000, 0x4450, 0x48a0, 0x4cf0, 0x5140, 0x5590, 0x59e0, 0x6000, 0x6450,
      0x68a0, 0x6cf0, 0x7140, 0x7590, 0x79e0,
    ];
    if (this.areGoldSilverChecksumsValid()) {
      this.saveType = SaveType.GS_I;
    } else if (this.areCrystalInternationalChecksumsValid()) {
      this.saveType = SaveType.C_I;
    }
    switch (this.saveType) {
      case SaveType.GS_I:
      case SaveType.C_I:
        this.boxRows = 4;
        this.boxColumns = 5;
    }
    this.boxes = new Array<G2Box>(this.boxOffsets.length);
    if (this.saveType > 0 && this.saveType <= 2) {
      let pokemonPerBox = this.boxRows * this.boxColumns;
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
    this.changedMons.forEach(({ box, index }) => {
      let pokemonPerBox = this.boxRows * this.boxColumns;
      const boxByteOffset = this.boxOffsets[box];
      const changedMon = this.boxes[box].pokemon[index];
      if (changedMon) {
        if (changedMon instanceof OHPKM) {
          changedMonPKMs.push(changedMon);
        }
        const mon = new PK2(changedMon);
        this.bytes[boxByteOffset + 1 + index] = mon.dexNum;
        this.bytes.set(
          mon.bytes,
          boxByteOffset + 1 + pokemonPerBox + 1 + index * 0x20
        );
        const trainerNameBuffer = utf16StringToGen12(mon.trainerName, 11, true);
        this.bytes.set(
          trainerNameBuffer,
          boxByteOffset +
            1 +
            pokemonPerBox +
            1 +
            pokemonPerBox * 0x20 +
            index * 11
        );
        const nicknameBuffer = utf16StringToGen12(mon.nickname, 11, true);
        this.bytes.set(
          nicknameBuffer,
          boxByteOffset +
            1 +
            pokemonPerBox +
            1 +
            pokemonPerBox * 0x20 +
            pokemonPerBox * 11 +
            index * 11
        );
      }
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
    let checksum1 = 0;
    for (let i = 0x2009; i <= 0x2d68; i += 1) {
      checksum1 += this.bytes[i];
      checksum1 = checksum1 & 0xff;
    }
    return checksum1;
  }

  getGoldSilverInternationalChecksum2() {
    let checksum = 0;
    for (let i = 0x15c7; i <= 0x17ec; i += 1) {
      checksum += this.bytes[i];
      checksum = checksum & 0xff;
    }
    for (let i = 0x3d96; i <= 0x3f3f; i += 1) {
      checksum += this.bytes[i];
      checksum = checksum & 0xff;
    }
    for (let i = 0x0c6b; i <= 0x10e7; i += 1) {
      checksum += this.bytes[i];
      checksum = checksum & 0xff;
    }
    for (let i = 0x7e39; i <= 0x7e6c; i += 1) {
      checksum += this.bytes[i];
      checksum = checksum & 0xff;
    }
    for (let i = 0x10e8; i <= 0x15c6; i += 1) {
      checksum += this.bytes[i];
      checksum = checksum & 0xff;
    }
    return checksum;
  }

  getCrystalInternationalChecksum1() {
    let checksum = 0;
    for (let i = 0x2009; i <= 0x2b82; i += 1) {
      checksum += this.bytes[i];
      checksum = checksum & 0xff;
    }
    return checksum;
  }

  getCrystalInternationalChecksum2() {
    let checksum = 0;
    for (let i = 0x1209; i <= 0x1d82; i += 1) {
      checksum += this.bytes[i];
      checksum = checksum & 0xff;
    }
    return checksum;
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

export class G2Box implements Box {
  name: string;
  pokemon: Array<PK2 | OHPKM>;
  constructor(name: string, boxSize: number) {
    this.name = name;
    this.pokemon = new Array(boxSize);
  }
}
