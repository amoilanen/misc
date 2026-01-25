<script lang="ts">
	import type { FileEntry, PaneId } from '$lib/types/file';
	import { panes } from '$lib/stores/panes.svelte';
	import FileRow from './FileRow.svelte';

	let { files, paneId, cursorIndex, selectedIndices }: {
		files: FileEntry[];
		paneId: PaneId;
		cursorIndex: number;
		selectedIndices: Set<number>;
	} = $props();

	let listEl: HTMLDivElement | undefined = $state();

	function handleRowClick(index: number, event: MouseEvent) {
		panes.setActive(paneId);
		if (event.ctrlKey || event.metaKey) {
			panes.toggleSelection(paneId, index);
		} else {
			panes.setCursor(paneId, index);
		}
	}

	function handleRowDblClick(index: number) {
		const file = files[index];
		if (!file) return;
		if (file.fileType === 'directory') {
			panes.setPath(paneId, file.path);
		}
	}

	// Auto-scroll cursor into view
	$effect(() => {
		if (listEl && cursorIndex >= 0) {
			const row = listEl.children[cursorIndex] as HTMLElement | undefined;
			row?.scrollIntoView({ block: 'nearest' });
		}
	});
</script>

<div
	bind:this={listEl}
	class="flex-1 overflow-y-auto overflow-x-hidden"
	role="grid"
	aria-label="{paneId} file list"
>
	{#each files as file, i}
		<div
			onclick={(e) => handleRowClick(i, e)}
			role="presentation"
		>
			<FileRow
				{file}
				selected={selectedIndices.has(i)}
				cursor={cursorIndex === i}
				ondblclick={() => handleRowDblClick(i)}
			/>
		</div>
	{/each}
	{#if files.length === 0}
		<div class="flex items-center justify-center h-full text-gray-500 text-sm">
			Empty directory
		</div>
	{/if}
</div>
