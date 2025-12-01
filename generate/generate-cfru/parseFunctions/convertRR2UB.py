#type: ignore
"""
Convert the RR species list to the UB species list.
"""
from species import unbound_species, rr_species, rr_species_list

def rearrange(dict_1, dict_2, list_l):

    max_index = max(dict_2.values())
    list_R = ["."] * (max_index + 1)

    for key, index in dict_2.items():
        if key in dict_1:
            list_R[index] = list_l[dict_1[key]]
        else:
            list_R[index] = key

    return list_R

dict_1 = {"a": 0, "b": 1, "c": 2, "e": 4}
list_l = ["L0", "L1", "L2", "L4", "L5"]
dict_2 = {"b": 0, "c": 2, "d": 5, "h": 4}
print(rearrange(dict_1, dict_2, list_l))

def extract_constants(content: str) -> tuple[set[str], dict[str, str]]:
    mapping: dict[str, str] = {}
    for line in content.splitlines():
        if line.startswith("#define SPECIES_"):
            parts = line.split()
            if len(parts) > 2:
                mapping[parts[1]] = int(parts[2], 16)
    return mapping

ub_mapping = extract_constants(unbound_species)
rr_mapping = extract_constants(rr_species)

ub_species = rearrange(rr_mapping, ub_mapping, rr_species_list)

with open('./src/types/SAVTypes/unbound/ub_species.txt', 'w') as f:
    for species in ub_species:
        f.write(f"{species}\n")
