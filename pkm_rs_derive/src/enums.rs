use proc_macro::TokenStream;
use quote::quote;
use syn::{Data, DeriveInput, parse_macro_input};

pub fn enum_max(input: TokenStream) -> TokenStream {
    let input = parse_macro_input!(input as DeriveInput);
    let name = &input.ident;

    // Ensure it's an enum
    let enum_data = match &input.data {
        Data::Enum(data) => data,
        _ => {
            return syn::Error::new_spanned(&input, "EnumMax can only be derived for enums")
                .to_compile_error()
                .into();
        }
    };

    let mut max_variant = None;

    // Search for the #[max] attribute on the variants
    for variant in &enum_data.variants {
        for attr in &variant.attrs {
            if attr.meta.path().is_ident("max") {
                // Ensure the user didn't accidentally tag multiple variants
                if max_variant.is_some() {
                    return syn::Error::new_spanned(
                        attr,
                        "Only one variant can be marked with #[max]",
                    )
                    .to_compile_error()
                    .into();
                }
                max_variant = Some(&variant.ident);
            }
        }
    }

    // Extract the found variant, or throw an error if none were tagged
    let max_ident = match max_variant {
        Some(ident) => ident,
        None => {
            return syn::Error::new_spanned(&input, "You must mark one variant with #[max]")
                .to_compile_error()
                .into();
        }
    };

    TokenStream::from(quote! {
        impl #name {
            pub const MAX: usize = Self::#max_ident as usize;
        }
    })
}
