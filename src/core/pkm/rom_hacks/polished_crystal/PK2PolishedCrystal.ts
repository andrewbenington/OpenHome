import {modernStatCalc, PkmOrOhpkmFormat} from "@openhome-core/pkm/util";
import {
  AbilityIndex,
  BinaryGender,
  ContestStats, ConvertStrategies,
  ExtraFormIndex,
  FormMetadata,
  Gender,
  Geolocations,
  HyperTraining,
  Language,
  NatureIndex, Pk2PolishedCrystalWasm,
  PlusMoveFlags,
  ShinyLeaves, Stats16Le,
  StatsPreSplit,
  TeraType,
  TrainerMemory
} from "@pkm-rs/pkg";
import * as types from "@openhome-core/util/types.ts";
import {FourMoves, Markings, Stats} from "@openhome-core/util/types.ts";
import {PluginIdentifier} from "@openhome-core/save/interfaces.ts";
import {MonTag} from "@openhome-ui/util/tags.ts";
import {Move} from "@openhome-core/resources";
import {Data} from "ts-lombok-kit/markers";
import {OHPKM} from "@openhome-core/pkm/OHPKM.ts";
import {PkmConstructorOptions} from "@openhome-core/pkm/PKM.ts";

class StatsObj {

}

@Data
export default class PK2PolishedCrystal {

  inner: Pk2PolishedCrystalWasm

  format: PkmOrOhpkmFormat = 'PK2PolishedCrystal' as const
  ability?: AbilityIndex
  abilityNum?: number
  affixedRibbon?: number | undefined
  alphaMove?: number
  avs?: types.Stats
  ball?: number
  battleMemoryCount?: number
  canGigantamax?: boolean
  checksum?: number
  consoleRegion?: number
  readonly contest?: ContestStats
  contestMemoryCount?: number
  country?: number
  // User-defined display color for this Pokémon in boxes (CSS color string)
  displayColor?: string
  dvs?: StatsPreSplit
  dynamaxLevel?: number
  eggDate?: types.PKMDate | undefined
  eggLocationIndex?: number
  encounterType?: number
  encryptionConstant?: number
  enjoyment?: number
  evs?: types.Stats
  evsG12?: StatsPreSplit
  exp: number = 0
  extraFormIndex?: ExtraFormIndex
  favorite?: boolean
  flag2LA?: boolean
  formArgument?: number
  formIndex: number = 0
  fullness?: number
  gameOfOrigin: number = 0
  gameOfOriginBattle?: number
  gender?: Gender
  readonly geolocations?: Geolocations
  gvs?: types.Stats
  handlerAffection?: number
  handlerFriendship?: number
  handlerGender?: BinaryGender
  handlerID?: number
  handlerLanguage?: number
  handlerMemory?: TrainerMemory
  handlerName?: string
  heightScalar?: number
  heldItemIndex: number = 0
  homeTracker?: bigint
  readonly hyperTraining?: HyperTraining
  isAlpha?: boolean
  isCurrentHandler?: boolean
  isEgg?: boolean
  isFatefulEncounter?: boolean
  isNicknamed?: boolean
  isNoble?: boolean
  isNsPokemon?: boolean
  isShadow?: boolean
  readonly ivs?: types.Stats
  language: Language = Language.English
  level?: number
  markings?: Markings
  masterFlagsLA?: Uint8Array
  metDate?: types.PKMDate | undefined
  metLevel?: number
  metLocationIndex?: number
  metTimeOfDay?: number
  moveFlagsLA?: Uint8Array
  movePP: FourMoves = [0, 0, 0, 0]
  movePPUps: FourMoves = [0, 0, 0, 0]
  moves: FourMoves = [0, 0, 0, 0]
  nationalDex: number = -1
  nature?: NatureIndex
  notes?: string
  nickname: string = ""
  obedienceLevel?: number
  performance?: number
  personalityValue?: number
  // pluginIdentifier is the plugin identifier corresponding to the PKM format, regardless of if the Pokémon was originally from that game
  pluginIdentifier?: PluginIdentifier
  // pluginOrigin is the plugin identifier of the game the Pokémon originally came from, which will be different from pluginIdentifier if the mon was transferred from a different game
  pluginOrigin?: PluginIdentifier
  pokeStarFame?: number
  pokerusByte?: number
  region?: number
  relearnMoves?: FourMoves
  resortEventStatus?: number
  ribbons?: string[]
  sanity?: number
  scale?: number
  secretID: number = 0
  secretSuperTrainingComplete?: boolean
  secretSuperTrainingUnlocked?: boolean
  shinyLeaves?: ShinyLeaves
  sociability?: number
  statLevel?: number
  statNature?: NatureIndex
  stats?: types.Stats
  statusCondition?: number
  superTrainingDistFlags?: number
  superTrainingFlags?: number
  tags?: MonTag[]
  readonly teraTypeOriginal?: TeraType
  readonly teraTypeOverride?: TeraType
  tmFlagsLzaBase?: Uint8Array
  tmFlagsLzaDlc?: Uint8Array
  tmMovesLza?: Move[]
  plusMoveFlags?: PlusMoveFlags
  tmFlagsSV?: Uint8Array
  tmMovesSv?: Move[]
  tmFlagsSVDLC?: Uint8Array
  tmMovesSVDLC?: Move[]
  trFlagsSwSh?: Uint8Array
  trMovesSwSh?: Move[]
  trainerAffection?: number
  trainerFriendship?: number
  trainerGender: BinaryGender = BinaryGender.Female
  trainerID: number = 0
  trainerMemory?: TrainerMemory
  trainerName: string = ""
  trainingBag?: number
  trainingBagHits?: number
  tutorFlagsLA?: Uint8Array
  tutorMovesLa?: Move[]
  unknownA0?: number
  unknownF3?: number
  weightScalar?: number
  heightDeviation?: number
  weightDeviation?: number
  heldItemName: string = ""
  calculateChecksum?: () => number
  refreshChecksum?: () => void
  metadata?: FormMetadata
  originalBytes?: ArrayBuffer
  extraDisplayFields?: () => Record<string, string | number | boolean>
  free?: () => void
  getLevel: () => number = () => 0
  isShiny: () => boolean = () => false
  isSquareShiny: () => boolean = () => false
  toBytes: ((_options?: types.ToBytesOptions) => ArrayBuffer) | (() => ArrayBuffer) = () => new ArrayBuffer()

  constructor(arg: OHPKM | Pk2PolishedCrystalWasm, options: PkmConstructorOptions) {
    if (arg instanceof Pk2PolishedCrystalWasm) {
      this.inner = arg
    } else {
      const ohpkmBytes = new Uint8Array(arg.toBytes())

      this.inner = Pk2PolishedCrystalWasm.fromOhpkmBytes(
        ohpkmBytes,
        options.strategy || ConvertStrategies.getDefault()
      )
    }
  }

  public getStats(): Stats {
    return {
      hp: 0,
      atk: 0,
      def: 0,
      spe: 0,
      spa: 0,
      spd: 0,
    }
  }
}

