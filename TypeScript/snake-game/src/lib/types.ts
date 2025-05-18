export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface Position {
    x: number;
    y: number;
}

export interface GameState {
    snake: Position[];
    food: Position;
    direction: Direction;
    score: number;
    isGameOver: boolean;
}

export interface GameConfig {
    gridSize: number;
    initialSpeed: number;
    speedIncrease: number;
} 