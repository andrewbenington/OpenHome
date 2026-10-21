use crate::levelup::{LevelupLearnsetFileReader, LevelupLearnsetReader};
use crate::pkhex_bin::{LA_LEVELUP_PKL, LA_MASTERY_PKL, LA_PERSONAL_FILE};
use crate::species::metadata_table::{BaseStats, GameMetadata, PersonalInfo};
use pkm_rs_types::{NationalDex, PkmType, Stats8};

const LA_ENTRY_SIZE: usize = 0xB0;

type GameMetadataLa = GameMetadata<PersonalInfoLa, LA_ENTRY_SIZE>;

pub static METADATA_TABLE_LA: GameMetadataLa =
    GameMetadataLa::from_binary(LA_PERSONAL_FILE, LA_LEVELUP_PKL, "Legends Arceus");

const LA_MOVE_MASTERY: LevelupLearnsetFileReader =
    LevelupLearnsetFileReader::from_pkl(LA_MASTERY_PKL);

pub fn get_levelup_mastery(national_dex: u16, form_index: u16) -> Option<LevelupLearnsetReader> {
    LA_MOVE_MASTERY.learnset_at_index(
        METADATA_TABLE_LA
            .personal
            .get_game_index(national_dex, form_index)?,
    )
}

const MAX_NATIONAL_DEX: NationalDex = NationalDex::Enamorus;

#[derive(Debug, Clone, Copy)]
pub struct PersonalInfoLa([u8; LA_ENTRY_SIZE]);

impl PersonalInfoLa {
    pub fn from_pkl_bytes(bytes: &[u8]) -> Self {
        Self(bytes.try_into().unwrap())
    }

    pub fn stats(&self) -> Stats8 {
        Stats8::from_bytes(self.0[0..6].try_into().unwrap())
    }

    pub fn forms_offset(&self) -> Option<u16> {
        // while other modern games store -1 (0xff) for mons not present, legends arceus stores 0
        let stored_index = u16::from_le_bytes(self.0[0x1E..0x20].try_into().unwrap());
        if stored_index == 0 {
            None
        } else {
            Some(stored_index)
        }
    }

    pub fn game_index_for_form(&self, national_dex: u16, form_index: u16) -> Option<u16> {
        if national_dex > MAX_NATIONAL_DEX as u16 {
            None
        } else if form_index == 0 {
            Some(national_dex)
        } else {
            self.forms_offset()
                .map(|forms_offset| forms_offset + form_index - 1)
        }
    }

    pub const fn form_count(&self) -> u8 {
        self.0[0x1A]
    }

    const fn is_present_in_game(&self) -> bool {
        ((self.0[0x21] >> 6) & 1) == 1
    }
}

impl PersonalInfo for PersonalInfoLa {
    const MAX_NATIONAL_DEX: NationalDex = NationalDex::Enamorus;

    fn from_pkl_bytes(bytes: &'static [u8]) -> Self {
        Self::from_pkl_bytes(bytes)
    }

    fn stats(&self) -> BaseStats {
        BaseStats::Modern(self.stats())
    }

    fn types_fallible(&self) -> (Option<PkmType>, Option<PkmType>) {
        (PkmType::from_byte(self.0[6]), PkmType::from_byte(self.0[7]))
    }

    fn game_index_for_form(&self, national_dex: u16, form_index: u16) -> Option<u16> {
        self.game_index_for_form(national_dex, form_index)
    }

    fn source_name(&self) -> &'static str {
        "Legends: Arceus"
    }

    fn form_is_present_in_game(&self, national_dex: u16, form_index: u16) -> bool {
        // I don't like having to go back and reference the whole table, but there is no other way. This is how PKHeX does it too. The table is full of dummy forms that are considered "in the game" just going off the is_present_in_game function
        self.is_present_in_game()
            && METADATA_TABLE_LA
                .get_game_index(national_dex, form_index)
                .is_some()
    }
}

#[cfg(test)]
mod tests {
    use pkm_rs_types::form;

    use crate::species::metadata_table::MetadataTable;

    use super::*;

    #[test]
    fn spiky_pichu_not_present() {
        let index = METADATA_TABLE_LA.get_game_index(NationalDex::Pichu as u16, 1);

        assert!(index.is_none());
    }

    type FormIndex = u16;

    #[test]
    fn supported_pokemon_are_present() -> Result<(), String> {
        let forms: &'static [(NationalDex, FormIndex)] = &[
            (NationalDex::Vulpix, form::VULPIX_ALOLA),
            (NationalDex::Ninetales, form::NINETALES_ALOLA),
            (NationalDex::Typhlosion, form::TYPHLOSION_HISUI),
            (NationalDex::Qwilfish, form::QWILFISH_HISUI),
            (NationalDex::Unown, form::UNOWN_EXCLAMATION),
            (NationalDex::Unown, form::UNOWN_QUESTION),
            (NationalDex::Arceus, form::ARCEUS_LEGEND),
            (NationalDex::Samurott, form::SAMUROTT_HISUI),
            (NationalDex::Lilligant, form::LILLIGANT_HISUI),
            (NationalDex::Basculin, form::BASCULIN_WHITE_STRIPE),
            (NationalDex::Zorua, form::ZORUA_HISUI),
            (NationalDex::Zoroark, form::ZORUA_HISUI),
            (NationalDex::Braviary, form::BRAVIARY_HISUI),
            (NationalDex::Sliggoo, form::SLIGGOO_HISUI),
            (NationalDex::Goodra, form::GOODRA_HISUI),
            (NationalDex::Avalugg, form::AVALUGG_HISUI),
            (NationalDex::Decidueye, form::DECIDUEYE_HISUI),
            (NationalDex::Enamorus, form::ENAMORUS_INCARNATE),
        ];

        for (national_dex, form_index) in forms {
            if !METADATA_TABLE_LA.form_is_present(*national_dex as u16, *form_index) {
                let metadata = crate::species::metadata_lookup(*national_dex as u16, *form_index);
                return Err(format!(
                    "form '{}' should be present in Legends Arceus, but METADATA_TABLE_LA.form_is_present returned false",
                    metadata.map_or("(unknown form)", |m| m.form_name)
                ));
            }
        }

        Ok(())
    }

    #[test]
    fn unsupported_pokemon_not_present() -> Result<(), String> {
        let forms: &'static [(NationalDex, FormIndex)] = &[
            (NationalDex::Ponyta, form::PONYTA_GALAR),
            (NationalDex::Pichu, form::PICHU_SPIKY_EARED),
            (NationalDex::Lopunny, form::LOPUNNY_MEGA),
            (NationalDex::Clefable, form::CLEFABLE_MEGA),
        ];

        for (national_dex, form_index) in forms {
            if METADATA_TABLE_LA.form_is_present(*national_dex as u16, *form_index) {
                let metadata = crate::species::metadata_lookup(*national_dex as u16, *form_index);
                return Err(format!(
                    "form '{}' should not be present in Legends Arceus, but METADATA_TABLE_LA.form_is_present returned true",
                    metadata.map_or("(unknown form)", |m| m.form_name)
                ));
            }
        }

        Ok(())
    }
}
