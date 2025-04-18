use anyhow::Result;
use clap::{Parser, Subcommand};
use crate::config::{Config, Model};
use crate::llm::{ask_llm, generate_plan_llm}; // Import ask and plan generation
use reqwest::Client;

mod config;
mod executor; // Make the executor module visible
mod llm;

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = "Cognitor: An LLM Agent CLI")]
struct Cli {
    #[command(subcommand)]
    command: Commands,

    /// Use a specific model for this command, overriding default/current
    #[arg(short, long, global = true)]
    model: Option<String>,

    /// JSONPath expression to extract the response text from the LLM API response body
    #[arg(long, global = true)]
    response_json_path: Option<String>,
}

#[derive(Subcommand, Debug)]
enum Commands {
    /// Ask a question to the configured LLM
    Ask {
        /// The prompt/question to ask the LLM
        prompt: String,

        /// Files or URLs to provide as context
        #[arg(short, long, value_delimiter = ',')]
        context: Vec<String>,
        #[arg(short, long, default_value = "false")]
        internet_search: bool,
    },
    /// Ask the LLM to generate a plan and execute it
    Act {
        /// The instruction or goal for the LLM
        instruction: String,

        /// Automatically confirm and execute all actions in the plan
        #[arg(long, default_value = "false")]
        auto_confirm: bool,

        /// Files or URLs to provide as context
        #[arg(short, long, value_delimiter = ',')]
        context: Vec<String>,
        #[arg(short, long, default_value = "false")]
        internet_search: bool,
    },
    /// Manage LLM configurations
    Config(ConfigArgs),
}

#[derive(Parser, Debug)]
struct ConfigArgs {
    #[command(subcommand)]
    action: ConfigAction,
}

#[derive(Subcommand, Debug)]
enum ConfigAction {
    /// Add a new model configuration
    Add {
        #[arg(short, long)]
        name: String,
        #[arg(long)]
        api_url: String,
        #[arg(long)]
        api_key: Option<String>,
        #[arg(long)]
        api_key_header: Option<String>,
        #[arg(long)]
        model_identifier: Option<String>, // e.g., "gpt-4", "claude-3-opus"
        #[arg(long)]
        request_format: Option<String>,
        #[arg(long)]
        response_json_path: Option<String>, // Add the argument
    },
    /// Set the default model
    SetDefault {
        /// Name of the model to set as default
        name: String,
    },
    /// Set the current model for this session (temporary override)
    SetCurrent {
         /// Name of the model to set as current
        name: String,
    },
    /// Clear the current model selection, falling back to default
    ClearCurrent,
    /// List all configured models
    List,
    /// Delete a configured model
    Delete {
        /// Name of the model to delete
        name: String,
    },
    /// Show the current configuration path
    Path,
}

#[tokio::main]
async fn main() -> Result<()> {
    let cli = Cli::parse();
    let mut config = Config::load()?;
    let client = Client::new();

    // Apply model override first
    if let Some(model_name) = &cli.model {
        if config.set_current_model(model_name).is_err() {
            eprintln!("Warning: Model '{}' not found, using default/active model.", model_name);
        }
    }
    // Note: cli.response_path is handled within the ask_llm/generate_plan_llm functions

    match cli.command {
        Commands::Ask { prompt, context, internet_search: _ } => {
            //println!("Processing 'ask' command...");
            if let Some(active_model) = config.get_active_model() {
                //println!("Using model: {}", active_model.name);
                // Pass the CLI response_json_path
                match ask_llm(active_model, &prompt, &context, &client, cli.response_json_path.as_deref()).await {
                    Ok(answer) => println!("{}\n", answer),
                    Err(e) => eprintln!("Error during LLM call: {}", e),
                }
            } else {
                eprintln!("Error: No active model configured. Use 'cognitor config add' and 'cognitor config set-default'.");
                std::process::exit(1);
            }
        }
        Commands::Act { instruction, context, internet_search: _, auto_confirm } => { // Added auto_confirm
            println!("Processing 'act' command...");
            if let Some(active_model) = config.get_active_model() {
                println!("Using model: {}", active_model.name);
                 // Pass the CLI response_json_path
                match generate_plan_llm(active_model, &instruction, &context, &client, cli.response_json_path.as_deref()).await {
                    Ok(plan) => {
                        plan.display();
                        // Pass auto_confirm to the execution logic
                        if let Err(exec_err) = executor::execute_plan(&plan, auto_confirm).await {
                            eprintln!("Error during plan execution: {}", exec_err);
                        }
                    }
                    Err(e) => eprintln!("Error generating plan: {}", e),
                    // TODO: Revisit confirmation logic placement. Maybe move into execute_plan?
                    // For now, execute_plan will handle confirmation internally based on auto_confirm.
                }
            } else {
                eprintln!("Error: No active model configured. Use 'cognitor config add' and 'cognitor config set-default'.");
                std::process::exit(1);
            }
        }
        Commands::Config(args) => {
            handle_config_action(args.action, &mut config)?;
        }
    }

    Ok(())
}

fn handle_config_action(action: ConfigAction, config: &mut Config) -> Result<()> {
    match action {
        ConfigAction::Add { name, api_url, api_key, api_key_header, model_identifier, request_format, response_json_path } => { // Add param
            let new_model = Model {
                name: name.clone(),
                api_url,
                api_key,
                api_key_header,
                model_identifier,
                request_format,
                response_json_path, // Add field
            };
            config.add_model(new_model);
            config.save()?;
            println!("Model '{}' added.", name);
        }
        ConfigAction::SetDefault { name } => {
            config.set_default_model(&name)?;
            config.save()?;
            println!("Default model set to '{}'.", name);
        }
        ConfigAction::SetCurrent { name } => {
            config.set_current_model(&name)?;
            println!("Current model for this session set to '{}'.", name);
        }
        ConfigAction::ClearCurrent => {
            config.clear_current_model();
            println!("Current model selection cleared. Using default model.");
        }
        ConfigAction::List => {
            println!("Configured Models:");
            if config.models.is_empty() {
                println!("  No models configured.");
            } else {
                for (name, model) in &config.models {
                    let is_default = config.default_model.as_ref() == Some(name);
                    let is_current = config.current_model.as_ref() == Some(name);
                    let default_marker = if is_default { " (default)" } else { "" };
                    let current_marker = if is_current && Some(name) != config.default_model.as_ref() { " (current)" } else { "" };

                    println!(
                        "  - {}{}{}: URL={}, Key={}, Identifier={}",
                        name,
                        default_marker,
                        current_marker,
                        model.api_url,
                        model.api_key.as_deref().map_or("Not Set", |_|"Set"),
                        model.model_identifier.as_deref().unwrap_or("Not Set")
                    );
                }
            }
            println!(
                "\nActive model for next command (unless overridden): {}",
                config.get_active_model().map_or("None", |m| &m.name)
            );
        }
        ConfigAction::Delete { name } => {
            config.delete_model(&name)?;
            config.save()?;
            println!("Model '{}' deleted.", name);
        }
        ConfigAction::Path => match Config::config_path() {
            Ok(path) => println!("Config file path: {:?}", path),
            Err(e) => eprintln!("Error determining config path: {}", e),
        },
    }
    Ok(())
}
