use pkm_rs_types::{Stats, Stats16Le};

use crate::{natures::NatureMetadata, species::SpeciesAndForme, stats::Stat};

pub fn calculate_stats_modern<I: Stats, E: Stats>(
    species_and_forme: SpeciesAndForme,
    ivs: &I,
    evs: &E,
    level: u8,
    nature: &'static NatureMetadata,
) -> Stats16Le {
    let base_stats: Stats16Le = species_and_forme.get_forme_metadata().base_stats;
    Stats16Le {
        hp: calculate_hp_modern(base_stats, ivs, evs, level as u16),
        atk: calculate_stat_modern(
            base_stats.atk,
            ivs.get_atk(),
            evs.get_atk(),
            level as u16,
            nature,
            Stat::Attack,
        ),
        def: calculate_stat_modern(
            base_stats.def,
            ivs.get_def(),
            evs.get_def(),
            level as u16,
            nature,
            Stat::Defense,
        ),
        spa: calculate_stat_modern(
            base_stats.spa,
            ivs.get_spa(),
            evs.get_spa(),
            level as u16,
            nature,
            Stat::SpecialAttack,
        ),
        spd: calculate_stat_modern(
            base_stats.spd,
            ivs.get_spd(),
            evs.get_spd(),
            level as u16,
            nature,
            Stat::SpecialDefense,
        ),
        spe: calculate_stat_modern(
            base_stats.spe,
            ivs.get_spe(),
            evs.get_spe(),
            level as u16,
            nature,
            Stat::Speed,
        ),
    }
}

pub fn calculate_hp_modern<I: Stats, E: Stats>(
    base_stats: Stats16Le,
    ivs: &I,
    evs: &E,
    level: u16,
) -> u16 {
    let level_factor = 2 * base_stats.hp + ivs.get_hp() + evs.get_hp().div_euclid(4);
    let numerator = level_factor * level;

    (numerator / 100) + level + 10
}

pub fn calculate_stat_modern(
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

    (((numerator / 100) + 5) as f32 * nature_multiplier).ceil() as u16
}
