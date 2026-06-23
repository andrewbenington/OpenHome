import Database from 'better-sqlite3'
import camelcaseKeys from 'camelcase-keys'
import * as fs from 'fs'
import { moveGetAll, type MoveGetAllRow } from './queries.ts'

interface Move {
  id: number
  name: string
  accuracy: number | null
  class: string
  generation: string
  power: number | null
  pp: number
  type: string
}

function isZMoveWithVariants(move: Move) {
  return move.id >= 622 && move.id <= 657
}

function rustConstName(move: Move): string {
  let constName = move.name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace('10_000_000', 'TEN_MILLION')
  if (isZMoveWithVariants(move)) {
    constName += `_${move.class.toUpperCase()}`
  }

  return constName
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

function convertMove(move: Move): string {
  const constName = rustConstName(move)
  const moveClass = `MoveClass::${capitalize(move.class)}`

  return `const ${constName}: MoveMetadata = MoveMetadata {
    id: ${move.id},
    name: "${move.name}",
    accuracy: ${move.accuracy !== null ? `Some(${move.accuracy})` : 'None'},
    class: ${moveClass},
    introduced: Generation::G${move.generation},
    power: ${move.power !== null ? `Some(${move.power})` : 'None'},
    pp: ${move.pp},
    pkm_type: PkmType::${capitalize(move.type)},
};`
}

function rowToMove(row: MoveGetAllRow): Move {
  return {
    id: row.id,
    name: row.name,
    accuracy: row.accuracy,
    class: row.moveClass,
    generation: row.generation,
    power: row.power,
    pp: row.basePp,
    type: row.type,
  }
}

async function getAllMoves() {
  const db = new Database('generate/pkm.db')

  const rows = camelcaseKeys(await moveGetAll(db))

  return rows.map(rowToMove)
}

async function main() {
  const allMoves: Move[] = await getAllMoves()

  let output = `use std::num::NonZeroU16;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

use pkm_rs_types::{Generation, PkmType, read_u16_le};
use serde::{Serialize, Serializer};

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

mod max_pp;

pub use max_pp::adjust_pp_between_games;
pub use max_pp::get_base_max_pp;

use crate::metadata_source::MetadataSource;

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Clone, Copy, Serialize, PartialEq, Eq)]
pub struct MoveSlot {
    pub move_index: MoveIndex,
    pub pp: u8,
    pub pp_ups: u8,
}

impl MoveSlot {
    pub const fn new(move_index: MoveIndex, pp: u8, pp_ups: u8) -> Self {
        Self {
            move_index,
            pp,
            pp_ups,
        }
    }

    pub fn from_bytes<Offset: Into<usize> + Copy>(
        bytes: &[u8],
        offsets: MoveDataOffsets<Offset>,
        pp_up_storage: PpUpStorage,
        index: usize,
    ) -> Self {
        let move_offset = offsets.moves.into() + (2 * index);
        let pp_offset = offsets.pp.into() + index;

        Self {
            move_index: MoveIndex::from_u16(read_u16_le!(bytes, move_offset)),
            pp: bytes[pp_offset],
            pp_ups: pp_up_storage.get_pp_ups(bytes, offsets, index),
        }
    }

    fn write_move_and_pp_to_offsets<T: Into<usize> + Copy>(
        &self,
        bytes: &mut [u8],
        offsets: MoveDataOffsets<T>,
        index: usize,
    ) {
        let move_offset = offsets.moves.into() + (2 * index);
        let pp_offset = offsets.pp.into() + index;

        bytes[move_offset..move_offset + 2].copy_from_slice(&self.move_index.to_le_bytes());
        bytes[pp_offset] = self.pp;
    }

    pub fn write_to_offsets<T: Into<usize> + Copy>(
        &self,
        bytes: &mut [u8],
        offsets: MoveDataOffsets<T>,
        index: usize,
        pp_up_storage: PpUpStorage,
    ) {
        self.write_move_and_pp_to_offsets(bytes, offsets, index);
        pp_up_storage.write_pp_ups(bytes, offsets, index, self.pp_ups);
    }

    pub fn to_pp_adjusted(
        self,
        source_metadata: MetadataSource,
        dest_metadata: MetadataSource,
    ) -> Option<Self> {
        let adjusted_pp = adjust_pp_between_games(source_metadata, dest_metadata, self)?;

        Some(Self {
            pp: adjusted_pp,
            ..self
        })
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Clone, Copy, Serialize)]
pub struct MoveSlots([MoveSlot; 4]);

impl MoveSlots {
    pub fn from_bytes<T: Into<usize> + Copy>(
        bytes: &[u8],
        offsets: MoveDataOffsets<T>,
        pp_up_storage: PpUpStorage,
    ) -> Self {
        Self([
            MoveSlot::from_bytes(bytes, offsets, pp_up_storage, 0),
            MoveSlot::from_bytes(bytes, offsets, pp_up_storage, 1),
            MoveSlot::from_bytes(bytes, offsets, pp_up_storage, 2),
            MoveSlot::from_bytes(bytes, offsets, pp_up_storage, 3),
        ])
    }

    pub const fn from_arrays(moves: [MoveIndex; 4], pp: [u8; 4], pp_ups: [u8; 4]) -> Self {
        Self([
            MoveSlot::new(moves[0], pp[0], pp_ups[0]),
            MoveSlot::new(moves[1], pp[1], pp_ups[1]),
            MoveSlot::new(moves[2], pp[2], pp_ups[2]),
            MoveSlot::new(moves[3], pp[3], pp_ups[3]),
        ])
    }

    pub fn write_spans<T: Into<usize> + Copy>(
        &self,
        bytes: &mut [u8],
        offsets: MoveDataOffsets<T>,
        pp_up_storage: PpUpStorage,
    ) {
        self.0
            .iter()
            .enumerate()
            .for_each(|(i, slot)| slot.write_to_offsets(bytes, offsets, i, pp_up_storage));
    }

    pub fn iter_mut(&mut self) -> std::slice::IterMut<'_, MoveSlot> {
        self.0.iter_mut()
    }

    // returns 0, 1, 2, or 3 (or None)
    fn first_empty_index(&self) -> Option<usize> {
        self.0.iter().enumerate().find_map(|(index, slot)| {
            if slot.move_index.is_empty() {
                Some(index)
            } else {
                None
            }
        })
    }

    pub fn to_pp_adjusted(
        self,
        source_metadata: MetadataSource,
        dest_metadata: MetadataSource,
    ) -> Self {
        self.into_iter()
            .map(|m| {
                m.to_pp_adjusted(source_metadata, dest_metadata)
                    .unwrap_or_default()
            })
            .collect()
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
#[allow(clippy::missing_const_for_fn)]
impl MoveSlots {
    #[wasm_bindgen(getter)]
    pub fn indices(&self) -> Vec<u16> {
        self.into_iter()
            .map(|slot| u16::from(slot.move_index))
            .collect()
    }

    #[wasm_bindgen(setter)]
    pub fn set_indices(&mut self, value: &[u16]) {
        self.iter_mut()
            .enumerate()
            .for_each(|(i, slot)| slot.move_index = MoveIndex::from_u16(value[i]));
    }

    #[wasm_bindgen(getter)]
    pub fn pp(&self) -> Vec<u8> {
        self.into_iter().map(|slot| slot.pp).collect()
    }

    #[wasm_bindgen(setter)]
    pub fn set_pp(&mut self, value: &[u8]) {
        self.iter_mut()
            .enumerate()
            .for_each(|(i, slot)| slot.pp = value[i]);
    }

    #[wasm_bindgen(getter)]
    pub fn pp_ups(&self) -> Vec<u8> {
        self.into_iter().map(|slot| slot.pp_ups).collect()
    }

    #[wasm_bindgen(setter)]
    pub fn set_pp_ups(&mut self, value: &[u8]) {
        self.iter_mut()
            .enumerate()
            .for_each(|(i, slot)| slot.pp_ups = value[i]);
    }
}

impl IntoIterator for MoveSlots {
    type Item = MoveSlot;
    type IntoIter = std::array::IntoIter<MoveSlot, 4>;

    fn into_iter(self) -> Self::IntoIter {
        self.0.into_iter()
    }
}

impl<'a> IntoIterator for &'a MoveSlots {
    type Item = &'a MoveSlot;
    type IntoIter = std::slice::Iter<'a, MoveSlot>;

    fn into_iter(self) -> Self::IntoIter {
        self.0.iter()
    }
}

impl<'a> IntoIterator for &'a mut MoveSlots {
    type Item = &'a mut MoveSlot;
    type IntoIter = std::slice::IterMut<'a, MoveSlot>;

    fn into_iter(self) -> Self::IntoIter {
        self.0.iter_mut()
    }
}

impl FromIterator<MoveSlot> for MoveSlots {
    fn from_iter<T: IntoIterator<Item = MoveSlot>>(iter: T) -> Self {
        let mut from_iter = iter.into_iter();
        let mut move_slots = Self::default();

        while let Some(index) = move_slots.first_empty_index()
            && let Some(slot) = from_iter.next()
        {
            move_slots.0[index] = slot;
        }

        move_slots
    }
}

impl FromIterator<Option<MoveSlot>> for MoveSlots {
    fn from_iter<T: IntoIterator<Item = Option<MoveSlot>>>(iter: T) -> Self {
        let mut from_iter = iter.into_iter();
        let mut move_slots = Self::default();

        while let Some(index) = move_slots.first_empty_index()
            && let Some(slot) = from_iter.next().flatten()
        {
            move_slots.0[index] = slot
        }

        move_slots
    }
}

#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub enum PpUpStorage {
    SingleByte,
    FourBytes,
}

impl PpUpStorage {
    fn get_pp_ups(
        &self,
        bytes: &[u8],
        offsets: MoveDataOffsets<impl Into<usize>>,
        index: usize,
    ) -> u8 {
        match self {
            PpUpStorage::SingleByte => bytes[offsets.pp_ups.into()] >> (2 * index) & 0b11,
            PpUpStorage::FourBytes => bytes[offsets.pp_ups.into() + index],
        }
    }

    fn write_pp_ups_single_byte(
        bytes: &mut [u8],
        offsets: MoveDataOffsets<impl Into<usize>>,
        index: usize,
        value: u8,
    ) {
        let pp_ups_offset: usize = offsets.pp_ups.into();
        let current_byte = bytes[pp_ups_offset];

        let shift_val = index * 2;
        let mask: u8 = !(3 << shift_val);

        bytes[pp_ups_offset] = (current_byte & mask) | (value << shift_val);
    }

    fn write_pp_ups(
        &self,
        bytes: &mut [u8],
        offsets: MoveDataOffsets<impl Into<usize>>,
        index: usize,
        value: u8,
    ) {
        match self {
            PpUpStorage::SingleByte => Self::write_pp_ups_single_byte(bytes, offsets, index, value),
            PpUpStorage::FourBytes => bytes[offsets.pp_ups.into() + index] = value,
        }
    }
}

#[derive(Debug, Clone, Copy)]
pub struct MoveDataOffsets<T: Into<usize> = usize> {
    pub moves: T,
    pub pp: T,
    pub pp_ups: T,
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, PartialEq, Eq, Clone, Copy)]
pub struct MoveIndex(Option<NonZeroU16>);

impl MoveIndex {
    pub fn get_metadata(&self) -> Option<&'static MoveMetadata> {
        self.0.map(|idx| ALL_MOVES[(idx.get() - 1) as usize])
    }

    pub fn from_u16(value: u16) -> Self {
        Self(NonZeroU16::try_from(value).ok())
    }

    pub fn from_le_bytes(bytes: [u8; 2]) -> Self {
        Self(NonZeroU16::try_from(u16::from_le_bytes(bytes)).ok())
    }

    pub fn to_le_bytes(self) -> [u8; 2] {
        self.0.map(NonZeroU16::get).unwrap_or(0u16).to_le_bytes()
    }

    pub const fn empty() -> Self {
        Self(None)
    }

    pub const fn is_empty(&self) -> bool {
        self.0.is_none()
    }
}

impl Serialize for MoveIndex {
    fn serialize<S>(&self, serializer: S) -> core::result::Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(match self.get_metadata() {
            None => "<empty>",
            Some(metadata) => metadata.name,
        })
    }
}

impl From<u16> for MoveIndex {
    fn from(value: u16) -> Self {
        Self(NonZeroU16::try_from(value).ok())
    }
}

impl From<MoveIndex> for u16 {
    fn from(val: MoveIndex) -> Self {
        match val.0 {
            None => 0,
            Some(idx) => idx.get(),
        }
    }
}
    
impl From<arbitrary_int::u2> for MoveIndex {
    fn from(value: arbitrary_int::u2) -> Self {
        Self(NonZeroU16::try_from(value.value() as u16).ok())
    }
}

pub struct MoveMetadata {
    pub id: u16,
    pub name: &'static str,
    pub accuracy: Option<u8>,
    pub class: MoveClass,
    pub introduced: Generation,
    pub power: Option<u8>,
    pub pp: u8,
    pub pkm_type: PkmType,
}

impl MoveMetadata {
    pub const fn get_name(&self) -> &'static str {
        self.name
    }
}

pub enum MoveClass {
    Physical,
    Special,
    Status,
}

`

  output += allMoves.map(convertMove).join('\n\n')

  output +=
    `\n\nconst ALL_MOVES: [&MoveMetadata; ${allMoves.length}] = [\n` +
    allMoves.map((move) => '&' + rustConstName(move)).join(',\n') +
    '];'

  fs.writeFileSync('pkm_rs_resources/src/moves.rs', output)
  console.log('Rust code written to pkm_rs_resources/src/moves.rs')
}

await main()
