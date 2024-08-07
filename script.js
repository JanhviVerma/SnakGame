const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const scoreElement = document.getElementById('scoreValue');
const highScoreElement = document.getElementById('highScoreValue');
const finalScoreElement = document.getElementById('finalScore');
const finalHighScoreElement = document.getElementById('finalHighScore');
const gameOverScreen = document.getElementById('gameOverScreen');
const difficultySelect = document.getElementById('difficultySelect');

const gridSize = 20;
let tileCount;
let canvasSize;

let snake = [];
let food = {};
let dx = 0;
let dy = 0;
let score = 0;
let highScore = 0;
let gameLoop;
let gameState = 'initial'; // 'initial', 'playing', 'gameover'
let gameSpeeds = {
    easy: 150,
    medium: 100,
    hard: 50
};

function initializeCanvas() {
    canvasSize = Math.min(400, window.innerWidth - 40);
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    tileCount = canvasSize / gridSize;
}

function startGame() {
    initializeCanvas();
    snake = [{x: Math.floor(tileCount / 2), y: Math.floor(tileCount / 2)}];
    generateFood();
    dx = 1;
    dy = 0;
    score = 0;
    scoreElement.textContent = score;
    gameState = 'playing';
    if (gameLoop) clearInterval(gameLoop);
    const speed = gameSpeeds[difficultySelect.value];
    gameLoop = setInterval(gameStep, speed);
    startButton.disabled = true;
    gameOverScreen.style.display = 'none';
}

function generateFood() {
    food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };
    while (snake.some(segment => segment.x === food.x && segment.y === food.y)) {
        food = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
    }
}

function gameStep() {
    moveSnake();
    if (checkCollision()) {
        endGame();
    } else {
        drawGame();
    }
}

function moveSnake() {
    const head = {x: snake[0].x + dx, y: snake[0].y + dy};
    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreElement.textContent = score;
        generateFood();
    } else {
        snake.pop();
    }
}

function checkCollision() {
    const head = snake[0];
    return (
        head.x < 0 || head.x >= tileCount ||
        head.y < 0 || head.y >= tileCount ||
        snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)
    );
}

function endGame() {
    clearInterval(gameLoop);
    gameState = 'gameover';
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
    }
    finalScoreElement.textContent = score;
    finalHighScoreElement.textContent = highScore;
    highScoreElement.textContent = highScore;
    gameOverScreen.style.display = 'flex';
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw snake
    snake.forEach((segment, index) => {
        ctx.fillStyle = index === 0 ? 'darkgreen' : 'green';
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 1, gridSize - 1);
    });

    // Draw food
    ctx.fillStyle = 'red';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 1, gridSize - 1);
}

document.addEventListener('keydown', (e) => {
    if (gameState !== 'playing') return;
    
    switch (e.key) {
        case 'ArrowUp': if (dy === 0) { dx = 0; dy = -1; } break;
        case 'ArrowDown': if (dy === 0) { dx = 0; dy = 1; } break;
        case 'ArrowLeft': if (dx === 0) { dx = -1; dy = 0; } break;
        case 'ArrowRight': if (dx === 0) { dx = 1; dy = 0; } break;
    }
});

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

window.addEventListener('resize', () => {
    if (gameState === 'playing') {
        clearInterval(gameLoop);
        startGame();
    } else {
        initializeCanvas();
        drawGame();
    }
});

// Load high score from local storage
highScore = localStorage.getItem('snakeHighScore') || 0;
highScoreElement.textContent = highScore;

// Initial draw
initializeCanvas();
drawGame();