use crate::substructures::Stats8;

pub trait ModernEvs {
    fn get_evs(&self) -> Stats8;
}
