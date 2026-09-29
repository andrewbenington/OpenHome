use pkm_rs_types::NationalDex;

use crate::species::{FormMetadata, GetSpeciesMetadata, SpeciesForm};

pub(crate) fn try_all_forms(
    callback: impl Fn(SpeciesForm) -> Result<(), String>,
) -> Result<(), String> {
    for national_dex in NationalDex::all() {
        for form in national_dex.get_species_metadata().forms {
            callback(form.forme_ref())?;
        }
    }
    Ok(())
}

pub(crate) fn try_all_form_metadata(
    callback: impl Fn(&FormMetadata) -> Result<(), String>,
) -> Result<(), String> {
    for national_dex in NationalDex::all() {
        for form in national_dex.get_species_metadata().forms {
            callback(form)?;
        }
    }
    Ok(())
}
