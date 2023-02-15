import { pkm } from '../pkm/pkm';

export class SAV {
  filePath: string;
  money: number = 0;
  name: string = "";
  tid: number = 0;
  sid?: number;
  currentPCBox: number = 0;
  private _boxNames: string[] = [];
  public get boxNames(): string[] {
    return this._boxNames;
  }
  public set boxNames(value: string[]) {
    this._boxNames = value;
  }
  private _boxes: Array<Box> = [];
  public get boxes(): Array<Box> {
    return this._boxes;
  }
  public set boxes(value: Array<Box>) {
    this._boxes = value;
  }
  bytes: Uint8Array;
  changedMons: BoxCoordinates[] = [];
  constructor(path: string, bytes: Uint8Array) {
    this.filePath = path
    this.bytes = bytes
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
