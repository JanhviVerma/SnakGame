const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const muteButton = document.getElementById('muteButton');
const pauseButton = document.getElementById('pauseButton');
const soundEffectsButton = document.getElementById('soundEffectsButton');
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
const tutorialOverlay = document.getElementById('tutorialOverlay');
const closeTutorialButton = document.getElementById('closeTutorial');

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
let isPaused = false;
let soundEffectsEnabled = true;
let speedBoostCount = 0;
let obstacleRemovalCount = 0;
let goldenAppleCount = 0;

const powerUps = {
    speedBoost: { color: 'yellow', duration: 5000, effect: () => { speedBoostCount++; } },
    pointMultiplier: { color: 'purple', duration: 10000, effect: () => {} },
    obstacleRemover: { color: 'orange', duration: 0, effect: () => { 
        obstacles = []; 
        obstacleRemovalCount++;
        if (obstacleRemovalCount === 3) {
            unlockAchievement('obstaclemaster');
        }
    }},
    invincibility: { color: 'gold', duration: 5000, effect: () => {} }
};

const specialFoods = {
    golden: { color: 'gold', points: 5, effect: () => { 
        goldenAppleCount++;
        if (goldenAppleCount === 5) {
            unlockAchievement('goldRush');
        }
    }},
    shrink: { color: 'blue', effect: () => { snake = snake.slice(0, Math.max(3, snake.length - 2)); } },
    rainbow: { color: 'rainbow', points: 3, effect: () => { changeSnakeColor(); } }
};

const achievements = {
    levelUp: { name: "Level Up!", description: "Reach level {level}" },
    speedDemon: { name: "Speed Demon", description: "Collect 3 speed boosts in one game" },
    obstaclemaster: { name: "Obstacle Master", description: "Clear all obstacles 3 times" },
    goldRush: { name: "Gold Rush", description: "Collect 5 golden apples in one game" },
    snakeCharmer: { name: "Snake Charmer", description: "Reach a length of 20" }
};

const sounds = {
    eat: new Audio('https://example.com/eat.mp3'),
    powerUp: new Audio('https://example.com/powerup.mp3'),
    gameOver: new Audio('https://example.com/gameover.mp3'),
    achievement: new Audio('https://example.com/achievement.mp3')
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
    speedBoostCount = 0;
    obstacleRemovalCount = 0;
    goldenAppleCount = 0;
    scoreElement.textContent = score;
    levelElement.textContent = level;
    powerUpElement.textContent = 'None';
    gameState = 'playing';
    if (gameLoop) clearInterval(gameLoop);
    const speed = gameSpeeds[difficultySelect.value];
    gameLoop = setInterval(gameStep, speed);
    startButton.disabled = true;
    pauseButton.disabled = false;
    gameOverScreen.style.display = 'none';
}

function generateFood() {
    food = getEmptyCell();
    if (Math.random() < 0.15) {
        specialFood = {
            ...getEmptyCell(),
            type: getRandomSpecialFoodType()
        };
    } else {
        specialFood = null;
    }
}

function getRandomSpecialFoodType() {
    const types = Object.keys(specialFoods);
    return types[Math.floor(Math.random() * types.length)];
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
    if (isPaused) return;
    
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

    if (snake.length >= 20) {
        unlockAchievement('snakeCharmer');
    }
}

function checkCollision() {
    const head = snake[0];
    if (currentPowerUp === 'invincibility') return false;
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
        if (Math.random() < 0.2) {
            spawnPowerUp();
        }
        if (soundEffectsEnabled) {
            playSound(sounds.eat);
        }
    }
}

function checkSpecialFoodCollision() {
    if (specialFood) {
        const head = snake[0];
        if (head.x === specialFood.x && head.y === specialFood.y) {
            if (specialFood.type === 'golden') {
                score += specialFoods.golden.points;
                specialFoods.golden.effect();
            } else if (specialFood.type === 'shrink') {
                specialFoods.shrink.effect();
            } else if (specialFood.type === 'rainbow') {
                score += specialFoods.rainbow.points;
                specialFoods.rainbow.effect();
            }
            scoreElement.textContent = score;
            specialFood = null;
            if (soundEffectsEnabled) {
                playSound(sounds.powerUp);
            }
        }
    }
}

function checkPowerUpCollision() {
    if (powerUp) {
        const head = snake[0];
        if (head.x === powerUp.x && head.y === powerUp.y) {
            activatePowerUp(powerUp.type);
            powerUp = null;
            if (soundEffectsEnabled) {
                playSound(sounds.powerUp);
            }
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

    if (type === 'speedBoost' && speedBoostCount === 3) {
        unlockAchievement('speedDemon');
    }
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
    if (soundEffectsEnabled) {
        playSound(sounds.gameOver);
    }
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
        if (specialFood.type === 'rainbow') {
            drawRainbowFood(specialFood.x, specialFood.y);
        } else {
            ctx.fillStyle = specialFoods[specialFood.type].color;
            ctx.fillRect(specialFood.x * gridSize, specialFood.y * gridSize, gridSize - 1, gridSize - 1);
        }
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

function drawRainbowFood(x, y) {
    const gradient = ctx.createRadialGradient(
        (x + 0.5) * gridSize, (y + 0.5) * gridSize, 0,
        (x + 0.5) * gridSize, (y + 0.5) * gridSize, gridSize / 2
    );
    gradient.addColorStop(0, "red");
    gradient.addColorStop(0.2, "orange");
    gradient.addColorStop(0.4, "yellow");
    gradient.addColorStop(0.6, "green");
    gradient.addColorStop(0.8, "blue");
    gradient.addColorStop(1, "purple");
    ctx.fillStyle = gradient;
    ctx.fillRect(x * gridSize, y * gridSize, gridSize - 1, gridSize - 1);
}

function changeSnakeColor() {
    const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
    snake.forEach((segment, index) => {
        segment.color = colors[index % colors.length];
    });
}

function unlockAchievement(achievementKey, data = {}) {
    const achievement = achievements[achievementKey];
    let description = achievement.description;
    
    for (const [key, value] of Object.entries(data)) {
        description = description.replace(`{${key}}`, value);
    }
    
    achievementText.textContent = `${achievement.name}: ${description}`;
    achievementPopup.style.display = 'block';
    if (soundEffectsEnabled) {
        playSound(sounds.achievement);
    }
    setTimeout(() => {
        achievementPopup.style.display = 'none';
    }, 3000);
}

function playSound(sound) {
    if (!isMuted) {
        sound.play();
    }
}

function togglePause() {
    isPaused = !isPaused;
    pauseButton.textContent = isPaused ? 'Resume' : 'Pause';
}

function toggleSoundEffects() {
    soundEffectsEnabled = !soundEffectsEnabled;
    soundEffectsButton.textContent = soundEffectsEnabled ? 'Disable Sound Effects' : 'Enable Sound Effects';
}

document.addEventListener('keydown', (e) => {
    if (gameState !== 'playing') return;
    
    switch (e.key) {
        case 'ArrowUp': if (dy === 0) { dx = 0; dy = -1; } break;
        case 'ArrowDown': if (dy === 0) { dx = 0; dy = 1; } break;
        case 'ArrowLeft': if (dx === 0) { dx = -1; dy = 0; } break;
        case 'ArrowRight': if (dx === 0) { dx = 1; dy = 0; } break;
        case ' ': togglePause(); break;
        case 'm': toggleSoundEffects(); break;
    }
});

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
pauseButton.addEventListener('click', togglePause);

muteButton.addEventListener('click', () => {
    isMuted = !isMuted;
    muteButton.textContent = isMuted ? 'Unmute Sound' : 'Mute Sound';
});

soundEffectsButton.addEventListener('click', toggleSoundEffects);

closeTutorialButton.addEventListener('click', () => {
    tutorialOverlay.style.display = 'none';
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

// Show tutorial on first visit
if (!localStorage.getItem('tutorialShown')) {
    tutorialOverlay.style.display = 'flex';
    localStorage.setItem('tutorialShown', 'true');
}

// Initial draw
initializeCanvas();
drawGame();