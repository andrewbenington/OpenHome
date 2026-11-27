pub fn as_sized_array<const N: usize>(arr: &[u8]) -> &[u8; N] {
  arr.try_into().expect(&*format!("slice should have length {}", N.to_string().as_str()))
}

