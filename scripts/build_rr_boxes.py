#!/usr/bin/env python3
"""Populate Radical Red PC boxes with single-stage and first-line evolution Pokemon."""

from __future__ import annotations

import argparse
import json
import random
import struct
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Tuple

SAVE_SIZES_BYTES = {0x20000, 0x20010}
SECTOR_SIZE = 0x1000
SECTOR_DATA_SIZE = 0x0FF0
POKEMON_SIZE = 58
POKEMON_PER_BOX = 30
NUM_BOXES = 18

EXPERIENCE_CURVES: Dict[str, List[int]] = {
    "Erratic": [
        0, 15, 52, 122, 237, 406, 637, 942, 1326, 1800, 2369, 3041, 3822, 4719, 5737, 6881, 8155,
        9564, 11111, 12800, 14632, 16610, 18737, 21012, 23437, 26012, 28737, 31610, 34632, 37800,
        41111, 44564, 48155, 51881, 55737, 59719, 63822, 68041, 72369, 76800, 81326, 85942, 90637,
        95406, 100237, 105122, 110052, 115015, 120001, 125000, 131324, 137795, 144410, 151165,
        158056, 165079, 172229, 179503, 186894, 194400, 202013, 209728, 217540, 225443, 233431,
        241496, 249633, 257834, 267406, 276458, 286328, 296358, 305767, 316074, 326531, 336255,
        346965, 357812, 367807, 378880, 390077, 400293, 411686, 423190, 433572, 445239, 457001,
        467489, 479378, 491346, 501878, 513934, 526049, 536557, 548720, 560922, 571333, 583539,
        591882, 600000,
    ],
    "Fast": [
        0, 6, 21, 51, 100, 172, 274, 409, 583, 800, 1064, 1382, 1757, 2195, 2700, 3276, 3930, 4665,
        5487, 6400, 7408, 8518, 9733, 11059, 12500, 14060, 15746, 17561, 19511, 21600, 23832, 26214,
        28749, 31443, 34300, 37324, 40522, 43897, 47455, 51200, 55136, 59270, 63605, 68147, 72900,
        77868, 83058, 88473, 94119, 100000, 106120, 112486, 119101, 125971, 133100, 140492, 148154,
        156089, 164303, 172800, 181584, 190662, 200037, 209715, 219700, 229996, 240610, 251545,
        262807, 274400, 286328, 298598, 311213, 324179, 337500, 351180, 365226, 379641, 394431,
        409600, 425152, 441094, 457429, 474163, 491300, 508844, 526802, 545177, 563975, 583200,
        602856, 622950, 643485, 664467, 685900, 707788, 730138, 752953, 776239, 800000,
    ],
    "Medium Fast": [
        0, 8, 27, 64, 125, 216, 343, 512, 729, 1000, 1331, 1728, 2197, 2744, 3375, 4096, 4913, 5832,
        6859, 8000, 9261, 10648, 12167, 13824, 15625, 17576, 19683, 21952, 24389, 27000, 29791,
        32768, 35937, 39304, 42875, 46656, 50653, 54872, 59319, 64000, 68921, 74088, 79507, 85184,
        91125, 97336, 103823, 110592, 117649, 125000, 132651, 140608, 148877, 157464, 166375,
        175616, 185193, 195112, 205379, 216000, 226981, 238328, 250047, 262144, 274625, 287496,
        300763, 314432, 328509, 343000, 357911, 373248, 389017, 405224, 421875, 438976, 456533,
        474552, 493039, 512000, 531441, 551368, 571787, 592704, 614125, 636056, 658503, 681472,
        704969, 729000, 753571, 778688, 804357, 830584, 857375, 884736, 912673, 941192, 970299,
        1000000,
    ],
    "Medium Slow": [
        0, 9, 57, 96, 135, 179, 236, 314, 419, 560, 742, 973, 1261, 1612, 2035, 2535, 3120, 3798,
        4575, 5460, 6458, 7577, 8825, 10208, 11735, 13411, 15244, 17242, 19411, 21760, 24294, 27021,
        29949, 33084, 36435, 40007, 43808, 47846, 52127, 56660, 61450, 66505, 71833, 77440, 83335,
        89523, 96012, 102810, 109923, 117360, 125126, 133229, 141677, 150476, 159635, 169159,
        179056, 189334, 199999, 211060, 222522, 234393, 246681, 259392, 272535, 286115, 300140,
        314618, 329555, 344960, 360838, 377197, 394045, 411388, 429235, 447591, 466464, 485862,
        505791, 526260, 547274, 568841, 590969, 613664, 636935, 660787, 685228, 710266, 735907,
        762160, 789030, 816525, 844653, 873420, 902835, 932903, 963632, 995030, 1027103, 1059860,
    ],
    "Slow": [
        0, 10, 33, 80, 156, 270, 428, 640, 911, 1250, 1663, 2160, 2746, 3430, 4218, 5120, 6141, 7290,
        8573, 10000, 11576, 13310, 15208, 17280, 19531, 21970, 24603, 27440, 30486, 33750, 37238,
        40960, 44921, 49130, 53593, 58320, 63316, 68590, 74148, 80000, 86151, 92610, 99383, 106480,
        113906, 121670, 129778, 138240, 147061, 156250, 165813, 175760, 186096, 196830, 207968,
        219520, 231491, 243890, 256723, 270000, 283726, 297910, 312558, 327680, 343281, 359370,
        375953, 393040, 410636, 428750, 447388, 466560, 486271, 506530, 527343, 548720, 570666,
        593190, 616298, 640000, 664301, 689210, 714733, 740880, 767656, 795070, 823128, 851840,
        881211, 911250, 941963, 973360, 1005446, 1038230, 1071718, 1105920, 1140841, 1176490,
        1212873, 1250000,
    ],
    "Fluctuating": [
        0, 4, 13, 32, 65, 112, 178, 276, 393, 540, 745, 967, 1230, 1591, 1957, 2457, 3046, 3732,
        4526, 5440, 6482, 7666, 9003, 10506, 12187, 14060, 16140, 18439, 20974, 23760, 26811, 30146,
        33780, 37731, 42017, 46656, 50653, 55969, 60505, 66560, 71677, 78533, 84277, 91998, 98415,
        107069, 114205, 123863, 131766, 142500, 151222, 163105, 172697, 185807, 196322, 210739,
        222231, 238036, 250562, 267840, 281456, 300293, 315059, 335544, 351520, 373744, 390991,
        415050, 433631, 459620, 479600, 507617, 529063, 559209, 582187, 614566, 639146, 673863,
        700115, 737280, 765275, 804997, 834809, 877201, 908905, 954084, 987754, 1035837, 1071552,
        1122660, 1160499, 1214753, 1254796, 1312322, 1354652, 1415577, 1460276, 1524731, 1571884,
        1640000,
    ],
}

GEN3_CHAR_MAP = {
    0x00: " ",
    0x50: "▯",
    0xA1: "0",
    0xA2: "1",
    0xA3: "2",
    0xA4: "3",
    0xA5: "4",
    0xA6: "5",
    0xA7: "6",
    0xA8: "7",
    0xA9: "8",
    0xAA: "9",
    0xAB: "!",
    0xAC: "?",
    0xAD: ".",
    0xAE: "-",
    0xAF: "・",
    0xB0: "...",
    0xB1: '"',
    0xB2: '"',
    0xB3: "'",
    0xB4: "'",
    0xB5: "♂",
    0xB6: "♀",
    0xB7: "$",
    0xB8: ",",
    0xB9: "×",
    0xBA: "/",
    0xBB: "A",
    0xBC: "B",
    0xBD: "C",
    0xBE: "D",
    0xBF: "E",
    0xC0: "F",
    0xC1: "G",
    0xC2: "H",
    0xC3: "I",
    0xC4: "J",
    0xC5: "K",
    0xC6: "L",
    0xC7: "M",
    0xC8: "N",
    0xC9: "O",
    0xCA: "P",
    0xCB: "Q",
    0xCC: "R",
    0xCD: "S",
    0xCE: "T",
    0xCF: "U",
    0xD0: "V",
    0xD1: "W",
    0xD2: "X",
    0xD3: "Y",
    0xD4: "Z",
    0xD5: "a",
    0xD6: "b",
    0xD7: "c",
    0xD8: "d",
    0xD9: "e",
    0xDA: "f",
    0xDB: "g",
    0xDC: "h",
    0xDD: "i",
    0xDE: "j",
    0xDF: "k",
    0xE0: "l",
    0xE1: "m",
    0xE2: "n",
    0xE3: "o",
    0xE4: "p",
    0xE5: "q",
    0xE6: "r",
    0xE7: "s",
    0xE8: "t",
    0xE9: "u",
    0xEA: "v",
    0xEB: "w",
    0xEC: "x",
    0xED: "y",
    0xEE: "z",
    0xFF: "",
}

REVERSE_GEN3_MAP = {value: key for key, value in GEN3_CHAR_MAP.items() if value}


@dataclass
class Sector:
    data: bytearray
    section_id: int
    checksum: int
    signature: int
    save_index: int


@dataclass
class TrainerInfo:
    name: str
    trainer_id: int
    secret_id: int


def level_to_exp(level: int, level_up_type: str) -> int:
    curve = EXPERIENCE_CURVES.get(level_up_type, EXPERIENCE_CURVES["Medium Fast"])
    if level <= 1:
        return 0
    if level >= 100:
        return curve[99]
    return curve[level - 1]


def gen3_to_utf(data: bytes, start: int, length: int) -> str:
    chars = []
    for i in range(start, min(start + length, len(data))):
        byte = data[i]
        if byte == 0xFF:
            break
        chars.append(GEN3_CHAR_MAP.get(byte, "?"))
    return "".join(chars).strip()


def utf8_to_gen3(value: str, max_length: int) -> bytes:
    result = bytearray([0xFF] * max_length)
    for i, char in enumerate(value[:max_length]):
        result[i] = REVERSE_GEN3_MAP.get(char, 0x00)
    return bytes(result)


def bytes_to_uint16_le(data: bytes, offset: int) -> int:
    return data[offset] | (data[offset + 1] << 8)


def bytes_to_uint32_le(data: bytes, offset: int) -> int:
    return data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16) | (data[offset + 3] << 24)


def uint16_to_bytes_le(value: int) -> bytes:
    return struct.pack("<H", value & 0xFFFF)


def uint32_to_bytes_le(value: int) -> bytes:
    return struct.pack("<I", value & 0xFFFFFFFF)


def get_bits(data: bytearray, offset: int, bit_offset: int, bit_length: int) -> int:
    combined = data[offset] | (data[offset + 1] << 8)
    mask = (1 << bit_length) - 1
    return (combined >> bit_offset) & mask


def set_bits(data: bytearray, offset: int, bit_offset: int, bit_length: int, value: int) -> None:
    combined = data[offset] | (data[offset + 1] << 8)
    mask = (1 << bit_length) - 1
    combined = (combined & ~(mask << bit_offset)) | ((value & mask) << bit_offset)
    data[offset] = combined & 0xFF
    data[offset + 1] = (combined >> 8) & 0xFF


def calculate_sector_checksum(data: bytes, section_id: int) -> int:
    byte_length = 0xFF0
    if section_id == 0:
        byte_length = 3884
    elif section_id == 13:
        byte_length = 2000

    checksum = 0
    for i in range(0, byte_length, 4):
        checksum = (checksum + bytes_to_uint32_le(data, i)) & 0xFFFFFFFF

    return ((checksum & 0xFFFF) + ((checksum >> 16) & 0xFFFF)) & 0xFFFF


def parse_sector(save_bytes: bytes, index: int) -> Sector:
    base = index * SECTOR_SIZE
    data = bytearray(save_bytes[base:base + SECTOR_DATA_SIZE])
    section_id = bytes_to_uint16_le(save_bytes, base + 0xFF4)
    checksum = bytes_to_uint16_le(save_bytes, base + 0xFF6)
    signature = bytes_to_uint32_le(save_bytes, base + 0xFF8)
    save_index = bytes_to_uint32_le(save_bytes, base + 0xFFC)
    return Sector(data, section_id, checksum, signature, save_index)


def parse_trainer_info(sector_zero: Sector) -> TrainerInfo:
    name = gen3_to_utf(sector_zero.data, 0x00, 7)
    trainer_id = bytes_to_uint16_le(sector_zero.data, 0x0A)
    secret_id = bytes_to_uint16_le(sector_zero.data, 0x0C)
    return TrainerInfo(name=name, trainer_id=trainer_id, secret_id=secret_id)


def build_species_lists(species_data: Dict[str, dict]) -> List[Tuple[int, dict]]:
    evo_targets: set[Tuple[int, int]] = set()
    for species in species_data.values():
        for forme in species.get("formes", []) or []:
            for evo in forme.get("evos", []) or []:
                evo_targets.add((evo.get("dexNumber"), evo.get("formeNumber", 0)))

    non_evo: Dict[int, dict] = {}
    first_stage: Dict[int, dict] = {}

    for dex_str, species in species_data.items():
        dex_num = int(dex_str)
        formes = species.get("formes", []) or []
        has_evos = any((forme.get("evos") or []) for forme in formes)
        is_target = any((dex_num, forme.get("formeNumber", 0)) in evo_targets for forme in formes) or (
            (dex_num, 0) in evo_targets
        )

        if not has_evos and not is_target:
            non_evo[dex_num] = species
        if has_evos and not is_target:
            first_stage[dex_num] = species

    combined = {**non_evo, **first_stage}
    return sorted(combined.items(), key=lambda entry: entry[1]["name"].lower())


def build_internal_index_map(mapping_data: Dict[str, int]) -> Dict[int, int]:
    internal_for_national: Dict[int, int] = {}
    for internal_str, national in mapping_data.items():
        internal_for_national.setdefault(int(national), int(internal_str))
    return internal_for_national


def choose_moves(move_ids: List[int], rng: random.Random) -> List[int]:
    if len(move_ids) >= 4:
        return rng.sample(move_ids, 4)
    return [rng.choice(move_ids) for _ in range(4)]


def serialize_pokemon(
    original: bytes,
    species: dict,
    trainer: TrainerInfo,
    internal_index: int,
    move_ids: List[int],
    rng: random.Random,
) -> bytearray:
    data = bytearray(original)
    if len(data) != POKEMON_SIZE:
        data = bytearray(POKEMON_SIZE)

    personality = bytes_to_uint32_le(data, 0x00)
    if personality == 0:
        personality = rng.getrandbits(32)
        data[0x00:0x04] = uint32_to_bytes_le(personality)

    data[0x04:0x06] = uint16_to_bytes_le(trainer.trainer_id)
    data[0x06:0x08] = uint16_to_bytes_le(trainer.secret_id)

    nickname = species["name"]
    data[0x08:0x12] = utf8_to_gen3(nickname, 10)
    data[0x14:0x1B] = utf8_to_gen3(trainer.name, 7)

    data[0x1C:0x1E] = uint16_to_bytes_le(internal_index)
    data[0x1E:0x20] = uint16_to_bytes_le(0)

    level_up_type = species.get("levelUpType", "Medium Fast")
    exp = level_to_exp(5, level_up_type)
    data[0x20:0x24] = uint32_to_bytes_le(exp)

    data[0x24] = 0  # PP Ups
    data[0x25] = 70  # friendship
    data[0x26] = 4  # Pokeball

    moves = choose_moves(move_ids, rng)
    set_bits(data, 0x27, 0, 10, moves[0])
    set_bits(data, 0x28, 2, 10, moves[1])
    set_bits(data, 0x29, 4, 10, moves[2])
    set_bits(data, 0x2A, 6, 10, moves[3])

    data[0x2C:0x32] = bytes([0, 0, 0, 0, 0, 0])

    iv_data = (
        (31 & 0x1F)
        | ((31 & 0x1F) << 5)
        | ((31 & 0x1F) << 10)
        | ((31 & 0x1F) << 15)
        | ((31 & 0x1F) << 20)
        | ((31 & 0x1F) << 25)
        | (0 << 30)
        | (1 << 31)
    )
    data[0x36:0x3A] = uint32_to_bytes_le(iv_data)

    return data


def resolve_repo_root(start: Path) -> Path:
    for parent in [start, *start.parents]:
        if (parent / "radical-red-web").exists():
            return parent
    raise FileNotFoundError("Unable to locate repo root containing radical-red-web/")


def main() -> None:
    parser = argparse.ArgumentParser(description="Populate Radical Red PC boxes with base-stage Pokemon.")
    parser.add_argument("--input", help="Path to the input .sav file.")
    parser.add_argument(
        "--output",
        default="completed_rr_single_stage_and_first_stage.sav",
        help="Path to write the updated save.",
    )
    parser.add_argument("--seed", type=int, default=1337, help="Random seed for move selection/personality.")
    args = parser.parse_args()

    script_dir = Path(__file__).resolve().parent
    repo_root = resolve_repo_root(script_dir)

    save_path = Path(args.input) if args.input else (repo_root / "completed_rr.sav")
    save_bytes = save_path.read_bytes()
    if len(save_bytes) not in SAVE_SIZES_BYTES:
        raise SystemExit(f"Unexpected save size: {len(save_bytes)} bytes")

    species_data = json.loads((repo_root / "radical-red-web/src/lib/species-data.json").read_text())
    moves_data = json.loads((repo_root / "radical-red-web/src/lib/moves-data.json").read_text())
    mapping_data = json.loads((repo_root / "radical-red-web/src/lib/species-index-mapping.json").read_text())

    move_ids = sorted(int(move_id) for move_id in moves_data.keys())
    rng = random.Random(args.seed)

    species_list = build_species_lists(species_data)

    sectors = [parse_sector(save_bytes, i) for i in range(14)]
    sectors.sort(key=lambda sector: sector.section_id)

    trainer_info = parse_trainer_info(sectors[0])

    full_sections_used = (NUM_BOXES * POKEMON_SIZE * POKEMON_PER_BOX) // 4080
    leftover_bytes = (NUM_BOXES * POKEMON_SIZE * POKEMON_PER_BOX) % 4080

    pc_data = bytearray(4080 * full_sections_used + leftover_bytes + 4)
    for index, sector in enumerate(sectors[5:5 + full_sections_used + 1]):
        start = index * 4080
        length = 4080 if index < full_sections_used else leftover_bytes + 4
        pc_data[start:start + length] = sector.data[:length]

    internal_map = build_internal_index_map(mapping_data)

    max_slots = NUM_BOXES * POKEMON_PER_BOX
    total_to_write = min(len(species_list), max_slots)

    for slot_index in range(total_to_write):
        dex_num, species = species_list[slot_index]
        dex_num = int(species.get("nationalDex", dex_num))
        internal_index = internal_map.get(dex_num, dex_num)

        offset = 4 + slot_index * POKEMON_SIZE
        original = bytes(pc_data[offset:offset + POKEMON_SIZE])
        updated = serialize_pokemon(
            original=original,
            species=species,
            trainer=trainer_info,
            internal_index=internal_index,
            move_ids=move_ids,
            rng=rng,
        )
        pc_data[offset:offset + POKEMON_SIZE] = updated

    for index, sector in enumerate(sectors[5:5 + full_sections_used + 1]):
        start = index * 4080
        length = 4080 if index < full_sections_used else leftover_bytes + 4
        sector.data[:length] = pc_data[start:start + length]
        sector.checksum = calculate_sector_checksum(sector.data, sector.section_id)

    output_bytes = bytearray(save_bytes)
    first_sector_index = sectors[0].section_id
    for index, sector in enumerate(sectors):
        physical_index = (index + 14 - first_sector_index) % 14
        base = physical_index * SECTOR_SIZE
        output_bytes[base:base + SECTOR_DATA_SIZE] = sector.data
        output_bytes[base + 0xFF4:base + 0xFF6] = uint16_to_bytes_le(sector.section_id)
        output_bytes[base + 0xFF6:base + 0xFF8] = uint16_to_bytes_le(sector.checksum)
        output_bytes[base + 0xFF8:base + 0xFFC] = uint32_to_bytes_le(sector.signature)
        output_bytes[base + 0xFFC:base + 0x1000] = uint32_to_bytes_le(sector.save_index)

    Path(args.output).write_bytes(output_bytes)
    print(f"Wrote {total_to_write} Pokemon to {args.output} (slots available: {max_slots}).")
    if len(species_list) > max_slots:
        print(f"Note: {len(species_list) - max_slots} species were omitted due to box limits.")


if __name__ == "__main__":
    main()
