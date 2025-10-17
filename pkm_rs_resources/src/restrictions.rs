use std::collections::{HashMap, HashSet};

use crate::species::NatDexIndex;

pub enum PkmRestrictions {
    CappedNationalDex {
        max_national_dex: NatDexIndex,
        excluded_formes: HashMap<NatDexIndex, Box<[u16]>>,
    },
    Dexit {
        included_national_dex: HashSet<NatDexIndex>,
        excluded_formes: HashMap<NatDexIndex, Box<[u16]>>,
    },
}
