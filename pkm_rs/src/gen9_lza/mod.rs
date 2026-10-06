use pkm_rs_resources::{
    moves::{MoveIndex, lza_plus},
    species::SpeciesForm,
};
use pkm_rs_types::FlagSet;

pub const LZA_BASE_TM_BYTES: usize = 25;
pub const LZA_DLC_TM_BYTES: usize = 13;
pub const LZA_PLUS_MOVES_0XD6_BYTES: usize = 33;
pub const LZA_PLUS_MOVES_0X94_BYTES: usize = 12;

#[cfg(feature = "wasm")]
use arrayref::array_ref;
#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

#[cfg_attr(feature = "randomize", derive(Randomize))]
#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Default, serde::Serialize, Clone, Copy, PartialEq, Eq)]
pub struct PlusMoveFlags {
    block_0xd6: FlagSet<LZA_PLUS_MOVES_0XD6_BYTES>,
    block_0x94: FlagSet<LZA_PLUS_MOVES_0X94_BYTES>,
}

impl PlusMoveFlags {
    pub const fn from_byte_blocks(
        block_0xd6: &[u8; LZA_PLUS_MOVES_0XD6_BYTES],
        block_0x94: &[u8; LZA_PLUS_MOVES_0X94_BYTES],
    ) -> Self {
        Self {
            block_0xd6: FlagSet::from_bytes(*block_0xd6),
            block_0x94: FlagSet::from_bytes(*block_0x94),
        }
    }

    pub fn add_move_id(&mut self, move_id: u16) {
        if let Some(block_0xd6_index) = lza_plus::plus_move_index_by_move_id_block_0xd6(move_id) {
            self.block_0xd6.set_flag(block_0xd6_index, true);
        } else if let Some(block_0x94_index) =
            lza_plus::plus_move_index_by_move_id_block_0x94(move_id)
        {
            self.block_0x94.set_flag(block_0x94_index, true);
        }
    }

    pub fn add_move_ids(&mut self, move_ids: impl IntoIterator<Item = u16>) {
        for move_id in move_ids {
            self.add_move_id(move_id);
        }
    }

    pub fn add_all_for_species_at_level(
        &mut self,
        species_form: SpeciesForm,
        level: u8,
    ) -> &mut Self {
        let Some(plus_move_data) = species_form.get_plus_moves_lza() else {
            return self;
        };

        self.add_move_ids(
            plus_move_data
                .all_moves()
                .iter()
                .filter_map(|learnset_move| {
                    if level >= learnset_move.get_level() {
                        Some(learnset_move.move_id_raw())
                    } else {
                        None
                    }
                }),
        );

        self
    }

    pub fn all_for_species_at_level(species_form: SpeciesForm, level: u8) -> Self {
        *Self::default().add_all_for_species_at_level(species_form, level)
    }

    pub fn add_all_from(&mut self, other: &PlusMoveFlags) {
        self.block_0xd6.add_all_from(&other.block_0xd6);
        self.block_0x94.add_all_from(&other.block_0x94);
    }

    pub fn contains_all_from(&mut self, other: &PlusMoveFlags) -> bool {
        self.block_0xd6.is_superset_of(&other.block_0xd6)
            && self.block_0x94.is_superset_of(&other.block_0x94)
    }

    pub fn is_plus_move(&self, move_id: u16) -> bool {
        if let Some(block_0xd6_index) = lza_plus::plus_move_index_by_move_id_block_0xd6(move_id) {
            self.block_0xd6.get_flag(block_0xd6_index)
        } else if let Some(block_0x94_index) =
            lza_plus::plus_move_index_by_move_id_block_0x94(move_id)
        {
            self.block_0x94.get_flag(block_0x94_index)
        } else {
            false
        }
    }

    pub fn get_move_ids(&self) -> Vec<MoveIndex> {
        self.block_0xd6
            .get_flags()
            .into_iter()
            .filter_map(lza_plus::move_id_by_lza_plus_move_index_block_0xd6)
            .chain(
                self.block_0x94
                    .get_flags()
                    .into_iter()
                    .filter_map(lza_plus::move_id_by_plus_move_index_block_0x94),
            )
            .collect()
    }

    pub const fn to_bytes(
        &self,
    ) -> (
        [u8; LZA_PLUS_MOVES_0XD6_BYTES],
        [u8; LZA_PLUS_MOVES_0X94_BYTES],
    ) {
        (self.block_0xd6.to_bytes(), self.block_0x94.to_bytes())
    }

    pub fn is_empty(&self) -> bool {
        self.block_0xd6.is_empty() && self.block_0x94.is_empty()
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
#[allow(clippy::missing_const_for_fn)]
impl PlusMoveFlags {
    #[wasm_bindgen(js_name = fromByteBlocks)]
    pub fn from_byte_blocks_wasm(block_0xd6: Vec<u8>, block_0x94: Vec<u8>) -> Self {
        Self::from_byte_blocks(
            array_ref![block_0xd6, 0, LZA_PLUS_MOVES_0XD6_BYTES],
            array_ref![block_0x94, 0, LZA_PLUS_MOVES_0X94_BYTES],
        )
    }

    #[wasm_bindgen(js_name = getMoveIds)]
    pub fn get_move_ids_wasm(&self) -> Vec<u16> {
        self.get_move_ids()
            .into_iter()
            .filter_map(|id| id.to_raw())
            .collect()
    }

    #[wasm_bindgen(js_name = addMoveIds)]
    pub fn add_move_ids_wasm(&mut self, move_ids: Vec<u16>) {
        self.add_move_ids(move_ids)
    }

    #[wasm_bindgen(js_name = empty)]
    pub fn empty_wasm() -> Self {
        Self::default()
    }

    #[wasm_bindgen(js_name = clone)]
    pub fn clone_wasm(&self) -> Self {
        *self
    }

    #[wasm_bindgen(js_name = toBlock0xD6Bytes)]
    pub fn to_block_0xd6_bytes_wasm(&self) -> Vec<u8> {
        self.block_0xd6.to_bytes().to_vec()
    }

    #[wasm_bindgen(js_name = toBlock0xD6Flags)]
    pub fn to_block_0xd6_flags_wasm(&self) -> Vec<usize> {
        self.block_0xd6.get_flags()
    }

    #[wasm_bindgen(js_name = toBlock0x94Bytes)]
    pub fn to_block_0x94_bytes_wasm(&self) -> Vec<u8> {
        self.block_0x94.to_bytes().to_vec()
    }

    #[wasm_bindgen(js_name = toBlock0x94Flags)]
    pub fn to_block_0x94_flags_wasm(&self) -> Vec<usize> {
        self.block_0x94.get_flags().into_iter().collect()
    }

    #[wasm_bindgen(js_name = addAllFrom)]
    pub fn add_all_from_wasm(&mut self, other: &PlusMoveFlags) {
        self.add_all_from(other);
    }

    #[wasm_bindgen(js_name = withAllForSpeciesAtLevel)]
    pub fn with_all_for_species_at_level(&self, species_form: SpeciesForm, level: u8) -> Self {
        let mut copied = *self;
        copied.add_all_for_species_at_level(species_form, level);
        copied
    }

    #[wasm_bindgen(js_name = containsAllFrom)]
    pub fn contains_all_from_wasm(&mut self, other: &PlusMoveFlags) -> bool {
        self.contains_all_from(other)
    }

    #[wasm_bindgen(js_name = equals)]
    pub fn equals_wasm(&self, other: &PlusMoveFlags) -> bool {
        self == other
    }
}

#[cfg(test)]
mod tests {
    use pkm_rs_resources::species::BaseForm;
    use pkm_rs_types::NationalDex;

    const GRENINJA_PLUS_MOVES: &[u16] = &[
        594, 33, 45, 55, 98, 122, 61, 108, 332, 425, 164, 400, 340, 104, 56,
    ];

    #[test]
    fn greninja_plus_moves_are_expected() {
        let plus_moves = NationalDex::Greninja
            .base_form()
            .get_plus_moves_lza()
            .expect("Greninja has LZA plus move data");

        assert_eq!(
            GRENINJA_PLUS_MOVES,
            &plus_moves
                .all_moves()
                .iter()
                .map(|m| m.move_id_raw())
                .collect::<Vec<_>>()
        );
    }
}
