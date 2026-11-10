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
  NatureIndex, Pk2PolishedCrystalWasm, Pk7Wasm,
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
import PKMBase from "./PKMBase";

class StatsObj {

}

export default class PK2PolishedCrystal extends PKMBase<Pk2PolishedCrystalWasm> {

}

