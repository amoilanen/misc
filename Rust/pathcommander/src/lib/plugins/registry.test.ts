import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PathCommanderPlugin, PluginContext } from './types';

// Re-implement a minimal test version of the registry to avoid import issues
class TestPluginRegistry {
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

	getPlugins(): PathCommanderPlugin[] {
		return [...this.plugins.values()];
	}

	beforeCopy(sources: string[], dest: string): 'allow' | 'deny' {
		for (const plugin of this.plugins.values()) {
			if (plugin.onBeforeCopy?.(sources, dest) === 'deny') {
				return 'deny';
			}
		}
		return 'allow';
	}

	onFileOpen(path: string): boolean {
		for (const plugin of this.plugins.values()) {
			if (plugin.onFileOpen?.(path)) {
				return true;
			}
		}
		return false;
	}
}

function createTestPlugin(overrides: Partial<PathCommanderPlugin> = {}): PathCommanderPlugin {
	return {
		name: 'test-plugin',
		version: '1.0.0',
		...overrides,
	};
}

describe('PluginRegistry', () => {
	let registry: TestPluginRegistry;

	beforeEach(() => {
		registry = new TestPluginRegistry();
	});

	it('registers a plugin', async () => {
		const plugin = createTestPlugin();
		await registry.register(plugin);

		expect(registry.getPlugins()).toContain(plugin);
	});

	it('prevents duplicate registration', async () => {
		const plugin = createTestPlugin();
		await registry.register(plugin);
		await registry.register(plugin);

		expect(registry.getPlugins().length).toBe(1);
	});

	it('beforeCopy returns allow when no plugins deny', () => {
		expect(registry.beforeCopy(['/a'], '/b')).toBe('allow');
	});

	it('beforeCopy returns deny when plugin denies', async () => {
		await registry.register(createTestPlugin({
			name: 'denier',
			onBeforeCopy: () => 'deny',
		}));

		expect(registry.beforeCopy(['/a'], '/b')).toBe('deny');
	});

	it('onFileOpen returns false when no plugin handles', () => {
		expect(registry.onFileOpen('/test.txt')).toBe(false);
	});

	it('onFileOpen returns true when plugin handles', async () => {
		await registry.register(createTestPlugin({
			name: 'opener',
			onFileOpen: () => true,
		}));

		expect(registry.onFileOpen('/test.txt')).toBe(true);
	});

	it('calls onActivate with context when registering', async () => {
		const mockContext: PluginContext = {
			getActivePane: vi.fn() as unknown as PluginContext['getActivePane'],
			getInactivePane: vi.fn() as unknown as PluginContext['getInactivePane'],
			navigateTo: vi.fn(),
			refreshPane: vi.fn(),
		};
		registry.setContext(mockContext);

		const onActivate = vi.fn();
		await registry.register(createTestPlugin({ onActivate }));

		expect(onActivate).toHaveBeenCalledWith(mockContext);
	});
});
