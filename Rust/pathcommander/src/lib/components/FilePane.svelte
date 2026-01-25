<script lang="ts">
	import type { PaneId } from '$lib/types/file';
	import { panes } from '$lib/stores/panes.svelte';
	import { listDirectory, watchDirectory, unwatchDirectory } from '$lib/services/tauri-commands';
	import PathBar from './PathBar.svelte';
	import FileList from './FileList.svelte';
	import PaneFooter from './PaneFooter.svelte';

	let { paneId }: { paneId: PaneId } = $props();

	const paneState = $derived(paneId === 'left' ? panes.left : panes.right);
	const isActive = $derived(panes.activePane === paneId);

	async function loadDirectory(path: string, showHidden: boolean) {
		panes.setLoading(paneId, true);
		try {
			const files = await listDirectory(path, showHidden);
			panes.setFiles(paneId, files);
			await watchDirectory(path).catch(() => {}); // Non-critical
		} catch (err) {
			console.error(`Failed to load directory: ${path}`, err);
			panes.setFiles(paneId, []);
		} finally {
			panes.setLoading(paneId, false);
		}
	}

	$effect(() => {
		loadDirectory(paneState.path, paneState.showHidden);
		return () => {
			unwatchDirectory(paneState.path).catch(() => {});
		};
	});
</script>

<div
	class="flex flex-col flex-1 min-w-0 border {isActive ? 'border-blue-500' : 'border-gray-700'}"
	onclick={() => panes.setActive(paneId)}
	role="region"
	aria-label="{paneId} pane"
>
	<PathBar path={paneState.path} {paneId} />
	{#if paneState.loading}
		<div class="flex-1 flex items-center justify-center text-gray-500">
			Loading...
		</div>
	{:else}
		<FileList
			files={paneState.files}
			{paneId}
			cursorIndex={paneState.cursorIndex}
			selectedIndices={paneState.selectedIndices}
		/>
	{/if}
	<PaneFooter {paneState} />
</div>
