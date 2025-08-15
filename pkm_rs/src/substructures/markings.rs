use serde::Serialize;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct MarkingsFourShapes {
    pub circle: bool,
    pub square: bool,
    pub triangle: bool,
    pub heart: bool,
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct MarkingsSixShapes {
    pub circle: bool,
    pub square: bool,
    pub triangle: bool,
    pub heart: bool,
    pub star: bool,
    pub diamond: bool,
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Default, Serialize, Clone, Copy)]
pub enum MarkingValue {
    #[default]
    Unset,
    Blue,
    Red,
}

impl MarkingValue {
    pub const fn from_u16(val: u16) -> MarkingValue {
        match val {
            1 => MarkingValue::Blue,
            2 => MarkingValue::Red,
            _ => MarkingValue::Unset,
        }
    }

    pub const fn to_u16(self) -> u16 {
        match self {
            MarkingValue::Blue => 1,
            MarkingValue::Red => 2,
            MarkingValue::Unset => 0,
        }
    }

    pub fn from_string_optional(val: Option<String>) -> MarkingValue {
        match val {
            None => MarkingValue::Unset,
            Some(s) => match s.to_uppercase().as_str() {
                "BLUE" => MarkingValue::Blue,
                "RED" => MarkingValue::Red,
                _ => MarkingValue::Unset,
            },
        }
    }
}

#[cfg_attr(feature = "wasm", wasm_bindgen)]
#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct MarkingsSixShapesColors {
    pub circle: MarkingValue,
    pub square: MarkingValue,
    pub triangle: MarkingValue,
    pub heart: MarkingValue,
    pub star: MarkingValue,
    pub diamond: MarkingValue,
}

impl MarkingsSixShapesColors {
    pub const fn from_bytes(bytes: [u8; 2]) -> Self {
        let u16_val = u16::from_le_bytes(bytes);
        Self {
            circle: MarkingValue::from_u16(u16_val & 3),
            square: MarkingValue::from_u16((u16_val >> 2) & 3),
            triangle: MarkingValue::from_u16((u16_val >> 4) & 3),
            heart: MarkingValue::from_u16((u16_val >> 6) & 3),
            star: MarkingValue::from_u16((u16_val >> 8) & 3),
            diamond: MarkingValue::from_u16((u16_val >> 10) & 3),
        }
    }

    pub const fn to_bytes(self) -> [u8; 2] {
        let mut u16_val = 0u16;
        u16_val |= self.circle.to_u16();
        u16_val |= self.square.to_u16() << 2;
        u16_val |= self.triangle.to_u16() << 4;
        u16_val |= self.heart.to_u16() << 6;
        u16_val |= self.star.to_u16() << 8;
        u16_val |= self.diamond.to_u16() << 10;

        u16_val.to_le_bytes()
    }
}

#[cfg(feature = "wasm")]
#[wasm_bindgen]
impl MarkingsSixShapesColors {
    #[wasm_bindgen(constructor)]
    pub fn from_strings_optional(
        circle: Option<String>,
        square: Option<String>,
        triangle: Option<String>,
        heart: Option<String>,
        star: Option<String>,
        diamond: Option<String>,
    ) -> Self {
        Self {
            circle: MarkingValue::from_string_optional(circle),
            square: MarkingValue::from_string_optional(square),
            triangle: MarkingValue::from_string_optional(triangle),
            heart: MarkingValue::from_string_optional(heart),
            star: MarkingValue::from_string_optional(star),
            diamond: MarkingValue::from_string_optional(diamond),
        }
    }
}

pub enum Markings {
    FourShapes(MarkingsFourShapes),
    SixShapes(MarkingsSixShapes),
    SixShapesWithColor(MarkingsSixShapesColors),
}
