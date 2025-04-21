use crate::config::Model;
use anyhow::{Context, Result};
use reqwest::Client;
use crate::executor::Plan;
use serde_json::{self, Value};
use std::fs;
use url::Url;
use jsonpath_lib::select as jsonpath_select;

#[derive(Debug, PartialEq)]
struct ContextContent {
    source: String,
    content: String,
}

pub async fn ask_llm(
    model_config: &Model,
    prompt: &str,
    context_sources: &[String],
    client: &Client
) -> Result<String> {
    let combined_context = get_combined_context(context_sources, client).await?;
    fetch_llm_response(prompt, model_config, combined_context.as_deref(), client).await
}

pub async fn ask_llm_for_plan(
    model_config: &Model,
    instruction: &str,
    context_sources: &[String],
    client: &Client
) -> Result<Plan> {
    let combined_context = get_combined_context(context_sources, client).await?;

    let plan_prompt = format!(
        "Based on the following instruction and context, create a step-by-step plan to achieve the goal.
        Output the plan ONLY as a JSON object matching the following Typescript interface:

        ```rust
    #[derive(Serialize, Deserialize, Debug, Clone)]
    #[serde(tag = \\\"action\\\", rename_all = \\\"snake_case\\\")]
    pub enum Action {{
        CreateFile {{ path: String, content: String }},
        RunCommand {{ command: String }},
        SearchWeb {{ query: String }},
        AskUser {{ question: String }},
        DeleteFile {{ path: String }},
        EditFile {{ path: String, content: String }},
        Respond {{ message: String }},
    }}

    #[derive(Serialize, Deserialize, Debug, Clone)]
    pub struct Plan {{
        pub thought: Option<String>,
        pub steps: Vec<Action>,
    }}
        ```

        Instruction: {}

        Context: {}

        Respond ONLY with a valid JSON object",
        instruction,
        combined_context.as_deref().unwrap_or("No context provided.")
    );

    let plan_response = fetch_llm_response(&plan_prompt, model_config, combined_context.as_deref(), client).await?;
    let response_json = strip_json_fence(&plan_response);
    println!("Response = '{}'", response_json);
    let plan: Plan = serde_json::from_str(response_json)
        .with_context(|| format!("Failed to parse extracted plan JSON string. Extracted string:\n{}", plan_response))?;
    Ok(plan)
}

async fn get_combined_context(context_sources: &[String], client: &Client) -> Result<Option<String>> {
    let fetched_context = fetch_context(context_sources, client).await?;
    let combined_context = if !fetched_context.is_empty() {
        Some(
            fetched_context
                .iter()
                .map(|c| format!("Context from {}:\n{}\n", c.source, c.content))
                .collect::<Vec<_>>()
                .join("\n"),
        )
    } else {
        None
    };
    Ok(combined_context)
}

async fn fetch_context(context_sources: &[String], client: &Client) -> Result<Vec<ContextContent>> {
    let mut fetched_contents = Vec::new();

    for source in context_sources {
        let content = if source.starts_with("http://") || source.starts_with("https://") {
            let url = Url::parse(source)?;
            let response = client.get(url.clone()).send().await
                .with_context(|| format!("Failed to fetch URL: {}", source))?;
            if !response.status().is_success() {
                anyhow::bail!("Failed to fetch URL: {} - Status: {}", source, response.status());
            }
            response.text().await
                .with_context(|| format!("Failed to read content from URL: {}", source))?
        } else {
            fs::read_to_string(source)
                .with_context(|| format!("Failed to read file: {}", source))?
        };
        fetched_contents.push(ContextContent {
            source: source.clone(),
            content
        });
    }
    Ok(fetched_contents)
}

async fn fetch_llm_response(
    prompt: &str,
    model_config: &Model,
    combined_context: Option<&str>,
    client: &Client
) -> Result<String> {
    let request_body = &model_config.request_format
        .replace("{{prompt}}", &prompt)
        .replace("{{model}}", &model_config.model_identifier.clone().unwrap_or("?".to_string()))
        .replace("{{context}}", combined_context.as_deref().unwrap_or(""));

    let mut request_builder = client.post(&model_config.api_url).body(request_body.to_string());

    if let Some(api_key) = &model_config.api_key {
        if let Some(api_key_header) = &model_config.api_key_header {
            if let Some((header_name, header_value)) = api_key_header.split_once(":") {
                let header_name = header_name.trim();
                let header_value = header_value.replace("{{api_key}}", api_key);
                request_builder = request_builder.header(header_name, header_value);
            } else {
                eprintln!("Warning: Invalid api_key_header format. Expected 'Header-Name: Header-Value': '{}'", api_key_header);
                request_builder = request_builder.bearer_auth(api_key);
            }
        } else {
            request_builder = request_builder.bearer_auth(api_key);
        }
    }

    let response = request_builder.send().await
        .with_context(|| format!("Failed to send request to {}", model_config.api_url))?;

    if !response.status().is_success() {
        let status = response.status();
        let error_body = response.text().await.unwrap_or_else(|_| "Could not read error body".to_string());
        anyhow::bail!(
            "LLM API request failed for model '{}' with status: {}. Response: {}",
            model_config.name,
            status,
            error_body
        );
    }
    let response_text = response.text().await
        .with_context(|| "Failed to read LLM response text")?;
    let response_json: Value = serde_json::from_str(&response_text)
        .with_context(|| format!("Failed to parse LLM response as JSON. Raw response:\n{}", response_text))?;

    let selected_values = jsonpath_select(&response_json, &model_config.response_json_path)
        .map_err(|e| anyhow::anyhow!("JSONPath selection error: {}", e))?;

    match selected_values.first() {
        Some(Value::String(answer)) => Ok(answer.clone()),
        Some(other) => anyhow::bail!(
            "Expected a string at JSONPath '{}', but found: {:?}",
            &model_config.response_json_path,
            other
        ),
        None => {
            anyhow::bail!("Could not extract the value using the defined path, response='{}', path = '{}'", &response_json, &model_config.response_json_path);
        }
    }
}

fn strip_json_fence(s: &str) -> &str {
    s.trim().strip_prefix("```json")
     .and_then(|s| s.strip_suffix("```"))
     .map(str::trim)
     .unwrap_or(s)
}

#[cfg(test)]
mod tests {
    use super::*;
    use httpmock::prelude::*;
    use tokio;

    #[test]
    fn test_strip_json_fence() {
        let input = r#"
        ```json
        {
          "steps": [
            {
              "action": "create_file",
              "path": "hello.py",
              "content": "print('Hello, world!')"
            }
          ]
        }
        ```"#;
       let expected = r#"{
          "steps": [
            {
              "action": "create_file",
              "path": "hello.py",
              "content": "print('Hello, world!')"
            }
          ]
        }"#;
       let result = strip_json_fence(input);
       assert_eq!(result, expected)
    }

    #[tokio::test]
    async fn test_fetch_context_file_not_found() {
        let client = Client::new();
        let sources = vec!["nonexistent_file.txt".to_string()];
        let result = fetch_context(&sources, &client).await;
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("Failed to read file"));
    }

    #[tokio::test]
    async fn test_fetch_context_url_success() -> Result<()> {
        let server = MockServer::start();
        let mock_url = server.url("/test-page");
        let content = "<html>Hello World</html>";
        let mock = server.mock(|when, then| {
            when.method(GET).path("/test-page");
            then.status(200).body(content);
        });

        let client = Client::new();

        let sources = vec![mock_url.clone()];
        let result = fetch_context(&sources, &client).await?;

        mock.assert();
        assert_eq!(result, vec![ContextContent {
            source: mock_url.to_string(),
            content: content.to_string()
        }]);
        Ok(())
    }

     #[tokio::test]
    async fn test_fetch_context_url_error() {
        let server = MockServer::start();
        let client = Client::new();

        let mock_url = server.url("/error-page");
         let mock = server.mock(|when, then| {
            when.method(GET).path("/error-page");
            then.status(404);
        });

        let sources = vec![mock_url.clone()];
        let result = fetch_context(&sources, &client).await;

        mock.assert();
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("Status: 404"));
    }

    #[tokio::test]
    async fn test_ask_llm_with_format_string() {
        let server = MockServer::start();
        let client = Client::new();

        let mock_url = server.url("/formatted-test");
        let mock = server.mock(|when, then| {
            when.method(POST)
                .path("/formatted-test")
                .body("{\"model\": \"test_model\", \"input\": \"test prompt\", \"context\": \"Context from test_context_file:\ntest context\n\"}");
            then.status(200)
                .header("Content-Type", "application/json")
                .body(r#"{"answer": "test answer"}"#);
        });

        let model_config = Model {
            name: "Test Model".to_string(),
            api_url: mock_url.clone(),
            api_key: None,
            api_key_header: None,
            model_identifier: Some("test_model".to_string()),
            request_format: r#"{"model": "{{model}}", "input": "{{prompt}}", "context": "{{context}}"}"#.to_string(),
            response_json_path: "$.answer".to_string(),
        };

        let prompt = "test prompt";
        let context_sources = vec!["test_context_file".to_string()];

        fs::write("test_context_file", "test context").unwrap();

        let result = ask_llm(&model_config, prompt, &context_sources, &client).await;

        fs::remove_file("test_context_file").unwrap();

        mock.assert();
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "test answer");
    }
}
