use pkm_rs_resources;
use pkm_rs_resources::ribbons::ModernRibbon;

mod colopkm_buffer;

pub(crate) const PKM_DATA_SIZE: usize = 312;

#[cfg(test)]
const MAX_BOX_COUNT: u8 = 32;
#[cfg(test)]
const BOX_ROWS: u8 = 5;
#[cfg(test)]
const BOX_COLS: u8 = 6;
#[cfg(test)]
const BOX_SLOTS: u8 = BOX_ROWS * BOX_COLS;

const MAX_ABILITY_INDEX: u16 = 310;

const MAX_RIBBON_SV: usize = ModernRibbon::Partner as usize;

pub const TM_FLAG_BYTE_LENGTH_BASE: usize = 25;
pub const TM_FLAG_BYTE_LENGTH_DLC: usize = 13;

#[cfg(test)]
type BoxIndex = pkm_rs_types::BoundedU8<{ MAX_BOX_COUNT - 1 }>;

#[cfg(test)]
type BoxSlot = pkm_rs_types::BoundedU8<{ BOX_SLOTS - 1 }>;

#[cfg(test)]
mod test {
    use super::{BOX_SLOTS, BoxIndex, BoxSlot, MAX_BOX_COUNT};
    use crate::result::{Error, Result};

    #[test]
    fn all_boxes_valid() -> Result<()> {
        for index in 0..MAX_BOX_COUNT {
            BoxIndex::check_bound(index).or(Err(Error::BoxIndex(index)))?;
        }

        for slot in 0..BOX_SLOTS {
            BoxSlot::check_bound(slot).or(Err(Error::BoxSlot(slot)))?;
        }

        Ok(())
    }
}
