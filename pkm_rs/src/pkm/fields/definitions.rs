use pkm_rs_resources::{
    abilities::AbilityIndex,
    natures::{InvalidNatureIndex, NatureIndex},
    species::{InvalidNatDexIndex, InvalidSpeciesForme, NatDexIndex, SpeciesAndForme},
};
use pkm_rs_types::strings::SizedUtf16String;

use crate::pkm::fields::{InfallibleField, ValidatedField, byte_serializable::InvalidZeroValue};

macro_rules! define_field {
    ($name:ident, $type:ty, $err_type:ty) => {
        pub struct $name;
        impl ValidatedField for $name {
            type Err = $err_type;
            type DataType = $type;

            fn name() -> &'static str {
                "$name"
            }
        }
    };
}

macro_rules! define_field_infallible {
    ($name:ident, $type:ty) => {
        pub struct $name;
        impl InfallibleField for $name {
            type DataType = $type;

            fn name() -> &'static str {
                "$name"
            }
        }
    };
}

define_field!(Ability, AbilityIndex, InvalidZeroValue);
define_field_infallible!(EncryptionConstant, u32);
define_field!(NationalDex, NatDexIndex, InvalidNatDexIndex);
define_field!(Nature, NatureIndex, InvalidNatureIndex);
define_field_infallible!(NicknameUtf16, SizedUtf16String<26>);
define_field_infallible!(PersonalityValue, u32);
define_field_infallible!(SecretId, u16);
define_field_infallible!(TrainerId, u16);
define_field_infallible!(PokerusByte, u8);
