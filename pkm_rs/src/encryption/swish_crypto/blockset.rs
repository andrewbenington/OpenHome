use crate::encryption::swish_crypto::{
    ArrayBlock, Block, MissingBlock, NumericBlock, ObjectBlock, SwishError, decrypt_blocks,
};
use crate::result::{Result, StdResult};

type SwishBlocksInner = std::collections::BTreeMap<u32, Block>;

#[derive(Debug, Clone, Default)]
pub struct SwishBlocks<Key: SwishKey>(SwishBlocksInner, std::marker::PhantomData<Key>);

impl<Key: SwishKey> SwishBlocks<Key> {
    pub fn from_bytes(bytes: &[u8]) -> Result<Self> {
        let blocks = decrypt_blocks(bytes)?;

        Ok(Self(
            blocks
                .into_iter()
                .map(|block| (block.key(), block))
                .collect(),
            std::marker::PhantomData,
        ))
    }

    pub fn has_block(&self, key: Key) -> bool {
        self.0.contains_key(&key.value())
    }

    fn try_pop_block(&mut self, key: Key) -> StdResult<Block, SwishError> {
        let key_u32: u32 = key.value();
        Ok(self
            .0
            .remove(&key_u32)
            .ok_or(MissingBlock::new(key.error_display()))?)
    }

    pub fn try_pop_object(&mut self, key: Key) -> StdResult<ObjectBlock, SwishError> {
        self.try_pop_block(key).and_then(Block::into_object_data)
    }

    pub fn try_pop_array(&mut self, key: Key) -> StdResult<ArrayBlock, SwishError> {
        self.try_pop_block(key).and_then(Block::into_array_data)
    }

    pub fn try_pop_numeric(&mut self, key: Key) -> StdResult<NumericBlock, SwishError> {
        self.try_pop_block(key).and_then(Block::into_numeric_data)
    }

    pub fn into_inner(self) -> SwishBlocksInner {
        self.0
    }
}

pub trait SwishKey {
    fn value(&self) -> u32;
    fn error_display(&self) -> String {
        self.value().to_string()
    }
}

impl<T: Into<u32> + Copy + ToString> SwishKey for T {
    fn value(&self) -> u32 {
        (*self).into()
    }

    fn error_display(&self) -> String {
        self.to_string()
    }
}
