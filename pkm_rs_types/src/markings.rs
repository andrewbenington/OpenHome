use serde::Serialize;

#[cfg(feature = "wasm")]
use wasm_bindgen::prelude::*;

use crate::BitSet;

#[derive(Debug, Default, Serialize, Clone, Copy)]
pub struct MarkingsFourShapes {
    pub circle: bool,
    pub square: bool,
    pub triangle: bool,
    pub heart: bool,
}

impl MarkingsFourShapes {
    pub const fn from_byte(byte: u8) -> Self {
        Self {
            circle: byte & 0b000001 == 0b000001,
            square: byte & 0b000010 == 0b000010,
            triangle: byte & 0b000100 == 0b000100,
            heart: byte & 0b001000 == 0b001000,
        }
    }

    pub fn to_byte(self) -> u8 {
        let mut byte = 0u8;
        byte.set_bit(0, self.circle);
        byte.set_bit(1, self.square);
        byte.set_bit(2, self.triangle);
        byte.set_bit(3, self.heart);

        byte
    }
}

impl From<MarkingsSixShapes> for MarkingsFourShapes {
    fn from(other: MarkingsSixShapes) -> Self {
        MarkingsFourShapes {
            circle: other.circle,
            square: other.square,
            triangle: other.triangle,
            heart: other.heart,
        }
    }
}

impl From<MarkingsSixShapesColors> for MarkingsFourShapes {
    fn from(value: MarkingsSixShapesColors) -> Self {
        MarkingsFourShapes {
            circle: MarkingValue::to_uncolored(value.circle),
            square: MarkingValue::to_uncolored(value.square),
            triangle: MarkingValue::to_uncolored(value.triangle),
            heart: MarkingValue::to_uncolored(value.heart),
        }
    }
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

impl MarkingsSixShapes {
    pub const fn from_byte(byte: u8) -> Self {
        Self {
            circle: byte & 0b000001 == 0b000001,
            square: byte & 0b000010 == 0b000010,
            triangle: byte & 0b000100 == 0b000100,
            heart: byte & 0b001000 == 0b001000,
            star: byte & 0b010000 == 0b010000,
            diamond: byte & 0b100000 == 0b100000,
        }
    }

    pub fn to_byte(self) -> u8 {
        let mut byte = 0u8;
        byte.set_bit(0, self.circle);
        byte.set_bit(1, self.square);
        byte.set_bit(2, self.triangle);
        byte.set_bit(3, self.heart);
        byte.set_bit(4, self.star);
        byte.set_bit(5, self.diamond);

        byte
    }
}

impl From<MarkingsFourShapes> for MarkingsSixShapes {
    fn from(other: MarkingsFourShapes) -> Self {
        MarkingsSixShapes {
            circle: other.circle,
            square: other.square,
            triangle: other.triangle,
            heart: other.heart,
            ..Default::default()
        }
    }
}

impl From<MarkingsSixShapesColors> for MarkingsSixShapes {
    fn from(value: MarkingsSixShapesColors) -> Self {
        MarkingsSixShapes {
            circle: MarkingValue::to_uncolored(value.circle),
            square: MarkingValue::to_uncolored(value.square),
            triangle: MarkingValue::to_uncolored(value.triangle),
            heart: MarkingValue::to_uncolored(value.heart),
            star: MarkingValue::to_uncolored(value.star),
            diamond: MarkingValue::to_uncolored(value.diamond),
        }
    }
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

    pub const fn from_uncolored(val: bool) -> MarkingValue {
        match val {
            true => MarkingValue::Blue,
            false => MarkingValue::Unset,
        }
    }

    pub const fn to_uncolored(self) -> bool {
        matches!(self, MarkingValue::Blue)
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

impl From<MarkingsFourShapes> for MarkingsSixShapesColors {
    fn from(value: MarkingsFourShapes) -> Self {
        MarkingsSixShapesColors {
            circle: MarkingValue::from_uncolored(value.circle),
            square: MarkingValue::from_uncolored(value.square),
            triangle: MarkingValue::from_uncolored(value.triangle),
            heart: MarkingValue::from_uncolored(value.heart),
            ..Default::default()
        }
    }
}

impl From<MarkingsSixShapes> for MarkingsSixShapesColors {
    fn from(value: MarkingsSixShapes) -> Self {
        MarkingsSixShapesColors {
            circle: MarkingValue::from_uncolored(value.circle),
            square: MarkingValue::from_uncolored(value.square),
            triangle: MarkingValue::from_uncolored(value.triangle),
            heart: MarkingValue::from_uncolored(value.heart),
            star: MarkingValue::from_uncolored(value.star),
            diamond: MarkingValue::from_uncolored(value.diamond),
        }
    }
}

pub enum Markings {
    FourShapes(MarkingsFourShapes),
    SixShapes(MarkingsSixShapes),
    SixShapesWithColor(MarkingsSixShapesColors),
}
