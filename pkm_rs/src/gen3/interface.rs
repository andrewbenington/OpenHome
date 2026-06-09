use crate::traits::Pkm;

// 1. Type alias for SparseArray<T>
// In Rust, we use an allocated Vec containing optional types.
pub type SparseArray<T> = Vec<Option<T>>;

// 2. Struct equivalent for Box<P>
// Rust structs use standard generics `<P>`. We bound it to a trait
// like PkmInterface if you need it (using an empty trait here as a placeholder).
#[derive(Debug, Clone)]
pub struct PCBox<P: Pkm> {
    pub name: Option<String>,
    pub box_slots: SparseArray<P>,
}

impl<P: Pkm> PCBox<P> {
    // Constructor equivalent
    pub fn new(name: String, box_size: usize) -> Self {
        // FIX: Remove the '&' symbol. We want owned values, not references.
        // We use standard iterator generation to cleanly bypass any trait restriction on P.
        let box_slots: Vec<Option<P>> = (0..box_size).map(|_| None).collect();

        Self {
            name: Some(name),
            box_slots,
        }
    }
}
