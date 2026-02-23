use pkm_rs_types::FlagSet;
use serde::Serialize;

#[cfg(feature = "randomize")]
use pkm_rs_types::randomize::Randomize;

#[cfg_attr(feature = "randomize", derive(Randomize))]
#[derive(Debug, Clone, Copy)]
pub struct RibbonSet<const N: usize, RIBBON: Ribbon, const MAX: usize>(FlagSet<N, RIBBON>);

impl<const N: usize, RIBBON: Ribbon, const MAX: usize> RibbonSet<N, RIBBON, MAX> {
    pub fn from_bytes(bytes: [u8; N]) -> Self {
        if MAX > N * 8 {
            panic!(
                "attempting to create RibbonsSet with too few bits ({}) for the MAX ribbon value ({})",
                N * 8,
                MAX
            );
        }
        Self(FlagSet::from_bytes(bytes))
    }

    pub fn from_spans(spans: &[&[u8]]) -> Self {
        let total_bytes: usize = spans.iter().map(|span| span.len()).sum();
        if total_bytes != N {
            panic!(
                "attempting to create RibbonsSet from spans whose lengths ({total_bytes}) do not add to N ({N})"
            );
        }

        let mut length = 0usize;
        let mut bytes = [0u8; N];
        for span in spans {
            bytes[length..length + span.len()].copy_from_slice(span);
            length += span.len();
        }

        Self(FlagSet::from_bytes(bytes))
    }

    pub fn get_ribbons(&self) -> Vec<RIBBON> {
        self.0.get_flags()
    }

    pub const fn to_bytes(self) -> [u8; N] {
        self.0.to_bytes()
    }
    pub fn set_ribbon(&mut self, ribbon: RIBBON, value: bool) {
        if ribbon.into() <= MAX {
            self.0.set_flag(ribbon, value);
        }
    }

    pub const fn clear(&mut self) {
        self.0.clear();
    }

    pub fn add_ribbon(&mut self, ribbon: RIBBON) {
        self.set_ribbon(ribbon, true);
    }

    pub fn add_ribbons<I: IntoIterator<Item = RIBBON>>(&mut self, ribbons: I) {
        ribbons
            .into_iter()
            .for_each(|ribbon| self.add_ribbon(ribbon));
    }

    pub fn set_ribbons<I: IntoIterator<Item = RIBBON>>(&mut self, ribbons: I) {
        self.clear();
        self.add_ribbons(ribbons);
    }

    pub fn from_ribbons<I: IntoIterator<Item = RIBBON>>(ribbons: I) -> Self {
        Self(FlagSet::default()).with_ribbons(ribbons)
    }

    pub fn with_ribbons<I: IntoIterator<Item = RIBBON>>(mut self, ribbons: I) -> Self {
        self.add_ribbons(ribbons);
        self
    }

    pub fn is_empty(&self) -> bool {
        self.0.is_empty()
    }

    pub fn truncate_to<const M: usize>(self) -> RibbonSet<M, RIBBON, MAX> {
        let mut truncated_bytes = [0u8; M];

        let min_size = N.min(M);

        truncated_bytes.copy_from_slice(&self.to_bytes()[0..min_size]);

        RibbonSet::<M, RIBBON, MAX>::from_bytes(truncated_bytes)
    }

    pub fn with_max<const M: usize, const NEW_MAX: usize>(self) -> RibbonSet<M, RIBBON, NEW_MAX> {
        self.0
            .get_flags()
            .into_iter()
            .filter(|val| (*val).into() <= NEW_MAX)
            .collect()
    }
}

pub trait Ribbon: Copy + Into<usize> + From<usize> + PartialOrd + ToString {
    const MAX: usize;
}

impl<const N: usize, RIBBON: Ribbon, const MAX: usize> Serialize for RibbonSet<N, RIBBON, MAX>
where
    RIBBON: ToString,
{
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let strings: Vec<_> = self
            .get_ribbons()
            .into_iter()
            .map(|r| r.to_string())
            .collect();
        let comma_separated = strings.join(", ");
        serializer.serialize_str(&format!("[{comma_separated}]"))
    }
}

impl<const N: usize, RIBBON: Ribbon, const MAX: usize> From<FlagSet<N>>
    for RibbonSet<N, RIBBON, MAX>
{
    fn from(value: FlagSet<N>) -> Self {
        Self::from_bytes(value.to_bytes())
    }
}

impl<const N: usize, RIBBON: Ribbon, const MAX: usize> From<RibbonSet<N, RIBBON, MAX>>
    for FlagSet<N>
{
    fn from(value: RibbonSet<N, RIBBON, MAX>) -> Self {
        Self::from_bytes(value.to_bytes())
    }
}

impl<const N: usize, RIBBON: Ribbon, const MAX: usize> Default for RibbonSet<N, RIBBON, MAX> {
    fn default() -> Self {
        Self(Default::default())
    }
}

impl<const N: usize, RIBBON: Ribbon, const MAX: usize> FromIterator<RIBBON>
    for RibbonSet<N, RIBBON, MAX>
{
    fn from_iter<T: IntoIterator<Item = RIBBON>>(iter: T) -> Self {
        Self::default().with_ribbons(iter)
    }
}
