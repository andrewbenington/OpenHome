#[cfg(test)]
use crate::ohpkm::{OhpkmConvert, OhpkmV2};
#[cfg(test)]
use crate::result::Error;
use crate::result::Result;
#[cfg(test)]
use crate::traits::Pkm;
#[cfg(test)]
use std::fs::File;
#[cfg(test)]
use std::io::Read;
#[cfg(test)]
use std::ops::RangeInclusive;
#[cfg(test)]
use std::path::Path;
#[cfg(test)]
pub fn pkm_from_file<PKM: Pkm>(filename: &str) -> Result<(PKM, Vec<u8>)> {
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
pub fn to_from_bytes_all_in_dir<PKM: Pkm>(dir: &Path) -> Result<()> {
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
pub fn from_to_ohpkm_all_in_dir<PKM: OhpkmConvert>() -> Result<()> {
    use std::{fs, path::PathBuf};

    let ohpkm_dir = &PathBuf::from("pkm_files").join("ohpkm");
    let ohpkm_files =
        fs::read_dir(ohpkm_dir).map_err(|e| Error::other(&format!("directory read error: {e}")))?;
    for dir_entry in ohpkm_files {
        match dir_entry {
            Err(e) => println!("directory entry error: {e}"),
            Ok(dir_entry) => {
                if dir_entry.file_name().to_string_lossy().starts_with(".") {
                    continue;
                }
                let path = ohpkm_dir.join(dir_entry.file_name());
                let filename = path.to_string_lossy();
                println!("filename: {filename:#?}");
                if let Err(e) =
                    find_inconsistencies_from_to_ohpkm::<PKM>(pkm_from_file(&filename)?.0)
                {
                    return Err(Error::other(&format!("read {filename}: {e}")));
                }
            }
        }
    }

    Ok(())
}

#[cfg(test)]
pub fn to_from_ohpkm_all_in_dir<PKM: OhpkmConvert>(dir: &Path) -> Result<()> {
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
                println!("filename: {filename:#?}");
                if let Err(e) =
                    find_inconsistencies_to_from_ohpkm::<PKM>(pkm_from_file(&filename)?.0)
                {
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
    use crate::result::Error;

    println!("filename: {filename}");
    let result = pkm_from_file::<PKM>(filename);
    let (mon, bytes) = result.unwrap_or_else(|e| panic!("could not load {filename}: {e}"));

    let actual = mon.to_party_bytes();

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
            println!("   actual:     {}", u8_slice_to_hex_string(actual_bytes));
            println!("   expected:   {}", u8_slice_to_hex_string(expected_bytes));
        }
    }

    match differences {
        Some(diffs) => Err(Error::other(&format!("{} differences", diffs.len()))),
        None => Ok(()),
    }
}

#[cfg(feature = "randomize")]
#[cfg(test)]
pub fn find_inconsistencies_to_from_bytes<PKM: Pkm>(mon: PKM) -> Result<()> {
    use crate::result::Error;

    let expected = mon.to_party_bytes();
    let actual = PKM::from_bytes(&expected)?.to_party_bytes();

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
fn find_inconsistencies_from_to_ohpkm<PKM: OhpkmConvert>(mon: OhpkmV2) -> Result<()> {
    use crate::result::Error;

    let first_pass = PKM::from_ohpkm(&mon);
    let second_pass = PKM::from_ohpkm(&OhpkmV2::from(&first_pass));

    let expected = first_pass.to_party_bytes();
    let actual = second_pass.to_party_bytes();

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
            println!("\t{}\n", u8_slice_to_hex_string(expected_bytes));
        }
    }

    match differences {
        Some(diffs) => Err(Error::other(&format!("{} differences", diffs.len()))),
        None => Ok(()),
    }
}

#[cfg(test)]
fn find_inconsistencies_to_from_ohpkm<PKM: OhpkmConvert>(mon: PKM) -> Result<()> {
    use crate::result::Error;

    let expected = mon.to_party_bytes();
    let actual: Vec<u8> = PKM::from_ohpkm(&OhpkmV2::from(&mon)).to_party_bytes();

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
