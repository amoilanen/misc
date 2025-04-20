use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::{self, Write};
use std::process::{Command, Stdio};

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "action", rename_all = "snake_case")]
pub enum Action {
    CreateFile { path: String, content: String },
    RunCommand { command: String },
    SearchWeb { query: String },
    AskUser { question: String },
    DeleteFile { path: String },
    EditFile { path: String, content: String },
    Respond { message: String },
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Plan {
    pub thought: Option<String>,
    pub steps: Vec<Action>,
}

impl Action {
    fn execute(&self) -> Result<()> {
        match self {
            Action::CreateFile { path, content } => {
                println!("Action: Create file '{}'", path);
                if let Some(parent_dir) = std::path::Path::new(path).parent() {
                    fs::create_dir_all(parent_dir)
                        .with_context(|| format!("Failed to create parent directories for '{}'", path))?;
                }
                fs::write(path, content)
                    .with_context(|| format!("Failed to write file: {}", path))?;
                println!("Success: File '{}' created.", path);
            },
            Action::EditFile { path, content } => {
                println!("Action: Edit/Overwrite file '{}'", path);
                if !std::path::Path::new(path).exists() {
                    println!("Warning: File '{}' does not exist, creating it.", path);
                    if let Some(parent_dir) = std::path::Path::new(path).parent() {
                        fs::create_dir_all(parent_dir)
                            .with_context(|| format!("Failed to create parent directories for '{}'", path))?;
                    }
                }
                fs::write(path, content)
                    .with_context(|| format!("Failed to write file: {}", path))?;
                println!("Success: File '{}' updated.", path);
            },
            Action::DeleteFile { path } => {
                println!("Action: Delete file '{}'", path);
                if std::path::Path::new(path).exists() {
                    fs::remove_file(path)
                        .with_context(|| format!("Failed to delete file: {}", path))?;
                    println!("Success: File '{}' deleted.", path);
                } else {
                    println!("Warning: File '{}' does not exist, skipping deletion.", path);
                }
            },
            Action::RunCommand { command } => {
                println!("Action: Run command `{}`", command);
                let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/sh".to_string());
                let mut cmd = Command::new(shell);
                cmd.arg("-c");
                cmd.arg(command);

                cmd.stdin(Stdio::inherit());
                cmd.stdout(Stdio::inherit());
                cmd.stderr(Stdio::inherit());

                let status = cmd.status()
                    .with_context(|| format!("Failed to execute command: {}", command))?;

                if status.success() {
                    println!("Success: Command executed successfully.");
                } else {
                    anyhow::bail!("Command failed with status: {}", status);
                }
            },
            Action::SearchWeb { query } => {
                //TODO:
                println!("  Action: Search web for '{}'", query);
                println!("  (Web search not yet implemented)");
                println!("  Skipping: Web search functionality is not available.");
            },
            Action::AskUser { question } => {
                //TODO:
                println!("  Action: Ask user '{}'", question);
                println!("  (Asking user not yet implemented)");
                println!("  Skipping: Asking user functionality is not available.");
            },
            Action::Respond { message } => {
                //TODO:
                println!("--- Final Response ---");
                println!("{}", message);
                println!("----------------------");
            }
        }
        Ok(())
    }
}

impl Plan {
    pub fn display(&self) {
        println!("\n--- Proposed Plan ---");
        if let Some(thought) = &self.thought {
            println!("Thought: {}", thought);
        }
        if self.steps.is_empty() {
            println!("No actions planned.");
            return;
        }
        for (i, action) in self.steps.iter().enumerate() {
            match action {
                Action::CreateFile { path, content } => println!("{}. Create file '{}' with content:\n{}", i + 1, path, content),
                Action::RunCommand { command } => println!("{}. Run command: `{}`", i + 1, command),
                Action::SearchWeb { query } => println!("{}. Search web for: '{}'", i + 1, query),
                Action::AskUser { question } => println!("{}. Ask user: '{}'", i + 1, question),
                Action::DeleteFile { path } => println!("{}. Delete file: '{}'", i + 1, path),
                Action::EditFile { path, content } => println!("{}. Edit file '{}' with content:\n{}", i + 1, path, content),
                Action::Respond { message } => println!("{}. Respond: '{}'", i + 1, message),
            }
        }
        println!("--------------------");
    }
}

pub async fn execute_plan(plan: &Plan, auto_confirm: bool) -> Result<()> {
    println!("\n--- Executing Plan ---");
    if plan.steps.is_empty() {
        println!("No actions to execute.");
        return Ok(());
    }

    let mut current_auto_confirm = auto_confirm;

    for (i, action) in plan.steps.iter().enumerate() {
        println!("\n--- Step {}/{}: {:?} ---", i + 1, plan.steps.len(), action);
        let (new_auto_confirm, confirmed) = ask_for_confirmation(current_auto_confirm).await?;
        current_auto_confirm = new_auto_confirm;
        if confirmed {
            action.execute()?;
        } else {
            println!("Skipping step {}.", i + 1);
        }
    }
    println!("\n--- Plan Execution Finished ---");
    Ok(())
}

async fn ask_for_confirmation(current_auto_confirm: bool) -> Result<(bool, bool)> {
    let mut current_auto_confirm = current_auto_confirm;
    let mut confirmed = current_auto_confirm;
    if !current_auto_confirm {
        print!("Execute this step? (y/N/all): ");
        io::stdout().flush()?;
        let mut input = String::new();
        io::stdin().read_line(&mut input)?;
        let choice = input.trim().to_lowercase();
        if choice == "y" || choice == "yes" {
            confirmed = true;
        } else if choice == "a" || choice == "all" {
            confirmed = true;
            current_auto_confirm = true;
        }
    }
    Ok((current_auto_confirm, confirmed))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_plan_serialization() {
        let plan = Plan {
            thought: Some("Create a hello world script and run it".to_string()),
            steps: vec![
                Action::CreateFile {
                    path: "hello.sh".to_string(),
                    content: "#!/bin/bash\necho 'Hello World!'".to_string(),
                },
                Action::RunCommand {
                    command: "bash hello.sh".to_string(),
                },
                 Action::Respond { message: "Script executed.".to_string() },
            ],
        };

        let json = serde_json::to_string_pretty(&plan).unwrap();
        println!("Serialized Plan:\n{}", json);

        let deserialized_plan: Plan = serde_json::from_str(&json).unwrap();

        assert_eq!(plan.steps.len(), deserialized_plan.steps.len());
        assert!(matches!(deserialized_plan.steps[0], Action::CreateFile { .. }));
        assert!(matches!(deserialized_plan.steps[1], Action::RunCommand { .. }));
        assert!(matches!(deserialized_plan.steps[2], Action::Respond { message: _ }));
    }
}
