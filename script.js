// Configuración del juego para móviles
const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const finalScoreElement = document.getElementById('final-score');

// Elementos del menú
const startMenu = document.getElementById('start-menu');
const pauseMenu = document.getElementById('pause-menu');
const gameoverMenu = document.getElementById('gameover-menu');

// Botones
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resumeBtn = document.getElementById('resume-btn');
const restartBtn = document.getElementById('restart-btn');
const playAgainBtn = document.getElementById('play-again-btn');

// Controles táctiles
const upBtn = document.getElementById('up-btn');
const downBtn = document.getElementById('down-btn');
const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');

// Ajustar el tamaño del canvas al viewport
function resizeCanvas() {
    const size = Math.min(window.innerWidth, window.innerHeight - 200);
    canvas.width = size;
    canvas.height = size;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Tamaño de cada segmento de la serpiente (relativo al tamaño del canvas)
const boxSize = canvas.width / 20;

// Variables del juego
let snake = [];
let food = {};
let direction = 'right';
let nextDirection = 'right';
let gameInterval;
let score = 0;
let highScore = localStorage.getItem('mobileSnakeHighScore') || 0;
let gameSpeed = 150;
let gameRunning = false;
let gamePaused = false;

// Inicializar el juego
function initGame() {
    snake = [
        {x: 9 * boxSize, y: 10 * boxSize},
        {x: 8 * boxSize, y: 10 * boxSize},
        {x: 7 * boxSize, y: 10 * boxSize}
    ];
    
    generateFood();
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    scoreElement.textContent = score;
    highScoreElement.textContent = highScore;
    gameSpeed = 150;
}

// Generar comida en una posición aleatoria
function generateFood() {
    const maxPos = canvas.width / boxSize - 1;
    food = {
        x: Math.floor(Math.random() * maxPos) * boxSize,
        y: Math.floor(Math.random() * maxPos) * boxSize
    };
    
    // Asegurarse de que la comida no aparezca sobre la serpiente
    for (let segment of snake) {
        if (segment.x === food.x && segment.y === food.y) {
            return generateFood();
        }
    }
}

// Dibujar la serpiente
function drawSnake() {
    ctx.fillStyle = '#2ecc71';
    for (let i = 0; i < snake.length; i++) {
        ctx.fillRect(snake[i].x, snake[i].y, boxSize, boxSize);
        ctx.strokeStyle = '#27ae60';
        ctx.strokeRect(snake[i].x, snake[i].y, boxSize, boxSize);
        
        // Ojos en la cabeza
        if (i === 0) {
            const eyeSize = boxSize / 5;
            const eyeOffset = boxSize / 4;
            
            ctx.fillStyle = 'white';
            
            // Ojos según la dirección
            if (direction === 'right') {
                ctx.fillRect(snake[i].x + boxSize - eyeOffset, snake[i].y + eyeOffset, eyeSize, eyeSize);
                ctx.fillRect(snake[i].x + boxSize - eyeOffset, snake[i].y + boxSize - eyeOffset * 2, eyeSize, eyeSize);
            } else if (direction === 'left') {
                ctx.fillRect(snake[i].x + eyeOffset - eyeSize, snake[i].y + eyeOffset, eyeSize, eyeSize);
                ctx.fillRect(snake[i].x + eyeOffset - eyeSize, snake[i].y + boxSize - eyeOffset * 2, eyeSize, eyeSize);
            } else if (direction === 'up') {
                ctx.fillRect(snake[i].x + eyeOffset, snake[i].y + eyeOffset - eyeSize, eyeSize, eyeSize);
                ctx.fillRect(snake[i].x + boxSize - eyeOffset * 2, snake[i].y + eyeOffset - eyeSize, eyeSize, eyeSize);
            } else { // down
                ctx.fillRect(snake[i].x + eyeOffset, snake[i].y + boxSize - eyeOffset, eyeSize, eyeSize);
                ctx.fillRect(snake[i].x + boxSize - eyeOffset * 2, snake[i].y + boxSize - eyeOffset, eyeSize, eyeSize);
            }
            
            ctx.fillStyle = '#2ecc71';
        }
    }
}

// Dibujar la comida
function drawFood() {
    // Comida con efecto de gradiente
    const gradient = ctx.createRadialGradient(
        food.x + boxSize/2, food.y + boxSize/2, 0,
        food.x + boxSize/2, food.y + boxSize/2, boxSize/2
    );
    gradient.addColorStop(0, '#e74c3c');
    gradient.addColorStop(1, '#c0392b');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(food.x + boxSize/2, food.y + boxSize/2, boxSize/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Efecto de brillo
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(food.x + boxSize/3, food.y + boxSize/3, boxSize/6, 0, Math.PI * 2);
    ctx.fill();
}

// Mover la serpiente
function moveSnake() {
    const head = {x: snake[0].x, y: snake[0].y};
    
    // Actualizar dirección
    direction = nextDirection;
    
    // Mover la cabeza según la dirección
    switch (direction) {
        case 'up':
            head.y -= boxSize;
            break;
        case 'down':
            head.y += boxSize;
            break;
        case 'left':
            head.x -= boxSize;
            break;
        case 'right':
            head.x += boxSize;
            break;
    }
    
    // Agregar nueva cabeza
    snake.unshift(head);
    
    // Verificar si comió
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        
        // Actualizar récord
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('mobileSnakeHighScore', highScore);
        }
        
        generateFood();
        
        // Aumentar velocidad cada 50 puntos
        if (score % 50 === 0 && gameSpeed > 70) {
            gameSpeed -= 10;
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, gameSpeed);
        }
    } else {
        snake.pop();
    }
}

// Verificar colisiones
function checkCollision() {
    const head = snake[0];
    
    // Colisión con bordes
    if (head.x < 0 || head.y < 0 || head.x >= canvas.width || head.y >= canvas.height) {
        return true;
    }
    
    // Colisión consigo misma
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    
    return false;
}

// Bucle principal del juego
function gameLoop() {
    if (gamePaused) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    moveSnake();
    drawSnake();
    drawFood();
    
    if (checkCollision()) {
        gameOver();
    }
}

// Iniciar juego
function startGame() {
    initGame();
    gameRunning = true;
    gamePaused = false;
    startMenu.classList.add('hidden');
    pauseMenu.classList.add('hidden');
    gameoverMenu.classList.add('hidden');
    gameInterval = setInterval(gameLoop, gameSpeed);
}

// Pausar juego
function pauseGame() {
    gamePaused = true;
    pauseMenu.classList.remove('hidden');
}

// Continuar juego
function resumeGame() {
    gamePaused = false;
    pauseMenu.classList.add('hidden');
}

// Terminar juego
function gameOver() {
    clearInterval(gameInterval);
    gameRunning = false;
    finalScoreElement.textContent = score;
    gameoverMenu.classList.remove('hidden');
}

// Event listeners para controles táctiles
upBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (direction !== 'down') nextDirection = 'up';
});

downBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (direction !== 'up') nextDirection = 'down';
});

leftBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (direction !== 'right') nextDirection = 'left';
});

rightBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (direction !== 'left') nextDirection = 'right';
});

// También para clics (por si acaso)
upBtn.addEventListener('click', () => {
    if (direction !== 'down') nextDirection = 'up';
});

downBtn.addEventListener('click', () => {
    if (direction !== 'up') nextDirection = 'down';
});

leftBtn.addEventListener('click', () => {
    if (direction !== 'right') nextDirection = 'left';
});

rightBtn.addEventListener('click', () => {
    if (direction !== 'left') nextDirection = 'right';
});

// Controles de menú
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', pauseGame);
resumeBtn.addEventListener('click', resumeGame);
restartBtn.addEventListener('click', () => {
    pauseMenu.classList.add('hidden');
    startGame();
});
playAgainBtn.addEventListener('click', startGame);

// Swipe controls para dispositivos móviles
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    if (!gameRunning || gamePaused) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, {passive: false});

canvas.addEventListener('touchmove', (e) => {
    if (!gameRunning || gamePaused) return;
    e.preventDefault();
    
    const touchEndX = e.touches[0].clientX;
    const touchEndY = e.touches[0].clientY;
    
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;
    
    // Determinar la dirección del swipe
    if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && direction !== 'left') {
            nextDirection = 'right';
        } else if (dx < 0 && direction !== 'right') {
            nextDirection = 'left';
        }
    } else {
        if (dy > 0 && direction !== 'up') {
            nextDirection = 'down';
        } else if (dy < 0 && direction !== 'down') {
            nextDirection = 'up';
        }
    }
}, {passive: false});

// Prevenir el desplazamiento de la página en móviles
document.addEventListener('touchmove', (e) => {
    if (gameRunning && !gamePaused) {
        e.preventDefault();
    }
}, {passive: false});
