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

fn skip_symbols_while(line: &[u8], f: fn(u8) -> bool, position: usize) -> Result<usize, LogParseError> {
    let (_, position) = read_string_while(line, f, position)?;
    Ok(position)
}

fn read_string_while(line: &[u8], f: fn(u8) -> bool, position: usize) -> Result<(String, usize), LogParseError> {
    let mut position = position;
    let mut chars: Vec<u8> = Vec::new();
    while position < line.len() && f(line[position]) {
        chars.push(line[position]);
        position = position + 1;
    }
    let result = String::from_utf8(chars.clone())?;

    Ok((result, position))
}

fn read_symbol(line: &[u8], symbol: u8, position: usize) -> Result<usize, LogParseError> {
    if position < line.len() && line[position] == symbol {
        Ok(position + 1)
    } else {
        Err(LogParseError::InvalidFormat(format!("Expected symbol '{}' at position {} in {:?}", symbol as char, position, String::from_utf8(line.to_vec())?)))
    }
}

fn read_level(line: &[u8], position: usize) -> Result<(LogLevel, usize), LogParseError> {
    let mut position = position;
    position = read_symbol(line, b'[', position)?;
    let (level, position_after_level) = read_string_while(line, |ch| ch != b']', position)?;
    position = read_symbol(line, b']', position_after_level)?;
    let log_level = match level.to_lowercase().as_str() {
        "info" => Ok(LogLevel::Info),
        "warn" => Ok(LogLevel::Warn),
        "error" => Ok(LogLevel::Error),
        "debug" => Ok(LogLevel::Debug),
        _ => Err(LogParseError::InvalidLevel(format!("Unknown log level {} in {:?}", level, String::from_utf8(line.to_vec())?)))
    }?;
    Ok((log_level, position))
}

fn read_timestamp(line: &[u8], position: usize) -> Result<(u64, usize), LogParseError> {
    let mut position = position;
    position = skip_symbols_while(line, |ch| ch == b' ', position)?;
    let (timestamp_str, position_after_timestamp) = read_string_while(line, |ch| ch != b' ' && ch != b'-' , position)?;
    let timestamp = timestamp_str.parse::<u64>().map_err(|err| LogParseError::InvalidTimestamp(format!("Could not parse timestamp {:?}. Error = {}", &timestamp_str, err)))?;
    Ok((timestamp, position_after_timestamp))
}

fn read_message(line: &[u8], position: usize) -> Result<(String, usize), LogParseError> {
    let mut position = position;
    position = skip_symbols_while(line, |ch| ch == b' ', position)?;
    position = read_symbol(line, b'-', position)?;
    position = skip_symbols_while(line, |ch| ch == b' ', position)?;
    let (message, position_after_message) = read_string_while(line, |_| true, position)?;
    if message.len() == 0 {
        Err(LogParseError::InvalidFormat(format!("Empty message part in '{}'", String::from_utf8(line.to_vec())?)))
    } else {
        Ok((message, position_after_message))
    }
}

pub fn process_log_line(line: &str) -> Result<LogEntry, LogParseError> {
    let line_bytes = line.as_bytes();
    let (level, after_level_position) = read_level(line_bytes, 0)?;
    let (timestamp, after_timestamp_position) = read_timestamp(line_bytes, after_level_position)?;
    let (message, after_timestamp_position) = read_message(line_bytes, after_timestamp_position)?;

    if after_timestamp_position != line.len() {
        Err(LogParseError::InvalidFormat(format!("Unparsed input still left in '{}' after position {}", line, after_level_position)))
    } else {
        Ok(LogEntry {
            level,
            timestamp,
            message
        })
    }
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
        assert_eq!(result, Err(LogParseError::InvalidFormat("Empty message part in '[WARN] 1678886400 -'".into())));
    }

    #[test]
    fn test_wrong_format() {
        let line = "Just a random string";
        let result = process_log_line(line);
        assert_eq!(result, Err(LogParseError::InvalidFormat("Expected symbol '[' at position 0 in \"Just a random string\"".into())));
    }
}
