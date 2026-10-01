use crate::ohpkm::v2::OhpkmSectionTag;
use crate::rom_hacks::cobblemon::conversion::ball::ball_map::CobblemonBall;
use crate::util;

use pkm_rs_resources::moves::MoveIndex;
use pkm_rs_types::{Ivs, TeraType};

#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct CobblemonData {
    pub is_tradeable: bool,
    pub held_item_visible: bool,
    pub trainer_is_player: bool,
    pub trainer_uuid: MinecraftPlayerUUID,
    pub cobblemon_ball: CobblemonBall,
    //pub cobblemon_marks: ,
    pub cobblemon_hyper_training: Ivs,
    pub ride_boosts: Vec<u8>,
}

impl DataSection for CobblemonData {
    type TagType = OhpkmSectionTag;
    const TAG: Self::TagType = OhpkmSectionTag::Cobblemon;

    type ErrorType = Error;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::ensure_buffer_size(bytes);

        Ok(Self {
            is_tradeable: util::get_flag(&mut bytes, 0, 0),
            held_item_visible: util::get_flag(&mut bytes, 0, 1),
            trainer_is_player: util::get_flag(&mut bytes, 0, 2),
            trainer_uuid: bytes[1..5].try_into().unwrap(),
            cobblemon_ball: CobblemonBall::from(bytes[5]),
            // cobblemon_marks: CobblemonRibbonSet<10>,
            cobblemon_hyper_training: Ivs::from_30_bits(bytes[6..11].try_into().unwrap()),
            ride_boosts: bytes[11..16].try_into().unwrap(),
        })
    }

    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = [0u8; 40]; // TODO: determine final size

        util::set_flag(&mut bytes, 0, 0, self.is_tradeable);
        util::set_flag(&mut bytes, 0, 1, self.held_item_visible);
        util::set_flag(&mut bytes, 0, 2, self.trainer_is_player);
        bytes[1..5].copy_from_slice(&self.trainer_uuid.as_slice());
        bytes[1] = self.cobblemon_ball as u8;
        // TODO: cobblemon_marks
        self.cobblemon_hyper_training.write_30_bits(&mut bytes, 2);
        bytes[6..11].copy_from_slice(&self.ride_boosts.as_slice());

        bytes.to_vec()
    }

    //fn is_empty(&self) -> bool {}
}
