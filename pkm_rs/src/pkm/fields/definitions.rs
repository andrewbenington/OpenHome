use pkm_rs_resources::{
    abilities::{AbilityIndex, InvalidAbilityIndex},
    ball::{Ball, InvalidBallIndex},
    natures::{InvalidNatureIndex, NatureIndex},
    species::{InvalidNatDexIndex, NatDexIndex},
};
use pkm_rs_types::strings::SizedUtf16String;

use crate::pkm::fields::{
    InfallibleField, ValidatedField,
    byte_serializable::{BitFlag, GenderTwoBits},
};

macro_rules! define_validated_field {
    ($name:ident, $type:ty, $err_type:ty) => {
        pub struct $name;
        impl ValidatedField for $name {
            type Err = $err_type;
            type Repr = $type;

            fn name() -> &'static str {
                "$name"
            }
        }
    };
}

macro_rules! define_infallible_field {
    ($name:ident, $type:ty) => {
        pub struct $name;
        impl InfallibleField for $name {
            type Repr = $type;

            fn name() -> &'static str {
                "$name"
            }
        }
    };
}

pub struct Ability;

impl ValidatedField for Ability {
    type Err = InvalidAbilityIndex;
    type Repr = AbilityIndex;
    fn name() -> &'static str {
        "$name"
    }

    fn try_from_bytes(bytes: &[u8], offset: usize) -> core::result::Result<Self::Repr, Self::Err> {
        AbilityIndex::try_from_index(bytes[offset] as u16)
    }
}

define_validated_field!(AbilityU16, AbilityIndex, InvalidAbilityIndex);
define_infallible_field!(AbilityNumber, u8);
define_infallible_field!(Checksum, u16);
define_infallible_field!(EncryptionConstant, u32);
define_infallible_field!(Experience, u32);
// define_infallible_field!(GenderOffsetOne, GenderTwoBits<1>);
define_infallible_field!(HeldItemIndex, u16);
define_infallible_field!(IsFatefulEncounter, BitFlag<0>);
define_infallible_field!(MarkingsSixShapesColors, [u8; 3]);
define_validated_field!(NationalDex, NatDexIndex, InvalidNatDexIndex);
define_validated_field!(Nature, NatureIndex, InvalidNatureIndex);
define_infallible_field!(NicknameUtf16, SizedUtf16String<26>);
define_infallible_field!(PersonalityValue, u32);
define_validated_field!(PokeBall, Ball, InvalidBallIndex);
define_infallible_field!(SecretId, u16);
define_infallible_field!(TrainerId, u16);
define_infallible_field!(PokerusByte, u8);

// seems like the error type should always be derivable from the Repr/Datatype? e.g. NatureIndex will always yield an error of InvalidNatureIndex, etc
