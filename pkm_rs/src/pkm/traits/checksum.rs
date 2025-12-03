
pub trait Checksum {
    fn get_stored_checksum(&self) -> u32;
    fn reset_checksum(&mut self) -> ();
}
