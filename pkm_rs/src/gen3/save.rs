use crate::gen3::interface::PCBox;
use crate::traits::PkmBytes;
use crate::{Gen3Strings, gen3::Pk3, strings::Gen3Encoding};

use pkm_rs_types::{Gender, Language, OriginGame};

pub struct G3Sector {
    pub data: Vec<u8>, // Should hold 3968 bytes
    pub section_id: u16,
    pub checksum: u16,
    pub signature: u32,
    pub save_index: u32,
}

impl G3Sector {
    pub fn from_bytes(bytes: &[u8], index: usize) -> Self {
        let offset = index * 0x1000;

        let data = bytes[offset..offset + 3968].to_vec();
        let section_id =
            u16::from_le_bytes(bytes[offset + 0xff4..offset + 0xff6].try_into().unwrap());
        let checksum =
            u16::from_le_bytes(bytes[offset + 0xff6..offset + 0xff8].try_into().unwrap());
        let signature =
            u32::from_le_bytes(bytes[offset + 0xff8..offset + 0xffc].try_into().unwrap());
        let save_index =
            u32::from_le_bytes(bytes[offset + 0xffc..offset + 0x1000].try_into().unwrap());

        Self {
            data,
            section_id,
            checksum,
            signature,
            save_index,
        }
    }

    pub fn refresh_checksum(&mut self) {
        let byte_length = match self.section_id {
            0 => 3884,
            13 => 2000,
            _ => 3968,
        };

        let mut checksum: u64 = 0;
        for i in (0..byte_length).step_by(4) {
            let val = u32::from_le_bytes(self.data[i..i + 4].try_into().unwrap());
            checksum = (checksum + val as u64) & 0xffffffff;
        }

        self.checksum = ((checksum & 0xffff) + ((checksum >> 16) & 0xffff)) as u16;
    }

    pub fn write_to_buffer(&mut self, bytes: &mut [u8], this_index: usize, first_index: usize) {
        let old_checksum = self.checksum;

        self.refresh_checksum();
        if old_checksum != self.checksum {
            println!("checksum changed for {}", this_index);
        }

        let index = (this_index + 14 - first_index) % 14;
        let offset = index * 0x1000;

        bytes[offset..offset + 3968].copy_from_slice(&self.data);

        bytes[offset + 0xff4..offset + 0xff6].copy_from_slice(&self.section_id.to_le_bytes());
        bytes[offset + 0xff6..offset + 0xff8].copy_from_slice(&self.checksum.to_le_bytes());
        bytes[offset + 0xff8..offset + 0xffc].copy_from_slice(&self.signature.to_le_bytes());
        bytes[offset + 0xffc..offset + 0x1000].copy_from_slice(&self.save_index.to_le_bytes());
    }
}

pub struct G3SaveBackup {
    pub origin: OriginGame,
    pub bytes: Vec<u8>,
    pub save_index: u32,
    pub is_first_save: bool,
    pub game_code: u32,
    pub security_key: u32,
    pub security_key_copy: Option<u32>,
    pub signature: u32,
    pub money: i32,
    pub name: String,
    pub language: Language,
    pub tid: u16,
    pub sid: u16,
    pub trainer_gender: Gender,
    pub sectors: Vec<G3Sector>,
    pub pc_data_contiguous: Vec<u8>,
    pub current_pc_box: u8,
    pub boxes: Vec<PCBox<Pk3>>,
    pub first_sector_index: usize,
}

impl G3SaveBackup {
    pub fn new(bytes: &[u8]) -> Result<Self, String> {
        let save_index = u32::from_le_bytes(bytes[0xffc..0x1000].try_into().unwrap());

        // 1. Extract and sort sectors
        let mut sectors = Vec::with_capacity(14);
        for i in 0..14 {
            sectors.push(G3Sector::from_bytes(bytes, i));
        }
        let first_sector_index = sectors[0].section_id as usize;
        sectors.sort_by_key(|s| s.section_id);

        // 2. Determine game properties
        let game_code = u32::from_le_bytes(sectors[0].data[0xac..0xb0].try_into().unwrap());
        let signature = sectors[0].signature;

        let mut security_key = 0;
        let mut security_key_copy = None;
        let origin;
        let money;

        match game_code {
            0 => {
                origin = OriginGame::Ruby;
                let raw_money =
                    u32::from_le_bytes(sectors[1].data[0x490..0x494].try_into().unwrap());
                money = raw_money as i32;
            }
            1 => {
                origin = OriginGame::FireRed;
                security_key =
                    u32::from_le_bytes(sectors[0].data[0x0af8..0x0afc].try_into().unwrap());
                security_key_copy = Some(u32::from_le_bytes(
                    sectors[0].data[0x0f20..0x0f24].try_into().unwrap(),
                ));
                let raw_money =
                    u32::from_le_bytes(sectors[1].data[0x290..0x294].try_into().unwrap());
                money = (raw_money ^ security_key) as i32;
            }
            _ => {
                origin = OriginGame::Emerald;
                security_key = u32::from_le_bytes(sectors[0].data[0xac..0xb0].try_into().unwrap());
                security_key_copy = Some(u32::from_le_bytes(
                    sectors[0].data[0x01f4..0x01f8].try_into().unwrap(),
                ));
                let raw_money =
                    u32::from_le_bytes(sectors[1].data[0x490..0x494].try_into().unwrap());
                money = (raw_money ^ security_key) as i32;
            }
        }

        // Helper macro to check JPN layout logic (equivalent to JS `get isJapanese()`)
        let is_japanese = sectors[0].data[0x6] == 0;
        let charset = if is_japanese {
            Gen3Encoding::Jpn
        } else {
            Gen3Encoding::Int
        };

        // 3. Decode Trainer Name
        let name = Gen3Strings::decode_7_bytes(sectors[0].data[0..7].to_vec(), charset);

        // 4. Concatenate contiguous PC box storage data
        let mut pc_data_contiguous = vec![0u8; 33744];

        for (i, sector) in sectors[5..].iter().enumerate() {
            let chunk_size = if i + 5 == 13 { 2000 } else { 3968 };
            let dest_offset = i * 3968;
            pc_data_contiguous[dest_offset..dest_offset + chunk_size]
                .copy_from_slice(&sector.data[0..chunk_size]);
        }

        let current_pc_box = pc_data_contiguous[0];

        // 5. Initialize boxes and allocate space
        let mut boxes = Vec::with_capacity(14);
        for i in 0..14 {
            let name_start = 0x8344 + i * 9;
            let name_slice = &pc_data_contiguous[name_start..name_start + 10];
            let box_name = Gen3Strings::decode_10_bytes(name_slice.to_vec(), charset);
            boxes.push(PCBox::new(box_name, 30));
        }

        // 6. Populate Box Slots with PK3 logic
        for i in 0..420 {
            let box_idx = i / 30;
            let slot_idx = i % 30;
            let start = 4 + i * 80;
            let buffer = &pc_data_contiguous[start..start + 80];

            // Replaces try/catch with robust Rust error propagation
            boxes[box_idx].box_slots[slot_idx] = Pk3::from_slot_bytes(buffer).map_err(|e| {
                format!(
                    "File has invalid Pokémon data at box {}/slot {}: {}",
                    box_idx, slot_idx, e
                )
            })?;
        }

        let tid = u16::from_le_bytes(sectors[0].data[0x0a..0x0c].try_into().unwrap());
        let sid = u16::from_le_bytes(sectors[0].data[0x0c..0x0e].try_into().unwrap());
        let trainer_gender = if sectors[0].data[0x08] != 0 {
            Gender::Female
        } else {
            Gender::Male
        };

        Ok(Self {
            origin,
            bytes: bytes.to_vec(),
            save_index,
            is_first_save: false,
            game_code,
            security_key,
            security_key_copy,
            signature,
            money,
            name,
            language: Language::None,
            tid,
            sid,
            trainer_gender,
            sectors,
            pc_data_contiguous,
            current_pc_box,
            boxes,
            first_sector_index,
        })
    }

    pub fn is_japanese(&self) -> bool {
        self.sectors[0].data[0x6] == 0
    }
}

pub struct BoxAndSlot {
    pub box_idx: usize,
    pub slot_idx: usize,
}

pub struct G3Sav {
    pub bytes: Vec<u8>,
    pub primary_save: G3SaveBackup,
    pub backup_save: G3SaveBackup,
    pub primary_save_offset: usize,
    pub current_pc_box: u8,
    pub money: i32,
    pub name: String,
    pub tid: u16,
    pub sid: u16,
    pub display_id: String,
    pub boxes: Vec<PCBox<Pk3>>,
    pub origin: OriginGame,
    pub updated_box_slots: Vec<BoxAndSlot>,
}

impl G3Sav {
    pub fn new(bytes: &[u8]) -> Result<Self, String> {
        let save_one = G3SaveBackup::new(&bytes[0..0xe000])?;
        let save_two = G3SaveBackup::new(&bytes[0xe000..0x1c000])?;

        let (primary_save, backup_save, primary_save_offset) =
            if save_one.save_index > save_two.save_index {
                (save_one, save_two, 0)
            } else {
                (save_two, save_one, 0xe000)
            };

        let current_pc_box = primary_save.current_pc_box;
        let money = primary_save.money;
        let name = primary_save.name.clone();
        let tid = primary_save.tid;
        let sid = primary_save.sid;
        let display_id = format!("{:05}", tid);
        let boxes = primary_save.boxes.clone();

        // Hacky version signature detection mirrored exactly into Rust iterators
        let trainer_mon = boxes
            .iter()
            .flat_map(|b| &b.box_slots)
            .flatten() // Drops out None values cleanly
            .find(|mon| {
                mon.trainer_id == tid
                    && mon.secret_id == sid
                    && mon.trainer_name.to_string() == name
            });

        let origin = match trainer_mon {
            Some(mon) => mon.game_of_origin,
            None => primary_save.origin, // Simplified backup fallback layout string match omittable if primary_save detects it
        };

        Ok(Self {
            bytes: bytes.to_vec(),
            primary_save,
            backup_save,
            primary_save_offset,
            current_pc_box,
            money,
            name,
            tid,
            sid,
            display_id,
            boxes,
            origin,
            updated_box_slots: Vec::new(),
        })
    }

    pub fn prepare_for_saving(&mut self) {
        // 1. Process updated slots and rebuild continuous raw byte structure
        for update in &self.updated_box_slots {
            let mon_offset = 30 * update.box_idx + update.slot_idx;
            let mut pc_bytes = vec![0u8; 80];

            if let Some(mon) = &mut self.boxes[update.box_idx].box_slots[update.slot_idx] {
                if mon.game_of_origin != OriginGame::Invalid0 {
                    mon.refresh_checksum();
                    pc_bytes.copy_from_slice(&mon.to_box_bytes());
                }
            }

            let dest_start = 4 + mon_offset * 80;
            self.primary_save.pc_data_contiguous[dest_start..dest_start + 80]
                .copy_from_slice(&pc_bytes);
        }

        // 2. Slice and distribute contiguous data back into individual sector buffers
        let mut primary_bytes = self.primary_save.bytes.clone();
        let first_sector_idx = self.primary_save.first_sector_index;

        for (i, sector) in self.primary_save.sectors[5..].iter_mut().enumerate() {
            let chunk_size = if i + 5 == 13 { 2000 } else { 3968 };
            let src_start = i * 3968;
            let pc_data = &self.primary_save.pc_data_contiguous[src_start..src_start + chunk_size];

            sector.data[0..chunk_size].copy_from_slice(pc_data);
            sector.write_to_buffer(&mut primary_bytes, i + 5, first_sector_idx);
        }

        // 3. Write modified save track block back to global array
        let offset = self.primary_save_offset;
        self.bytes[offset..offset + 0xe000].copy_from_slice(&primary_bytes);
        self.primary_save.bytes = primary_bytes;
    }

    pub fn get_mon_at(&self, box_num: usize, box_slot: usize) -> Option<&Pk3> {
        self.boxes.get(box_num)?.box_slots.get(box_slot)?.as_ref()
    }

    pub fn set_mon_at(&mut self, box_num: usize, box_slot: usize, mon: Option<Pk3>) {
        if let Some(target_box) = self.boxes.get_mut(box_num) {
            if let Some(target_slot) = target_box.box_slots.get_mut(box_slot) {
                *target_slot = mon;
                self.updated_box_slots.push(BoxAndSlot {
                    box_idx: box_num,
                    slot_idx: box_slot,
                });
            }
        }
    }
}

#[cfg(test)]
impl crate::tests::PkhexSaveJson for G3Sav {
    fn to_pkhex_save_json_value(&self) -> Result<serde_json::Value, serde_json::Error> {
        use crate::tests::PkhexJson;

        serde_json::to_value(serde_json::json!({
            "trainer": {
                "name": self.name,
                "tid": self.tid,
                "sid": self.sid,
                "display_id": self.display_id,
                "money": self.money,
            },
            "party": Vec::<serde_json::Value>::new(),
            "boxes": self.boxes.iter().enumerate().map(|(b_idx, pc_box)| {
                serde_json::json!({
                    "box_index": b_idx,
                    "pokemon": pc_box.box_slots.iter()
                        .flatten()
                        .map(|mon: &Pk3| {
                            mon.to_pkhex_json_value()
                                .unwrap_or(serde_json::Value::Null)
                        })
                        .collect::<Vec<serde_json::Value>>()
                })
            }).collect::<Vec<serde_json::Value>>()
        }))
    }
}

#[cfg(test)]
mod tests {
    use std::path::Path;

    #[test]
    fn test_firered_save_against_pkhex_json() {
        // The helpers automatically look inside "test-files/save-files/" and "test-files/pkhex-json/"
        let save_path = Path::new("gen3-hoenn").join("emerald.sav");
        let json_path = Path::new("gen3-hoenn").join("emerald.json");

        if let Err(e) = crate::tests::compare_pkhex_save_json(&save_path, &json_path) {
            panic!("Save validation failed!\n{:?}", e);
        }
    }
}
