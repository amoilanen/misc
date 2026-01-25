<script lang="ts">
	import { panes } from '$lib/stores/panes.svelte';

	const activePaneLabel = $derived(panes.activePane === 'left' ? 'Left' : 'Right');
	const activePane = $derived(panes.getPane(panes.activePane));
	const cursorFile = $derived(activePane.files[activePane.cursorIndex]);
</script>

<div class="flex items-center justify-between px-2 py-0.5 bg-gray-900 border-t border-gray-700 text-xs text-gray-500">
	<span>
		[{activePaneLabel}] {activePane.path}
	</span>
	{#if cursorFile}
		<span class="text-gray-400 truncate max-w-96">
			{cursorFile.name}
			{#if cursorFile.fileType === 'file'}
				({cursorFile.size} bytes)
			{/if}
		</span>
	{/if}
</div>
