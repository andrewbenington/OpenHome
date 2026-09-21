// mod cfru;
// pub mod rr;
// pub mod ub;

mod emerald_expansion;
mod rr;

#[derive(Debug, Clone, Copy, serde::Serialize, serde::Deserialize, specta::Type)]
#[serde(rename_all = "snake_case")]
pub enum PluginIdentifier {
    RadicalRed,
    Unbound,
    LuminescentPlatinum,
    Compass,
    EmeraldExpansion
}
