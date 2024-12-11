from species import unbound_species, rr_species, rr_species_list

def extract_constants(content: str) -> tuple[set[str], dict[str, str]]:
    mapping: dict[str, str] = {}
    constants: set[str] = set()
    for line in content.splitlines():
        if line.startswith("#define SPECIES_"):
            parts = line.split()
            if len(parts) > 1:
                constants.add(parts[1])
            if len(parts) > 2:
                # print(parts)
                mapping[parts[1]] = parts[2]
    return constants, mapping

ub_constants, ub_mapping = extract_constants(unbound_species)
rr_constants, rr_mapping = extract_constants(rr_species)

missing_constants = ub_constants - rr_constants

# print("Constants missing in the modified file:")
# for constant in sorted(missing_constants):
#     print(constant)

new_rr_species_list = []

for species in rr_mapping.keys():
    if species in ub_mapping:
        print(species)
        new_rr_species_list.append(ub_mapping[species])
    elif species not in rr_constants:
        print(species)
        new_rr_species_list.append(species)  # Keep if not in rr_species


print("Filtered and updated rr_species_list:")
print(new_rr_species_list[-100:])

rr_mapping_inverse = {v: k for k, v in rr_mapping.items()}
        
        