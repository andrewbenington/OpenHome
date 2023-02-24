import OHPKM from 'types/PKM/OHPKM';
import { SaveType } from 'types/types';
import { PKM } from '../PKM/PKM';

export class SAV {
  filePath: string;
  saveType: SaveType = SaveType.UNKNOWN;
  money: number = 0;
  name: string = '';
  tid: number = 0;
  sid?: number;
  displayID: string = '000000';
  currentPCBox: number = 0;
  boxRows: number = 5;
  boxColumns: number = 6;
  boxNames: string[] = [];
  boxes: Array<Box> = [];
  bytes: Uint8Array;
  pkmType: typeof PKM = OHPKM;
  convertPKM: (mon: PKM) => PKM = (mon) => new OHPKM(mon);
  changedMons: BoxCoordinates[] = [];
  constructor(path: string, bytes: Uint8Array) {
    this.filePath = path;
    this.bytes = bytes;
  }
}

export interface Box {
  name: string;
  pokemon: Array<PKM | undefined>;
}

export interface BoxCoordinates {
  box: number;
  index: number;
}
