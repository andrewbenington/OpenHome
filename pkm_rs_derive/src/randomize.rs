use quote::quote;
use syn::Fields;

pub fn gen_struct_sample(name: &syn::Ident, fields: &Fields) -> proc_macro2::TokenStream {
    match fields {
        Fields::Named(fields) => {
            let inits = fields.named.iter().map(|f| {
                let fname = &f.ident;
                quote! { #fname: Randomize::randomized(rng) }
            });
            quote! { #name { #(#inits),* } }
        }
        Fields::Unnamed(fields) => {
            let inits = fields
                .unnamed
                .iter()
                .map(|_| quote! { Randomize::randomized(rng) });
            quote! { #name(#(#inits),*) }
        }
        Fields::Unit => quote! { #name },
    }
}

pub fn gen_enum_sample(name: &syn::Ident, variants: &[&syn::Variant]) -> proc_macro2::TokenStream {
    if variants.is_empty() {
        panic!("Cannot derive Randomize for empty enums");
    }

    let count = variants.len();
    let arms = variants.iter().enumerate().map(|(i, v)| {
        let vident = &v.ident;
        let init = match &v.fields {
            Fields::Named(fields) => {
                let inits = fields.named.iter().map(|f| {
                    let fname = &f.ident;
                    quote! { #fname: Randomize::randomized(rng) }
                });
                quote! { #name::#vident { #(#inits),* } }
            }
            Fields::Unnamed(fields) => {
                let inits = fields
                    .unnamed
                    .iter()
                    .map(|_| quote! { Randomize::randomized(rng) });
                quote! { #name::#vident(#(#inits),*) }
            }
            Fields::Unit => quote! { #name::#vident },
        };
        quote! { #i => #init }
    });

    quote! {
        match rand::RngExt::random_range(rng, 0..#count) {
            #(#arms,)*
            _ => unreachable!(),
        }
    }
}
