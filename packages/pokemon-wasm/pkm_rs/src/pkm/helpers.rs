use crate::resources::{FormeMetadata, SpeciesMetadata, ALL_SPECIES};
pub const fn get_species_metadata(national_dex: usize) -> Option<&'static SpeciesMetadata> {
    if national_dex >= ALL_SPECIES.len() {
        return None;
    }

    Some(&ALL_SPECIES[national_dex])
}

pub const fn get_forme_metadata(
    national_dex: usize,
    forme_index: usize,
) -> Option<&'static FormeMetadata> {
    match get_species_metadata(national_dex) {
        None => None,
        Some(species) => species.get_forme(forme_index),
    }
}
