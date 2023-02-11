import { pk4 } from "../../pkm/pk4";
import { Box, SAV } from "./SAV";

export class G4SAV implements SAV {
  money: number = -1;
  name: string = "";
  tid: number = 0;
  sid: number = 0;
  currentPCBox: number = 0;
  boxNames: string[];
  boxes: Array<Box> = Array(18);
  constructor(bytes: Uint8Array) {
    this.boxNames = [];
  }
}

export class G4Box implements Box {
  name: string;
  pokemon: Array<pk4> = new Array(30);
  constructor(n: string) {
    this.name = n;
  }
}
