<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { panes } from '$lib/stores/panes.svelte';
	import {
		getHomeDir,
		listDirectory,
		copyItems,
		moveItems,
		deleteItems,
		renameItem,
		createDirectory,
	} from '$lib/services/tauri-commands';
	import { createKeyboardManager } from '$lib/services/keyboard';
	import { initWatcherListener } from '$lib/services/watcher';
	import FilePane from './FilePane.svelte';
	import Toolbar from './Toolbar.svelte';
	import StatusBar from './StatusBar.svelte';
	import MkdirDialog from './MkdirDialog.svelte';
	import ConfirmDialog from './ConfirmDialog.svelte';
	import RenameDialog from './RenameDialog.svelte';

	let containerEl: HTMLDivElement | undefined = $state();
	let showMkdir = $state(false);
	let showDelete = $state(false);
	let showRename = $state(false);
	let deleteMessage = $state('');
	let renameCurrentName = $state('');

	let cleanupFns: (() => void)[] = [];

	function getActivePanePath(): string {
		return panes.getPane(panes.activePane).path;
	}

	function getInactivePanePath(): string {
		const inactive = panes.activePane === 'left' ? 'right' : 'left';
		return panes.getPane(inactive).path;
	}

	function getCursorFile() {
		const pane = panes.getPane(panes.activePane);
		return pane.files[pane.cursorIndex];
	}

	async function navigateInto() {
		const file = getCursorFile();
		if (!file) return;
		if (file.fileType === 'directory') {
			panes.setPath(panes.activePane, file.path);
		}
	}

	function navigateUp() {
		const currentPath = getActivePanePath();
		const parent = currentPath.replace(/\/[^/]+\/?$/, '') || '/';
		if (parent !== currentPath) {
			panes.setPath(panes.activePane, parent);
		}
	}

	function triggerCopy() {
		const sources = panes.getSelectedPaths(panes.activePane);
		const dest = getInactivePanePath();
		if (sources.length > 0) {
			copyItems(sources, dest).then(() => refreshBothPanes());
		}
	}

	function triggerMove() {
		const sources = panes.getSelectedPaths(panes.activePane);
		const dest = getInactivePanePath();
		if (sources.length > 0) {
			moveItems(sources, dest).then(() => refreshBothPanes());
		}
	}

	function triggerDelete() {
		const sources = panes.getSelectedPaths(panes.activePane);
		if (sources.length === 0) return;
		const names = sources.map(p => p.split('/').pop()).join('\n');
		deleteMessage = `Delete ${sources.length} item(s)?\n\n${names}`;
		showDelete = true;
	}

	async function confirmDelete() {
		const sources = panes.getSelectedPaths(panes.activePane);
		showDelete = false;
		await deleteItems(sources, true);
		await refreshActivePane();
	}

	function triggerMkdir() {
		showMkdir = true;
	}

	async function confirmMkdir(name: string) {
		showMkdir = false;
		const path = getActivePanePath() + '/' + name;
		await createDirectory(path);
		await refreshActivePane();
	}

	function triggerRename() {
		const file = getCursorFile();
		if (!file) return;
		renameCurrentName = file.name;
		showRename = true;
	}

	async function confirmRename(newName: string) {
		showRename = false;
		const file = getCursorFile();
		if (!file) return;
		await renameItem(file.path, newName);
		await refreshActivePane();
	}

	async function refreshActivePane() {
		const pane = panes.getPane(panes.activePane);
		const files = await listDirectory(pane.path, pane.showHidden);
		panes.setFiles(panes.activePane, files);
	}

	async function refreshBothPanes() {
		const left = panes.left;
		const right = panes.right;
		const [leftFiles, rightFiles] = await Promise.all([
			listDirectory(left.path, left.showHidden),
			listDirectory(right.path, right.showHidden),
		]);
		panes.setFiles('left', leftFiles);
		panes.setFiles('right', rightFiles);
	}

	function toggleHidden() {
		const pane = panes.getPane(panes.activePane);
		panes.setShowHidden(panes.activePane, !pane.showHidden);
	}

	function handleToolbarAction(action: string) {
		switch (action) {
			case 'copy': triggerCopy(); break;
			case 'move': triggerMove(); break;
			case 'delete': triggerDelete(); break;
			case 'mkdir': triggerMkdir(); break;
			case 'rename': triggerRename(); break;
		}
	}

	onMount(() => {
		// Initialize panes with home directory
		getHomeDir()
			.then((home) => {
				panes.setPath('left', home);
				panes.setPath('right', home);
			})
			.catch(() => {
				panes.setPath('left', '/');
				panes.setPath('right', '/');
			});

		// Set up keyboard shortcuts
		const manager = createKeyboardManager([
			{ key: 'Tab', action: () => panes.switchPane(), description: 'Switch pane' },
			{ key: 'ArrowUp', action: () => panes.moveCursor(panes.activePane, -1), description: 'Cursor up' },
			{ key: 'ArrowDown', action: () => panes.moveCursor(panes.activePane, 1), description: 'Cursor down' },
			{ key: 'Home', action: () => panes.setCursor(panes.activePane, 0), description: 'Cursor to top' },
			{ key: 'End', action: () => panes.setCursor(panes.activePane, panes.getPane(panes.activePane).files.length - 1), description: 'Cursor to bottom' },
			{ key: 'Enter', action: navigateInto, description: 'Open / Enter directory' },
			{ key: 'Backspace', action: navigateUp, description: 'Go to parent' },
			{ key: 'Insert', action: () => {
				panes.toggleSelection(panes.activePane, panes.getPane(panes.activePane).cursorIndex);
				panes.moveCursor(panes.activePane, 1);
			}, description: 'Toggle selection' },
			{ key: ' ', action: () => {
				panes.toggleSelection(panes.activePane, panes.getPane(panes.activePane).cursorIndex);
				panes.moveCursor(panes.activePane, 1);
			}, description: 'Toggle selection' },
			{ key: 'F2', action: triggerRename, description: 'Rename' },
			{ key: 'F5', action: triggerCopy, description: 'Copy' },
			{ key: 'F6', action: triggerMove, description: 'Move' },
			{ key: 'F7', action: triggerMkdir, description: 'Create directory' },
			{ key: 'F8', action: triggerDelete, description: 'Delete' },
			{ key: 'r', ctrl: true, action: refreshBothPanes, description: 'Refresh' },
			{ key: 'h', ctrl: true, action: toggleHidden, description: 'Toggle hidden files' },
		]);

		if (containerEl) {
			const detach = manager.attach(containerEl);
			cleanupFns.push(detach);
		}

		// Set up FS watcher listener
		initWatcherListener()
			.then((unlisten) => {
				if (unlisten) cleanupFns.push(unlisten);
			})
			.catch(() => {});
	});

	onDestroy(() => {
		cleanupFns.forEach((fn) => fn());
	});
</script>

<div
	bind:this={containerEl}
	class="flex flex-col h-screen bg-gray-900 text-gray-100 focus:outline-none"
	tabindex="-1"
>
	<!-- Main dual-pane area -->
	<div class="flex flex-1 min-h-0">
		<FilePane paneId="left" />
		<div class="w-px bg-gray-700"></div>
		<FilePane paneId="right" />
	</div>

	<!-- Toolbar -->
	<Toolbar onaction={handleToolbarAction} />

	<!-- Status bar -->
	<StatusBar />

	<!-- Dialogs -->
	<MkdirDialog
		visible={showMkdir}
		onconfirm={confirmMkdir}
		oncancel={() => showMkdir = false}
	/>
	<ConfirmDialog
		visible={showDelete}
		title="Delete"
		message={deleteMessage}
		onconfirm={confirmDelete}
		oncancel={() => showDelete = false}
	/>
	<RenameDialog
		visible={showRename}
		currentName={renameCurrentName}
		onconfirm={confirmRename}
		oncancel={() => showRename = false}
	/>
</div>
