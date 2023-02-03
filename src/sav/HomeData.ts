import _ from "lodash";
import { pkm } from "../pkm/pkm";
import { Box, SAV } from "./SAV";

export class HomeData implements SAV {
  static PC_OFFSET = 0x400;
  money: number = -1;
  name: string = "";
  tid: number = 0;
  sid: number = 0;
  currentPCBox: number = 0;
  boxNames: string[];
  boxes: Array<Box> = Array(36);
  constructor(bytes: Uint8Array) {
    this.boxNames = _.range(36).map((i) => `Home Box ${i + 1}`);
    this.boxes = this.boxNames.map((name) => new HomeBox(name));
  }
}

export class HomeBox implements Box {
  name: string;
  pokemon: Array<pkm> = new Array(120);
  constructor(n: string) {
    this.name = n;
  }
}
