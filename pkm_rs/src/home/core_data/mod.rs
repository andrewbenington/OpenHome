use pkm_rs_resources::ribbons::ModernRibbon;

use core_data_buffer::PkhCoreBuffer;
pub use core_data_struct::HomeCoreData;

mod core_data_buffer;
mod core_data_struct;

pub(crate) const HOME_CORE_DATA_SIZE: usize = 0xC4;
const MAX_RIBBON_HOME: usize = ModernRibbon::Partner as usize;
