<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { browser } from '$app/environment';
    import { gameStore } from '$lib/stores/gameStore';
    import type { Direction } from '$lib/types';
    import { GRID_SIZE } from '$lib/constants';

    let gameLoop: number;
    let INITIAL_SPEED = 200;
    let MINIMAL_POSSIBLE_SPEED = 50
    let speed = INITIAL_SPEED;

    export function handleKeydown(event: KeyboardEvent) {
        const keyMap: Record<string, Direction> = {
            'ArrowUp': 'UP',
            'ArrowDown': 'DOWN',
            'ArrowLeft': 'LEFT',
            'ArrowRight': 'RIGHT',
            'w': 'UP',
            's': 'DOWN',
            'a': 'LEFT',
            'd': 'RIGHT'
        };

        const direction = keyMap[event.key];
        if (direction) {
            event.preventDefault();
            gameStore.changeDirection(direction);
        }
    }

    function startGame() {
        gameStore.reset();
        speed = INITIAL_SPEED;
        if (gameLoop) {
            clearInterval(gameLoop);
        }
        gameLoop = setInterval(() => {
            gameStore.moveSnake();
            speed = Math.max(MINIMAL_POSSIBLE_SPEED, speed - 5);
        }, speed);
    }

    onMount(() => {
        if (typeof window !== 'undefined') {
            window.addEventListener('keydown', handleKeydown);
            startGame();
        }
    });

    onDestroy(() => {
        if (typeof window !== 'undefined') {
            window.removeEventListener('keydown', handleKeydown);
            if (gameLoop) {
                clearInterval(gameLoop);
            }
        }
    });

    $: if ($gameStore.isGameOver && gameLoop) {
        clearInterval(gameLoop);
        gameLoop = 0;
    }
</script>

{#if browser}
    <div class="game-container">
        <div class="game-header">
            <h1>Snake Game</h1>
            <div class="score">Score: {$gameStore.score}</div>
        </div>

        <div class="game-board" style="--grid-size: {GRID_SIZE};">
            {#each Array(GRID_SIZE) as _, y}
                {#each Array(GRID_SIZE) as _, x}
                   {@const isSnake = $gameStore.snake.some(segment => segment.x === x && segment.y === y)}
                   {@const isFood = $gameStore.food.x === x && $gameStore.food.y === y}
                   <div
                       class="cell"
                       class:snake={isSnake}
                       class:food={isFood}
                   ></div>
                {/each}
            {/each}
        </div>

        {#if $gameStore.isGameOver}
            <div class="game-over">
                <h2>Game Over!</h2>
                <p>Final Score: {$gameStore.score}</p>
                <button on:click={startGame}>Play Again</button>
            </div>
        {/if}

        <div class="controls">
            <p>Use arrow keys or WASD to control the snake</p>
        </div>
    </div>
{/if}

<style>
    .game-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
    }

    .game-header {
        text-align: center;
    }

    .score {
        font-size: 1.5rem;
        font-weight: bold;
    }

    .game-board {
        display: grid;
        grid-template-columns: repeat(var(--grid-size), 1fr);
        gap: 1px;
        background-color: #2c3e50;
        padding: 1px;
        border-radius: 4px;
    }

    .cell {
        width: 1.25rem;
        height: 1.25rem;
        background-color: #34495e;
    }

    .snake {
        background-color: #2ecc71;
        border-radius: 2px;
    }

    .food {
        background-color: #e74c3c;
        border-radius: 50%;
    }

    .game-over {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: rgba(0, 0, 0, 0.9);
        padding: 2rem;
        border-radius: 8px;
        text-align: center;
        color: white;
    }

    button {
        background-color: #2ecc71;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
        margin-top: 1rem;
    }

    button:hover {
        background-color: #27ae60;
    }

    .controls {
        text-align: center;
        color: #7f8c8d;
    }
</style>
