use crate::{
    metadata_source::MetadataSource,
    natures::NatureMetadata,
    species::{SpeciesForm, form_metadata::BaseStats},
};

use num::integer::Roots;
use pkm_rs_types::{HyperTraining, Stats, Stats16Le, StatsPreSplit};
use std::fmt::Display;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub enum Stat {
    HP,
    Attack,
    Defense,
    SpecialAttack,
    SpecialDefense,
    Speed,
}

impl Stat {
    pub const fn abbr(self) -> &'static str {
        match self {
            Stat::HP => "HP",
            Stat::Attack => "Atk",
            Stat::Defense => "Def",
            Stat::SpecialAttack => "SpA",
            Stat::SpecialDefense => "SpD",
            Stat::Speed => "Spe",
        }
    }
}

impl Display for Stat {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(match *self {
            Stat::HP => "HP",
            Stat::Attack => "Attack",
            Stat::Defense => "Defense",
            Stat::SpecialAttack => "Special Attack",
            Stat::SpecialDefense => "Special Defense",
            Stat::Speed => "Speed",
        })
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
pub struct StatAbbr;

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[allow(clippy::missing_const_for_fn)]
impl StatAbbr {
    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "getLower"))]
    pub fn get_lower(stat: Stat) -> String {
        stat.abbr().to_lowercase()
    }

    #[cfg_attr(feature = "wasm", wasm_bindgen(js_name = "toStat"))]
    pub fn to_stat(abbr: &str) -> Option<Stat> {
        match abbr {
            "HP" => Some(Stat::HP),
            "Atk" => Some(Stat::Attack),
            "Def" => Some(Stat::Defense),
            "SpA" => Some(Stat::SpecialAttack),
            "SpD" => Some(Stat::SpecialDefense),
            "Spe" => Some(Stat::Speed),
            _ => None,
        }
    }
}

struct DeFactoIvs<I: Stats> {
    ivs: I,
    hyper_training: HyperTraining,
}

const MAX_IV: u16 = 31;

impl<I: Stats> DeFactoIvs<I> {
    fn new(ivs: I, hyper_training: Option<HyperTraining>) -> Self {
        Self {
            ivs,
            hyper_training: hyper_training.unwrap_or_default(),
        }
    }

    fn get_hp(&self) -> u16 {
        if self.hyper_training.hp {
            MAX_IV
        } else {
            self.ivs.get_hp()
        }
    }

    fn get_atk(&self) -> u16 {
        if self.hyper_training.atk {
            MAX_IV
        } else {
            self.ivs.get_atk()
        }
    }

    fn get_def(&self) -> u16 {
        if self.hyper_training.def {
            MAX_IV
        } else {
            self.ivs.get_def()
        }
    }

    fn get_spa(&self) -> u16 {
        if self.hyper_training.spa {
            MAX_IV
        } else {
            self.ivs.get_spa()
        }
    }

    fn get_spd(&self) -> u16 {
        if self.hyper_training.spd {
            MAX_IV
        } else {
            self.ivs.get_spd()
        }
    }

    fn get_spe(&self) -> u16 {
        if self.hyper_training.spe {
            MAX_IV
        } else {
            self.ivs.get_spe()
        }
    }
}

pub fn calculate_all_modern<I: Stats + Copy, E: Stats>(
    metadata_source: MetadataSource,
    species_and_form: SpeciesForm,
    ivs: &I,
    evs: &E,
    level: u8,
    nature: &'static NatureMetadata,
    hyper_training: Option<HyperTraining>,
) -> Option<Stats16Le> {
    let Some(BaseStats::Modern(stats8)) = species_and_form.get_base_stats_from(metadata_source)
    else {
        return None;
    };

    let de_facto_ivs = DeFactoIvs::new(*ivs, hyper_training);
    let base_stats = Stats16Le::from(stats8);
    Some(Stats16Le {
        hp: calculate_hp_modern(
            base_stats,
            de_facto_ivs.get_hp(),
            evs.get_hp(),
            level as u16,
        ),
        atk: calculate_stat_modern(
            base_stats.atk,
            de_facto_ivs.get_atk(),
            evs.get_atk(),
            level as u16,
            nature,
            Stat::Attack,
        ),
        def: calculate_stat_modern(
            base_stats.def,
            de_facto_ivs.get_def(),
            evs.get_def(),
            level as u16,
            nature,
            Stat::Defense,
        ),
        spa: calculate_stat_modern(
            base_stats.spa,
            de_facto_ivs.get_spa(),
            evs.get_spa(),
            level as u16,
            nature,
            Stat::SpecialAttack,
        ),
        spd: calculate_stat_modern(
            base_stats.spd,
            de_facto_ivs.get_spd(),
            evs.get_spd(),
            level as u16,
            nature,
            Stat::SpecialDefense,
        ),
        spe: calculate_stat_modern(
            base_stats.spe,
            de_facto_ivs.get_spe(),
            evs.get_spe(),
            level as u16,
            nature,
            Stat::Speed,
        ),
    })
}

pub const fn calculate_hp_modern(base_stats: Stats16Le, hp_iv: u16, hp_ev: u16, level: u16) -> u16 {
    let level_factor = 2 * base_stats.hp + hp_iv + hp_ev.div_euclid(4);
    let numerator = level_factor * level;

    (numerator / 100) + level + 10
}

pub const fn calculate_stat_modern(
    base_stat: u16,
    iv: u16,
    ev: u16,
    level: u16,
    nature: &'static NatureMetadata,
    stat: Stat,
) -> u16 {
    let level_factor = 2 * base_stat + iv + ev.div_euclid(4);
    let numerator = level_factor * level;
    let nature_multiplier = nature.multiplier_for(stat);

    (((numerator / 100) + 5) as f32 * nature_multiplier).floor() as u16
}

pub fn calculate_stats_gen2(
    species_and_form: SpeciesForm,
    dvs: &StatsPreSplit,
    evs: &StatsPreSplit,
    level: u16,
) -> Option<Stats16Le> {
    let Some(BaseStats::Modern(base)) =
        species_and_form.get_base_stats_from(MetadataSource::Crystal)
    else {
        return None;
    };
    let base = Stats16Le::from(base);

    Some(Stats16Le {
        hp: calculate_stat_gen2(base.hp, dvs.hp, evs.hp, level, Stat::HP),
        atk: calculate_stat_gen2(base.atk, dvs.atk, evs.atk, level, Stat::Attack),
        def: calculate_stat_gen2(base.def, dvs.def, evs.def, level, Stat::Defense),
        spa: calculate_stat_gen2(base.spa, dvs.spc, evs.spc, level, Stat::SpecialAttack),
        spd: calculate_stat_gen2(base.spd, dvs.spc, evs.spc, level, Stat::SpecialDefense),
        spe: calculate_stat_gen2(base.spe, dvs.spe, evs.spe, level, Stat::Speed),
    })
}

pub fn calculate_hp_gen2(base_stat: u16, dv: u16, ev: u16, level: u16, stat: Stat) -> u16 {
    let level_factor = 2 * (base_stat + dv) + ev.nth_root(2) / 4;
    let numerator = level_factor * level;
    let starting_point: u16 = if stat == Stat::HP { level + 10 } else { 5 };
    dbg!(stat, level_factor, numerator, starting_point);

    starting_point + numerator / 100
}

pub fn calculate_stat_gen2(base_stat: u16, dv: u16, ev: u16, level: u16, stat: Stat) -> u16 {
    let level_factor = 2 * (base_stat + dv) + ((ev as f32).sqrt().ceil() as u16).div_euclid(4);
    let numerator = level_factor * level;
    let starting_point: u16 = if stat == Stat::HP { level + 10 } else { 5 };
    dbg!(
        stat,
        ev.sqrt() / 4,
        2 * (base_stat + dv),
        numerator,
        numerator / 100,
        starting_point,
        starting_point + numerator / 100
    );

    starting_point + numerator / 100
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::species::SpeciesForm;
    use crate::stats::Stat;

    use pkm_rs_types::{NationalDex, Stats16Le, StatsPreSplit};

    #[test]
    fn gen12_pikachu_hp_calc() {
        let base_hp: u16 = 35;
        let hp_dv: u16 = 7;
        let hp_ev: u16 = 22850;
        let level: u16 = 81;

        let hp_stat_calculated = calculate_stat_gen2(base_hp, hp_dv, hp_ev, level, Stat::HP);

        assert_eq!(hp_stat_calculated, 189);
    }

    #[test]
    fn gen12_pikachu_stat_calc() {
        let dvs = StatsPreSplit {
            hp: 7,
            atk: 8,
            def: 13,
            spc: 9,
            spe: 5,
        };
        let evs = StatsPreSplit {
            hp: 22850,
            atk: 23140,
            def: 17280,
            spc: 19625,
            spe: 24795,
        };
        let level: u16 = 81;

        let stats_calculated = calculate_stats_gen2(
            SpeciesForm::base_form(NationalDex::Pikachu),
            &dvs,
            &evs,
            level,
        )
        .expect("Pikachu stat calc via Pokémon Crystal is not None");

        assert_eq!(
            stats_calculated,
            Stats16Le::new(189, 137, 101, 128, 112, 190)
        )
    }
}
