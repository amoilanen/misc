use anyhow::Result;
use tracing::info;

mod app;
mod config;
mod terminal;
mod shell;
mod ui;
mod utils;

use app::FerriteApp;

fn main() -> Result<()> {
    // Initialize logging
    tracing_subscriber::fmt::init();
    info!("Starting Ferrite terminal emulator");

    // Initialize the application
    let app = FerriteApp::new()?;

    // Run the GUI
    let options = eframe::NativeOptions::default();

    eframe::run_native(
        "Ferrite Terminal",
        options,
        Box::new(|_cc| Box::new(app)),
    ).map_err(|e| anyhow::anyhow!("Failed to run application: {:?}", e))?;

    Ok(())
} 