import { describe, it, expect, vi } from 'vitest';
import { createKeyboardManager } from './keyboard';

function createKeyEvent(key: string, opts: { ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean } = {}): KeyboardEvent {
	return new KeyboardEvent('keydown', {
		key,
		ctrlKey: opts.ctrlKey ?? false,
		shiftKey: opts.shiftKey ?? false,
		altKey: opts.altKey ?? false,
		bubbles: true,
		cancelable: true,
	});
}

describe('KeyboardManager', () => {
	it('calls action for matching key', () => {
		const action = vi.fn();
		const manager = createKeyboardManager([
			{ key: 'Tab', action, description: 'Switch pane' }
		]);

		const event = createKeyEvent('Tab');
		const handled = manager.handleKeyDown(event);

		expect(handled).toBe(true);
		expect(action).toHaveBeenCalledOnce();
	});

	it('does not call action for non-matching key', () => {
		const action = vi.fn();
		const manager = createKeyboardManager([
			{ key: 'Tab', action, description: 'Switch pane' }
		]);

		const event = createKeyEvent('Enter');
		const handled = manager.handleKeyDown(event);

		expect(handled).toBe(false);
		expect(action).not.toHaveBeenCalled();
	});

	it('handles Ctrl modifier', () => {
		const action = vi.fn();
		const manager = createKeyboardManager([
			{ key: 'r', ctrl: true, action, description: 'Refresh' }
		]);

		// Without ctrl - should not trigger
		manager.handleKeyDown(createKeyEvent('r'));
		expect(action).not.toHaveBeenCalled();

		// With ctrl - should trigger
		manager.handleKeyDown(createKeyEvent('r', { ctrlKey: true }));
		expect(action).toHaveBeenCalledOnce();
	});

	it('handles F-keys', () => {
		const actions = {
			f5: vi.fn(),
			f6: vi.fn(),
			f7: vi.fn(),
			f8: vi.fn(),
		};

		const manager = createKeyboardManager([
			{ key: 'F5', action: actions.f5, description: 'Copy' },
			{ key: 'F6', action: actions.f6, description: 'Move' },
			{ key: 'F7', action: actions.f7, description: 'Mkdir' },
			{ key: 'F8', action: actions.f8, description: 'Delete' },
		]);

		manager.handleKeyDown(createKeyEvent('F5'));
		manager.handleKeyDown(createKeyEvent('F7'));

		expect(actions.f5).toHaveBeenCalledOnce();
		expect(actions.f6).not.toHaveBeenCalled();
		expect(actions.f7).toHaveBeenCalledOnce();
		expect(actions.f8).not.toHaveBeenCalled();
	});

	it('prevents default on matched keys', () => {
		const manager = createKeyboardManager([
			{ key: 'Tab', action: vi.fn(), description: 'Switch' }
		]);

		const event = createKeyEvent('Tab');
		const preventSpy = vi.spyOn(event, 'preventDefault');
		manager.handleKeyDown(event);

		expect(preventSpy).toHaveBeenCalled();
	});

	it('attaches and detaches from element', () => {
		const action = vi.fn();
		const manager = createKeyboardManager([
			{ key: 'Enter', action, description: 'Open' }
		]);

		const element = document.createElement('div');
		const detach = manager.attach(element);

		element.dispatchEvent(createKeyEvent('Enter'));
		expect(action).toHaveBeenCalledOnce();

		detach();
		element.dispatchEvent(createKeyEvent('Enter'));
		expect(action).toHaveBeenCalledOnce(); // Still 1, not 2
	});
});
