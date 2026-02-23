use crate::pkm::{
    OhpkmV2, Pkm,
    ohpkm::v2_sections::{Gen67Data, MainDataV2},
};

pub trait OhpkmConvert: Pkm {
    fn to_main_data(&self) -> MainDataV2;

    fn to_gen_67_data(&self) -> Option<Gen67Data> {
        None
    }

    fn from_ohpkm(ohpkm: &OhpkmV2) -> Self;
}
