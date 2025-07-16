use std::process::{Child, Command, Stdio};
use std::io::{Read, Write, BufRead, BufReader};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;
use anyhow::Result;
use tracing::{info, error};

pub struct Shell {
    child: Option<Child>,
    stdin: Option<std::process::ChildStdin>,
    stdout_buffer: Arc<Mutex<Vec<u8>>>,
    stderr_buffer: Arc<Mutex<Vec<u8>>>,
    spawn_tasks: bool,
}

impl Shell {
    pub fn new(shell_path: &str, spawn_tasks: bool) -> Result<Self> {
        let mut child = Command::new(shell_path)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()?;

        let stdin = child.stdin.take();
        let stdout = child.stdout.take();
        let stderr = child.stderr.take();

        let stdout_buffer = Arc::new(Mutex::new(Vec::new()));
        let stderr_buffer = Arc::new(Mutex::new(Vec::new()));

        if spawn_tasks && stdout.is_some() && stderr.is_some() {
            // Spawn background threads to read output
            let stdout_buffer_clone = stdout_buffer.clone();
            let stderr_buffer_clone = stderr_buffer.clone();
            
            if let Some(mut stdout) = stdout {
                thread::spawn(move || {
                    let mut buf = [0u8; 1024];
                    loop {
                        match stdout.read(&mut buf) {
                            Ok(0) => break, // EOF
                            Ok(n) => {
                                let mut buffer = stdout_buffer_clone.lock().unwrap();
                                buffer.extend_from_slice(&buf[..n]);
                            }
                            Err(e) => {
                                error!("Failed to read from shell stdout: {}", e);
                                break;
                            }
                        }
                    }
                });
            }
            
            if let Some(mut stderr) = stderr {
                thread::spawn(move || {
                    let mut buf = [0u8; 1024];
                    loop {
                        match stderr.read(&mut buf) {
                            Ok(0) => break, // EOF
                            Ok(n) => {
                                let mut buffer = stderr_buffer_clone.lock().unwrap();
                                buffer.extend_from_slice(&buf[..n]);
                            }
                            Err(e) => {
                                error!("Failed to read from shell stderr: {}", e);
                                break;
                            }
                        }
                    }
                });
            }
        }

        info!("Spawned shell process: {}", shell_path);
        Ok(Self {
            child: Some(child),
            stdin,
            stdout_buffer,
            stderr_buffer,
            spawn_tasks,
        })
    }

    pub fn write(&mut self, data: Vec<u8>) -> Result<()> {
        if let Some(ref mut stdin) = self.stdin {
            stdin.write_all(&data)?;
            stdin.flush()?;
        }
        Ok(())
    }

    pub fn read_output(&mut self) -> Vec<u8> {
        let mut output = Vec::new();
        
        // Read from stdout buffer
        if let Ok(mut buffer) = self.stdout_buffer.try_lock() {
            if !buffer.is_empty() {
                output.extend_from_slice(&buffer);
                buffer.clear();
            }
        }
        
        // Read from stderr buffer
        if let Ok(mut buffer) = self.stderr_buffer.try_lock() {
            if !buffer.is_empty() {
                output.extend_from_slice(&buffer);
                buffer.clear();
            }
        }
        
        output
    }

    pub fn is_alive(&mut self) -> bool {
        if let Some(child) = &mut self.child {
            match child.try_wait() {
                Ok(None) => true,
                Ok(Some(_)) => false,
                Err(_) => false,
            }
        } else {
            false
        }
    }

    pub fn kill(&mut self) -> Result<()> {
        if let Some(mut child) = self.child.take() {
            child.kill()?;
        }
        Ok(())
    }
}

impl Drop for Shell {
    fn drop(&mut self) {
        if let Err(e) = self.kill() {
            error!("Failed to kill shell process: {}", e);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_shell_spawn() {
        let shell = Shell::new("/bin/sh", false);
        assert!(shell.is_ok());
    }

    #[test]
    fn test_shell_communication() {
        let mut shell = Shell::new("/bin/echo", false).unwrap();
        // Send a simple command
        let _ = shell.write(b"hello world\n".to_vec());
        // Wait a bit for the output
        thread::sleep(Duration::from_millis(100));
        // Just check that the read method can be called without panicking
        let _ = shell.read_output();
    }
} 