class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.startButton = document.getElementById('startButton');
        this.restartButton = document.getElementById('restartButton');
        this.muteButton = document.getElementById('muteButton');
        this.pauseButton = document.getElementById('pauseButton');
        this.soundEffectsButton = document.getElementById('soundEffectsButton');
        this.fullscreenButton = document.getElementById('fullscreenButton');
        this.scoreElement = document.getElementById('scoreValue');
        this.highScoreElement = document.getElementById('highScoreValue');
        this.levelElement = document.getElementById('levelValue');
        this.powerUpElement = document.getElementById('powerUpValue');
        this.finalScoreElement = document.getElementById('finalScore');
        this.finalHighScoreElement = document.getElementById('finalHighScore');
        this.unlockedAchievements = [];
        this.finalLevelElement = document.getElementById('finalLevel');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.difficultySelect = document.getElementById('difficultySelect');
        this.achievementPopup = document.getElementById('achievementPopup');
        this.achievementText = document.getElementById('achievementText');
        this.leaderboardModal = document.getElementById('leaderboardModal');
        this.leaderboardCloseButton = this.leaderboardModal.getElementsByClassName('close-button')[0];
        this.settingsModal = document.getElementById('settingsModal');
        this.settingsCloseButton = this.settingsModal.getElementsByClassName('close-button')[0];

        this.gridSize = 20;
        this.tileCount = 0;
        this.canvasSize = 0;

        this.snake = [];
        this.food = {};
        this.specialFood = null;
        this.obstacles = [];
        this.powerUp = null;
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.highScore = 0;
        this.level = 1;
        this.gameLoop = null;
        this.gameState = 'initial';
        this.gameSpeeds = {
            easy: 150,
            medium: 100,
            hard: 50
        };
        this.currentPowerUp = 'None';
        this.isMuted = false;
        this.isPaused = false;
        this.soundEffectsEnabled = true;
        this.speedBoostCount = 0;
        this.obstacleRemovalCount = 0;
        this.goldenAppleCount = 0;
        this.volume = 1;
        this.isMusicEnabled = true;
        this.isSoundEffectsEnabled = true;
        this.isDarkModeEnabled = false;

        this.powerUps = {
            speedBoost: { color: 'yellow', duration: 5000, effect: () => { this.speedBoostCount++; } },
            pointMultiplier: { color: 'purple', duration: 10000, effect: () => {} },
            obstacleRemover: { color: 'orange', duration: 0, effect: () => { 
                this.obstacles = []; 
                this.obstacleRemovalCount++;
                if (this.obstacleRemovalCount === 3) {
                    this.unlockAchievement('obstaclemaster');
                }
            }},
            invincibility: { color: 'gold', duration: 5000, effect: () => {} }
        };

        this.specialFoods = {
            golden: { color: 'gold', points: 5, effect: () => { 
                this.goldenAppleCount++;
                if (this.goldenAppleCount === 5) {
                    this.unlockAchievement('goldRush');
                }
            }},
            shrink: { color: 'blue', effect: () => { this.snake = this.snake.slice(0, Math.max(3, this.snake.length - 2)); } },
            rainbow: { color: 'rainbow', points: 3, effect: () => { this.changeSnakeColor(); } }
        };

        this.achievements = {
            levelUp: { name: "Level Up!", description: "Reach level {level}" },
            speedDemon: { name: "Speed Demon", description: "Collect 3 speed boosts in one game" },
            obstaclemaster: { name: "Obstacle Master", description: "Clear all obstacles 3 times" },
            goldRush: { name: "Gold Rush", description: "Collect 5 golden apples in one game" },
            snakeCharmer: { name: "Snake Charmer", description: "Reach a length of 20" }
        };

        this.sounds = {
            eat: new Audio('https://example.com/eat.mp3'),
            powerUp: new Audio('https://example.com/powerup.mp3'),
            gameOver: new Audio('https://example.com/gameover.mp3'),
            achievement: new Audio('https://example.com/achievement.mp3')
        };

        this.initializeCanvas();
        this.loadSettings();
        this.loadLeaderboard();
        this.addEventListeners();
    }

    initializeCanvas() {
        this.canvasSize = Math.min(400, window.innerWidth - 40);
        this.canvas.width = this.canvasSize;
        this.canvas.height = this.canvasSize;
        this.tileCount = this.canvasSize / this.gridSize;
    }

    startGame() {
        this.initializeCanvas();
        this.snake = [{x: Math.floor(this.tileCount / 2), y: Math.floor(this.tileCount / 2)}];
        this.generateFood();
        this.generateObstacles();
        this.dx = 1;
        this.dy = 0;
        this.score = 0;
        this.level = 1;
        this.speedBoostCount = 0;
        this.obstacleRemovalCount = 0;
        this.goldenAppleCount = 0;
        this.scoreElement.textContent = this.score;
        this.levelElement.textContent = this.level;
        this.powerUpElement.textContent = 'None';
        this.gameState = 'playing';
        if (this.gameLoop) clearInterval(this.gameLoop);
        const speed = this.gameSpeeds[this.difficultySelect.value];
        this.gameLoop = setInterval(() => this.gameStep(), speed);
        this.startButton.disabled = true;
        this.pauseButton.disabled = false;
        this.gameOverScreen.style.display = 'none';
    }

    generateFood() {
        this.food = this.getEmptyCell();
        if (Math.random() < 0.15) {
            this.specialFood = {
                ...this.getEmptyCell(),
                type: this.getRandomSpecialFoodType()
            };
        } else {
            this.specialFood = null;
        }
    }

    getRandomSpecialFoodType() {
        const types = Object.keys(this.specialFoods);
        return types[Math.floor(Math.random() * types.length)];
    }

    generateObstacles() {
        this.obstacles = [];
        const obstacleCount = Math.min(3 + this.level, 10);
        for (let i = 0; i < obstacleCount; i++) {
            this.obstacles.push(this.getEmptyCell());
        }
    }

    getEmptyCell() {
        let cell;
        do {
            cell = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (
            this.snake.some(segment => segment.x === cell.x && segment.y === cell.y) ||
            this.obstacles.some(obstacle => obstacle.x === cell.x && obstacle.y === cell.y) ||
            (this.food.x === cell.x && this.food.y === cell.y) ||
            (this.specialFood && this.specialFood.x === cell.x && this.specialFood.y === cell.y)
        );
        return cell;
    }

    gameStep() {
        if (this.isPaused) return;
        
        this.moveSnake();
        if (this.checkCollision()) {
            this.endGame();
        } else {
            this.checkFoodCollision();
            this.checkSpecialFoodCollision();
            this.checkPowerUpCollision();
            this.checkLevelUp();
            this.drawGame();
        }
    }

    moveSnake() {
        const head = {x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy};
        this.snake.unshift(head);

        if (head.x !== this.food.x || head.y !== this.food.y) {
            this.snake.pop();
        }

        if (this.snake.length >= 20) {
            this.unlockAchievement('snakeCharmer');
        }
    }

    checkCollision() {
        const head = this.snake[0];
        if (this.currentPowerUp === 'invincibility') return false;
        return (
            head.x < 0 || head.x >= this.tileCount ||
            head.y < 0 || head.y >= this.tileCount ||
            this.snake.slice(1).some(segment => segment.x === head.x && segment.y === head.y) ||
            this.obstacles.some(obstacle => obstacle.x === head.x && obstacle.y === head.y)
        );
    }

    checkFoodCollision() {
        const head = this.snake[0];
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score++;
            this.scoreElement.textContent = this.score;
            this.generateFood();
            if (Math.random() < 0.2) {
                this.spawnPowerUp();
            }
            if (this.isSoundEffectsEnabled) {
                this.playSound(this.sounds.eat);
            }
        }
    }

    checkSpecialFoodCollision() {
        if (this.specialFood) {
            const head = this.snake[0];
            if (head.x === this.specialFood.x && head.y === this.specialFood.y) {
                if (this.specialFood.type === 'golden') {
                    this.score += this.specialFoods.golden.points;
                    this.specialFoods.golden.effect();
                } else if (this.specialFood.type === 'shrink') {
                    this.specialFoods.shrink.effect();
                } else if (this.specialFood.type === 'rainbow') {
                    this.score += this.specialFoods.rainbow.points
                    this.specialFoods.rainbow.effect();
                }
                this.scoreElement.textContent = this.score;
                this.specialFood = null;
                if (this.isSoundEffectsEnabled) {
                    this.playSound(this.sounds.powerUp);
                }
            }
        }
    }

    checkPowerUpCollision() {
        if (this.powerUp) {
            const head = this.snake[0];
            if (head.x === this.powerUp.x && head.y === this.powerUp.y) {
                this.activatePowerUp(this.powerUp.type);
                this.powerUp = null;
                if (this.isSoundEffectsEnabled) {
                    this.playSound(this.sounds.powerUp);
                }
            }
        }
    }

    checkLevelUp() {
        if (this.score >= this.level * 10) {
            this.level++;
            this.levelElement.textContent = this.level;
            this.generateObstacles();
            clearInterval(this.gameLoop);
            const newSpeed = Math.max(50, this.gameSpeeds[this.difficultySelect.value] - this.level * 5);
            this.gameLoop = setInterval(() => this.gameStep(), newSpeed);
            this.unlockAchievement('levelUp', { level: this.level });
        }
    }

    spawnPowerUp() {
        const types = Object.keys(this.powerUps);
        const type = types[Math.floor(Math.random() * types.length)];
        this.powerUp = { ...this.getEmptyCell(), type };
    }

    activatePowerUp(type) {
        this.currentPowerUp = type;
        this.powerUpElement.textContent = type;
        this.powerUps[type].effect();
        setTimeout(() => {
            this.currentPowerUp = 'None';
            this.powerUpElement.textContent = 'None';
        }, this.powerUps[type].duration);

        if (type === 'speedBoost' && this.speedBoostCount === 3) {
            this.unlockAchievement('speedDemon');
        }
    }

    endGame() {
        clearInterval(this.gameLoop);
        this.gameState = 'gameover';
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore);
        }
        this.finalScoreElement.textContent = this.score;
        this.finalHighScoreElement.textContent = this.highScore;
        this.finalLevelElement.textContent = this.level;
        this.highScoreElement.textContent = this.highScore;
        this.gameOverScreen.style.display = 'flex';
        if (this.isSoundEffectsEnabled) {
            this.playSound(this.sounds.gameOver);
        }
    }

    drawGame() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw snake
        this.snake.forEach((segment, index) => {
            this.ctx.fillStyle = index === 0 ? 'darkgreen' : 'green';
            this.ctx.fillRect(segment.x * this.gridSize, segment.y * this.gridSize, this.gridSize - 1, this.gridSize - 1);
        });

        // Draw food
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(this.food.x * this.gridSize, this.food.y * this.gridSize, this.gridSize - 1, this.gridSize - 1);

        // Draw special food
        if (this.specialFood) {
            if (this.specialFood.type === 'rainbow') {
                this.drawRainbowFood(this.specialFood.x, this.specialFood.y);
            } else {
                this.ctx.fillStyle = this.specialFoods[this.specialFood.type].color;
                this.ctx.fillRect(this.specialFood.x * this.gridSize, this.specialFood.y * this.gridSize, this.gridSize - 1, this.gridSize - 1);
            }
        }

        // Draw obstacles
        this.ctx.fillStyle = 'gray';
        this.obstacles.forEach(obstacle => {
            this.ctx.fillRect(obstacle.x * this.gridSize, obstacle.y * this.gridSize, this.gridSize - 1, this.gridSize - 1);
        });

        // Draw power-up
        if (this.powerUp) {
            this.ctx.fillStyle = this.powerUps[this.powerUp.type].color;
            this.ctx.fillRect(this.powerUp.x * this.gridSize, this.powerUp.y * this.gridSize, this.gridSize - 1, this.gridSize - 1);
        }
    }

   drawRainbowFood(x, y) {
    const gradient = this.ctx.createRadialGradient(
        (x + 0.5) * this.gridSize, (y + 0.5) * this.gridSize, 0,
        (x + 0.5) * this.gridSize, (y + 0.5) * this.gridSize, this.gridSize / 2
    );
    gradient.addColorStop(0, "red");
    gradient.addColorStop(0.2, "orange");
    gradient.addColorStop(0.4, "yellow");
    gradient.addColorStop(0.6, "green");
    gradient.addColorStop(0.8, "blue");
    gradient.addColorStop(1, "purple");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(x * this.gridSize, y * this.gridSize, this.gridSize - 1, this.gridSize - 1);
    }

    changeSnakeColor() {
        const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];
        this.snake.forEach((segment, index) => {
            segment.color = colors[index % colors.length];
        });
    }

    unlockAchievement(achievementKey, data = {}) {
        const achievement = this.achievements[achievementKey];
        let description = achievement.description;
        
        for (const [key, value] of Object.entries(data)) {
            description = description.replace(`{${key}}`, value);
        }
        
        this.achievementText.textContent = `${achievement.name}: ${description}`;
        this.achievementPopup.style.display = 'block';
        if (this.isSoundEffectsEnabled) {
            this.playSound(this.sounds.achievement);
        }
        setTimeout(() => {
            this.achievementPopup.style.display = 'none';
        }, 3000);
    }

    playSound(sound) {
        if (!this.isMuted && this.isSoundEffectsEnabled) {
            sound.play();
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        this.pauseButton.textContent = this.isPaused ? 'Resume' : 'Pause';
    }

    toggleSoundEffects() {
        this.isSoundEffectsEnabled = !this.isSoundEffectsEnabled;
        this.soundEffectsButton.textContent = this.isSoundEffectsEnabled ? 'Disable Sound Effects' : 'Enable Sound Effects';
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.canvas.requestFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    loadSettings() {
        this.volume = parseFloat(localStorage.getItem('volume')) || 1;
        this.isMusicEnabled = localStorage.getItem('isMusicEnabled') !== 'false';
        this.isSoundEffectsEnabled = localStorage.getItem('isSoundEffectsEnabled') !== 'false';
        this.isDarkModeEnabled = localStorage.getItem('isDarkModeEnabled') === 'true';

        const volumeSlider = document.getElementById('volumeSlider');
        const musicToggle = document.getElementById('music');
        const soundEffectsToggle = document.getElementById('soundEffects');
        const darkModeToggle = document.getElementById('darkMode');

        volumeSlider.value = this.volume;
        musicToggle.checked = this.isMusicEnabled;
        soundEffectsToggle.checked = this.isSoundEffectsEnabled;
        darkModeToggle.checked = this.isDarkModeEnabled;
        this.updateDarkMode();
    }

    saveSettings() {
        localStorage.setItem('volume', this.volume);
        localStorage.setItem('isMusicEnabled', this.isMusicEnabled);
        localStorage.setItem('isSoundEffectsEnabled', this.isSoundEffectsEnabled);
        localStorage.setItem('isDarkModeEnabled', this.isDarkModeEnabled);
    }

    updateDarkMode() {
        document.body.classList.toggle('dark-mode', this.isDarkModeEnabled);
    }

    loadLeaderboard() {
        this.leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
        this.updateLeaderboardDisplay();
    }

    updateLeaderboardDisplay() {
        const leaderboardList = document.getElementById('leaderboardList');
        leaderboardList.innerHTML = '';

        this.leaderboard.sort((a, b) => b.score - a.score).slice(0, 10).forEach((entry, index) => {
            const li = document.createElement('li');
            li.textContent = `${index + 1}. ${entry.name} - ${entry.score}`;
            leaderboardList.appendChild(li);
        });
    }

    updateLeaderboard(name, score) {
        const existingEntry = this.leaderboard.find(entry => entry.name === name);
        if (existingEntry) {
            if (score > existingEntry.score) {
                existingEntry.score = score;
            }
        } else {
            this.leaderboard.push({ name, score });
        }

        this.leaderboard.sort((a, b) => b.score - a.score);
        localStorage.setItem('leaderboard', JSON.stringify(this.leaderboard));
        this.updateLeaderboardDisplay();
    }

    addEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (this.gameState !== 'playing') return;
            
            switch (e.key) {
                case 'ArrowUp': if (this.dy === 0) { this.dx = 0; this.dy = -1; } break;
                case 'ArrowDown': if (this.dy === 0) { this.dx = 0; this.dy = 1; } break;
                case 'ArrowLeft': if (this.dx === 0) { this.dx = -1; this.dy = 0; } break;
                case 'ArrowRight': if (this.dx === 0) { this.dx = 1; this.dy = 0; } break;
                case ' ': this.togglePause(); break;
                case 'm': this.toggleSoundEffects(); break;
                case 'f': this.toggleFullscreen(); break;
            }
        });

        this.startButton.addEventListener('click', () => this.startGame());
        this.restartButton.addEventListener('click', () => this.startGame());
        this.pauseButton.addEventListener('click', () => this.togglePause());

        this.muteButton.addEventListener('click', () => {
            this.isMuted = !this.isMuted;
            this.muteButton.textContent = this.isMuted ? 'Unmute Sound' : 'Mute Sound';
        });

        this.soundEffectsButton.addEventListener('click', () => this.toggleSoundEffects());

        this.fullscreenButton.addEventListener('click', () => this.toggleFullscreen());

        this.leaderboardButton.addEventListener('click', () => {
            this.leaderboardModal.style.display = 'block';
        });

        this.leaderboardCloseButton.addEventListener('click', () => {
            this.leaderboardModal.style.display = 'none';
        });

        this.settingsButton.addEventListener('click', () => {
            this.settingsModal.style.display = 'block';
        });

        this.settingsCloseButton.addEventListener('click', () => {
            this.settingsModal.style.display = 'none';
        });

        window.addEventListener('click', (event) => {
            if (event.target == this.leaderboardModal) {
                this.leaderboardModal.style.display = 'none';
            }
            if (event.target == this.settingsModal) {
                this.settingsModal.style.display = 'none';
            }
        });

        window.addEventListener('resize', () => {
            if (this.gameState === 'playing') {
                clearInterval(this.gameLoop);
                this.startGame();
            } else {
                this.initializeCanvas();
                this.drawGame();
            }
        });
    }

    shareScore(){
        const shareContainer = document.getElementById('shareContainer');
        shareContainer.style.display = 'flex';

        const shareTwitterButton = document.getElementById('shareTwitterButton');
        const shareFacebookButton = document.getElementById('shareFacebookButton');
        const shareCopyLinkButton = document.getElementById('shareCopyLinkButton');

        shareTwitterButton.addEventListener('click', () => {
            const tweetText = `I scored ${this.score} points in the Advanced Snake Game! Can you beat my high score?`;
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`);
            shareContainer.style.display = 'none';
        });

        shareFacebookButton.addEventListener('click', () => {
            const shareLink = `https://www.example.com/snake-game?score=${this.score}`;
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`);
            shareContainer.style.display = 'none';
        });

        shareCopyLinkButton.addEventListener('click', () => {
            const shareLink = `https://www.example.com/snake-game?score=${this.score}`;
            navigator.clipboard.writeText(shareLink);
            alert('Link copied to clipboard!');
            shareContainer.style.display = 'none';
        });

        document.addEventListener('click', (event) => {
            if (event.target == shareContainer) {
                shareContainer.style.display = 'none';
            }
        });
    }

    showAchievements() {
        const achievementsModal = document.getElementById('achievementsModal');
        achievementsModal.style.display = 'block';

        const achievementList = document.querySelector('.achievement-list');
        achievementList.innerHTML = '';

        for (const [key, achievement] of Object.entries(this.achievements)) {
            const achievementCard = document.createElement('div');
            achievementCard.classList.add('achievement-card');

            if (this.unlockedAchievements.includes(key)) {
                achievementCard.classList.add('unlocked');
            }

            const title = document.createElement('h3');
            title.textContent = achievement.name;

            const description = document.createElement('p');
            description.textContent = achievement.description;

            achievementCard.appendChild(title);
            achievementCard.appendChild(description);
            achievementList.appendChild(achievementCard);
        }

        const closeButton = achievementsModal.getElementsByClassName('close-button')[0];
        closeButton.addEventListener('click', () => {
            achievementsModal.style.display = 'none';
        });

        window.addEventListener('click', (event) => {
            if (event.target == achievementsModal) {
                achievementsModal.style.display = 'none';
            }
        });
    }

    unlockAchievement(achievementKey, data = {}) {
        if (!this.unlockedAchievements.includes(achievementKey)) {
            this.unlockedAchievements.push(achievementKey);
            super.unlockAchievement(achievementKey, data);
        }
    }

    shareScore(){
        const shareContainer = document.getElementById('shareContainer');
        shareContainer.style.display = 'flex';

        const shareTwitterButton = document.getElementById('shareTwitterButton');
        const shareFacebookButton = document.getElementById('shareFacebookButton');
        const shareCopyLinkButton = document.getElementById('shareCopyLinkButton');

        shareTwitterButton.addEventListener('click', () => {
            const tweetText = `I scored ${this.score} points in the Advanced Snake Game! Can you beat my high score?`;
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`);
            shareContainer.style.display = 'none';
        });

        shareFacebookButton.addEventListener('click', () => {
            const shareLink = `https://www.example.com/snake-game?score=${this.score}`;
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`);
            shareContainer.style.display = 'none';
        });

        shareCopyLinkButton.addEventListener('click', () => {
            const shareLink = `https://www.example.com/snake-game?score=${this.score}`;
            navigator.clipboard.writeText(shareLink);
            alert('Link copied to clipboard!');
            shareContainer.style.display = 'none';
        });

        document.addEventListener('click', (event) => {
            if (event.target == shareContainer) {
                shareContainer.style.display = 'none';
            }
        });
    }

    addEventListeners() {
        // ... (previous code)

        const shareButton = document.getElementById('shareButton');
        shareButton.addEventListener('click', () => this.shareScore());
    }
}

const game = new SnakeGame();

/* All the previous JavaScript code from version 11 */

// Additional JavaScript for v12
