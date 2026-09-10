use serde::{Deserialize, Serialize, Serializer};

#[derive(Debug, Default, Deserialize)]
pub struct BoxPointer {
    pub box_index: usize,
    pub bank_index: usize
}

impl BoxPointer {

    fn to_string(&self) -> String {
        format!("({}, {})", &self.box_index, &self.bank_index)
    }

    fn new(box_index : usize, bank_index : usize) -> Self {
        Self {
            box_index,
            bank_index
        }
    }

}

impl Clone for BoxPointer {
    fn clone(&self) -> Self {
        BoxPointer::new(self.box_index, self.bank_index)
    }
}

impl Serialize for BoxPointer {

    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}


