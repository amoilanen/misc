<script lang="ts">
	import type { PaneId } from '$lib/types/file';
	import { panes } from '$lib/stores/panes.svelte';

	let { path, paneId }: { path: string; paneId: PaneId } = $props();

	const segments = $derived((): { name: string; path: string }[] => {
		const parts = path.split('/').filter(Boolean);
		const result: { name: string; path: string }[] = [{ name: '/', path: '/' }];
		let current = '';
		for (const part of parts) {
			current += '/' + part;
			result.push({ name: part, path: current });
		}
		return result;
	});

	function navigateTo(segmentPath: string) {
		panes.setPath(paneId, segmentPath);
	}
</script>

<div class="flex items-center px-2 py-1 bg-gray-800 border-b border-gray-700 text-xs gap-0.5 overflow-hidden">
	{#each segments() as segment, i}
		{#if i > 0}
			<span class="text-gray-600">/</span>
		{/if}
		<button
			class="hover:text-blue-300 text-gray-300 truncate max-w-32"
			onclick={() => navigateTo(segment.path)}
			title={segment.path}
		>
			{segment.name}
		</button>
	{/each}
</div>
