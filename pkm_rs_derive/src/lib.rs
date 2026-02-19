use std::collections::HashSet;

use proc_macro::TokenStream;
use quote::quote;
use syn::{
    Data, DeriveInput, Fields, FnArg, ItemImpl, PatType, parse_macro_input, spanned::Spanned,
};

#[cfg(debug_assertions)]
mod randomize;

#[proc_macro_derive(IsShiny4096)]
pub fn derive_is_shiny_4096(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let struct_name = input.ident;

    // Ensure it's a struct with named fields, otherwise return a compile error
    let fields = match input.data {
        Data::Struct(s) => match s.fields {
            Fields::Named(f) => f.named,
            _ => {
                return syn::Error::new_spanned(
                    struct_name,
                    "IsShiny can only be derived for structs with named fields",
                )
                .to_compile_error()
                .into();
            }
        },
        _ => {
            return syn::Error::new_spanned(struct_name, "IsShiny can only be derived for structs")
                .to_compile_error()
                .into();
        }
    };

    // Check for required fields
    let required = HashSet::from([
        "personality_value".to_owned(),
        "trainer_id".to_owned(),
        "secret_id".to_owned(),
    ]);

    let present_fields: HashSet<_> = fields
        .iter()
        .map(|f| f.ident.as_ref().unwrap().to_string())
        .collect();

    let missing: Vec<_> = required.difference(&present_fields).collect();

    if !missing.is_empty() {
        return syn::Error::new_spanned(
            struct_name,
            format!("Missing required fields: {:?}", missing),
        )
        .to_compile_error()
        .into();
    }

    let expanded = quote! {
        impl crate::pkm::traits::IsShiny for #struct_name {
            fn is_shiny(&self) -> bool {
                (((self.personality_value & 0xffff) as u16) ^
                (((self.personality_value >> 16) & 0xffff) as u16) ^
                self.trainer_id ^
                self.secret_id) < 16
            }

            fn is_square_shiny(&self) -> bool {
                (((self.personality_value & 0xffff) as u16) ^
                (((self.personality_value >> 16) & 0xffff) as u16) ^
                self.trainer_id ^
                self.secret_id) == 0
            }
        }
    };

    TokenStream::from(expanded)
}

#[proc_macro_derive(IsShiny8192)]
pub fn derive_is_shiny_8192(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let struct_name = input.ident;

    // Ensure it's a struct with named fields, otherwise return a compile error
    let fields = match input.data {
        Data::Struct(s) => match s.fields {
            Fields::Named(f) => f.named,
            _ => {
                return syn::Error::new_spanned(
                    struct_name,
                    "IsShiny can only be derived for structs with named fields",
                )
                .to_compile_error()
                .into();
            }
        },
        _ => {
            return syn::Error::new_spanned(struct_name, "IsShiny can only be derived for structs")
                .to_compile_error()
                .into();
        }
    };

    // Check for required fields
    let required = HashSet::from([
        "personality_value".to_owned(),
        "trainer_id".to_owned(),
        "secret_id".to_owned(),
    ]);

    let present_fields: HashSet<_> = fields
        .iter()
        .map(|f| f.ident.as_ref().unwrap().to_string())
        .collect();

    let missing: Vec<_> = required.difference(&present_fields).collect();

    if !missing.is_empty() {
        return syn::Error::new_spanned(
            struct_name,
            format!("Missing required fields: {:?}", missing),
        )
        .to_compile_error()
        .into();
    }

    let expanded = quote! {
        impl crate::pkm::traits::IsShiny for #struct_name {
            fn is_shiny(&self) -> bool {
                (((self.personality_value & 0xffff) as u16) ^
                (((self.personality_value >> 16) & 0xffff) as u16) ^
                self.trainer_id ^
                self.secret_id) < 8
            }

            fn is_square_shiny(&self) -> bool {
                (((self.personality_value & 0xffff) as u16) ^
                (((self.personality_value >> 16) & 0xffff) as u16) ^
                self.trainer_id ^
                self.secret_id) == 0
            }
        }
    };

    TokenStream::from(expanded)
}

#[proc_macro_derive(FormeRef)]
pub fn derive_forme_ref(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let struct_name = input.ident;

    // Ensure it's a struct with named fields, otherwise return a compile error
    let fields = match input.data {
        Data::Struct(s) => match s.fields {
            Fields::Named(f) => f.named,
            _ => {
                return syn::Error::new_spanned(
                    struct_name,
                    "FormeRef can only be derived for structs with named fields",
                )
                .to_compile_error()
                .into();
            }
        },
        _ => {
            return syn::Error::new_spanned(
                struct_name,
                "FormeRef can only be derived for structs",
            )
            .to_compile_error()
            .into();
        }
    };

    let required = HashSet::from(["national_dex".to_owned(), "forme_num".to_owned()]);

    let present_fields: HashSet<_> = fields
        .iter()
        .map(|f| f.ident.as_ref().unwrap().to_string())
        .collect();

    let missing: Vec<_> = required.difference(&present_fields).collect();

    if !missing.is_empty() {
        return syn::Error::new_spanned(
            struct_name,
            format!("Missing required fields: {:?}", missing),
        )
        .to_compile_error()
        .into();
    }

    let expanded = quote! {
        impl crate::pkm::traits::FormeRef for #struct_name {
            fn forme_ref(&self) -> bool {
                (((self.personality_value & 0xffff) as u16) ^
                (((self.personality_value >> 16) & 0xffff) as u16) ^
                self.trainer_id ^
                self.secret_id) < 8
            }
        }
    };

    TokenStream::from(expanded)
}

#[proc_macro_derive(Stats)]
pub fn derive_stats(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let struct_name = input.ident;

    // Ensure it's a struct with named fields, otherwise return a compile error
    let fields = match input.data {
        Data::Struct(s) => match s.fields {
            Fields::Named(f) => f.named,
            _ => {
                return syn::Error::new_spanned(
                    struct_name,
                    "Stats can only be derived for structs with named fields",
                )
                .to_compile_error()
                .into();
            }
        },
        _ => {
            return syn::Error::new_spanned(struct_name, "Stats can only be derived for structs")
                .to_compile_error()
                .into();
        }
    };

    // Check for required fields
    let required = HashSet::from([
        "hp".to_owned(),
        "atk".to_owned(),
        "def".to_owned(),
        "spa".to_owned(),
        "spd".to_owned(),
        "spe".to_owned(),
    ]);

    let present_fields: HashSet<_> = fields
        .iter()
        .map(|f| f.ident.as_ref().unwrap().to_string())
        .collect();

    let missing: Vec<_> = required.difference(&present_fields).collect();

    if !missing.is_empty() {
        return syn::Error::new_spanned(
            struct_name,
            format!("Missing required fields: {:?}", missing),
        )
        .to_compile_error()
        .into();
    }

    let expanded = quote! {
        impl ::pkm_rs_types::Stats for #struct_name {
            fn get_hp(&self) -> u16 {
                self.hp as u16
            }

            fn get_atk(&self) -> u16 {
                self.atk as u16
            }

            fn get_def(&self) -> u16 {
                self.def as u16
            }

            fn get_spa(&self) -> u16 {
                self.spa as u16
            }

            fn get_spd(&self) -> u16 {
                self.spd as u16
            }

            fn get_spe(&self) -> u16 {
                self.spe as u16
            }
        }
    };

    TokenStream::from(expanded)
}

fn is_by_value_non_primitive(ty: &syn::Type) -> bool {
    match ty {
        syn::Type::Reference(_) => false, // references are always safe
        syn::Type::Path(p) => {
            // single identifier path
            if let Some(ident) = p.path.get_ident() {
                !matches!(
                    ident.to_string().as_ref(),
                    "u8" | "u16"
                        | "u32"
                        | "u64"
                        | "i8"
                        | "i16"
                        | "i32"
                        | "i64"
                        | "f32"
                        | "f64"
                        | "bool"
                        | "char"
                        | "Language"
                        | "Ball"
                        | "OriginGame"
                        | "String"
                        | "Vec"
                )
            } else {
                true // complex path (e.g., generic struct) → error
            }
        }
        _ => false, // ignore other types (arrays, tuples) for now
    }
}

/// Macro: #[safe_wasm_impl]
/// - Automatically injects #[wasm_bindgen]
/// - Enforces safe-by-default: any argument taken by value requires #[unsafe_own]
#[proc_macro_attribute]
pub fn safe_wasm_impl(_attr: TokenStream, item: TokenStream) -> TokenStream {
    let impl_block = parse_macro_input!(item as ItemImpl);

    let mut errors = Vec::new();
    // Only enforce if unsafe_own is NOT present
    // Iterate over all methods
    for method in impl_block.items.iter() {
        if let syn::ImplItem::Fn(method_fn) = method {
            // Check for #[unsafe_own]
            if method_fn
                .attrs
                .iter()
                .any(|a| a.path().is_ident("unsafe_own"))
            {
                continue;
            }

            for arg in &method_fn.sig.inputs {
                if let FnArg::Typed(PatType { ty, .. }) = arg
                    && !ty.span().source_text().is_none_or(|s| {
                        s.starts_with("#") || s.starts_with("Vec") || s.starts_with("Option")
                    })
                    && is_by_value_non_primitive(ty)
                {
                    errors.push(syn::Error::new_spanned(
                        ty,
                        format!(
                            "Function argument is a by-value non-primitive. \
                 Add #[unsafe_own] to opt into zero-copy ownership transfer 2, [{:?}]",
                            ty.span().source_text()
                        ),
                    ));
                }
            }
        }
    }

    // Combine all errors into one token stream
    let compile_errors = errors
        .into_iter()
        .map(|e| e.to_compile_error())
        .collect::<proc_macro2::TokenStream>();

    // Return original impl block + all compile errors
    let output = quote! {
        #compile_errors
        #impl_block
    };

    output.into()
}

#[cfg(debug_assertions)]
#[proc_macro_derive(Randomize)]
pub fn derive_randomize(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let name = &input.ident;
    let (impl_generics, ty_generics, where_clause) = input.generics.split_for_impl();

    let randomized_body = match &input.data {
        Data::Struct(data) => randomize::gen_struct_sample(name, &data.fields),
        Data::Enum(data) => {
            randomize::gen_enum_sample(name, &data.variants.iter().collect::<Vec<_>>())
        }
        Data::Union(_) => panic!("Randomize cannot be derived for unions"),
    };

    quote! {
        impl #impl_generics Randomize for #name #ty_generics #where_clause
        {
            fn randomized<R: rand::Rng>(rng: &mut R) -> #name #ty_generics {
                #randomized_body
            }
        }
    }
    .into()
}
