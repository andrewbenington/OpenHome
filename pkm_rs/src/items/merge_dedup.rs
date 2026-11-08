/// Smallest value across all slices that is strictly greater than `prev`
/// (or the smallest overall if `prev` is `None`).
const fn next_greater(slices: &[&[u16]], prev: Option<u16>) -> Option<u16> {
    let mut best: Option<u16> = None;
    let mut s = 0;
    while s < slices.len() {
        let slice = slices[s];
        let mut i = 0;
        while i < slice.len() {
            let v = slice[i];
            let above_prev = match prev {
                None => true,
                Some(p) => v > p,
            };
            let better = match best {
                None => true,
                Some(b) => v < b,
            };
            if above_prev && better {
                best = Some(v);
            }
            i += 1;
        }
        s += 1;
    }
    best
}

/// Number of distinct values across all slices.
pub const fn merged_len(slices: &[&[u16]]) -> usize {
    let mut n = 0;
    let mut prev = None;
    while let Some(v) = next_greater(slices, prev) {
        prev = Some(v);
        n += 1;
    }
    n
}

/// Deduplicated, ascending merge of any number of slices into `[u16; N]`.
/// `N` must equal `merged_len(slices)`.
pub const fn merge_dedup<const N: usize>(slices: &[&[u16]]) -> [u16; N] {
    let mut out = [0u16; N];
    let mut n = 0;
    let mut prev = None;
    while let Some(v) = next_greater(slices, prev) {
        out[n] = v; // out-of-bounds is a compile error in const context
        prev = Some(v);
        n += 1;
    }
    assert!(n == N, "N must equal merged_len(slices)");
    out
}

/// Variadic convenience macro: `merge_dedup!(A, B, C, ...)`.
#[macro_export]
macro_rules! merge_dedup {
    ($($s:expr),+ $(,)?) => {{
        const SLICES: &[&[u16]] = &[$($s),+];
        const LEN: usize = $crate::items::merge_dedup::merged_len(SLICES);
        $crate::items::merge_dedup::merge_dedup::<LEN>(SLICES)
    }};
}

pub const fn is_strictly_ascending(s: &[u16]) -> bool {
    let mut i = 1;
    while i < s.len() {
        if s[i - 1] >= s[i] {
            return false;
        }
        i += 1;
    }
    true
}
