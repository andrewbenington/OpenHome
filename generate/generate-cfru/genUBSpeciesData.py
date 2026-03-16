# AI Slop

import json
import pathlib

BASE_DIR = pathlib.Path(__file__).resolve().parent

with open(BASE_DIR / "unbound/Species.json", "r") as f:
    species_ids = json.load(f)

with open(BASE_DIR / "unbound/BaseStats.json", "r") as f:
    species_data = json.load(f)

output_path = BASE_DIR / "unbound/SpeciesStats.json"

def get_species_data_by_number(number: int):
    key = species_ids.get(str(number))

    if key is None:
        return {"error": "Species ID not found"}

    data = species_data.get(key)

    if data is None:
        return {"error": f"No data for species {key}"}

    return {
        "speciesId": number,
        "speciesKey": key,
        "data": data
    }

all_species = {}

for num_str, species_key in species_ids.items():
    data = species_data.get(species_key)

    if data is None:
        continue

    all_species[num_str] = data

with open(output_path, "w") as f:
    json.dump(all_species, f, indent=4)

print(f"Exported {len(all_species)} species to {output_path}")