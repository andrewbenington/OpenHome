#[cfg_attr(
    feature = "wasm",
    derive(tsify::Tsify, serde::Serialize, serde::Deserialize)
)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum ItemCategory {
    None,
    Items,
    KeyItems,
    TechnicalMachines,
    Medicine,
    Berries,
    Balls,
    BattleItems,
    MailItems,
    PcItems,
    FreeSpace,
    ZCrystals,
    Candy,
    Treasure,
    Ingredients,
    MegaStones,
}
