import _ from 'lodash';
import OHPKM from 'pkm/OHPKM';
import { pkm } from '../pkm/pkm';
import { Box, BoxCoordinates, SAV } from './SAV';

export class HomeData implements SAV {
  bytes: Uint8Array;
  static PC_OFFSET = 0x400;
  money: number = -1;
  name: string = '';
  tid: number = 0;
  sid: number = 0;
  currentPCBox: number = 0;
  boxNames: string[];
  boxes: Array<HomeBox> = Array(36);
  changedMons: BoxCoordinates[] = [];
  constructor(bytes: Uint8Array) {
    this.bytes = bytes
    this.boxNames = _.range(36).map((i) => `Home Box ${i + 1}`);
    this.boxes = this.boxNames.map((name) => new HomeBox(name));
  }
}

export class HomeBox implements Box {
  name: string;
  pokemon: Array<OHPKM | undefined> = new Array(120);
  constructor(n: string) {
    this.name = n;
  }
}
