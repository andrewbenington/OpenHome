use std::collections::{HashMap, HashSet};

use pkm_rs_types::NationalDex;

pub enum PkmRestrictions {
    CappedNationalDex {
        max_national_dex: NationalDex,
        excluded_formes: HashMap<NationalDex, Box<[u16]>>,
    },
    Dexit {
        included_national_dex: HashSet<NationalDex>,
        excluded_formes: HashMap<NationalDex, Box<[u16]>>,
    },
}
