import type { FileEntry, PaneId } from '$lib/types/file';
import type { PaneState } from '$lib/stores/panes.svelte';

export type OperationDecision = 'allow' | 'deny';

export interface ContextMenuItem {
	label: string;
	action: () => void | Promise<void>;
	icon?: string;
}

export interface ToolbarItem {
	label: string;
	icon?: string;
	action: () => void | Promise<void>;
	tooltip?: string;
}

export interface PluginContext {
	getActivePane(): PaneState;
	getInactivePane(): PaneState;
	navigateTo(pane: PaneId, path: string): void;
	refreshPane(pane: PaneId): void;
}

export interface KeyBinding {
	key: string;
	ctrl?: boolean;
	shift?: boolean;
	alt?: boolean;
	action: () => void | Promise<void>;
	description: string;
}

export interface PathCommanderPlugin {
	name: string;
	version: string;
	description?: string;

	onActivate?(ctx: PluginContext): void | Promise<void>;
	onDeactivate?(): void | Promise<void>;

	onFileContextMenu?(entries: FileEntry[]): ContextMenuItem[];
	onToolbarExtend?(): ToolbarItem[];

	onBeforeCopy?(sources: string[], dest: string): OperationDecision;
	onAfterCopy?(sources: string[], dest: string): void;
	onBeforeDelete?(sources: string[]): OperationDecision;
	onAfterDelete?(sources: string[]): void;
	onBeforeMove?(sources: string[], dest: string): OperationDecision;
	onAfterMove?(sources: string[], dest: string): void;

	onFileOpen?(path: string): boolean;

	keybindings?: KeyBinding[];
}
