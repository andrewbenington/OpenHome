use crate::pkm_trait_based_impl::item_index::ItemIndex;
use crate::pkm_trait_based_impl::nickname_string::NicknameString;
use crate::pkm_trait_based_impl::trainer_string::TrainerString;
use pkm_rs_resources::ball::Ball;
use pkm_rs_resources::items::ItemGen3;
use pkm_rs_resources::moves::MoveSlots;
use pkm_rs_types::{ContestStats, Language, OriginGame, Stats16Le};
use crate::pkm_trait_based_impl::pkm_buffer::PkmBuffer;


trait Pkm {
    fn sanity() -> u16;
    fn checksum() -> u16;
    fn held_item_index() -> Option<dyn ItemIndex>;
    fn trainer_id() -> u16;
    fn secret_id() -> u16;
    fn exp() -> u32;
    fn has_species_data() -> bool;
    fn is_fateful_encounter() -> bool;
    fn moves() -> MoveSlots;
    fn trainer_name() -> dyn TrainerString<7>;
    fn trainer_friendship() -> u8;
    fn nickname() -> dyn NicknameString<10>;
    fn met_location_index() -> u8;
    fn ball() -> Ball;
    fn met_level() -> u8;
    fn game_of_origin() -> OriginGame;
    fn language() -> Language;
    fn status_condition() -> u32;
    fn stat_level() -> u8;
    fn current_hp() -> u16;
    fn stats() -> Stats16Le;

    fn from_buffer<S: AsRef<[u8]>>(buf: &PkmBuffer<S>) -> Result<Self> {
        let mut mon = Pkm {
            encryption_constant: buf.encryption_constant(),
            sanity: buf.sanity(),
            checksum: buf.checksum(),
            species_and_form: buf.species_and_form()?,
            trainer_id: buf.trainer_id(),
            secret_id: buf.secret_id(),
            exp: buf.exp(),
            form_argument: buf.form_argument(),
            nickname: buf.nickname(),
            moves: buf.move_slots(),
            is_nicknamed: buf.is_nicknamed(),
            handler_name: buf.handler_name(),
            handler_gender: buf.handler_gender(),
            is_current_handler: buf.is_current_handler(),
            handler_friendship: buf.handler_friendship(),
            trainer_name: buf.trainer_name(),
            trainer_friendship: buf.trainer_friendship(),
            met_date: buf.met_date(),
            met_location_index: buf.met_location_index(),
            ball: buf.ball(),
            met_level: buf.met_level(),
            game_of_origin: buf.game_of_origin(),
            country: buf.country(),
            region: buf.region(),
            console_region: buf.console_region(),
            language: buf.language()?,
            ..Default::default()
        };

        mon.stat_level = mon.calculate_level();
        mon.stats = mon.calculate_stats();
        mon.current_hp = mon.stats.hp;

        if buf.is_party() {
            mon.status_condition = buf.status_condition();
            mon.form_argument_remain = buf.form_argument_remain();
            mon.form_argument_elapsed = buf.form_argument_elapsed();
        }

        Ok(mon)
    }
}
