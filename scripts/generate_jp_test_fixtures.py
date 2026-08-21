#!/usr/bin/env python3
"""Generate synthetic Japanese Gen 1/2 test saves.

Writes src/core/save/__test__/save-files/jp-blue.sav (Japanese Gen 1) and
jp-crystal.sav (Japanese Crystal). All content is synthetic: trainer テスト,
fixed TIDs, a handful of mons with chosen DVs. Layout facts:

Gen 1 (JP): trainer name 0x2598 (6 bytes), TID 0x25FB (BE), party 0x2ED5,
current box index 0x2842, current box data 0x302D, box banks 0x4000/0x6000
(4 boxes of 30 each, box size 0x566), 8-bit complement checksum over
0x2598-0x3593 stored at 0x3594. The box banks carry no checksums.

Gen 2 (JP Crystal): TID 0x2009 (BE), name 0x200B, party 0x281A, current box
index 0x26E2, live copy of the active box at 0x2D10, banks 0x4000 (6 boxes)
and 0x6000 (3 boxes) with box size 0x54A (includes 2 padding bytes), 16-bit
checksum over 0x2009-0x2AE2 stored LE at 0x2D0D and 0x7F0D, trainer-data
mirror at 0x7209. The synthetic save deliberately leaves the banked copy of
the active box stale (empty) while the live copy holds the mons, exercising
the live-copy handling.
"""

from pathlib import Path

OUT_DIR = Path(__file__).resolve().parents[1] / "src" / "core" / "save" / "__test__" / "save-files"

# minimal Japanese Gen 1/2 character map (katakana from 0x80; dakuten and
# handakuten glyphs at their composed low code points; 0x50 terminates)
JP = {
    "ア": 0x80, "ウ": 0x82, "カ": 0x85, "コ": 0x89, "シ": 0x8B, "ス": 0x8C,
    "タ": 0x8F, "チ": 0x90, "テ": 0x92, "ト": 0x93, "ニ": 0x95, "ネ": 0x97,
    "ノ": 0x98, "フ": 0x9B, "ミ": 0x9E, "ワ": 0xA9, "ュ": 0xAE,
    "ギ": 0x06, "ダ": 0x0F, "ピ": 0x41, "リ": 0xD8, "ー": 0xE3,
}


def jp_name(text: str, length: int = 6) -> bytes:
    data = bytes(JP[c] for c in text) + b"\x50"
    assert len(data) <= length, text
    return data.ljust(length, b"\x00")


def dv_bytes(atk: int, dfn: int, spe: int, spc: int) -> bytes:
    return bytes([(atk << 4) | dfn, (spe << 4) | spc])


# ---------------------------------------------------------------- Gen 1 (JP)

G1_BOX_CAPACITY = 30
G1_BOX_SIZE = 0x566
G1_STRUCT = 33


def g1_mon(raw_species: int, level: int, tid: int, dvs: bytes) -> bytes:
    s = bytearray(G1_STRUCT)
    s[0x00] = raw_species
    s[0x01:0x03] = (20).to_bytes(2, "big")  # current HP
    s[0x03] = level
    s[0x05] = 0x16  # type 1
    s[0x06] = 0x03  # type 2
    s[0x08] = 0x21  # move 1: Tackle
    s[0x0C:0x0E] = tid.to_bytes(2, "big")
    s[0x10] = 135  # experience (low byte)
    s[0x1B:0x1D] = dvs
    return bytes(s)


def g1_box(mons: list[tuple[bytes, bytes, bytes]]) -> bytes:
    """mons: list of (struct, ot, nickname)"""
    box = bytearray(G1_BOX_SIZE)
    box[0] = len(mons)
    for i, (struct, _, _) in enumerate(mons):
        box[1 + i] = struct[0]
    box[1 + len(mons)] = 0xFF
    structs_off = 1 + G1_BOX_CAPACITY + 1
    ot_off = structs_off + G1_BOX_CAPACITY * G1_STRUCT
    nick_off = ot_off + G1_BOX_CAPACITY * 6
    for i, (struct, ot, nick) in enumerate(mons):
        box[structs_off + i * G1_STRUCT : structs_off + (i + 1) * G1_STRUCT] = struct
        box[ot_off + i * 6 : ot_off + (i + 1) * 6] = ot
        box[nick_off + i * 6 : nick_off + (i + 1) * 6] = nick
    return bytes(box)


def make_gen1() -> bytes:
    tid = 12345
    ot = jp_name("テスト")
    data = bytearray(0x8000)

    data[0x2598:0x259E] = ot
    data[0x25FB:0x25FD] = tid.to_bytes(2, "big")

    # party: one Bulbasaur (raw index 0x99)
    party = g1_mon(0x99, 5, tid, dv_bytes(7, 3, 1, 15))
    data[0x2ED5] = 1
    data[0x2ED6] = 0x99
    data[0x2ED7] = 0xFF
    structs = 0x2ED5 + 1 + 7
    data[structs : structs + G1_STRUCT] = party[:G1_STRUCT]

    box0 = g1_box(
        [
            # shiny Bulbasaur (Atk 15 / 10 / 10 / 10)
            (g1_mon(0x99, 5, tid, dv_bytes(15, 10, 10, 10)), ot, jp_name("フシギダネ")),
            (g1_mon(0x54, 12, tid, dv_bytes(4, 4, 4, 4)), ot, jp_name("ピカチュウ")),
        ]
    )
    box4 = g1_box([(g1_mon(0x15, 30, tid, dv_bytes(9, 9, 9, 9)), ot, jp_name("ミュウ"))])
    empty = g1_box([])

    for n in range(8):
        offset = 0x4000 + n * G1_BOX_SIZE if n < 4 else 0x6000 + (n - 4) * G1_BOX_SIZE
        data[offset : offset + G1_BOX_SIZE] = {0: box0, 4: box4}.get(n, empty)

    data[0x2842] = 0  # current box index
    data[0x302D : 0x302D + G1_BOX_SIZE] = box0  # live copy of the active box

    checksum = (~sum(data[0x2598:0x3594])) & 0xFF
    data[0x3594] = checksum
    return bytes(data)


# ------------------------------------------------------- Gen 2 (JP Crystal)

G2_BOX_CAPACITY = 30
G2_BOX_SIZE = 0x54A
G2_STRUCT = 32


def g2_mon(dex: int, level: int, tid: int, dvs: bytes, item: int = 0) -> bytes:
    s = bytearray(G2_STRUCT)
    s[0x00] = dex
    s[0x01] = item
    s[0x02] = 0x21  # move 1
    s[0x06:0x08] = tid.to_bytes(2, "big")
    s[0x0A] = 135  # experience (low byte)
    s[0x15:0x17] = dvs
    s[0x1B] = 70  # friendship
    s[0x1F] = level
    return bytes(s)


def g2_box(mons: list[tuple[bytes, bytes, bytes]]) -> bytes:
    box = bytearray(G2_BOX_SIZE)
    box[0] = len(mons)
    for i, (struct, _, _) in enumerate(mons):
        box[1 + i] = struct[0]
    box[1 + len(mons)] = 0xFF
    structs_off = 1 + G2_BOX_CAPACITY + 1
    ot_off = structs_off + G2_BOX_CAPACITY * G2_STRUCT
    nick_off = ot_off + G2_BOX_CAPACITY * 6
    for i, (struct, ot, nick) in enumerate(mons):
        box[structs_off + i * G2_STRUCT : structs_off + (i + 1) * G2_STRUCT] = struct
        box[ot_off + i * 6 : ot_off + (i + 1) * 6] = ot
        box[nick_off + i * 6 : nick_off + (i + 1) * 6] = nick
    return bytes(box)


def make_gen2() -> bytes:
    tid = 54321
    ot = jp_name("テスト")
    data = bytearray(0x8000)

    data[0x2009:0x200B] = tid.to_bytes(2, "big")
    data[0x200B:0x2011] = ot

    # empty party
    data[0x281A] = 0
    data[0x281B] = 0xFF

    live_box0 = g2_box(
        [
            # shiny Totodile (Atk 2 / 10 / 10 / 10)
            (g2_mon(158, 5, tid, dv_bytes(2, 10, 10, 10)), ot, jp_name("ワニノコ")),
            (g2_mon(25, 10, tid, dv_bytes(6, 6, 6, 6), item=0x03), ot, jp_name("ピカチュウ")),
        ]
    )
    box6 = g2_box([(g2_mon(152, 5, tid, dv_bytes(3, 3, 3, 3)), ot, jp_name("チコリータ"))])
    empty = g2_box([])

    for n in range(9):
        offset = 0x4000 + n * G2_BOX_SIZE if n < 6 else 0x6000 + (n - 6) * G2_BOX_SIZE
        # the banked copy of the active box (box 0) is deliberately stale
        data[offset : offset + G2_BOX_SIZE] = box6 if n == 6 else empty

    data[0x26E2] = 0  # current box index
    data[0x2D10 : 0x2D10 + G2_BOX_SIZE - 2] = live_box0[: G2_BOX_SIZE - 2]

    # deterministic non-zero filler between the Crystal checksum region end
    # (0x2AE2) and the Gold/Silver one (0x2C8B). Real saves have data here;
    # leaving it zeroed makes the GS and international validators
    # coincidentally accept the file.
    for i in range(0x2AF0, 0x2C80):
        data[i] = (i * 7 + 13) & 0xFF

    checksum = sum(data[0x2009:0x2AE3]) & 0xFFFF
    data[0x2D0D:0x2D0F] = checksum.to_bytes(2, "little")
    data[0x7F0D:0x7F0F] = checksum.to_bytes(2, "little")
    data[0x7209 : 0x7209 + 0xADA] = data[0x2009 : 0x2009 + 0xADA]
    return bytes(data)


if __name__ == "__main__":
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "jp-blue.sav").write_bytes(make_gen1())
    (OUT_DIR / "jp-crystal.sav").write_bytes(make_gen2())
    print(f"wrote jp-blue.sav and jp-crystal.sav to {OUT_DIR}")
