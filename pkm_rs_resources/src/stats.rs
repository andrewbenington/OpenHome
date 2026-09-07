#[cfg(feature = "wasm")]
use crate::natures::NatureIndex;
use crate::natures::NatureMetadata;
use crate::species::SpeciesForm;
use crate::species::metadata_table::BaseStats;
use crate::{metadata_source::MetadataSource, species::metadata_table::MetadataTableReader};

use pkm_rs_types::{HyperTraining, NationalDex, Stat, Stats, Stats16Le, StatsPreSplit};

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

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
}

impl<I: Stats> Stats for DeFactoIvs<I> {
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

pub fn calculate_all_modern_for_source<I: Stats, E: Stats>(
    metadata_source: MetadataSource,
    species_form: SpeciesForm,
    ivs: &I,
    evs: &E,
    level: u16,
    nature: &'static NatureMetadata,
    hyper_training: Option<HyperTraining>,
) -> Option<Stats16Le> {
    let metadata_reader = species_form.metadata_reader_for_source(metadata_source)?;
    let BaseStats::Modern(stats8) = metadata_reader.get_base_stats() else {
        return None;
    };

    let ivs = DeFactoIvs::new(ivs, hyper_training);
    let base_stats = Stats16Le::from(stats8);

    Some(Stats16Le {
        hp: calculate_modern(Stat::Hp, &base_stats, &ivs, &evs, level, nature),
        atk: calculate_modern(Stat::Attack, &base_stats, &ivs, &evs, level, nature),
        def: calculate_modern(Stat::Defense, &base_stats, &ivs, &evs, level, nature),
        spa: calculate_modern(Stat::SpAttack, &base_stats, &ivs, &evs, level, nature),
        spd: calculate_modern(Stat::SpDefense, &base_stats, &ivs, &evs, level, nature),
        spe: calculate_modern(Stat::Speed, &base_stats, &ivs, &evs, level, nature),
    })
}

pub fn calculate_all_modern<I: Stats, E: Stats>(
    metadata_reader: MetadataTableReader,
    ivs: &I,
    evs: &E,
    level: u16,
    nature: &'static NatureMetadata,
    hyper_training: Option<HyperTraining>,
) -> Option<Stats16Le> {
    let BaseStats::Modern(stats8) = metadata_reader.get_base_stats() else {
        return None;
    };

    let ivs = DeFactoIvs::new(ivs, hyper_training);
    let base_stats = Stats16Le::from(stats8);

    Some(Stats16Le {
        hp: calculate_modern(Stat::Hp, &base_stats, &ivs, &evs, level, nature),
        atk: calculate_modern(Stat::Attack, &base_stats, &ivs, &evs, level, nature),
        def: calculate_modern(Stat::Defense, &base_stats, &ivs, &evs, level, nature),
        spa: calculate_modern(Stat::SpAttack, &base_stats, &ivs, &evs, level, nature),
        spd: calculate_modern(Stat::SpDefense, &base_stats, &ivs, &evs, level, nature),
        spe: calculate_modern(Stat::Speed, &base_stats, &ivs, &evs, level, nature),
    })
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = calculateStats))]
pub fn calculate_modern_stats_wasm(
    species_form: SpeciesForm,
    ivs: &Stats16Le,
    evs: &Stats16Le,
    level: u16,
    nature: &NatureIndex, // this must be a reference or JavaScript will move the value and cause errors
    hyper_training: Option<HyperTraining>,
    metadata_source: Option<MetadataSource>,
) -> Stats16Le {
    let Some(metadata_reader) = (match metadata_source {
        Some(source) => species_form.metadata_reader_for_source(source),
        None => Some(species_form.current_metadata_reader()),
    }) else {
        return Stats16Le::default();
    };

    calculate_all_modern(
        metadata_reader,
        ivs,
        evs,
        level,
        nature.get_metadata(),
        hyper_training,
    )
    .unwrap_or_default()
}

pub const fn calculate_hp_modern(
    base_stats: &Stats16Le,
    hp_iv: u16,
    hp_ev: u16,
    level: u16,
) -> u16 {
    let level_factor = 2 * base_stats.hp + hp_iv + hp_ev.div_euclid(4);
    let numerator = level_factor * level;

    (numerator / 100) + level + 10
}

fn calculate_modern<I: Stats, E: Stats>(
    stat: Stat,
    base_stats: &Stats16Le,
    ivs: &DeFactoIvs<I>,
    evs: &E,
    level: u16,
    nature: &'static NatureMetadata,
) -> u16 {
    let base_stat = base_stats.get_stat(stat);
    let iv = ivs.get_stat(stat);
    let ev = evs.get_stat(stat);

    if stat == Stat::Hp {
        return calculate_hp_modern(base_stats, iv, ev, level);
    }

    let level_factor = 2 * base_stat + iv + ev.div_euclid(4);
    let numerator = level_factor * level;
    let nature_multiplier = nature.multiplier_for(stat);

    (((numerator / 100) + 5) as f32 * nature_multiplier).floor() as u16
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

pub fn calculate_stats_gen1(
    national_dex: NationalDex,
    dvs: &StatsPreSplit,
    evs: &StatsPreSplit,
    level: u16,
) -> Option<StatsPreSplit> {
    let BaseStats::PreSplit(base) =
        SpeciesForm::base_form(national_dex).get_base_stats_from(MetadataSource::Yellow)?
    else {
        panic!("Pokémon Yellow base stats should have a unified Special stat")
    };

    Some(StatsPreSplit {
        hp: calculate_hp_gameboy(base.hp, dvs.hp, evs.hp, level),
        atk: calculate_non_hp_gameboy(base.atk, dvs.atk, evs.atk, level),
        def: calculate_non_hp_gameboy(base.def, dvs.def, evs.def, level),
        spc: calculate_non_hp_gameboy(base.spc, dvs.spc, evs.spc, level),
        spe: calculate_non_hp_gameboy(base.spe, dvs.spe, evs.spe, level),
    })
}

pub fn calculate_stats_gen2(
    national_dex: NationalDex,
    dvs: &StatsPreSplit,
    evs: &StatsPreSplit,
    level: u16,
) -> Option<Stats16Le> {
    let BaseStats::Modern(base) =
        SpeciesForm::base_form(national_dex).get_base_stats_from(MetadataSource::Crystal)?
    else {
        panic!("Pokémon Crystal base stats should have a split Special stat")
    };
    let base = Stats16Le::from(base);

    Some(Stats16Le {
        hp: calculate_hp_gameboy(base.hp, dvs.hp, evs.hp, level),
        atk: calculate_non_hp_gameboy(base.atk, dvs.atk, evs.atk, level),
        def: calculate_non_hp_gameboy(base.def, dvs.def, evs.def, level),
        spa: calculate_non_hp_gameboy(base.spa, dvs.spc, evs.spc, level),
        spd: calculate_non_hp_gameboy(base.spd, dvs.spc, evs.spc, level),
        spe: calculate_non_hp_gameboy(base.spe, dvs.spe, evs.spe, level),
    })
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = calculateStatsGen1))]
pub fn calculate_stats_gen1_wasm(
    national_dex: u16,
    dvs: &StatsPreSplit,
    evs: &StatsPreSplit,
    level: u16,
) -> StatsPreSplit {
    let Ok(national_dex) = NationalDex::try_from(national_dex) else {
        return Default::default();
    };
    calculate_stats_gen1(national_dex, dvs, evs, level).unwrap_or_default()
}

#[cfg_attr(feature = "wasm", wasm_bindgen(js_name = calculateStatsGen2))]
pub fn calculate_stats_gen2_wasm(
    national_dex: u16,
    dvs: &StatsPreSplit,
    evs: &StatsPreSplit,
    level: u16,
) -> Stats16Le {
    let Ok(national_dex) = NationalDex::try_from(national_dex) else {
        return Default::default();
    };
    calculate_stats_gen2(national_dex, dvs, evs, level).unwrap_or_default()
}

#[cfg(test)]
mod tests {
    use super::*;

    use pkm_rs_types::{NationalDex, Stats16Le, StatsPreSplit};

    #[test]
    fn gen12_pikachu_hp_calc() {
        let base_hp: u16 = 35;
        let hp_dv: u16 = 7;
        let hp_ev: u16 = 22850;
        let level: u16 = 81;

        let hp_stat_calculated = calculate_hp_gameboy(base_hp, hp_dv, hp_ev, level);

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

        let stats_calculated = calculate_stats_gen2(NationalDex::Pikachu, &dvs, &evs, level)
            .expect("Pikachu stat calc via Pokémon Crystal is not None");

        assert_eq!(
            stats_calculated,
            Stats16Le::new(189, 137, 101, 128, 112, 190)
        )
    }
}
