import { describe, it, expect, beforeEach } from 'vitest';
import { gameStore } from '../gameStore';
import type { Direction, GameState, Position } from '$lib/types';

describe('gameStore', () => {
    beforeEach(() => {
        gameStore.reset();
    });

    // Helper function to get latest state
    const getLatestState = () => {
        let state: GameState | undefined;
        const unsubscribe = gameStore.subscribe(s => state = s);
        unsubscribe();
        if (!state) throw new Error('State should be defined');
        return state;
    };

    it('should initialize with correct default state', () => {
        const state = getLatestState();
        
        expect(state.snake).toHaveLength(1);
        expect(state.snake[0]).toEqual({ x: 10, y: 10 }); // Center of 20x20 grid
        expect(state.direction).toBe('RIGHT');
        expect(state.score).toBe(0);
        expect(state.isGameOver).toBe(false);
        expect(state.food).toBeDefined();
        // Initial food position is random, so we just check it's within bounds
        expect(state.food.x).toBeGreaterThanOrEqual(0);
        expect(state.food.x).toBeLessThan(20);
        expect(state.food.y).toBeGreaterThanOrEqual(0);
        expect(state.food.y).toBeLessThan(20);
    });

    it('should change direction correctly', () => {
        // Test valid direction changes
        gameStore.changeDirection('UP'); // Initial RIGHT -> UP (Valid)
        expect(getLatestState().direction).toBe('UP');

        gameStore.changeDirection('RIGHT'); // Current UP -> RIGHT (Valid)
        expect(getLatestState().direction).toBe('RIGHT');

        gameStore.changeDirection('DOWN'); // Current RIGHT -> DOWN (Valid)
        expect(getLatestState().direction).toBe('DOWN');

        gameStore.changeDirection('LEFT'); // Current DOWN -> LEFT (Valid)
        expect(getLatestState().direction).toBe('LEFT');

        // Test invalid direction changes (opposite direction)
        gameStore.changeDirection('RIGHT'); // Try to change from LEFT to RIGHT (Invalid)
        expect(getLatestState().direction).toBe('LEFT'); // Should remain LEFT

        gameStore.changeDirection('UP'); // Change from LEFT to UP (Valid)
        expect(getLatestState().direction).toBe('UP');

        gameStore.changeDirection('DOWN'); // Try to change from UP to DOWN (Invalid)
        expect(getLatestState().direction).toBe('UP'); // Should remain UP
    });

    it('should move snake correctly', () => {
        const initialState = getLatestState();
        const initialHead = { ...initialState.snake[0] };
        
        gameStore.moveSnake();
        const newState = getLatestState();

        expect(newState.snake[0].x).toBe(initialHead.x + 1); // Moving right initially
        expect(newState.snake[0].y).toBe(initialHead.y);
    });

    it('should grow snake when eating food', () => {
        let state = getLatestState();
        const initialLength = state.snake.length;
        
        // Place food one step to the right of the snake's head
        const head = state.snake[0];
        gameStore.setFood({ x: head.x + 1, y: head.y });
        
        // Move right to eat the food
        gameStore.moveSnake();
        state = getLatestState();

        expect(state.snake.length).toBe(initialLength + 1);
        expect(state.score).toBe(1);
    });

    it('should detect self-collision', () => {
        let state = getLatestState();
        
        // Grow the snake by placing food in a sequence of positions
        // First food: one step right
        const head = state.snake[0];
        gameStore.setFood({ x: head.x + 1, y: head.y });
        gameStore.moveSnake();
        state = getLatestState();
        
        // Second food: one step right again
        gameStore.setFood({ x: state.snake[0].x + 1, y: state.snake[0].y });
        gameStore.moveSnake();
        state = getLatestState();
        
        // Third food: one step right again
        gameStore.setFood({ x: state.snake[0].x + 1, y: state.snake[0].y });
        gameStore.moveSnake();
        state = getLatestState();
        
        // Fourth food: one step right again
        gameStore.setFood({ x: state.snake[0].x + 1, y: state.snake[0].y });
        gameStore.moveSnake();
        state = getLatestState();

        // Now we have a snake of length 5, let's cause a collision
        if (state.snake.length >= 4) {
            // Move up
            gameStore.changeDirection('UP');
            gameStore.moveSnake();
            state = getLatestState();
            
            // Move left
            gameStore.changeDirection('LEFT');
            gameStore.moveSnake();
            state = getLatestState();
            
            // Move down to collide with the body
            gameStore.changeDirection('DOWN');
            gameStore.moveSnake();
            state = getLatestState();
            
            expect(state.isGameOver).toBe(true);
        } else {
            console.warn("Snake did not grow enough for a reliable self-collision test. Length: ", state.snake.length);
            // Skip the test if we couldn't grow the snake enough
            expect(state.snake.length).toBeGreaterThanOrEqual(4);
        }
    });

    it('should wrap around grid boundaries', () => {
        // Move snake to right edge by moving right multiple times
        for (let i = 0; i < 10; i++) { // Need 10 moves from initial (10,10) to reach (0,10)
            gameStore.moveSnake();
        }

        expect(getLatestState().snake[0].x).toBe(0); // Should wrap to left side
    });

    it('should reset game state', () => {
        // Modify state by playing the game a bit
        gameStore.changeDirection('RIGHT');
        gameStore.moveSnake();
        gameStore.moveSnake();
        gameStore.moveSnake();

        gameStore.reset();
        const state = getLatestState();

        expect(state.score).toBe(0);
        expect(state.isGameOver).toBe(false);
        expect(state.snake).toHaveLength(1);
        expect(state.snake[0]).toEqual({ x: 10, y: 10 });
    });
}); 