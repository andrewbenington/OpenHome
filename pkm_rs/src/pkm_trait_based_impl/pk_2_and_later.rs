use pkm_rs_types::{BinaryGender, Gender};

pub trait Gen2AndLater {

    fn is_bad_egg() -> bool;
    fn is_egg() -> bool;
    fn gender() -> Gender;
}