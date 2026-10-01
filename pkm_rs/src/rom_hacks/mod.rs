// mod cfru;
// pub mod rr;
// pub mod ub;

mod emerald_expn;
mod rr;
mod cfru;

#[derive(Debug, Clone, Copy, serde::Serialize, serde::Deserialize, specta::Type)]
#[serde(rename_all = "snake_case")]
pub enum PluginIdentifier {
    RadicalRed,
    Unbound,
    LuminescentPlatinum,
    Compass,
    EmeraldExpansion
}
