pub fn with_sized<const N: usize>(arr: &[u8]) -> &[u8; N] {
  let expect_string: String = format!("slice should have length {}", N.to_string().as_str());
  arr.try_into().expect(&*expect_string)
}

