#[cfg(test)]
use crate::pkm::Pkm;
#[cfg(test)]
use crate::pkm::result::Error;
use crate::pkm::result::Result;
#[cfg(test)]
use std::fs::File;
#[cfg(test)]
use std::io::Read;
#[cfg(test)]
use std::ops::RangeInclusive;
#[cfg(test)]
use std::path::Path;

#[cfg(test)]
fn pkm_from_file<PKM: Pkm>(filename: &str) -> Result<(PKM, Vec<u8>)> {
    let mut file = File::open(filename).map_err(|e| Error::other(&e.to_string()))?;

    let mut contents = Vec::new();
    file.read_to_end(&mut contents)
        .map_err(|e| e.to_string())
        .unwrap();

    let pkm = PKM::from_bytes(&contents)?;

    // match toml::to_string(&pkm) {
    //     Ok(text) => println!("{text}"),
    //     Err(e) => println!("{e}"),
    // }
    Ok((pkm, contents))
}

#[cfg(test)]
pub mod ohpkm {
    use crate::pkm::result::Result;
    use std::path::PathBuf;

    use crate::pkm::OhpkmV2;

    #[test]
    fn to_from_bytes() -> Result<()> {
        super::to_from_bytes_all_in_dir::<OhpkmV2>(&PathBuf::from("pkm_files").join("ohpkm"))
    }
}

#[cfg(test)]
pub mod pb7 {
    use crate::pkm::result::Result;
    use std::path::PathBuf;

    use crate::pkm::Pb7;

    #[test]
    fn to_from_bytes() -> Result<()> {
        super::to_from_bytes_all_in_dir::<Pb7>(&PathBuf::from("pkm_files").join("pb7"))
    }
}

#[cfg(test)]
pub mod pk7 {
    use std::path::PathBuf;

    use crate::pkm::{Pk7, traits::IsShiny};
    use crate::pkm::{result::Result, tests::pkm_from_file};

    #[cfg(feature = "randomize")]
    use pkm_rs_types::randomize::Randomize;
    #[cfg(feature = "randomize")]
    use rand::{SeedableRng, rngs::StdRng};

    #[test]
    fn to_from_bytes() -> Result<()> {
        super::to_from_bytes_all_in_dir::<Pk7>(&PathBuf::from("pkm_files").join("pk7"))
    }

    #[cfg(feature = "randomize")]
    #[test]
    fn to_from_bytes_random() -> Result<()> {
        for i in 0..100 {
            let mon = Pk7::randomized(&mut StdRng::from_seed([i; 32]));
            super::find_inconsistencies_to_from_bytes(mon)?;
        }

        Ok(())
    }

    #[test]
    fn is_shiny() {
        let mon = pkm_from_file::<Pk7>(
            &PathBuf::from("pkm_files")
                .join("pk7")
                .join("slowpoke-shiny.pk7")
                .to_string_lossy(),
        )
        .unwrap()
        .0;
        assert!(mon.is_shiny());
    }
}

#[cfg(test)]
pub mod pk8 {
    use crate::pkm::Pk8;
    use crate::pkm::result::Result;

    use std::path::PathBuf;

    #[cfg(feature = "randomize")]
    use pkm_rs_types::randomize::Randomize;
    #[cfg(feature = "randomize")]
    use rand::{SeedableRng, rngs::StdRng};

    #[test]
    fn to_from_bytes() -> Result<()> {
        super::to_from_bytes_all_in_dir::<Pk8>(&PathBuf::from("pkm_files").join("PK8"))
    }

    #[cfg(feature = "randomize")]
    #[test]
    fn to_from_bytes_random() -> Result<()> {
        for i in 0..100 {
            to_from_bytes_with_seed(i)?;
        }

        Ok(())
    }

    #[cfg(feature = "randomize")]
    fn to_from_bytes_with_seed(seed: u64) -> Result<()> {
        let mut seed_bytes = [0; 32];
        seed_bytes[0..8].copy_from_slice(&seed.to_le_bytes());
        let mon = Pk8::randomized(&mut StdRng::from_seed(seed_bytes));
        super::find_inconsistencies_to_from_bytes(mon)
    }

    #[cfg(feature = "randomize")]
    #[test]
    fn to_from_bytes_specific_seed() -> Result<()> {
        to_from_bytes_with_seed(0)
    }
}

#[cfg(test)]
fn to_from_bytes_all_in_dir<PKM: Pkm>(dir: &Path) -> Result<()> {
    use std::fs;

    let pkm_files =
        fs::read_dir(dir).map_err(|e| Error::other(&format!("directory read error: {e}")))?;
    for dir_entry in pkm_files {
        match dir_entry {
            Err(e) => println!("directory entry error: {e}"),
            Ok(dir_entry) => {
                if dir_entry.file_name().to_string_lossy().starts_with(".") {
                    continue;
                }
                let path = dir.join(dir_entry.file_name());
                let filename = path.to_string_lossy();
                if let Err(e) = find_inconsistencies_from_file::<PKM>(&filename) {
                    return Err(Error::other(&format!("read {filename}: {e}")));
                }
            }
        }
    }

    Ok(())
}

#[cfg(test)]
fn find_differing_ranges(actual: &[u8], expected: &[u8]) -> Option<Vec<ByteRange>> {
    let mut differences: Vec<ByteRange> = Vec::new();

    let mut current_range: Option<ByteRange> = None;

    for (i, (a, b)) in actual.iter().zip(expected.iter()).enumerate() {
        if a != b {
            match &mut current_range {
                Some(existing) => existing.extend_one(),
                None => current_range = Some(ByteRange::new_at(i)),
            }
        } else if let Some(existing) = current_range {
            differences.push(existing);
            current_range = None;
        }
    }

    match differences.len() {
        0 => None,
        _ => Some(differences),
    }
}

#[cfg(test)]
struct ByteRange {
    start_idx: usize,
    end_idx: usize,
}

#[cfg(test)]
impl ByteRange {
    pub const fn new_at(at: usize) -> Self {
        Self {
            start_idx: at,
            end_idx: at,
        }
    }

    pub fn extend_one(&mut self) {
        self.end_idx += 1;
    }

    pub const fn range(&self) -> RangeInclusive<usize> {
        self.start_idx..=self.end_idx
    }
}

#[cfg(test)]
fn u8_slice_to_hex_string(slice: &[u8]) -> String {
    let hexes: Vec<String> = slice.iter().map(|b| format!("0x{:02x}", b)).collect();
    format!("[{}]", hexes.join(", "))
}

#[cfg(test)]
fn find_inconsistencies_from_file<PKM: Pkm>(filename: &str) -> Result<()> {
    use crate::pkm::Error;

    println!("filename: {filename}");
    let result = pkm_from_file::<PKM>(filename);
    let (mon, bytes) = result.unwrap_or_else(|e| panic!("could not load {filename}: {e}"));

    let actual = mon
        .to_party_bytes()
        .map_err(|e| Error::other(&e.to_string()))?;

    let expected = bytes;
    let differences = find_differing_ranges(&actual, &expected);

    if let Some(differences) = &differences {
        for diff in differences {
            let actual_bytes = &actual[diff.range()];
            let expected_bytes = &expected[diff.range()];
            println!(
                "0x{:03x}..0x{:03x} ({}..{}):",
                diff.start_idx, diff.end_idx, diff.start_idx, diff.end_idx
            );
            println!("\t{}", u8_slice_to_hex_string(actual_bytes));
            println!("\t{}", u8_slice_to_hex_string(expected_bytes));
        }
    }

    match differences {
        Some(diffs) => Err(Error::other(&format!("{} differences", diffs.len()))),
        None => Ok(()),
    }
}

#[cfg(test)]
fn find_inconsistencies_to_from_bytes<PKM: Pkm>(mon: PKM) -> Result<()> {
    use crate::pkm::Error;

    let expected = mon.to_party_bytes()?;
    let actual = PKM::from_bytes(&expected)?.to_party_bytes()?;

    let differences = find_differing_ranges(&actual, &expected);

    if let Some(differences) = &differences {
        for diff in differences {
            let actual_bytes = &actual[diff.range()];
            let expected_bytes = &expected[diff.range()];
            println!(
                "0x{:03x}..0x{:03x} ({}..{}):",
                diff.start_idx, diff.end_idx, diff.start_idx, diff.end_idx
            );
            println!("\t{}", u8_slice_to_hex_string(actual_bytes));
            println!("\t{}", u8_slice_to_hex_string(expected_bytes));
        }
    }

    match differences {
        Some(diffs) => Err(Error::other(&format!("{} differences", diffs.len()))),
        None => Ok(()),
    }
}
