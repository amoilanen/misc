import { invoke } from '@tauri-apps/api/core';
import type { FileEntry } from '$lib/types/file';

export async function listDirectory(path: string, showHidden: boolean = false): Promise<FileEntry[]> {
	return invoke<FileEntry[]>('list_directory', { path, showHidden });
}

export async function getFileInfo(path: string): Promise<FileEntry> {
	return invoke<FileEntry>('get_file_info', { path });
}

export async function getHomeDir(): Promise<string> {
	return invoke<string>('get_home_dir');
}

export async function copyItems(sources: string[], destination: string): Promise<void> {
	return invoke('copy_items', { sources, destination });
}

export async function moveItems(sources: string[], destination: string): Promise<void> {
	return invoke('move_items', { sources, destination });
}

export async function deleteItems(sources: string[], useTrash: boolean = true): Promise<void> {
	return invoke('delete_items', { sources, useTrash });
}

export async function renameItem(path: string, newName: string): Promise<void> {
	return invoke('rename_item', { path, newName });
}

export async function createDirectory(path: string): Promise<void> {
	return invoke('create_directory', { path });
}

export async function watchDirectory(path: string): Promise<void> {
	return invoke('watch_directory', { path });
}

export async function unwatchDirectory(path: string): Promise<void> {
	return invoke('unwatch_directory', { path });
}
