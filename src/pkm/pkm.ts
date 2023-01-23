import { Items } from "../consts/Items";
import { pk4 } from "./pk4";

export class pkm {
  static markingCount = 4;
  static markingColors = 1;

  bytes: Uint8Array = new Uint8Array();
  format: string = "pkm";

  dexNum: number = 0;
  heldItem: string = "None";
  trainerID: number = 0;
  secretID: number = 0;
  exp: number = 0;
  ability: string = "No Ability";
  abilityNum: number = 0;
  favorite: boolean = false;

  markings: number = 0;
  isNicknamed: boolean = false;

  language: string = "";
  personalityValue: number = 0;
  formNum: number = 0;
  displayID: number = 0;
  nature: number = 0;
  statNature?: number;
  isFatefulEncounter: boolean = false;
  gender: number = 2;
  ball: number = 0;
  metLevel: number = 0;
  trainerGender: number = 0;
  moves: [number, number, number, number] = [0, 0, 0, 0];
  relearnMoves?: [number, number, number, number];
  level: number = 1;
  stats: stats = {
    hp: 0,
    atk: 0,
    def: 0,
    spa: 0,
    spd: 0,
    spe: 0,
  };
  ivs: stats = {
    hp: 0,
    atk: 0,
    def: 0,
    spa: 0,
    spd: 0,
    spe: 0,
  };
  evs: stats = {
    hp: 0,
    atk: 0,
    def: 0,
    spa: 0,
    spd: 0,
    spe: 0,
  };
  contest: contestStats = {
    cool: 0,
    beauty: 0,
    cute: 0,
    smart: 0,
    tough: 0,
    sheen: 0,
  };
  gameOfOrigin: number = 0xfe;
  nickname: string = "Bad Egg";
  trainerName: string = "TRAINER";
  ribbons: string[] = [];
  eggDay?: number = 0;
  eggMonth?: number = 0;
  eggYear?: number = 0;
  eggLocation: string = "a distant land";
  metDay?: number = 1;
  metMonth?: number = 1;
  metYear?: number = 0;
  metLocation: string = "a distant land";
  isShiny: boolean = false;

  isShadow: boolean = false;

  canGigantamax?: boolean;
  isAlpha?: boolean;
  isNoble?: boolean;
  isSquareShiny?: boolean;
  dynamaxLevel?: number;
  teraTypeOriginal?: number;
  teraTypeOverride?: number;

  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
  }

  getLevel() {
    return 1;
  }

  getMarking: (index: number) => number = (index: number) => {
    return (this.markings >> index) & 1;
  };
}

interface stats {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

interface contestStats {
  cool: number;
  beauty: number;
  cute: number;
  smart: number;
  tough: number;
  sheen: number;
}
