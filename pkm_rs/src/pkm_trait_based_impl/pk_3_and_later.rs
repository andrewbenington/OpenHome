use pkm_rs_resources::ribbons::Gen3RibbonSet;
use pkm_rs_types::{ContestStats, Ivs, MarkingsFourShapes, SimpleAbilityNumber, Stats8};
use crate::pkm_trait_based_impl::pk_2_and_later::Gen2AndLater;

pub trait Gen3AndLater : Gen2AndLater {

    fn ability_num() -> SimpleAbilityNumber;


    fn contest() -> ContestStats;
    fn evs() -> Stats8;
    fn ivs() -> Ivs;

    fn markings() -> MarkingsFourShapes;

    fn ribbons() -> Gen3RibbonSet;
}