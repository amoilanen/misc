export type FileType = 'file' | 'directory' | 'symlink' | 'other';

export interface FilePermissions {
	readable: boolean;
	writable: boolean;
	executable: boolean;
	mode?: number;
}

export interface FileEntry {
	name: string;
	path: string;
	fileType: FileType;
	size: number;
	modified: string | null;
	created: string | null;
	permissions: FilePermissions;
	isHidden: boolean;
	isSymlink: boolean;
	extension: string | null;
}

export type SortField = 'name' | 'size' | 'modified' | 'extension';

export type PaneId = 'left' | 'right';
