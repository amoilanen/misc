use std::string::FromUtf8Error;

#[derive(PartialEq, Debug)]
pub enum LogParseError {
    InvalidFormat(String),
    InvalidLevel(String),
    InvalidTimestamp(String),
    EmptyMessage
}

impl From<FromUtf8Error> for LogParseError {
    fn from(err: FromUtf8Error) -> Self {
        LogParseError::InvalidFormat(format!("Invalid UTF-8 sequence: {}", err))
    }
}

#[derive(PartialEq, Debug)]
pub enum LogLevel {
    Info,
    Warn,
    Error,
    Debug
}

#[derive(PartialEq, Debug)]
pub struct LogEntry {
     level: LogLevel,
     timestamp: u64,
     message: String,
}

fn extract_log_level(line: &str) -> Result<(LogLevel, usize), LogParseError> {
    if !line.starts_with('[') {
        return Err(LogParseError::InvalidFormat(format!(
            "Expected symbol '[' at position 0 in \"{}\"",
            line
        )));
    }

    let closing_bracket = line.find(']').ok_or_else(|| {
        LogParseError::InvalidFormat(format!("Missing closing bracket ']' in \"{}\"", line))
    })?;

    let level_str = &line[1..closing_bracket];
    let level = match level_str.trim() {
        "INFO" => LogLevel::Info,
        "WARN" => LogLevel::Warn,
        "ERROR" => LogLevel::Error,
        "DEBUG" => LogLevel::Debug,
        _ => return Err(LogParseError::InvalidLevel(format!(
            "Unknown log level {} in \"{}\"",
            level_str, line
        ))),
    };

    Ok((level, closing_bracket + 1))
}

fn parse_timestamp_and_message(line: &str, start_pos: usize) -> Result<(u64, String), LogParseError> {
    let rest_of_line = &line[start_pos..];
    
    let parts: Vec<&str> = rest_of_line.splitn(2, '-').collect();
    if parts.len() != 2 {
        return Err(LogParseError::InvalidFormat(format!(
            "Missing separator '-' in \"{}\"",
            line
        )));
    }

    let timestamp_str = parts[0].trim();
    let message = parts[1].trim();

    if message.is_empty() {
        return Err(LogParseError::EmptyMessage);
    }

    let timestamp = timestamp_str.parse::<u64>().map_err(|e| {
        LogParseError::InvalidTimestamp(format!(
            "Could not parse timestamp \"{}\". Error = {}",
            timestamp_str, e
        ))
    })?;

    Ok((timestamp, message.to_string()))
}

pub fn process_log_line(line: &str) -> Result<LogEntry, LogParseError> {
    let line = line.trim();

    let (level, timestamp_start) = extract_log_level(line)?;
    let (timestamp, message) = parse_timestamp_and_message(line, timestamp_start)?;

    Ok(LogEntry {
        level,
        timestamp,
        message,
    })
}

#[cfg(test)]
mod tests {
    use crate::log_processor::{process_log_line, LogLevel};
    use super::*;

    #[test]
    fn test_parse_valid_info_line() {
        let line = "[INFO] 1678886400 - User 'Alice' logged in.";
        assert_eq!(process_log_line(line), Ok(LogEntry {
            level: LogLevel::Info,
            timestamp: 1678886400,
            message: "User 'Alice' logged in.".into()
        }))
    }

    #[test]
    fn test_parse_valid_error_line() {
        let line = "[ERROR] 1678886405 - Database connection failed.";
        assert_eq!(process_log_line(line), Ok(LogEntry {
            level: LogLevel::Error,
            timestamp: 1678886405,
            message: "Database connection failed.".into()
        }))
    }

    #[test]
    fn test_invalid_input_missing_brackets_around_level() {
        let line = "INFO 1678886400 - Missing brackets";
        let result = process_log_line(line);
        assert_eq!(result, Err(LogParseError::InvalidFormat("Expected symbol '[' at position 0 in \"INFO 1678886400 - Missing brackets\"".into())));
    }

    #[test]
    fn test_invalid_level() {
        let line = "[CRITICAL] 1678886400 - Unknown level" ;
        let result = process_log_line(line);
        assert_eq!(result, Err(LogParseError::InvalidLevel("Unknown log level CRITICAL in \"[CRITICAL] 1678886400 - Unknown level\"".into())));
    }

    #[test]
    fn test_invalid_timestamp() {
        let line = "[INFO] not_a_timestamp - Invalid timestamp"  ;
        let result = process_log_line(line);
        assert_eq!(result, Err(LogParseError::InvalidTimestamp("Could not parse timestamp \"not_a_timestamp\". Error = invalid digit found in string".into())));
    }

    #[test]
    fn test_empty_message() {
        let line = "[WARN] 1678886400 -";
        let result = process_log_line(line);
        assert_eq!(result, Err(LogParseError::EmptyMessage));
    }

    #[test]
    fn test_wrong_format() {
        let line = "Just a random string";
        let result = process_log_line(line);
        assert_eq!(result, Err(LogParseError::InvalidFormat("Expected symbol '[' at position 0 in \"Just a random string\"".into())));
    }

    #[test]
    fn test_variable_whitespace() {
        let line = "[INFO]     1678886400  -  User 'Alice' logged in.  ";
        assert_eq!(process_log_line(line), Ok(LogEntry {
            level: LogLevel::Info,
            timestamp: 1678886400,
            message: "User 'Alice' logged in.".into()
        }));

        let line = "[  INFO  ]  1678886400    -     Extra spaces everywhere     ";
        assert_eq!(process_log_line(line), Ok(LogEntry {
            level: LogLevel::Info,
            timestamp: 1678886400,
            message: "Extra spaces everywhere".into()
        }));
    }
}
