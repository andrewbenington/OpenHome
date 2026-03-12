#[cfg(test)]
use assert_json_diff::{CompareMode, Config, assert_json_matches_no_panic};

#[cfg(test)]
use crate::ohpkm::{OhpkmConvert, OhpkmV2};
#[cfg(test)]
use crate::result::Error;
#[cfg(test)]
use crate::traits::Pkm;
use std::fmt::{Debug, Display};
#[cfg(test)]
use std::fs::File;
#[cfg(test)]
use std::io::Read;
#[cfg(test)]
use std::ops::RangeInclusive;
#[cfg(test)]
use std::path::Path;
#[cfg(test)]
pub fn pkm_from_file<PKM: Pkm>(filename: &Path) -> crate::result::Result<(PKM, Vec<u8>)> {
    let mut filename = filename.to_path_buf();

    if !filename.starts_with(Path::new("test-files").join("pkm-files")) {
        filename = Path::new("test-files").join("pkm-files").join(&filename);
    }

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
pub fn to_from_bytes_all_in_dir<PKM: Pkm>(dir: &Path) -> TestResult<()> {
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
                find_inconsistencies_from_file::<PKM>(&path)?;
            }
        }
    }

    Ok(())
}

#[cfg(test)]
pub fn from_to_ohpkm_all_in_dir<PKM: OhpkmConvert>() -> TestResult<()> {
    use std::fs;

    let ohpkm_dir = &Path::new("test-files").join("pkm-files").join("ohpkm");
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
                find_inconsistencies_from_to_ohpkm::<PKM>(pkm_from_file(&path)?.0)?;
            }
        }
    }

    Ok(())
}

#[cfg(test)]
pub fn to_from_ohpkm_all_in_dir<PKM: OhpkmConvert>(dir: &Path) -> TestResult<()> {
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
                find_inconsistencies_to_from_ohpkm::<PKM>(pkm_from_file(&path)?.0)?;
            }
        }
    }

    Ok(())
}

#[cfg(test)]
fn ensure_ranges_match(actual: &[u8], expected: &[u8]) -> TestResult<()> {
    let differences = find_differing_ranges(actual, expected);

    match differences {
        Some(diffs) => Err(DiffError::new(diffs, actual.to_vec(), expected.to_vec()).into()),
        None => Ok(()),
    }
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
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
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
fn find_inconsistencies_from_file<PKM: Pkm>(path: &Path) -> TestResult<()> {
    let result = pkm_from_file::<PKM>(path);
    let (mon, file_bytes) = result.unwrap_or_else(|e| panic!("could not load {path:?}: {e}"));

    let actual = mon.to_party_bytes();

    let differences = find_differing_ranges(&actual, &file_bytes);

    match differences {
        Some(diffs) => Err(TestError::Diff(DiffError::new(
            diffs,
            actual.to_vec(),
            file_bytes.to_vec(),
        ))),
        None => Ok(()),
    }
}

#[cfg(feature = "randomize")]
#[cfg(test)]
pub fn find_inconsistencies_to_from_bytes<PKM: Pkm>(mon: PKM) -> TestResult<()> {
    let expected = mon.to_box_bytes();
    let actual = PKM::from_bytes(&expected)?.to_box_bytes();

    let differences = find_differing_ranges(&actual, &expected);

    match differences {
        Some(diffs) => Err(TestError::Diff(DiffError::new(
            diffs,
            actual.to_vec(),
            expected.to_vec(),
        ))),
        None => Ok(()),
    }
}

#[cfg(test)]
fn find_inconsistencies_from_to_ohpkm<PKM: OhpkmConvert>(mon: OhpkmV2) -> TestResult<()> {
    let first_pass = PKM::from_ohpkm(&mon);
    let second_pass = PKM::from_ohpkm(&OhpkmV2::from(&first_pass));

    let expected = first_pass.to_party_bytes();
    let actual = second_pass.to_party_bytes();

    ensure_ranges_match(&actual, &expected)
}

#[cfg(test)]
fn find_inconsistencies_to_from_ohpkm<PKM: OhpkmConvert>(mon: PKM) -> TestResult<()> {
    let expected = mon.to_party_bytes();
    let actual: Vec<u8> = PKM::from_ohpkm(&OhpkmV2::from(&mon)).to_party_bytes();

    ensure_ranges_match(&actual, &expected)
}

#[cfg(test)]
pub fn compare_pkhex_json_all_in_dir<PKM: Pkm>(dir: &Path) -> TestResult<()> {
    use std::fs;

    let full_dir = Path::new("test-files").join("pkm-files").join(dir);

    let pkm_files =
        fs::read_dir(&full_dir).map_err(|e| Error::other(&format!("directory read error: {e}")))?;
    for dir_entry in pkm_files {
        match dir_entry {
            Err(e) => println!("directory entry error: {e}"),
            Ok(dir_entry) => {
                if dir_entry.file_name().to_string_lossy().starts_with(".") {
                    continue;
                }
                let pkm_path = dir.join(dir_entry.file_name());
                compare_pkhex_json::<PKM>(&pkm_path)?;
            }
        }
    }

    Ok(())
}

#[cfg(test)]
pub fn compare_pkhex_json<PKM: Pkm>(pkm_path: &Path) -> TestResult<()> {
    let mon = pkm_from_file::<PKM>(pkm_path)?.0;

    let pkm_rs_json = serde_json::to_string_pretty(&mon)
        .map_err(|e| TestError::PkmRs(Error::other(&e.to_string())))?;

    // println!("pkm_rs JSON:\n{pkm_rs_json}");

    let mut json_path = Path::new("pkhex-json").join(pkm_path);
    json_path.set_extension("json");
    let mut file = File::open(json_path)
        .map_err(|e| Error::other(&format!("Failed to open JSON file: {e}")))?;

    let pkm_rs_value: serde_json::Value = serde_json::from_str(&pkm_rs_json).unwrap();
    let mut pkhex_json = String::new();
    file.read_to_string(&mut pkhex_json)
        .map_err(|e| Error::other(&e.to_string()))?;
    let pkhex_value: serde_json::Value = serde_json::from_str(&pkhex_json).unwrap();

    if let Err(e) = assert_json_matches_no_panic(
        &pkm_rs_value,
        &pkhex_value,
        Config::new(CompareMode::Strict),
    ) {
        println!("Full pkhex JSON:\n{pkhex_json}");
        println!("Full pkm_rs JSON:\n{pkm_rs_json}");
        // assert_json_include!(actual: pkm_rs_value, expected: pkhex_value);
        return Err(Error::other(&format!("JSON mismatch: {e}")).into());
    }

    // println!("Golden JSON:\n{file_json}");

    Ok(())
}

// test command: cargo test --package pkm_rs --lib -- gen7_alola::pk7::test::compare_golden_json --exact --nocapture

#[cfg(test)]
pub struct TestErrorWithSeed {
    pub seed: u64,
    pub error: TestError,
}

impl Debug for TestErrorWithSeed {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Failing Seed: {}\n{:?}", self.seed, self.error)
    }
}

#[cfg(test)]
pub enum TestError {
    PkmRs(crate::result::Error),
    Diff(DiffError),
}

impl Debug for TestError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TestError::PkmRs(e) => write!(f, "PkmRs error: {e}"),
            TestError::Diff(e) => write!(f, "{e:?}"),
        }
    }
}

impl From<crate::result::Error> for TestError {
    fn from(value: crate::result::Error) -> Self {
        Self::PkmRs(value)
    }
}

impl From<DiffError> for TestError {
    fn from(value: DiffError) -> Self {
        Self::Diff(value)
    }
}

pub type TestResult<T> = std::result::Result<T, TestError>;

#[cfg(test)]
pub struct DiffError {
    differences: Vec<ByteRange>,
    actual: Vec<u8>,
    expected: Vec<u8>,
}

impl DiffError {
    fn new(differences: Vec<ByteRange>, actual: Vec<u8>, expected: Vec<u8>) -> Self {
        Self {
            differences,
            actual,
            expected,
        }
    }
}

impl Display for DiffError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "{}",
            format_byte_range_differences(&self.differences, &self.actual, &self.expected)
        )
    }
}

impl Debug for DiffError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "{}",
            format_byte_range_differences(&self.differences, &self.actual, &self.expected)
        )
    }
}

#[cfg(test)]
fn format_byte_range_differences(diffs: &[ByteRange], actual: &[u8], expected: &[u8]) -> String {
    let mut output = String::new();
    for diff in diffs {
        let actual_bytes = &actual[diff.range()];
        let expected_bytes = &expected[diff.range()];
        output.push_str(&format!(
            "0x{:03x}..0x{:03x} ({}..{}):\n",
            diff.start_idx, diff.end_idx, diff.start_idx, diff.end_idx
        ));

        let actual_hex = u8_slice_to_hex_string(actual_bytes);
        let expected_hex = u8_slice_to_hex_string(expected_bytes);
        output.push_str(&format!("  expected:  {expected_hex}\n"));
        output.push_str(&format!("  actual:    {actual_hex}\n"));
    }
    output
}
