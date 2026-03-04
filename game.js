const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const startScreen = document.getElementById('start-screen');
const winScreen = document.getElementById('win-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

const levelIntroScreen = document.getElementById('level-intro-screen');
const levelTitle = document.getElementById('level-title');
const levelDesc = document.getElementById('level-desc');

const cutsceneDialog = document.getElementById('cutscene-dialog');
const cutsceneText = document.getElementById('cutscene-text');

const uiOverlay = document.getElementById('ui-overlay');
const deathCountSpan = document.getElementById('death-count');

// Game State
let gameState = 'START'; // START, LEVEL_INTRO, PLAYING, CUTSCENE, WIN
let currentLevelIdx = 0;
let camera = { x: 0, targetX: 0, y: 0 };
let frameCount = 0;
let deathCount = 0; // Session death counter
let uiScale = 1;

// Controls
const keys = { right: false, left: false, up: false };

window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') keys.up = true;
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') keys.up = false;
});

// Mobile Controls
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const btnJump = document.getElementById('btn-jump');
const handleTouch = (btn, key) => {
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); keys[key] = true; btn.classList.add('active'); });
    btn.addEventListener('touchend', (e) => { e.preventDefault(); keys[key] = false; btn.classList.remove('active'); });
};
if (btnLeft && btnRight && btnJump) {
    handleTouch(btnLeft, 'left'); handleTouch(btnRight, 'right'); handleTouch(btnJump, 'up');
}

// -- Helpers --
function rectIntersect(r1, r2) {
    return r1.x < r2.x + r2.w && r1.x + r1.w > r2.x && r1.y < r2.y + r2.h && r1.y + r1.h > r2.y;
}

// -- Drawing Sprites --
function drawBaris(ctx, x, y, width, height, isJumping, lookDir) {
    let scale = width / 10;
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(x + 1 * scale, y + 0 * scale, 8 * scale, 2 * scale);
    ctx.fillRect(x + 1 * scale, y - 1 * scale, 2 * scale, 1 * scale);
    ctx.fillRect(x + 4 * scale, y - 1 * scale, 2 * scale, 1 * scale);
    ctx.fillRect(x + 7 * scale, y - 1 * scale, 1 * scale, 1 * scale);
    ctx.fillRect(x + 0 * scale, y + 1 * scale, 2 * scale, 2 * scale);
    ctx.fillStyle = '#fce2c4';
    ctx.fillRect(x + 2 * scale, y + 2 * scale, 6 * scale, 3 * scale);
    ctx.fillStyle = '#4e342e';
    ctx.fillRect(x + 2 * scale, y + 4.5 * scale, 6 * scale, 1 * scale);
    ctx.fillRect(x + 4 * scale, y + 4 * scale, 2 * scale, 0.5 * scale);
    ctx.fillStyle = '#000';
    let eyeOff = lookDir < 0 ? 0 : 1;
    ctx.fillRect(x + (3 + eyeOff) * scale, y + 3 * scale, 1 * scale, 1 * scale);
    ctx.fillRect(x + (5 + eyeOff) * scale, y + 3 * scale, 1 * scale, 1 * scale);
    ctx.fillStyle = '#d7ccc8';
    ctx.fillRect(x + 1 * scale, y + 5 * scale, 8 * scale, 4 * scale);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 4 * scale, y + 5 * scale, 2 * scale, 3 * scale);
    ctx.fillStyle = '#d7ccc8';
    if (isJumping) {
        ctx.fillRect(x + 0 * scale, y + 4 * scale, 2 * scale, 3 * scale);
        ctx.fillRect(x + 8 * scale, y + 4 * scale, 2 * scale, 3 * scale);
    } else {
        ctx.fillRect(x + 0 * scale, y + 5 * scale, 2 * scale, 3 * scale);
        ctx.fillRect(x + 8 * scale, y + 5 * scale, 2 * scale, 3 * scale);
    }
    ctx.fillStyle = '#fce2c4';
    if (isJumping) {
        ctx.fillRect(x + 0 * scale, y + 3 * scale, 2 * scale, 1 * scale);
        ctx.fillRect(x + 8 * scale, y + 3 * scale, 2 * scale, 1 * scale);
    } else {
        ctx.fillRect(x + 0.5 * scale, y + 8 * scale, 1 * scale, 1 * scale);
        ctx.fillRect(x + 8.5 * scale, y + 8 * scale, 1 * scale, 1 * scale);
    }
    ctx.fillStyle = '#1565c0';
    ctx.fillRect(x + 2 * scale, y + 9 * scale, 6 * scale, 2 * scale);
    ctx.fillStyle = '#eeeeee';
    if (isJumping) {
        ctx.fillRect(x + 1 * scale, y + 10 * scale, 3 * scale, 1 * scale);
        ctx.fillRect(x + 6 * scale, y + 10 * scale, 3 * scale, 1 * scale);
    } else {
        ctx.fillRect(x + 2 * scale, y + 11 * scale, 2 * scale, 1 * scale);
        ctx.fillRect(x + 6 * scale, y + 11 * scale, 2 * scale, 1 * scale);
    }
}

function drawDamla(ctx, x, y, width, height) {
    let scale = width / 10;
    ctx.fillStyle = '#4e342e';
    ctx.fillRect(x + 1 * scale, y + 1 * scale, 8 * scale, 9 * scale);
    ctx.fillRect(x + 0 * scale, y + 4 * scale, 10 * scale, 6 * scale);
    ctx.fillStyle = '#fce2c4';
    ctx.fillRect(x + 2 * scale, y + 2 * scale, 6 * scale, 3 * scale);
    ctx.fillStyle = '#4e342e';
    ctx.fillRect(x + 2 * scale, y + 1 * scale, 6 * scale, 1 * scale);
    ctx.fillRect(x + 1 * scale, y + 2 * scale, 1 * scale, 3 * scale);
    ctx.fillRect(x + 8 * scale, y + 2 * scale, 1 * scale, 3 * scale);
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 3 * scale, y + 3 * scale, 1 * scale, 1 * scale);
    ctx.fillRect(x + 6 * scale, y + 3 * scale, 1 * scale, 1 * scale);
    ctx.fillStyle = '#d81b60';
    ctx.fillRect(x + 4 * scale, y + 4.5 * scale, 2 * scale, 0.5 * scale);
    ctx.fillStyle = 'rgba(255, 105, 180, 0.4)';
    ctx.fillRect(x + 2 * scale, y + 4 * scale, 1.5 * scale, 1 * scale);
    ctx.fillRect(x + 6.5 * scale, y + 4 * scale, 1.5 * scale, 1 * scale);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 1 * scale, y + 6 * scale, 8 * scale, 3 * scale);
    ctx.fillRect(x + 0 * scale, y + 7 * scale, 2 * scale, 2 * scale);
    ctx.fillRect(x + 8 * scale, y + 7 * scale, 2 * scale, 2 * scale);
    ctx.fillStyle = '#fce2c4';
    ctx.fillRect(x + 3 * scale, y + 5 * scale, 4 * scale, 1 * scale);
    ctx.fillStyle = '#1976d2';
    ctx.fillRect(x + 2 * scale, y + 9 * scale, 6 * scale, 2 * scale);
    ctx.fillStyle = '#fce2c4';
    ctx.fillRect(x + 0 * scale, y + 9 * scale, 1.5 * scale, 1.5 * scale);
    ctx.fillRect(x + 8.5 * scale, y + 9 * scale, 1.5 * scale, 1.5 * scale);
}

function drawDog(ctx, x, y, w, h, dir) {
    let sc = w / 10;
    ctx.fillStyle = '#8d6e63';
    ctx.fillRect(x + 2 * sc, y + 4 * sc, 6 * sc, 4 * sc); // Body
    let hx = dir === 1 ? x + 6 * sc : x;
    ctx.fillRect(hx, y + 2 * sc, 4 * sc, 4 * sc); // Head
    let sx = dir === 1 ? x + 8 * sc : x - 2 * sc;
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(sx, y + 4 * sc, 4 * sc, 2 * sc); // Snout
    ctx.fillStyle = '#000';
    let ex = dir === 1 ? x + 7 * sc : x + 2 * sc;
    ctx.fillRect(ex, y + 3 * sc, 1 * sc, 1 * sc); // Eye
    ctx.fillStyle = '#4e342e';
    ctx.fillRect(x + 2 * sc, y + 8 * sc, 2 * sc, 2 * sc); // Legs
    ctx.fillRect(x + 6 * sc, y + 8 * sc, 2 * sc, 2 * sc);
    let tx = dir === 1 ? x + 1 * sc : x + 8 * sc;
    ctx.fillRect(tx, y + 3 * sc, 1 * sc, 3 * sc); // Tail
}

// -- Entities --
class Entity {
    constructor(x, y, w, h) {
        this.x = x; this.y = y; this.w = w; this.h = h;
        this.solid = false;
        this.deadly = false;
        this.active = true;
    }
    update(player) { }
    draw(ctx) { }
}

// -- Audio Engine --
let audioCtx = null;
let musicInterval = null;

const levelMelodies = [
    [330, 0, 330, 0, 330, 0, 262, 330, 392, 0, 0, 0, 196, 0, 0, 0],      // 1: Park (Classic)
    [150, 0, 160, 0, 150, 140, 150, 0],                          // 2: Construction (Industrial)
    [220, 220, 440, 440, 220, 0, 440, 0],                 // 3: Subway (Fast paced)
    [261, 329, 392, 523, 392, 329],                       // 4: Rain (Soft arpeggio)
    [440, 0, 880, 0, 440, 0, 880, 0],                     // 5: Rooftops (Windy/High)
    [100, 110, 120, 150, 100, 110, 120, 150],             // 6: Traffic (Chaotic)
    [300, 400, 500, 600, 500, 400],                       // 7: Mall (Muzak)
    [100, 0, 0, 0, 90, 0, 0, 0],                          // 8: Dark (Slow tension)
    [200, 300, 250, 350, 300, 400],                       // 9: Bridge (Swaying)
    [440, 493, 523, 587, 659, 698, 783, 880]              // 10: Final (Triumphant ascent)
];

function playLevelMusic(levelIdx) {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (musicInterval) clearInterval(musicInterval);

    let melody = levelMelodies[levelIdx] || levelMelodies[0];
    let noteIdx = 0;
    let tempo = 150;
    if (levelIdx === 2 || levelIdx === 5) tempo = 100; // Faster
    if (levelIdx === 7) tempo = 300; // Slower

    musicInterval = setInterval(() => {
        if (gameState !== 'PLAYING') return;
        let note = melody[noteIdx];
        if (note > 0 && audioCtx.state === 'running') {
            let osc = audioCtx.createOscillator();
            let gain = audioCtx.createGain();

            // Adjust waveforms based on level
            osc.type = (levelIdx === 1 || levelIdx === 5) ? 'sawtooth' : 'square';
            if (levelIdx === 3 || levelIdx === 8) osc.type = 'sine';
            if (levelIdx === 4 || levelIdx === 7) osc.type = 'triangle';

            osc.frequency.setValueAtTime(note, audioCtx.currentTime);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (tempo / 1000) * 0.9);
            osc.stop(audioCtx.currentTime + (tempo / 1000));
        }
        noteIdx = (noteIdx + 1) % melody.length;
    }, tempo);
}

class Platform extends Entity {
    constructor(x, y, w, h, props = {}) {
        super(x, y, w, h);
        this.solid = true;
        this.colorTop = props.colorTop || '#27ae60';
        this.colorBase = props.colorBase || '#6e4b30';
        this.friction = props.friction || 0.8;
        this.conveyorSpeed = props.conveyorSpeed || 0;
    }
    draw(ctx) {
        if (!this.active) return;
        ctx.fillStyle = this.colorBase;
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.fillStyle = this.colorTop;
        ctx.fillRect(this.x, this.y, this.w, Math.min(15, this.h));
    }
}

class BreakablePlatform extends Platform {
    constructor(x, y, w, h, props = {}) {
        super(x, y, w, h, props);
        this.breakTimer = props.breakTime || 60; // frames
        this._origBreakTimer = this.breakTimer; // for reset on death
        this.stepped = false;
    }
    update(player) {
        if (!this.active) return;
        // Logic handled in player collision mostly, but we trigger the timer here.
        if (this.stepped) {
            this.breakTimer--;
            if (this.breakTimer <= 0) this.active = false;
        }
    }
    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        if (this.stepped && this.breakTimer < 30) {
            ctx.translate((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4); // shake
        }
        super.draw(ctx);
        // Draw cracks
        ctx.strokeStyle = '#000';
        ctx.beginPath();
        ctx.moveTo(this.x + 10, this.y);
        ctx.lineTo(this.x + 20, this.y + 10);
        ctx.stroke();
        ctx.restore();
    }
}

class MovingPlatform extends Platform {
    constructor(x, y, w, h, props = {}) {
        super(x, y, w, h, props);
        this.startX = x; this.startY = y;
        this.rangeX = props.rangeX || 0;
        this.rangeY = props.rangeY || 0;
        this.speed = props.speed || 0.05;
        this.offset = props.offset || 0;
        this.dx = 0; this.dy = 0;
    }
    update() {
        let oldX = this.x; let oldY = this.y;
        this.x = this.startX + Math.sin(frameCount * this.speed + this.offset) * this.rangeX;
        this.y = this.startY + Math.cos(frameCount * this.speed + this.offset) * this.rangeY;
        this.dx = this.x - oldX;
        this.dy = this.y - oldY;
    }
    resetState() {
        this.x = this.startX;
        this.y = this.startY;
        this.dx = 0;
        this.dy = 0;
    }
}

class Hazard extends Entity {
    constructor(x, y, w, h, props = {}) {
        super(x, y, w, h);
        this.deadly = true;
        this.color = props.color || '#e74c3c';
        this.type = props.type || 'spike';
    }
    draw(ctx) {
        if (!this.active) return;
        ctx.fillStyle = this.color;
        if (this.type === 'spike') {
            for (let i = 0; i < this.w; i += 10) {
                ctx.beginPath();
                ctx.moveTo(this.x + i, this.y + this.h);
                ctx.lineTo(this.x + i + 5, this.y);
                ctx.lineTo(this.x + i + 10, this.y + this.h);
                ctx.fill();
            }
        } else {
            ctx.fillRect(this.x, this.y, this.w, this.h);
        }
    }
}

class Enemy extends Hazard {
    constructor(x, y, w, h, props = {}) {
        super(x, y, w, h, props);
        this.startX = x;
        this.startY = y;
        this.patrolDist = props.patrolDist || 100;
        this.speed = props.speed || 1;
        this.dir = 1;
        this.enemyType = props.enemyType || 'dog';
        this.vy = 0;
    }
    update(player, level) {
        // Gravity
        this.vy += 0.6;
        this.y += this.vy;

        // Land on solid platforms
        if (level) {
            for (let e of level.entities) {
                if (!e.active || !e.solid || e === this) continue;
                let prev = { x: this.x, y: this.y - this.vy, w: this.w, h: this.h };
                if (rectIntersect(this, e) && this.vy > 0) {
                    this.y = e.y - this.h;
                    this.vy = 0;
                }
            }
        }

        // Deactivate if fallen off screen
        if (this.y > 830) { this.active = false; return; }

        if (this.enemyType === 'guard' && Math.abs(player.x - this.x) < 300) {
            // Chase AI
            if (player.x > this.x) this.dir = 1;
            else this.dir = -1;
            this.x += this.speed * 1.5 * this.dir;
        } else {
            // Patrol
            this.x += this.speed * this.dir;
            if (this.x > this.startX + this.patrolDist) this.dir = -1;
            if (this.x < this.startX) this.dir = 1;
        }
    }
    draw(ctx) {
        if (this.enemyType === 'dog') {
            drawDog(ctx, this.x, this.y, this.w, this.h, this.dir);
            ctx.fillStyle = '#fff';
            ctx.font = '10px "Press Start 2P"';
            ctx.fillText("Hav!", this.x, this.y - 10);
        } else if (this.enemyType === 'guard') {
            // Detailed Pixel Art Guard
            let cx = this.x;
            let cy = this.y;
            let isRight = this.dir === 1;
            let walkCycle = Math.sin(frameCount * 0.3);
            let legOffset = walkCycle * 5;
            let armOffset = -walkCycle * 4;

            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(cx + 6, cy + this.h - 2, 28, 2);

            // Back Arm
            ctx.fillStyle = '#1a252f';
            ctx.fillRect(cx + 18 - (isRight ? armOffset : -armOffset), cy + 18, 8, 12);
            ctx.fillStyle = '#f3acc'; // Hand
            ctx.fillRect(cx + 18 - (isRight ? armOffset : -armOffset), cy + 30, 8, 4);

            // Back Leg
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(cx + 14 - (isRight ? legOffset : -legOffset), cy + 32, 8, 12);
            ctx.fillStyle = '#000'; // shoe
            ctx.fillRect(cx + 12 - (isRight ? legOffset : -legOffset) + (isRight ? 2 : -2), cy + 44, 12, 4);

            // Torso (Dark Blue uniform)
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(cx + 10, cy + 16, 20, 16);

            // Shoulders/Epaulettes
            ctx.fillStyle = '#f1c40f'; // yellow trims
            ctx.fillRect(cx + 8, cy + 16, 4, 3);
            ctx.fillRect(cx + 28, cy + 16, 4, 3);

            // Head and Cap
            ctx.fillStyle = '#f3acc'; // Skin Head (tan)
            ctx.fillRect(cx + 12, cy + 6, 16, 10);

            ctx.fillStyle = '#2980b9'; // Cap Body
            ctx.fillRect(cx + 10, cy + 2, 20, 4);
            ctx.fillStyle = '#1a252f'; // Cap Visor
            ctx.fillRect(cx + (isRight ? 16 : 8), cy + 4, 16, 2);

            // Badge on cap
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(cx + 18, cy + 1, 4, 4);

            // Eye
            ctx.fillStyle = '#fff';
            ctx.fillRect(cx + (isRight ? 20 : 16), cy + 8, 4, 4);
            ctx.fillStyle = '#000';
            ctx.fillRect(cx + (isRight ? 22 : 16), cy + 9, 2, 2);

            // Mustache
            ctx.fillStyle = '#7f8c8d';
            ctx.fillRect(cx + (isRight ? 20 : 12), cy + 13, 8, 2);

            // Front Leg
            ctx.fillStyle = '#1a252f'; // pants front
            ctx.fillRect(cx + 18 + (isRight ? legOffset : -legOffset), cy + 32, 8, 12);
            ctx.fillStyle = '#000'; // shoe
            ctx.fillRect(cx + 16 + (isRight ? legOffset : -legOffset) + (isRight ? 2 : -2), cy + 44, 12, 4);

            // Front Arm
            ctx.fillStyle = '#2c3e50'; // sleeve
            ctx.fillRect(cx + 14 + (isRight ? armOffset : -armOffset), cy + 18, 8, 12);
            ctx.fillStyle = '#f3acc'; // hand
            ctx.fillRect(cx + 14 + (isRight ? armOffset : -armOffset), cy + 30, 8, 4);

            // Chest Badge
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(cx + 20, cy + 20, 4, 4);

            // Voice Text Bubble
            if (this.dir !== 0 && frameCount % 60 < 40) { // simple blink
                ctx.fillStyle = '#fff';
                ctx.font = '10px "Press Start 2P"';
                ctx.fillText("Dur!", cx + 8, cy - 8);
            }
        } else if (this.enemyType === 'pedestrian') {
            // Detailed Pixel Art Pedestrian
            let cx = this.x;
            let cy = this.y;

            // Body parts mapping based on direction
            let isRight = this.dir === 1;

            // Walking animation offset for legs and arms
            let walkCycle = Math.sin(frameCount * 0.2);
            let legOffset = walkCycle * 4;
            let armOffset = -walkCycle * 3; // opposite to leg

            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(cx + 4, cy + this.h - 2, 20, 2);

            // Back Arm
            ctx.fillStyle = '#2980b9'; // darker shirt sleeve
            ctx.fillRect(cx + 12 - (isRight ? armOffset : -armOffset), cy + 16, 6, 10);
            ctx.fillStyle = '#f39c12'; // hand
            ctx.fillRect(cx + 12 - (isRight ? armOffset : -armOffset), cy + 26, 6, 4);

            // Back Leg
            ctx.fillStyle = '#2c3e50'; // dark pants
            ctx.fillRect(cx + 10 - (isRight ? legOffset : -legOffset), cy + 28, 6, 10);
            ctx.fillStyle = '#000'; // shoe
            ctx.fillRect(cx + 10 - (isRight ? legOffset : -legOffset) + (isRight ? 2 : -2), cy + 38, 8, 4);

            // Torso (Shirt)
            ctx.fillStyle = this.color;
            ctx.fillRect(cx + 6, cy + 14, 16, 14);

            // Head and Hair
            ctx.fillStyle = '#f1c40f'; // blonde/brownish hair
            ctx.fillRect(cx + 8, cy + 2, 14, 6);
            ctx.fillStyle = '#f39c12'; // Skin Head
            ctx.fillRect(cx + 9, cy + 4, 12, 10);
            ctx.fillStyle = '#f1c40f'; // hair bangs
            ctx.fillRect(cx + (isRight ? 16 : 8), cy + 4, 4, 3);

            // Eye
            ctx.fillStyle = '#fff';
            ctx.fillRect(cx + (isRight ? 16 : 10), cy + 7, 4, 4);
            ctx.fillStyle = '#000';
            ctx.fillRect(cx + (isRight ? 18 : 10), cy + 8, 2, 2);

            // Front Leg
            ctx.fillStyle = '#34495e'; // pants
            ctx.fillRect(cx + 12 + (isRight ? legOffset : -legOffset), cy + 28, 6, 10);
            ctx.fillStyle = '#000'; // shoe
            ctx.fillRect(cx + 12 + (isRight ? legOffset : -legOffset) + (isRight ? 2 : -2), cy + 38, 8, 4);

            // Front Arm
            ctx.fillStyle = this.color; // shirt sleeve
            ctx.fillRect(cx + 10 + (isRight ? armOffset : -armOffset), cy + 16, 6, 10);
            ctx.fillStyle = '#f39c12'; // hand
            ctx.fillRect(cx + 10 + (isRight ? armOffset : -armOffset), cy + 26, 6, 4);

        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.w, this.h);
            ctx.fillStyle = '#fff';
            ctx.font = '10px "Press Start 2P"';
            ctx.fillText("!", this.x, this.y - 10);
        }
    }
}

class StreetLamp extends Entity {
    constructor(x, y, w, h, props = {}) {
        super(x, y, w, h);
        this.color = props.color || '#34495e'; // pole color
        this.baseOn = true;
        this.flickerTimer = 0;
    }
    update() {
        this.flickerTimer++;
        if (this.flickerTimer > 10) {
            if (Math.random() < 0.05) this.baseOn = !this.baseOn;
            if (Math.random() < 0.2) this.baseOn = true; // favors staying on
            this.flickerTimer = 0;
        }
    }
    draw(ctx) {
        // draw pole
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x + this.w / 2 - 4, this.y, 8, this.h);

        // draw lamp head
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(this.x + this.w / 2 - 15, this.y - 5, 30, 10);

        // draw bulb
        if (this.baseOn) {
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(this.x + this.w / 2 - 10, this.y - 2, 20, 6);
            ctx.fillStyle = 'rgba(241, 196, 15, 0.3)';
            ctx.beginPath();
            ctx.arc(this.x + this.w / 2, this.y, 20, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = '#7f8c8d';
            ctx.fillRect(this.x + this.w / 2 - 10, this.y - 2, 20, 6);
        }
    }
}

class Vehicle extends Hazard {
    constructor(x, y, w, h, props = {}) {
        super(x, y, w, h, props);
        this.speed = props.speed || -5;
        this.resetX = props.resetX || 3000;
        this.spawnX = props.spawnX !== undefined ? props.spawnX : x;
        this.x = this.spawnX; // start from the proper spawn point, not initial x
        this.color = props.color || '#34495e';
        this.type = props.type || 'car';
    }
    update() {
        this.x += this.speed;
        if ((this.speed < 0 && this.x < -200) || (this.speed > 0 && this.x > this.resetX)) {
            this.x = this.spawnX;
        }
    }
    resetState() {
        this.x = this.spawnX;
    }
    draw(ctx) {
        if (this.type === 'train') {
            let sc = this.h / 10;
            // Main Body
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.w, this.h);

            // Roof / details
            ctx.fillStyle = '#95a5a6';
            ctx.fillRect(this.x, this.y - 4, this.w, 4);

            // Windows
            ctx.fillStyle = '#f1c40f'; // Bright light inside
            for (let wx = 10; wx < this.w - 20; wx += 40) {
                ctx.fillRect(this.x + wx, this.y + 10, 20, 15);
            }

            // Headlights / Taillights
            ctx.fillStyle = this.speed < 0 ? '#f1c40f' : '#e74c3c';
            ctx.fillRect(this.x, this.y + this.h - 15, 10, 10);

            ctx.fillStyle = this.speed < 0 ? '#e74c3c' : '#f1c40f';
            ctx.fillRect(this.x + this.w - 10, this.y + this.h - 15, 10, 10);

            // Doors
            ctx.fillStyle = '#7f8c8d';
            for (let dx = 30; dx < this.w - 30; dx += 80) {
                ctx.fillRect(this.x + dx, this.y + 5, 15, this.h - 5);
            }
        } else {
            // Pixel Art Car
            // Main Body
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y + 15, this.w, this.h - 15);

            // Cabin (Top part)
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x + 20, this.y, this.w - 40, 15);

            // Windows
            ctx.fillStyle = '#87CEEB'; // light blue tint
            ctx.fillRect(this.x + 25, this.y + 2, 25, 13); // back/front window
            ctx.fillRect(this.x + 55, this.y + 2, 35, 13); // middle window

            // Wheels
            ctx.fillStyle = '#111';
            let wheelSize = 12;
            ctx.beginPath();
            ctx.arc(this.x + 25, this.y + this.h, wheelSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + this.w - 25, this.y + this.h, wheelSize, 0, Math.PI * 2);
            ctx.fill();

            // Rims
            ctx.fillStyle = '#bdc3c7';
            ctx.beginPath();
            ctx.arc(this.x + 25, this.y + this.h, wheelSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(this.x + this.w - 25, this.y + this.h, wheelSize / 2, 0, Math.PI * 2);
            ctx.fill();

            // Headlights
            ctx.fillStyle = '#f1c40f';
            if (this.speed < 0) {
                ctx.fillRect(this.x, this.y + 20, 8, 8); // Facing left
                ctx.fillStyle = '#e74c3c'; // Taillight
                ctx.fillRect(this.x + this.w - 5, this.y + 20, 5, 8);
            } else {
                ctx.fillRect(this.x + this.w - 8, this.y + 20, 8, 8); // Facing right
                ctx.fillStyle = '#e74c3c'; // Taillight
                ctx.fillRect(this.x, this.y + 20, 5, 8);
            }
        }
    }
}

class Trigger extends Entity {
    constructor(x, y, w, h, action, props = {}) {
        super(x, y, w, h);
        this.action = action; // function(player)
        this.cooldown = 0;
        this.isSwing = props.isSwing || false;
    }
    update() {
        if (this.cooldown > 0) this.cooldown--;
    }
    draw(ctx) {
        if (this.isSwing) {
            ctx.strokeStyle = '#d35400';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.x + this.w / 2, -800);
            ctx.lineTo(this.x + this.w / 2, this.y + this.h);
            ctx.stroke();
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(this.x + 5, this.y + this.h - 10, this.w - 10, 15);
        }
    }
}

class HonkTimer extends Entity {
    constructor(intervalFrames) {
        super(0, 0, 0, 0);
        this.interval = intervalFrames;
        this.timer = intervalFrames;
    }
    update(player) {
        this.timer--;
        if (this.timer <= 0) {
            player.stun = 30; // 30 frames stun
            player.vx = 0; // stop dead
            this.timer = this.interval;
        }
    }
}

// -- Player --
class Player {
    constructor() {
        this.w = 40; this.h = 40;
        this.reset();
    }
    reset() {
        this.x = 100; this.y = 200;
        this.vx = 0; this.vy = 0;
        this.grounded = false;
        this.lookDir = 1;
        this.speed = 0.5;
        this.maxSpeed = 5.5;
        this.friction = 0.8;
        this.baseJumpPower = -14;
        this.gravity = 0.7;
        this.cutsceneMode = false;
        this.bounceCooldown = 0;
        this.stun = 0;
    }

    update(level) {
        if (this.cutsceneMode) return;
        if (this.bounceCooldown > 0) this.bounceCooldown--;
        if (this.stun > 0) {
            this.stun--;
            this.vx *= 0.5; // quickly slow down
        } else {
            let levelFriction = level.globalFriction || 0.8;
            let currentFriction = this.grounded ? levelFriction : 0.95;

            // Apply global wind (skip if wind would push player into the left wall)
            if (level.wind) {
                if (!(level.wind < 0 && this.x <= 0)) {
                    this.vx += level.wind;
                }
            }
            // Boost movement speed on wind levels so player can fight wind
            if (level.wind && Math.abs(level.wind) > 0.5) this.speed = 1.5;

            if (keys.right) {
                this.vx += this.speed;
                this.lookDir = 1;
            } else if (keys.left) {
                this.vx -= this.speed;
                this.lookDir = -1;
            } else {
                this.vx *= currentFriction;
            }
        }

        if (this.vx > this.maxSpeed) this.vx = this.maxSpeed;
        if (this.vx < -this.maxSpeed) this.vx = -this.maxSpeed;

        this.x += this.vx;

        // X Collisions
        for (let e of level.entities) {
            if (!e.active) continue;
            if (e.deadly && rectIntersect(this, e)) { die(); return; }
            if (e.solid && rectIntersect(this, e)) {
                // Tolerance: only collide horizontally if significantly intersecting the side (not just the top/bottom edge)
                let isSideCollision = (this.y + this.h > e.y + 8 && this.y < e.y + e.h - 8);
                if (isSideCollision) {
                    if (this.vx > 0) this.x = e.x - this.w;
                    else if (this.vx < 0) this.x = e.x + e.w;
                    this.vx = 0;
                }
            }
            if (e instanceof Trigger && rectIntersect(this, e) && e.cooldown === 0) {
                e.action(this);
            }
        }

        if (keys.up && this.grounded && this.stun <= 0) {
            this.vy = this.baseJumpPower;
            this.grounded = false;
        }

        this.vy += this.gravity;
        if (this.vy > 15) this.vy = 15;
        this.y += this.vy;

        this.grounded = false;
        let standingPlatform = null;

        // Y Collisions
        for (let e of level.entities) {
            if (!e.active) continue;
            if (e.deadly && rectIntersect(this, e)) { die(); return; }
            if (e.solid && rectIntersect(this, e)) {
                if (this.vy > 0) {
                    this.y = e.y - this.h;
                    this.vy = 0;
                    this.grounded = true;
                    standingPlatform = e;
                    if (e.conveyorSpeed) this.x += e.conveyorSpeed;
                    if (e instanceof BreakablePlatform) e.stepped = true;
                } else if (this.vy < 0) {
                    this.y = e.y + e.h;
                    this.vy = e instanceof MovingPlatform && e.dy > 0 ? e.dy : 0;
                }
            }
        }

        // Stick to moving platforms
        if (standingPlatform instanceof MovingPlatform) {
            this.x += standingPlatform.dx;
            this.y += standingPlatform.dy; // Allow falling with the platform

            // Re-check grounded status if platform moved down faster than gravity
            if (standingPlatform.dy > 0) {
                // Player is forced down with the platform to avoid "floating"
                this.vy = standingPlatform.dy;
            }
        }

        if (this.y > 800) die();
        if (this.x < 0) { this.x = 0; this.vx = 0; }

        // Goal Check
        if (rectIntersect(this, level.goal)) {
            levelComplete(); return;
        }
    }

    draw(ctx) {
        ctx.save();
        if (this.stun > 0) {
            ctx.translate((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5); // Stun shake
            ctx.fillStyle = 'red';
            ctx.fillText("!", this.x + 15, this.y - 10);
        }
        drawBaris(ctx, this.x, this.y, this.w, this.h, !this.grounded, this.lookDir);
        ctx.restore();
    }
}

// -- Level Definitions --
const levels = [
    // L1: Park
    {
        title: "1. Bölüm", desc: "Tema: Mahalle Parkı\nSalıncağa zıpla ve fırla!", bgColor: '#87CEEB', globalFriction: 0.8,
        goal: { x: 2600, y: 350, w: 50, h: 100 },
        entities: [
            new Platform(0, 500, 500, 200, { colorTop: '#27ae60' }),
            new Platform(600, 450, 200, 200, { colorTop: '#f4a460', colorBase: '#d2b48c', friction: 0.9 }),
            new Enemy(650, 410, 40, 40, { color: '#8d6e63', enemyType: 'dog', patrolDist: 100, speed: 0.5 }),
            new Platform(950, 380, 150, 300),
            new Trigger(1250, 200, 60, 60, (p) => { p.vy = -16; p.vx = 11; p.bounceCooldown = 30; p.y -= 10; }, { isSwing: true }),
            new Platform(1450, 420, 400, 200),
            new Platform(2000, 360, 150, 400),
            new Platform(2300, 450, 500, 200)
        ]
    },
    // L2: Construction
    {
        title: "2. Bölüm", desc: "Tema: İnşaat Alanı\nVinçlere dikkat et!", bgColor: '#0b001a', globalFriction: 0.8, // Night Sky
        goal: { x: 2800, y: 200, w: 50, h: 100 },
        entities: [
            new Platform(0, 500, 300, 200, { colorTop: '#7f8c8d', colorBase: '#bdc3c7' }),
            new Platform(400, 450, 80, 20),
            new Hazard(500, 480, 80, 20, { type: 'spike' }),
            new Platform(600, 400, 150, 300),
            new MovingPlatform(850, 350, 150, 20, { rangeY: 150, speed: 0.03, colorTop: '#f1c40f', colorBase: '#f39c12' }),
            new Platform(1070, 300, 150, 400),
            new Platform(1350, 420, 300, 20, { friction: 0.98, colorTop: '#e67e22' }), // slippery downward drop
            new Hazard(1450, 440, 100, 400, { type: 'abyss', color: 'transparent' }),
            new MovingPlatform(1800, 360, 150, 20, { rangeX: 130, speed: 0.04 }), // Lowered vertical jump, decreased range slightly
            new Platform(2100, 300, 150, 500), // Target platform lowered to 300
            new Platform(2400, 400, 150, 300),
            new Platform(2700, 300, 500, 400)
        ]
    },
    // L3: Subway
    {
        title: "3. Bölüm", desc: "Tema: Metro İstasyonu\nTers merdivenlere ve trene dikkat!", bgColor: '#2c3e50', globalFriction: 0.8,
        goal: { x: 3200, y: 400, w: 50, h: 100 },
        entities: [
            new Platform(0, 450, 400, 200, { colorTop: '#95a5a6' }),
            new Platform(500, 450, 300, 200, { colorTop: '#7f8c8d', conveyorSpeed: -2 }), // Reverse escal
            new Platform(900, 400, 200, 300),
            new Platform(1200, 550, 700, 50, { colorTop: '#34495e', colorBase: '#2c3e50' }), // Tracks lengthened
            new Vehicle(1800, 500, 400, 50, { speed: -12, color: '#c0392b', spawnX: 2500, resetX: 1000, type: 'train' }), // Train
            new Platform(1950, 500, 150, 200), // First step from tracks
            new Platform(2250, 430, 150, 300), // Second step up (lowered from 350 to 430 so it's only a 70px vertical jump)
            new Platform(2550, 400, 200, 300, { conveyorSpeed: 3 }), // Fast escal
            new Platform(2900, 500, 500, 200)
        ]
    },
    // L4: Rainy Street
    {
        title: "4. Bölüm", desc: "Tema: Yağmurlu Sokak\nZemin kaygan, koşunca durmak zor.", bgColor: '#0f172a', globalFriction: 0.96,
        goal: { x: 2700, y: 430, w: 50, h: 100 },
        entities: [
            new Platform(0, 500, 600, 200, { colorTop: '#34495e' }),
            new Trigger(300, 490, 150, 20, (p) => { p.vx *= 0.8; }), // Puddle
            new Platform(700, 500, 800, 200, { colorTop: '#34495e' }),
            new Vehicle(1500, 460, 120, 40, { speed: -6, color: '#f39c12', spawnX: 2000, resetX: 500 }),
            new Vehicle(1000, 460, 120, 40, { speed: -4, color: '#2980b9', spawnX: 2000, resetX: 500 }),
            new Platform(1600, 400, 200, 300),
            new Platform(1950, 300, 150, 400),
            new Platform(2200, 500, 700, 200, { colorTop: '#34495e' }) // Long final platform that hosts the goal
        ]
    },
    // L5: Rooftops
    {
        title: "5. Bölüm", desc: "Tema: Çatılar\nRüzgara karşı diren!", bgColor: '#1a0b2e', wind: -0.6, globalFriction: 0.8,
        goal: { x: 3000, y: 320, w: 50, h: 100 },
        entities: [
            new Platform(0, 500, 500, 200, { colorTop: '#27ae60' }),
            new Platform(600, 460, 180, 200, { colorTop: '#f4a460', colorBase: '#d2b48c' }),
            new Enemy(620, 420, 40, 40, { color: '#8d6e63', enemyType: 'dog', patrolDist: 80, speed: 0.5 }),
            new Platform(870, 420, 140, 300),           // +1: hafif yüksek
            new Platform(1090, 390, 130, 300),          // +2: biraz daha yüksek
            new Platform(1300, 390, 130, 300),          // +3: aynı seviye
            new Platform(1500, 360, 120, 300),          // +4: biraz yüksek
            new MovingPlatform(1700, 360, 120, 20, { rangeY: 80, speed: 0.04 }), // hareketli, aynı bölge
            new Platform(1880, 350, 120, 300),          // +5: inişli platform
            new Platform(2060, 360, 120, 300),          // +6
            new Platform(2250, 340, 130, 300, { colorTop: '#c0392b' }), // çatı binası
            new Hazard(2290, 295, 10, 45, { type: 'antenna', color: '#7f8c8d' }),
            new Platform(2450, 360, 120, 300),
            new Platform(2650, 340, 120, 300),
            new Platform(2850, 330, 250, 300)           // son düzlük + goal
        ]
    },
    // L6: Traffic
    {
        title: "6. Bölüm", desc: "Tema: Trafik Ağı\nKorna çaldığında sersemlersin, dikkat et!", bgColor: '#0b001a', globalFriction: 0.8,
        goal: { x: 3450, y: 380, w: 50, h: 100 },
        entities: [
            new HonkTimer(200), // Honks every ~3.3s
            new Platform(0, 500, 300, 200, { colorTop: '#95a5a6' }),
            new Platform(400, 500, 2600, 200, { colorTop: '#34495e' }), // road
            new Vehicle(800, 460, 120, 40, { speed: 8, color: '#f1c40f', spawnX: -600, resetX: 3500 }),
            new Vehicle(1400, 460, 120, 40, { speed: -9, color: '#e74c3c', spawnX: 3500, resetX: 300 }),
            new Vehicle(2000, 460, 120, 40, { speed: 10, color: '#9b59b6', spawnX: -1200, resetX: 3500 }),
            // "Pedestrians"
            new Enemy(600, 460, 30, 40, { color: '#ecf0f1', enemyType: 'pedestrian', speed: 0.5, patrolDist: 50 }),
            new Enemy(1200, 460, 30, 40, { color: '#ecf0f1', enemyType: 'pedestrian', speed: 0.5, patrolDist: 50 }),
            new Enemy(2200, 460, 30, 40, { color: '#ecf0f1', enemyType: 'pedestrian', speed: 0.5, patrolDist: 50 }),
            new Platform(2800, 400, 300, 300),   // yüksek platform
            new Platform(3150, 410, 180, 300),   // köprü 1
            new Platform(3380, 400, 200, 300)    // son düzlük + çıkış
        ]
    },
    // L7: Mall
    {
        title: "7. Bölüm", desc: "Tema: Alışveriş Merkezi\nGüvenliğe yakalanma!", bgColor: '#ecf0f1', globalFriction: 0.94,
        goal: { x: 2980, y: 200, w: 50, h: 100 },
        entities: [
            new Platform(0, 500, 400, 200, { colorTop: '#bdc3c7', friction: 0.94 }),
            new Platform(400, 500, 400, 200, { conveyorSpeed: 2, colorTop: '#34495e' }), // band forward
            new Enemy(900, 460, 40, 40, { color: '#34495e', enemyType: 'guard', patrolDist: 150, speed: 2 }),
            new Platform(800, 500, 400, 200, { colorTop: '#bdc3c7' }),
            new MovingPlatform(1300, 450, 100, 20, { rangeY: 150, speed: 0.04, offset: Math.PI }), // Elev down
            new MovingPlatform(1480, 300, 100, 20, { rangeY: 150, speed: 0.04 }),               // Elev Up
            new Platform(1650, 200, 280, 20, { conveyorSpeed: -3, colorTop: '#34495e' }),        // backward band
            new Platform(2000, 280, 200, 20, { colorTop: '#bdc3c7' }),                           // mid ledge
            new Enemy(2050, 240, 40, 40, { color: '#34495e', enemyType: 'guard', patrolDist: 80, speed: 1.5 }),
            new Platform(2270, 280, 180, 300, { colorTop: '#bdc3c7' }),                          // step up
            new Platform(2500, 250, 180, 300, { colorTop: '#bdc3c7' }),                          // step
            new Platform(2740, 230, 350, 300, { colorTop: '#bdc3c7' })                           // final safe zone
        ]
    },
    // L8: Power Outage
    {
        title: "8. Bölüm", desc: "Tema: Gece Sokakları\nEtraf çok karanlık!", bgColor: '#02000d', globalFriction: 0.8, isDark: true,
        goal: { x: 2950, y: 400, w: 50, h: 100 },
        entities: [
            new Platform(0, 500, 400, 200, { colorTop: '#34495e' }),
            new StreetLamp(150, 380, 40, 120),
            new Platform(500, 400, 100, 300, { colorTop: '#34495e' }),
            new Hazard(600, 450, 200, 200, { type: 'abyss', color: 'transparent' }), // open shaft
            new Platform(850, 450, 300, 200, { colorTop: '#34495e' }),
            new StreetLamp(950, 330, 40, 120),
            new BreakablePlatform(1200, 450, 100, 20, { colorTop: '#95a5a6' }), // broken floor
            new BreakablePlatform(1350, 450, 100, 20, { colorTop: '#95a5a6', breakTime: 40 }),
            new Platform(1550, 350, 150, 300, { colorTop: '#34495e' }),
            new StreetLamp(1600, 230, 40, 120),
            new Platform(1850, 460, 120, 200, { colorTop: '#34495e' }),
            new MovingPlatform(2050, 430, 100, 20, { rangeX: 120, speed: 0.03 }),
            new Platform(2300, 450, 200, 200, { colorTop: '#34495e' }),  // köprü
            new StreetLamp(2400, 330, 40, 120),
            new Platform(2550, 440, 500, 200, { colorTop: '#34495e' })   // son düzlük + goal
        ]
    },
    // L9: Bridge
    {
        title: "9. Bölüm", desc: "Tema: Asma Köprü\nKırılgan tahtalar ve sallanan zemin!", bgColor: '#110b29', globalFriction: 0.8, wind: 0.5,
        goal: { x: 3200, y: 350, w: 50, h: 100 },
        entities: [
            new Platform(0, 500, 450, 200, { colorTop: '#34495e' }), // wider safe starting platform
            new BreakablePlatform(500, 450, 80, 20, { colorTop: '#8e44ad', breakTime: 30 }),
            new BreakablePlatform(650, 400, 80, 20, { colorTop: '#8e44ad', breakTime: 30 }),
            new Platform(800, 350, 100, 300, { colorTop: '#e74c3c' }),
            // Swaying bridges
            new MovingPlatform(900, 350, 200, 20, { rangeY: 50, speed: 0.05 }), // Sways up/down
            new BreakablePlatform(1250, 300, 80, 20, { breakTime: 20 }), // fast drop
            new MovingPlatform(1500, 250, 150, 20, { rangeX: 150, speed: 0.06 }), // Sway fast sides
            new BreakablePlatform(1900, 350, 100, 20),
            new BreakablePlatform(2150, 450, 100, 20),
            new Platform(2400, 350, 100, 400),
            new Platform(2650, 400, 550, 300, { colorTop: '#e74c3c' })
        ]
    },
    // L10: Final
    {
        title: "10. Bölüm", desc: "Sonuç: Hastane / Ofis / Ev\nHer şeyin birleştiği an.", bgColor: '#ecf0f1', globalFriction: 0.9,
        goal: { x: 3500, y: 350, w: 50, h: 100 }, // Door trigger
        entities: [
            new Platform(0, 500, 400, 200, { colorTop: '#2980b9' }), // smooth floor
            new MovingPlatform(500, 450, 120, 20, { rangeY: 100, speed: 0.04 }),
            new Platform(750, 350, 200, 200, { conveyorSpeed: -2, colorTop: '#34495e' }), // backward
            new Platform(1100, 450, 100, 300),
            new BreakablePlatform(1300, 400, 80, 20),
            new MovingPlatform(1500, 300, 100, 20, { rangeX: 100 }),
            new Platform(1800, 450, 400, 200, { friction: 0.97, colorTop: '#e67e22' }), // slippery floor
            new Hazard(2000, 430, 40, 20, { type: 'spike' }),
            new Platform(2320, 380, 100, 300),
            new MovingPlatform(2600, 250, 150, 20, { rangeY: 250, speed: 0.03 }), // huge elev
            new Platform(2900, 450, 1000, 200, { colorTop: '#9b59b6' }), // safe final stretch
        ]
    }
];

const player = new Player();
let currentLevelData = null;

// Cutscene vars
let cutsceneTimer = 0;
let damlaCutscene = { x: 3700, y: 406, w: 44, h: 44 }; // Will sit at end of level 10

function die() {
    deathCount++;
    deathCountSpan.innerText = deathCount;
    resetAllEntities(currentLevelData);
    startLevel(currentLevelIdx, true); // fromDeath=true => skip intro
}

function resetAllEntities(levelData) {
    if (!levelData) return;
    for (let e of levelData.entities) {
        e.active = true;
        if (e.startX !== undefined) e.x = e.startX;
        if (e.startY !== undefined) e.y = e.startY;
        if (e instanceof MovingPlatform) { e.dx = 0; e.dy = 0; }
        if (e instanceof Enemy) { e.x = e.startX; e.y = e.startY; e.dir = 1; e.vy = 0; }
        if (e instanceof BreakablePlatform) { e.stepped = false; e.breakTimer = e._origBreakTimer || 60; }
        if (e instanceof Vehicle) { e.x = e.spawnX; }
    }
}

function levelComplete() {
    if (gameState === 'CUTSCENE' || gameState === 'WIN') return;

    if (currentLevelIdx === 9) {
        // Trigger Final Cutscene
        gameState = 'CUTSCENE';
        player.vx = 0; player.vy = 0;
        keys.left = false; keys.right = false; keys.up = false;

        // Sequence
        setTimeout(() => {
            showDialogBox("Damla: Gerçekten geldin mi?");
            setTimeout(() => {
                const choiceBtn = document.getElementById('cutscene-choice-btn');
                if (choiceBtn) choiceBtn.style.display = 'inline-block';
            }, 1000);
        }, 1000);


    } else {
        currentLevelIdx++;
        startLevel(currentLevelIdx);
    }
}

function showDialogBox(text) {
    cutsceneText.innerText = text;
    cutsceneDialog.classList.add('active');
}

function startLevel(idx, fromDeath = false) {
    if (idx >= levels.length) return;
    currentLevelData = levels[idx];

    playLevelMusic(idx);

    player.reset();
    camera.x = 0;

    if (fromDeath) {
        // Ölünce direkt oynama moduna geç, intro gösterme
        gameState = 'PLAYING';
        uiOverlay.style.display = 'block';
    } else {
        // Yeni bölüme geçişte intro ekranını göster
        gameState = 'LEVEL_INTRO';
        levelTitle.innerText = currentLevelData.title;
        levelDesc.innerText = currentLevelData.desc;
        levelIntroScreen.classList.add('active');
        uiOverlay.style.display = 'none'; // hide during intro

        setTimeout(() => {
            levelIntroScreen.classList.remove('active');
            gameState = 'PLAYING';
            uiOverlay.style.display = 'block'; // show during gameplay
        }, 2000);
    }
}

// -- Main Loop --
function update() {
    frameCount++;
    if (gameState === 'PLAYING') {
        for (let e of currentLevelData.entities) {
            if (e.active) e.update(player, currentLevelData);
        }
        player.update(currentLevelData);

        camera.targetX = player.x - 300;
        if (camera.targetX < 0) camera.targetX = 0;
        camera.x += (camera.targetX - camera.x) * 0.1;
    } else if (gameState === 'CUTSCENE') {
        // Auto pan camera slightly to frame both
        let target = (player.x + damlaCutscene.x) / 2 - 400;
        camera.x += (target - camera.x) * 0.05;
        player.update(currentLevelData); // applies gravity only
    }
}

// -- Background System --
const cyberpunkBuildings = [
    { w: 80, h: 250, gap: 20, type: 1 },
    { w: 60, h: 180, gap: 30, type: 2 },
    { w: 100, h: 320, gap: 40, type: 3 },
    { w: 50, h: 150, gap: 15, type: 2 },
    { w: 120, h: 200, gap: 50, type: 1 },
    { w: 70, h: 280, gap: 20, type: 3 }
];

function drawCityLayer(ctx, offset, speedMulti, yOffset, baseColor, isFront, isNight) {
    ctx.save();

    // Calculate total pattern width
    let patternW = cyberpunkBuildings.reduce((sum, b) => sum + b.w + b.gap, 0);

    // Calculate starting X based on camera offset 
    // Bug Fix: Floating point modulo caused jitter. Floor before modulo.
    let baseOffset = Math.floor(offset * speedMulti);
    let startX = -(baseOffset % patternW);
    if (startX > 0) startX -= patternW; // Ensure we always start drawing off-screen left

    let drawX = startX;
    let bIdx = 0;

    // Draw enough buildings to fill screen + 1 buffer
    while (drawX < canvas.width + 200) {
        let b = cyberpunkBuildings[bIdx];

        ctx.fillStyle = baseColor;
        // Draw building block
        ctx.fillRect(drawX, canvas.height - yOffset - b.h, b.w, b.h);

        // Add "pixel art" neon windows if night level
        if (isNight) {
            if (isFront && speedMulti > 0.3) {
                // Neon outline trim
                let trimColor = (b.type === 1) ? 'rgba(0, 255, 204, 0.4)' : (b.type === 2) ? 'rgba(255, 0, 255, 0.4)' : 'rgba(255, 255, 0, 0.4)';
                ctx.fillStyle = trimColor;
                ctx.fillRect(drawX, canvas.height - yOffset - b.h, b.w, 3);

                // Bright windows
                let cols = Math.floor(b.w / 15);
                let rows = Math.floor(b.h / 25) - 1;

                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        // Randomly turn off some windows based on position logic
                        if (((drawX + r * 3 + c * 7) % 7) < 3) {
                            let winColor = (b.type === 1) ? '#00ffcc' : (b.type === 2) ? '#ff00ff' : '#f1c40f'; // Neon cyan/magenta/yellow
                            ctx.fillStyle = winColor;
                            ctx.fillRect(drawX + 5 + c * 15, canvas.height - yOffset - b.h + 20 + r * 25, 8, 12);
                        }
                    }
                }
            } else {
                // Dim windows for back layer
                ctx.fillStyle = 'rgba(0, 255, 204, 0.1)';
                let cols = Math.floor(b.w / 20);
                let rows = Math.floor(b.h / 30) - 1;
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        if (((drawX + r * 2 + c * 5) % 5) === 0) {
                            ctx.fillRect(drawX + 8 + c * 20, canvas.height - yOffset - b.h + 20 + r * 30, 6, 10);
                        }
                    }
                }
            }
        } else {
            // Day level windows (dark glass)
            if (isFront && speedMulti > 0.3) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
                let cols = Math.floor(b.w / 15);
                let rows = Math.floor(b.h / 20) - 1;
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < cols; c++) {
                        if (((drawX + r * 7 + c * 11) % 5) !== 0) {
                            ctx.fillRect(drawX + 5 + c * 15, canvas.height - yOffset - b.h + 10 + r * 20, 8, 12);
                        }
                    }
                }
            }
        }

        drawX += b.w + b.gap;
        bIdx = (bIdx + 1) % cyberpunkBuildings.length;
    }

    // Add glowing grid line on ground layer for Night
    if (isNight && isFront) {
        ctx.fillStyle = 'rgba(0, 255, 204, 0.2)';
        ctx.fillRect(0, canvas.height - yOffset, canvas.width, 2);
    }

    ctx.restore();
}

const parkBgImg = new Image();
parkBgImg.src = 'park_bg.png';

const consBgImg = new Image();
consBgImg.src = 'construction_bg.png';

const subwayBgImg = new Image();
subwayBgImg.src = 'subway_bg.png';

const rainyBgImg = new Image();
rainyBgImg.src = 'rainy_street_bg.png';

const rooftopsBgImg = new Image();
rooftopsBgImg.src = 'rooftops_bg.png';

const trafficBgImg = new Image();
trafficBgImg.src = 'traffic_bg.png';

const mallBgImg = new Image();
mallBgImg.src = 'mall_bg.png';

const nightStreetBgImg = new Image();
nightStreetBgImg.src = 'night_street_bg.png';

const bridgeBgImg = new Image();
bridgeBgImg.src = 'bridge_bg.png';

const endingBgImg = new Image();
endingBgImg.src = 'ending_bg.png';

function drawBackground(ctx, level) {
    ctx.fillStyle = level.bgColor || '#87CEEB';
    ctx.fillRect(camera.x, 0, canvas.width, canvas.height);

    // Draw Rooftops Background for Level 5
    if (level.title.includes("5. B")) {
        if (rooftopsBgImg.complete && rooftopsBgImg.width > 0) {
            let w = rooftopsBgImg.width;
            let offset = (Math.floor(camera.x * 0.2)) % w;
            ctx.drawImage(rooftopsBgImg, camera.x - offset, 0);
            ctx.drawImage(rooftopsBgImg, camera.x - offset + w, 0);
            ctx.drawImage(rooftopsBgImg, camera.x - offset + w * 2, 0);
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        for (let i = 0; i < 40; i++) {
            let wx = (frameCount * 8 + i * 40) % canvas.width + camera.x;
            let wy = (Math.sin(frameCount * 0.05 + i) * 20 + i * 15) % canvas.height;
            ctx.fillRect(wx, wy, Math.random() * 15 + 10, 2);
        }
        return;
    }

    // Draw Park Background for Level 1
    if (level.title.includes("1. B")) {
        if (parkBgImg.complete && parkBgImg.width > 0) {
            let w = parkBgImg.width;
            let offset = (Math.floor(camera.x * 0.2)) % w;
            ctx.drawImage(parkBgImg, camera.x - offset, canvas.height - parkBgImg.height);
            ctx.drawImage(parkBgImg, camera.x - offset + w, canvas.height - parkBgImg.height);
            ctx.drawImage(parkBgImg, camera.x - offset + w * 2, canvas.height - parkBgImg.height);
        }
        return;
    }

    // Draw Construction Background for Level 2
    if (level.title.includes("2. B")) {
        if (consBgImg.complete && consBgImg.width > 0) {
            let w = consBgImg.width;
            let offset = (Math.floor(camera.x * 0.2)) % w;
            ctx.drawImage(consBgImg, camera.x - offset, canvas.height - consBgImg.height);
            ctx.drawImage(consBgImg, camera.x - offset + w, canvas.height - consBgImg.height);
            ctx.drawImage(consBgImg, camera.x - offset + w * 2, canvas.height - consBgImg.height);
        }
        return;
    }

    // Draw Subway Background for Level 3
    if (level.title.includes("3. B")) {
        if (subwayBgImg.complete && subwayBgImg.width > 0) {
            let w = subwayBgImg.width;
            let offset = (Math.floor(camera.x * 0.2)) % w;
            ctx.drawImage(subwayBgImg, camera.x - offset, canvas.height - subwayBgImg.height);
            ctx.drawImage(subwayBgImg, camera.x - offset + w, canvas.height - subwayBgImg.height);
            ctx.drawImage(subwayBgImg, camera.x - offset + w * 2, canvas.height - subwayBgImg.height);
        }
        return;
    }

    // Draw Rainy Street Background for Level 4
    if (level.title.includes("4. B")) {
        if (rainyBgImg.complete && rainyBgImg.width > 0) {
            let w = rainyBgImg.width;
            let offset = (Math.floor(camera.x * 0.2)) % w;
            ctx.drawImage(rainyBgImg, camera.x - offset, canvas.height - rainyBgImg.height);
            ctx.drawImage(rainyBgImg, camera.x - offset + w, canvas.height - rainyBgImg.height);
            ctx.drawImage(rainyBgImg, camera.x - offset + w * 2, canvas.height - rainyBgImg.height);
        }
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        for (let i = 0; i < 100; i++) {
            let rx = (frameCount * 5 + i * 20) % canvas.width + camera.x;
            let ry = (frameCount * 15 + i * 30) % canvas.height;
            ctx.fillRect(rx, ry, 2, 10);
        }
        return;
    }

    // Draw Traffic Background for Level 6
    if (level.title.includes("6. B")) {
        if (trafficBgImg.complete && trafficBgImg.width > 0) {
            let w = trafficBgImg.width;
            let offset = (Math.floor(camera.x * 0.25)) % w;
            ctx.drawImage(trafficBgImg, camera.x - offset, canvas.height - trafficBgImg.height);
            ctx.drawImage(trafficBgImg, camera.x - offset + w, canvas.height - trafficBgImg.height);
            ctx.drawImage(trafficBgImg, camera.x - offset + w * 2, canvas.height - trafficBgImg.height);
        }
        return;
    }

    // Draw Mall Background for Level 7
    if (level.title.includes("7. B")) {
        if (mallBgImg.complete && mallBgImg.width > 0) {
            let w = mallBgImg.width;
            let offset = (Math.floor(camera.x * 0.2)) % w;
            ctx.drawImage(mallBgImg, camera.x - offset, canvas.height - mallBgImg.height);
            ctx.drawImage(mallBgImg, camera.x - offset + w, canvas.height - mallBgImg.height);
            ctx.drawImage(mallBgImg, camera.x - offset + w * 2, canvas.height - mallBgImg.height);
        }
        return;
    }

    // Draw Night Street Background for Level 8
    if (level.title.includes("8. B")) {
        if (nightStreetBgImg.complete && nightStreetBgImg.width > 0) {
            let w = nightStreetBgImg.width;
            let offset = (Math.floor(camera.x * 0.15)) % w;
            ctx.drawImage(nightStreetBgImg, camera.x - offset, canvas.height - nightStreetBgImg.height);
            ctx.drawImage(nightStreetBgImg, camera.x - offset + w, canvas.height - nightStreetBgImg.height);
            ctx.drawImage(nightStreetBgImg, camera.x - offset + w * 2, canvas.height - nightStreetBgImg.height);
        }
        // let it drop down to also draw the neon windows and night grids if we want
    }

    // Draw Bridge Background for Level 9
    if (level.title.includes("9. B")) {
        if (bridgeBgImg.complete && bridgeBgImg.width > 0) {
            let w = bridgeBgImg.width;
            let offset = (Math.floor(camera.x * 0.2)) % w;
            ctx.drawImage(bridgeBgImg, camera.x - offset, canvas.height - bridgeBgImg.height);
            ctx.drawImage(bridgeBgImg, camera.x - offset + w, canvas.height - bridgeBgImg.height);
            ctx.drawImage(bridgeBgImg, camera.x - offset + w * 2, canvas.height - bridgeBgImg.height);
        }
        return;
    }

    // Draw Ending Background for Level 10
    if (level.title.includes("10. B")) {
        if (endingBgImg.complete && endingBgImg.width > 0) {
            let w = endingBgImg.width;
            let offset = (Math.floor(camera.x * 0.1)) % w;
            ctx.drawImage(endingBgImg, camera.x - offset, canvas.height - endingBgImg.height);
            ctx.drawImage(endingBgImg, camera.x - offset + w, canvas.height - endingBgImg.height);
            ctx.drawImage(endingBgImg, camera.x - offset + w * 2, canvas.height - endingBgImg.height);
        }
        return;
    }

    if (level.isDark && !level.title.includes("8. B")) {
        return; // No city in pitch black
    }

    let isNight = (level.bgColor === '#0b001a' || level.bgColor === '#0f172a' || level.bgColor === '#1a0b2e' || level.bgColor === '#02000d' || level.bgColor === '#110b29');

    // Parallax CityScape (Slower speeds: 0.1 for back, 0.35 for front)
    drawCityLayer(ctx, camera.x, 0.1, 100, isNight ? '#1f1135' : 'rgba(0, 0, 0, 0.2)', false, isNight); // Back layer
    drawCityLayer(ctx, camera.x, 0.35, 0, isNight ? '#0c0f2a' : 'rgba(0, 0, 0, 0.3)', true, isNight); // Front layer
}

function draw() {
    if (gameState === 'START' || gameState === 'LEVEL_INTRO') return;

    ctx.save();
    ctx.translate(-camera.x, 0);

    drawBackground(ctx, currentLevelData);

    for (let e of currentLevelData.entities) {
        e.draw(ctx);
    }

    if (currentLevelIdx === 9) {
        drawDamla(ctx, damlaCutscene.x, damlaCutscene.y, damlaCutscene.w, damlaCutscene.h);
        // Detailed Pixel Art Door Graphic
        let gx = currentLevelData.goal.x, gy = currentLevelData.goal.y;

        // Shadow behind door for depth
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(gx + 2, gy + 2, currentLevelData.goal.w, currentLevelData.goal.h);

        // Frame/Architrave
        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(gx - 4, gy - 4, currentLevelData.goal.w + 8, currentLevelData.goal.h + 4);

        // Door Body (Wooden)
        ctx.fillStyle = '#8d6e63';
        ctx.fillRect(gx, gy, currentLevelData.goal.w, currentLevelData.goal.h);

        // Door panels (indentations)
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(gx + 10, gy + 10, currentLevelData.goal.w - 20, 30);
        ctx.fillRect(gx + 10, gy + 50, currentLevelData.goal.w - 20, 40);

        // Highlights for 3D effect
        ctx.fillStyle = '#a1887f';
        ctx.fillRect(gx + 10, gy + 10, 2, 30); // Left edge of top panel
        ctx.fillRect(gx + 10, gy + 10, currentLevelData.goal.w - 20, 2); // Top edge 

        // Knob
        ctx.fillStyle = '#f1c40f'; // Brass knob base
        ctx.fillRect(gx + 35, gy + 50, 8, 8);
        ctx.fillStyle = '#f39c12'; // Knob shadow
        ctx.fillRect(gx + 37, gy + 52, 4, 4);

        // Little sign/plaque on door
        ctx.fillStyle = '#bdc3c7';
        ctx.fillRect(gx + 15, gy + 20, 20, 10);
        ctx.fillStyle = '#e74c3c'; // red heart on plaque
        ctx.fillRect(gx + 22, gy + 23, 6, 4);

    } else if (gameState !== 'CUTSCENE') {
        let gx = currentLevelData.goal.x, gy = currentLevelData.goal.y;
        let scale = 3;
        let starX = gx + currentLevelData.goal.w / 2;
        let starY = gy + currentLevelData.goal.h - 30; // Float near bottom of goal area

        // Hover animation
        starY += Math.sin(frameCount * 0.05) * 10;

        ctx.save();
        ctx.translate(starX, starY);

        // Glow effect
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(0, 0, 25 + Math.sin(frameCount * 0.1) * 5, 0, Math.PI * 2);
        ctx.fill();

        // Pixel Art Star (approx 10x10 grid scaled up)
        ctx.fillStyle = '#f1c40f'; // border/shadow
        ctx.fillRect(-3 * scale, -5 * scale, 6 * scale, 10 * scale);
        ctx.fillRect(-5 * scale, -1 * scale, 10 * scale, 3 * scale);
        ctx.fillRect(-4 * scale, 2 * scale, 8 * scale, 2 * scale);
        ctx.fillRect(-2 * scale, 4 * scale, 4 * scale, 2 * scale);

        ctx.fillStyle = '#f1c40f'; // Darker yellow outline
        ctx.fillRect(-2 * scale, -6 * scale, 4 * scale, 1 * scale); // top tip
        ctx.fillRect(-6 * scale, -2 * scale, 1 * scale, 3 * scale); // left tip
        ctx.fillRect(5 * scale, -2 * scale, 1 * scale, 3 * scale); // right tip
        ctx.fillRect(-4 * scale, 5 * scale, 2 * scale, 2 * scale); // bot left tip
        ctx.fillRect(2 * scale, 5 * scale, 2 * scale, 2 * scale); // bot right tip

        ctx.fillStyle = '#fce5cd'; // inner bright yellow
        ctx.fillRect(-2 * scale, -4 * scale, 4 * scale, 8 * scale);
        ctx.fillRect(-4 * scale, 0 * scale, 8 * scale, 2 * scale);

        ctx.fillStyle = '#fff'; // shine
        ctx.fillRect(-1 * scale, -3 * scale, 1 * scale, 2 * scale);

        ctx.restore();

        // Text
        ctx.fillStyle = '#fff';
        ctx.font = '10px "Press Start 2P"';
        ctx.fillText("Çıkış", gx, gy - 10);
    }

    player.draw(ctx);

    if (currentLevelIdx === 0 && gameState !== 'CUTSCENE') {
        ctx.fillStyle = '#000';
        ctx.fillText("Salincak Ipi!", 1200, 180);
    }

    ctx.restore();

    // Flashlight Overlay (Level 8)
    if (currentLevelData.isDark && gameState === 'PLAYING') {
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(0,0,0,0.92)'; // slightly less dark
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Cut out hole - bigger flashlight radius
        ctx.globalCompositeOperation = 'destination-out';

        // We only punch holes for StreetLamps now, player has no light

        // Punch holes for StreetLamps
        if (currentLevelData.entities) {
            for (let e of currentLevelData.entities) {
                if (e instanceof StreetLamp && e.baseOn) {
                    let lampX = e.x + e.w / 2 - camera.x;
                    let lampY = e.y - 5;
                    let lampR = 250; // light radius
                    let lGrad = ctx.createRadialGradient(lampX, lampY, 10, lampX, lampY, lampR);
                    lGrad.addColorStop(0, 'rgba(0,0,0,1)');
                    lGrad.addColorStop(0.5, 'rgba(0,0,0,0.5)');
                    lGrad.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.fillStyle = lGrad;
                    ctx.beginPath();
                    ctx.arc(lampX, lampY, lampR, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        ctx.restore();
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// UI Triggers
startBtn.addEventListener('click', () => {
    startScreen.classList.remove('active');
    deathCount = 0;
    deathCountSpan.innerText = deathCount;
    startLevel(0);
});

const levelSelectBtn = document.getElementById('level-select-btn');
const levelGrid = document.getElementById('level-grid');

levelSelectBtn.addEventListener('click', () => {
    if (levelGrid.style.display === 'none') {
        levelGrid.style.display = 'grid';
    } else {
        levelGrid.style.display = 'none';
    }
});

document.querySelectorAll('.btn-level').forEach(btn => {
    btn.addEventListener('click', (e) => {
        let selectedLvl = parseInt(e.target.getAttribute('data-level'));
        startScreen.classList.remove('active');
        deathCount = 0;
        deathCountSpan.innerText = deathCount;
        currentLevelIdx = selectedLvl; // Fix: Actually update the global level index
        startLevel(selectedLvl);
    });
});

restartBtn.addEventListener('click', () => {
    winScreen.classList.remove('active');
    currentLevelIdx = 0;
    deathCount = 0;
    deathCountSpan.innerText = deathCount;
    if (musicInterval) clearInterval(musicInterval);
    stopCreditsMusic();
    startLevel(0);
});

const mainMenuBtn = document.getElementById('main-menu-btn');
if (mainMenuBtn) {
    mainMenuBtn.addEventListener('click', () => {
        winScreen.classList.remove('active');
        if (musicInterval) clearInterval(musicInterval);
        stopCreditsMusic();
        gameState = 'START';
        startScreen.classList.add('active');
        deathCount = 0;
        deathCountSpan.innerText = deathCount;
        uiOverlay.style.display = 'none';
        camera.x = 0;
    });
}


let creditsAudio = new Audio('jana_maryam.mp3');
creditsAudio.loop = true;

function playCreditsMusic() {
    if (musicInterval) clearInterval(musicInterval);
    creditsAudio.currentTime = 0;
    creditsAudio.play().catch(e => console.log("Otomatik müzik çalma tarayıcı tarafından engellendi:", e));
}

function stopCreditsMusic() {
    creditsAudio.pause();
    creditsAudio.currentTime = 0;
}

const cutsceneChoiceBtn = document.getElementById('cutscene-choice-btn');
if (cutsceneChoiceBtn) {
    cutsceneChoiceBtn.addEventListener('click', () => {
        cutsceneChoiceBtn.style.display = 'none';
        showDialogBox("Barış: Hiç gitmemiştim ki.");

        setTimeout(() => {
            // Trigger Hug Animation
            cutsceneDialog.classList.remove('active');
            let hugInterval = setInterval(() => {
                if (player.x < damlaCutscene.x - 20) {
                    player.x += 2;
                } else if (player.x > damlaCutscene.x + 20) {
                    player.x -= 2;
                } else {
                    clearInterval(hugInterval);
                    // Open win screen with romantic music
                    setTimeout(() => {
                        gameState = 'WIN';
                        winScreen.classList.add('active');
                        playCreditsMusic();
                    }, 1500);
                }
            }, 30);
        }, 2000);
    });
}

// Initialization
gameLoop();
