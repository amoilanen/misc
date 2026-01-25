use crate::error::AppError;
use crate::watcher::WatcherState;
use tauri::State;

#[tauri::command]
pub async fn watch_directory(
    state: State<'_, WatcherState>,
    path: String,
) -> Result<(), AppError> {
    state.watch(&path)
}

#[tauri::command]
pub async fn unwatch_directory(
    state: State<'_, WatcherState>,
    path: String,
) -> Result<(), AppError> {
    state.unwatch(&path)
}
