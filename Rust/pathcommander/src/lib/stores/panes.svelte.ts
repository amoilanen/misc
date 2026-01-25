import type { FileEntry, PaneId, SortField } from '$lib/types/file';

export interface PaneState {
	path: string;
	files: FileEntry[];
	selectedIndices: Set<number>;
	cursorIndex: number;
	sortBy: SortField;
	sortAsc: boolean;
	loading: boolean;
	showHidden: boolean;
}

function createInitialPaneState(path: string): PaneState {
	return {
		path,
		files: [],
		selectedIndices: new Set(),
		cursorIndex: 0,
		sortBy: 'name',
		sortAsc: true,
		loading: false,
		showHidden: false,
	};
}

function createPanesStore() {
	let activePane = $state<PaneId>('left');
	let left = $state<PaneState>(createInitialPaneState('/'));
	let right = $state<PaneState>(createInitialPaneState('/'));

	function getPane(id: PaneId): PaneState {
		return id === 'left' ? left : right;
	}

	function setActive(id: PaneId) {
		activePane = id;
	}

	function switchPane() {
		activePane = activePane === 'left' ? 'right' : 'left';
	}

	function setPath(pane: PaneId, path: string) {
		if (pane === 'left') {
			left.path = path;
			left.cursorIndex = 0;
			left.selectedIndices = new Set();
		} else {
			right.path = path;
			right.cursorIndex = 0;
			right.selectedIndices = new Set();
		}
	}

	function setFiles(pane: PaneId, files: FileEntry[]) {
		if (pane === 'left') {
			left.files = files;
		} else {
			right.files = files;
		}
	}

	function setLoading(pane: PaneId, loading: boolean) {
		if (pane === 'left') {
			left.loading = loading;
		} else {
			right.loading = loading;
		}
	}

	function toggleSelection(pane: PaneId, index: number) {
		const p = pane === 'left' ? left : right;
		const newSet = new Set(p.selectedIndices);
		if (newSet.has(index)) {
			newSet.delete(index);
		} else {
			newSet.add(index);
		}
		p.selectedIndices = newSet;
	}

	function setCursor(pane: PaneId, index: number) {
		const p = pane === 'left' ? left : right;
		const maxIndex = Math.max(0, p.files.length - 1);
		p.cursorIndex = Math.max(0, Math.min(index, maxIndex));
	}

	function moveCursor(pane: PaneId, delta: number) {
		const p = pane === 'left' ? left : right;
		setCursor(pane, p.cursorIndex + delta);
	}

	function setShowHidden(pane: PaneId, show: boolean) {
		if (pane === 'left') {
			left.showHidden = show;
		} else {
			right.showHidden = show;
		}
	}

	function getSelectedPaths(pane: PaneId): string[] {
		const p = pane === 'left' ? left : right;
		if (p.selectedIndices.size > 0) {
			return [...p.selectedIndices].map((i) => p.files[i]?.path).filter(Boolean);
		}
		// If nothing selected, use cursor item
		const cursorFile = p.files[p.cursorIndex];
		return cursorFile ? [cursorFile.path] : [];
	}

	return {
		get activePane() { return activePane; },
		get left() { return left; },
		get right() { return right; },
		getPane,
		setActive,
		switchPane,
		setPath,
		setFiles,
		setLoading,
		toggleSelection,
		setCursor,
		moveCursor,
		setShowHidden,
		getSelectedPaths,
	};
}

export const panes = createPanesStore();
