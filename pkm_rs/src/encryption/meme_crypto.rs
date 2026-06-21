use aes::{
    Aes128,
    cipher::{BlockCipherEncrypt, KeyInit},
};
use num::{BigInt, bigint::Sign};
use sha1::{Digest as Sha1Digest, Sha1};
use sha2::Sha256;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MemeCrypto {
    SunMoon,
    UltraSunUltraMoon,
}

impl MemeCrypto {
    pub const fn checksum_signature_length(&self) -> usize {
        match self {
            Self::SunMoon => 0x140,
            Self::UltraSunUltraMoon => 0x150,
        }
    }

    pub const fn meme_crypto_offset(&self) -> usize {
        (match self {
            Self::SunMoon => 0x6ba00,
            Self::UltraSunUltraMoon => 0x6c000,
        }) + SAVE_FILE_SIGNATURE_OFFSET
    }

    pub fn sign_in_place(&self, bytes: &mut [u8]) {
        sign_with_meme_crypto(bytes, *self);
    }
}

const SAVE_FILE_SIGNATURE_OFFSET: usize = 0x100;
const MEME_SIGNATURE_LENGTH: usize = 0x80;

fn sign_with_meme_crypto(bytes: &mut [u8], variant: MemeCrypto) {
    use sha2::Digest;

    let checksum_signature_len = variant.checksum_signature_length();
    let meme_crypto_offset = variant.meme_crypto_offset();

    let (remaining_bytes, checksum_table) = bytes.split_at_mut(bytes.len() - 0x200);

    let signature_span =
        &mut remaining_bytes[meme_crypto_offset..meme_crypto_offset + MEME_SIGNATURE_LENGTH];

    let checksum_block_span = &checksum_table[..checksum_signature_len];

    let hash = Sha256::digest(checksum_block_span);
    signature_span[0..32].copy_from_slice(&hash);

    sign_meme_data_in_place(signature_span);
}

const DIGEST_LENGTH: usize = 8;

fn sign_meme_data_in_place(bytes: &mut [u8]) {
    let byte_len = bytes.len();

    let (payload_bytes, digest_bytes) = bytes.split_at_mut(byte_len - DIGEST_LENGTH);
    digest_bytes.copy_from_slice(&Sha1::digest(payload_bytes)[0..DIGEST_LENGTH]);

    let key = MemeKey::pokedex_and_save_file();
    key.aes_encrypt(bytes);

    let signature_buffer = &mut bytes[byte_len - SIGNATURE_LENGTH..];
    signature_buffer[0] &= 0x7f;

    let rsa_encrypted = key.rsa_private(signature_buffer);

    signature_buffer.copy_from_slice(&rsa_encrypted);
}

const POKEDEX_AND_SAVE_FILE_MEME_KEY_BYTES: [u8; 126] = [
    0x30, 0x7c, 0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05,
    0x00, 0x03, 0x6b, 0x00, 0x30, 0x68, 0x02, 0x61, 0x00, 0xb6, 0x1e, 0x19, 0x20, 0x91, 0xf9, 0x0a,
    0x8f, 0x76, 0xa6, 0xea, 0xaa, 0x9a, 0x3c, 0xe5, 0x8c, 0x86, 0x3f, 0x39, 0xae, 0x25, 0x3f, 0x03,
    0x78, 0x16, 0xf5, 0x97, 0x58, 0x54, 0xe0, 0x7a, 0x9a, 0x45, 0x66, 0x01, 0xe7, 0xc9, 0x4c, 0x29,
    0x75, 0x9f, 0xe1, 0x55, 0xc0, 0x64, 0xed, 0xdf, 0xa1, 0x11, 0x44, 0x3f, 0x81, 0xef, 0x1a, 0x42,
    0x8c, 0xf6, 0xcd, 0x32, 0xf9, 0xda, 0xc9, 0xd4, 0x8e, 0x94, 0xcf, 0xb3, 0xf6, 0x90, 0x12, 0x0e,
    0x8e, 0x6b, 0x91, 0x11, 0xad, 0xda, 0xf1, 0x1e, 0x7c, 0x96, 0x20, 0x8c, 0x37, 0xc0, 0x14, 0x3f,
    0xf2, 0xbf, 0x3d, 0x7e, 0x83, 0x11, 0x41, 0xa9, 0x73, 0x02, 0x03, 0x01, 0x00, 0x01,
];

const SIGNING_KEY: [u8; 97] = [
    0x00, 0x77, 0x54, 0x55, 0x66, 0x8f, 0xff, 0x3c, 0xba, 0x30, 0x26, 0xc2, 0xd0, 0xb2, 0x6b, 0x80,
    0x85, 0x89, 0x59, 0x58, 0x34, 0x11, 0x57, 0xae, 0xb0, 0x3b, 0x6b, 0x04, 0x95, 0xee, 0x57, 0x80,
    0x3e, 0x21, 0x86, 0xeb, 0x6c, 0xb2, 0xeb, 0x62, 0xa7, 0x1d, 0xf1, 0x8a, 0x3c, 0x9c, 0x65, 0x79,
    0x07, 0x76, 0x70, 0x96, 0x1b, 0x3a, 0x61, 0x02, 0xda, 0xbe, 0x5a, 0x19, 0x4a, 0xb5, 0x8c, 0x32,
    0x50, 0xae, 0xd5, 0x97, 0xfc, 0x78, 0x97, 0x8a, 0x32, 0x6d, 0xb1, 0xd7, 0xb2, 0x8d, 0xcc, 0xcb,
    0x2a, 0x3e, 0x01, 0x4e, 0xdb, 0xd3, 0x97, 0xad, 0x33, 0xb8, 0xf2, 0x8c, 0xd5, 0x25, 0x05, 0x42,
    0x51,
];

const SIGNATURE_LENGTH: usize = 0x60;
const AES_CHUNK_LENGTH: usize = 0x10;

struct MemeKey<'a> {
    der: &'a [u8],
    private_key: BigInt,
    _public_key: BigInt,
    modulo: BigInt,
}

impl<'a> MemeKey<'a> {
    pub fn new(der: &'a [u8]) -> Self {
        Self {
            der,
            private_key: BigInt::from_bytes_be(Sign::Plus, &SIGNING_KEY),
            _public_key: BigInt::from_bytes_be(Sign::Plus, &der[0x7b..0x7e]),
            modulo: BigInt::from_bytes_be(Sign::Plus, &der[0x18..0x79]),
        }
    }

    pub fn pokedex_and_save_file() -> Self {
        Self::new(&POKEDEX_AND_SAVE_FILE_MEME_KEY_BYTES)
    }

    pub fn aes_encrypt(&self, data: &mut [u8]) {
        let (payload, signature) = data.split_at_mut(data.len() - SIGNATURE_LENGTH);

        let key = self.get_aes_key(payload);

        let cipher = Aes128::new_from_slice(&key).expect("AES key length should be valid");
        let next_xor = &mut [0u8; AES_CHUNK_LENGTH];

        let mut i = 0usize;
        while i < signature.len() {
            let block = &mut signature[i..i + AES_CHUNK_LENGTH];

            xor_bytes_in_place(block, next_xor);

            cipher.encrypt_block(block.try_into().expect("block is correct length"));
            next_xor.copy_from_slice(block);

            i += AES_CHUNK_LENGTH;
        }

        xor_bytes_in_place(next_xor, &signature[0..AES_CHUNK_LENGTH]);
        let sub_key = self.get_sub_key(next_xor);

        let mut i = 0usize;
        while i < signature.len() {
            xor_bytes_in_place(&mut signature[i..i + AES_CHUNK_LENGTH], &sub_key);

            i += AES_CHUNK_LENGTH;
        }

        let mut next_xor = [0u8; AES_CHUNK_LENGTH];
        let mut i = signature.len() - AES_CHUNK_LENGTH;
        loop {
            let temp: [u8; AES_CHUNK_LENGTH] =
                signature[i..i + AES_CHUNK_LENGTH].try_into().unwrap();
            let block = &mut signature[i..i + AES_CHUNK_LENGTH];

            cipher.encrypt_block(block.try_into().expect("block is correct length"));

            xor_bytes_in_place(block, &next_xor);
            next_xor.copy_from_slice(&temp);

            if i == 0 {
                break;
            }
            i -= AES_CHUNK_LENGTH;
        }
    }

    fn get_sub_key(&self, temp: &[u8]) -> [u8; AES_CHUNK_LENGTH] {
        let mut sub_key = [0u8; AES_CHUNK_LENGTH];
        let mut i = 0usize;

        while i < temp.len() {
            let b1 = temp[i];
            let b2 = temp[i + 1];

            sub_key[i] = b1.overflowing_mul(2).0.overflowing_add(b2 >> 7).0;
            sub_key[i + 1] = b2.overflowing_mul(2).0;

            if i + 2 < temp.len() {
                sub_key[i + 1] = sub_key[i + 1].overflowing_add(temp[i + 2] >> 7).0;
            }

            i += 2;
        }

        if temp[0] & 0x80 != 0 {
            sub_key[0xf] ^= 0x87;
        }

        sub_key
    }

    pub fn get_aes_key(&self, bytes: &[u8]) -> [u8; AES_CHUNK_LENGTH] {
        let mut payload = self.der.to_vec();
        payload.extend_from_slice(bytes);

        Sha1::digest(payload)[..AES_CHUNK_LENGTH]
            .try_into()
            .expect("AES_CHUNK_LENGTH sized array")
    }

    // fn rsa_public(&self, bytes: &[u8]) -> Vec<u8> {
    //     let m = BigInt::from_bytes_be(Sign::Plus, bytes);
    //     let c = m.modpow(&self.public_key, &self.modulo);
    //     c.to_bytes_be().1
    // }

    fn rsa_private(&self, bytes: &[u8]) -> Vec<u8> {
        let m = BigInt::from_bytes_be(Sign::Plus, bytes);
        let c = m.modpow(&self.private_key, &self.modulo);
        c.to_bytes_be().1
    }
}

fn xor_bytes_in_place(lhs: &mut [u8], rhs: &[u8]) {
    for (b, k) in lhs.iter_mut().zip(rhs.iter()) {
        *b ^= k;
    }
}

#[cfg(test)]
mod tests {
    use crate::result::Result;
    use std::path::Path;

    use super::*;
    use crate::tests::save_bytes_from_file;

    fn bigint_to_hex_string(bigint: &BigInt) -> String {
        bigint.to_str_radix(16)
    }

    fn bytes_to_hex_string(bytes: &[u8]) -> String {
        BigInt::from_bytes_be(Sign::Plus, bytes).to_str_radix(16)
    }

    #[test]
    fn memekey_private_is_accurate() -> Result<()> {
        let private = MemeKey::new(&POKEDEX_AND_SAVE_FILE_MEME_KEY_BYTES).private_key;
        assert_eq!(
            bigint_to_hex_string(&private),
            "775455668fff3cba3026c2d0b26b8085895958341157aeb03b6b0495ee57803e2186eb6cb2eb62a71df18a3c9c6579077670961b3a6102dabe5a194ab58c3250aed597fc78978a326db1d7b28dcccb2a3e014edbd397ad33b8f28cd525054251"
        );

        Ok(())
    }

    #[test]
    fn memekey_public_is_accurate() -> Result<()> {
        let public = MemeKey::new(&POKEDEX_AND_SAVE_FILE_MEME_KEY_BYTES)._public_key;
        assert_eq!(bigint_to_hex_string(&public), "10001");
        Ok(())
    }

    #[test]
    fn memekey_modulo_is_accurate() -> Result<()> {
        let modulo = MemeKey::new(&POKEDEX_AND_SAVE_FILE_MEME_KEY_BYTES).modulo;
        assert_eq!(
            bigint_to_hex_string(&modulo),
            "b61e192091f90a8f76a6eaaa9a3ce58c863f39ae253f037816f5975854e07a9a456601e7c94c29759fe155c064eddfa111443f81ef1a428cf6cd32f9dac9d48e94cfb3f690120e8e6b9111addaf11e7c96208c37c0143ff2bf3d7e831141a973"
        );
        Ok(())
    }

    #[test]
    fn memekey_aes_key_is_accurate() -> Result<()> {
        let moon_bytes = save_bytes_from_file(&Path::new("gen7-alola").join("moon"))?;

        let aes_payload = &moon_bytes[..moon_bytes.len() - SIGNATURE_LENGTH];
        let key_bytes =
            MemeKey::new(&POKEDEX_AND_SAVE_FILE_MEME_KEY_BYTES).get_aes_key(aes_payload);

        assert_eq!(
            bytes_to_hex_string(&key_bytes),
            "7a10b8ae4a34bb592638f90301ac72c8"
        );
        Ok(())
    }

    #[test]
    fn expected_memekey_encrypt_moon_save() -> Result<()> {
        let mut moon_bytes = save_bytes_from_file(&Path::new("gen7-alola").join("moon"))?;
        MemeKey::new(&POKEDEX_AND_SAVE_FILE_MEME_KEY_BYTES).aes_encrypt(&mut moon_bytes);

        assert_eq!(
            bytes_to_hex_string(&moon_bytes[0..100]),
            "2d0070051d0070054d007004dd007000cd007004ed00700d9040000fb0400000e28000008280000de0400003b060000da0400005ec800000628000056130000f50400001e060000ee0400004e5b01005b14000007300000f304000057070000c0060000"
        );

        Ok(())
    }

    // #[test]
    // fn rsa_public_is_correct() -> Result<()> {
    //     let moon_bytes = save_bytes_from_file(&Path::new("gen7-alola").join("moon"))?;
    //     let key = MemeKey::new(&POKEDEX_AND_SAVE_FILE_MEME_KEY_BYTES);
    //     let ciphertext = key.rsa_public(&moon_bytes[..1000]);

    //     assert_eq!(
    //         bytes_to_hex_string(&ciphertext),
    //         "2aba82bedb9bf467703ab8047adb8179614ec3e5467da6a63eb9fa05e4bdbc2eea3e1c24d3080fc9ceebb5a29957ec6d7b39cdcaf3ad0d0425a139c23f893205b130150a01d40307e3db93700afbb7481927ffaff89631f7d93d8f5595328e21"
    //     );

    //     Ok(())
    // }

    #[test]
    fn rsa_private_is_correct() -> Result<()> {
        let moon_bytes = save_bytes_from_file(&Path::new("gen7-alola").join("moon"))?;
        let key = MemeKey::new(&POKEDEX_AND_SAVE_FILE_MEME_KEY_BYTES);
        let ciphertext = key.rsa_private(&moon_bytes[..1000]);

        assert_eq!(
            bytes_to_hex_string(&ciphertext),
            "1fd81da0c10c63dcf3cbd1d0703190477736ee9cdba46ce8dee9bcaeace1457f79b0ffd9ea8031f60c56ccacc8acdea4c7bc54e540308673e35c15d1b907034627fb65a427d7f4b1ff2b6c84e6058698ac62dd66b74db21c7c301bf55d9e5fde"
        );

        Ok(())
    }

    #[test]
    fn sign_meme_data_in_place_is_correct() -> Result<()> {
        let mut moon_bytes = save_bytes_from_file(&Path::new("gen7-alola").join("moon"))?;
        sign_meme_data_in_place(&mut moon_bytes[0..1000]);

        assert_eq!(
            bytes_to_hex_string(&moon_bytes[0..1000]),
            "2d0070051d0070054d007004dd007000cd007004ed00700d9040000fb0400000e28000008280000de0400003b060000da0400005ec800000628000056130000f50400001e060000ee0400004e5b01005b14000007300000f304000057070000c0060000f90400000f2800005918000053200000ef04000028050000522400000d540000e0040000f70400001a06000046120000f004000003050000740700000b3c0000f8040000f105000001b80700df040000f6080000ec050000ef050000ed050000470e0000390800000a040000ee050000581400003708000000090000550b000009040000e40400004305000042050000190600003f0400004c040000ed0400008a060000a7060000730700001b070000580b00000f0500006f070000ec0400000e050000450a0000e1040000538b00000c050000740400007504000076040000770400004405000088070000890700008a0700008b0700008c0700008d0700008e0700008f070000900700009107000092070000930700009407000095070000960700009707000098070000e70400005c040000410500005a0800001a05000094060040a60600409306000095060000ea0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ab0f33c17012f8228d4119f14d5d9cd8031b502b33463e092a60d64780003631dbe6b2716c695828b35c41d815ab72eeee0df950936f56d5d0bfee96c5a2a2f1202953265253d508cd2bc54cea4d56ede3c93ce418b9cc0566cccfa32bd42833"
        );

        Ok(())
    }

    #[test]
    fn sign_with_meme_crypto_last_1000_bytes() -> Result<()> {
        let mut moon_bytes = save_bytes_from_file(&Path::new("gen7-alola").join("moon"))?;

        sign_with_meme_crypto(&mut moon_bytes, MemeCrypto::SunMoon);

        assert_eq!(
            bytes_to_hex_string(&moon_bytes[moon_bytes.len() - 1000..]),
            "18b50b000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007139a86c7933bfb7fd13a2ef51005b8a0977c7b9dd93bfcac38ee64259138fba48c77d73de977f2ba64625ff41a5fe45b1f39c0e11af18aed2ab4ebd583bdc802a19637156a3c4b1a86738e1cb6bf3c16c7dcb9427c65c0853349628c63520707d21db0e78fb864c22f2e9393b359c85249dab0d4825270bcd9e0fb1b896cc6700000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006aa84b75060700003ba395bf0507000046454542e00d00000000a51c7c000000010055581400000002002f79c0000000030046fd1c0600000400fcf4000e000005005098780f00000600b72e280200000700589b04010000080055090002000009000efc200000000a000704040000000b00f67b580000000c004bf8e60500000d00c524006603000e008db22c5700000f00be370800000010000576801000001100777b081a00001200902c0864000013002bde08640000140002ae9839000015001523000100001600a3f0000100001700409b280501001800cb54040200001900d21d600b00001a00e5e7503f00001b00a5a6580300001c0015cd280700001d004949000200001e005aaf180700001f00aa3cfc010000200012ed00020000210099f0200100002200cff0c80100002300c49f000200002400bfe800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
        );

        Ok(())
    }
}
