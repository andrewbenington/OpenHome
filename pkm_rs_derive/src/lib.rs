use std::collections::HashSet;

use proc_macro::TokenStream;
use quote::quote;
use syn::{Data, DeriveInput, Fields, parse_macro_input};

#[proc_macro_derive(DummyTrait)]
pub fn derive_dummy(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let struct_name = input.ident;

    // Ensure it's a struct with named fields, otherwise return a compile error
    let fields = match input.data {
        Data::Struct(s) => match s.fields {
            Fields::Named(f) => f.named,
            _ => {
                return syn::Error::new_spanned(
                    struct_name,
                    "DummyTrait can only be derived for structs with named fields",
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
    let required = HashSet::from(["save".to_owned()]);

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
        impl #struct_name {
            fn hello() {
                println!("Hello, world!");
            }
        }
    };

    TokenStream::from(expanded)
}

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
