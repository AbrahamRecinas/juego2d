// Selección del canvas y contexto
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Estados del juego: "start", "playing" y "gameOver"
let gameState = "start";

// Variables globales para el HUD y el estado del juego
let lives = 3;
let safeBombs = 0;
let unsafeBombs = 0;
let gameOver = false;
let elapsedTime = 0;

// Coordenadas del botón (usaremos el mismo para inicio y reinicio)
const button = {
  x: canvas.width / 2 - 75,
  y: canvas.height / 2 + 50,
  width: 150,
  height: 50
};

// Función para verificar Game Over (se cumple si se pierden todas las vidas o hay 20 bombas no seguras)
function checkGameOver() {
  if (lives <= 0 || unsafeBombs >= 20) {
    gameOver = true;
    gameState = "gameOver";
  }
}

// Función para reiniciar el juego (resetea contadores, bombas y reinicia las puertas)
function resetGame() {
  lives = 3;
  safeBombs = 0;
  unsafeBombs = 0;
  gameOver = false;
  elapsedTime = 0;
  bombs = [];
  // Reiniciamos las puertas
  gates.forEach(gate => {
    gate.active = false;
    gate.fullyOpen = false;
    gate.activationProgress = 0;
    gate.spawnCooldown = 3;
    gate.nextSpawnTime = gate.spawnCooldown;
    gate.color = 'gray';
  });
}

// Función para dibujar el HUD (vidas y contadores)
function drawHUD() {
  // Dibujar vidas (círculos rosas)
  const startX = 10, startY = 10, spacing = 30, lifeRadius = 10;
  for (let i = 0; i < lives; i++) {
    ctx.beginPath();
    ctx.arc(startX + i * spacing, startY + lifeRadius, lifeRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'pink';
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.stroke();
  }
  // Contadores de bombas seguras y no seguras
  ctx.font = "20px Arial";
  ctx.fillStyle = "black";
  ctx.fillText("Bombas seguras: " + safeBombs, 10, 50);
  ctx.fillText("Bombas no seguras: " + unsafeBombs, 10, 80);
}

// Función para dibujar la pantalla de inicio
function drawStartScreen() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "30px Arial";
  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  ctx.fillText("Bienvenido al Juego de Bombas", canvas.width / 2, canvas.height / 2 - 50);
  ctx.font = "20px Arial";
  ctx.fillText("Arrastra cada bomba a su zona de color", canvas.width / 2, canvas.height / 2 - 20);
  ctx.fillText("Si no lo haces, explotan y pierdes vidas", canvas.width / 2, canvas.height / 2 + 10);
  
  // Dibujar botón de jugar
  ctx.fillStyle = "lightblue";
  ctx.fillRect(button.x, button.y, button.width, button.height);
  ctx.strokeStyle = "black";
  ctx.strokeRect(button.x, button.y, button.width, button.height);
  ctx.font = "24px Arial";
  ctx.fillStyle = "black";
  ctx.fillText("Jugar", canvas.width / 2, button.y + button.height / 2 + 8);
}

// Función para dibujar la pantalla de Game Over con botón de reiniciar
function drawGameOverScreen() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "50px Arial";
  ctx.fillStyle = "red";
  ctx.textAlign = "center";
  ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 50);
  
  // Mostrar contadores finales
  ctx.font = "20px Arial";
  ctx.fillStyle = "black";
  ctx.fillText("Bombas seguras: " + safeBombs, canvas.width / 2, canvas.height / 2);
  ctx.fillText("Bombas no seguras: " + unsafeBombs, canvas.width / 2, canvas.height / 2 + 30);
  
  // Dibujar botón de reiniciar
  ctx.fillStyle = "lightgreen";
  ctx.fillRect(button.x, button.y, button.width, button.height);
  ctx.strokeStyle = "black";
  ctx.strokeRect(button.x, button.y, button.width, button.height);
  ctx.font = "24px Arial";
  ctx.fillStyle = "black";
  ctx.fillText("Reiniciar", canvas.width / 2, button.y + button.height / 2 + 8);
}

// -------------------------
// Clase Zone
// -------------------------
class Zone {
  constructor(x, y, width, height, color) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
  }
  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
  }
  isInside(bomb) {
    return (
      bomb.x + bomb.radius > this.x &&
      bomb.x - bomb.radius < this.x + this.width &&
      bomb.y + bomb.radius > this.y &&
      bomb.y - bomb.radius < this.y + this.height
    );
  }
  adjustBombPosition(bomb) {
    if (bomb.x - bomb.radius < this.x) bomb.x = this.x + bomb.radius;
    if (bomb.x + bomb.radius > this.x + this.width) bomb.x = this.x + this.width - bomb.radius;
    if (bomb.y - bomb.radius < this.y) bomb.y = this.y + bomb.radius;
    if (bomb.y + bomb.radius > this.y + this.height) bomb.y = this.y + this.height - bomb.radius;
  }
}

const zones = [
  new Zone(0, 150, 150, 300, 'red'),
  new Zone((800 - 300) / 2, 600 - 150, 300, 150, 'green'),
  new Zone(800 - 150, 150, 150, 300, 'blue')
];

function isBombWellInsideZone(bomb, zone) {
  return (
    bomb.x - bomb.radius * 0.7 > zone.x &&
    bomb.x + bomb.radius * 0.7 < zone.x + zone.width &&
    bomb.y - bomb.radius * 0.7 > zone.y &&
    bomb.y + bomb.radius * 0.7 < zone.y + zone.height
  );
}

// -------------------------
// Clase Gate
// -------------------------
class Gate {
  constructor(x, y, width, height, color) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.originalColor = color;
    this.color = 'gray';
    this.active = false;
    this.fullyOpen = false;
    this.activationProgress = 0;
    this.spawnCooldown = 3;
    this.nextSpawnTime = this.spawnCooldown;
    this.cooldownReductionRate = 0.95;
  }
  activate() {
    this.active = true;
  }
  update(deltaTime) {
    if (this.active && !this.fullyOpen) {
      this.activationProgress += deltaTime / 2;
      if (this.activationProgress >= 1) {
        this.fullyOpen = true;
        this.color = 'yellow';
      }
    }
    if (this.fullyOpen) {
      this.nextSpawnTime -= deltaTime;
      if (this.nextSpawnTime <= 0) {
        this.spawnBomb();
        this.nextSpawnTime = this.spawnCooldown;
        this.spawnCooldown *= this.cooldownReductionRate;
        if (this.spawnCooldown < 0.8) this.spawnCooldown = 0.8;
      }
    }
  }
  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(this.x + (this.width / 4) * i, this.y);
      ctx.lineTo(this.x + (this.width / 4) * i, this.y + this.height);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  spawnBomb() {
    const colors = ['red', 'green', 'blue'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    let bomb;
    let attempts = 0;
    do {
      const x = this.x + Math.random() * this.width;
      const y = this.y + this.height + 10;
      bomb = new Bomb(x, y, color);
      bomb.vy = Math.random() * 0.5 + 0.5;
      bomb.vx = (Math.random() * 0.4) - 0.2;
      attempts++;
    } while (this.isOverlapping(bomb) && attempts < 10);
    bombs.push(bomb);
  }
  isOverlapping(newBomb) {
    return bombs.some(existingBomb => {
      const dx = newBomb.x - existingBomb.x;
      const dy = newBomb.y - existingBomb.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < (newBomb.radius + existingBomb.radius + 5);
    });
  }
}

const gates = [
  new Gate(200, 0, 100, 20, 'red'),
  new Gate((canvas.width / 2) - 50, 0, 100, 20, 'green'),
  new Gate(canvas.width - 300, 0, 100, 20, 'blue')
];

// -------------------------
// Clase Bomb
// -------------------------
class Bomb {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.radius = 20;
    this.color = color;
    this.timer = 5;
    this.exploded = false;
    this.beingDragged = false;
    this.insideSafeZone = false;
    // Para contabilizar solo una vez
    this.counted = false;
    this.safeCounted = false;
    this.vx = (Math.random() * 100 - 50) / 60;
    this.vy = (Math.random() * 100 - 50) / 60;
  }
  draw(ctx) {
    if (!this.exploded) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.strokeStyle = this.beingDragged ? '#FFD700' : '#000';
      ctx.lineWidth = this.beingDragged ? 4 : 2;
      ctx.stroke();
    }
  }
  update(deltaTime, bombs, zones, canvasWidth, canvasHeight) {
    if (!this.exploded && !this.beingDragged) {
      this.x += this.vx * (deltaTime * 60);
      this.y += this.vy * (deltaTime * 60);
      if (this.x - this.radius < 0 || this.x + this.radius > canvasWidth) {
        this.vx = -this.vx * 0.5;
        this.x = Math.min(Math.max(this.x, this.radius), canvasWidth - this.radius);
      }
      if (this.y - this.radius < 0 || this.y + this.radius > canvasHeight) {
        this.vy = -this.vy * 0.5;
        this.y = Math.min(Math.max(this.y, this.radius), canvasHeight - this.radius);
      }
      if (!this.insideSafeZone) {
        bombs.forEach(other => {
          if (other !== this && !other.exploded) {
            this.checkCollisionWith(other);
          }
        });
      }
      zones.forEach(zone => {
        if (zone.isInside(this)) {
          if (zone.color === this.color) {
            if (this.insideSafeZone) {
              // Rebote interno en zona segura
              if (this.x - this.radius < zone.x) {
                this.x = zone.x + this.radius;
                this.vx = Math.abs(this.vx);
              }
              if (this.x + this.radius > zone.x + zone.width) {
                this.x = zone.x + zone.width - this.radius;
                this.vx = -Math.abs(this.vx);
              }
              if (this.y - this.radius < zone.y) {
                this.y = zone.y + this.radius;
                this.vy = Math.abs(this.vy);
              }
              if (this.y + this.radius > zone.y + zone.height) {
                this.y = zone.y + zone.height - this.radius;
                this.vy = -Math.abs(this.vy);
              }
            } else {
              this.pushOutOfZone(zone);
            }
          } else {
            // Si la zona es de color distinto, se empuja fuera.
            this.pushOutOfZone(zone);
          }
        }
      });
      this.timer -= deltaTime;
      if (this.timer <= 0 && !this.insideSafeZone) {
        this.exploded = true;
      }
    }
    // Actualizamos contadores (solo una vez por bomba)
    if (this.exploded && !this.counted) {
      if (!this.insideSafeZone) {
        unsafeBombs++;
        lives--;
      }
      this.counted = true;
      checkGameOver();
    }
    if (this.insideSafeZone && !this.safeCounted) {
      safeBombs++;
      this.safeCounted = true;
    }
  }
  pushOutOfZone(zone) {
    const zoneCenterX = zone.x + zone.width / 2;
    const zoneCenterY = zone.y + zone.height / 2;
    const diffX = this.x - zoneCenterX;
    const diffY = this.y - zoneCenterY;
    const mag = Math.sqrt(diffX * diffX + diffY * diffY) || 1;
    const normX = diffX / mag;
    const normY = diffY / mag;
    if (Math.abs(normX) > Math.abs(normY)) {
      if (normX < 0) {
        this.x = zone.x - this.radius;
        this.vx = -Math.abs(this.vx);
      } else {
        this.x = zone.x + zone.width + this.radius;
        this.vx = Math.abs(this.vx);
      }
    } else {
      if (normY < 0) {
        this.y = zone.y - this.radius;
        this.vy = -Math.abs(this.vy);
      } else {
        this.y = zone.y + zone.height + this.radius;
        this.vy = Math.abs(this.vy);
      }
    }
  }
  checkCollisionWith(other) {
    const dx = other.x - this.x;
    const dy = other.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < this.radius + other.radius) {
      const angle = Math.atan2(dy, dx);
      if (!this.insideSafeZone && other.insideSafeZone) {
        const overlap = this.radius + other.radius - distance;
        this.x -= overlap * Math.cos(angle);
        this.y -= overlap * Math.sin(angle);
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        this.vx = -Math.cos(angle) * speed;
        this.vy = -Math.sin(angle) * speed;
      } else if (this.insideSafeZone && !other.insideSafeZone) {
        const overlap = this.radius + other.radius - distance;
        other.x += overlap * Math.cos(angle);
        other.y += overlap * Math.sin(angle);
        const speed = Math.sqrt(other.vx * other.vx + other.vy * other.vy);
        other.vx = Math.cos(angle) * speed;
        other.vy = Math.sin(angle) * speed;
      } else if (!this.insideSafeZone && !other.insideSafeZone) {
        const speedThis = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const speedOther = Math.sqrt(other.vx * other.vx + other.vy * other.vy);
        this.vx = -Math.cos(angle) * speedThis * 0.8;
        this.vy = -Math.sin(angle) * speedThis * 0.8;
        other.vx = Math.cos(angle) * speedOther * 0.8;
        other.vy = Math.sin(angle) * speedOther * 0.8;
        const overlap = this.radius + other.radius - distance;
        this.x -= (overlap / 2) * Math.cos(angle);
        this.y -= (overlap / 2) * Math.sin(angle);
        other.x += (overlap / 2) * Math.cos(angle);
        other.y += (overlap / 2) * Math.sin(angle);
      }
    }
  }
}

let bombs = [];

// -------------------------
// Funciones de dibujo y actualización
// -------------------------
function drawZones() {
  zones.forEach(zone => zone.draw(ctx));
}
function drawGates() {
  gates.forEach(gate => gate.draw(ctx));
}
function updateBombs(deltaTime) {
  bombs.forEach(bomb => bomb.update(deltaTime, bombs, zones, canvas.width, canvas.height));
}
function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawZones();
  drawGates();
  bombs.forEach(bomb => bomb.draw(ctx));
  drawHUD();
}

// -------------------------
// Ciclo de juego
// -------------------------
let lastTime = 0;
function gameLoop(timeStamp) {
  const deltaTime = (timeStamp - lastTime) / 1000;
  lastTime = timeStamp;
  
  if (gameState === "playing") {
    elapsedTime += deltaTime;
    if (elapsedTime > 0) gates[1].activate();
    if (elapsedTime > 10) gates[0].activate();
    if (elapsedTime > 20) gates[2].activate();
    gates.forEach(gate => gate.update(deltaTime));
    updateBombs(deltaTime);
    drawGame();
  } else if (gameState === "start") {
    drawStartScreen();
  } else if (gameState === "gameOver") {
    drawGameOverScreen();
  }
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

// -------------------------
// Manejo de eventos: arrastrar/soltar y botones en pantallas
// -------------------------
let selectedBomb = null;
canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  
  if (gameState === "playing") {
    // Solo se permite arrastrar bombas en modo juego
    bombs.forEach(bomb => {
      if (!bomb.exploded && !bomb.insideSafeZone) {
        const dx = mouseX - bomb.x;
        const dy = mouseY - bomb.y;
        if (Math.sqrt(dx * dx + dy * dy) < bomb.radius) {
          bomb.beingDragged = true;
          selectedBomb = bomb;
        }
      }
    });
  } else if (gameState === "start") {
    // Si se hace clic en la pantalla de inicio, verifica si se presionó el botón "Jugar"
    if (mouseX >= button.x && mouseX <= button.x + button.width &&
        mouseY >= button.y && mouseY <= button.y + button.height) {
      resetGame();
      gameState = "playing";
    }
  } else if (gameState === "gameOver") {
    // En Game Over, si se hace clic en el botón "Reiniciar", se reinicia el juego
    if (mouseX >= button.x && mouseX <= button.x + button.width &&
        mouseY >= button.y && mouseY <= button.y + button.height) {
      resetGame();
      gameState = "playing";
    }
  }
});
canvas.addEventListener('mousemove', (e) => {
  if (gameState === "playing" && selectedBomb) {
    const rect = canvas.getBoundingClientRect();
    selectedBomb.x = e.clientX - rect.left;
    selectedBomb.y = e.clientY - rect.top;
  }
});
canvas.addEventListener('mouseup', () => {
  if (gameState === "playing" && selectedBomb) {
    selectedBomb.beingDragged = false;
    // Al soltar, se evalúa en qué zona se soltó la bomba.
    let droppedInZone = false;
    zones.forEach(zone => {
      if (zone.isInside(selectedBomb)) {
        droppedInZone = true;
        if (zone.color === selectedBomb.color && isBombWellInsideZone(selectedBomb, zone)) {
          selectedBomb.insideSafeZone = true;
          zone.adjustBombPosition(selectedBomb);
        } else {
          // Si se soltó en una zona equivocada, la bomba explota.
          selectedBomb.exploded = true;
        }
      }
    });
    selectedBomb = null;
  }
});
