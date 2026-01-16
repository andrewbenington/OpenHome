// Basic types for Pokemon save editing

export enum Gender {
  Male = 0,
  Female = 1,
  Genderless = 2,
}

export enum OriginGame {
  Invalid = 0,
  Sapphire = 1,
  Ruby = 2,
  Emerald = 3,
  FireRed = 4,
  LeafGreen = 5,
}

export interface BoxCoordinates {
  box: number
  index: number
}

export interface BaseStats {
  hp: number
  atk: number
  def: number
  spa: number
  spd: number
  spe: number
}

export interface PokemonData {
  // Basic info
  dexNum: number
  formNum: number
  speciesName: string
  nickname: string
  level: number
  exp: number

  // Base stats
  baseStats: BaseStats

  // Calculated stats
  hp: number
  attack: number
  defense: number
  spAtk: number
  spDef: number
  speed: number

  // IVs
  hpIV: number
  attackIV: number
  defenseIV: number
  spAtkIV: number
  spDefIV: number
  speedIV: number

  // EVs
  hpEV: number
  attackEV: number
  defenseEV: number
  spAtkEV: number
  spDefEV: number
  speedEV: number

  // Moves
  moves: number[]
  moveNames: string[]
  movePP: number[]
  movePPUps: number[]

  // Other
  ability: number
  nature: number
  heldItem: number
  gender: Gender
  isShiny: boolean
  friendship: number
  isEgg: boolean

  // OT Info
  trainerName: string
  trainerID: number
  secretID: number
  trainerGender: Gender
  gameOfOrigin: OriginGame

  // Ball
  ball: number

  // Ribbons & Marks
  ribbons: number[]

  // Raw data
  isFakemon: boolean
}

export interface Box {
  name: string
  pokemon: (PokemonData | null)[]
}

export interface SaveData {
  boxes: Box[]
  trainerName: string
  trainerID: number
  secretID: number
  money: number
  updatedBoxSlots: BoxCoordinates[]
  bytes: Uint8Array
}
