import { SaveType } from 'renderer/types/types';
import { pkm } from '../pkm/pkm';

export class SAV {
  filePath: string;
  saveType: SaveType = SaveType.UNKNOWN;
  money: number = 0;
  name: string = '';
  tid: number = 0;
  sid?: number;
  currentPCBox: number = 0;
  boxRows: number = 5;
  boxColumns: number = 6;
  boxNames: string[] = [];
  boxes: Array<Box> = [];
  bytes: Uint8Array;
  changedMons: BoxCoordinates[] = [];
  constructor(path: string, bytes: Uint8Array) {
    this.filePath = path;
    this.bytes = bytes;
  }
}

export interface Box {
  name: string;
  pokemon: Array<pkm | undefined>;
}

export interface BoxCoordinates {
  box: number;
  index: number;
}
