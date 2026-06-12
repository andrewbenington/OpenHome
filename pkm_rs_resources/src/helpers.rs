use pkm_rs_types::{HyperTraining, Stats, Stats16Le};

use crate::{
    metadata_source::MetadataSource,
    natures::NatureMetadata,
    species::{SpeciesAndForm, form_metadata::BaseStats},
    stats::Stat,
};

struct DeFactoIvs<I: Stats> {
    ivs: I,
    hyper_training: HyperTraining,
}

impl<I: Stats> DeFactoIvs<I> {
    fn new(ivs: I, hyper_training: Option<HyperTraining>) -> Self {
        Self {
            ivs,
            hyper_training: hyper_training.unwrap_or_default(),
        }
    }

    fn get_hp(&self) -> u16 {
        if self.hyper_training.hp {
            31
        } else {
            self.ivs.get_hp()
        }
    }

    fn get_atk(&self) -> u16 {
        if self.hyper_training.atk {
            31
        } else {
            self.ivs.get_atk()
        }
    }

    fn get_def(&self) -> u16 {
        if self.hyper_training.def {
            31
        } else {
            self.ivs.get_def()
        }
    }

    fn get_spa(&self) -> u16 {
        if self.hyper_training.spa {
            31
        } else {
            self.ivs.get_spa()
        }
    }

    fn get_spd(&self) -> u16 {
        if self.hyper_training.spd {
            31
        } else {
            self.ivs.get_spd()
        }
    }

    fn get_spe(&self) -> u16 {
        if self.hyper_training.spe {
            31
        } else {
            self.ivs.get_spe()
        }
    }
}

pub fn calculate_stats_modern<I: Stats + Copy, E: Stats>(
    metadata_source: MetadataSource,
    species_and_form: SpeciesAndForm,
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
