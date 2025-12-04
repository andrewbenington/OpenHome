use std::{fmt::Display, hash::Hash};

#[cfg(feature = "wasm")]
use crate::log;

type CoreResult<T, E> = core::result::Result<T, E>;

pub trait DataSection: Sized {
    type ErrorType: core::error::Error;
    type TagType: SectionTag;
    const TAG: Self::TagType;

    fn from_bytes(bytes: &[u8]) -> CoreResult<Self, Self::ErrorType>;
    fn to_bytes(&self) -> CoreResult<Vec<u8>, Self::ErrorType>;
    fn is_empty(&self) -> bool;

    fn extract_from(
        data: &SectionedData<Self::TagType>,
    ) -> CoreResult<Option<Self>, Self::ErrorType> {
        data.find_section_data(Self::TAG)
            .map(|d| Self::from_bytes(&d.bytes))
            .transpose()
    }

    fn extract_all_from(
        data: &SectionedData<Self::TagType>,
    ) -> CoreResult<Vec<Self>, Self::ErrorType> {
        data.all_section_data(Self::TAG)
            .into_iter()
            .map(|d| Self::from_bytes(&d.bytes))
            .collect()
    }

    fn ensure_buffer_size(bytes: &[u8]) -> Result<()> {
        if bytes.len() < Self::TAG.min_size() {
            Err(Error::BufferTooShort {
                field: Self::TAG.to_string(),
                expected: Self::TAG.min_size(),
                received: bytes.len(),
            })
        } else {
            Ok(())
        }
    }

    fn to_tagged_buffer(&self) -> CoreResult<TaggedBuffer<Self::TagType>, Self::ErrorType> {
        let bytes = self.to_bytes()?;

        Ok(TaggedBuffer {
            bytes,
            tag: Self::TAG,
        })
    }
}

pub trait SectionTag: Sized + Copy + Eq + Hash + Display {
    fn from_index(index: u16) -> Option<Self>;
    fn index(&self) -> u16;
    fn min_size(&self) -> usize;
}

pub type SectionOffset = u16;
pub type SectionLength = u16;

#[derive(Clone, Copy)]
pub struct SectionMetadata<Tag: SectionTag>(Tag, SectionOffset, SectionLength);
// generic section tag where impl to u16 and get size

impl<Tag: SectionTag> SectionMetadata<Tag> {
    pub fn from_bytes(bytes: &[u8]) -> Option<Self> {
        let tag = Tag::from_index(u16::from_le_bytes(
            bytes[0..2].try_into().expect(EMERGENCY_BUFFER_MSG),
        ))?;
        Some(Self(
            tag,
            u16::from_le_bytes(bytes[2..4].try_into().expect(EMERGENCY_BUFFER_MSG)),
            u16::from_le_bytes(bytes[4..6].try_into().expect(EMERGENCY_BUFFER_MSG)),
        ))
    }

    pub fn to_bytes(&self) -> Vec<u8> {
        let mut buffer: Vec<u8> = Vec::with_capacity(6);
        buffer.extend_from_slice(&self.0.index().to_le_bytes());
        buffer.extend_from_slice(&self.1.to_le_bytes());
        buffer.extend_from_slice(&self.2.to_le_bytes());

        buffer
    }

    pub const fn tag(self) -> Tag {
        self.0
    }

    pub const fn offset(self) -> SectionOffset {
        self.1
    }

    pub const fn length(self) -> SectionLength {
        self.2
    }

    pub const fn new(tag: Tag, offset: SectionOffset, length: SectionLength) -> Self {
        Self(tag, offset, length)
    }
}

pub enum Error {
    BufferTooShort {
        field: String,
        expected: usize,
        received: usize,
    },
    SectionOutOfBounds {
        section_name: String,
        offset: SectionOffset,
        length: SectionLength,
        buffer_size: usize,
    },
}

pub type Result<T> = core::result::Result<T, Error>;

const HEADER_SIZE: usize = 8;
const SECTION_METADATA_SIZE: u16 = 6;
const EMERGENCY_BUFFER_MSG: &str = "buffer too short; incorrect or missing length check";

pub struct SectionedData<Tag: SectionTag> {
    pub magic_number: u32,
    pub version: u16,
    tagged_buffers: Vec<TaggedBuffer<Tag>>,
}

impl<Tag: SectionTag> SectionedData<Tag> {
    pub fn find_section_data(&self, tag: Tag) -> Option<&TaggedBuffer<Tag>> {
        self.tagged_buffers.iter().find(|tb| tb.tag == tag)
    }

    pub fn all_section_data(&self, tag: Tag) -> Vec<&TaggedBuffer<Tag>> {
        self.tagged_buffers
            .iter()
            .filter(|tb| tb.tag == tag)
            .collect()
    }
}

impl<Tag: SectionTag> SectionedData<Tag> {
    pub const fn new(magic_number: u32, version: u16) -> Self {
        Self {
            magic_number,
            version,
            tagged_buffers: Vec::new(),
        }
    }

    pub fn add<T: DataSection<TagType = Tag>>(
        &mut self,
        section: T,
    ) -> CoreResult<&mut Self, T::ErrorType> {
        self.tagged_buffers.push(section.to_tagged_buffer()?);

        Ok(self)
    }

    pub fn add_if_not_empty<T: DataSection<TagType = Tag>>(
        &mut self,
        section: T,
    ) -> CoreResult<&mut Self, T::ErrorType> {
        if !section.is_empty() {
            self.tagged_buffers.push(section.to_tagged_buffer()?);
        }

        Ok(self)
    }

    pub fn add_if_some<T: DataSection<TagType = Tag>>(
        &mut self,
        section: Option<T>,
    ) -> CoreResult<&mut Self, T::ErrorType> {
        if let Some(section) = section {
            self.tagged_buffers.push(section.to_tagged_buffer()?);
        }

        Ok(self)
    }

    pub fn add_all<T: DataSection<TagType = Tag>>(
        &mut self,
        sections: Vec<T>,
    ) -> CoreResult<&mut Self, T::ErrorType> {
        for section in sections.into_iter() {
            self.tagged_buffers
                .push(DataSection::to_tagged_buffer(&section)?);
        }

        Ok(self)
    }

    pub fn from_bytes(bytes: &[u8]) -> Result<Self> {
        if bytes.len() <= HEADER_SIZE {
            return Err(Error::BufferTooShort {
                field: String::from("Data Header"),
                expected: HEADER_SIZE,
                received: bytes.len(),
            });
        }

        let magic_number = u32::from_le_bytes(bytes[0..4].try_into().expect(EMERGENCY_BUFFER_MSG));
        let version = u16::from_le_bytes(bytes[4..6].try_into().expect(EMERGENCY_BUFFER_MSG));
        let section_count = u16::from_le_bytes(bytes[6..8].try_into().expect(EMERGENCY_BUFFER_MSG));

        let min_buffer_size = HEADER_SIZE + (SECTION_METADATA_SIZE * section_count) as usize;
        if bytes.len() <= min_buffer_size {
            return Err(Error::BufferTooShort {
                field: String::from("Section Metadata"),
                expected: min_buffer_size,
                received: bytes.len(),
            });
        }

        let mut sections: Vec<TaggedBuffer<Tag>> = Vec::with_capacity(section_count as usize);

        for i in 0..section_count {
            let metadata_start = HEADER_SIZE + (i * SECTION_METADATA_SIZE) as usize;
            let metadata_end = metadata_start + (SECTION_METADATA_SIZE as usize);

            let metadata_o =
                SectionMetadata::<Tag>::from_bytes(&bytes[metadata_start..metadata_end]);
            let Some(metadata) = metadata_o else {
                #[cfg(feature = "wasm")]
                log!("MALFORMED METADATA at {metadata_start} - {metadata_end}");
                continue;
            };

            let section_start = metadata.offset() as usize;
            let section_end = section_start + (metadata.length() as usize);
            if bytes.len() < section_end {
                return Err(Error::SectionOutOfBounds {
                    section_name: metadata.tag().to_string(),
                    offset: min_buffer_size as u16,
                    length: metadata.length(),
                    buffer_size: bytes.len(),
                });
            }

            let section_bytes = bytes[section_start..section_end].to_vec();

            sections.push(TaggedBuffer {
                tag: metadata.tag(),
                bytes: section_bytes,
            });
        }

        Ok(Self {
            magic_number,
            version,
            tagged_buffers: sections,
        })
    }

    pub fn to_bytes(self) -> Result<Vec<u8>> {
        let mut buffer = Vec::<u8>::new();

        buffer.extend_from_slice(&self.magic_number.to_le_bytes());
        buffer.extend_from_slice(&self.version.to_le_bytes());
        buffer.extend_from_slice(&u16::to_le_bytes(self.tagged_buffers.len() as u16));

        let section_count = self.tagged_buffers.len() as u16;
        let mut current_data_offset = (HEADER_SIZE as u16) + SECTION_METADATA_SIZE * section_count;
        let mut section_bytes_in_order: Vec<Vec<u8>> =
            Vec::with_capacity(self.tagged_buffers.len());

        for tagged_buffer in self.tagged_buffers.into_iter() {
            let buffer_len = tagged_buffer.bytes.len() as u16;
            let metadata = SectionMetadata::new(tagged_buffer.tag, current_data_offset, buffer_len);

            buffer.extend_from_slice(&metadata.to_bytes());
            current_data_offset += buffer_len;
            section_bytes_in_order.push(tagged_buffer.bytes);
        }

        for section_bytes in section_bytes_in_order {
            buffer.extend_from_slice(&section_bytes);
        }

        Ok(buffer)
    }
}

pub struct TaggedBuffer<Tag: SectionTag> {
    pub tag: Tag,
    pub bytes: Vec<u8>,
}
