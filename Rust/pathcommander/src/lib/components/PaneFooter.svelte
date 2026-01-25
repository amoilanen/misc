<script lang="ts">
	import type { PaneState } from '$lib/stores/panes.svelte';
	import { formatFileSize } from '$lib/utils/format';

	let { paneState }: { paneState: PaneState } = $props();

	const selectedCount = $derived(paneState.selectedIndices.size);
	const totalFiles = $derived(paneState.files.length);
	const totalDirs = $derived(paneState.files.filter(f => f.fileType === 'directory').length);

	const selectedSize = $derived(() => {
		let size = 0;
		for (const idx of paneState.selectedIndices) {
			size += paneState.files[idx]?.size ?? 0;
		}
		return size;
	});
</script>

<div class="flex items-center justify-between px-2 py-0.5 bg-gray-800 border-t border-gray-700 text-xs text-gray-400">
	<span>
		{totalFiles} items ({totalDirs} dirs)
	</span>
	{#if selectedCount > 0}
		<span class="text-blue-300">
			{selectedCount} selected ({formatFileSize(selectedSize())})
		</span>
	{/if}
</div>
