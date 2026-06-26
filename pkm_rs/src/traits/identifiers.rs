pub trait Pid {
    fn get_pid(&self) -> u32;

    fn set_pid(&mut self, value: u32);
}

pub trait EncryptionConstant {
    fn get_encryption_constant(&self) -> u32;

    fn set_encryption_constant(&mut self, value: u32);
}

pub trait TrainerId {
    fn get_trainer_id(&self) -> u16;

    fn set_trainer_id(&mut self, value: u16);
}

pub trait SecretId {
    fn get_secret_id(&self) -> u16;

    fn set_secret_id(&mut self, value: u16);
}
