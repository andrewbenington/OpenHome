import {
  ContestStats,
  Geolocation,
  HyperTrainStats,
  MarkingsFourShapes,
  MarkingsSixShapesNoColor,
  MarkingsSixShapesWithColor,
  Memory,
  PKMDate,
  Stats,
  StatsPreSplit,
  ToBytesOptions,
} from 'pokemon-files'
import { PluginPKMInterface } from '../../interfaces'

export class PK3UB implements PluginPKMInterface {
  pluginIdentifier!: string
  selectColor!: string
  format!: string
  abilityIndex?: number | undefined
  abilityNum?: number | undefined
  affixedRibbon?: number | undefined
  alphaMove?: number | undefined
  avs?: Stats | undefined
  ball?: number | undefined
  ballDPPt?: number | undefined
  ballHGSS?: number | undefined
  battleMemoryCount?: number | undefined
  canGigantamax?: boolean | undefined
  checksum?: number | undefined
  consoleRegion?: number | undefined
  contest?: ContestStats | undefined
  contestMemoryCount?: number | undefined
  country?: number | undefined
  currentHP!: number
  dexNum!: number
  dvs?: StatsPreSplit | undefined
  dynamaxLevel?: number | undefined
  eggDate?: PKMDate | undefined
  eggLocationIndex?: number | undefined
  eggLocationIndexDP?: number | undefined
  eggLocationIndexPtHGSS?: number | undefined
  encounterType?: number | undefined
  encryptionConstant?: number | undefined
  enjoyment?: number | undefined
  evs?: Stats | undefined
  evsG12?: StatsPreSplit | undefined
  exp!: number
  favorite?: boolean | undefined
  fieldEventFatigue1?: number | undefined
  fieldEventFatigue2?: number | undefined
  flag2LA?: boolean | undefined
  formArgument?: number | undefined
  formeNum!: number
  fullness?: number | undefined
  gameOfOrigin!: number
  gameOfOriginBattle?: number | undefined
  gender?: number | undefined
  geolocations?: Geolocation[] | undefined
  gvs?: Stats | undefined
  handlerAffection?: number | undefined
  handlerFriendship?: number | undefined
  handlerGender?: boolean | undefined
  handlerID?: number | undefined
  handlerLanguage?: number | undefined
  handlerMemory?: Memory | undefined
  handlerName?: string | undefined
  height?: number | undefined
  heldItemIndex!: number
  homeTracker?: Uint8Array<ArrayBufferLike> | undefined
  hyperTraining?: HyperTrainStats | undefined
  isAlpha?: boolean | undefined
  isCurrentHandler?: boolean | undefined
  isEgg?: boolean | undefined
  isFatefulEncounter?: boolean | undefined
  isNicknamed?: boolean | undefined
  isNoble?: boolean | undefined
  isNsPokemon?: boolean | undefined
  ivs?: Stats | undefined
  languageIndex!: number
  level?: number | undefined
  markings?: MarkingsFourShapes | MarkingsSixShapesNoColor | MarkingsSixShapesWithColor | undefined
  masterFlagsLA?: Uint8Array<ArrayBufferLike> | undefined
  metDate?: PKMDate | undefined
  metLevel?: number | undefined
  metLocationIndex?: number | undefined
  metLocationIndexDP?: number | undefined
  metLocationIndexPtHGSS?: number | undefined
  metTimeOfDay?: number | undefined
  moveFlagsLA?: Uint8Array<ArrayBufferLike> | undefined
  movePP!: number[]
  movePPUps!: number[]
  moves!: number[]
  nature?: number | undefined
  nickname!: string
  obedienceLevel?: number | undefined
  palma?: number | undefined
  performance?: number | undefined
  personalityValue?: number | undefined
  pokeStarFame?: number | undefined
  pokerusByte?: number | undefined
  region?: number | undefined
  relearnMoves?: number[] | undefined
  resortEventStatus?: number | undefined
  ribbonBytes?: Uint8Array<ArrayBufferLike> | undefined
  ribbons?: string[] | undefined
  sanity?: number | undefined
  scale?: number | undefined
  secretID!: number
  secretSuperTrainingComplete?: boolean | undefined
  secretSuperTrainingUnlocked?: boolean | undefined
  shadowGauge?: number | undefined
  shadowID?: number | undefined
  shinyLeaves?: number | undefined
  sociability?: number | undefined
  statLevel?: number | undefined
  statNature?: number | undefined
  statusCondition?: number | undefined
  superTrainingDistFlags?: number | undefined
  superTrainingFlags?: number | undefined
  teraTypeOriginal?: number | undefined
  teraTypeOverride?: number | undefined
  tmFlagsBDSP?: Uint8Array<ArrayBufferLike> | undefined
  tmFlagsSV?: Uint8Array<ArrayBufferLike> | undefined
  tmFlagsSVDLC?: Uint8Array<ArrayBufferLike> | undefined
  trFlagsSwSh?: Uint8Array<ArrayBufferLike> | undefined
  trainerAffection?: number | undefined
  trainerFriendship?: number | undefined
  trainerGender!: boolean
  trainerID!: number
  trainerMemory?: Memory | undefined
  trainerName!: string
  trainingBag?: number | undefined
  trainingBagHits?: number | undefined
  tutorFlagsLA?: Uint8Array<ArrayBufferLike> | undefined
  type1?: number | undefined
  type2?: number | undefined
  unknownA0?: number | undefined
  unknownF3?: number | undefined
  weight?: number | undefined
  heldItemName!: string
  language!: string
  isShadow?: boolean | undefined
  getLevel!: () => number
  isShiny!: () => boolean
  isSquareShiny!: () => boolean
  toBytes!: ((options?: ToBytesOptions) => ArrayBuffer) | (() => ArrayBuffer)
  getStats(): Stats {
    throw new Error('Method not implemented.')
  }
  pluginOrigin?: string | undefined
  isLocked?: boolean | undefined
  originalBytes?: Uint8Array<ArrayBufferLike> | undefined
}

export default PK3UB
