<script lang="ts">
	let { onaction }: { onaction: (action: string) => void } = $props();

	const buttons = [
		{ key: 'F2', label: 'Rename', action: 'rename' },
		{ key: 'F5', label: 'Copy', action: 'copy' },
		{ key: 'F6', label: 'Move', action: 'move' },
		{ key: 'F7', label: 'MkDir', action: 'mkdir' },
		{ key: 'F8', label: 'Delete', action: 'delete' },
	];
</script>

<div class="flex items-center bg-gray-800 border-t border-gray-700 px-1 py-0.5 gap-0.5">
	{#each buttons as btn}
		<button
			class="flex items-center gap-1 px-2 py-0.5 text-xs rounded hover:bg-gray-700 active:bg-gray-600 text-gray-300"
			onclick={() => onaction(btn.action)}
			title="{btn.key} - {btn.label}"
		>
			<span class="text-gray-500 font-mono">{btn.key}</span>
			<span>{btn.label}</span>
		</button>
	{/each}
</div>
