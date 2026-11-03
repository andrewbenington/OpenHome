import {Box, BoxAndSlot, PluginSAV, SlotMetadata} from "../interfaces";
import {PluginIdentifier} from "@openhome-core/tauri/spectaCommands";
import {Option} from "@openhome-core/util/functional";
import {emptyPathData, PathData} from "../util/path";
import {TransferLockedForms, TransferRestrictions} from "../util/TransferRestrictions";
import {PK3EmeraldExpn} from "./PK3EmeraldExpn";
import {
    BinaryGender,
    emeraldExpnSupportsExtraForm,
    ExtraFormIndex,
    Language,
    NationalDex,
    OriginGame
} from "@pkm-rs/pkg";
import {G3SAV} from "../G3SAV";
import {todo} from "node:test";
import {MyStatusBlock} from "@openhome-core/save/emerald_expn/MyStatusBlock.ts";
import {utf16BytesToString} from "@openhome-core/util";

const MAX_ADDITIONAL_BYTES = 0x100;
const SAVE_SIZE_BYTES = 0x20000


export const EMERALD_EXPN_TRANSFER_RESTRICTIONS: TransferRestrictions = {

    // Pokémon Emerald Expansion supports every Pokémon, including alternate form, up to Gen IX.
    maxDexNum: 1025,
    excludedForms: {
        ...TransferLockedForms,
    },
    supportsExtraForm: emeraldExpnSupportsExtraForm,
}

class ConfigBlock {
    dataView: DataView<ArrayBuffer>

    constructor(saveBytes: Uint8Array) {
        todo!()
    }

    public getBoxName(index: number): string {
        todo!()
    }

    public getCurrentBox(): number {
        todo!()
    }
}

class BoxLayoutEmeraldExpn {
    dataView: DataView<ArrayBuffer>
    private BOX_COUNT: number = 14;

    constructor(saveBytes: Uint8Array) {
        todo!()
    }

    public getBoxName(index: number): string {
        if (index >= this.BOX_COUNT) {
            throw Error('Attempting to get box name at index past BOX_COUNT')
        }
        return todo!()
    }

    public getCurrentBox(): number {
        todo!()
    }

}

// noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols
export class G3EmeraldExpnSave<T extends PK3EmeraldExpn> extends PluginSAV<T> {

    static saveTypeAbbreviation = 'EMERALD_EXPN'
    static saveTypeName = 'Pokémon Emerald Expansion'
    static saveTypeID = 'emerald_expn' as const
    static pkmType = PK3EmeraldExpn
    static boxSizeBytes = PK3EmeraldExpn.getBoxSize() * 30
    static transferRestrictions: TransferRestrictions = EMERALD_EXPN_TRANSFER_RESTRICTIONS


    /**
     * Non-Emerald game codes, representing Ruby/Sapphire (0) and FireRed/LeafGreen (1).
     */
    static nonEmeraldGameCodes = [0, 1];
    static cosplayPikachuForms = [
        ExtraFormIndex.PikachuRockStar,
        ExtraFormIndex.PikachuBelle,
        ExtraFormIndex.PikachuPopStar,
        ExtraFormIndex.PikachuPhD,
        ExtraFormIndex.PikachuLibre,
    ]
    transferRestrictions: TransferRestrictions = G3EmeraldExpnSave.transferRestrictions;
    origin: OriginGame;
    filePath: PathData = todo!();
    fileCreated?: Date | undefined = todo!();
    money: number = todo!();
    name: string = todo!();
    tid: number = todo!();
    sid?: number | undefined = todo!();
    trainerGender: BinaryGender = todo!();
    language?: Language | undefined = todo!();
    displayID: string = todo!();
    currentPCBox: number = todo!();
    invalid: boolean = todo!();
    tooEarlyToOpen: boolean = todo!();
    updatedBoxSlots: BoxAndSlot[] = todo!();
    getSlotMetadata?: ((boxNum: number, boxSlot: number) => SlotMetadata) | undefined = todo!();
    pluginIdentifier: PluginIdentifier = todo!();
    boxColumns: number = 6;
    boxRows: number = 5;
    boxes: Readonly<Box<T>>[] = todo!();

    // @ts-ignore
    bytes: Uint8Array<ArrayBufferLike> = todo!();
    private myStatusBlock: MyStatusBlock;
    private hashOffset = todo!() // Type: number
    private configBlock: ConfigBlock;
    private BOX_SIZE: number = 30;

    constructor(path: PathData, bytes: Uint8Array) {
        super()
        this.bytes = bytes
        this.filePath = path
        this.hashOffset = todo!()

        // Parse trainer information
        this.myStatusBlock = new MyStatusBlock(bytes)
        this.origin = this.myStatusBlock.getGame();
        this.configBlock = new ConfigBlock(bytes)
        this.name = this.myStatusBlock.getName()

        const fullTrainerID = this.myStatusBlock.getFullID()
        this.tid = todo!()
        this.sid = todo!()
        this.displayID = todo!()
        this.origin = this.myStatusBlock.getGame()

        // Initialize PC boxes and names
        const boxNamesBlock = new BoxLayoutEmeraldExpn(this.bytes)
        this.boxes = Array(this.getBoxCount())

        for (let box = 0; box < this.getBoxCount(); box++) {
            const boxName = boxNamesBlock.getBoxName(box) || `Box ${box + 1}`
            this.boxes[box] = new Box(boxName, this.BOX_SIZE)
        }

        // Parse Pokémon stored in the PC
        for (let box = 0; box < this.getBoxCount(); box++) {
            for (let monIndex = 0; monIndex < 30; monIndex++) {
                try {
                    const startByte = todo!()
                    const endByte = todo!()
                    const monData = todo!()
                    const mon = this.buildPKM(monData, true)

                    // Only populate slots containing valid Pokémon
                    if (mon.gameOfOrigin !== 0 && mon.nationalDex !== 0) {
                        this.boxes[box].boxSlots[monIndex] = mon
                    }

                } catch (e) {
                    console.error(`Failed to parse Pokémon in Box ${box + 1}, Slot ${monIndex + 1}:`, e)
                }
            }
        }
    }
    
    static fileIsSave(bytes: Uint8Array): boolean {
        if (bytes.length < SAVE_SIZE_BYTES || bytes.length - SAVE_SIZE_BYTES > MAX_ADDITIONAL_BYTES) {
            return false
        }
        try {
            const save = new G3SAV(emptyPathData, bytes)
            return save.bytes.slice(0, 6).toString() == "RHHEXP";
        } catch (e) {
            console.error(e)
            return false
        }
    }



    static extraFormSupported(extraFormIndex?: ExtraFormIndex): boolean {
        return (
            extraFormIndex != null &&
            (G3EmeraldExpnSave.isPikachuCosplay(extraFormIndex) ||
                G3EmeraldExpnSave.isGigantamax(extraFormIndex) ||
                extraFormIndex == ExtraFormIndex.EternatusEternamax)
        )
    }

    static isGigantamax(extraFormIndex: ExtraFormIndex) {
        return extraFormIndex >= ExtraFormIndex.CharizardGiga && extraFormIndex <= ExtraFormIndex.UrsifuRapidGiga;
    }

    static isPikachuCosplay(extraFormIndex: ExtraFormIndex) {
        return G3EmeraldExpnSave.cosplayPikachuForms.includes(extraFormIndex)
    }


    prepareForSaving(): void {
        throw todo!();
    }

    // @ts-ignore
    getMonAt(boxNum: number, boxSlot: number): Option<T> {
        throw todo!();
    }

    // @ts-ignore
    setMonAt(boxNum: number, boxSlot: number, mon: Option<T>): void {
        throw todo!();
    }

    override supportsMon(
        nationalDex: number,
        formeNumber: number,
        extraFormIndex?: ExtraFormIndex
    ): boolean {
        if (!G3EmeraldExpnSave.extraFormSupported(extraFormIndex)) {
            return false
        }

        return nationalDex <= NationalDex.Pecharunt && (formeNumber === 0 || nationalDex === NationalDex.Unown)

    }

    // @ts-ignore
    supportsItem(itemIndex: number) {
        return todo!();
    }

    // @ts-ignore
    convertOhpkm(ohpkm: OHPKM, strategy) {
        return todo!();
    }


}
