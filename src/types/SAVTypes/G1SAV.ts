import { GameOfOrigin } from 'consts';
import _, { uniq } from 'lodash';
import { OHPKM } from 'types/PKMTypes/OHPKM';
import { PK1 } from 'types/PKMTypes/PK1';
import { CapPikachus, RegionalForms } from '../TransferRestrictions';
import { SaveType } from 'types/types';
import { bytesToUint16BigEndian, get8BitChecksum } from 'util/ByteLogic';
import { natDexToGen1ID } from 'util/ConvertPokemonID';
import {
  gen12StringToUTF,
  utf16StringToGen12,
} from 'util/Strings/StringConverter';
import { Box, SAV } from './SAV';
import { GEN1_TRANSFER_RESTRICTIONS } from 'consts/TransferRestrictions';

class G1Box implements Box {
  name: string;

  pokemon: Array<PK1 | OHPKM | undefined>;

  constructor(name: string, boxSize: number) {
    this.name = name;
    this.pokemon = new Array(boxSize);
  }
}

export class G1SAV extends SAV {
  pkmType = PK1;

  transferRestrictions = GEN1_TRANSFER_RESTRICTIONS;

  NUM_BOXES = 14;

  CURRENT_BOX_NUM_OFFSET = 0x284c;

  CURRENT_BOX_DATA_OFFSET = 0x30c0;

  BOX_SIZE = 0x462;

  BOX_PKM_OFFSET = 0x16;

  BOX_PKM_SIZE = 0x21;

  BOX_OT_OFFSET = 0x2aa;

  BOX_NICKNAME_OFFSET = 0x386;

  boxes: Array<G1Box>;

  constructor(path: string, bytes: Uint8Array, fileCreated?: Date) {
    super(path, bytes);
    this.fileCreated = fileCreated;
    this.tid = bytesToUint16BigEndian(this.bytes, 0x2605);
    this.displayID = this.tid.toString().padStart(5, '0');
    this.name = gen12StringToUTF(this.bytes, 0x2598, 11);
    this.currentPCBox = this.bytes[this.CURRENT_BOX_NUM_OFFSET] & 0x7f;
    if (true) {
      this.saveType = SaveType.RBY_I;
    }
    let currenBoxByteOffset;
    if (this.currentPCBox < 6) {
      currenBoxByteOffset = 0x4000 + this.currentPCBox * this.BOX_SIZE;
    } else {
      currenBoxByteOffset = 0x6000 + (this.currentPCBox - 6) * this.BOX_SIZE;
    }
    console.log('currentbox', currenBoxByteOffset, this.currentPCBox);
    this.bytes.set(
      this.bytes.slice(
        this.CURRENT_BOX_DATA_OFFSET,
        this.CURRENT_BOX_DATA_OFFSET + this.BOX_SIZE
      ),
      currenBoxByteOffset
    );
    switch (this.saveType) {
      case SaveType.RBY_I:
        this.boxRows = 4;
        this.boxColumns = 5;
        break;
      default:
        this.boxes = [];
        return;
    }
    this.boxes = new Array<G1Box>(this.NUM_BOXES);
    if (this.saveType > 0 && this.saveType <= 2) {
      const pokemonPerBox = this.boxRows * this.boxColumns;
      _.range(this.NUM_BOXES).forEach((boxNumber) => {
        this.boxes[boxNumber] = new G1Box(
          `Box ${boxNumber + 1}`,
          pokemonPerBox
        );
        let boxByteOffset;
        if (boxNumber < 6) {
          boxByteOffset = 0x4000 + boxNumber * this.BOX_SIZE;
        } else {
          boxByteOffset = 0x6000 + (boxNumber - 6) * this.BOX_SIZE;
        }
        for (let monIndex = 0; monIndex < pokemonPerBox; monIndex++) {
          if (
            this.bytes[
              boxByteOffset + this.BOX_PKM_OFFSET + monIndex * this.BOX_PKM_SIZE
            ]
          ) {
            const mon = new PK1(
              this.bytes.slice(
                boxByteOffset +
                  this.BOX_PKM_OFFSET +
                  monIndex * this.BOX_PKM_SIZE,
                boxByteOffset +
                  this.BOX_PKM_OFFSET +
                  (monIndex + 1) * this.BOX_PKM_SIZE
              )
            );
            mon.trainerName = gen12StringToUTF(
              this.bytes,
              boxByteOffset + this.BOX_OT_OFFSET + monIndex * 11,
              11
            );
            mon.nickname = gen12StringToUTF(
              this.bytes,
              boxByteOffset + this.BOX_NICKNAME_OFFSET + monIndex * 11,
              11
            );
            mon.gameOfOrigin = GameOfOrigin.Red;
            mon.language = 'ENG';
            this.boxes[boxNumber].pokemon[monIndex] = mon;
          }
        }
      });
    }
  }

  prepareBoxesForSaving() {
    const changedMonPKMs: OHPKM[] = [];
    const changedBoxes = uniq(this.changedMons.map((coords) => coords.box));
    const pokemonPerBox = this.boxRows * this.boxColumns;
    changedBoxes.forEach((boxNumber) => {
      let boxByteOffset: number;
      if (boxNumber < 6) {
        boxByteOffset = 0x4000 + boxNumber * this.BOX_SIZE;
      } else {
        boxByteOffset = 0x6000 + (boxNumber - 6) * this.BOX_SIZE;
      }
      console.log('box', boxNumber + 1, 'at', boxByteOffset.toString(16));
      const box = this.boxes[boxNumber];
      let numMons = 0;
      box.pokemon.forEach((boxMon) => {
        if (boxMon) {
          console.log('setting bytes for', boxMon.nickname);
          if (boxMon instanceof OHPKM) {
            changedMonPKMs.push(boxMon);
          }
          const PK1Mon = boxMon instanceof PK1 ? boxMon : new PK1(boxMon);
          // set the mon's dex number in the box
          this.bytes[boxByteOffset + 1 + numMons] =
            natDexToGen1ID[PK1Mon.dexNum];
          // set the mon's data in the box
          this.bytes.set(
            PK1Mon.bytes,
            boxByteOffset + this.BOX_PKM_OFFSET + numMons * this.BOX_PKM_SIZE
          );
          // set the mon's OT name in the box
          const trainerNameBuffer = utf16StringToGen12(
            PK1Mon.trainerName,
            11,
            true
          );
          this.bytes.set(
            trainerNameBuffer,
            boxByteOffset + this.BOX_OT_OFFSET + numMons * 11
          );
          // set the mon's nickname in the box
          const nicknameBuffer = utf16StringToGen12(PK1Mon.nickname, 11, true);
          this.bytes.set(
            nicknameBuffer,
            boxByteOffset + this.BOX_NICKNAME_OFFSET + numMons * 11
          );
          numMons++;
        }
      });
      this.bytes[boxByteOffset] = numMons;
      const remainingSlots = pokemonPerBox - numMons;
      if (remainingSlots) {
        // set all mon data to all 0s
        console.log(
          'clearing',
          boxByteOffset + this.BOX_PKM_OFFSET + numMons * this.BOX_PKM_SIZE,
          'mon bytes at',
          (
            boxByteOffset +
            this.BOX_PKM_OFFSET +
            numMons * this.BOX_PKM_SIZE
          ).toString(16)
        );
        this.bytes.set(
          new Uint8Array(this.BOX_PKM_SIZE * remainingSlots),
          boxByteOffset + this.BOX_PKM_OFFSET + numMons * this.BOX_PKM_SIZE
        );
        // set all OT names to all 0s
        this.bytes.set(
          new Uint8Array(11 * remainingSlots),
          boxByteOffset + this.BOX_OT_OFFSET + numMons * 11
        );
        // set all nicknames to all 0s
        this.bytes.set(
          new Uint8Array(11 * remainingSlots),
          boxByteOffset + this.BOX_NICKNAME_OFFSET + numMons * 11
        );
      }
      // set all dex numbers to 0xFF or add terminator
      this.bytes.set(
        new Uint8Array(remainingSlots + 1).fill(0xff),
        boxByteOffset + 1 + numMons
      );
      let boxChecksumOffset;
      if (boxNumber < 6) {
        boxChecksumOffset = 0x5a4d + boxNumber;
      } else {
        boxChecksumOffset = 0x7a4d + boxNumber;
      }
      const boxChecksum =
        get8BitChecksum(
          this.bytes,
          boxByteOffset,
          boxByteOffset + this.BOX_SIZE
        ) ^ 0xff;
      this.bytes[boxChecksumOffset] = boxChecksum;
      if (boxNumber === this.currentPCBox) {
        this.bytes.set(
          this.bytes.slice(boxByteOffset, boxByteOffset + this.BOX_SIZE),
          this.CURRENT_BOX_DATA_OFFSET
        );
      }
    });
    const bank2Checksum = get8BitChecksum(this.bytes, 0x4000, 0x5a4c) ^ 0xff;
    this.bytes[0x5a4c] = bank2Checksum;
    const bank3Checksum = get8BitChecksum(this.bytes, 0x6000, 0x7a4c) ^ 0xff;
    this.bytes[0x7a4c] = bank3Checksum;
    const wholeSaveChecksum =
      get8BitChecksum(this.bytes, 0x2598, 0x3521) ^ 0xff;
    this.bytes[0x3523] = wholeSaveChecksum;
    return changedMonPKMs;
  }
}
