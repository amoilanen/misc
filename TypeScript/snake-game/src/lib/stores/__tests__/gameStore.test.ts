import { describe, it, expect, beforeEach } from 'vitest';
import { gameStore } from '../gameStore';
import type { Direction, GameState, Position } from '$lib/types';

describe('gameStore', () => {
    beforeEach(() => {
        gameStore.reset();
    });

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
        expect(state.snake[0]).toEqual({ x: 10, y: 10 });
        expect(state.direction).toBe('RIGHT');
        expect(state.score).toBe(0);
        expect(state.isGameOver).toBe(false);
        expect(state.food).toBeDefined();

        expect(state.food.x).toBeGreaterThanOrEqual(0);
        expect(state.food.x).toBeLessThan(20);
        expect(state.food.y).toBeGreaterThanOrEqual(0);
        expect(state.food.y).toBeLessThan(20);
    });

    it('should change direction correctly', () => {
        gameStore.changeDirection('UP');
        expect(getLatestState().direction).toBe('UP');

        gameStore.changeDirection('RIGHT');
        expect(getLatestState().direction).toBe('RIGHT');

        gameStore.changeDirection('DOWN');
        expect(getLatestState().direction).toBe('DOWN');

        gameStore.changeDirection('LEFT');
        expect(getLatestState().direction).toBe('LEFT');

        // Test invalid direction changes (opposite direction)
        gameStore.changeDirection('RIGHT');
        expect(getLatestState().direction).toBe('LEFT');

        gameStore.changeDirection('UP'); // Change from LEFT to UP (Valid)
        expect(getLatestState().direction).toBe('UP');

        // Test invalid direction changes (opposite direction)
        gameStore.changeDirection('DOWN');
        expect(getLatestState().direction).toBe('UP');
    });

    it('should move snake correctly', () => {
        const initialState = getLatestState();
        const initialHead = { ...initialState.snake[0] };
        
        gameStore.moveSnake();
        const newState = getLatestState();

        // Moving right initially
        expect(newState.snake[0].x).toBe(initialHead.x + 1);
        expect(newState.snake[0].y).toBe(initialHead.y);
    });

    it('should grow snake when eating food', () => {
        let initialState = getLatestState();
        const initialLength = initialState.snake.length;

        const head = initialState.snake[0];
        gameStore.setFood({ x: head.x + 1, y: head.y });

        gameStore.moveSnake();
        let state = getLatestState();

        expect(state.snake.length).toBe(initialLength + 1);
        expect(state.score).toBe(1);
        expect(state.snake).toEqual([{ x: head.x + 1, y: head.y }].concat(initialState.snake))
    });

    it('should detect self-collision', () => {
        let state = getLatestState();

        // Grow the snake by placing food in a sequence of positions
        gameStore.setFood({ x: state.snake[0].x + 1, y: state.snake[0].y });
        gameStore.moveSnake();
        state = getLatestState();
        gameStore.setFood({ x: state.snake[0].x + 1, y: state.snake[0].y });
        gameStore.moveSnake();
        state = getLatestState();
        gameStore.setFood({ x: state.snake[0].x + 1, y: state.snake[0].y });
        gameStore.moveSnake();
        state = getLatestState();

        // Now we have a snake of length 4, let's cause a collision
        if (state.snake.length == 4) {
            gameStore.changeDirection('UP');
            gameStore.moveSnake();
            gameStore.changeDirection('LEFT');
            gameStore.moveSnake();
            gameStore.changeDirection('DOWN');
            gameStore.moveSnake();
            state = getLatestState();
            expect(state.isGameOver).toBe(true);
        } else {
            console.warn("Snake did not grow enough for a reliable self-collision test. Length: ", state.snake.length);
            expect(state.snake.length).toEqual(4);
        }
    });

    it('should wrap around grid boundaries', () => {
        for (let i = 0; i < 10; i++) { // Need 10 moves from initial (10,10) to reach (0,10)
            gameStore.moveSnake();
        }
        expect(getLatestState().snake[0].x).toBe(0); // Should wrap to left side
    });

    it('should reset game state', () => {
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