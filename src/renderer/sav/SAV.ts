import { pkm } from "../../pkm/pkm";

export interface SAV {
  money: number;
  name: string;
  tid: number;
  sid: number;
  currentPCBox: number;
  boxNames: string[];
  boxes: Array<Box>;
}

export interface Box {
  name: string;
  pokemon: Array<pkm>;
}
