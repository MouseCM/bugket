const canvas = document.getElementById("flappy-canvas");
const ctx = canvas.getContext("2d");
const questionText = document.getElementById("question-text");
const overlay = document.getElementById("game-overlay");
const startOverlay = document.getElementById("start-overlay");
const finalScoreEl = document.getElementById("final-score");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");

let words = [];
let frames = 0;
let score = 0;
let gameOver = false;
let gameStarted = false;
let animationFrameId;

const BIRD_RADIUS = 15;
const GRAVITY = 0.3;
const JUMP = -6;
const PIPE_WIDTH = 60;
const PIPE_SPEED = 2;
const LANE_HEIGHT = 120;
const DIVIDER_HEIGHT = 40;
const PIPE_SPACING = 300;

// Stars for background
const stars = [];
for (let i = 0; i < 100; i++) {
  stars.push({
    x: Math.random() * 400,
    y: Math.random() * 600,
    size: Math.random() * 2 + 0.5,
    speed: Math.random() * 0.5 + 0.1
  });
}

let bird = {
  x: 80,
  y: canvas.height / 2,
  velocity: 0,
  draw: function() {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    // Rotate slightly based on velocity
    const angle = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (this.velocity * 0.1)));
    ctx.rotate(angle);

    // Rocket Fire
    if (frames % 4 < 2) {
      ctx.fillStyle = "#ff5722";
      ctx.beginPath();
      ctx.moveTo(-10, 5);
      ctx.lineTo(-25, 0);
      ctx.lineTo(-10, -5);
      ctx.fill();
      ctx.fillStyle = "#ffeb3b";
      ctx.beginPath();
      ctx.moveTo(-10, 3);
      ctx.lineTo(-18, 0);
      ctx.lineTo(-10, -3);
      ctx.fill();
    }

    // Rocket Body
    ctx.fillStyle = "#e0e0e0";
    ctx.beginPath();
    ctx.moveTo(15, 0); // nose
    ctx.lineTo(5, -8);
    ctx.lineTo(-10, -8);
    ctx.lineTo(-10, 8);
    ctx.lineTo(5, 8);
    ctx.closePath();
    ctx.fill();

    // Rocket Fins
    ctx.fillStyle = "#f44336";
    ctx.beginPath();
    ctx.moveTo(-5, -8);
    ctx.lineTo(-10, -15);
    ctx.lineTo(-10, -8);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-5, 8);
    ctx.lineTo(-10, 15);
    ctx.lineTo(-10, 8);
    ctx.fill();

    // Rocket Window
    ctx.fillStyle = "#03a9f4";
    ctx.beginPath();
    ctx.arc(2, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  },
  update: function() {
    this.velocity += GRAVITY;
    this.y += this.velocity;
    if (this.y + BIRD_RADIUS >= canvas.height) {
      this.y = canvas.height - BIRD_RADIUS;
      triggerGameOver();
    }
    if (this.y - BIRD_RADIUS <= 0) {
      this.y = BIRD_RADIUS;
      this.velocity = 0;
    }
  },
  flap: function() {
    this.velocity = JUMP;
  }
};

let pipes = [];

function randomWord() {
  if (words.length === 0) return { english: "HELLO", vietnamese: "XIN CHÀO" };
  return words[Math.floor(Math.random() * words.length)];
}

function addPipe() {
  const h1 = Math.floor(Math.random() * 160) + 50; // Top pipe height (50 to 210)
  const targetWordObj = randomWord();
  let wrongWordObj = randomWord();
  while (wrongWordObj.english === targetWordObj.english && words.length > 1) {
    wrongWordObj = randomWord();
  }

  const correctLane = Math.random() > 0.5 ? 1 : 2;
  const lane1Text = correctLane === 1 ? targetWordObj.vietnamese : wrongWordObj.vietnamese;
  const lane2Text = correctLane === 2 ? targetWordObj.vietnamese : wrongWordObj.vietnamese;

  pipes.push({
    x: canvas.width,
    h1: h1,
    wordObj: targetWordObj,
    correctLane: correctLane,
    lane1Text: lane1Text,
    lane2Text: lane2Text,
    passed: false
  });
}

function drawPipes() {
  for (let i = 0; i < pipes.length; i++) {
    const p = pipes[i];
    
    // Draw pipes (Energy Pillars)
    const pillarGradient = ctx.createLinearGradient(p.x, 0, p.x + PIPE_WIDTH, 0);
    pillarGradient.addColorStop(0, "#191f3a");
    pillarGradient.addColorStop(0.5, "#2a3459");
    pillarGradient.addColorStop(1, "#191f3a");

    ctx.fillStyle = pillarGradient;
    ctx.strokeStyle = "#00f3ff"; // Neon cyan edges
    ctx.lineWidth = 2;

    // Top pipe
    ctx.fillRect(p.x, 0, PIPE_WIDTH, p.h1);
    ctx.strokeRect(p.x, 0, PIPE_WIDTH, p.h1);

    // Middle pipe
    const middleY = p.h1 + LANE_HEIGHT;
    // Highlight the divider differently
    ctx.fillStyle = "#ff007a"; // Neon pink divider
    ctx.fillRect(p.x, middleY, PIPE_WIDTH, DIVIDER_HEIGHT);
    ctx.strokeRect(p.x, middleY, PIPE_WIDTH, DIVIDER_HEIGHT);
    ctx.fillStyle = pillarGradient; // revert for bottom

    // Bottom pipe
    const bottomY = middleY + DIVIDER_HEIGHT + LANE_HEIGHT;
    ctx.fillRect(p.x, bottomY, PIPE_WIDTH, canvas.height - bottomY);
    ctx.strokeRect(p.x, bottomY, PIPE_WIDTH, canvas.height - bottomY);

    // Draw energy gates glow (optional visual effect inside the gap)
    ctx.fillStyle = "rgba(0, 243, 255, 0.1)";
    ctx.fillRect(p.x, p.h1, PIPE_WIDTH, LANE_HEIGHT);
    ctx.fillRect(p.x, bottomY - LANE_HEIGHT, PIPE_WIDTH, LANE_HEIGHT);

    // Draw text in lanes
    ctx.fillStyle = "#fff";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const lane1CenterY = p.h1 + LANE_HEIGHT / 2;
    const lane2CenterY = middleY + DIVIDER_HEIGHT + LANE_HEIGHT / 2;
    
    // Lane 1 text with dark outline for readability
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0,0,0,0.8)";
    const maxTextWidth = PIPE_SPACING - 80;
    
    ctx.strokeText(p.lane1Text, p.x + PIPE_WIDTH/2, lane1CenterY, maxTextWidth);
    ctx.fillText(p.lane1Text, p.x + PIPE_WIDTH/2, lane1CenterY, maxTextWidth);

    // Lane 2 text
    ctx.strokeText(p.lane2Text, p.x + PIPE_WIDTH/2, lane2CenterY, maxTextWidth);
    ctx.fillText(p.lane2Text, p.x + PIPE_WIDTH/2, lane2CenterY, maxTextWidth);
  }
}

function updatePipes() {
  if (frames % (PIPE_SPACING / PIPE_SPEED) === 0 && frames > 0) {
    addPipe();
  }

  for (let i = 0; i < pipes.length; i++) {
    let p = pipes[i];
    p.x -= PIPE_SPEED;

    // Check collision with pipe bodies
    if (bird.x + BIRD_RADIUS > p.x && bird.x - BIRD_RADIUS < p.x + PIPE_WIDTH) {
      const hitTop = bird.y - BIRD_RADIUS < p.h1;
      const hitMiddle = bird.y + BIRD_RADIUS > (p.h1 + LANE_HEIGHT) && bird.y - BIRD_RADIUS < (p.h1 + LANE_HEIGHT + DIVIDER_HEIGHT);
      const hitBottom = bird.y + BIRD_RADIUS > (p.h1 + 2 * LANE_HEIGHT + DIVIDER_HEIGHT);
      
      if (hitTop || hitMiddle || hitBottom) {
        triggerGameOver();
      }
    }

    // Check passing the pipe center to evaluate correct lane
    if (p.x + PIPE_WIDTH / 2 < bird.x && !p.passed && !gameOver) {
      p.passed = true;
      
      // Check which lane bird is closest to
      const lane1Center = p.h1 + LANE_HEIGHT / 2;
      const lane2Center = p.h1 + LANE_HEIGHT + DIVIDER_HEIGHT + LANE_HEIGHT / 2;
      
      const dist1 = Math.abs(bird.y - lane1Center);
      const dist2 = Math.abs(bird.y - lane2Center);
      const chosenLane = dist1 < dist2 ? 1 : 2;

      if (chosenLane === p.correctLane) {
        score++;
      } else {
        triggerGameOver();
      }
    }
  }

  // Remove off-screen pipes
  if (pipes.length > 0 && pipes[0].x + PIPE_WIDTH < -100) {
    pipes.shift();
  }
}

function updateScoreAndQuestion() {
  ctx.fillStyle = "#fff";
  ctx.font = "bold 24px sans-serif";
  ctx.textAlign = "left";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#000";
  ctx.strokeText(`Score: ${score}`, 20, 40);
  ctx.fillText(`Score: ${score}`, 20, 40);

  // Update current question
  const nextPipe = pipes.find(p => !p.passed);
  if (nextPipe && nextPipe.wordObj) {
    questionText.textContent = `${nextPipe.wordObj.english.toUpperCase()} = ?`;
  } else {
    questionText.textContent = "Loading...";
  }
}

function drawBackground() {
  // Deep space background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, "#080b14");
  bgGrad.addColorStop(1, "#1c2242");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw and animate stars
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < stars.length; i++) {
    const star = stars[i];
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
    // move star
    if (gameStarted && !gameOver) {
      star.x -= star.speed;
      if (star.x < 0) {
        star.x = canvas.width;
        star.y = Math.random() * canvas.height;
      }
    }
  }
}

function loop() {
  if (gameOver || !gameStarted) return;
  drawBackground();
  bird.draw();
  bird.update();
  drawPipes();
  updatePipes();
  updateScoreAndQuestion();
  frames++;
  animationFrameId = requestAnimationFrame(loop);
}

function triggerGameOver() {
  gameOver = true;
  overlay.style.display = "flex";
  finalScoreEl.textContent = score;
}

function resetGame() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  bird.y = canvas.height / 2;
  bird.velocity = 0;
  pipes = [];
  score = 0;
  frames = 0;
  gameOver = false;
  overlay.style.display = "none";
  startOverlay.style.display = "none";
  addPipe(); // Add initial pipe safely without duplicate
  gameStarted = true;
  loop();
}

// Input handling
function handleInput(e) {
  if (e.type === "keydown" && e.code === "Space") {
    e.preventDefault();
  }
  if (gameOver) return;
  if (!gameStarted) return;
  bird.flap();
}

window.addEventListener("keydown", handleInput);
canvas.addEventListener("touchstart", handleInput);
canvas.addEventListener("mousedown", handleInput);

startBtn.addEventListener("click", resetGame);
restartBtn.addEventListener("click", resetGame);

// Load words
async function init() {
  try {
    const res = await fetch("/api/words");
    const data = await res.json();
    words = data.words || [];
  } catch (err) {
    console.error("Error loading words:", err);
  }
  // Draw initial state
  drawBackground();
  bird.draw();
}

init();
