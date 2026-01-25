<script lang="ts">
	import type { FileEntry } from '$lib/types/file';
	import { formatFileSize, formatDate, formatPermissions } from '$lib/utils/format';

	let { file, selected = false, cursor = false, ondblclick }: {
		file: FileEntry;
		selected?: boolean;
		cursor?: boolean;
		ondblclick?: () => void;
	} = $props();

	const icon = $derived(
		file.fileType === 'directory' ? '📁' :
		file.fileType === 'symlink' ? '🔗' :
		file.extension === 'rs' || file.extension === 'ts' || file.extension === 'js' || file.extension === 'svelte' ? '📄' :
		file.extension === 'png' || file.extension === 'jpg' || file.extension === 'gif' || file.extension === 'svg' ? '🖼️' :
		'📃'
	);

	const sizeDisplay = $derived(
		file.fileType === 'directory' ? '<DIR>' : formatFileSize(file.size)
	);
</script>

<div
	class="flex items-center px-2 py-0.5 cursor-default select-none gap-1 text-sm font-mono
		{cursor ? 'ring-1 ring-blue-400' : ''}
		{selected ? 'bg-blue-800 text-blue-100' : 'hover:bg-gray-800'}"
	ondblclick={ondblclick}
	role="row"
	aria-selected={selected}
	data-testid="file-row"
>
	<span class="w-5 text-center shrink-0">{icon}</span>
	<span class="flex-1 truncate {file.fileType === 'directory' ? 'text-yellow-300 font-semibold' : 'text-gray-200'}">
		{file.name}
	</span>
	<span class="w-16 text-right text-gray-400 shrink-0">{sizeDisplay}</span>
	<span class="w-28 text-right text-gray-500 shrink-0">{formatDate(file.modified)}</span>
	<span class="w-10 text-right text-gray-600 shrink-0">{formatPermissions(file.permissions.mode)}</span>
</div>
