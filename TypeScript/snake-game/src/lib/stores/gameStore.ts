import { writable } from 'svelte/store';
import type { GameState, Direction, Position, GameConfig } from '$lib/types';
import { GRID_SIZE } from '$lib/constants';

const DEFAULT_CONFIG: GameConfig = {
    gridSize: GRID_SIZE,
    initialSpeed: 200,
    speedIncrease: 5
};

const createInitialState = (config: GameConfig): GameState => ({
    snake: [
        { x: Math.floor(config.gridSize / 2), y: Math.floor(config.gridSize / 2) }
    ],
    food: generateFood(config.gridSize, [{ x: Math.floor(config.gridSize / 2), y: Math.floor(config.gridSize / 2) }]),
    direction: 'RIGHT',
    score: 0,
    isGameOver: false
});

function generateFood(gridSize: number, snake: Position[]): Position {
    let food: Position;
    do {
        food = {
            x: Math.floor(Math.random() * gridSize),
            y: Math.floor(Math.random() * gridSize)
        };
    } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
    return food;
}

function createGameStore(config: GameConfig = DEFAULT_CONFIG) {
    const { subscribe, set, update } = writable<GameState>(createInitialState(config));

    return {
        subscribe,
        moveSnake: () => {
            update(state => {
                if (state.isGameOver) return state;

                const head = { ...state.snake[0] };

                switch (state.direction) {
                    case 'UP':
                        head.y = (head.y - 1 + config.gridSize) % config.gridSize;
                        break;
                    case 'DOWN':
                        head.y = (head.y + 1) % config.gridSize;
                        break;
                    case 'LEFT':
                        head.x = (head.x - 1 + config.gridSize) % config.gridSize;
                        break;
                    case 'RIGHT':
                        head.x = (head.x + 1) % config.gridSize;
                        break;
                }

                // Check for collision with self
                if (state.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
                    return { ...state, isGameOver: true };
                }

                const newSnake = [head];
                const ateFood = head.x === state.food.x && head.y === state.food.y;

                if (ateFood) {
                    newSnake.push(...state.snake);
                    return {
                        ...state,
                        snake: newSnake,
                        food: generateFood(config.gridSize, newSnake),
                        score: state.score + 1
                    };
                }

                newSnake.push(...state.snake.slice(0, -1));
                return { ...state, snake: newSnake };
            });
        },
        changeDirection: (newDirection: Direction) => {
            update(state => {
                const opposites = {
                    'UP': 'DOWN',
                    'DOWN': 'UP',
                    'LEFT': 'RIGHT',
                    'RIGHT': 'LEFT'
                };
                
                if (opposites[newDirection] === state.direction) {
                    return state;
                }
                
                return { ...state, direction: newDirection };
            });
        },
        reset: () => {
            set(createInitialState(config));
        },
        setFood: (position: Position) => {
            update(state => ({
                ...state,
                food: position
            }));
        }
    };
}

export const gameStore = createGameStore();
