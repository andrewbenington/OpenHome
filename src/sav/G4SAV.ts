import { pk4 } from '../pkm/pk4';
import { Box, SAV } from './SAV';

export class G4SAV extends SAV {
  constructor(path: string, bytes: Uint8Array) {
    super(path, bytes)
    this.boxes = Array(18);
  }
}

export class G4Box implements Box {
  name: string;
  pokemon: Array<pk4> = new Array(30);
  constructor(n: string) {
    this.name = n;
  }
}
