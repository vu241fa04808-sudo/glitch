const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('game-container');
const levelText = document.getElementById('level-indicator');
const overlay = document.getElementById('message-overlay');
const messageText = document.getElementById('message-text');

// Game State
let currentLevelIndex = 0;
let gravity = 0.6;
let isGravityFlipped = false;
let gameActive = false;
let gamePaused = false;
let scaleX = 1;
let scaleY = 1;

// ── DIFFICULTY SYSTEM ──────────────────────────────────────────────
let difficultyMultiplier = 1;     // scales gravity; increases with level
let flipsLeft = Infinity;         // allowed gravity flips per level
let movingBlocks = [];            // dynamic moving obstacles
let gameTime = 0;                 // frame counter used for block animation
const flipCounterDisplay = document.getElementById('flip-counter-display') || null;
// ───────────────────────────────────────────────────────────────────

// Timer State
let timeLeft = 0;
let timerInterval = null;
let levelDuration = 0;

// Level Selection State
let unlockedLevels = parseInt(localStorage.getItem('flip_unlockedLevels')) || 1;
let coins = parseInt(localStorage.getItem('flip_coins')) || 0;

function saveProgress() {
    localStorage.setItem('flip_unlockedLevels', unlockedLevels);
    localStorage.setItem('flip_coins', coins);
}

// DOM Elements
const gameSettingsBtn = document.getElementById('game-settings-btn');
const gameSettingsModal = document.getElementById('game-settings-modal');
const pauseBtn = document.getElementById('pause-btn');
const resumeBtn = document.getElementById('resume-btn');
const exitBtn = document.getElementById('exit-btn');
// Grid rendering and Level selection screen functions
const closeGameSettings = document.getElementById('close-game-settings');
const mobileControlsToggle = document.getElementById('mobile-controls-toggle');
const mobileLeftBtn = document.getElementById('mobile-left-btn');
const mobileRightBtn = document.getElementById('mobile-right-btn');
const mobileUpBtn = document.getElementById('mobile-up-btn');
const mobileDownBtn = document.getElementById('mobile-down-btn');
const movableControlsToggle = document.getElementById('movable-controls-toggle');

// Timer DOM
const timerValue = document.getElementById('timer-value');
const scoreValue = document.getElementById('score-value');
const messageHeader = document.getElementById('message-header');
const buyTimeBtn = document.getElementById('buy-time-btn');
const coinBalanceHint = document.getElementById('coin-balance-hint');

const player = {
    x: 50,
    y: 50,
    width: 24,
    height: 24,
    vx: 0,
    vy: 0,
    speed: 5,
    onGround: false,
    color: '#00ff88' // Primary color
};

const keys = {};
let leftPressed = false;
let rightPressed = false;

// Level Definitions
// Type: 0 = platform, 1 = spike, 2 = goal
const levels = [
    {
        difficulty: 1,
        spawn: { x: 50, y: 350 },
        objects: [
            { x: 0, y: 480, w: 800, h: 20, type: 0 },
            { x: 0, y: 0, w: 800, h: 20, type: 0 },
            { x: 111, y: 129, w: 250, h: 20, type: 0 },
            { x: 290, y: 301, w: 250, h: 20, type: 0 },
            { x: 482, y: 363, w: 250, h: 20, type: 0 },
            { x: 740, y: 293, w: 40, h: 50, type: 2 }
        ]
    },
    {
        difficulty: 1,
        spawn: { x: 50, y: 100 },
        objects: [
            { x: 0, y: 480, w: 800, h: 20, type: 0 },
            { x: 0, y: 0, w: 800, h: 20, type: 0 },
            { x: 83, y: 181, w: 243, h: 20, type: 0 },
            { x: 306, y: 122, w: 243, h: 20, type: 0 },
            { x: 515, y: 390, w: 243, h: 20, type: 0 },
            { x: 350, y: 460, w: 60, h: 20, type: 1 },
            { x: 740, y: 105, w: 40, h: 50, type: 2 }
        ]
    },
    {
        difficulty: 1,
        spawn: { x: 50, y: 350 },
        objects: [
            { x: 0, y: 480, w: 800, h: 20, type: 0 },
            { x: 0, y: 0, w: 800, h: 20, type: 0 },
            { x: 90, y: 301, w: 237, h: 20, type: 0 },
            { x: 282, y: 363, w: 237, h: 20, type: 0 },
            { x: 518, y: 107, w: 237, h: 20, type: 0 },
            { x: 200, y: 20, w: 55, h: 20, type: 1 },
            { x: 500, y: 460, w: 55, h: 20, type: 1 },
            { x: 740, y: 125, w: 40, h: 50, type: 2 }
        ]
    },
    {
        difficulty: 2,
        spawn: { x: 50, y: 100 },
        objects: [
            { x: 0, y: 480, w: 800, h: 20, type: 0 },
            { x: 0, y: 0, w: 800, h: 20, type: 0 },
            { x: 106, y: 122, w: 231, h: 20, type: 0 },
            { x: 315, y: 390, w: 231, h: 20, type: 0 },
            { x: 481, y: 138, w: 231, h: 20, type: 0 },
            { x: 250, y: 460, w: 60, h: 20, type: 1 },
            { x: 550, y: 20, w: 60, h: 20, type: 1 },
            { x: 740, y: 254, w: 40, h: 50, type: 2 }
        ]
    },
    {
        difficulty: 2,
        spawn: { x: 50, y: 350 },
        objects: [
            { x: 0, y: 480, w: 800, h: 20, type: 0 },
            { x: 0, y: 0, w: 800, h: 20, type: 0 },
            { x: 82, y: 363, w: 225, h: 20, type: 0 },
            { x: 318, y: 107, w: 225, h: 20, type: 0 },
            { x: 485, y: 331, w: 225, h: 20, type: 0 },
            { x: 180, y: 20, w: 55, h: 20, type: 1 },
            { x: 400, y: 460, w: 55, h: 20, type: 1 },
            { x: 600, y: 20, w: 55, h: 20, type: 1 },
            { x: 740, y: 190, w: 40, h: 50, type: 2 }
        ]
    },
    {
        difficulty: 2,
        spawn: { x: 50, y: 100 },
        objects: [
            { x: 0, y: 480, w: 800, h: 20, type: 0 },
            { x: 0, y: 0, w: 800, h: 20, type: 0 },
            { x: 115, y: 390, w: 218, h: 20, type: 0 },
            { x: 281, y: 138, w: 218, h: 20, type: 0 },
            { x: 510, y: 235, w: 218, h: 20, type: 0 },
            { x: 200, y: 460, w: 55, h: 20, type: 1 },
            { x: 422, y: 20, w: 50, h: 20, type: 1 },
            { x: 580, y: 460, w: 55, h: 20, type: 1 },
            { x: 740, y: 259, w: 40, h: 50, type: 2 }
        ]
    },
    {
        difficulty: 2,
        spawn: { x: 50, y: 350 },
        objects: [
            { x: 0, y: 480, w: 800, h: 20, type: 0 },
            { x: 0, y: 0, w: 800, h: 20, type: 0 },
            { x: 118, y: 107, w: 212, h: 20, type: 0 },
            { x: 235, y: 331, w: 212, h: 20, type: 0 },
            { x: 398, y: 266, w: 212, h: 20, type: 0 },
            { x: 549, y: 338, w: 212, h: 20, type: 0 },
            { x: 180, y: 460, w: 50, h: 20, type: 1 },
            { x: 286, y: 20, w: 52, h: 20, type: 1 },
            { x: 450, y: 460, w: 50, h: 20, type: 1 },
            { x: 600, y: 20, w: 50, h: 20, type: 1 },
            { x: 740, y: 216, w: 40, h: 50, type: 2 }
        ]
    },
    {
        difficulty: 2,
        spawn: { x: 50, y: 100 },
        objects: [
            { x: 0, y: 480, w: 800, h: 20, type: 0 },
            { x: 0, y: 0, w: 800, h: 20, type: 0 },
            { x: 81, y: 138, w: 206, h: 20, type: 0 },
            { x: 260, y: 235, w: 206, h: 20, type: 0 },
            { x: 402, y: 246, w: 206, h: 20, type: 0 },
            { x: 561, y: 164, w: 206, h: 20, type: 0 },
            { x: 200, y: 20, w: 50, h: 20, type: 1 },
            { x: 392, y: 460, w: 54, h: 20, type: 1 },
            { x: 520, y: 20, w: 50, h: 20, type: 1 },
            { x: 650, y: 460, w: 50, h: 20, type: 1 },
            { x: 740, y: 251, w: 40, h: 50, type: 2 }
        ]
    },
    {
        difficulty: 3,
        spawn: { x: 50, y: 350 },
        objects: [
            { x: 0, y: 480, w: 800, h: 20, type: 0 },
            { x: 0, y: 0, w: 800, h: 20, type: 0 },
            { x: 85, y: 331, w: 200, h: 20, type: 0 },
            { x: 248, y: 266, w: 200, h: 20, type: 0 },
            { x: 399, y: 338, w: 200, h: 20, type: 0 },
            { x: 538, y: 244, w: 200, h: 20, type: 0 },
            { x: 150, y: 20, w: 50, h: 20, type: 1 },
            { x: 300, y: 460, w: 50, h: 20, type: 1 },
            { x: 433, y: 460, w: 56, h: 20, type: 1 },
            { x: 600, y: 20, w: 50, h: 20, type: 1 },
            { x: 740, y: 111, w: 40, h: 50, type: 2 }
        ]
    },
    {
        difficulty: 3,
        spawn: { x: 50, y: 100 },
        objects: [
            { x: 0, y: 480, w: 800, h: 20, type: 0 },
            { x: 0, y: 0, w: 800, h: 20, type: 0 },
            { x: 110, y: 235, w: 194, h: 20, type: 0 },
            { x: 252, y: 246, w: 194, h: 20, type: 0 },
            { x: 411, y: 164, w: 194, h: 20, type: 0 },
            { x: 549, y: 275, w: 194, h: 20, type: 0 },
            { x: 200, y: 460, w: 55, h: 20, type: 1 },
            { x: 350, y: 20, w: 55, h: 20, type: 1 },
            { x: 503, y: 20, w: 58, h: 20, type: 1 },
            { x: 650, y: 460, w: 55, h: 20, type: 1 },
            { x: 740, y: 232, w: 40, h: 50, type: 2 }
        ]
    },
    {
        difficulty: 3,
        spawn: { x: 50, y: 350 },
        objects: [
            { x: 0, y: 480, w: 800, h: 20, type: 0 },
            { x: 0, y: 0, w: 800, h: 20, type: 0 },
            { x: 98, y: 266, w: 187, h: 20, type: 0 },
            { x: 249, y: 338, w: 187, h: 20, type: 0 },
            { x: 388, y: 244, w: 187, h: 20, type: 0 },
            { x: 553, y: 327, w: 187, h: 20, type: 0 },
            { x: 150, y: 20, w: 55, h: 20, type: 1 },
            { x: 223, y: 460, w: 60, h: 20, type: 1 },
            { x: 350, y: 20, w: 55, h: 20, type: 1 },
            { x: 473, y: 460, w: 60, h: 20, type: 1 },
            { x: 620, y: 20, w: 55, h: 20, type: 1 },
            { x: 740, y: 153, w: 40, h: 50, type: 2 }
        ]
    },
    {
        difficulty: 3,
        spawn: { x: 50, y: 100 },
        objects: [
            { x: 0, y: 480, w: 800, h: 20, type: 0 },
            { x: 0, y: 0, w: 800, h: 20, type: 0 },
            { x: 102, y: 246, w: 181, h: 20, type: 0 },
            { x: 261, y: 164, w: 181, h: 20, type: 0 },
            { x: 399, y: 275, w: 181, h: 20, type: 0 },
            { x: 560, y: 117, w: 181, h: 20, type: 0 },
            { x: 180, y: 20, w: 55, h: 20, type: 1 },
            { x: 320, y: 460, w: 55, h: 20, type: 1 },
            { x: 464, y: 460, w: 62, h: 20, type: 1 },
            { x: 449, y: 20, w: 62, h: 20, type: 1 },
            { x: 620, y: 460, w: 55, h: 20, type: 1 },
            { x: 740, y: 123, w: 40, h: 50, type: 2 }
        ]
    },
    {
        difficulty: 4,
        spawn: { x: 50, y: 350 },
        objects: [
            { x: 0, y: 480, w: 800, h: 20, type: 0 },
            { x: 0, y: 0, w: 800, h: 20, type: 0 },
            { x: 99, y: 338, w: 175, h: 20, type: 0 },
            { x: 208, y: 244, w: 175, h: 20, type: 0 },
            { x: 343, y: 327, w: 175, h: 20, type: 0 },
            { x: 442, y: 298, w: 175, h: 20, type: 0 },
            { x: 587, y: 287, w: 175, h: 20, type: 0 },
            { x: 306, y: 20, w: 64, h: 20, type: 1 },
            { x: 530, y: 20, w: 64, h: 20, type: 1 },
            { x: 740, y: 142, w: 40, h: 50, type: 2 }
        ]
    },
    {
        difficulty: 4,
        spawn: { x: 50, y: 100 },
        objects: [
            { x: 0, y: 480, w: 800, h: 20, type: 0 },
            { x: 0, y: 0, w: 800, h: 20, type: 0 },
            { x: 111, y: 164, w: 169, h: 20, type: 0 },
            { x: 219, y: 275, w: 169, h: 20, type: 0 },
            { x: 350, y: 117, w: 169, h: 20, type: 0 },
            { x: 466, y: 305, w: 169, h: 20, type: 0 },
            { x: 584, y: 180, w: 169, h: 20, type: 0 },
            { x: 247, y: 460, w: 66, h: 20, type: 1 },
            { x: 269, y: 20, w: 66, h: 20, type: 1 },
            { x: 740, y: 223, w: 40, h: 50, type: 2 }
        ]
    },
    {
        difficulty: 4,
        spawn: { x: 50, y: 350 },
        objects: [
            { x: 0, y: 480, w: 800, h: 20, type: 0 },
            { x: 0, y: 0, w: 800, h: 20, type: 0 },
            { x: 88, y: 244, w: 163, h: 20, type: 0 },
            { x: 223, y: 327, w: 163, h: 20, type: 0 },
            { x: 322, y: 298, w: 163, h: 20, type: 0 },
            { x: 467, y: 287, w: 163, h: 20, type: 0 },
            { x: 570, y: 135, w: 163, h: 20, type: 0 },
            { x: 530, y: 20, w: 68, h: 20, type: 1 },
            { x: 284, y: 460, w: 68, h: 20, type: 1 },
            { x: 740, y: 237, w: 40, h: 50, type: 2 }
        ]
    },
    {
        difficulty: 4,
        spawn: { x: 50, y: 100 },
        objects: [
            { x: 0, y: 480, w: 800, h: 20, type: 0 },
            { x: 0, y: 0, w: 800, h: 20, type: 0 },
            { x: 99, y: 275, w: 156, h: 20, type: 0 },
            { x: 230, y: 117, w: 156, h: 20, type: 0 },
            { x: 346, y: 305, w: 156, h: 20, type: 0 },
            { x: 464, y: 180, w: 156, h: 20, type: 0 },
            { x: 564, y: 348, w: 156, h: 20, type: 0 },
            { x: 269, y: 20, w: 71, h: 20, type: 1 },
            { x: 447, y: 460, w: 71, h: 20, type: 1 },
            { x: 581, y: 20, w: 71, h: 20, type: 1 },
            { x: 740, y: 254, w: 40, h: 50, type: 2 }
        ]
    },
    {
        difficulty: 4,
        spawn: { x: 50, y: 350 },
        objects: [
            { x: 0, y: 480, w: 800, h: 20, type: 0 },
            { x: 0, y: 0, w: 800, h: 20, type: 0 },
            { x: 103, y: 327, w: 150, h: 20, type: 0 },
            { x: 202, y: 298, w: 150, h: 20, type: 0 },
            { x: 347, y: 287, w: 150, h: 20, type: 0 },
            { x: 450, y: 135, w: 150, h: 20, type: 0 },
            { x: 593, y: 151, w: 150, h: 20, type: 0 },
            { x: 284, y: 460, w: 73, h: 20, type: 1 },
            { x: 474, y: 460, w: 73, h: 20, type: 1 },
            { x: 252, y: 460, w: 73, h: 20, type: 1 },
            { x: 740, y: 256, w: 40, h: 50, type: 2 }
        ]
    },
    {
        difficulty: 4,
        spawn: { x: 50, y: 100 },
        objects: [
            { x: 0, y: 480, w: 800, h: 20, type: 0 },
            { x: 0, y: 0, w: 800, h: 20, type: 0 },
            { x: 110, y: 117, w: 144, h: 20, type: 0 },
            { x: 226, y: 305, w: 144, h: 20, type: 0 },
            { x: 344, y: 180, w: 144, h: 20, type: 0 },
            { x: 444, y: 348, w: 144, h: 20, type: 0 },
            { x: 566, y: 163, w: 144, h: 20, type: 0 },
            { x: 447, y: 460, w: 75, h: 20, type: 1 },
            { x: 581, y: 20, w: 75, h: 20, type: 1 },
            { x: 509, y: 460, w: 75, h: 20, type: 1 },
            { x: 740, y: 150, w: 40, h: 50, type: 2 }
        ]
    },
    {
        difficulty: 5,
        spawn: { x: 50, y: 350 },
        objects: [
            { x: 0, y: 480, w: 800, h: 20, type: 0 },
            { x: 0, y: 0, w: 800, h: 20, type: 0 },
            { x: 82, y: 298, w: 138, h: 20, type: 0 },
            { x: 207, y: 287, w: 138, h: 20, type: 0 },
            { x: 290, y: 135, w: 138, h: 20, type: 0 },
            { x: 413, y: 151, w: 138, h: 20, type: 0 },
            { x: 488, y: 285, w: 138, h: 20, type: 0 },
            { x: 607, y: 386, w: 138, h: 20, type: 0 },
            { x: 252, y: 460, w: 77, h: 20, type: 1 },
            { x: 513, y: 20, w: 77, h: 20, type: 1 },
            { x: 207, y: 20, w: 77, h: 20, type: 1 },
            { x: 740, y: 276, w: 40, h: 50, type: 2 }
        ]
    },
    {
        difficulty: 5,
        spawn: { x: 50, y: 100 },
        objects: [
            { x: 0, y: 480, w: 800, h: 20, type: 0 },
            { x: 0, y: 0, w: 800, h: 20, type: 0 },
            { x: 106, y: 305, w: 132, h: 20, type: 0 },
            { x: 204, y: 180, w: 132, h: 20, type: 0 },
            { x: 284, y: 348, w: 132, h: 20, type: 0 },
            { x: 386, y: 163, w: 132, h: 20, type: 0 },
            { x: 504, y: 305, w: 132, h: 20, type: 0 },
            { x: 618, y: 139, w: 132, h: 20, type: 0 },
            { x: 509, y: 460, w: 79, h: 20, type: 1 },
            { x: 301, y: 20, w: 79, h: 20, type: 1 },
            { x: 214, y: 460, w: 79, h: 20, type: 1 },
            { x: 740, y: 246, w: 40, h: 50, type: 2 }
        ]
    },
    {
        difficulty: 5,
        spawn: { x: 50, y: 350 },
        objects: [
            { x: 0, y: 480, w: 800, h: 20, type: 0 },
            { x: 0, y: 0, w: 800, h: 20, type: 0 },
            { x: 107, y: 287, w: 125, h: 20, type: 0 },
            { x: 190, y: 135, w: 125, h: 20, type: 0 },
            { x: 313, y: 151, w: 125, h: 20, type: 0 },
            { x: 388, y: 285, w: 125, h: 20, type: 0 },
            { x: 507, y: 386, w: 125, h: 20, type: 0 },
            { x: 585, y: 331, w: 125, h: 20, type: 0 },
            { x: 513, y: 20, w: 81, h: 20, type: 1 },
            { x: 207, y: 20, w: 81, h: 20, type: 1 },
            { x: 553, y: 460, w: 81, h: 20, type: 1 },
            { x: 381, y: 20, w: 81, h: 20, type: 1 },
            { x: 740, y: 150, w: 40, h: 50, type: 2 }
        ]
    },
    {
        difficulty: 5,
        spawn: { x: 50, y: 100 },
        objects: [
            { x: 0, y: 480, w: 800, h: 20, type: 0 },
            { x: 0, y: 0, w: 800, h: 20, type: 0 },
            { x: 104, y: 180, w: 119, h: 20, type: 0 },
            { x: 184, y: 348, w: 119, h: 20, type: 0 },
            { x: 286, y: 163, w: 119, h: 20, type: 0 },
            { x: 404, y: 305, w: 119, h: 20, type: 0 },
            { x: 518, y: 139, w: 119, h: 20, type: 0 },
            { x: 610, y: 335, w: 119, h: 20, type: 0 },
            { x: 301, y: 20, w: 83, h: 20, type: 1 },
            { x: 214, y: 460, w: 83, h: 20, type: 1 },
            { x: 492, y: 20, w: 83, h: 20, type: 1 },
            { x: 389, y: 20, w: 83, h: 20, type: 1 },
            { x: 740, y: 158, w: 40, h: 50, type: 2 }
        ]
    },
    {
        difficulty: 5,
        spawn: { x: 50, y: 350 },
        objects: [
            { x: 0, y: 480, w: 800, h: 20, type: 0 },
            { x: 0, y: 0, w: 800, h: 20, type: 0 },
            { x: 90, y: 135, w: 113, h: 20, type: 0 },
            { x: 213, y: 151, w: 113, h: 20, type: 0 },
            { x: 288, y: 285, w: 113, h: 20, type: 0 },
            { x: 407, y: 386, w: 113, h: 20, type: 0 },
            { x: 485, y: 331, w: 113, h: 20, type: 0 },
            { x: 611, y: 175, w: 113, h: 20, type: 0 },
            { x: 207, y: 20, w: 85, h: 20, type: 1 },
            { x: 553, y: 460, w: 85, h: 20, type: 1 },
            { x: 381, y: 20, w: 85, h: 20, type: 1 },
            { x: 300, y: 20, w: 85, h: 20, type: 1 },
            { x: 740, y: 155, w: 40, h: 50, type: 2 }
        ]
    },
    {
        difficulty: 5,
        spawn: { x: 50, y: 100 },
        objects: [
            { x: 0, y: 480, w: 800, h: 20, type: 0 },
            { x: 0, y: 0, w: 800, h: 20, type: 0 },
            { x: 84, y: 348, w: 107, h: 20, type: 0 },
            { x: 186, y: 163, w: 107, h: 20, type: 0 },
            { x: 304, y: 305, w: 107, h: 20, type: 0 },
            { x: 418, y: 139, w: 107, h: 20, type: 0 },
            { x: 510, y: 335, w: 107, h: 20, type: 0 },
            { x: 590, y: 105, w: 107, h: 20, type: 0 },
            { x: 214, y: 460, w: 87, h: 20, type: 1 },
            { x: 492, y: 20, w: 87, h: 20, type: 1 },
            { x: 389, y: 20, w: 87, h: 20, type: 1 },
            { x: 316, y: 20, w: 87, h: 20, type: 1 },
            { x: 740, y: 150, w: 40, h: 50, type: 2 }
        ]
    },
    {
        difficulty: 5,
        spawn: { x: 50, y: 350 },
        objects: [
            { x: 0, y: 480, w: 800, h: 20, type: 0 },
            { x: 0, y: 0, w: 800, h: 20, type: 0 },
            { x: 113, y: 151, w: 101, h: 20, type: 0 },
            { x: 174, y: 285, w: 101, h: 20, type: 0 },
            { x: 278, y: 386, w: 101, h: 20, type: 0 },
            { x: 342, y: 331, w: 101, h: 20, type: 0 },
            { x: 454, y: 175, w: 101, h: 20, type: 0 },
            { x: 509, y: 110, w: 101, h: 20, type: 0 },
            { x: 629, y: 319, w: 101, h: 20, type: 0 },
            { x: 381, y: 20, w: 89, h: 20, type: 1 },
            { x: 300, y: 20, w: 89, h: 20, type: 1 },
            { x: 310, y: 20, w: 89, h: 20, type: 1 },
            { x: 243, y: 20, w: 89, h: 20, type: 1 },
            { x: 740, y: 197, w: 40, h: 50, type: 2 }
        ]
    },
    {
        difficulty: 5,
        spawn: { x: 50, y: 100 },
        objects: [
            { x: 0, y: 480, w: 800, h: 20, type: 0 },
            { x: 0, y: 0, w: 800, h: 20, type: 0 },
            { x: 86, y: 163, w: 94, h: 20, type: 0 },
            { x: 190, y: 305, w: 94, h: 20, type: 0 },
            { x: 289, y: 139, w: 94, h: 20, type: 0 },
            { x: 368, y: 335, w: 94, h: 20, type: 0 },
            { x: 432, y: 105, w: 94, h: 20, type: 0 },
            { x: 509, y: 365, w: 94, h: 20, type: 0 },
            { x: 623, y: 236, w: 94, h: 20, type: 0 },
            { x: 389, y: 20, w: 91, h: 20, type: 1 },
            { x: 316, y: 20, w: 91, h: 20, type: 1 },
            { x: 300, y: 20, w: 91, h: 20, type: 1 },
            { x: 379, y: 20, w: 91, h: 20, type: 1 },
            { x: 459, y: 460, w: 91, h: 20, type: 1 },
            { x: 740, y: 176, w: 40, h: 50, type: 2 }
        ]
    },
    {
        difficulty: 5,
        spawn: { x: 50, y: 350 },
        objects: [
            { x: 0, y: 480, w: 800, h: 20, type: 0 },
            { x: 0, y: 0, w: 800, h: 20, type: 0 },
            { x: 88, y: 285, w: 88, h: 20, type: 0 },
            { x: 193, y: 386, w: 88, h: 20, type: 0 },
            { x: 256, y: 331, w: 88, h: 20, type: 0 },
            { x: 368, y: 175, w: 88, h: 20, type: 0 },
            { x: 423, y: 110, w: 88, h: 20, type: 0 },
            { x: 543, y: 319, w: 88, h: 20, type: 0 },
            { x: 612, y: 242, w: 88, h: 20, type: 0 },
            { x: 300, y: 20, w: 93, h: 20, type: 1 },
            { x: 310, y: 20, w: 93, h: 20, type: 1 },
            { x: 243, y: 20, w: 93, h: 20, type: 1 },
            { x: 395, y: 460, w: 93, h: 20, type: 1 },
            { x: 490, y: 20, w: 93, h: 20, type: 1 },
            { x: 740, y: 278, w: 40, h: 50, type: 2 }
        ]
    },
    {
        difficulty: 5,
        spawn: { x: 50, y: 100 },
        objects: [
            { x: 0, y: 480, w: 800, h: 20, type: 0 },
            { x: 0, y: 0, w: 800, h: 20, type: 0 },
            { x: 104, y: 305, w: 82, h: 20, type: 0 },
            { x: 203, y: 139, w: 82, h: 20, type: 0 },
            { x: 282, y: 335, w: 82, h: 20, type: 0 },
            { x: 347, y: 105, w: 82, h: 20, type: 0 },
            { x: 424, y: 365, w: 82, h: 20, type: 0 },
            { x: 537, y: 236, w: 82, h: 20, type: 0 },
            { x: 613, y: 175, w: 82, h: 20, type: 0 },
            { x: 316, y: 20, w: 95, h: 20, type: 1 },
            { x: 300, y: 20, w: 95, h: 20, type: 1 },
            { x: 379, y: 20, w: 95, h: 20, type: 1 },
            { x: 459, y: 460, w: 95, h: 20, type: 1 },
            { x: 352, y: 460, w: 95, h: 20, type: 1 },
            { x: 740, y: 264, w: 40, h: 50, type: 2 }
        ]
    },
    {
        difficulty: 5,
        spawn: { x: 50, y: 350 },
        objects: [
            { x: 0, y: 480, w: 800, h: 20, type: 0 },
            { x: 0, y: 0, w: 800, h: 20, type: 0 },
            { x: 107, y: 386, w: 76, h: 20, type: 0 },
            { x: 170, y: 331, w: 76, h: 20, type: 0 },
            { x: 282, y: 175, w: 76, h: 20, type: 0 },
            { x: 337, y: 110, w: 76, h: 20, type: 0 },
            { x: 458, y: 319, w: 76, h: 20, type: 0 },
            { x: 526, y: 242, w: 76, h: 20, type: 0 },
            { x: 604, y: 187, w: 76, h: 20, type: 0 },
            { x: 310, y: 20, w: 97, h: 20, type: 1 },
            { x: 243, y: 20, w: 97, h: 20, type: 1 },
            { x: 395, y: 460, w: 97, h: 20, type: 1 },
            { x: 490, y: 20, w: 97, h: 20, type: 1 },
            { x: 557, y: 460, w: 97, h: 20, type: 1 },
            { x: 740, y: 138, w: 40, h: 50, type: 2 }
        ]
    },
    {
        difficulty: 5,
        spawn: { x: 50, y: 100 },
        objects: [
            { x: 0, y: 480, w: 800, h: 20, type: 0 },
            { x: 0, y: 0, w: 800, h: 20, type: 0 },
            { x: 118, y: 139, w: 70, h: 20, type: 0 },
            { x: 185, y: 335, w: 70, h: 20, type: 0 },
            { x: 240, y: 105, w: 70, h: 20, type: 0 },
            { x: 306, y: 365, w: 70, h: 20, type: 0 },
            { x: 409, y: 236, w: 70, h: 20, type: 0 },
            { x: 473, y: 175, w: 70, h: 20, type: 0 },
            { x: 541, y: 182, w: 70, h: 20, type: 0 },
            { x: 615, y: 132, w: 70, h: 20, type: 0 },
            { x: 379, y: 20, w: 100, h: 20, type: 1 },
            { x: 459, y: 460, w: 100, h: 20, type: 1 },
            { x: 352, y: 460, w: 100, h: 20, type: 1 },
            { x: 528, y: 20, w: 100, h: 20, type: 1 },
            { x: 422, y: 20, w: 100, h: 20, type: 1 },
            { x: 314, y: 20, w: 100, h: 20, type: 1 },
            { x: 740, y: 260, w: 40, h: 50, type: 2 }
        ]
    }
];

const levelSelectionScreen = document.getElementById('level-selection-screen');
const levelGrid = document.getElementById('level-grid');
const homeBtn = document.getElementById('home-btn');

function renderLevelGrid() {
    levelGrid.innerHTML = '';
    for (let i = 0; i < levels.length; i++) {
        const isLocked = (i + 1) > unlockedLevels;
        const card = document.createElement('div');
        card.className = `level-card ${isLocked ? 'locked' : ''} ${i === currentLevelIndex ? 'active' : ''}`;

        if (isLocked) {
            card.innerHTML = `
                <div class="lock-icon">🔒</div>
                <div class="level-status">LOCKED</div>
            `;
        } else {
            card.innerHTML = `
                <div class="level-number">${i + 1}</div>
                <div class="level-status">${i === (unlockedLevels - 1) ? 'PLAY' : 'COMPLETED'}</div>
            `;
            card.addEventListener('click', () => {
                startLevel(i);
            });
        }
        levelGrid.appendChild(card);
    }
}

function startLevel(index) {
    if ((index + 1) > unlockedLevels) return; // Prevent playing locked levels
    currentLevelIndex = index;
    levelSelectionScreen.style.display = 'none';
    document.getElementById('game-content').style.display = 'flex';
    initLevel(index);
}

function showLevelSelection() {
    homeScreen.style.display = 'none';
    document.getElementById('game-content').style.display = 'none';
    levelSelectionScreen.style.display = 'flex';
    renderLevelGrid();
}

function initLevel(index) {
    const lvl = levels[index];
    const diff = lvl.difficulty || 1;

    // Progressive Difficulty Scaling
    gravity = 0.6 + (diff - 1) * 0.1;
    player.speed = 5 - (diff - 1) * 0.2;
    player.width = Math.max(20, 24 - (diff - 1));
    player.height = Math.max(20, 24 - (diff - 1));

    // ── DIFFICULTY SYSTEM: update multiplier & flip limit ──
    difficultyMultiplier = 1 + index * 0.08;            // gravity gets harder each level
    const maxFlips = Math.max(3, 20 - Math.floor(index * 0.8)); // fewer flips as levels go up
    flipsLeft = index < 4 ? Infinity : maxFlips;        // first 4 levels: unlimited flips
    updateFlipCounterUI();

    // ── MOVING BLOCKS: spawn based on level index ──
    movingBlocks = [];
    gameTime = 0;
    if (index >= 6) {
        // Level 7+: one horizontal mover along bottom region
        movingBlocks.push({ x: 200, y: 380, w: 60, h: 18, dx: 2.2 + index * 0.12, dy: 0 });
    }
    if (index >= 8) {
        // Level 9+: add a second mover going opposite direction, mid-height
        movingBlocks.push({ x: 500, y: 220, w: 55, h: 18, dx: -(2.5 + index * 0.1), dy: 0 });
    }
    if (index >= 11) {
        // Level 12+: vertical mover
        movingBlocks.push({ x: 380, y: 150, w: 55, h: 18, dx: 0, dy: 2.0 + index * 0.08 });
    }
    if (index >= 14) {
        // Level 15+: diagonal mover
        movingBlocks.push({ x: 130, y: 250, w: 50, h: 18, dx: 2.8, dy: 1.6 });
    }
    // ──────────────────────────────────────────────────────────

    player.x = lvl.spawn.x;
    player.y = lvl.spawn.y;
    player.vx = 0;
    player.vy = 0;
    isGravityFlipped = false;
    container.classList.remove('gravity-flipped');
    gameActive = true;
    gamePaused = false;
    overlay.classList.remove('visible');
    const overlayBtn = document.getElementById('overlay-button');
    if (overlayBtn) {
        overlayBtn.onclick = null;
        overlayBtn.blur();
    }
    if (buyTimeBtn) buyTimeBtn.style.display = 'none';
    if (coinBalanceHint) coinBalanceHint.style.display = 'none';

    levelText.innerText = `LEVEL ${index + 1}`;
    pauseBtn.style.display = 'block';
    resumeBtn.style.display = 'none';

    stopTimer();
    levelDuration = Math.max(30, 60 - index * 1.5); // timer shrinks with level
    timeLeft = levelDuration;
    updateTimerUI();
    startTimer();

    resizeCanvas();

    // Show gesture tutorial on Level 1
    if (index === 0) {
        setTimeout(() => showTutorial(), 500);
    }
}

// ── DIFFICULTY HELPERS ──────────────────────────────────────────────
function updateFlipCounterUI() {
    const el = document.getElementById('flip-counter-display');
    if (!el) return;
    el.innerText = flipsLeft === Infinity ? 'FLIPS LEFT: ∞' : `FLIPS LEFT: ${flipsLeft}`;
    el.style.color = (flipsLeft !== Infinity && flipsLeft <= 3) ? '#ff4444' : '#00ff88';
}
// ───────────────────────────────────────────────────────────────────

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (!gameActive || gamePaused) return;

        timeLeft--;
        updateTimerUI();

        if (timeLeft <= 0) {
            handleTimeUp();
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateTimerUI() {
    if (!timerValue) return;

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerValue.innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    if (timeLeft <= 5) {
        timerValue.classList.add('timer-low');
    } else {
        timerValue.classList.remove('timer-low');
    }
}

function handleTimeUp() {
    gameActive = false;
    stopTimer();

    // Loser transition: flash + shake
    const flash = document.getElementById('loser-flash');
    if (flash) {
        flash.classList.add('active');
        setTimeout(() => flash.classList.remove('active'), 800);
    }

    // Shake the game container
    const cont = document.getElementById('game-container');
    if (cont) {
        cont.classList.add('shake');
        setTimeout(() => cont.classList.remove('shake'), 600);
    }

    // Delay overlay for dramatic effect
    setTimeout(() => {
        messageHeader.innerText = "💀 YOU LOST!";
        messageText.innerText = "Time's up! Better luck next time.";
        overlay.classList.add('lose');

        const overlayBtn = document.getElementById('overlay-button');
        overlayBtn.innerText = "Try Again";
        overlayBtn.onclick = restartLevel;

        if (buyTimeBtn && coinBalanceHint) {
            buyTimeBtn.style.display = 'flex';
            coinBalanceHint.style.display = 'block';
            coinBalanceHint.innerText = `Your balance: ${coins} 🪙`;

            if (coins >= 100) {
                buyTimeBtn.disabled = false;
                buyTimeBtn.style.opacity = '1';
                buyTimeBtn.style.cursor = 'pointer';
                buyTimeBtn.onclick = () => {
                    coins -= 100;
                    saveProgress();
                    updateScoreUI();

                    overlay.classList.remove('visible');
                    buyTimeBtn.style.display = 'none';
                    coinBalanceHint.style.display = 'none';

                    timeLeft += 10;
                    gameActive = true;
                    startTimer();
                };
            } else {
                buyTimeBtn.disabled = true;
                buyTimeBtn.style.opacity = '0.5';
                buyTimeBtn.style.cursor = 'not-allowed';
                buyTimeBtn.onclick = null;
            }
        }

        overlay.classList.add('visible');
        overlayBtn.blur();
    }, 500);
}

function handleDeath(message) {
    gameActive = false;
    stopTimer();

    const flash = document.getElementById('loser-flash');
    if (flash) {
        flash.classList.add('active');
        setTimeout(() => flash.classList.remove('active'), 800);
    }

    const cont = document.getElementById('game-container');
    if (cont) {
        cont.classList.add('shake');
        setTimeout(() => cont.classList.remove('shake'), 600);
    }

    setTimeout(() => {
        messageHeader.innerText = "Out!";
        messageText.innerText = message;
        overlay.classList.add('lose');

        const overlayBtn = document.getElementById('overlay-button');
        overlayBtn.innerText = "Try Again";
        overlayBtn.onclick = restartLevel;

        const buyTimeBtn = document.getElementById('buy-time-btn');
        const coinBalanceHint = document.getElementById('coin-balance-hint');
        if (buyTimeBtn) buyTimeBtn.style.display = 'none';
        if (coinBalanceHint) coinBalanceHint.style.display = 'none';

        overlay.classList.add('visible');
        overlayBtn.blur();
    }, 500);
}

function restartLevel() {
    overlay.classList.remove('lose');
    initLevel(currentLevelIndex);
}

function nextLevel() {
    // Only unlock the next level if we just completed our current highest unlocked level
    if (currentLevelIndex + 1 === unlockedLevels) {
        unlockedLevels = Math.min(levels.length, unlockedLevels + 1);
        coins += 10;
        saveProgress();
    }

    currentLevelIndex++;
    if (currentLevelIndex >= levels.length) {
        currentLevelIndex = 0;
        showLevelSelection();
    } else {
        initLevel(currentLevelIndex);
    }
}

function drawSpike(x, y, w, h) {
    const spikeColor = getComputedStyle(document.documentElement).getPropertyValue('--spike-color').trim() || '#ff3b3b';
    ctx.fillStyle = spikeColor;
    const count = Math.ceil(w / 12);
    const spikeW = w / count;

    ctx.beginPath();
    for (let i = 0; i < count; i++) {
        ctx.moveTo(x + (i * spikeW), y + h);
        ctx.lineTo(x + (i * spikeW) + spikeW / 2, y);
        ctx.lineTo(x + (i * spikeW) + spikeW, y + h);
    }
    ctx.fill();
}

let portalPulse = 0;
function drawPortal(x, y, w, h) {
    portalPulse += 0.05;
    const pulseScale = 1 + Math.sin(portalPulse) * 0.15;
    const goalColor = getComputedStyle(document.documentElement).getPropertyValue('--goal-color').trim() || '#00ff88';

    ctx.save();
    ctx.shadowBlur = 25 * pulseScale;
    ctx.shadowColor = goalColor;

    ctx.fillStyle = goalColor;
    ctx.globalAlpha = 0.8 + Math.sin(portalPulse) * 0.2;

    if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 8);
        ctx.fill();
    } else {
        ctx.fillRect(x, y, w, h);
    }

    ctx.fillStyle = 'white';
    ctx.globalAlpha = 0.5;
    if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x + 10, y + 10, w - 20, h - 20, 4);
        ctx.fill();
    } else {
        ctx.fillRect(x + 10, y + 10, w - 20, h - 20);
    }

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 1;
    ctx.strokeRect(x - 5, y - 5, w + 10, h + 10);

    ctx.restore();
}

function update() {
    if (!gameActive || gamePaused) return;

    // Ultra-smooth Lerp Movement (Responsive & Fast)
    let targetVx = 0;
    // Boost base speed by 1.6x so it doesn't feel "slow"
    const currentMaxSpeed = player.speed * 1.6;

    if (keys['ArrowLeft'] || leftPressed) targetVx = -currentMaxSpeed;
    if (keys['ArrowRight'] || rightPressed) targetVx = currentMaxSpeed;

    // Snappy interpolation towards the target velocity
    player.vx += (targetVx - player.vx) * 0.35;

    // Snap to zero to prevent microscopic sliding
    if (Math.abs(player.vx) < 0.1) player.vx = 0;

    // ── DIFFICULTY: gravity scaled by difficulty multiplier ──
    const g = isGravityFlipped ? -gravity : gravity;
    player.vy += g * difficultyMultiplier;
    // ──────────────────────────────────────────────────────────

    player.x += player.vx;
    player.y += player.vy;

    // ── MOVING BLOCKS: advance position, bounce off walls ──
    gameTime++;
    movingBlocks.forEach(b => {
        b.x += b.dx;
        b.y += b.dy;
        // bounce horizontally
        if (b.dx !== 0 && (b.x <= 0 || b.x + b.w >= 800)) b.dx = -b.dx;
        // bounce vertically
        if (b.dy !== 0 && (b.y <= 20 || b.y + b.h >= 480)) b.dy = -b.dy;
    });
    // ──────────────────────────────────────────────────────

    // Bounds
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > 800) player.x = 800 - player.width;

    if (player.y > 500 || player.y + player.height < 0) {
        handleDeath("You fell out of bounds!");
        return;
    }

    const lvl = levels[currentLevelIndex];
    player.onGround = false;

    lvl.objects.forEach(obj => {
        if (player.x < obj.x + obj.w &&
            player.x + player.width > obj.x &&
            player.y < obj.y + obj.h &&
            player.y + player.height > obj.y) {

            if (obj.type === 0) {
                const prevY = player.y - player.vy;
                if (!isGravityFlipped) {
                    if (prevY + player.height <= obj.y) {
                        player.y = obj.y - player.height;
                        player.vy = 0;
                        player.onGround = true;
                    }
                } else {
                    if (prevY >= obj.y + obj.h) {
                        player.y = obj.y + obj.h;
                        player.vy = 0;
                        player.onGround = true;
                    }
                }
            } else if (obj.type === 1) {
                handleDeath("You touched a spike!");
            } else if (obj.type === 2) {
                gameActive = false;
                stopTimer();

                const lvlIdx = currentLevelIndex;
                const difficulty = levels[lvlIdx].difficulty || 1;

                // Efficiency Bonus: More time left = more coins
                const bonusCoins = Math.floor(timeLeft * (1 + difficulty / 5));
                coins += bonusCoins;
                saveProgress();
                updateScoreUI();

                const overlayBtn = document.getElementById('overlay-button');
                overlayBtn.onclick = () => nextLevel();

                if (currentLevelIndex === levels.length - 1) {
                    messageHeader.innerText = "CONGRATULATIONS!";
                    messageText.innerText = `Final Level Complete!\nEfficiency Bonus: ${bonusCoins} 🪙`;
                    overlayBtn.innerText = "Finish Game";
                } else {
                    messageHeader.innerText = "LEVEL COMPLETE!";
                    messageText.innerText = `Well done! Efficiency Bonus: ${bonusCoins} 🪙`;
                    overlayBtn.innerText = "Next Level";
                }
                overlay.classList.add('visible');
                // Blur so SPACE won't retrigger the button in the new level
                overlayBtn.blur();
            }
        }
    });

    // ── MOVING BLOCK COLLISION (acts as spike — kills player) ──
    movingBlocks.forEach(b => {
        if (player.x < b.x + b.w &&
            player.x + player.width > b.x &&
            player.y < b.y + b.h &&
            player.y + player.height > b.y) {
            handleDeath("Hit by a moving obstacle!");
        }
    });
    // ──────────────────────────────────────────────────────────
}

function updateScoreUI() {
    if (scoreValue) {
        scoreValue.innerText = coins;
    }
}

function draw() {
    ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
    ctx.clearRect(0, 0, 800, 500);

    const lvl = levels[currentLevelIndex];

    lvl.objects.forEach(obj => {
        if (obj.type === 0) {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
        } else if (obj.type === 1) {
            drawSpike(obj.x, obj.y, obj.w, obj.h);
        } else if (obj.type === 2) {
            drawPortal(obj.x, obj.y, obj.w, obj.h);
        }
    });

    // ── DRAW MOVING BLOCKS ─────────────────────────────────
    movingBlocks.forEach(b => {
        // Glowing orange moving spike block
        ctx.save();
        ctx.shadowBlur = 14;
        ctx.shadowColor = '#ff8800';
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(b.x, b.y, b.w, b.h);
        // Spike teeth on top
        const spikeCount = Math.ceil(b.w / 10);
        const sw = b.w / spikeCount;
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        for (let i = 0; i < spikeCount; i++) {
            ctx.moveTo(b.x + i * sw, b.y);
            ctx.lineTo(b.x + i * sw + sw / 2, b.y - 8);
            ctx.lineTo(b.x + i * sw + sw, b.y);
        }
        ctx.fill();
        ctx.restore();
    });
    // ──────────────────────────────────────────────────────

    ctx.fillStyle = player.color;
    ctx.beginPath();
    // Round position to whole pixels to prevent sub-pixel blurring/jitter
    ctx.roundRect(Math.round(player.x), Math.round(player.y), player.width, player.height, 4);
    ctx.fill();

    ctx.fillStyle = 'white';
    let eyeX = player.vx >= 0 ? Math.round(player.x) + 14 : Math.round(player.x) + 4;
    let eyeY = isGravityFlipped ? Math.round(player.y) + 14 : Math.round(player.y) + 4;
    ctx.fillRect(eyeX, eyeY, 6, 6);
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// Input
window.addEventListener('keydown', e => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
    }
    keys[e.code] = true;
    if (e.code === 'Space') {
        // ── FLIP COUNTER CHECK ──
        if (flipsLeft !== Infinity && flipsLeft <= 0) return; // block flip if none left
        // ───────────────────────
        isGravityFlipped = !isGravityFlipped;
        if (isGravityFlipped) container.classList.add('gravity-flipped');
        else container.classList.remove('gravity-flipped');
        // ── DECREMENT FLIP COUNTER ──
        if (flipsLeft !== Infinity) {
            flipsLeft--;
            updateFlipCounterUI();
        }
        // ───────────────────────────
    }
    if (e.code === 'KeyR') restartLevel();
});

window.addEventListener('keyup', e => {
    keys[e.code] = false;
});

// UI Event Listeners
const homeScreen = document.getElementById('home-screen');
const startBtn = document.getElementById('start-btn');
const playerSetup = document.getElementById('player-setup');
const playerNameInput = document.getElementById('player-name');
const continueBtn = document.getElementById('continue-btn');
const inGameBackBtn = document.getElementById('in-game-back-btn');
const levelSelectionBackBtn = document.getElementById('level-selection-back-btn');

let isTransitioning = false;

if (levelSelectionBackBtn) {
    levelSelectionBackBtn.addEventListener('click', () => {
        if (isTransitioning) return;
        isTransitioning = true;

        levelSelectionScreen.classList.add('fade-out');

        setTimeout(() => {
            levelSelectionScreen.style.display = 'none';
            levelSelectionScreen.classList.remove('fade-out');

            homeScreen.style.display = 'flex';
            homeScreen.classList.add('fade-in');

            // Reset player setup display and home screen styles for neatness
            startBtn.style.display = 'block';
            startBtn.style.opacity = '1';
            startBtn.style.pointerEvents = 'auto';
            playerSetup.style.display = 'none';

            const title = homeScreen.querySelector('h1');
            const sub = homeScreen.querySelector('p');
            if (title) {
                title.style.transform = 'translateY(0) scale(1) rotateX(0)';
                title.style.opacity = '1';
                title.style.filter = 'blur(0) brightness(1)';
            }
            if (sub) {
                sub.style.transform = 'translateY(0) scale(1) rotateX(0)';
                sub.style.opacity = '1';
                sub.style.filter = 'blur(0) brightness(1)';
            }

            setTimeout(() => {
                homeScreen.classList.remove('fade-in');
                isTransitioning = false;
            }, 300);

        }, 300);
    });
}

inGameBackBtn.addEventListener('click', () => {
    if (isTransitioning || !gameActive) return;
    isTransitioning = true;

    // Stop game loop effects visually
    gameActive = false;
    gamePaused = false;
    stopTimer();

    // Reset state to default
    player.vx = 0;
    player.vy = 0;

    // Reset mode to linear (normal gravity)
    isGravityFlipped = false;
    container.classList.remove('gravity-flipped');

    // Hide gameplay UI with transition
    const gameContent = document.getElementById('game-content');
    gameContent.classList.add('fade-out');

    setTimeout(() => {
        gameContent.classList.remove('fade-out');

        // Show main menu (level selection) again with animation
        showLevelSelection();
        levelSelectionScreen.classList.add('fade-in');

        // Failsafe clearing of particles/history if they were to exist
        if (player.history) player.history = [];
        if (window.particles) window.particles = [];

        setTimeout(() => {
            levelSelectionScreen.classList.remove('fade-in');
            isTransitioning = false;
        }, 300);

    }, 300); // 300ms delay for clean feel
});

function playExplosion(x, y) {
    const canvas = document.createElement('canvas');
    canvas.id = 'particle-canvas';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];

    // Create a circular blast
    for (let i = 0; i < 200; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 30 + 10;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 8 + 3,
            color: '#00e5ff',
            life: 1.0,
            decay: Math.random() * 0.03 + 0.015
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let active = false;

        particles.forEach(p => {
            if (p.life > 0) {
                active = true;
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= 0.92; // Friction slows them down rapidly
                p.vy *= 0.92;
                p.life -= p.decay;

                ctx.globalAlpha = Math.max(0, p.life);
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        if (active) {
            requestAnimationFrame(animate);
        } else {
            canvas.remove();
        }
    }
    animate();
}

startBtn.addEventListener('click', () => {
    if (isTransitioning) return;
    isTransitioning = true;

    const rect = startBtn.getBoundingClientRect();
    const blastX = rect.left + rect.width / 2;
    const blastY = rect.top + rect.height / 2;

    playExplosion(blastX, blastY);

    startBtn.style.opacity = '0';
    startBtn.style.pointerEvents = 'none';

    const title = homeScreen.querySelector('h1');
    const sub = homeScreen.querySelector('p');
    if (title) {
        title.style.transition = 'all 0.5s cubic-bezier(0.1, 1, 0.2, 1)';
        title.style.transform = `translateY(-100px) scale(1.5) rotateX(45deg)`;
        title.style.opacity = '0';
        title.style.filter = 'blur(15px) brightness(2)';
    }
    if (sub) {
        sub.style.transition = 'all 0.5s cubic-bezier(0.1, 1, 0.2, 1)';
        sub.style.transform = `translateY(-100px) scale(1.5) rotateX(45deg)`;
        sub.style.opacity = '0';
        sub.style.filter = 'blur(15px) brightness(2)';
    }

    setTimeout(() => {
        startBtn.style.display = 'none';
        playerSetup.style.display = 'flex';

        playerSetup.style.transition = 'none';
        playerSetup.style.transform = 'scale(2) translateZ(100px)';
        playerSetup.style.opacity = '0';
        playerSetup.style.filter = 'brightness(3)';

        void playerSetup.offsetWidth;

        playerSetup.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        playerSetup.style.transform = 'scale(1) translateZ(0)';
        playerSetup.style.opacity = '1';
        playerSetup.style.filter = 'brightness(1)';

        setTimeout(() => {
            isTransitioning = false;
            playerNameInput.focus();
        }, 400);
    }, 150);
});

function playParticleBurst() {
    const canvas = document.createElement('canvas');
    canvas.id = 'particle-canvas';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight * 0.6; // Fire from near the login form

    for (let i = 0; i < 150; i++) {
        particles.push({
            x: centerX,
            y: centerY,
            vx: (Math.random() - 0.5) * 20,
            vy: (Math.random() - 0.5) * 20 - 5, // Upward bias
            size: Math.random() * 5 + 2,
            h: Math.random() * 60 + 120, // Cyan-Green range
            life: 1.0,
            decay: Math.random() * 0.015 + 0.005
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let active = false;

        particles.forEach(p => {
            if (p.life > 0) {
                active = true;
                p.x += p.vx;
                p.y += p.vy;

                // GRAVITY FLUX: when life drops below 0.5, gravity flips!
                if (p.life < 0.5) {
                    p.vy -= 0.6; // Pull violently upwards
                } else {
                    p.vy += 0.25; // Normal gravity down
                }

                p.life -= p.decay;

                ctx.globalAlpha = Math.max(0, p.life);
                ctx.fillStyle = `hsl(${p.h}, 100%, 60%)`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        if (active) {
            requestAnimationFrame(animate);
        } else {
            canvas.remove();
        }
    }
    animate();
}

playerNameInput.addEventListener('input', () => {
    if (playerNameInput.value.trim().length > 0) {
        playerNameInput.setCustomValidity("");
    }
});

continueBtn.addEventListener('click', () => {
    const name = playerNameInput.value.trim();
    if (!name) {
        playerNameInput.setCustomValidity("Please enter your name to continue!");
        playerNameInput.reportValidity();
        return;
    }
    playerNameInput.setCustomValidity("");
    document.getElementById('display-player-name').textContent = name;

    // Trigger Slide and Burst
    isTransitioning = true;
    homeScreen.classList.add('slide-up-out');
    playParticleBurst();

    // After animation delay
    setTimeout(() => {
        homeScreen.style.display = 'none';
        homeScreen.classList.remove('slide-up-out');

        // Hide other screens (just in case)
        document.getElementById('game-content').style.display = 'none';

        // Fade in the Level Selection
        levelSelectionScreen.style.display = 'flex';
        levelSelectionScreen.classList.add('fade-in-screen');
        renderLevelGrid();

        setTimeout(() => {
            levelSelectionScreen.classList.remove('fade-in-screen');
            isTransitioning = false;
        }, 800);
    }, 1500); // Wait for the slide upwards to almost complete
});

// homeBtn functionality removed (header removed from level selection)

gameSettingsBtn.addEventListener('click', () => { gameSettingsModal.style.display = 'flex'; });
closeGameSettings.addEventListener('click', () => { gameSettingsModal.style.display = 'none'; });
gameSettingsModal.addEventListener('click', (e) => { if (e.target === gameSettingsModal) gameSettingsModal.style.display = 'none'; });

// ═══════════════════════════════════════════════════════════════
//  📖 BOOK ICON → RULES MODAL
// ═══════════════════════════════════════════════════════════════
const howToPlayBtn = document.getElementById('how-to-play-btn');
const instructionsModal = document.getElementById('instructions-modal');
const closeInstructionsBtn = document.getElementById('close-instructions-btn');

if (howToPlayBtn && instructionsModal) {
    howToPlayBtn.addEventListener('click', () => {
        // Remember if the game was already paused before opening
        instructionsModal._wasPaused = gamePaused;
        // Pause game + timer while reading rules
        if (gameActive && !gamePaused) {
            gamePaused = true;
            stopTimer();
        }
        instructionsModal.style.display = 'flex';
    });
}

function closeInstructions() {
    if (!instructionsModal) return;
    instructionsModal.style.display = 'none';
    // Resume timer only if game was running before we opened the modal
    if (gameActive && !instructionsModal._wasPaused) {
        gamePaused = false;
        startTimer();
        pauseBtn.style.display = 'block';
        resumeBtn.style.display = 'none';
    }
}

if (closeInstructionsBtn) {
    closeInstructionsBtn.addEventListener('click', closeInstructions);
}

if (instructionsModal) {
    instructionsModal.addEventListener('click', (e) => {
        if (e.target === instructionsModal) closeInstructions();
    });
}

// ═══════════════════════════════════════════════════════════════
//  🎮 LEVEL 1 GESTURE TUTORIAL
// ═══════════════════════════════════════════════════════════════
const TUTORIAL_STEPS = [
    {
        gesture: '⬅️  ➡️',
        title: 'MOVE LEFT & RIGHT',
        desc: 'Press <kbd>Arrow Left</kbd> and <kbd>Arrow Right</kbd> to move your cube. On mobile, tap the ← → buttons.'
    },
    {
        gesture: '🔄',
        title: 'FLIP GRAVITY',
        desc: 'Press <kbd>Space</kbd> to instantly flip gravity. Your cube flies up to the ceiling — press again to fall back down!'
    },
    {
        gesture: '🔴',
        title: 'AVOID RED SPIKES',
        desc: 'Red spikes mean <strong style="color:#ef4444">instant death</strong> on contact! Flip your gravity at the right moment to soar over them.'
    },
    {
        gesture: '🟢',
        title: 'REACH THE PORTAL',
        desc: 'Navigate to the glowing <strong style="color:#00ff88">green exit portal</strong> to complete the level — before the timer hits zero!'
    },
    {
        gesture: '⏱️ 🪙',
        title: 'TIMER & COINS',
        desc: 'Finish fast to earn <strong style="color:#f59e0b">bonus coins</strong>. If you run out of time, spend <strong>100 🪙</strong> to buy +10 seconds. Use <kbd>R</kbd> to restart anytime.'
    }
];

let tutorialStep = 0;
let tutorialActive = false;
const tutorialOverlay = document.getElementById('tutorial-overlay');
const tutorialStepNumEl = document.getElementById('tutorial-step-num');
const tutorialStepTotalEl = document.getElementById('tutorial-step-total');
const tutorialGestureEl = document.getElementById('tutorial-gesture');
const tutorialTitleEl = document.getElementById('tutorial-title');
const tutorialDescEl = document.getElementById('tutorial-desc');
const tutorialProgressFill = document.getElementById('tutorial-progress-fill');
const tutorialNextBtn = document.getElementById('tutorial-next-btn');
const tutorialSkipBtn = document.getElementById('tutorial-skip-btn');
const tutorialContainer = document.getElementById('tutorial-step-container');

function renderTutorialStep() {
    const step = TUTORIAL_STEPS[tutorialStep];
    if (tutorialStepTotalEl) tutorialStepTotalEl.textContent = TUTORIAL_STEPS.length;
    if (tutorialStepNumEl) tutorialStepNumEl.textContent = tutorialStep + 1;
    if (tutorialGestureEl) tutorialGestureEl.innerHTML = step.gesture;
    if (tutorialTitleEl) tutorialTitleEl.textContent = step.title;
    if (tutorialDescEl) tutorialDescEl.innerHTML = step.desc;
    if (tutorialProgressFill) {
        tutorialProgressFill.style.width = `${((tutorialStep + 1) / TUTORIAL_STEPS.length) * 100}%`;
    }
    if (tutorialNextBtn) {
        tutorialNextBtn.textContent = tutorialStep === TUTORIAL_STEPS.length - 1 ? '🚀 Start Playing!' : 'Next →';
    }
}

function showTutorial() {
    if (!tutorialOverlay) return;
    tutorialStep = 0;
    tutorialActive = true;
    gamePaused = true;
    stopTimer();
    renderTutorialStep();
    tutorialOverlay.style.display = 'flex';
}

function advanceTutorial() {
    if (!tutorialContainer) return;
    tutorialContainer.classList.add('step-exit');
    setTimeout(() => {
        tutorialContainer.classList.remove('step-exit');
        tutorialStep++;
        if (tutorialStep >= TUTORIAL_STEPS.length) {
            closeTutorial();
            return;
        }
        renderTutorialStep();
        tutorialContainer.classList.add('step-enter');
        setTimeout(() => tutorialContainer.classList.remove('step-enter'), 350);
    }, 250);
}

function closeTutorial() {
    if (!tutorialOverlay) return;
    tutorialOverlay.style.display = 'none';
    tutorialActive = false;
    gamePaused = false;
    startTimer();
}

if (tutorialNextBtn) tutorialNextBtn.addEventListener('click', advanceTutorial);
if (tutorialSkipBtn) tutorialSkipBtn.addEventListener('click', closeTutorial);

pauseBtn.addEventListener('click', () => {
    gamePaused = true;
    stopTimer();
    pauseBtn.style.display = 'none';
    resumeBtn.style.display = 'block';
});

resumeBtn.addEventListener('click', () => {
    gamePaused = false;
    startTimer();
    resumeBtn.style.display = 'none';
    pauseBtn.style.display = 'block';
});

exitBtn.addEventListener('click', () => {
    gameActive = false;
    gamePaused = false;
    stopTimer();
    gameSettingsModal.style.display = 'none';
    showLevelSelection();
});

document.getElementById('reset-progress-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all progress? You will lose unlocked levels and coins.')) {
        unlockedLevels = 1;
        coins = 0;
        localStorage.setItem('flip_unlockedLevels', 1);
        localStorage.setItem('flip_coins', 0);
        gameSettingsModal.style.display = 'none';
        showLevelSelection();
    }
});

function updateMovableControlState() {
    const isMovable = movableControlsToggle.classList.contains('active');
    mobileLeftBtn.style.display = isMovable ? 'flex' : 'none';
    mobileRightBtn.style.display = isMovable ? 'flex' : 'none';
    mobileUpBtn.style.display = isMovable ? 'flex' : 'none';
    mobileDownBtn.style.display = isMovable ? 'flex' : 'none';
}

movableControlsToggle.addEventListener('click', () => {
    movableControlsToggle.classList.toggle('active');
    updateMovableControlState();
});

mobileControlsToggle.addEventListener('click', () => {
    const visible = mobileUpBtn.style.display !== 'none';
    if (visible) hideMobileControls();
    else showMobileControls();
});

function showMobileControls() {
    updateMovableControlState();
    mobileUpBtn.style.display = 'flex';
    mobileDownBtn.style.display = 'flex';
    mobileControlsToggle.textContent = '❌ Hide Controls';
}

function hideMobileControls() {
    mobileLeftBtn.style.display = 'none';
    mobileRightBtn.style.display = 'none';
    mobileUpBtn.style.display = 'none';
    mobileDownBtn.style.display = 'none';
    mobileControlsToggle.textContent = '🎮 Controls';
}

// Mobile Button Handlers - Support both touch and pointer events
function setupMobileControls() {
    // Left button events
    const addLeftPressListeners = (btn) => {
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); leftPressed = true; });
        btn.addEventListener('touchend', (e) => { e.preventDefault(); leftPressed = false; });
        btn.addEventListener('pointerdown', (e) => { e.preventDefault(); leftPressed = true; });
        btn.addEventListener('pointerup', (e) => { e.preventDefault(); leftPressed = false; });
        btn.addEventListener('pointerout', (e) => { leftPressed = false; });
        btn.addEventListener('mousedown', () => { leftPressed = true; });
        btn.addEventListener('mouseup', () => { leftPressed = false; });
    };

    // Right button events
    const addRightPressListeners = (btn) => {
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); rightPressed = true; });
        btn.addEventListener('touchend', (e) => { e.preventDefault(); rightPressed = false; });
        btn.addEventListener('pointerdown', (e) => { e.preventDefault(); rightPressed = true; });
        btn.addEventListener('pointerup', (e) => { e.preventDefault(); rightPressed = false; });
        btn.addEventListener('pointerout', (e) => { rightPressed = false; });
        btn.addEventListener('mousedown', () => { rightPressed = true; });
        btn.addEventListener('mouseup', () => { rightPressed = false; });
    };

    // Flip button events
    const addUpListeners = (btn) => {
        const handleUp = (e) => {
            e.preventDefault();
            isGravityFlipped = true;
            container.classList.add('gravity-flipped');
        };
        btn.addEventListener('touchstart', handleUp);
        btn.addEventListener('pointerdown', handleUp);
        btn.addEventListener('mousedown', handleUp);
    };

    // Down button events
    const addDownListeners = (btn) => {
        const handleDown = (e) => {
            e.preventDefault();
            isGravityFlipped = false;
            container.classList.remove('gravity-flipped');
        };
        btn.addEventListener('touchstart', handleDown);
        btn.addEventListener('pointerdown', handleDown);
        btn.addEventListener('mousedown', handleDown);
    };

    addLeftPressListeners(mobileLeftBtn);
    addRightPressListeners(mobileRightBtn);
    addUpListeners(mobileUpBtn);
    addDownListeners(mobileDownBtn);
}

setupMobileControls();

// Canvas Resize Logic
function resizeCanvas() {
    const cont = document.getElementById('game-container');
    const header = document.getElementById('game-header');
    const footer = document.getElementById('game-footer');
    if (!cont) return;

    // Calculate exact available dimensions
    const isMobile = navigator.maxTouchPoints > 0 && window.innerWidth <= 900;
    const isLandscapeMode = window.matchMedia("(max-width: 900px) and (orientation: landscape)").matches;

    // Get actual heights if they are visible
    const headerH = header && window.getComputedStyle(header).display !== 'none' ? header.offsetHeight : 0;
    const footerH = footer && window.getComputedStyle(footer).display !== 'none' ? footer.offsetHeight : 0;

    // Remove padding buffers on Mobile Landscape so the game can be as big as possible
    const paddingBuffer = isLandscapeMode ? 0 : (isMobile ? 10 : 40);

    // Desktop/Tablet has a max width. Mobile Landscape can use 100%.
    const maxWidth = isMobile ? window.innerWidth : 1000;

    // desktop constraint is 95% of window, mobile is full window width minus small margin
    let availableW = isMobile ? window.innerWidth : Math.min(window.innerWidth * 0.95, maxWidth);

    // restrict vertical space based on header/footer + safe area
    const safeTop = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top')) || 0;
    const safeBottom = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom')) || 0;
    const availableH = Math.max((window.innerHeight - headerH - footerH - safeTop - safeBottom - 60), 160);

    // STRICT 1.6 ASPECT RATIO (For Desktop/Tablet AND Portrait Mobile)
    const aspect = 800 / 500;
    const isPortraitMode = window.matchMedia("(max-width: 900px) and (orientation: portrait)").matches;

    // settle width/height with aspect ratio lock; prioritize fitting while avoiding overflow
    let newW = Math.min(availableW, maxWidth);
    let newH = newW / aspect;

    if (newH > availableH) {
        newH = availableH;
        newW = newH * aspect;
    }

    if (isMobile && !isPortraitMode) {
        // landscape mobile gets more height priority while preserving aspect ratio
        newH = Math.min(availableH, newH);
        newW = Math.min(availableW, newW);
    }

    // If perfectly scaled width makes it taller than available height, scale down by height (Desktop only)
    if (!isMobile && newH > availableH && availableH > 0) {
        newH = availableH;
        newW = availableH * aspect;
    }

    // Set container to the exact locked integer aspect size
    newH = Math.floor(newH);
    newW = Math.floor(newW);

    // Explicitly set the container size to prevent CSS stretching/squishing
    cont.style.width = `${newW}px`;
    cont.style.height = `${newH}px`;
    cont.style.maxWidth = 'none'; // Override CSS classes temporarily

    // Match header and footer width to the container for a unified block look
    if (header) {
        header.style.width = `${newW}px`;
        header.style.maxWidth = 'none';
    }
    if (footer) {
        footer.style.width = `${newW}px`;
        footer.style.maxWidth = 'none';
    }

    // Match canvas internal resolution to the exact geometry
    canvas.width = newW;
    canvas.height = newH;
    scaleX = newW / 800;
    scaleY = newH / 500;
}

// Handle window resize
window.addEventListener('resize', resizeCanvas);

// Handle orientation change for better mobile support
window.addEventListener('orientationchange', () => {
    setTimeout(resizeCanvas, 100);
});

// Global Next Level function (for overlay button)
window.nextLevel = nextLevel;
window.restartLevel = restartLevel;

hideMobileControls();
updateScoreUI();
loop();