use crate::ohpkm::v2::OhpkmSectionTag;
use crate::result::{Error, Result};
use crate::sectioned_data::DataSection;
#[cfg(feature = "randomize")]
use pkm_rs_resources::moves::MoveIndex;
use pkm_rs_resources::moves::swsh_tr;
use pkm_rs_resources::moves::{bdsp_tm, la_tutor, sv_tm};
#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;
use pkm_rs_types::{FlagSet, read_u16_le};
#[cfg(feature = "randomize")]
use rand::random_range;

#[derive(Default, Debug, Clone, serde::Serialize)]
pub struct LearnedMoves(std::collections::BTreeSet<u16>);

const SIZE_FIELD_BYTES: usize = 2;

impl LearnedMoves {
    pub const fn new() -> Self {
        Self(std::collections::BTreeSet::new())
    }

    pub fn from_moves(move_ids: impl IntoIterator<Item = u16>) -> Self {
        Self(move_ids.into_iter().collect())
    }

    pub fn with_moves(mut self, move_ids: impl IntoIterator<Item = u16>) -> Self {
        for move_id in move_ids {
            self.0.insert(move_id);
        }

        self
    }
}

impl LearnedMoves {
    pub fn from_v1(old: crate::ohpkm::v1::OhpkmV1) -> Option<Self> {
        let tr_move_indices = FlagSet::from_bytes(old.tr_flags_swsh)
            .get_flags()
            .into_iter()
            .filter_map(swsh_tr::move_id_by_tr_index);

        let bdsp_tm_move_indices = FlagSet::from_bytes(old.tm_flags_bdsp)
            .get_flags()
            .into_iter()
            .filter_map(bdsp_tm::move_id_by_tm_index);

        let la_tutor_move_indices = FlagSet::from_bytes(old.tutor_flags_la)
            .get_flags()
            .into_iter()
            .filter_map(la_tutor::move_id_by_tutor_index);

        let sv_tm_move_indices = FlagSet::from_bytes(old.tm_flags_sv)
            .get_flags()
            .into_iter()
            .filter_map(sv_tm::move_id_by_tm_index);

        Some(
            Self::new()
                .with_moves(tr_move_indices)
                .with_moves(bdsp_tm_move_indices)
                .with_moves(la_tutor_move_indices)
                .with_moves(sv_tm_move_indices),
        )
    }
}

impl DataSection for LearnedMoves {
    type TagType = OhpkmSectionTag;
    const TAG: Self::TagType = OhpkmSectionTag::LearnedMoves;

    type ErrorType = Error;
    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::ensure_buffer_size(bytes);

        let move_count = read_u16_le!(bytes, 0) as usize;
        let moves_offset = SIZE_FIELD_BYTES;

        let move_ids = (0..move_count).map(|index| read_u16_le!(bytes, moves_offset + index));

        Ok(Self::from_moves(move_ids))
    }

    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = Vec::with_capacity(SIZE_FIELD_BYTES + self.0.len() * 2);

        let mut offset = 0usize;

        bytes[offset..offset + 2].copy_from_slice(&(self.0.len() as u16).to_le_bytes());
        offset += 2;

        for move_id in &self.0 {
            bytes[offset..offset + 2].copy_from_slice(&move_id.to_le_bytes());
            offset += 2;
        }

        bytes
    }

    fn is_empty(&self) -> bool {
        self.0.is_empty()
    }
}

#[cfg(feature = "randomize")]
impl Randomize for LearnedMoves {
    fn randomized<R: rand::prelude::Rng>(rng: &mut R) -> Self {
        let knows_moves = bool::randomized(rng);
        if !(knows_moves) {
            return Self::default();
        }

        let move_count = random_range(0usize..=100);

        Self::from_moves((0..move_count).map(|_| u16::from(MoveIndex::randomized(rng))))
    }
}
