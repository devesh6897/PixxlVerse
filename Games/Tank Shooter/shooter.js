const canvas = document.getElementById('gameCanvas');
const gl = canvas.getContext('webgl');
const introScreen = document.getElementById('introScreen');
const playButton = document.getElementById('playButton');
const exitButton = document.getElementById('exitButton');
const howToPlayButton = document.getElementById('howToPlayButton');
const howToPlayModal = document.getElementById('howToPlayModal');
const closeHowToPlay = document.getElementById('closeHowToPlay');
const closeInstructionsButton = document.getElementById('closeInstructionsButton');
const pausescreen = document.getElementById('pauseScreen');
const pauseoverlay = document.getElementById('pauseOverlay');
const resume = document.getElementById('resumeButton');
const restart = document.getElementById('restartFromPause');
const menu = document.getElementById('mainMenuFromPause');
const over = document.getElementById('gameOverScreen');

const h = document.getElementById('finalScore');
const hss = document.getElementById('finalHighScore');

const playagain = document.getElementById('restartButton');
const mm = document.getElementById('mainMenuButton');


let isPaused= false;


if (!gl) {
  alert('WebGL not supported, falling back on experimental-webgl');
}



howToPlayButton.addEventListener('click', function() {
  howToPlayModal.style.display = 'block';  
  introScreen.style.display = 'flex';
});


closeHowToPlay.addEventListener('click', function() {
  howToPlayModal.style.display = 'none';  
});

closeInstructionsButton.addEventListener('click', function() {
  howToPlayModal.style.display = 'none';  
});

window.addEventListener('click', function(event) {
  if (event.target === howToPlayModal) {
    howToPlayModal.style.display = 'none';  
  }
});



// Add event listeners for pause menu
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!isPaused) {
    pauseoverlay.style.display = 'block';  
    pausescreen.style.display = 'block';
    isPaused = !isPaused; // Toggle pause state
  }
 else {
    pauseoverlay.style.display = 'none';
    pausescreen.style.display = 'none';
    isPaused = !isPaused; // Toggle pause state
    gameLoop();
  }

  }
});

resume.addEventListener('click', function() {
  pauseoverlay.style.display = 'none';
    pausescreen.style.display = 'none';
    isPaused = !isPaused; // Toggle pause state
    gameLoop();
});
restart.addEventListener('click', function() {
  pauseoverlay.style.display = 'none';
    pausescreen.style.display = 'none';
    isPaused = !isPaused; // Toggle pause state
    gameLoop();
});

menu.addEventListener('click', function() {
  introScreen.style.display = 'flex';       
  
  // Reset game variables after the alert
  score = 0;
  lives = 3;
  blocks = [];
  projectiles = [];
  blockSpeed = 1.0;
  scoreMilestone = 50;
  gameOver = false;
  isPaused = !isPaused; // Toggle pause state
  pauseoverlay.style.display = 'none';
  pausescreen.style.display = 'none';
   // Restart the game loop when the user clicks Play Again
   playButton.addEventListener('click', function() {
    introScreen.style.display = 'none';  // Hide intro screen
    gameLoop();  // Restart the game loop
  });
});

playagain.addEventListener('click', function(event) {

  // Reset game variables
  score = 0;
  lives = 3;
  blocks = [];
  projectiles = [];
  powerUps = [];
  blockSpeed = 1.0;
  scoreMilestone = 50;
  gameOver = false;
    over.style.display = 'none';
    gameLoop();
    document.getElementById('score').innerText = ('Score: ' + score);
    document.getElementById('lives').innerText =('Lives: ' + lives);


  
});

mm.addEventListener('click', function(event) {
  introScreen.style.display = 'flex';       
  
  // Reset game variables after the alert
  score = 0;
  lives = 3;
  blocks = [];
  projectiles = [];
  blockSpeed = 1.0;
  scoreMilestone = 50;
  gameOver = false;
  isPaused = false; // Toggle pause state
  pauseoverlay.style.display = 'none';
  pausescreen.style.display = 'none';
  over.style.display = 'none';

   // Restart the game loop when the user clicks Play Again
   playButton.addEventListener('click', function() {
    introScreen.style.display = 'none';  // Hide intro screen
    gameLoop();  // Restart the game loop
  });
});


// Handle Exit Button Click
exitButton.addEventListener('click', function() {
  introScreen.style.display = 'none';  
  alert('Thanks for playing!');
  window.close(); 
});

// Show the game over screen
function showGameOver() {
  //alert('Game Over! Your Score: ' + score);  
  // introScreen.style.display = 'flex';       
  // playButton.innerText = 'TRY AGAIN!';       
  

  over.style.display = 'block';
  h.innerText =('Score: ' + score);  
  hss.innerText = ('High Score: ' + hs);  

}



// Set the canvas to fullscreen size and adjust viewport
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);
  
  // Update player position to be centered at the bottom of the screen
  player.y = canvas.height - player.height - 10; // Place player 10 pixels above the bottom
  player.x = canvas.width / 2 - player.width / 2; // Center player horizontally
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();  // Initial resize



function toClipSpace(x, y) {
  return {
    x: (x / canvas.width) * 2 - 1,
    y: (y / canvas.height) * -2 + 1,
  };
}

// Handle Play Button Click
playButton.addEventListener('click', function() {
  introScreen.style.display = 'none';  
  howToPlayModal.style.display = 'none';
  gameLoop();  
});




// Player and Game Variables
let player = {
  x: canvas.width / 2 - 25, // Wider shooter block
  y: canvas.height - 100,
  width: 90, // Increase width of the shooter
  height: 80,
  speed: 15,
  //color: [1, 1, 1, 1],  // Changed color (light blue)
};

let projectiles = [];
let blocks = [];
let powerUps = [];
let score = 0;
let lives = 3;
let blockSpawnInterval = 1500;
let blockSpeed = 1.0;
let speedIncrement = 0.5; // Speed increment after each milestone
let scoreMilestone = 10
0; // Increase speed after every 50 points
let gameOver = false;
let hs=0;
let activePowerUps = {
  doubleProjectile: false,
  shield: false
};

const powerUpTypes = {
  doubleProjectile: {
      duration: 10000, // Effect lasts 5 seconds
      color: [0.0, 1.0, 0.0, 1.0] // Green color for double projectile
  },
  // shield: {
  //     duration: 10000, // Effect lasts 5 seconds
  //     color: [1.0, 0.0, 1.0, 1.0] // Purple color for shield
  // }
};

function createTexture(imageSrc, callback) {
  const texture = gl.createTexture();
  const image = new Image();
  image.src = imageSrc;

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);


  image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);

      // Use NEAREST filtering for pixel-perfect rendering
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

      // Strict edge handling
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      gl.texImage2D(
          gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image
      );

      gl.bindTexture(gl.TEXTURE_2D, null);

      if (callback) callback(texture);
  };

  return texture;
}


const backtex=createTexture('./images/b.jpeg');
const blockTexture = createTexture('tnt.png');
const powerUpTexture = createTexture('powerup.png');
const playerTexture = createTexture('tank.png');
const bulletTexture = createTexture('bullet.png');

// Resize canvas
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Convert screen space to clip space
function toClipSpace(x, y) {
  return {
      x: (x / canvas.width) * 2 - 1,
      y: (y / canvas.height) * -2 + 1,
  };
}


// Function to shoot a projectile
function shootProjectile() {
  let projectileX = player.x + player.width / 2 - 5;

  if (activePowerUps.doubleProjectile) {
      // Shoot two projectiles when doubleProjectile is active
      projectiles.push({
          x: projectileX - 10,
          y: player.y,
          width: 10,
          height: 15,
          speed: 5,
          color: [1.0, 0.8, 0.0, 1.0]
      });
      projectiles.push({
          x: projectileX + 10,
          y: player.y,
          width: 10,
          height: 15,
          speed: 5,
          color: [1.0, 0.8, 0.0, 1.0]
      });
  } else {
      projectiles.push({
          x: projectileX,
          y: player.y,
          width: 10,
          height: 15,
          speed: 5,
          color: [1.0, 0.8, 0.0, 1.0]
      });
  }
}

// Function to spawn a new block
function spawnBlock() {
  let blockWidth = 50;
  blocks.push({
    x: Math.random() * (canvas.width - blockWidth),
    y: 0,
    width: blockWidth,
    height: 50,
    speed: blockSpeed, 
    hitPoints: Math.floor(Math.random() * 3) + 1, // Hit points (1-3)
  });
}

// Function to spawn power-ups
function spawnPowerUp() {
  let powerUpTypeKeys = Object.keys(powerUpTypes);
  let randomType = powerUpTypeKeys[Math.floor(Math.random() * powerUpTypeKeys.length)];

  powerUps.push({
      x: Math.random() * (canvas.width - 20),
      y: 0,
      width: 40,
      height: 40,
      type: randomType,
      color: powerUpTypes[randomType].color,
      speed: 1
  });
}
// Load sound effect for explosion
const explosionSound = new Audio('x.wav');
explosionSound.volume = 0.2; // Adjust volume as needed

// Function to handle collision detection
function checkCollisions() {
  projectiles.forEach((proj, pIndex) => {
    blocks.forEach((block, bIndex) => {
      if (
        proj.x < block.x + block.width &&
        proj.x + proj.width > block.x &&
        proj.y < block.y + block.height &&
        proj.y + proj.height > block.y
      ) {
        block.hitPoints--;
        if (block.hitPoints <= 0) {
          blocks.splice(bIndex, 1);
          score += 10;
          document.getElementById('score').innerText = score;

          explosionSound.currentTime = 0; // Reset sound for rapid play
                    explosionSound.play(); // Play explosion sound
        }
        projectiles.splice(pIndex, 1);
      }
    });
  });

  // Check if blocks collide with the player or hit the bottom of the screen
  blocks.forEach((block, index) => {
    if (
      block.y + block.height >= player.y &&
      block.x < player.x + player.width &&
      block.x + block.width > player.x
    ) {
      lives--;
      document.getElementById('lives').innerText = lives;
      blocks.splice(index, 1);
      if (lives <= 0) {
        gameOver = true;
      }
    } else if (block.y > canvas.height) {
      blocks.splice(index, 1);
    }
  });
}

function checkPowerUpCollisions() {
  powerUps = powerUps.filter((powerUp) => {
      if (
          powerUp.y + powerUp.height >= player.y &&
          powerUp.x < player.x + player.width &&
          powerUp.x + powerUp.width > player.x
      ) {
          activatePowerUp(powerUp.type);
          return false; // Remove the power-up
      }
      return powerUp.y <= canvas.height; // Keep only power-ups within bounds
  });
}

// Function to activate a power-up
function activatePowerUp(type) {
  const currentTime = Date.now();
  const powerUpDuration = powerUpTypes[type].duration;

  // Extend the power-up expiration time
  if (!activePowerUps[type] || activePowerUps[type] < currentTime) {
      activePowerUps[type] = currentTime + powerUpDuration;
  } else {
      // If already active, extend its duration
      activePowerUps[type] += powerUpDuration;
  }
}

// Function to update the game state
function updateGameState() {
  if (gameOver) {
    if (hs<score){
      hs=score;
    }

    if(gameOver){
      showGameOver();

    }
    
    return;
  }

    // Increase block speed based on score milestones
    if (score > 0 && score % scoreMilestone === 0) {
      blockSpeed += speedIncrement;
      scoreMilestone += 50; // Next milestone at a higher score
    }

    const currentTime = Date.now();

    // Check power-up expirations
    Object.keys(activePowerUps).forEach((type) => {
        if (activePowerUps[type] && currentTime > activePowerUps[type]) {
            activePowerUps[type] = false; // Deactivate power-up
        }
    });

  projectiles.forEach((proj, index) => {
    proj.y -= proj.speed;
    if (proj.y < 0) {
      projectiles.splice(index, 1);
    }
  });

  blocks.forEach((block) => {
    block.y += block.speed;
  });

  powerUps.forEach((powerUp) => {
    powerUp.y += powerUp.speed;
});

  checkCollisions();
  checkPowerUpCollisions();

}


// Helper function to draw a rectangle in WebGL
function drawRectangle(x, y, width, height, color) {
  const clip = {
    x: toClipSpace(x, y).x,
    y: toClipSpace(x, y).y,
    x2: toClipSpace(x + width, y + height).x,
    y2: toClipSpace(x + width, y + height).y,
  };

  const vertices = new Float32Array([
    clip.x, clip.y,
    clip.x2, clip.y,
    clip.x, clip.y2,
    clip.x2, clip.y2,
  ]);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  // Position attribute
  const positionLocation = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 4 * 4, 0);

  // Texture coordinate attribute
  const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
  gl.enableVertexAttribArray(texCoordLocation);
  gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 4 * 4, 2 * 4);

  // Color uniform
  const colorLocation = gl.getUniformLocation(program, 'uColor');
  gl.uniform4fv(colorLocation, color);

  // Unbind any existing texture to render solid color
  gl.bindTexture(gl.TEXTURE_2D, null);

  // Draw the rectangle
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

// Function to render the game
function renderGame() {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  drawTexturedRectangle(0, 0, canvas.width, canvas.height, backtex);

  drawTexturedRectangle(player.x, player.y, player.width, player.height, playerTexture);

  projectiles.forEach((proj) => {
      drawTexturedRectangle(proj.x, proj.y, proj.width, proj.height, bulletTexture);
  });

  blocks.forEach((block) => {
      drawTexturedRectangle(block.x, block.y, block.width, block.height, blockTexture);
  });

  powerUps.forEach((powerUp) => {
      drawTexturedRectangle(powerUp.x, powerUp.y, powerUp.width, powerUp.height, powerUpTexture);
  });
}

// Helper function to draw a rectangle in WebGL
function drawTexturedRectangle(x, y, width, height, texture) {
  const clip = {
      x: toClipSpace(x, y).x,
      y: toClipSpace(x, y).y,
      x2: toClipSpace(x + width, y + height).x,
      y2: toClipSpace(x + width, y + height).y,
  };

  const vertices = new Float32Array([
      clip.x, clip.y, 0.0, 0.0, // Bottom-left
      clip.x2, clip.y, 1.0, 0.0, // Bottom-right
      clip.x, clip.y2, 0.0, 1.0, // Top-left
      clip.x2, clip.y2, 1.0, 1.0, // Top-right
  ]);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  // Pass position attribute
  const positionLocation = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 4 * 4, 0);

  // Pass texture coordinates
  const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
  const textureUniform = gl.getUniformLocation(program, 'u_texture');

  gl.enableVertexAttribArray(texCoordLocation);
  gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 4 * 4, 2 * 4);

  // Bind texture
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Draw the rectangle
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}


// WebGL shader setup
const vertexShaderSource = `
    attribute vec4 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
    void main() {
        gl_Position = a_position;
        v_texCoord = a_texCoord;
    }
`;

const fragmentShaderSource = `
    precision mediump float;
    varying vec2 v_texCoord;
    uniform sampler2D u_texture;
    uniform vec4 uColor; // For fallback when no texture is bound
    void main() {
        vec4 texColor = texture2D(u_texture, v_texCoord);
        gl_FragColor = texColor.a > 0.0 ? texColor : uColor; // Use uColor if no texture
    }
`;

const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, vertexShaderSource);
gl.compileShader(vertexShader);

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, fragmentShaderSource);
gl.compileShader(fragmentShader);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);

// Load sound effect for shooting
const shootSound = new Audio('y.wav');
shootSound.volume = 0.3; // Adjust volume as needed

// Function to play the shooting sound
function playShootSound() {
    shootSound.currentTime = 0; // Reset sound to start for rapid firing
    shootSound.play();
}
// // Input handlers
// window.addEventListener('mousemove', (event) => {
//   let rect = canvas.getBoundingClientRect();
// let mouseX = event.clientX - rect.left;
// player.x = Math.max(0, Math.min(mouseX - player.width / 2, canvas.width - player.width));

// });

// // Handle mouse click for shooting
// canvas.addEventListener('mousedown', (event) => {
//   if (event.button === 0) {
//     shootProjectile();
//     playShootSound();
//   }
// });

// Input handlers
window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft' || event.key === 'a' || event.key === 'A') {
      player.x -= player.speed;
  } else if (event.key === 'ArrowRight'  ||  event.key === 'd' || event.key === 'D') {
      player.x += player.speed;
  } else if (event.key === ' ') {
      shootProjectile();
      playShootSound(); // Play the sound on shooting
  }
});


setInterval(spawnBlock, blockSpawnInterval);
setInterval(spawnPowerUp, 10000); // Spawn power-ups every 10 seconds

// Add event listeners for pause menu
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
      togglePauseMenu();
  }
});

// Game loop
function gameLoop() {

  if (!isPaused || !gameOver) {
    updateGameState();
    renderGame();
    requestAnimationFrame(gameLoop);
  }
}
