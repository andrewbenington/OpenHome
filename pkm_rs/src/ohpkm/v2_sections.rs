#[allow(deprecated)]
use crate::ohpkm::deprecated::PastHandlerDataV1;
use crate::ohpkm::v1::OhpkmV1;
use crate::ohpkm::v2::OhpkmSectionTag;
use crate::result::{Error, Result, StringErrorSource};
use crate::sectioned_data::DataSection;
use crate::traits::{OhpkmByte, OhpkmBytes};
use crate::util;

use pkm_rs_resources::species::SpeciesAndForm;
use pkm_rs_types::Language;
use pkm_rs_types::strings::SizedUtf16String;
use pkm_rs_types::{FlagSet, Geolocations, TeraType};
use pkm_rs_types::{Gender, OriginGame, TrainerMemory};
use pkm_rs_types::{Stats8, Stats16Le, TrainerData};
use serde::Deserialize;
use serde::Serialize;
use std::num::NonZeroU16;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

mod gameboy_data;
mod gen45_data;
mod main_data;

pub mod pkm_bytes;

pub use gameboy_data::GameboyData;
pub use gen45_data::Gen45Data;
pub use main_data::MainDataV2;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

fn bytes_are_empty(bytes: &[u8]) -> bool {
    bytes.iter().all(|b| *b == 0)
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct Gen67Data {
    pub training_bag_hits: u8,
    pub training_bag: u8,
    pub super_training_flags: u32,
    pub super_training_dist_flags: u8,
    pub secret_super_training_unlocked: bool,
    pub secret_super_training_complete: bool,
    pub country: u8,
    pub region: u8,
    pub geolocations: Geolocations,
    pub resort_event_status: u8,
    pub avs: Stats16Le,
}

impl Gen67Data {
    pub fn from_v1(old: super::v1::OhpkmV1) -> Option<Self> {
        if !old.game_of_origin.is_3ds()
            && !old.game_of_origin.is_lets_go()
            && old.training_bag == 0
            && old.training_bag_hits == 0
            && old.super_training_flags == 0
            && old.super_training_dist_flags == 0
            && !old.secret_super_training_unlocked
            && !old.secret_super_training_complete
            && old.country == 0
            && old.region == 0
            && bytes_are_empty(&old.geolocations.to_bytes())
            && old.resort_event_status == 0
            && bytes_are_empty(&old.avs.to_bytes())
        {
            None
        } else {
            Some(Self {
                training_bag_hits: old.training_bag_hits,
                training_bag: old.training_bag,
                super_training_flags: old.super_training_flags,
                super_training_dist_flags: old.super_training_dist_flags,
                secret_super_training_unlocked: old.secret_super_training_unlocked,
                secret_super_training_complete: old.secret_super_training_complete,
                country: old.country,
                region: old.region,
                geolocations: old.geolocations,
                resort_event_status: old.resort_event_status,
                avs: old.avs,
            })
        }
    }
}

impl DataSection for Gen67Data {
    type TagType = OhpkmSectionTag;
    const TAG: Self::TagType = OhpkmSectionTag::Gen67Data;

    type ErrorType = Error;
    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::ensure_buffer_size(bytes);

        Ok(Self {
            training_bag_hits: bytes[0],
            training_bag: bytes[1],
            super_training_flags: u32::from_le_bytes(bytes[2..6].try_into().unwrap()),
            super_training_dist_flags: bytes[6],
            secret_super_training_unlocked: util::get_flag(bytes, 7, 0),
            secret_super_training_complete: util::get_flag(bytes, 7, 1),
            country: bytes[8],
            region: bytes[9],
            geolocations: Geolocations::from_bytes(bytes[10..20].try_into().unwrap()),
            resort_event_status: bytes[20],
            avs: Stats16Le::from_bytes(bytes[21..33].try_into().unwrap()),
        })
    }

    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = [0u8; 33];

        bytes[0] = self.training_bag_hits;
        bytes[1] = self.training_bag;
        bytes[2..6].copy_from_slice(&self.super_training_flags.to_le_bytes());
        bytes[6] = self.super_training_dist_flags;
        util::set_flag(&mut bytes, 7, 0, self.secret_super_training_unlocked);
        util::set_flag(&mut bytes, 7, 1, self.secret_super_training_complete);
        bytes[8] = self.country;
        bytes[9] = self.region;
        bytes[10..20].copy_from_slice(&self.geolocations.to_bytes());
        bytes[20] = self.resort_event_status;
        bytes[21..33].copy_from_slice(&self.avs.to_bytes());

        bytes.to_vec()
    }

    fn is_empty(&self) -> bool {
        self.training_bag == 0
            && self.training_bag_hits == 0
            && self.super_training_flags == 0
            && self.super_training_dist_flags == 0
            && !self.secret_super_training_unlocked
            && !self.secret_super_training_complete
            && self.country == 0
            && self.region == 0
            && bytes_are_empty(&self.geolocations.to_bytes())
            && self.resort_event_status == 0
            && bytes_are_empty(&self.avs.to_bytes())
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct SwordShieldData {
    pub can_gigantamax: bool,
    pub dynamax_level: u8,
    pub palma: u32,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub tr_flags: [u8; 14],
}

impl SwordShieldData {
    pub fn from_v1(old: super::v1::OhpkmV1) -> Option<Self> {
        if !old.game_of_origin.is_swsh()
            && !old.can_gigantamax
            && old.palma == 0
            && old.dynamax_level == 0
            && bytes_are_empty(&old.tr_flags_swsh)
        {
            None
        } else {
            Some(Self {
                can_gigantamax: old.can_gigantamax,
                palma: old.palma,
                dynamax_level: old.dynamax_level,
                tr_flags: old.tr_flags_swsh,
            })
        }
    }
}

impl DataSection for SwordShieldData {
    type TagType = OhpkmSectionTag;
    const TAG: Self::TagType = OhpkmSectionTag::SwordShield;

    type ErrorType = Error;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::ensure_buffer_size(bytes);

        // try_into() will always succeed thanks to the buffer size check
        Ok(Self {
            can_gigantamax: util::get_flag(bytes, 0, 0),
            dynamax_level: bytes[1],
            palma: u32::from_le_bytes(bytes[2..6].try_into().unwrap()),
            tr_flags: bytes[6..20].try_into().unwrap(),
        })
    }

    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = [0u8; 20];

        util::set_flag(&mut bytes, 0, 0, self.can_gigantamax);
        bytes[1] = self.dynamax_level;
        bytes[2..6].copy_from_slice(&self.palma.to_le_bytes());
        bytes[6..20].copy_from_slice(&self.tr_flags);

        bytes.to_vec()
    }

    fn is_empty(&self) -> bool {
        !self.can_gigantamax
            && self.palma == 0
            && self.dynamax_level == 0
            && bytes_are_empty(&self.tr_flags)
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct BdspData {
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub tm_flags: FlagSet<14>,
}

impl BdspData {
    pub fn from_v1(old: super::v1::OhpkmV1) -> Option<Self> {
        if !old.game_of_origin.is_bdsp() && bytes_are_empty(&old.tm_flags_bdsp) {
            None
        } else {
            Some(Self {
                tm_flags: FlagSet::from_bytes(old.tm_flags_bdsp),
            })
        }
    }
}

impl DataSection for BdspData {
    type TagType = OhpkmSectionTag;
    const TAG: Self::TagType = OhpkmSectionTag::BdspTmFlags;

    type ErrorType = Error;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::ensure_buffer_size(bytes);

        // try_into() will always succeed thanks to the buffer size check
        Ok(Self {
            tm_flags: FlagSet::from_bytes(bytes[0..14].try_into().unwrap()),
        })
    }

    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = [0u8; 14];

        bytes.copy_from_slice(&self.tm_flags.to_bytes());

        bytes.to_vec()
    }

    fn is_empty(&self) -> bool {
        self.tm_flags.is_empty()
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct LegendsArceusData {
    pub gvs: Stats8,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub move_flags: FlagSet<14>,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub tutor_flags: FlagSet<8>,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub master_flags: FlagSet<8>,
    pub is_alpha: bool,
    pub is_noble: bool,
    pub alpha_move: u16,
    pub flag2: bool,
    pub unknown_a0: u32,
    pub unknown_f3: u8,
}

impl LegendsArceusData {
    pub fn from_v1(old: super::v1::OhpkmV1) -> Option<Self> {
        if old.game_of_origin != OriginGame::LegendsArceus
            && !old.is_alpha
            && !old.is_noble
            && bytes_are_empty(&old.move_flags_la)
            && bytes_are_empty(&old.tutor_flags_la)
            && bytes_are_empty(&old.master_flags_la)
        {
            None
        } else {
            Some(Self {
                gvs: old.gvs,
                alpha_move: old.alpha_move,
                move_flags: FlagSet::from_bytes(old.move_flags_la),
                tutor_flags: FlagSet::from_bytes(old.tutor_flags_la),
                master_flags: FlagSet::from_bytes(old.master_flags_la),
                is_alpha: old.is_alpha,
                is_noble: old.is_noble,
                flag2: old.flag2_la,
                unknown_f3: old.unknown_f3,
                unknown_a0: old.unknown_a0,
            })
        }
    }
}

impl DataSection for LegendsArceusData {
    type TagType = OhpkmSectionTag;
    const TAG: Self::TagType = OhpkmSectionTag::LegendsArceus;

    type ErrorType = Error;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::ensure_buffer_size(bytes);

        // try_into() will always succeed thanks to the buffer size check
        Ok(Self {
            gvs: Stats8::from_bytes(bytes[0..6].try_into().unwrap()),
            alpha_move: u16::from_le_bytes(bytes[6..8].try_into().unwrap()),
            move_flags: FlagSet::from_bytes(bytes[8..22].try_into().unwrap()),
            tutor_flags: FlagSet::from_bytes(bytes[22..30].try_into().unwrap()),
            master_flags: FlagSet::from_bytes(bytes[30..38].try_into().unwrap()),
            is_alpha: util::get_flag(bytes, 38, 0),
            is_noble: util::get_flag(bytes, 38, 1),
            flag2: util::get_flag(bytes, 38, 2),
            unknown_f3: bytes[39],
            unknown_a0: u32::from_le_bytes(bytes[40..44].try_into().unwrap()),
        })
    }

    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = [0u8; 44];

        bytes[0..6].copy_from_slice(&self.gvs.to_bytes());
        bytes[6..8].copy_from_slice(&self.alpha_move.to_le_bytes());
        bytes[8..22].copy_from_slice(&self.move_flags.to_bytes());
        bytes[22..30].copy_from_slice(&self.tutor_flags.to_bytes());
        bytes[30..38].copy_from_slice(&self.master_flags.to_bytes());
        util::set_flag(&mut bytes, 38, 0, self.is_alpha);
        util::set_flag(&mut bytes, 38, 1, self.is_noble);
        util::set_flag(&mut bytes, 38, 2, self.flag2);
        bytes[39] = self.unknown_f3;
        bytes[40..44].copy_from_slice(&self.unknown_a0.to_le_bytes());

        bytes.to_vec()
    }

    fn is_empty(&self) -> bool {
        !self.is_alpha
            && !self.is_noble
            && self.move_flags.is_empty()
            && self.master_flags.is_empty()
            && self.tutor_flags.is_empty()
    }
}

#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct ScarletVioletData {
    pub tera_type_original: TeraType,
    pub tera_type_override: Option<TeraType>,
    pub tm_flags: FlagSet<22>,
    pub tm_flags_dlc: FlagSet<13>,
}

impl ScarletVioletData {
    pub fn from_v1(old: super::v1::OhpkmV1) -> Option<Self> {
        let tera_type_original = TeraType::from_byte(old.tera_type_original)?;
        let tera_type_override = TeraType::from_byte(old.tera_type_override);

        if !old.game_of_origin.is_scarlet_violet()
            && tera_type_override.is_none()
            && bytes_are_empty(&old.tm_flags_sv)
            && bytes_are_empty(&old.tm_flags_sv_dlc)
        {
            None
        } else {
            Some(Self {
                tera_type_original,
                tera_type_override,
                tm_flags: FlagSet::from_bytes(old.tm_flags_sv),
                tm_flags_dlc: FlagSet::from_bytes(old.tm_flags_sv_dlc),
            })
        }
    }

    pub fn default_generated_tera_type(species_and_form: SpeciesAndForm) -> Self {
        Self {
            tera_type_original: species_and_form
                .get_forme_metadata()
                .transferred_tera_type(),
            ..Default::default()
        }
    }
}

impl DataSection for ScarletVioletData {
    type TagType = OhpkmSectionTag;
    const TAG: Self::TagType = OhpkmSectionTag::ScarletViolet;

    type ErrorType = Error;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::ensure_buffer_size(bytes);

        // try_into() will always succeed thanks to the buffer size check
        let tera_type_original = TeraType::from_byte(bytes[0]).ok_or(Error::Other(format!(
            "Invalid original tera type index: {}",
            bytes[0]
        )))?;

        Ok(Self {
            tera_type_original,
            tera_type_override: TeraType::from_byte(bytes[1]),
            tm_flags: FlagSet::from_bytes(bytes[2..24].try_into().unwrap()),
            tm_flags_dlc: FlagSet::from_bytes(bytes[24..37].try_into().unwrap()),
        })
    }

    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = [0u8; 37];

        bytes[0] = self.tera_type_original.to_byte();
        bytes[1] = self.tera_type_override.map_or(0, TeraType::to_byte);
        bytes[2..24].copy_from_slice(&self.tm_flags.to_bytes());
        bytes[24..37].copy_from_slice(&self.tm_flags_dlc.to_bytes());

        bytes.to_vec()
    }

    fn is_empty(&self) -> bool {
        self.tera_type_override.is_none()
            && self.tm_flags.is_empty()
            && self.tm_flags_dlc.is_empty()
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Serialize, Clone)]
pub struct PastHandlerDataV2 {
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub id: Option<NonZeroU16>,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub secret_id: Option<NonZeroU16>,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub name: SizedUtf16String<26>,
    pub friendship: u8,
    pub memory: TrainerMemory,
    pub affection: u8,
    pub gender: Gender,
    pub language: Language,
    pub origin_game: Option<OriginGame>,
    #[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
    pub origin_plugin: Option<String>,
}

impl PastHandlerDataV2 {
    #[allow(deprecated)]
    pub fn from_v1(old: PastHandlerDataV1) -> Self {
        Self {
            id: old.id,
            secret_id: old.secret_id,
            name: old.name,
            friendship: old.friendship,
            memory: old.memory,
            affection: old.affection,
            gender: old.gender,
            language: Language::None,
            origin_game: old.origin_game,
            origin_plugin: old.origin_plugin,
        }
    }

    pub fn from_ohpkm_v1(old: OhpkmV1) -> Option<Self> {
        if !old.handler_name.is_empty() {
            Some(Self {
                id: NonZeroU16::new(old.handler_id),
                secret_id: None,
                name: old.handler_name,
                friendship: old.handler_friendship,
                memory: old.handler_memory,
                affection: old.handler_affection,
                gender: Gender::from(old.handler_gender),
                language: old.handler_language.try_into().unwrap_or(Language::None),
                origin_game: None,
                origin_plugin: None,
            })
        } else {
            None
        }
    }

    pub fn known_trainer_data_matches(
        &self,
        tid: u16,
        sid: u16,
        game: OriginGame,
        plugin: &Option<String>,
    ) -> bool {
        self.id.is_some_and(|t| t.get() == tid)
            && self.secret_id.is_some_and(|s| s.get() == sid)
            && self.origin_game.is_some_and(|g| g == game)
            && self.origin_plugin == *plugin
    }

    pub fn unknown_trainer_data_matches(
        &self,
        name: &SizedUtf16String<26>,
        gender: Gender,
    ) -> bool {
        self.gender == gender && self.name == *name && self.origin_game.is_none()
    }

    pub fn update_from(&mut self, other: &TrainerData, plugin: Option<String>) {
        self.id = NonZeroU16::new(other.id);
        self.secret_id = NonZeroU16::new(other.secret_id);
        self.friendship = other.friendship;
        self.memory = other.memory;
        self.affection = other.affection;
        self.origin_game = other.origin_game;
        self.origin_plugin = plugin;
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
#[allow(clippy::missing_const_for_fn)]
#[allow(clippy::too_many_arguments)]
impl PastHandlerDataV2 {
    #[wasm_bindgen(getter)]
    pub fn id(&self) -> Option<u16> {
        self.id.map(NonZeroU16::get)
    }

    #[wasm_bindgen(setter)]
    pub fn set_id(&mut self, value: u16) {
        self.id = NonZeroU16::new(value)
    }

    #[wasm_bindgen(getter)]
    pub fn name(&self) -> String {
        self.name.to_string()
    }

    #[wasm_bindgen(getter = secretId)]
    pub fn secret_id(&self) -> u16 {
        self.secret_id.map(NonZeroU16::get).unwrap_or(0)
    }

    #[wasm_bindgen(setter = secretId)]
    pub fn set_secret_id(&mut self, value: u16) {
        self.secret_id = NonZeroU16::new(value)
    }

    #[wasm_bindgen(constructor)]
    pub fn new(
        id: Option<u16>,
        secret_id: Option<u16>,
        name: String,
        friendship: u8,
        memory: Option<TrainerMemory>,
        affection: u8,
        gender: Gender,
        language: Language,
        origin_game: Option<OriginGame>,
        origin_plugin: Option<String>,
    ) -> Self {
        Self {
            id: id.and_then(NonZeroU16::new),
            secret_id: secret_id.and_then(NonZeroU16::new),
            name: name.into(),
            friendship,
            memory: memory.unwrap_or_default(),
            affection,
            gender,
            language,
            origin_game,
            origin_plugin,
        }
    }
}

impl From<TrainerData> for PastHandlerDataV2 {
    fn from(other: TrainerData) -> Self {
        Self {
            id: NonZeroU16::new(other.id),
            secret_id: NonZeroU16::new(other.secret_id),
            name: other.name,
            gender: other.gender,
            friendship: other.friendship,
            memory: other.memory,
            affection: other.affection,
            language: other.language,
            origin_game: other.origin_game,
            origin_plugin: None,
        }
    }
}

impl DataSection for PastHandlerDataV2 {
    type TagType = OhpkmSectionTag;
    const TAG: Self::TagType = OhpkmSectionTag::PastHandlerV2;

    type ErrorType = Error;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        let origin_plugin = if bytes.len() > OhpkmSectionTag::PastHandlerV2.min_size() {
            String::from_utf8(bytes[OhpkmSectionTag::PastHandlerV2.min_size()..].to_vec()).ok()
        } else {
            None
        };

        Ok(Self {
            id: Option::<NonZeroU16>::from_ohpkm_bytes(bytes[0..=1].try_into().unwrap()),
            secret_id: Option::<NonZeroU16>::from_ohpkm_bytes(bytes[2..=3].try_into().unwrap()),
            name: SizedUtf16String::<26>::from_bytes(bytes[4..=29].try_into().unwrap()),
            friendship: bytes[30],
            memory: TrainerMemory::from_bytes_in_order(bytes[31..=35].try_into().unwrap()),
            affection: bytes[36],
            gender: Gender::from_u8(bytes[37]),
            language: Language::try_from(bytes[38]).unwrap_or(Language::None),
            origin_game: Option::<OriginGame>::from_ohpkm_byte(bytes[39]),
            origin_plugin,
        })
    }

    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = [0u8; 40];

        bytes[0..=1].copy_from_slice(&self.id.to_ohpkm_bytes());
        bytes[2..=3].copy_from_slice(&self.secret_id.to_ohpkm_bytes());
        bytes[4..=29].copy_from_slice(&self.name.bytes());
        bytes[30] = self.friendship;
        bytes[31..=35].copy_from_slice(&self.memory.to_bytes_in_order());
        bytes[36] = self.affection;
        bytes[37] = self.gender.to_byte();
        bytes[38] = self.language as u8;
        bytes[39] = self.origin_game.to_ohpkm_byte();

        let mut vec = bytes.to_vec();

        if let Some(origin_plugin) = &self.origin_plugin {
            vec.extend_from_slice(origin_plugin.as_bytes());
        }

        vec
    }

    fn is_empty(&self) -> bool {
        self.name.is_empty()
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Clone, Serialize)]
pub struct MostRecentSave {
    pub trainer_id: u16,
    pub secret_id: u16,
    pub game: OriginGame,
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub trainer_name: SizedUtf16String<26>,
    #[cfg_attr(feature = "wasm", wasm_bindgen(getter_with_clone))]
    pub file_path: String,
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
#[allow(clippy::missing_const_for_fn)]
#[allow(clippy::too_many_arguments)]
impl MostRecentSave {
    #[wasm_bindgen(getter)]
    pub fn trainer_name(&self) -> String {
        self.trainer_name.to_string()
    }
}

impl DataSection for MostRecentSave {
    type TagType = OhpkmSectionTag;
    const TAG: Self::TagType = OhpkmSectionTag::MostRecentSave;

    type ErrorType = Error;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::ensure_buffer_size(bytes);

        let trainer_id = u16::from_le_bytes(bytes[0..=1].try_into().unwrap());
        let secret_id = u16::from_le_bytes(bytes[2..=3].try_into().unwrap());
        let game = OriginGame::from(bytes[4]);
        let trainer_name = SizedUtf16String::<26>::from_bytes(bytes[5..=30].try_into().unwrap());

        let file_path =
            String::from_utf8(bytes[31..].to_vec()).map_err(|e| Error::StringDecode {
                source: StringErrorSource::MostRecentSaveFilePath(e),
            })?;

        Ok(Self {
            trainer_id,
            secret_id,
            game,
            trainer_name,
            file_path,
        })
    }

    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = Vec::new();

        bytes.extend_from_slice(&self.trainer_id.to_le_bytes());
        bytes.extend_from_slice(&self.secret_id.to_le_bytes());
        bytes.push(self.game as u8);
        bytes.extend_from_slice(&self.trainer_name.bytes());
        bytes.extend_from_slice(self.file_path.as_bytes());

        bytes
    }

    fn is_empty(&self) -> bool {
        self.file_path.is_empty()
    }
}

#[cfg_attr(feature = "randomize", derive(Randomize))]
#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Default, Clone, Serialize)]
pub struct PluginData {
    #[cfg_attr(feature = "wasm", wasm_bindgen(skip))]
    pub plugin_origin: String,
}

impl PluginData {
    pub fn from_v1(old: super::v1::OhpkmV1) -> Option<Self> {
        if old.plugin_origin.is_empty() {
            None
        } else {
            Some(Self::from_origin(old.plugin_origin.to_string()))
        }
    }

    fn try_from_origin_utf8(origin_bytes: &[u8]) -> Result<Self> {
        String::from_utf8(origin_bytes.to_vec())
            .map(Self::from_origin)
            .map_err(Error::plugin_origin)
    }

    const fn from_origin(plugin_origin: String) -> Self {
        Self { plugin_origin }
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
#[allow(clippy::missing_const_for_fn)]
impl PluginData {
    #[wasm_bindgen(getter = pluginOrigin)]
    pub fn plugin_origin(&self) -> String {
        self.plugin_origin.clone()
    }

    #[wasm_bindgen(setter = pluginOrigin)]
    pub fn set_plugin_origin(&mut self, value: String) {
        self.plugin_origin = value;
    }
}

impl DataSection for PluginData {
    type TagType = OhpkmSectionTag;
    const TAG: Self::TagType = OhpkmSectionTag::PluginData;

    type ErrorType = Error;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::ensure_buffer_size(bytes);

        Self::try_from_origin_utf8(bytes)
    }

    fn is_empty(&self) -> bool {
        false
    }

    fn to_bytes(&self) -> Vec<u8> {
        self.plugin_origin.clone().into_bytes()
    }
}

#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Default, Clone, Serialize)]
pub struct Notes(pub String);

impl DataSection for Notes {
    type TagType = OhpkmSectionTag;
    const TAG: Self::TagType = OhpkmSectionTag::Notes;

    type ErrorType = Error;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::ensure_buffer_size(bytes);

        String::from_utf8(bytes.to_vec())
            .map(Notes)
            .map_err(|e| Error::StringDecode {
                source: StringErrorSource::Notes(e),
            })
    }

    fn to_bytes(&self) -> Vec<u8> {
        self.0.clone().into_bytes()
    }

    fn is_empty(&self) -> bool {
        self.0.is_empty()
    }
}

/// Custom tags for a Pokemon (label + CSS color string + optional icon)
/// Stored as JSON string
#[derive(Debug, Default, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct MonTag {
    pub label: String,
    pub color: String,
    pub icon: Option<String>,
}

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct MonTags(pub Vec<MonTag>);

impl DataSection for MonTags {
    type TagType = OhpkmSectionTag;
    const TAG: Self::TagType = OhpkmSectionTag::Tag;

    type ErrorType = Error;

    fn from_bytes(bytes: &[u8]) -> Result<Self> {
        Self::ensure_buffer_size(bytes);
        let tags: Vec<MonTag> = serde_json::from_slice(bytes).unwrap_or_default();
        Ok(Self(tags))
    }

    fn to_bytes(&self) -> Vec<u8> {
        serde_json::to_vec(&self.0).unwrap_or_default()
    }

    fn is_empty(&self) -> bool {
        self.0.is_empty()
    }
}
