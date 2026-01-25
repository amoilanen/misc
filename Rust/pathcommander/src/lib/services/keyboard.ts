export interface KeyBinding {
	key: string;
	ctrl?: boolean;
	shift?: boolean;
	alt?: boolean;
	action: () => void | Promise<void>;
	description: string;
}

export type KeyBindingMap = Map<string, KeyBinding>;

function getKeyId(key: string, ctrl: boolean, shift: boolean, alt: boolean): string {
	const parts: string[] = [];
	if (ctrl) parts.push('Ctrl');
	if (shift) parts.push('Shift');
	if (alt) parts.push('Alt');
	parts.push(key);
	return parts.join('+');
}

export function createKeyboardManager(bindings: KeyBinding[]) {
	const bindingMap: KeyBindingMap = new Map();

	for (const binding of bindings) {
		const id = getKeyId(
			binding.key,
			binding.ctrl ?? false,
			binding.shift ?? false,
			binding.alt ?? false
		);
		bindingMap.set(id, binding);
	}

	function handleKeyDown(event: KeyboardEvent): boolean {
		const id = getKeyId(event.key, event.ctrlKey, event.shiftKey, event.altKey);
		const binding = bindingMap.get(id);

		if (binding) {
			event.preventDefault();
			event.stopPropagation();
			binding.action();
			return true;
		}
		return false;
	}

	function attach(element: HTMLElement): () => void {
		element.addEventListener('keydown', handleKeyDown);
		return () => element.removeEventListener('keydown', handleKeyDown);
	}

	return { handleKeyDown, attach, bindings: bindingMap };
}
