# CLIFF: Command Line Interface Friend & Facilitator

CLIFF is a command-line tool written in Rust for interacting with Large Language Models (LLMs). It allows you to configure different LLM backends, ask questions, and give instructions for the agent to execute tasks based on a generated plan.

![CLIFF Logo](images/cliff.png)

**⚠️ Security Warning:** The `act` command allows the LLM to generate and execute arbitrary shell commands after user confirmation. Be extremely cautious about the instructions you provide and the plans you approve, especially when interacting with powerful or unfamiliar LLMs. Ensure you understand the commands before confirming execution.

## Features

*   **Multiple LLM Configurations:** Add and manage connection details (API URL, key, model identifier) for different LLMs.
*   **Default & Current Models:** Set a default LLM and override it with a specific model for the current session or command.
*   **`ask` Command:** Ask direct questions to the configured LLM. Provide context via local files or URLs.
*   **`act` Command:** Give instructions to the LLM. It will:
    *   Generate a step-by-step plan (currently supports creating files and running shell commands).
    *   Display the plan for review.
    *   Ask for user confirmation before execution.
    *   Execute the confirmed plan.
*   **Context Awareness:** Include content from files or web pages in your prompts using the `-c` or `--context` flag.

## Installation

**Prerequisites:** Ensure you have Rust and Cargo installed. You can get them from [rustup.rs](https://rustup.rs/).

**Build the project:**
    ```bash
    cargo build --release
    cargo install .
    ```

## Configuration

cliff stores its configuration in `~/.config/cliff/config.toml`. This file is created automatically on first run if it doesn't exist.

**Commands:**

*   **Show config file path:**
    ```bash
    cliff config path
    ```
*   **Add a new model:**
    ```bash
    cargo run -- config add --name=gemini --api-url=https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent --api-key=$GEMINI_API_KEY --api-key-header="x-goog-api-key: {{api_key}}" --model-identifier=gemini-1.5-flash --request-format='{"contents": [{"parts":[{"text": "{{prompt}}"}]}]}' --response-json-path='$.candidates[0].content.parts[0].text'

    # Note: API key and model identifier are optional depending on the API

    ```
*   **List configured models:**
    ```bash
    cliff config list
    ```
*   **Set the default model:**
    ```bash
    cliff config set-default gemini
    ```
*   **Set the current model (for this session only, not saved):**
    ```bash
    cliff config set-current gemini
    ```
*   **Clear the current model selection (reverts to default):**
    ```bash
    cliff config clear-current
    ```

## Usage Examples

*   **Ask a simple question (uses default model):**
    ```bash
    cliff ask "What is the capital of France?"
    ```
*   **Ask using a specific model:**
    ```bash
    cliff --model gemini ask "Explain the concept of closures in Rust."
    ```
*   **Ask with context from a file:**
    ```bash
    cliff ask "Summarize the main points of this document." -c ./report.txt
    ```
*   **Ask with context from a URL:**
    ```bash
    cliff ask "What are the key features mentioned on this page?" -c https://example.com/features
    ```
*   **Ask with multiple contexts:**
    ```bash
    cliff ask "Compare the approaches in these two files." -c file1.rs,file2.rs
    ```
*   **Give an instruction for the `act` command:**
    ```bash
    cliff act "Create a python script named 'hello.py' that prints 'Hello, cliff!' and then run it."
    ```
    *(cliff will generate a plan, show it, and ask for confirmation before creating `hello.py` and running `python hello.py`)*

*   **`act` command with context:**
    ```bash
    cliff act "Refactor the code in main.py based on the suggestions in review.txt" -c main.py,review.txt
    ```
    *(The LLM will use the content of both files to generate the plan)*

## Development Notes

*   **Action Implementation:** The `SearchWeb` and `AskUser` actions in `src/executor.rs` are not yet implemented.
*   **Testing:** More comprehensive tests are needed, especially for mocking LLM responses and filesystem/command interactions during plan execution