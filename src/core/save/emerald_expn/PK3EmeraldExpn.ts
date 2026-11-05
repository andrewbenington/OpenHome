// noinspection JSUnusedGlobalSymbols

import PK3 from "@openhome-core/pkm/PK3";
import {
    ConvertStrategy
} from "@pkm-rs/pkg";
import {OHPKM} from "@openhome-core/pkm/OHPKM.ts";
import { Errorable, R } from '@openhome-core/util/functional'

export class PK3EmeraldExpn extends PK3 {

    static override fromOhpkm(ohpkm: OHPKM, strategy: ConvertStrategy): Errorable<PK3> {
        return R.tryFrom(() => new PK3EmeraldExpn(ohpkm, { strategy }))
    }


    static getBoxSize() {
        return 14
    }

}