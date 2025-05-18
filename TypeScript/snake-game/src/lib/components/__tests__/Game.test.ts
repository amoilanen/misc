import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import Game from '$lib/components/Game.svelte';
import { gameStore } from '$lib/stores/gameStore';
import type { GameState } from '$lib/types';
import { GRID_SIZE } from '$lib/constants';

describe('Game', () => {
    beforeEach(() => {
        gameStore.reset();
    });

    it('should render game board with correct dimensions', () => {
        const { container } = render(Game);
        const cells = container.querySelectorAll('.cell');
        expect(cells).toHaveLength(GRID_SIZE * GRID_SIZE);
    });

    it('should render snake and food', () => {
        const { container } = render(Game);
        const snakeCells = container.querySelectorAll('.snake');
        const foodCell = container.querySelector('.food');

        expect(snakeCells).toHaveLength(1);
        expect(foodCell).toBeTruthy();
    });

    it('should handle keyboard controls', async () => {
        const { component } = render(Game);

        let state: GameState | undefined;
        const unsubscribe = gameStore.subscribe(s => state = s);

        const mockEvent = (key: string) => ({
            key,
            preventDefault: vi.fn(),
        });

        component.handleKeydown(mockEvent('ArrowUp'));
        await tick();

        await waitFor(() => {
            if (!state) throw new Error('State should be defined');
            expect(state.direction).toBe('UP');
        });
        
        component.handleKeydown(mockEvent('ArrowRight'));
        await tick();
        await waitFor(() => {
            if (!state) throw new Error('State should be defined');
            expect(state.direction).toBe('RIGHT');
        });
        
        // Test WASD keys
        component.handleKeydown(mockEvent('w'));
        await tick();
         await waitFor(() => {
            if (!state) throw new Error('State should be defined');
            expect(state.direction).toBe('UP');
        });
        
        component.handleKeydown(mockEvent('d'));
        await tick();
        await waitFor(() => {
            if (!state) throw new Error('State should be defined');
            expect(state.direction).toBe('RIGHT');
        });

        unsubscribe();
    });

    it('should update score when snake eats food', () => {
        vi.useFakeTimers();
        render(Game);

        // Place food in front of snake
        let state: GameState | undefined;
        gameStore.subscribe(s => state = s)();

        if (!state) throw new Error('State should be defined');
        const head = state.snake[0];
        gameStore.setFood({ x: head.x + 1, y: head.y });
        expect(state.score).toBe(0);

        gameStore.moveSnake();

        gameStore.subscribe(s => state = s)();
        if (!state) throw new Error('State should be defined');
        expect(state.score).toBe(1);
    });

    it('should show "Game Over" screen when snake collides', async () => {
        vi.useFakeTimers();
        render(Game);

        // Create collision situation
        let state: GameState | undefined;
        gameStore.subscribe(s => state = s)();
        gameStore.reset();
        gameStore.subscribe(s => state = s)();
        if (!state) throw new Error('State should be defined');

        state.snake = [
            { x: 3, y: 3 },
            { x: 4, y: 3 },
            { x: 4, y: 4 },
            { x: 3, y: 4 }
        ];
        state.direction = 'DOWN';

        gameStore.moveSnake();

        await waitFor(() => {
            let currentState: GameState | undefined;
            gameStore.subscribe(s => currentState = s)();
            if (!currentState) throw new Error('State should be defined');
            expect(currentState.isGameOver).toBe(true);
        });

        expect(screen.getByText('Game Over!')).toBeTruthy();
        expect(screen.getByText(/Final Score:/)).toBeTruthy();
    });

    it('should restart game when clicking Play Again', async () => {
        vi.useFakeTimers();
        render(Game);

        // Create collision situation
        let state: GameState | undefined;
        gameStore.subscribe(s => state = s)();
        gameStore.reset();
        gameStore.subscribe(s => state = s)();
        if (!state) throw new Error('State should be defined');

        state.snake = [
            { x: 3, y: 3 },
            { x: 4, y: 3 },
            { x: 4, y: 4 },
            { x: 3, y: 4 }
        ];
        state.direction = 'DOWN';

        gameStore.moveSnake();

        await waitFor(() => {
            let currentState: GameState | undefined;
            gameStore.subscribe(s => currentState = s)();
            if (!currentState) throw new Error('State should be defined');
            expect(currentState.isGameOver).toBe(true);
        });

        const playAgainButton = screen.getByText('Play Again');
        await fireEvent.click(playAgainButton);

        await waitFor(() => {
            let currentState: GameState | undefined;
            gameStore.subscribe(s => currentState = s)();
            if (!currentState) throw new Error('State should be defined');
            expect(currentState.score).toBe(0);
            expect(currentState.isGameOver).toBe(false);
            expect(screen.queryByText('Game Over!')).toBeNull();
        });
    });

    it('should display controls information', () => {
        render(Game);
        expect(screen.getByText(/Use arrow keys or WASD to control the snake/)).toBeTruthy();
    });
}); 