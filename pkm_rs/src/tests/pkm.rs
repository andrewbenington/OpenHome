#[cfg(test)]
use crate::pkm::Pkm;
#[cfg(test)]
use std::collections::HashSet;
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
fn to_from_bytes_all_in_dir<PKM: Pkm>(
    dir: &Path,
    ignore_ranges: HashSet<ByteRange>,
    ignore_34_top_four: bool,
) -> Result<(), String> {
    use std::fs;

    let pkm_files = fs::read_dir(dir).map_err(|e| format!("directory read error: {e}"))?;
    for dir_entry in pkm_files {
        match dir_entry {
            Err(e) => println!("directory entry error: {e}"),
            Ok(dir_entry) => {
                let path = dir.join(dir_entry.file_name());
                let filename = path.to_string_lossy();
                if let Err(e) =
                    find_inconsistencies::<PKM>(&filename, &ignore_ranges, ignore_34_top_four)
                {
                    return Err(format!("read {filename}: {e}"));
                }
            }
        }
    }

    Ok(())
}

#[cfg(test)]
fn v2_from_all_v1() -> Result<(), Box<dyn Error>> {
    use std::{fs, path::PathBuf};
    let v1_path = PathBuf::from("pkm_files").join("ohpkm").join("v1");
    let v2_path = PathBuf::from("pkm_files").join("ohpkm").join("v2");

    if fs::exists(&v2_path)? {
        fs::remove_dir_all(&v2_path)?;
    }

    fs::create_dir(&v2_path)?;

    let pkm_files = fs::read_dir(&v1_path).map_err(|e| format!("directory read error: {e}"))?;
    for dir_entry in pkm_files {
        match dir_entry {
            Err(e) => println!("directory entry error: {e}"),
            Ok(dir_entry) => {
                use crate::pkm::ohpkm::{OhpkmV1, OhpkmV2};

                let v1_path = v1_path.join(dir_entry.file_name());
                let v1_filename = v1_path.to_string_lossy();
                let v1 = pkm_from_file::<OhpkmV1>(&v1_filename)?.0;

                let v2 = OhpkmV2::from_v1(v1);

                let v2_filename = v2_path.join(dir_entry.file_name());

                fs::write(v2_filename, v2.to_bytes()?)?;
            }
        }
    }

    Ok(())
}
#[cfg(test)]
fn find_differing_ranges(
    actual: &[u8],
    expected: &[u8],
    ignore_34_top_four: bool,
) -> Option<Vec<ByteRange>> {
    let mut differences: Vec<ByteRange> = Vec::new();

    let mut current_range: Option<ByteRange> = None;

    for (i, (a, b)) in actual.iter().zip(expected.iter()).enumerate() {
        if a != b && (!ignore_34_top_four || (i == 34 && (*a & 0b1111 != *b & 0b1111))) {
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
#[derive(PartialEq, Eq, Hash)]
struct ByteRange {
    start_idx: usize,
    end_idx: usize,
}

#[cfg(test)]
impl ByteRange {
    pub const fn new(start: usize, end_inclusive: usize) -> Self {
        Self {
            start_idx: start,
            end_idx: end_inclusive,
        }
    }

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
fn find_inconsistencies<PKM: Pkm>(
    filename: &str,
    ignore_ranges: &HashSet<ByteRange>,
    ignore_34_top_four: bool,
) -> Result<(), String> {
    println!("filename: {filename}");
    let result = pkm_from_file::<PKM>(filename);
    let (mon, bytes) = result.unwrap_or_else(|e| panic!("could not load {filename}: {e}"));

    let actual = mon
        .to_party_bytes()
        .map_err(|err| format!("couldn't convert to bytes: {err}"))?;
    let expected = bytes;
    let differences = find_differing_ranges(&actual, &expected, ignore_34_top_four);

    let mut diffs_not_ignored = 0;

    if let Some(differences) = &differences {
        for diff in differences {
            if ignore_ranges.contains(diff) {
                continue;
            }

            diffs_not_ignored += 1;

            let actual_bytes = &actual[diff.range()];
            let expected_bytes = &expected[diff.range()];
            if diff.start_idx == diff.end_idx {
                println!("0x{:03x} ({}):", diff.start_idx, diff.start_idx);
            } else {
                println!(
                    "0x{:03x}..0x{:03x} ({}..{}):",
                    diff.start_idx, diff.end_idx, diff.start_idx, diff.end_idx
                );
            }
            println!("\texpected: {}", u8_slice_to_hex_string(expected_bytes));
            println!("\tactual:   {}", u8_slice_to_hex_string(actual_bytes));
        }
    }

    match diffs_not_ignored {
        0 => Ok(()),
        _ => Err(format!("{diffs_not_ignored} differences")),
    }
}

#[cfg(test)]
pub mod ohpkm {
    use std::{collections::HashSet, error::Error, path::PathBuf};

    use crate::{pkm::ohpkm::OhpkmV1, tests::pkm::ByteRange};

    #[test]
    fn to_from_bytes() -> Result<(), String> {
        let ohpkm_ignore_ranges: HashSet<ByteRange> =
            vec![ByteRange::new(172, 179)].into_iter().collect();
        super::to_from_bytes_all_in_dir::<OhpkmV1>(
            &PathBuf::from("pkm_files").join("ohpkm"),
            ohpkm_ignore_ranges,
            true,
        )
    }

    #[test]
    fn do_v2() -> Result<(), Box<dyn Error>> {
        super::v2_from_all_v1()
    }
}
