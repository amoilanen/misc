use crate::error::AppError;
use std::fs;
use std::path::Path;
use tauri::{AppHandle, Emitter};

#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct OperationProgress {
    operation: String,
    current_file: String,
    files_done: usize,
    files_total: usize,
}

#[tauri::command]
pub async fn create_directory(path: String) -> Result<(), AppError> {
    let dir_path = Path::new(&path);

    if dir_path.exists() {
        return Err(AppError::AlreadyExists(path));
    }

    // Validate the name
    if let Some(name) = dir_path.file_name() {
        let name_str = name.to_string_lossy();
        if name_str.is_empty() || name_str.contains('/') || name_str.contains('\\') {
            return Err(AppError::InvalidName(name_str.to_string()));
        }
    }

    fs::create_dir_all(dir_path)?;
    Ok(())
}

#[tauri::command]
pub async fn rename_item(path: String, new_name: String) -> Result<(), AppError> {
    let source = Path::new(&path);
    if !source.exists() {
        return Err(AppError::NotFound(path));
    }

    // Validate new name
    if new_name.is_empty() || new_name.contains('/') || new_name.contains('\\') {
        return Err(AppError::InvalidName(new_name));
    }

    let parent = source.parent().ok_or_else(|| {
        AppError::Io("Cannot determine parent directory".to_string())
    })?;
    let destination = parent.join(&new_name);

    if destination.exists() {
        return Err(AppError::AlreadyExists(destination.to_string_lossy().to_string()));
    }

    fs::rename(source, &destination)?;
    Ok(())
}

#[tauri::command]
pub async fn delete_items(sources: Vec<String>, use_trash: bool) -> Result<(), AppError> {
    for source in &sources {
        let path = Path::new(source);
        if !path.exists() {
            return Err(AppError::NotFound(source.clone()));
        }

        if use_trash {
            trash::delete(path).map_err(|e| AppError::Io(e.to_string()))?;
        } else if path.is_dir() {
            fs::remove_dir_all(path)?;
        } else {
            fs::remove_file(path)?;
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn copy_items(
    app: AppHandle,
    sources: Vec<String>,
    destination: String,
) -> Result<(), AppError> {
    let dest_path = Path::new(&destination);
    if !dest_path.is_dir() {
        return Err(AppError::NotADirectory(destination));
    }

    let total = sources.len();
    for (i, source) in sources.iter().enumerate() {
        let source_path = Path::new(source);
        if !source_path.exists() {
            return Err(AppError::NotFound(source.clone()));
        }

        let file_name = source_path
            .file_name()
            .ok_or_else(|| AppError::Io("Invalid source path".to_string()))?;
        let target = dest_path.join(file_name);

        let _ = app.emit(
            "fs:operation-progress",
            OperationProgress {
                operation: "copy".to_string(),
                current_file: source_path.file_name().unwrap_or_default().to_string_lossy().to_string(),
                files_done: i,
                files_total: total,
            },
        );

        if source_path.is_dir() {
            let options = fs_extra::dir::CopyOptions::new();
            fs_extra::dir::copy(source_path, dest_path, &options)
                .map_err(|e| AppError::Io(e.to_string()))?;
        } else {
            fs::copy(source_path, &target)?;
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn move_items(
    app: AppHandle,
    sources: Vec<String>,
    destination: String,
) -> Result<(), AppError> {
    let dest_path = Path::new(&destination);
    if !dest_path.is_dir() {
        return Err(AppError::NotADirectory(destination));
    }

    let total = sources.len();
    for (i, source) in sources.iter().enumerate() {
        let source_path = Path::new(source);
        if !source_path.exists() {
            return Err(AppError::NotFound(source.clone()));
        }

        let file_name = source_path
            .file_name()
            .ok_or_else(|| AppError::Io("Invalid source path".to_string()))?;
        let target = dest_path.join(file_name);

        let _ = app.emit(
            "fs:operation-progress",
            OperationProgress {
                operation: "move".to_string(),
                current_file: source_path.file_name().unwrap_or_default().to_string_lossy().to_string(),
                files_done: i,
                files_total: total,
            },
        );

        // Try rename first (same filesystem, instant), fall back to copy+delete
        if fs::rename(source_path, &target).is_err() {
            if source_path.is_dir() {
                let options = fs_extra::dir::CopyOptions::new();
                fs_extra::dir::copy(source_path, dest_path, &options)
                    .map_err(|e| AppError::Io(e.to_string()))?;
                fs::remove_dir_all(source_path)?;
            } else {
                fs::copy(source_path, &target)?;
                fs::remove_file(source_path)?;
            }
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    #[tokio::test]
    async fn test_create_directory_success() {
        let tmp = TempDir::new().unwrap();
        let dir_path = tmp.path().join("newdir");

        create_directory(dir_path.to_string_lossy().to_string())
            .await
            .unwrap();

        assert!(dir_path.is_dir());
    }

    #[tokio::test]
    async fn test_create_directory_already_exists() {
        let tmp = TempDir::new().unwrap();
        let dir_path = tmp.path().join("existing");
        fs::create_dir(&dir_path).unwrap();

        let result = create_directory(dir_path.to_string_lossy().to_string()).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_create_directory_nested() {
        let tmp = TempDir::new().unwrap();
        let dir_path = tmp.path().join("a").join("b").join("c");

        create_directory(dir_path.to_string_lossy().to_string())
            .await
            .unwrap();

        assert!(dir_path.is_dir());
    }

    #[tokio::test]
    async fn test_rename_item_file() {
        let tmp = TempDir::new().unwrap();
        let file_path = tmp.path().join("old.txt");
        fs::write(&file_path, "content").unwrap();

        rename_item(file_path.to_string_lossy().to_string(), "new.txt".to_string())
            .await
            .unwrap();

        assert!(!file_path.exists());
        assert!(tmp.path().join("new.txt").exists());
    }

    #[tokio::test]
    async fn test_rename_item_directory() {
        let tmp = TempDir::new().unwrap();
        let dir_path = tmp.path().join("olddir");
        fs::create_dir(&dir_path).unwrap();

        rename_item(dir_path.to_string_lossy().to_string(), "newdir".to_string())
            .await
            .unwrap();

        assert!(!dir_path.exists());
        assert!(tmp.path().join("newdir").is_dir());
    }

    #[tokio::test]
    async fn test_rename_item_target_exists() {
        let tmp = TempDir::new().unwrap();
        fs::write(tmp.path().join("a.txt"), "").unwrap();
        fs::write(tmp.path().join("b.txt"), "").unwrap();

        let result = rename_item(
            tmp.path().join("a.txt").to_string_lossy().to_string(),
            "b.txt".to_string(),
        )
        .await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_rename_item_invalid_name() {
        let tmp = TempDir::new().unwrap();
        let file_path = tmp.path().join("test.txt");
        fs::write(&file_path, "").unwrap();

        let result = rename_item(
            file_path.to_string_lossy().to_string(),
            "".to_string(),
        )
        .await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_delete_items_file() {
        let tmp = TempDir::new().unwrap();
        let file_path = tmp.path().join("delete_me.txt");
        fs::write(&file_path, "content").unwrap();

        delete_items(vec![file_path.to_string_lossy().to_string()], false)
            .await
            .unwrap();

        assert!(!file_path.exists());
    }

    #[tokio::test]
    async fn test_delete_items_directory() {
        let tmp = TempDir::new().unwrap();
        let dir_path = tmp.path().join("delete_dir");
        fs::create_dir(&dir_path).unwrap();
        fs::write(dir_path.join("inside.txt"), "").unwrap();

        delete_items(vec![dir_path.to_string_lossy().to_string()], false)
            .await
            .unwrap();

        assert!(!dir_path.exists());
    }

    #[tokio::test]
    async fn test_delete_items_nonexistent() {
        let result = delete_items(vec!["/nonexistent/file.txt".to_string()], false).await;
        assert!(result.is_err());
    }
}
