mod commands;
mod error;
mod models;
mod plugins;
mod watcher;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let handle = app.handle().clone();
            watcher::init_watcher(handle)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::fs_read::list_directory,
            commands::fs_read::get_file_info,
            commands::fs_read::get_home_dir,
            commands::fs_ops::copy_items,
            commands::fs_ops::move_items,
            commands::fs_ops::delete_items,
            commands::fs_ops::rename_item,
            commands::fs_ops::create_directory,
            commands::fs_watch::watch_directory,
            commands::fs_watch::unwatch_directory,
        ])
        .run(tauri::generate_context!())
        .expect("error while running PathCommander");
}
