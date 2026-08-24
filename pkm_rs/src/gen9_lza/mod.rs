use pkm_rs_resources::{
    moves::{MoveIndex, lza_plus},
    species::SpeciesForm,
};
use pkm_rs_types::FlagSet;

pub const LZA_BASE_TM_BYTES: usize = 25;
pub const LZA_DLC_TM_BYTES: usize = 13;
pub const LZA_PLUS_MOVES_BLOCK_C_BYTES: usize = 33;
pub const LZA_PLUS_MOVES_BLOCK_B_BYTES: usize = 12;

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
    block_c: FlagSet<LZA_PLUS_MOVES_BLOCK_C_BYTES>,
    block_b: FlagSet<LZA_PLUS_MOVES_BLOCK_B_BYTES>,
}

impl PlusMoveFlags {
    pub const fn from_byte_blocks(
        block_c: &[u8; LZA_PLUS_MOVES_BLOCK_C_BYTES],
        block_b: &[u8; LZA_PLUS_MOVES_BLOCK_B_BYTES],
    ) -> Self {
        Self {
            block_c: FlagSet::from_bytes(*block_c),
            block_b: FlagSet::from_bytes(*block_b),
        }
    }

    pub fn add_move_id(&mut self, move_id: u16) {
        if let Some(block_c_index) = lza_plus::plus_move_index_by_move_id_block_c(move_id) {
            self.block_c.set_flag(block_c_index, true);
        } else if let Some(block_b_index) = lza_plus::plus_move_index_by_move_id_block_b(move_id) {
            self.block_b.set_flag(block_b_index, true);
        }
    }

    pub fn add_move_ids(&mut self, move_ids: impl IntoIterator<Item = u16>) {
        for move_id in move_ids {
            self.add_move_id(move_id);
        }
    }

    pub fn add_all_for_species_at_level(&mut self, species_form: SpeciesForm, level: u8) {
        let Some(plus_move_data) = species_form.get_plus_moves_lza() else {
            return;
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
    }

    pub fn add_all_from(&mut self, other: &PlusMoveFlags) {
        self.block_c.add_all_from(&other.block_c);
        self.block_b.add_all_from(&other.block_b);
    }

    pub fn contains_all_from(&mut self, other: &PlusMoveFlags) -> bool {
        self.block_c.is_superset_of(&other.block_c) && self.block_b.is_superset_of(&other.block_b)
    }

    pub fn is_plus_move(&self, move_id: u16) -> bool {
        if let Some(block_c_index) = lza_plus::plus_move_index_by_move_id_block_c(move_id) {
            self.block_c.get_flag(block_c_index)
        } else if let Some(block_b_index) = lza_plus::plus_move_index_by_move_id_block_b(move_id) {
            self.block_b.get_flag(block_b_index)
        } else {
            false
        }
    }

    pub fn get_move_ids(&self) -> Vec<MoveIndex> {
        self.block_c
            .get_flags()
            .into_iter()
            .filter_map(lza_plus::move_id_by_lza_plus_move_index_block_c)
            .chain(
                self.block_b
                    .get_flags()
                    .into_iter()
                    .filter_map(lza_plus::move_id_by_plus_move_index_block_b),
            )
            .collect()
    }

    pub const fn to_bytes(
        &self,
    ) -> (
        [u8; LZA_PLUS_MOVES_BLOCK_C_BYTES],
        [u8; LZA_PLUS_MOVES_BLOCK_B_BYTES],
    ) {
        (self.block_c.to_bytes(), self.block_b.to_bytes())
    }

    pub fn is_empty(&self) -> bool {
        self.block_c.is_empty() && self.block_b.is_empty()
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
#[allow(clippy::missing_const_for_fn)]
impl PlusMoveFlags {
    #[wasm_bindgen(js_name = fromByteBlocks)]
    pub fn from_byte_blocks_wasm(block_c: Vec<u8>, block_b: Vec<u8>) -> Self {
        Self::from_byte_blocks(
            array_ref![block_c, 0, LZA_PLUS_MOVES_BLOCK_C_BYTES],
            array_ref![block_b, 0, LZA_PLUS_MOVES_BLOCK_B_BYTES],
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

    #[wasm_bindgen(js_name = toBlockCBytes)]
    pub fn to_block_c_bytes_wasm(&self) -> Vec<u8> {
        self.block_c.to_bytes().to_vec()
    }

    #[wasm_bindgen(js_name = toBlockBBytes)]
    pub fn to_block_b_bytes_wasm(&self) -> Vec<u8> {
        self.block_b.to_bytes().to_vec()
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
