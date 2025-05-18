import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock $app/environment
vi.mock('$app/environment', () => ({
    browser: true,
    dev: true,
    prerendering: false,
    version: 'test'
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock window.requestAnimationFrame
window.requestAnimationFrame = vi.fn(callback => setTimeout(callback, 0));
window.cancelAnimationFrame = vi.fn();

// Mock IntersectionObserver
class MockIntersectionObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    constructor() {}
}

Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    value: MockIntersectionObserver
});

// Mock ResizeObserver
class MockResizeObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    constructor() {}
}

Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    value: MockResizeObserver
}); 