use std::fmt::Display;

use crate::encryption::swish_crypto::{self, MissingBlock, SwishError};
use crate::result::{Result, StdResult};

type SwishBlocksInner = std::collections::BTreeMap<u32, swish_crypto::Block>;

#[derive(Debug, Clone)]
pub struct SwishBlocks(SwishBlocksInner);

impl SwishBlocks {
    pub fn from_bytes(bytes: &[u8]) -> Result<Self> {
        let blocks = swish_crypto::decrypt_blocks(bytes)?;

        Ok(Self(
            blocks
                .into_iter()
                .map(|block| (block.key(), block))
                .collect(),
        ))
    }

    pub fn try_pop_block(
        &mut self,
        key: impl Into<u32> + Display + Copy,
    ) -> StdResult<swish_crypto::Block, SwishError> {
        dbg!(&key.into());
        Ok(self
            .0
            .remove(&key.into())
            .ok_or(MissingBlock::new(key.to_string()))?)
    }

    pub fn into_inner(self) -> SwishBlocksInner {
        self.0
    }
}
