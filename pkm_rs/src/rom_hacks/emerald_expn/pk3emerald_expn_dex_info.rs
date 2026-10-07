use serde::Serialize;
use pkm_rs_resources::species::SpeciesForm;

pub mod emerald_expn;

#[cfg(not(feature = "randomize"))]
pub trait EmeraldExpnSpeciesIndex: From<u16> + Into<u16> + Serialize + Copy {
    fn try_to_species_and_form(self) -> Result<SpeciesForm>;
    fn try_from_species_and_form(species: &SpeciesForm) -> Result<Self>;

    fn is_fakemon(&self) -> bool;
    fn plugin_identifier() -> &'static str;
}

#[cfg(feature = "randomize")]
pub trait EmeraldExpnSpeciesIndex: From<u16> + Into<u16> + Serialize + Copy + Randomize {
    fn try_to_species_and_form(self) -> Result<SpeciesForm>;
    fn try_from_species_and_form(species: &SpeciesForm) -> Result<Self>;

    fn is_fakemon(&self) -> bool;
    fn plugin_identifier() -> &'static str;
}