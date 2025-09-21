import json
from pathlib import Path

with open(r".\pkm_rs\src\pkm\plugins\cfru\conversion\scripts\species_map.json", "r", encoding="utf-8") as f:
    forward_map = json.load(f)

def make_reverse_map(forward):
    reverse = {}
    for game_index, entry in forward.items():
        if entry is None:
            continue
        if entry["NationalDexIndex"] == -1:
            continue

        key = f"{entry['NationalDexIndex']}_{entry['FormIndex']}"
        reverse.setdefault(key, game_index)

    return reverse

reverse_map = make_reverse_map(forward_map)

out_file = Path(r".\pkm_rs\src\pkm\plugins\cfru\conversion\reverse_species.rs")

with out_file.open("w", encoding="utf-8") as f:
    # f.write("use phf::phf_map;\n\n")
    f.write(
        "pub static NATIONAL_TO_GAME_MAP: phf::Map<&'static str, &'static i16> = phf_map! {\n"
    )
    for k, v in sorted(reverse_map.items()):
        f.write(f'    "{k}" => {v},\n')
    f.write("};\n")
