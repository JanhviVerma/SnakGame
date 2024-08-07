const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const scoreElement = document.getElementById('scoreValue');
const highScoreElement = document.getElementById('highScoreValue');
const powerUpElement = document.getElementById('powerUpValue');
const finalScoreElement = document.getElementById('finalScore');
const finalHighScoreElement = document.getElementById('finalHighScore');
const gameOverScreen = document.getElementById('gameOverScreen');
const difficultySelect = document.getElementById('difficultySelect');

const gridSize = 20;
let tileCount;
let canvasSize;

let snake = [];
let food = {};
let obstacles = [];
let powerUp = null;
let dx = 0;
let dy = 0;
let score = 0;
let highScore = 0;
let gameLoop;
let gameState = 'initial';
let gameSpeeds = {
    easy: 150,
    medium: 100,
    hard: 50
};
let currentPowerUp = 'None';

const powerUps = {
    speedBoost: { color: 'yellow', duration: 5000, effect: () => {} },
    pointMultiplier: { color: 'purple', duration: 10000, effect: () => {} },
    obstacleRemover: { color: 'orange', duration: 0, effect: () => { obstacles = []; } }
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
    generateObstacles();
    dx = 1;
    dy = 0;
    score = 0;
    scoreElement.textContent = score;
    powerUpElement.textContent = 'None';
    gameState = 'playing';
    if (gameLoop) clearInterval(gameLoop);
    const speed = gameSpeeds[difficultySelect.value];
    gameLoop = setInterval(gameStep, speed);
    startButton.disabled = true;
    gameOverScreen.style.display = 'none';
}

function generateFood() {
    food = getEmptyCell();
}

function generateObstacles() {
    obstacles = [];
    const obstacleCount = difficultySelect.value === 'easy' ? 3 : difficultySelect.value === 'medium' ? 5 : 7;
    for (let i = 0; i < obstacleCount; i++) {
        obstacles.push(getEmptyCell());
    }
}

function getEmptyCell() {
    let cell;
    do {
        cell = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCount)
        };
    } while (
        snake.some(segment => segment.x === cell.x && segment.y === cell.y) ||
        obstacles.some(obstacle => obstacle.x === cell.x && obstacle.y === cell.y) ||
        (food.x === cell.x && food.y === cell.y)
    );
    return cell;
}

function gameStep() {
    moveSnake();
    if (checkCollision()) {
        endGame();
    } else {
        checkFoodCollision();
        checkPowerUpCollision();
        drawGame();
    }
}

function moveSnake() {
    const head = {x: snake[0].x + dx, y: snake[0].y + dy};
    snake.unshift(head);

    if (head.x !== food.x || head.y !== food.y) {
        snake.pop();
    }
}

function checkCollision() {
    const head = snake[0];
    return (
        head.x < 0 || head.x >= tileCount ||
        head.y < 0 || head.y >= tileCount ||
        snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y) ||
        obstacles.some(obstacle => obstacle.x === head.x && obstacle.y === head.y)
    );
}

function checkFoodCollision() {
    const head = snake[0];
    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreElement.textContent = score;
        generateFood();
        if (Math.random() < 0.2) { // 20% chance to spawn a power-up
            spawnPowerUp();
        }
    }
}

function checkPowerUpCollision() {
    if (powerUp) {
        const head = snake[0];
        if (head.x === powerUp.x && head.y === powerUp.y) {
            activatePowerUp(powerUp.type);
            powerUp = null;
        }
    }
}

function spawnPowerUp() {
    const types = Object.keys(powerUps);
    const type = types[Math.floor(Math.random() * types.length)];
    powerUp = { ...getEmptyCell(), type };
}

function activatePowerUp(type) {
    currentPowerUp = type;
    powerUpElement.textContent = type;
    powerUps[type].effect();
    setTimeout(() => {
        currentPowerUp = 'None';
        powerUpElement.textContent = 'None';
    }, powerUps[type].duration);
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

    // Draw obstacles
    ctx.fillStyle = 'gray';
    obstacles.forEach(obstacle => {
        ctx.fillRect(obstacle.x * gridSize, obstacle.y * gridSize, gridSize - 1, gridSize - 1);
    });

    // Draw power-up
    if (powerUp) {
        ctx.fillStyle = powerUps[powerUp.type].color;
        ctx.fillRect(powerUp.x * gridSize, powerUp.y * gridSize, gridSize - 1, gridSize - 1);
    }
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