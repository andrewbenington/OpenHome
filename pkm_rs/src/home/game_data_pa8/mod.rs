pub use pa8::HomePa8Data;
use pa8_buffer::PkhPa8Buffer;

mod pa8;
mod pa8_buffer;

pub(crate) const HOME_PA8_DATA_SIZE: usize = 0x40;
pub const MOVE_FLAG_BYTE_LENGTH: usize = 8;
