// Grab the board container from the DOM
const board = document.querySelector('.board');

// Size of each grid cell in pixels
const blockHeight = 50;
const blockWidth = 50;

// Calculate how many columns and rows fit inside the board
const cols = Math.floor(board.clientWidth / blockWidth);
const rows = Math.floor(board.clientHeight / blockHeight);

// Will hold the interval ID so we can stop the game loop later
let intervalId = null;

// Stores references to every block div, keyed by "row-col", for fast lookup
const blocks = [];

// The snake starts as a single segment
const snake = [{ x: 1, y: 2 }];

// Snake starts moving downward
let direction = 'down';

// Food position, picked randomly within the grid.
// Uses "rows" and "cols" (not "row" - that only exists inside the loop below).
let food = {
    x: Math.floor(Math.random() * rows),
    y: Math.floor(Math.random() * cols)
};

// Build the grid: one div per cell, stored in `blocks` for fast lookup
for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
        const block = document.createElement('div');
        block.classList.add('block');
        board.appendChild(block);
        block.innerText = `${row}-${col}`;

        blocks[`${row}-${col}`] = block;
    }
}

// Draws the current snake position by adding the 'fill' class
// to every block the snake currently occupies
function render() {
    snake.forEach(segment => {
        const block = blocks[`${segment.x}-${segment.y}`];
        if (block) block.classList.add('fill');
    });
}

// Marks the current food cell visually
function renderFood() {
    blocks[`${food.x}-${food.y}`].classList.add('food');
}

// Moves the food to a new random cell and redraws it
function placeFood() {
    food = {
        x: Math.floor(Math.random() * rows),
        y: Math.floor(Math.random() * cols)
    };
    renderFood();
}

// Draw the food once before the game loop starts
renderFood();

// Main game loop - set up ONCE here, not inside render().
// This is what was causing the runaway/never-starts bug.
intervalId = setInterval(() => {
    let head = null;

    // Calculate the new head position based on current direction
    if (direction === 'left') {
        head = { x: snake[0].x, y: snake[0].y - 1 };
    } else if (direction === 'right') {
        head = { x: snake[0].x, y: snake[0].y + 1 };
    } else if (direction === 'down') {
        head = { x: snake[0].x + 1, y: snake[0].y };
    } else if (direction === 'up') {
        head = { x: snake[0].x - 1, y: snake[0].y };
    }

    // Wall collision - stop the game if the head goes out of bounds
    if (head.x < 0 || head.x >= rows || head.y < 0 || head.y >= cols) {
        alert('Game Over');
        clearInterval(intervalId);
        return; // stop here so nothing below runs after game over
    }

    // Check whether the new head lands on the food
    const ateFood = head.x === food.x && head.y === food.y;

    // Clear the 'fill' class from all current segments before moving
    snake.forEach(segment => {
        blocks[`${segment.x}-${segment.y}`].classList.remove('fill');
    });

    // Move the snake forward by adding the new head (ONCE)
    snake.unshift(head);

    if (ateFood) {
        // Snake grows: skip removing the tail this tick
        blocks[`${food.x}-${food.y}`].classList.remove('food');
        placeFood();
    } else {
        // Normal move: drop the tail so length stays the same
        snake.pop();
    }

    render();
}, 400);

// Listen for arrow key presses to change direction
addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp') {
        direction = 'up';
    }
    if (event.key === 'ArrowRight') {
        direction = 'right';
    }
    if (event.key === 'ArrowLeft') {
        direction = 'left';
    }
    if (event.key === 'ArrowDown') {
        direction = 'down';
    }
});