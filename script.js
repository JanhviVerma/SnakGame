const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const muteButton = document.getElementById('muteButton');
const scoreElement = document.getElementById('scoreValue');
const highScoreElement = document.getElementById('highScoreValue');
const levelElement = document.getElementById('levelValue');
const powerUpElement = document.getElementById('powerUpValue');
const finalScoreElement = document.getElementById('finalScore');
const finalHighScoreElement = document.getElementById('finalHighScore');
const finalLevelElement = document.getElementById('finalLevel');
const gameOverScreen = document.getElementById('gameOverScreen');
const difficultySelect = document.getElementById('difficultySelect');
const achievementPopup = document.getElementById('achievementPopup');
const achievementText = document.getElementById('achievementText');

const gridSize = 20;
let tileCount;
let canvasSize;

let snake = [];
let food = {};
let specialFood = null;
let obstacles = [];
let powerUp = null;
let dx = 0;
let dy = 0;
let score = 0;
let highScore = 0;
let level = 1;
let gameLoop;
let gameState = 'initial';
let gameSpeeds = {
    easy: 150,
    medium: 100,
    hard: 50
};
let currentPowerUp = 'None';
let isMuted = false;

const powerUps = {
    speedBoost: { color: 'yellow', duration: 5000, effect: () => {} },
    pointMultiplier: { color: 'purple', duration: 10000, effect: () => {} },
    obstacleRemover: { color: 'orange', duration: 0, effect: () => { obstacles = []; } }
};

const specialFoods = {
    golden: { color: 'gold', points: 5 },
    shrink: { color: 'blue', effect: () => { snake = snake.slice(0, Math.max(3, snake.length - 2)); } }
};

const achievements = {
    levelUp: { name: "Level Up!", description: "Reach level {level}" },
    speedDemon: { name: "Speed Demon", description: "Collect 3 speed boosts in one game" },
    obstaclemaster: { name: "Obstacle Master", description: "Clear all obstacles 3 times" },
    goldRush: { name: "Gold Rush", description: "Collect 5 golden apples in one game" }
};

const sounds = {
    eat: new Audio('https://example.com/eat.mp3'),
    powerUp: new Audio('https://example.com/powerup.mp3'),
    gameOver: new Audio('https://example.com/gameover.mp3')
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
    level = 1;
    scoreElement.textContent = score;
    levelElement.textContent = level;
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
    if (Math.random() < 0.1) { // 10% chance for special food
        specialFood = {
            ...getEmptyCell(),
            type: Math.random() < 0.5 ? 'golden' : 'shrink'
        };
    } else {
        specialFood = null;
    }
}

function generateObstacles() {
    obstacles = [];
    const obstacleCount = Math.min(3 + level, 10);
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
        (food.x === cell.x && food.y === cell.y) ||
        (specialFood && specialFood.x === cell.x && specialFood.y === cell.y)
    );
    return cell;
}

function gameStep() {
    moveSnake();
    if (checkCollision()) {
        endGame();
    } else {
        checkFoodCollision();
        checkSpecialFoodCollision();
        checkPowerUpCollision();
        checkLevelUp();
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
        playSound(sounds.eat);
    }
}

function checkSpecialFoodCollision() {
    if (specialFood) {
        const head = snake[0];
        if (head.x === specialFood.x && head.y === specialFood.y) {
            if (specialFood.type === 'golden') {
                score += specialFoods.golden.points;
            } else if (specialFood.type === 'shrink') {
                specialFoods.shrink.effect();
            }
            scoreElement.textContent = score;
            specialFood = null;
            playSound(sounds.powerUp);
        }
    }
}

function checkPowerUpCollision() {
    if (powerUp) {
        const head = snake[0];
        if (head.x === powerUp.x && head.y === powerUp.y) {
            activatePowerUp(powerUp.type);
            powerUp = null;
            playSound(sounds.powerUp);
        }
    }
}

function checkLevelUp() {
    if (score >= level * 10) {
        level++;
        levelElement.textContent = level;
        generateObstacles();
        clearInterval(gameLoop);
        const newSpeed = Math.max(50, gameSpeeds[difficultySelect.value] - level * 5);
        gameLoop = setInterval(gameStep, newSpeed);
        unlockAchievement('levelUp', { level: level });
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
    finalLevelElement.textContent = level;
    highScoreElement.textContent = highScore;
    gameOverScreen.style.display = 'flex';
    playSound(sounds.gameOver);
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

    // Draw special food
    if (specialFood) {
        ctx.fillStyle = specialFoods[specialFood.type].color;
        ctx.fillRect(specialFood.x * gridSize, specialFood.y * gridSize, gridSize - 1, gridSize - 1);
    }

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

function unlockAchievement(achievementKey, data = {}) {
    const achievement = achievements[achievementKey];
    let description = achievement.description;
    
    for (const [key, value] of Object.entries(data)) {
        description = description.replace(`{${key}}`, value);
    }
    
    achievementText.textContent = `${achievement.name}: ${description}`;
    achievementPopup.style.display = 'block';
    setTimeout(() => {
        achievementPopup.style.display = 'none';
    }, 3000);
}

function playSound(sound) {
    if (!isMuted) {
        sound.play();
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

muteButton.addEventListener('click', () => {
    isMuted = !isMuted;
    muteButton.textContent = isMuted ? 'Unmute Sound' : 'Mute Sound';
});

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