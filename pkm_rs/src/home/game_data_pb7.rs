use pkm_rs_resources::abilities::AbilityIndexWasm;
use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::moves::{MoveIndex, MoveSlots};
use pkm_rs_types::{AbilityNumber, Pokerus, Stats8};
use serde::Serialize;

#[derive(Debug, Serialize, Clone, Copy)]
pub struct HomePb7Data {
    pub avs: Stats8,
    pub resort_event_status: u8,
    pub moves: MoveSlots,
    pub relearn_moves: [MoveIndex; 4],
    pub height_absolute: f32,
    pub weight_absolute: f32,
    pub spirit: u8,
    pub mood: u8,
    pub fullness: u8,
    //pub rank: u8,
    pub received_year: u8,
    pub received_month: u8,
    pub received_day: u8,
    pub received_hour: u8,
    pub received_minute: u8,
    pub received_second: u8,
    pub enjoyment: u8,
    //pub geo_padding: u32,
    pub ball: Ball,
    pub egg_location_index: u16,
    pub met_location_index: u16,
    pub pokerus: Pokerus,
    pub ability: AbilityIndexWasm,
    pub ability_num: AbilityNumber,
}
