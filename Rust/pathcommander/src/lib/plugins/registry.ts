import type {
	PathCommanderPlugin,
	PluginContext,
	ContextMenuItem,
	ToolbarItem,
	OperationDecision,
} from './types';
import type { FileEntry } from '$lib/types/file';

class PluginRegistry {
	private plugins: Map<string, PathCommanderPlugin> = new Map();
	private context: PluginContext | null = null;

	setContext(context: PluginContext) {
		this.context = context;
	}

	async register(plugin: PathCommanderPlugin): Promise<void> {
		if (this.plugins.has(plugin.name)) {
			console.warn(`Plugin "${plugin.name}" already registered`);
			return;
		}
		this.plugins.set(plugin.name, plugin);
		if (this.context) {
			await plugin.onActivate?.(this.context);
		}
	}

	async unregister(name: string): Promise<void> {
		const plugin = this.plugins.get(name);
		if (plugin) {
			await plugin.onDeactivate?.();
			this.plugins.delete(name);
		}
	}

	getContextMenuItems(entries: FileEntry[]): ContextMenuItem[] {
		return [...this.plugins.values()].flatMap(
			(p) => p.onFileContextMenu?.(entries) ?? []
		);
	}

	getToolbarItems(): ToolbarItem[] {
		return [...this.plugins.values()].flatMap(
			(p) => p.onToolbarExtend?.() ?? []
		);
	}

	beforeCopy(sources: string[], dest: string): OperationDecision {
		for (const plugin of this.plugins.values()) {
			if (plugin.onBeforeCopy?.(sources, dest) === 'deny') {
				return 'deny';
			}
		}
		return 'allow';
	}

	afterCopy(sources: string[], dest: string): void {
		for (const plugin of this.plugins.values()) {
			plugin.onAfterCopy?.(sources, dest);
		}
	}

	beforeDelete(sources: string[]): OperationDecision {
		for (const plugin of this.plugins.values()) {
			if (plugin.onBeforeDelete?.(sources) === 'deny') {
				return 'deny';
			}
		}
		return 'allow';
	}

	afterDelete(sources: string[]): void {
		for (const plugin of this.plugins.values()) {
			plugin.onAfterDelete?.(sources);
		}
	}

	beforeMove(sources: string[], dest: string): OperationDecision {
		for (const plugin of this.plugins.values()) {
			if (plugin.onBeforeMove?.(sources, dest) === 'deny') {
				return 'deny';
			}
		}
		return 'allow';
	}

	afterMove(sources: string[], dest: string): void {
		for (const plugin of this.plugins.values()) {
			plugin.onAfterMove?.(sources, dest);
		}
	}

	onFileOpen(path: string): boolean {
		for (const plugin of this.plugins.values()) {
			if (plugin.onFileOpen?.(path)) {
				return true; // Plugin handled it
			}
		}
		return false;
	}

	getPlugins(): PathCommanderPlugin[] {
		return [...this.plugins.values()];
	}
}

export const pluginRegistry = new PluginRegistry();
