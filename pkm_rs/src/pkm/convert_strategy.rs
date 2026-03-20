#[cfg(feature = "wasm")]
pub mod wasm;

// AI SLOP (generated from artisinal non-AI TypeScript)

use std::collections::HashMap;

#[derive(Debug, Clone, PartialEq)]
pub enum SettingValue {
    String(String),
    Bool(bool),
    Number(f64),
}

#[derive(Debug, Clone)]
pub struct StringDescriptor {
    pub display: &'static str,
    pub default: &'static str,
    pub description: &'static str,
    pub allowed_values: Option<&'static [&'static str]>,
}

#[derive(Debug, Clone)]
pub struct BoolDescriptor {
    pub display: &'static str,
    pub default: bool,
    pub description: &'static str,
}

#[derive(Debug, Clone)]
pub struct NumberDescriptor {
    pub display: &'static str,
    pub default: f64,
    pub description: &'static str,
    pub minimum: Option<f64>,
    pub maximum: Option<f64>,
}

#[derive(Debug, Clone)]
pub enum SettingDescriptor {
    String(StringDescriptor),
    Bool(BoolDescriptor),
    Number(NumberDescriptor),
}

impl SettingDescriptor {
    pub const fn display(&self) -> &'static str {
        match self {
            Self::String(d) => d.display,
            Self::Bool(d) => d.display,
            Self::Number(d) => d.display,
        }
    }

    pub fn default_value(&self) -> SettingValue {
        match self {
            Self::String(d) => SettingValue::String(d.default.to_string()),
            Self::Bool(d) => SettingValue::Bool(d.default),
            Self::Number(d) => SettingValue::Number(d.default),
        }
    }

    /// Returns an error string if the value is invalid for this descriptor.
    pub fn validate(&self, value: &SettingValue) -> Result<(), String> {
        match (self, value) {
            (Self::String(d), SettingValue::String(s)) => {
                if let Some(allowed) = d.allowed_values
                    && !allowed.contains(&s.as_str())
                {
                    return Err(format!(
                        "'{}' is not an allowed value for '{}'. Allowed: {:?}",
                        s, d.display, allowed
                    ));
                }
                Ok(())
            }
            (Self::Bool(_), SettingValue::Bool(_)) => Ok(()),
            (Self::Number(d), SettingValue::Number(n)) => {
                if let Some(min) = d.minimum
                    && *n < min
                {
                    return Err(format!("{} is below minimum {}", n, min));
                }
                if let Some(max) = d.maximum
                    && *n > max
                {
                    return Err(format!("{} is above maximum {}", n, max));
                }
                Ok(())
            }
            _ => Err(format!(
                "Type mismatch: expected {:?}, got {:?}",
                self.display(),
                value
            )),
        }
    }
}

// ── Schema ─────────────────────────────────────────────────────────────────────

// Subcategory keys are just &'static str at runtime; the "category.key"
// convention is enforced by construction rather than the type system.
pub type SettingsSubcategory = &'static str;

pub const fn settings_schema() -> &'static [(&'static str, SettingDescriptor)] {
    use SettingDescriptor::*;
    &[
        (
            "nickname.capitalization",
            String(StringDescriptor {
                display: "Capitalization",
                default: "gameDefault",
                allowed_values: Some(&["gameDefault", "modern"]),
                description: "Decides how unnicknamed Pokémon are capitalized. \
                    \"gameDefault\" uses the original game's capitalization, \
                    \"modern\" capitalizes all in the modern style.",
            }),
        ),
        (
            "metLocation.useRegion",
            Bool(BoolDescriptor {
                display: "Use Region for Met Location (when possible)",
                default: true,
                description: "If true, the met location will show the region name when possible. \
                    If false, it shows \"a faraway place\" or \"an in-game trade\".",
            }),
        ),
    ]
}

pub fn get_schema_entry(key: &str) -> Option<&'static SettingDescriptor> {
    settings_schema()
        .iter()
        .find(|(k, _)| *k == key)
        .map(|(_, d)| d)
}

// ── Category helpers ───────────────────────────────────────────────────────────

pub fn display_settings_category(category: &str) -> &str {
    match category {
        "nickname" => "Nicknames",
        "metLocation" => "Met Location",
        other => other,
    }
}

pub fn get_settings_category(subcategory: &str) -> &str {
    subcategory.split('.').next().unwrap_or(subcategory)
}

// ── ConvertStrategy ────────────────────────────────────────────────────────────

#[derive(Debug, Clone)]
pub struct ConvertStrategy(HashMap<&'static str, SettingValue>);

impl ConvertStrategy {
    /// Build the default strategy from the schema.
    pub fn default_strategy() -> Self {
        let map = settings_schema()
            .iter()
            .map(|(key, descriptor)| (*key, descriptor.default_value()))
            .collect();
        Self(map)
    }

    pub fn get(&self, key: &str) -> Option<&SettingValue> {
        self.0.get(key)
    }

    /// Set a value, validating it against the schema first.
    pub fn set(&mut self, key: &'static str, value: SettingValue) -> Result<(), String> {
        let descriptor =
            get_schema_entry(key).ok_or_else(|| format!("Unknown setting key: '{}'", key))?;
        descriptor.validate(&value)?;
        self.0.insert(key, value);
        Ok(())
    }

    /// Merge a partial strategy (override) into this one.
    pub fn merge(&self, partial: &PartialConvertStrategy) -> Self {
        let mut merged = self.clone();
        for (key, value) in &partial.0 {
            merged.0.insert(key, value.clone());
        }
        merged
    }
}

/// A partial strategy — any subset of keys.
#[derive(Debug, Clone, Default)]
pub struct PartialConvertStrategy(HashMap<&'static str, SettingValue>);

impl PartialConvertStrategy {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn set(&mut self, key: &'static str, value: SettingValue) -> Result<(), String> {
        let descriptor =
            get_schema_entry(key).ok_or_else(|| format!("Unknown setting key: '{}'", key))?;
        descriptor.validate(&value)?;
        self.0.insert(key, value);
        Ok(())
    }
}
