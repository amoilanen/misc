use crate::error::AppError;
use crate::models::{FileEntry, FileType};
use std::fs;
use std::path::Path;

#[tauri::command]
pub async fn list_directory(path: String, show_hidden: bool) -> Result<Vec<FileEntry>, AppError> {
    let dir_path = Path::new(&path);
    if !dir_path.is_dir() {
        return Err(AppError::NotADirectory(path));
    }

    let mut entries = Vec::new();
    for entry in fs::read_dir(dir_path)? {
        let entry = entry?;
        match FileEntry::from_dir_entry(&entry) {
            Ok(file_entry) => {
                if !show_hidden && file_entry.is_hidden {
                    continue;
                }
                entries.push(file_entry);
            }
            Err(_) => continue, // Skip entries we can't read
        }
    }

    // Sort: directories first, then alphabetical (case-insensitive)
    entries.sort_by(|a, b| {
        match (&a.file_type, &b.file_type) {
            (FileType::Directory, FileType::Directory) => {
                a.name.to_lowercase().cmp(&b.name.to_lowercase())
            }
            (FileType::Directory, _) => std::cmp::Ordering::Less,
            (_, FileType::Directory) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });

    Ok(entries)
}

#[tauri::command]
pub async fn get_file_info(path: String) -> Result<FileEntry, AppError> {
    let file_path = Path::new(&path);
    let metadata = fs::metadata(file_path)?;
    Ok(FileEntry::from_path_and_metadata(file_path, &metadata)?)
}

#[tauri::command]
pub async fn get_home_dir() -> Result<String, AppError> {
    dirs::home_dir()
        .map(|p| p.to_string_lossy().to_string())
        .ok_or_else(|| AppError::NotFound("Could not determine home directory".to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    #[tokio::test]
    async fn test_list_directory_returns_sorted_entries() {
        let tmp = TempDir::new().unwrap();
        fs::write(tmp.path().join("b.txt"), "").unwrap();
        fs::write(tmp.path().join("a.txt"), "").unwrap();
        fs::create_dir(tmp.path().join("zdir")).unwrap();

        let entries = list_directory(tmp.path().to_string_lossy().to_string(), true)
            .await
            .unwrap();

        // Directories first
        assert_eq!(entries[0].name, "zdir");
        assert_eq!(entries[0].file_type, FileType::Directory);
        // Then files alphabetically
        assert_eq!(entries[1].name, "a.txt");
        assert_eq!(entries[2].name, "b.txt");
    }

    #[tokio::test]
    async fn test_list_directory_hides_hidden_files() {
        let tmp = TempDir::new().unwrap();
        fs::write(tmp.path().join(".hidden"), "").unwrap();
        fs::write(tmp.path().join("visible.txt"), "").unwrap();

        let entries = list_directory(tmp.path().to_string_lossy().to_string(), false)
            .await
            .unwrap();

        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].name, "visible.txt");
    }

    #[tokio::test]
    async fn test_list_directory_shows_hidden_files_when_requested() {
        let tmp = TempDir::new().unwrap();
        fs::write(tmp.path().join(".hidden"), "").unwrap();
        fs::write(tmp.path().join("visible.txt"), "").unwrap();

        let entries = list_directory(tmp.path().to_string_lossy().to_string(), true)
            .await
            .unwrap();

        assert_eq!(entries.len(), 2);
    }

    #[tokio::test]
    async fn test_list_directory_nonexistent_returns_error() {
        let result = list_directory("/nonexistent/path/12345".to_string(), true).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_list_directory_on_file_returns_error() {
        let tmp = TempDir::new().unwrap();
        let file_path = tmp.path().join("file.txt");
        fs::write(&file_path, "content").unwrap();

        let result = list_directory(file_path.to_string_lossy().to_string(), true).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_get_file_info() {
        let tmp = TempDir::new().unwrap();
        let file_path = tmp.path().join("info.txt");
        fs::write(&file_path, "hello").unwrap();

        let info = get_file_info(file_path.to_string_lossy().to_string())
            .await
            .unwrap();

        assert_eq!(info.name, "info.txt");
        assert_eq!(info.file_type, FileType::File);
        assert_eq!(info.size, 5);
    }

    #[tokio::test]
    async fn test_get_file_info_nonexistent() {
        let result = get_file_info("/nonexistent/file.txt".to_string()).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_get_home_dir() {
        let result = get_home_dir().await;
        assert!(result.is_ok());
        assert!(!result.unwrap().is_empty());
    }

    #[tokio::test]
    async fn test_list_directory_directories_before_files() {
        let tmp = TempDir::new().unwrap();
        fs::write(tmp.path().join("aaa.txt"), "").unwrap();
        fs::create_dir(tmp.path().join("zzz_dir")).unwrap();

        let entries = list_directory(tmp.path().to_string_lossy().to_string(), true)
            .await
            .unwrap();

        // Even though 'zzz_dir' is alphabetically after 'aaa.txt',
        // directories come first
        assert_eq!(entries[0].file_type, FileType::Directory);
        assert_eq!(entries[1].file_type, FileType::File);
    }
}
