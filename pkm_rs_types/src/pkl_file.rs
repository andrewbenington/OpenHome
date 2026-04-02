pub struct PklFileDataVec {
    data: Vec<u8>,
}

impl PklFileDataVec {
    pub fn from_bytes(bytes: &[u8]) -> Self {
        Self {
            data: bytes.to_vec(),
        }
    }

    pub fn identifier(&self) -> Result<String, std::string::FromUtf8Error> {
        String::from_utf8(self.data[..2].to_vec())
    }

    pub fn length(&self) -> usize {
        u16::from_le_bytes(self.data[2..4].try_into().unwrap()) as usize
    }

    pub fn get_entry(&self, index: usize) -> &[u8] {
        let offset = 4 + index * 2;

        let start_end =
            u32::from_le_bytes(self.data[offset..offset + 4].try_into().unwrap()) as usize;
        let start = start_end & 0xFFFF;
        let end = start_end >> 16;

        &self.data[start..end]
    }

    pub fn get_bytes(&self) -> &[u8] {
        &self.data
    }
}

#[derive(Debug, Clone, Copy)]
pub struct PklFileData<'a>(&'a [u8]);

impl<'a> PklFileData<'a> {
    pub const fn from_bytes(bytes: &'a [u8]) -> Self {
        Self(bytes)
    }

    pub fn identifier(&self) -> Result<String, std::string::FromUtf8Error> {
        String::from_utf8(self.0[..2].to_vec())
    }

    pub fn length(&self) -> usize {
        u16::from_le_bytes(self.0[2..4].try_into().unwrap()) as usize
    }

    pub fn get_entry(&self, index: usize) -> &'a [u8] {
        let offset = 4 + index * 2;

        let start_end = u32::from_le_bytes(self.0[offset..offset + 4].try_into().unwrap()) as usize;
        let start = start_end & 0xFFFF;
        let end = start_end >> 16;

        &self.0[start..end]
    }

    pub const fn get_bytes(&self) -> &[u8] {
        self.0
    }
}
