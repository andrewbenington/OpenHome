use std::path::PathBuf;

use clap::Parser;
use openhome_core::Result;
use openhome_core::logging::LogConfig;

mod cli;
mod pkm;
mod save;

#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
enum RootCommand {
    Example(ExampleArgs),
    #[command(subcommand)]
    Pkm(pkm::PkmCommand),
    #[command(subcommand)]
    Save(save::SaveCommand),
}

/// Simple program to greet a person
#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
struct ExampleArgs {
    /// Name of the person to greet
    #[arg(short, long)]
    name: String,

    /// Number of times to greet
    #[arg(short, long, default_value_t = 1)]
    count: u8,
}

fn main() -> Result<()> {
    let root = RootCommand::parse();
    LogConfig::Stdout.init();

    match root {
        RootCommand::Example(example_args) => println!("{:?}", example_args),
        RootCommand::Save(save_command) => save_command.execute()?,
        RootCommand::Pkm(pkm_command) => pkm_command.execute()?,
    }

    Ok(())
}
