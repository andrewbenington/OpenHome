use assert_json_diff::{CompareMode, Config, assert_json_matches_no_panic};

use crate::convert_strategy::ConvertStrategy;
use crate::ohpkm::{OhpkmConvert, OhpkmV2};
use crate::result::Error;
use crate::traits::Pkm;
use std::fmt::{Debug, Display};
use std::fs::File;
use std::io::Read;
use std::ops::RangeInclusive;
use std::path::{Path, PathBuf};

pub fn saves_path() -> PathBuf {
    Path::new("test-files").join("save-files")
}

pub fn save_bytes_from_file(filename: &Path) -> crate::result::Result<Vec<u8>> {
    let mut filename = filename.to_path_buf();

    if !filename.starts_with(saves_path()) {
        filename = saves_path().join(&filename);
    }

    let mut file = File::open(&filename)
        .map_err(|e| Error::other(&format!("error opening {filename:?}: {e}")))?;

    let mut contents = Vec::new();
    file.read_to_end(&mut contents)
        .map_err(|e| e.to_string())
        .unwrap();

    Ok(contents)
}

fn pkm_path() -> PathBuf {
    Path::new("test-files").join("pkm-files")
}

pub fn pkm_from_file<PKM: Pkm>(filename: &Path) -> crate::result::Result<(PKM, Vec<u8>)> {
    let mut filename = filename.to_path_buf();

    if !filename.starts_with(pkm_path()) {
        filename = pkm_path().join(&filename);
    }

    let mut file = File::open(filename).map_err(|e| Error::other(&e.to_string()))?;

    let mut contents = Vec::new();
    file.read_to_end(&mut contents)
        .map_err(|e| e.to_string())
        .unwrap();

    let pkm = PKM::from_bytes(&contents)?;

    Ok((pkm, contents))
}

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
                find_inconsistencies_from_to_ohpkm::<PKM>(pkm_from_file(&path)?.0, Some(path))?;
            }
        }
    }

    Ok(())
}

type PathAndBytes = (PathBuf, Box<[u8]>);

pub fn all_file_bytes_in_dir(
    dir: &Path,
) -> TestResult<impl Iterator<Item = Result<PathAndBytes, Error>>> {
    use std::fs;

    let dir_entries = fs::read_dir(dir)
        .map_err(|e| Error::other(&format!("directory read error: {e}")))?
        .filter_map(|result| result.ok());

    let successful_pkm = dir_entries
        .filter(|dir_entry| !dir_entry.file_name().to_string_lossy().starts_with("."))
        .map(|dir_entry| {
            fs::read(dir.join(dir_entry.file_name()))
                .map(|bytes| (dir.join(dir_entry.file_name()), bytes.into_boxed_slice()))
                .map_err(|e| Error::other(&format!("{:?} read error: {e}", dir_entry.file_name())))
        });

    Ok(successful_pkm)
}

pub fn all_pkm_and_bytes_in_dir<PKM: Pkm>(
    dir: &Path,
) -> TestResult<impl Iterator<Item = Result<(PKM, Vec<u8>), Error>>> {
    use std::fs;

    let dir_entries = fs::read_dir(dir)
        .map_err(|e| Error::other(&format!("directory read error: {e}")))?
        .filter_map(|result| result.ok());

    let successful_pkm = dir_entries
        .filter(|dir_entry| !dir_entry.file_name().to_string_lossy().starts_with("."))
        .map(|dir_entry| pkm_from_file::<PKM>(&dir.join(dir_entry.file_name())));

    Ok(successful_pkm)
}

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
                find_inconsistencies_to_from_ohpkm::<PKM>(pkm_from_file(&path)?.0, Some(path))?;
            }
        }
    }

    Ok(())
}

pub fn ensure_ranges_match(
    actual: &[u8],
    expected: &[u8],
    path: Option<PathBuf>,
) -> TestResult<()> {
    let differences = find_differing_ranges(actual, expected);

    match differences {
        Some(diffs) => {
            Err(ByteDiffError::new(diffs, actual.to_vec(), expected.to_vec(), path).into())
        }
        None => Ok(()),
    }
}

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

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
struct ByteRange {
    start_idx: usize,
    end_idx: usize,
}

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

fn u8_slice_to_hex_string(slice: &[u8]) -> String {
    let hexes: Vec<String> = slice.iter().map(|b| format!("0x{:02x}", b)).collect();
    format!("[{}]", hexes.join(", "))
}

fn find_inconsistencies_from_file<PKM: Pkm>(path: &Path) -> TestResult<()> {
    let result = pkm_from_file::<PKM>(path);
    let (mon, file_bytes) = result.unwrap_or_else(|e| panic!("could not load {path:?}: {e}"));

    let actual = mon.to_party_bytes();

    let differences = find_differing_ranges(&actual, &file_bytes);

    match differences {
        Some(diffs) => Err(TestError::ByteDiff(ByteDiffError::new(
            diffs,
            actual.to_vec(),
            file_bytes.to_vec(),
            Some(path.into()),
        ))),
        None => Ok(()),
    }
}

#[cfg(feature = "randomize")]
pub fn find_inconsistencies_to_from_bytes<PKM: Pkm>(mon: PKM) -> TestResult<()> {
    let expected = mon.to_box_bytes();
    println!("to bytes: {}", u8_slice_to_hex_string(&expected));
    let actual = PKM::from_bytes(&expected)?.to_box_bytes();
    println!("actual: {}", u8_slice_to_hex_string(&actual));

    let differences = find_differing_ranges(&actual, &expected);

    match differences {
        Some(diffs) => Err(TestError::ByteDiff(ByteDiffError::new(
            diffs,
            actual.to_vec(),
            expected.to_vec(),
            None,
        ))),
        None => Ok(()),
    }
}

fn find_inconsistencies_from_to_ohpkm<PKM: OhpkmConvert>(
    mon: OhpkmV2,
    path: Option<PathBuf>,
) -> TestResult<()> {
    let first_pass = PKM::from_ohpkm(&mon, ConvertStrategy::default())?;
    let second_pass = PKM::from_ohpkm(
        &OhpkmV2::convert_without_backup(&first_pass),
        ConvertStrategy::default(),
    )?;

    let expected = first_pass.to_party_bytes();
    let actual = second_pass.to_party_bytes();

    ensure_ranges_match(&actual, &expected, path)
}

fn find_inconsistencies_to_from_ohpkm<PKM: OhpkmConvert>(
    mon: PKM,
    path: Option<PathBuf>,
) -> TestResult<()> {
    let expected = mon.to_party_bytes();
    let ohpkm = OhpkmV2::convert_with_backup(&mon, &expected)?;
    let actual: Box<[u8]> = PKM::from_ohpkm(&ohpkm, ConvertStrategy::default())?.to_party_bytes();

    ensure_ranges_match(&actual, &expected, path)
}

pub fn compare_pkhex_json_all_in_dir<PKM: Pkm + PkhexJson>(dir: &Path) -> TestResult<()> {
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

pub fn compare_pkhex_json<PKM: Pkm + PkhexJson>(pkm_path: &Path) -> TestResult<()> {
    let mon = pkm_from_file::<PKM>(pkm_path)?.0;

    let pkm_rs_value = mon
        .to_pkhex_json_value()
        .map_err(|e| TestError::PkmRs(Error::other(&e.to_string())))?;

    let mut json_path = Path::new("pkhex-json").join(pkm_path);
    json_path.set_extension("json");
    let mut file = File::open(json_path)
        .map_err(|e| Error::other(&format!("Failed to open JSON file: {e}")))?;

    let mut pkhex_json = String::new();
    file.read_to_string(&mut pkhex_json)
        .map_err(|e| Error::other(&e.to_string()))?;
    let pkhex_value: serde_json::Value = serde_json::from_str(&pkhex_json).unwrap();

    if let Err(e) = assert_json_matches_no_panic(
        &pkm_rs_value,
        &pkhex_value,
        Config::new(CompareMode::Strict),
    ) {
        // println!("Full pkhex JSON:\n{pkhex_json}");
        // println!(
        //     "Full pkm_rs JSON:\n{}",
        //     serde_json::to_string_pretty(&pkm_rs_value)
        //         .map_err(|e| TestError::PkmRs(Error::other(&e.to_string())))?
        // );
        return Err(
            Error::other(&format!("{pkm_path:?} JSON mismatch (pkm_rs - PKHeX): {e}")).into(),
        );
    }

    Ok(())
}

pub struct TestErrorWithSeed {
    pub seed: u64,
    pub error: TestError,
}

impl Debug for TestErrorWithSeed {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Failing Seed: {}\n{:?}", self.seed, self.error)
    }
}

pub enum TestError {
    PkmRs(crate::result::Error),
    ByteDiff(ByteDiffError),
    UnexpectedChange(ValueChanged),
}

impl std::error::Error for TestError {}

impl Debug for TestError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{self}")
    }
}

impl From<crate::result::Error> for TestError {
    fn from(value: crate::result::Error) -> Self {
        Self::PkmRs(value)
    }
}

impl Display for TestError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::PkmRs(e) => write!(f, "PkmRs error: {e}"),
            Self::ByteDiff(e) => write!(f, "{e:?}"),
            Self::UnexpectedChange(ValueChanged(context)) => match context {
                Some(context) => write!(f, "Value changed unexpectedly: {context}"),
                None => write!(f, "Value changed unexpectedly"),
            },
        }
    }
}

pub type TestResult<T> = std::result::Result<T, TestError>;

pub struct ByteDiffError {
    differences: Vec<ByteRange>,
    actual: Vec<u8>,
    expected: Vec<u8>,
    path: Option<PathBuf>,
}

impl ByteDiffError {
    fn new(
        differences: Vec<ByteRange>,
        actual: Vec<u8>,
        expected: Vec<u8>,
        path: Option<PathBuf>,
    ) -> Self {
        Self {
            differences,
            actual,
            expected,
            path,
        }
    }
}

impl From<ByteDiffError> for TestError {
    fn from(value: ByteDiffError) -> Self {
        Self::ByteDiff(value)
    }
}

impl Display for ByteDiffError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let path_display = match &self.path {
            Some(path) => format!("\npath:\t {}", path.to_string_lossy()),
            None => String::new(),
        };
        write!(
            f,
            "{}{path_display}",
            format_byte_range_differences(&self.differences, &self.actual, &self.expected)
        )
    }
}

impl Debug for ByteDiffError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let path_display = match &self.path {
            Some(path) => format!("\npath:\t {}", path.to_string_lossy()),
            None => String::new(),
        };
        write!(
            f,
            "{}{path_display}",
            format_byte_range_differences(&self.differences, &self.actual, &self.expected)
        )
    }
}

pub fn calculate_hash<T: std::hash::Hash>(t: &T) -> u64 {
    let mut s = std::hash::DefaultHasher::new();
    t.hash(&mut s);
    std::hash::Hasher::finish(&s)
}

pub struct TestContext {
    description: Option<String>,
    path: Option<PathBuf>,
}

impl TestContext {
    pub fn new(desc: &str, path: &PathBuf) -> Self {
        Self {
            description: Some(desc.to_owned()),
            path: Some(path.to_owned()),
        }
    }
}

pub fn context(desc: &str, path: &PathBuf) -> TestContext {
    TestContext {
        description: Some(desc.to_owned()),
        path: Some(path.to_owned()),
    }
}

impl Display for TestContext {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match (&self.description, &self.path) {
            (None, None) => f.write_str("(no context provided)"),
            (None, Some(path)) => write!(f, "associated file: {path:?}"),
            (Some(desc), None) => write!(f, "{desc}"),
            (Some(desc), Some(path)) => write!(f, "{desc}; associated file: {path:?}"),
        }
    }
}

pub struct ValueChanged(Option<TestContext>);

impl From<ValueChanged> for TestError {
    fn from(value: ValueChanged) -> Self {
        Self::UnexpectedChange(value)
    }
}

pub fn assert_unchanged<T: std::hash::Hash>(
    actual: &T,
    expected: &T,
    context: Option<TestContext>,
) -> TestResult<()> {
    if calculate_hash(actual) == calculate_hash(expected) {
        Ok(())
    } else {
        Err(ValueChanged(context).into())
    }
}

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

pub trait PkhexJson {
    fn to_pkhex_json_value(&self) -> Result<serde_json::Value, serde_json::Error>;
}

pub fn bytes_to_hex_string(bytes: &[u8]) -> String {
    num::BigInt::from_bytes_be(num::bigint::Sign::Plus, bytes).to_str_radix(16)
}
