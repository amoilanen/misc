const SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

export function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 B';
	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	const index = Math.min(i, SIZE_UNITS.length - 1);
	const value = bytes / Math.pow(1024, index);

	if (index === 0) return `${bytes} B`;
	return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${SIZE_UNITS[index]}`;
}

export function formatDate(isoString: string | null): string {
	if (!isoString) return '';
	const date = new Date(isoString);
	const now = new Date();
	const isThisYear = date.getFullYear() === now.getFullYear();

	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');

	if (isThisYear) {
		return `${month}-${day} ${hours}:${minutes}`;
	}
	return `${date.getFullYear()}-${month}-${day} ${hours}:${minutes}`;
}

export function formatPermissions(mode: number | undefined): string {
	if (mode === undefined) return '';
	const octal = (mode & 0o777).toString(8);
	return octal.padStart(3, '0');
}
