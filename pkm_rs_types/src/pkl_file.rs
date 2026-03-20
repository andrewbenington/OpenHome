pub struct PklFileData {
    data: Vec<u8>,
}

impl PklFileData {
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

        println!("both: {start_end}; start: {start}; end: {end}");

        &self.data[start..end]
    }

    pub fn get_bytes(&self) -> &[u8] {
        &self.data
    }
}
