import {todo} from "node:test";
import {utf16BytesToString} from "@openhome-core/util";
import {BinaryGender, OriginGame} from "@pkm-rs/pkg";

export class MyStatusBlock {
    dataView: DataView<ArrayBuffer>

    constructor(saveBytes: Uint8Array) {
        todo!()
    }

    public getName(): string {
        todo!()
    }

    public getFullID(): number {
        todo!()
    }

    public getSID(): number {
        todo!()
    }

    public getGender(): BinaryGender {
        todo!()
    }

    public getGame(): OriginGame {
        return OriginGame.Emerald;
    }
}