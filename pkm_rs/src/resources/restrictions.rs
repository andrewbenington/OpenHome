use std::collections::{HashMap, HashSet};

use crate::resources::NatDexIndex;

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

const PICHU: NatDexIndex = unsafe { NatDexIndex::new_unchecked(172) };
const SPIKY_EAR: u16 = 1;

pub struct FormeRestrictions(HashMap<NatDexIndex, Box<[u16]>>);
