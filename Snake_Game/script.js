const board = document.querySelector('.board');
const startButton = document.querySelector('.btn-start');
const modal = document.querySelector('.modal');
const startGameModal = document.querySelector('.start-game');
const gameOverModal = document.querySelector('.game-over');
const restartButton = document.querySelector('.btn-restart');

const highScoreElement = document.querySelector('#high-score');
const scoreElement = document.querySelector('#score');
const timeElement = document.querySelector('#time');

const blockHeight = 100;
const blockwidth = 100;

let highScore = Number(localStorage.getItem("highScore")) || 0;
let score = 0;
let seconds = 0; // track total elapsed seconds - simpler to format than a string

highScoreElement.innerText = highScore;

const cols = Math.floor(board.clientWidth / blockwidth);
const rows = Math.floor(board.clientHeight / blockHeight);

let intervalId = null;
let timerIntervalId = null;

let food = { x: Math.floor(Math.random() * rows), y: Math.floor(Math.random() * cols) };

const blocks = [];
let snake = [{ x: 6, y: 5 }, { x: 6, y: 6 }];

let direction = 'down';

for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
        const block = document.createElement('div');
        block.classList.add("block");
        board.appendChild(block);
        blocks[`${row}-${col}`] = block;
        //block.innerText = `${row}-${col}`;
    }
}

// Formats a total-seconds count as MM:SS with zero-padding
function formatTime(totalSeconds) {
    const min = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function render() {
    let head = null;

    blocks[`${food.x}-${food.y}`].classList.add("food");

    if (direction === "right") {
        head = { x: snake[0].x, y: snake[0].y + 1 };
    }
    if (direction === "left") {
        head = { x: snake[0].x, y: snake[0].y - 1 };
    }
    if (direction === "up") {
        head = { x: snake[0].x - 1, y: snake[0].y };
    }
    if (direction === "down") {
        head = { x: snake[0].x + 1, y: snake[0].y };
    }

    // Wall collision logic
    if (head.x < 0 || head.x >= rows || head.y < 0 || head.y >= cols) {
        endGame();
        return;
    }

    // Food consumption - just flags it, doesn't move the snake yet
    const ateFood = head.x === food.x && head.y === food.y;

    if (ateFood) {
        blocks[`${food.x}-${food.y}`].classList.remove("food");
        food = { x: Math.floor(Math.random() * rows), y: Math.floor(Math.random() * cols) };
        blocks[`${food.x}-${food.y}`].classList.add("food");

        score += 10;
        scoreElement.innerText = score;

        if (score > highScore) {
            highScore = score;
            highScoreElement.innerText = highScore;
            localStorage.setItem("highScore", highScore.toString());
        }
    }

    snake.forEach(segment => {
        blocks[`${segment.x}-${segment.y}`].classList.remove('fill');
    });

    // Move the snake forward - ONCE
    snake.unshift(head);

    if (!ateFood) {
        snake.pop(); // only shrink the tail if we didn't just grow
    }

    snake.forEach(segment => {
        blocks[`${segment.x}-${segment.y}`].classList.add('fill');
    });
}

// Stops movement + timer, shows the game-over modal
function endGame() {
    clearInterval(intervalId);
    clearInterval(timerIntervalId);

    modal.style.display = "flex";
    startGameModal.style.display = "none";
    gameOverModal.style.display = "flex";
}

// Starts (or restarts) both the movement loop and the timer,
// always clearing any previous ones first so only one of each ever runs
function startGameLoop() {
    clearInterval(intervalId);
    clearInterval(timerIntervalId);

    intervalId = setInterval(() => {
        render();
    }, 400);

    timerIntervalId = setInterval(() => {
        seconds += 1;
        timeElement.innerText = formatTime(seconds);
    }, 1000);
}

// Game only starts when the player clicks Start - no top-level interval anymore
startButton.addEventListener('click', () => {
    modal.style.display = "none";
    startGameLoop();
});

restartButton.addEventListener('click', restartGame);

function restartGame() {
    blocks[`${food.x}-${food.y}`].classList.remove("food");

    snake.forEach(segment => {
        blocks[`${segment.x}-${segment.y}`].classList.remove('fill');
    });

    score = 0;
    seconds = 0;

    scoreElement.innerText = score;
    timeElement.innerText = formatTime(seconds);
    highScoreElement.innerText = highScore;

    modal.style.display = "none";
    snake = [{ x: 1, y: 3 }];
    direction = 'down'; // reset direction so it can't reuse one pointing into a wall
    food = { x: Math.floor(Math.random() * rows), y: Math.floor(Math.random() * cols) };

    startGameLoop();
}

let isPaused = false;


// Toggles pause/resume - stops or restarts both intervals
function togglePause() {
    if (isPaused) {
        // Resuming: startGameLoop clears any stray intervals first, so this is safe
        startGameLoop();
    } else {
        // Pausing: stop both intervals, leave score/snake/food untouched
        clearInterval(intervalId);
        clearInterval(timerIntervalId);
    }

    isPaused = !isPaused;
}

addEventListener("keydown", (event) => {
    if (event.key === " ") {
        event.preventDefault(); // stops the page from scrolling down on spacebar
        togglePause();
        return; // don't fall through to direction checks below
    }

    if (isPaused) return; // ignore direction changes while paused

    if (event.key == "ArrowUp") {
        direction = "up";
    }
    if (event.key == "ArrowDown") {
        direction = "down";
    }
    if (event.key == "ArrowRight") {
        direction = "right";
    }
    if (event.key == "ArrowLeft") {
        direction = "left";
    }
});