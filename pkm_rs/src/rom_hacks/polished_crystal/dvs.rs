use std::fmt::Display;
use serde::{Deserialize, Serialize};
use tsify::Tsify;
use wasm_bindgen::prelude::wasm_bindgen;
use pkm_rs_resources::metadata_source::MetadataSource;
use pkm_rs_resources::natures::NatureMetadata;
use pkm_rs_resources::species::metadata_table::BaseStats;
use pkm_rs_resources::species::SpeciesForm;
use pkm_rs_types::{form, HyperTraining, Ivs, Stats, Stats16Le, Stats8, StatsPreSplit};
use pkm_rs_types::randomize::Randomize;

#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
pub struct PolishedCrystalDvs {
  pub hp: u16,
  pub atk: u16,
  pub def: u16,
  pub spa : u16,
  pub spd : u16,
  pub spe: u16,
}


impl PolishedCrystalDvs {
  pub const fn zero() -> Self {
    Self { hp: 0, atk : 0, def : 0, spa : 0, spd : 0, spe : 0 }
  }

  pub const fn get_hp(&self) -> u16 {
    ((self.get_atk() & 1) << 3)
      | ((self.get_def() & 1) << 2)
      | ((self.get_spe() & 1) << 1)
      | (self.get_spc() & 1)
  }

  pub const fn get_atk(&self) -> u16 {
    (self.0 >> 12) & 0x0f
  }

  pub const fn get_def(&self) -> u16 {
    (self.0 >> 8) & 0x0f
  }

  pub const fn get_spe(&self) -> u16 {
    (self.0 >> 4) & 0x0f
  }

  pub const fn get_spc(&self) -> u16 {
    self.0 & 0x0f
  }

  pub const fn set_all(&mut self, atk: u16, def: u16, spe: u16, spc: u16) {
    self.0 = (atk & 0x0f) << 12 | (def & 0x0f) << 8 | (spe & 0x0f) << 4 | (spc & 0x0f)
  }

  pub const fn from_all(atk: u16, def: u16, spe: u16, spc: u16) -> Self {
    let mut dvs = self::zero();
    dvs.set_all(atk, def, spe, spc);
    dvs
  }

  pub const fn from_bytes(bytes: &[u8; 2]) -> Self {
    Self(u16::from_be_bytes(*bytes))
  }

  pub const fn to_bytes(&self) -> [u8; 2] {
    self.0.to_be_bytes()
  }

  pub fn from_ivs(ivs: &Ivs, is_shiny: bool, unown_letter: Option<u16>) -> Self {
    let dvs = if is_shiny {
      let mut atk_dv = (ivs.get_atk() - 1).div_ceil(2);

      if (atk_dv & 0b11) == 0b01 {
        atk_dv += 1
      } else if atk_dv.is_multiple_of(4) {
        atk_dv += 2
      }
      let hp_dv = (atk_dv & 1) << 3;

      PolishedCrystalDvs::from(StatsPreSplit {
        hp: hp_dv,
        atk: atk_dv,
        def: 10,
        spc: 10,
        spe: 10,
      })
    } else {
      PolishedCrystalDvs::from(StatsPreSplit {
        hp: iv_to_dv(ivs.get_hp()),
        atk: iv_to_dv(ivs.get_atk()),
        def: iv_to_dv(ivs.get_def()),
        spc: iv_to_dv(ivs.get_spa().midpoint(ivs.get_spd())),
        spe: iv_to_dv(ivs.get_spe()),
      })
    };

    if let Some(letter) = unown_letter
      && (!is_shiny || matches!(letter, form::UNOWN_I | form::UNOWN_V))
    {
      dvs.make_unown_letter_if_possible(letter, is_shiny)
    } else {
      dvs.make_not_shiny();
      dvs
    }
  }

  pub const fn shiny(&self) -> bool {
    self.get_def() == 10
      && self.get_spe() == 10
      && self.get_spc() == 10
      && (self.get_atk() & 0b10 == 0b10) // shiny values are 2, 3, 6, 7, 10, 11, 14 and 15, AKA all values with the second bit set <= 15
  }

  const fn make_shiny(self) -> Self {
    let mut atk = self.get_atk().saturating_sub(1).div_ceil(2);
    if atk & 0b11 == 0b01 {
      atk += 1;
    } else if atk.is_multiple_of(4) {
      atk += 2
    }

    Self::from_all(atk, 10, 10, 10)
  }

  const fn make_not_shiny(self) -> Self {
    if self.shiny() {
      // change the special DV to be 11 instead of the current value of 10,
      // ensuring these DVs will not be shiny
      Self::from_all(self.get_atk(), self.get_def(), self.get_spe(), 11)
    } else {
      self
    }
  }

  pub const fn unown_letter(&self) -> u16 {
    let iv_combination_val = (u2_offset_one_bit(self.get_atk()) << 6)
      + (u2_offset_one_bit(self.get_def()) << 4)
      + (u2_offset_one_bit(self.get_spe()) << 2)
      + u2_offset_one_bit(self.get_spc());
    iv_combination_val / 10
  }

  const fn make_unown_letter_if_possible(&self, letter_index: u16, is_shiny: bool) -> Self {
    let letter_bits = letter_index * 10;
    let atk = (self.get_atk() & 0b1001) | (((letter_bits >> 6) & 0b11) << 1);
    let def = (self.get_def() & 0b1001) | (((letter_bits >> 4) & 0b11) << 1);
    let spe = (self.get_spe() & 0b1001) | (((letter_bits >> 2) & 0b11) << 1);
    let spc = (self.get_spc() & 0b1001) | ((letter_bits & 0b11) << 1);

    let dvs = Self::from_all(atk, def, spe, spc);
    if is_shiny {
      dvs.make_shiny()
    } else if dvs.shiny() {
      dvs.make_not_shiny()
    } else {
      dvs
    }
  }
}

const fn u2_offset_one_bit(value: u16) -> u16 {
  arbitrary_int::u2::extract_u16(value, 1).value() as u16
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
#[allow(clippy::missing_const_for_fn)]
impl PolishedCrystalDvs {
  #[wasm_bindgen(getter = hp)]
  pub fn get_hp_wasm(&self) -> u16 {
    self.get_hp()
  }

  #[wasm_bindgen(getter = atk)]
  pub fn get_atk_wasm(&self) -> u16 {
    self.get_atk()
  }

  #[wasm_bindgen(getter = def)]
  pub fn get_def_wasm(&self) -> u16 {
    self.get_def()
  }

  #[wasm_bindgen(getter = spe)]
  pub fn get_spe_wasm(&self) -> u16 {
    self.get_spe()
  }

  #[wasm_bindgen(getter = spc)]
  pub fn get_spc_wasm(&self) -> u16 {
    self.get_spc()
  }
}

impl From<StatsPreSplit> for PolishedCrystalDvs {
  fn from(value: StatsPreSplit) -> Self {
    Self::from_all(value.atk, value.def, value.spe, value.spc)
  }
}

impl From<PolishedCrystalDvs> for StatsPreSplit {
  fn from(value: PolishedCrystalDvs) -> Self {
    Self {
      hp: value.get_hp(),
      atk: value.get_atk(),
      def: value.get_def(),
      spc: value.get_spc(),
      spe: value.get_spe(),
    }
  }
}

impl Display for PolishedCrystalDvs {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(
      f,
      "PolishedCrystalDvs(hp: {}, atk: {}, def: {}, spc: {}, spe: {})",
      self.get_hp(),
      self.get_atk(),
      self.get_def(),
      self.get_spc(),
      self.get_spe()
    )
  }
}

#[cfg(feature = "randomize")]
impl Randomize for PolishedCrystalDvs {
  fn randomized<R: rand::prelude::Rng>(rng: &mut R) -> Self {
    use rand::RngExt;

    Self::from_all(
      rng.random_range(0..=DV_MAX),
      rng.random_range(0..=DV_MAX),
      rng.random_range(0..=DV_MAX),
      rng.random_range(0..=DV_MAX),
    )
  }
}

#[cfg(test)]
const IV_MAX: u16 = 31;
#[cfg(any(test, feature = "randomize"))]
const DV_MAX: u16 = 15;

const fn iv_to_dv(iv: u16) -> u16 {
  iv.saturating_sub(1).div_ceil(2)
}

/// Converts a 0-15 DV value to a 0-31 IV value the same way Pokémon GO mons are treated,
/// by multiplying by two and adding 1. This way a max DV corresponds to a max IV, with the
/// side effect of the minimum possible IV from a DV being 1.
#[cfg(test)]
const fn dv_to_iv(dv: u16) -> u16 {
  match dv {
    0..=DV_MAX => (dv * 2) + 1,
    _ => 0,
  }
}

pub fn calculate_polished_crystal_stats(
  metadata_source: MetadataSource,
  species:SpeciesForm,
  dvs: &PolishedCrystalDvs,
  evs: &Stats8,
  level: u16,
  nature: &NatureMetadata,
  hyper_training: Option<HyperTraining>,
) -> Option<Stats16Le> {
  let BaseStats::Modern(base) =
    SpeciesForm::base_form(species.get_ndex()).get_base_stats_from(MetadataSource::Crystal)?
  else {
    panic!("Pokémon Crystal base stats should have a split Special stat")
  };
  let base = Stats16Le::from(base);

  Some(Stats16Le {
    hp: calculate_hp_gameboy(base.hp, dvs.hp, evs.hp as u16, level),
    atk: calculate_non_hp_gameboy(base.atk, dvs.atk, evs.atk as u16, level),
    def: calculate_non_hp_gameboy(base.def, dvs.def, evs.def as u16, level),
    spa: calculate_non_hp_gameboy(base.spa, dvs.spa, evs.spa as u16, level),
    spd: calculate_non_hp_gameboy(base.spd, dvs.spd, evs.spd as u16, level),
    spe: calculate_non_hp_gameboy(base.spe, dvs.spe, evs.spe as u16, level),
  })
}

fn calculate_hp_gameboy(base_stat: u16, dv: u16, ev: u16, level: u16) -> u16 {
  calculate_stat_gameboy(base_stat, dv, ev, level, true)
}

fn calculate_non_hp_gameboy(base_stat: u16, dv: u16, ev: u16, level: u16) -> u16 {
  calculate_stat_gameboy(base_stat, dv, ev, level, false)
}

fn calculate_stat_gameboy(base_stat: u16, dv: u16, ev: u16, level: u16, is_hp: bool) -> u16 {
  let level_factor = 2 * (base_stat + dv) + ((ev as f32).sqrt().ceil() as u16).div_euclid(4);
  let numerator = level_factor * level;
  let starting_point: u16 = if is_hp { level + 10 } else { 5 };

  starting_point + numerator / 100
}
