use crate::error::AppError;
use notify::{Event, RecommendedWatcher, RecursiveMode, Watcher};
use std::collections::HashSet;
use std::path::Path;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, Manager};

#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct FsChangeEvent {
    paths: Vec<String>,
    kind: String,
}

pub struct WatcherState {
    watcher: Arc<Mutex<RecommendedWatcher>>,
    watched_paths: Arc<Mutex<HashSet<String>>>,
}

impl WatcherState {
    pub fn watch(&self, path: &str) -> Result<(), AppError> {
        let mut watched = self.watched_paths.lock().unwrap();
        if watched.contains(path) {
            return Ok(()); // Already watching
        }

        let mut watcher = self.watcher.lock().unwrap();
        watcher.watch(Path::new(path), RecursiveMode::NonRecursive)?;
        watched.insert(path.to_string());
        Ok(())
    }

    pub fn unwatch(&self, path: &str) -> Result<(), AppError> {
        let mut watched = self.watched_paths.lock().unwrap();
        if !watched.contains(path) {
            return Ok(()); // Not watching
        }

        let mut watcher = self.watcher.lock().unwrap();
        let _ = watcher.unwatch(Path::new(path)); // Ignore errors on unwatch
        watched.remove(path);
        Ok(())
    }
}

pub fn init_watcher(app: AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let (tx, rx) = std::sync::mpsc::channel::<notify::Result<Event>>();

    let watcher = RecommendedWatcher::new(tx, notify::Config::default())?;

    let app_clone = app.clone();
    std::thread::spawn(move || {
        for event in rx {
            if let Ok(event) = event {
                let kind = format!("{:?}", event.kind);
                let paths: Vec<String> = event
                    .paths
                    .iter()
                    .map(|p| p.to_string_lossy().to_string())
                    .collect();

                let _ = app_clone.emit(
                    "fs:change",
                    FsChangeEvent { paths, kind },
                );
            }
        }
    });

    app.manage(WatcherState {
        watcher: Arc::new(Mutex::new(watcher)),
        watched_paths: Arc::new(Mutex::new(HashSet::new())),
    });

    Ok(())
}
