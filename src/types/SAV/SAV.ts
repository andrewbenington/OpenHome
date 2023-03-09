import { GameOfOrigin } from 'consts';
import OHPKM from 'types/PKM/OHPKM';
import { TransferRestrictions } from 'types/TransferRestrictions';
import { SaveType } from 'types/types';
import { PKM } from '../PKM/PKM';

export class SAV {
  saveType: SaveType = SaveType.UNKNOWN;
  origin: GameOfOrigin = 0;
  pkmType: typeof PKM = OHPKM;
  boxRows: number = 5;
  boxColumns: number = 6;
  transferRestrictions: TransferRestrictions = {};

  filePath: string;

  money: number = 0;
  name: string = '';
  tid: number = 0;
  sid?: number;
  displayID: string = '000000';
  currentPCBox: number = 0;
  boxNames: string[] = [];
  boxes: Array<Box> = [];
  bytes: Uint8Array;
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