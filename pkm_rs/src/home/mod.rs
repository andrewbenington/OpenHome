//use core_data::*;
use game_data_pa8::*;
use game_data_pa9::*;
use game_data_pb7::*;
use game_data_pb8::*;
use game_data_pk8::*;
use game_data_pk9::*;

mod pkh;
pub use pkh::*;
mod core_data;
pub mod game_data_pa8;
pub mod game_data_pa9;
pub mod game_data_pb7;
pub mod game_data_pb8;
pub mod game_data_pk8;
pub mod game_data_pk9;

pub(crate) const PH4_PKM_MAX_SIZE: usize = 0x2A6;
