import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/svelte';
import { tick } from 'svelte';
import Game from '$lib/components/Game.svelte';
import { gameStore } from '$lib/stores/gameStore';
import type { GameState } from '$lib/types';

describe('Game', () => {
    beforeEach(() => {
        gameStore.reset();
    });

    it('should render game board with correct dimensions', () => {
        const { container } = render(Game);
        const cells = container.querySelectorAll('.cell');
        expect(cells).toHaveLength(400); // 20x20 grid
    });

    it('should render snake and food', () => {
        const { container } = render(Game);
        const snakeCells = container.querySelectorAll('.snake');
        const foodCell = container.querySelector('.food');
        
        expect(snakeCells).toHaveLength(1); // Initial snake length
        expect(foodCell).toBeTruthy();
    });

    it('should handle keyboard controls', async () => {
        // Render the component to get the instance and its methods
        const { component } = render(Game);
        
        let state: GameState | undefined;
        const unsubscribe = gameStore.subscribe(s => state = s);

        // Mock event object
        const mockEvent = (key: string) => ({
            key,
            preventDefault: vi.fn(),
        });

        // Test arrow keys
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

        // Move snake to eat food
        gameStore.moveSnake();
        
        // Get updated state
        gameStore.subscribe(s => state = s)();
        if (!state) throw new Error('State should be defined');
        expect(state.score).toBe(1);
    });

    it('should show game over screen when snake collides', async () => {
        vi.useFakeTimers();
        render(Game);
        
        // Create collision situation
        let state: GameState | undefined;
        gameStore.subscribe(s => state = s)();
        
        if (!state) throw new Error('State should be defined');
        
        // Create a snake that will collide with itself
        const head = { x: 5, y: 5 };
        gameStore.reset();
        gameStore.subscribe(s => state = s)();
        if (!state) throw new Error('State should be defined');
        
        // Set up snake and direction
        state.snake = [
            head,
            { x: 4, y: 5 },
            { x: 3, y: 5 },
            { x: 3, y: 4 },
            { x: 4, y: 4 }
        ];
        state.direction = 'LEFT';

        // Trigger collision by moving into the snake's body
        gameStore.moveSnake();

        // Wait for game over state to be true
        await waitFor(() => {
            let currentState: GameState | undefined;
            gameStore.subscribe(s => currentState = s)();
            if (!currentState) throw new Error('State should be defined');
            expect(currentState.isGameOver).toBe(true);
        });

        // Now check for game over elements in the DOM
        expect(screen.getByText('Game Over!')).toBeTruthy();
        expect(screen.getByText(/Final Score:/)).toBeTruthy();
    });

    it('should restart game when clicking Play Again', async () => {
        vi.useFakeTimers();
        render(Game);
        
        // Trigger game over
        let state: GameState | undefined;
        gameStore.subscribe(s => state = s)();
        
        if (!state) throw new Error('State should be defined');
        
        // Create a snake that will collide with itself
        const head = { x: 5, y: 5 };
        gameStore.reset();
        gameStore.subscribe(s => state = s)();
        if (!state) throw new Error('State should be defined');
        
        // Set up snake and direction
        state.snake = [
            head,
            { x: 4, y: 5 },
            { x: 3, y: 5 }
        ];
        state.direction = 'LEFT';
        state.score = 5;

        // Trigger collision
        gameStore.moveSnake();

         // Wait for game over state to be true
         await waitFor(() => {
            let currentState: GameState | undefined;
            gameStore.subscribe(s => currentState = s)();
            if (!currentState) throw new Error('State should be defined');
            expect(currentState.isGameOver).toBe(true);
        });

        // Click Play Again
        const playAgainButton = screen.getByText('Play Again');
        await fireEvent.click(playAgainButton);

        // Check if game is reset
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