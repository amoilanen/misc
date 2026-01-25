<script lang="ts">
	let { visible = false, title = 'Confirm', message = '', onconfirm, oncancel }: {
		visible?: boolean;
		title?: string;
		message?: string;
		onconfirm: () => void;
		oncancel: () => void;
	} = $props();

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			oncancel();
		} else if (event.key === 'Enter') {
			onconfirm();
		}
	}
</script>

{#if visible}
	<div
		class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
		role="dialog"
		aria-modal="true"
		onkeydown={handleKeydown}
	>
		<div class="bg-gray-800 border border-gray-600 rounded-lg p-4 w-96 shadow-xl">
			<h2 class="text-sm font-semibold text-gray-200 mb-2">{title}</h2>
			<p class="text-xs text-gray-400 mb-4 whitespace-pre-wrap">{message}</p>
			<div class="flex justify-end gap-2">
				<button
					class="px-3 py-1 text-xs rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
					onclick={oncancel}
				>
					Cancel
				</button>
				<button
					class="px-3 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-500"
					onclick={onconfirm}
				>
					Confirm
				</button>
			</div>
		</div>
	</div>
{/if}
