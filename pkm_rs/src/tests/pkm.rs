#[cfg(test)]
use crate::pkm::Pkm;
#[cfg(test)]
use std::error::Error;
#[cfg(test)]
use std::fs::File;
#[cfg(test)]
use std::io::Read;
#[cfg(test)]
use std::ops::RangeInclusive;
#[cfg(test)]
use std::path::Path;

#[cfg(test)]
fn pkm_from_file<PKM: Pkm>(filename: &str) -> Result<(PKM, Vec<u8>), Box<dyn Error>> {
    let mut file = File::open(filename).map_err(|e| e.to_string())?;

    let mut contents = Vec::new();
    file.read_to_end(&mut contents)
        .map_err(|e| e.to_string())
        .unwrap();

    let pkm = PKM::from_bytes(&contents)?;

    Ok((*pkm, contents))
}

#[cfg(test)]
pub mod ohpkm {
    use std::path::PathBuf;

    use crate::pkm::Ohpkm;

    #[test]
    fn to_from_bytes() -> Result<(), String> {
        super::to_from_bytes_all_in_dir::<Ohpkm>(&PathBuf::from("pkm_files").join("ohpkm"))
    }
}

#[cfg(test)]
pub mod pk5 {
    use std::path::PathBuf;

    use crate::pkm::Pk5;

    #[test]
    fn to_from_bytes() -> Result<(), String> {
        super::to_from_bytes_all_in_dir::<Pk5>(&PathBuf::from("pkm_files").join("pk5"))
    }
}

#[cfg(test)]
pub mod pb7 {
    use std::path::PathBuf;

    use crate::pkm::Pb7;

    #[test]
    fn to_from_bytes() -> Result<(), String> {
        super::to_from_bytes_all_in_dir::<Pb7>(&PathBuf::from("pkm_files").join("pb7"))
    }
}

#[cfg(test)]
pub mod pk7 {
    use std::path::PathBuf;

    use crate::pkm::Pk7;

    #[test]
    fn to_from_bytes() -> Result<(), String> {
        super::to_from_bytes_all_in_dir::<Pk7>(&PathBuf::from("pkm_files").join("pk7"))
    }
}

#[cfg(test)]
pub mod pk8 {
    use std::path::PathBuf;

    use crate::pkm::Pk8;

    #[test]
    fn to_from_bytes() -> Result<(), String> {
        super::to_from_bytes_all_in_dir::<Pk8>(&PathBuf::from("pkm_files").join("pk8"))
    }
}

#[cfg(test)]
fn to_from_bytes_all_in_dir<PKM: Pkm>(dir: &Path) -> Result<(), String> {
    use std::fs;

    let pkm_files = fs::read_dir(dir).map_err(|e| format!("directory read error: {e}"))?;
    for dir_entry in pkm_files {
        match dir_entry {
            Err(e) => println!("directory entry error: {e}"),
            Ok(dir_entry) => {
                let path = dir.join(dir_entry.file_name());
                let filename = path.to_string_lossy();
                if let Err(e) = find_inconsistencies::<PKM>(&filename) {
                    return Err(format!("read {filename}: {e}"));
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
fn find_inconsistencies<PKM: Pkm>(filename: &str) -> Result<(), String> {
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
            println!("\t{}", u8_slice_to_hex_string(actual_bytes));
            println!("\t{}", u8_slice_to_hex_string(expected_bytes));
        }
    }

    match differences {
        Some(diffs) => Err(format!("{} differences", diffs.len())),
        None => Ok(()),
    }
}
