import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { panes } from '$lib/stores/panes.svelte';
import { listDirectory } from './tauri-commands';

interface FsChangeEvent {
	paths: string[];
	kind: string;
}

export async function initWatcherListener(): Promise<UnlistenFn> {
	return listen<FsChangeEvent>('fs:change', async (event) => {
		const changedPaths = event.payload.paths;

		for (const paneId of ['left', 'right'] as const) {
			const pane = panes.getPane(paneId);
			const affected = changedPaths.some((p) =>
				p.startsWith(pane.path) || pane.path.startsWith(p)
			);

			if (affected) {
				try {
					const files = await listDirectory(pane.path, pane.showHidden);
					panes.setFiles(paneId, files);
				} catch {
					// Directory may have been deleted, ignore
				}
			}
		}
	});
}
