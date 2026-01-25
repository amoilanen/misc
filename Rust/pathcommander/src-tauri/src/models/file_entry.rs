use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::fs::{DirEntry, Metadata};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub file_type: FileType,
    pub size: u64,
    pub modified: Option<DateTime<Utc>>,
    pub created: Option<DateTime<Utc>>,
    pub permissions: FilePermissions,
    pub is_hidden: bool,
    pub is_symlink: bool,
    pub extension: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum FileType {
    File,
    Directory,
    Symlink,
    Other,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct FilePermissions {
    pub readable: bool,
    pub writable: bool,
    pub executable: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mode: Option<u32>,
}

impl FileEntry {
    pub fn from_dir_entry(entry: &DirEntry) -> std::io::Result<Self> {
        let metadata = entry.metadata()?;
        let path = entry.path();
        Self::from_path_and_metadata(&path, &metadata)
    }

    pub fn from_path_and_metadata(path: &Path, metadata: &Metadata) -> std::io::Result<Self> {
        let name = path
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_default();

        let file_type = if metadata.is_dir() {
            FileType::Directory
        } else if metadata.is_symlink() {
            FileType::Symlink
        } else if metadata.is_file() {
            FileType::File
        } else {
            FileType::Other
        };

        let modified = metadata
            .modified()
            .ok()
            .map(|t| DateTime::<Utc>::from(t));

        let created = metadata
            .created()
            .ok()
            .map(|t| DateTime::<Utc>::from(t));

        let is_hidden = name.starts_with('.');

        let extension = path
            .extension()
            .map(|e| e.to_string_lossy().to_string());

        let permissions = get_permissions(metadata);

        Ok(FileEntry {
            name,
            path: path.to_string_lossy().to_string(),
            file_type,
            size: if metadata.is_file() {
                metadata.len()
            } else {
                0
            },
            modified,
            created,
            permissions,
            is_hidden,
            is_symlink: metadata.is_symlink(),
            extension,
        })
    }
}

#[cfg(unix)]
fn get_permissions(metadata: &Metadata) -> FilePermissions {
    use std::os::unix::fs::PermissionsExt;
    let mode = metadata.permissions().mode();
    FilePermissions {
        readable: mode & 0o400 != 0,
        writable: mode & 0o200 != 0,
        executable: mode & 0o100 != 0,
        mode: Some(mode),
    }
}

#[cfg(not(unix))]
fn get_permissions(metadata: &Metadata) -> FilePermissions {
    FilePermissions {
        readable: true,
        writable: !metadata.permissions().readonly(),
        executable: false,
        mode: None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    #[test]
    fn test_file_entry_from_regular_file() {
        let tmp = TempDir::new().unwrap();
        let file_path = tmp.path().join("test.txt");
        fs::write(&file_path, "hello world").unwrap();

        let metadata = fs::metadata(&file_path).unwrap();
        let entry = FileEntry::from_path_and_metadata(&file_path, &metadata).unwrap();

        assert_eq!(entry.name, "test.txt");
        assert_eq!(entry.file_type, FileType::File);
        assert_eq!(entry.size, 11);
        assert_eq!(entry.extension, Some("txt".to_string()));
        assert!(!entry.is_hidden);
        assert!(!entry.is_symlink);
    }

    #[test]
    fn test_file_entry_from_directory() {
        let tmp = TempDir::new().unwrap();
        let dir_path = tmp.path().join("mydir");
        fs::create_dir(&dir_path).unwrap();

        let metadata = fs::metadata(&dir_path).unwrap();
        let entry = FileEntry::from_path_and_metadata(&dir_path, &metadata).unwrap();

        assert_eq!(entry.name, "mydir");
        assert_eq!(entry.file_type, FileType::Directory);
        assert_eq!(entry.size, 0);
        assert!(entry.extension.is_none());
    }

    #[test]
    fn test_hidden_file_detection() {
        let tmp = TempDir::new().unwrap();
        let file_path = tmp.path().join(".hidden");
        fs::write(&file_path, "").unwrap();

        let metadata = fs::metadata(&file_path).unwrap();
        let entry = FileEntry::from_path_and_metadata(&file_path, &metadata).unwrap();

        assert!(entry.is_hidden);
    }

    #[test]
    fn test_file_timestamps_are_set() {
        let tmp = TempDir::new().unwrap();
        let file_path = tmp.path().join("dated.txt");
        fs::write(&file_path, "content").unwrap();

        let metadata = fs::metadata(&file_path).unwrap();
        let entry = FileEntry::from_path_and_metadata(&file_path, &metadata).unwrap();

        assert!(entry.modified.is_some());
    }

    #[cfg(unix)]
    #[test]
    fn test_unix_permissions() {
        use std::os::unix::fs::PermissionsExt;
        let tmp = TempDir::new().unwrap();
        let file_path = tmp.path().join("exec.sh");
        fs::write(&file_path, "#!/bin/sh").unwrap();
        fs::set_permissions(&file_path, fs::Permissions::from_mode(0o755)).unwrap();

        let metadata = fs::metadata(&file_path).unwrap();
        let entry = FileEntry::from_path_and_metadata(&file_path, &metadata).unwrap();

        assert!(entry.permissions.readable);
        assert!(entry.permissions.writable);
        assert!(entry.permissions.executable);
        assert!(entry.permissions.mode.is_some());
    }
}
