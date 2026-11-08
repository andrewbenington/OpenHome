// from PKHeX.Core/PKM/HOME/GameDataPC9.cs

use crate::bytes::{AsBytes, AsBytesMut};
use pkm_rs_types::read_u64_le;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Offset {
    TransferState = 0x00,
    Timestamp = 0x01,
    Tag = 0x09,
}

impl From<Offset> for usize {
    fn from(offset: Offset) -> usize {
        offset as usize
    }
}

// ---------------------------------------------------------------------------
// PkhPc9Buffer<S> — generic over the byte storage so that a single impl block
// covers all getters, and a second (narrower) block covers setters.
//
//   PkhPc9BufferRef<'a>  = PkhPc9Buffer<&'a [u8]>       — read-only
//   PkhPc9BufferMut<'a>  = PkhPc9Buffer<&'a mut [u8]>   — read + write
// ---------------------------------------------------------------------------

pub type PkhPc9BufferMut<'a> = PkhPc9Buffer<&'a mut [u8]>;

#[derive(Default, Clone, Copy)]
pub struct PkhPc9Buffer<S: AsRef<[u8]>>(S);

// ------------------------------------------------------------------
// Constructors — immutable
// ------------------------------------------------------------------

impl<'a> PkhPc9Buffer<&'a [u8]> {
    pub fn new(span: &'a [u8]) -> Self {
        assert_eq!(span.len(), super::HOME_PC9_DATA_SIZE);
        Self(span)
    }
}

// ------------------------------------------------------------------
// Constructors — mutable
// ------------------------------------------------------------------

impl<'a> PkhPc9Buffer<&'a mut [u8]> {
    pub fn new_mut(span: &'a mut [u8]) -> Self {
        assert_eq!(span.len(), super::HOME_PC9_DATA_SIZE);
        Self(span)
    }
}

// ------------------------------------------------------------------
// Accessors
// ------------------------------------------------------------------

impl<S: AsRef<[u8]>> PkhPc9Buffer<S> {
    fn get_u8(&self, offset: Offset) -> u8 {
        let offset = offset as usize;
        self.bytes()[offset]
    }

    fn get_u64_le(&self, offset: Offset) -> u64 {
        let offset = offset as usize;
        read_u64_le!(self.bytes(), offset)
    }

    fn get_array<const N: usize>(&self, offset: Offset) -> [u8; N] {
        let offset = offset as usize;
        self.bytes()[offset..offset + N].try_into().unwrap()
    }
}

impl<S: AsRef<[u8]> + AsMut<[u8]>> PkhPc9Buffer<S> {
    fn set_u8(&mut self, offset: Offset, v: u8) {
        let offset = offset as usize;
        self.bytes_mut()[offset] = v;
    }

    fn set_u64_le(&mut self, offset: Offset, v: u64) {
        let offset = offset as usize;
        self.bytes_mut()[offset..offset + 2].copy_from_slice(&v.to_le_bytes());
    }

    fn set_array<const N: usize>(&mut self, offset: Offset, v: &[u8; N]) {
        let offset = offset as usize;
        self.bytes_mut()[offset..offset + N].copy_from_slice(v);
    }
}

// ------------------------------------------------------------------
// Shared methods
// ------------------------------------------------------------------

impl<S: AsRef<[u8]>> PkhPc9Buffer<S> {
    fn bytes(&self) -> &[u8] {
        self.0.as_ref()
    }

    pub fn transfer_state_raw(&self) -> u8 {
        self.get_u8(Offset::TransferState)
    }

    pub fn timestamp_unix_seconds(&self) -> u64 {
        self.get_u64_le(Offset::Timestamp)
    }

    pub fn tag_bytes(&self) -> [u8; 16] {
        self.get_array(Offset::Tag)
    }
}

// ==================================================================
// Setters  (available only on PkhPk8BufferMut)
// ==================================================================

impl<S: AsRef<[u8]> + AsMut<[u8]>> PkhPc9Buffer<S> {
    fn bytes_mut(&mut self) -> &mut [u8] {
        self.0.as_mut()
    }

    pub fn set_transfer_state_raw(&mut self, v: u8) {
        self.set_u8(Offset::TransferState, v);
    }

    pub fn set_timestamp_unix_seconds(&mut self, v: u64) {
        self.set_u64_le(Offset::Timestamp, v);
    }

    pub fn set_tag_bytes(&mut self, v: &[u8; 16]) {
        self.set_array(Offset::Tag, v);
    }
}

// ==================================================================
// Trait impls
// ==================================================================

impl<S: AsRef<[u8]>> AsBytes for PkhPc9Buffer<S> {
    fn as_bytes(&self) -> &[u8] {
        self.0.as_ref()
    }
}

impl<S: AsRef<[u8]> + AsMut<[u8]>> AsBytesMut for PkhPc9Buffer<S> {
    fn as_bytes_mut(&mut self) -> &mut [u8] {
        self.0.as_mut()
    }
}
