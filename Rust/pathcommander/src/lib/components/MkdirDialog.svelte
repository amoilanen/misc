<script lang="ts">
	let { visible = false, onconfirm, oncancel }: {
		visible?: boolean;
		onconfirm: (name: string) => void;
		oncancel: () => void;
	} = $props();

	let inputValue = $state('');
	let inputEl: HTMLInputElement | undefined = $state();

	$effect(() => {
		if (visible && inputEl) {
			inputValue = '';
			inputEl.focus();
		}
	});

	function handleSubmit(event: Event) {
		event.preventDefault();
		const name = inputValue.trim();
		if (name) {
			onconfirm(name);
			inputValue = '';
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			oncancel();
		}
	}
</script>

{#if visible}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
		<form
			class="bg-gray-800 border border-gray-600 rounded-lg p-4 w-80 shadow-xl"
			onsubmit={handleSubmit}
			onkeydown={handleKeydown}
		>
			<h2 class="text-sm font-semibold text-gray-200 mb-3">Create Directory</h2>
			<input
				bind:this={inputEl}
				bind:value={inputValue}
				type="text"
				class="w-full px-2 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm text-gray-200 focus:outline-none focus:border-blue-500"
				placeholder="Directory name"
			/>
			<div class="flex justify-end gap-2 mt-3">
				<button
					type="button"
					class="px-3 py-1 text-xs rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
					onclick={oncancel}
				>
					Cancel
				</button>
				<button
					type="submit"
					class="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-500"
				>
					Create
				</button>
			</div>
		</form>
	</div>
{/if}
