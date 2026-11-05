import {TransferLockedForms, TransferRestrictions} from "../util/TransferRestrictions";
import {emeraldExpnSupportsExtraForm} from "@pkm-rs/pkg";

export const EMERALD_EXPN_TRANSFER_RESTRICTIONS: TransferRestrictions = {

    // Pokémon Emerald Expansion supports every Pokémon, including alternate form, up to Gen IX.
    maxDexNum: 1025,
    excludedForms: {
        ...TransferLockedForms,
    },
    supportsExtraForm: emeraldExpnSupportsExtraForm,
}