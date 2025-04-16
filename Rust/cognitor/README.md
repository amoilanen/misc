# Cognitor: An LLM Agent CLI

Cognitor is a command-line tool written in Rust for interacting with Large Language Models (LLMs). It allows you to configure different LLM backends, ask questions, and give instructions for the agent to execute tasks based on a generated plan.

**⚠️ Security Warning:** The `do` command allows the LLM to generate and execute arbitrary shell commands after user confirmation. Be extremely cautious about the instructions you provide and the plans you approve, especially when interacting with powerful or unfamiliar LLMs. Ensure you understand the commands before confirming execution.

## Features

*   **Multiple LLM Configurations:** Add and manage connection details (API URL, key, model identifier) for different LLMs.
*   **Default & Current Models:** Set a default LLM and override it with a specific model for the current session or command.
*   **`ask` Command:** Ask direct questions to the configured LLM. Provide context via local files or URLs.
*   **`do` Command:** Give instructions to the LLM. It will:
    *   Generate a step-by-step plan (currently supports creating files and running shell commands).
    *   Display the plan for review.
    *   Ask for user confirmation before execution.
    *   Execute the confirmed plan.
*   **Context Awareness:** Include content from files or web pages in your prompts using the `-c` or `--context` flag.

## Installation

1.  **Prerequisites:** Ensure you have Rust and Cargo installed. You can get them from [rustup.rs](https://rustup.rs/).
2.  **Clone the repository (if applicable):**
    ```bash
    # git clone <repository-url>
    # cd cognitor
    ```
3.  **Build the project:**
    ```bash
    cd cognitor # Navigate into the project directory if you haven't already
    cargo build --release
    ```
4.  **Run the executable:** The compiled binary will be located at `target/release/cognitor`. You can run it directly or copy it to a location in your system's PATH (e.g., `~/.local/bin` or `/usr/local/bin`).
    ```bash
    # Example: Copy to local bin
    # mkdir -p ~/.local/bin
    # cp target/release/cognitor ~/.local/bin/
    # Ensure ~/.local/bin is in your PATH
    ```

## Configuration

Cognitor stores its configuration in `~/.config/cognitor/config.toml`. This file is created automatically on first run if it doesn't exist.

**Commands:**

*   **Show config file path:**
    ```bash
    cognitor config path
    ```
*   **Add a new model:**
    ```bash
    cargo run -- config add --name=gpt --api-url=https://api.openai.com/v1/responses --api-key=$OPENAI_API_KEY --model-identifier=gpt-4.1-mini --request-format='{"model": "{{model}}", "input": "{{prompt}}"}'"}'

    # Note: API key and model identifier are optional depending on the API.
    # The current implementation sends a generic payload; adapt llm.rs for specific APIs.

    ```
*   **List configured models:**
    ```bash
    cognitor config list
    ```
*   **Set the default model:**
    ```bash
    cognitor config set-default my-ollama
    ```
*   **Set the current model (for this session only, not saved):**
    ```bash
    cognitor config set-current lmstudio-chat
    ```
*   **Clear the current model selection (reverts to default):**
    ```bash
    cognitor config clear-current
    ```

## Usage Examples

*   **Ask a simple question (uses default model):**
    ```bash
    cognitor ask "What is the capital of France?"
    ```
*   **Ask using a specific model:**
    ```bash
    cognitor --model lmstudio-chat ask "Explain the concept of closures in Rust."
    ```
*   **Ask with context from a file:**
    ```bash
    cognitor ask "Summarize the main points of this document." -c ./report.txt
    ```
*   **Ask with context from a URL:**
    ```bash
    cognitor ask "What are the key features mentioned on this page?" -c https://example.com/features
    ```
*   **Ask with multiple contexts:**
    ```bash
    cognitor ask "Compare the approaches in these two files." -c file1.rs,file2.rs
    ```
*   **Give an instruction for the `do` command:**
    ```bash
    cognitor do "Create a python script named 'hello.py' that prints 'Hello, Cognitor!' and then run it."
    ```
    *(Cognitor will generate a plan, show it, and ask for confirmation before creating `hello.py` and running `python hello.py`)*

*   **`do` command with context:**
    ```bash
    cognitor do "Refactor the code in main.py based on the suggestions in review.txt" -c main.py,review.txt
    ```
    *(The LLM will use the content of both files to generate the plan)*

## Development Notes

*   **LLM API Compatibility:** The request/response structures in `src/llm.rs` (`LlmRequestPayload`, `LlmResponsePayload`) and the plan generation prompt are currently generic. You will likely need to modify them to match the specific requirements of the LLM API you are targeting.
*   **Action Implementation:** The `SearchWeb` and `AskUser` actions in `src/executor.rs` are not yet implemented.
*   **Testing:** More comprehensive tests are needed, especially for mocking LLM responses and filesystem/command interactions during plan execution.

## Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests.
