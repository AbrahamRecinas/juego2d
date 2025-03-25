// Selección del canvas y contexto
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.font = '16px "Press Start 2P"';
// Crea y carga la imagen de fondo (asegúrate de que la ruta sea correcta)
const backgroundImage = new Image();
backgroundImage.src = 'assets/floor.svg';
// Carga la imagen de corazón (asegúrate de que la ruta sea correcta)
const heartImage = new Image();
heartImage.src = 'assets/heart.png';

// Sprites para bombas en movimiento (no seguras)
// Rojo
const rbomb1Sprite = new Image();
rbomb1Sprite.src = 'assets/rbomb1.png';
const rbomb2Sprite = new Image();
rbomb2Sprite.src = 'assets/rbomb2.png';
// Azul
const abomb1Sprite = new Image();
abomb1Sprite.src = 'assets/abomb1.png';
const abomb2Sprite = new Image();
abomb2Sprite.src = 'assets/abomb2.png';
// Verde
const vbomb1Sprite = new Image();
vbomb1Sprite.src = 'assets/vbomb1.png';
const vbomb2Sprite = new Image();
vbomb2Sprite.src = 'assets/vbomb2.png';

// Sprites para bombas en zona segura
// Rojo
const saferbomb1Sprite = new Image();
saferbomb1Sprite.src = 'assets/saferbomb1.png';
const saferbomb2Sprite = new Image();
saferbomb2Sprite.src = 'assets/saferbomb2.png';
// Azul
const safeabomb1Sprite = new Image();
safeabomb1Sprite.src = 'assets/safeabomb1.png';
const safeabomb2Sprite = new Image();
safeabomb2Sprite.src = 'assets/safeabomb2.png';
// Verde
const safevbomb1Sprite = new Image();
safevbomb1Sprite.src = 'assets/safevbomb1.png';
const safevbomb2Sprite = new Image();
safevbomb2Sprite.src = 'assets/safevbomb2.png';

// Sprites para animación de explosión
const explosion1Sprite = new Image();
explosion1Sprite.src = 'assets/explosion1.png';
const explosion2Sprite = new Image();
explosion2Sprite.src = 'assets/explosion2.png';

// Texturas para las zonas seguras
const safezoneR = new Image();
safezoneR.src = 'assets/safezoneR.png';  // Para la zona roja (dimensiones: 150x300)

const safezoneV = new Image();
safezoneV.src = 'assets/safezoneV.png';  // Para la zona verde (dimensiones: 300x150)

const safezoneA = new Image();
safezoneA.src = 'assets/safezoneA.png';  // Para la zona azul (dimensiones: 150x300)

// Cargar los sprites para la puerta:
const puerta1Sprite = new Image();
puerta1Sprite.src = 'assets/puerta1.png';
const puerta2Sprite = new Image();
puerta2Sprite.src = 'assets/puerta2.png';

// Estados del juego: "start", "playing" y "gameOver"
let gameState = "start";

// Variables globales para el HUD y estado del juego
let lives = 3;
let safeBombs = 0;  // Se incrementa cuando una bomba se marca como segura
let gameOver = false;
let elapsedTime = 0;

// Botón (para inicio y reinicio)
const button = {
  x: canvas.width / 2 - 75,
  y: canvas.height / 2 + 50,
  width: 150,
  height: 50
};

// Función que retorna el número de bombas activas que aún no están seguras
function getUnsafeBombCount() {
  return bombs.filter(bomb => !bomb.exploded && !bomb.insideSafeZone).length;
}

// Verifica las condiciones de Game Over: 0 vidas o 20 bombas sin asegurar en pantalla
function checkGameOver() {
  if (lives <= 0 || getUnsafeBombCount() >= 20) {
    gameOver = true;
    gameState = "gameOver";
  }
}

// Reinicia el juego: resetea variables, vacía bombas y reinicia las puertas
function resetGame() {
  lives = 3;
  safeBombs = 0;
  gameOver = false;
  elapsedTime = 0;
  bombs = [];
  gates.forEach(gate => {
    gate.active = false;
    gate.fullyOpen = false;
    gate.activationProgress = 0;
    gate.spawnCooldown = 3;
    gate.nextSpawnTime = gate.spawnCooldown;
    gate.color = 'gray';
  });
}

// Dibuja el HUD (texto, vidas y contadores)
// Se muestra "Vidas:" seguido de círculos rosas,
// "Bombas Seguras:" y "Bombas No Seguras:" (este último se calcula dinámicamente)
function drawHUD() {
  // Dibujar texto "Vidas:" y los corazones
  ctx.font = "18px Arial";
  ctx.fillStyle = "black";
  ctx.textAlign = "left";
  ctx.fillText("Vidas:", 20, 30);
  const heartSize = 20; // Ajusta el tamaño según necesites
  const heartSpacing = 30;
  for (let i = 0; i < lives; i++) {
    ctx.drawImage(heartImage, 90 + i * heartSpacing - heartSize/2, 20 - heartSize/2, heartSize, heartSize);
  }
  // Dibujar contadores de bombas
  ctx.font = "18px Arial";
  ctx.fillStyle = "black";
  ctx.fillText("Bombas Seguras: " + safeBombs, 20, 60);
  ctx.fillText("Bombas No Seguras: " + getUnsafeBombCount(), 20, 85);
}


// Pantalla de inicio
function drawStartScreen() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = "center";
  ctx.fillStyle = "black";
  ctx.font = "30px Arial";
  ctx.fillText("Bienvenido al Juego de Bombas", canvas.width / 2, canvas.height / 2 - 60);
  ctx.font = "20px Arial";
  ctx.fillText("Arrastra cada bomba a su zona de color", canvas.width / 2, canvas.height / 2 - 20);
  ctx.fillText("Si no lo haces, explotarán y perderás vidas", canvas.width / 2, canvas.height / 2 + 10);
  
  // Botón "Jugar"
  ctx.fillStyle = "lightblue";
  ctx.fillRect(button.x, button.y, button.width, button.height);
  ctx.strokeStyle = "black";
  ctx.strokeRect(button.x, button.y, button.width, button.height);
  ctx.font = "24px Arial";
  ctx.fillStyle = "black";
  ctx.fillText("Jugar", canvas.width / 2, button.y + button.height / 2 + 8);
}

// Pantalla de Game Over
function drawGameOverScreen() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = "center";
  ctx.font = "50px Arial";
  ctx.fillStyle = "red";
  ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 60);
  
  // Mostrar contadores finales
  ctx.font = "20px Arial";
  ctx.fillStyle = "black";
  ctx.fillText("Bombas Seguras: " + safeBombs, canvas.width / 2, canvas.height / 2);
  ctx.fillText("Bombas No Seguras: " + getUnsafeBombCount(), canvas.width / 2, canvas.height / 2 + 30);
  
  // Botón "Reiniciar"
  ctx.fillStyle = "lightgreen";
  ctx.fillRect(button.x, button.y, button.width, button.height);
  ctx.strokeStyle = "black";
  ctx.strokeRect(button.x, button.y, button.width, button.height);
  ctx.font = "24px Arial";
  ctx.fillStyle = "black";
  ctx.fillText("Reiniciar", canvas.width / 2, button.y + button.height / 2 + 8);
}

// -------------------------------------------------
// Clases: Zone, Gate y Bomb
// -------------------------------------------------
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

class Gate {
  constructor(x, y, color) {
    // Dimensiones fijas: 100 de ancho y 80 de alto.
    this.x = x;
    this.y = y;
    this.width = 100;
    this.height = 80;
    this.originalColor = color; // Puede usarse para identificar el color, si es necesario.
    
    // Estado de la puerta
    this.active = false;
    this.fullyOpen = false;
    this.activationProgress = 0;
    
    // Temporizador para la aparición de bombas
    this.spawnCooldown = 3; 
    this.nextSpawnTime = this.spawnCooldown;
    this.cooldownReductionRate = 0.95;
    
    // Propiedades para la animación de la puerta
    this.animationTime = 0;
    this.currentFrame = 0; // 0: mostrar puerta1Sprite, 1: mostrar puerta2Sprite
  }
  
  activate() {
    this.active = true;
  }
  
  update(deltaTime) {
    // Si la puerta se activa y aún no ha completado su apertura
    if (this.active && !this.fullyOpen) {
      // Incrementa la progresión de activación
      this.activationProgress += deltaTime / 2;
      // Actualiza la animación: se alterna cada 0.3 segundos
      this.animationTime += deltaTime;
      if (this.animationTime >= 0.3) {
        this.currentFrame = (this.currentFrame + 1) % 2;
        this.animationTime = 0;
      }
      // Cuando la progresión alcanza 1, se considera "completamente abierta" para efectos de spawn
      if (this.activationProgress >= 1) {
        this.fullyOpen = true;
      }
    }
    // Si la puerta ya está activada (active true), la animación se mantiene
    if (this.active) {
      this.animationTime += deltaTime;
      if (this.animationTime >= 0.3) {
        this.currentFrame = (this.currentFrame + 1) % 2;
        this.animationTime = 0;
      }
    }
    // Cuando la puerta está completamente abierta, se encarga de generar bombas
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
    let sprite;
    // Si la puerta no está activada, se muestra en estado cerrado (puerta1Sprite)
    if (!this.active) {
      sprite = puerta1Sprite;
    } else {
      // Una vez activada, sin importar si está "completamente abierta" o no, se anima siempre
      sprite = (this.currentFrame === 0) ? puerta1Sprite : puerta2Sprite;
    }
    ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
  }
  
  spawnBomb() {
    const colors = ['red', 'green', 'blue'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    let bomb;
    let attempts = 0;
    do {
      // La bomba aparece a lo largo del ancho de la puerta, en su borde superior.
      const x = this.x + Math.random() * this.width;
      const y = this.y; // Aparece justo en la parte superior de la puerta.
      bomb = new Bomb(x, y, color);
      // Asignamos velocidades bajas iniciales para el spawn
      bomb.vy = Math.random() * 0.2 + 0.2;  // Por ejemplo, entre 0.2 y 0.4
      bomb.vx = (Math.random() * 0.2) - 0.1;  // Pequeña variación horizontal
      // Guardamos la posición de spawn y marcamos la bomba como en "fase de spawn"
      bomb.spawnY = this.y;
      bomb.spawning = true;
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

class Bomb {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.radius = 20; // Se dibuja en 40x40 píxeles.
    this.color = color;
    this.timer = 3; // La bomba explota a los 3 segundos si no está segura.
    this.exploded = false;
    this.beingDragged = false;
    this.insideSafeZone = false;
    this.counted = false;      // Para descontar la vida solo una vez.
    this.safeCounted = false;  // Para contar la bomba segura solo una vez.
    // Propiedades para la animación normal.
    this.animationTime = 0;
    this.currentFrame = 0;     // 0: primer sprite, 1: segundo sprite.
    // Propiedades para la animación de explosión.
    this.explosionAnimationTime = 0;
    this.explosionCurrentFrame = 0;
    // Control de explosión
    this.explosionStarted = false;
    this.explosionDuration = 0;
    this.finished = false;
    // Propiedades de velocidad (se asignan en spawnBomb para la fase inicial)
    this.vx = (Math.random() * 100 - 50) / 60;
    this.vy = (Math.random() * 100 - 50) / 60;
    // Propiedades para el "spawn"
    this.spawning = false;  // Se marca true mientras está en fase de spawn.
    this.spawnY = 0;        // Se asignará en spawnBomb.
  }
  
  update(deltaTime, bombs, zones, canvasWidth, canvasHeight) {
    if (!this.exploded && !this.beingDragged) {
      // Actualiza la posición.
      this.x += this.vx * (deltaTime * 60);
      this.y += this.vy * (deltaTime * 60);
      
      // Rebote en los límites del canvas.
      if (this.x - this.radius < 0 || this.x + this.radius > canvasWidth) {
        this.vx = -this.vx * 0.5;
        this.x = Math.min(Math.max(this.x, this.radius), canvasWidth - this.radius);
      }
      if (this.y - this.radius < 0 || this.y + this.radius > canvasHeight) {
        this.vy = -this.vy * 0.5;
        this.y = Math.min(Math.max(this.y, this.radius), canvasHeight - this.radius);
      }
      
      // Si la bomba estaba en fase de spawn y ya se alejó del área de la puerta,
      // se le reasignan velocidades "normales".
      if (this.spawning && this.y > this.spawnY + 20) {
        this.spawning = false;
        // Asigna nuevos valores "normales".
        this.vy = Math.random() * 0.5 + 0.5;
        this.vx = (Math.random() * 0.4) - 0.2;
      }
      
      // Actualizar animación normal (cambia de frame cada 0.3 segundos).
      this.animationTime += deltaTime;
      if (this.animationTime >= 0.3) {
        this.currentFrame = (this.currentFrame + 1) % 2;
        this.animationTime = 0;
      }
      
      // Procesar colisiones con otras bombas (solo si no está en zona segura).
      if (!this.insideSafeZone) {
        bombs.forEach(other => {
          if (other !== this && !other.exploded) {
            this.checkCollisionWith(other);
          }
        });
      }
      
      // Interacción con las zonas.
      zones.forEach(zone => {
        if (zone.isInside(this)) {
          if (zone.color === this.color) {
            if (this.insideSafeZone) {
              // Rebote interno en la zona segura.
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
            this.pushOutOfZone(zone);
          }
        }
      });
      
      // Disminuir el temporizador; si se agota y la bomba no está en zona segura, explota.
      this.timer -= deltaTime;
      if (this.timer <= 0 && !this.insideSafeZone) {
        this.exploded = true;
      }
    } else if (this.exploded) {
      // Actualizar animación de explosión: alterna cada 0.3 segundos.
      if (!this.explosionStarted) {
        this.explosionDuration = 3; // La animación de explosión dura 3 segundos.
        this.explosionStarted = true;
      }
      this.explosionAnimationTime += deltaTime;
      if (this.explosionAnimationTime >= 0.3) {
        this.explosionCurrentFrame = (this.explosionCurrentFrame + 1) % 2;
        this.explosionAnimationTime = 0;
      }
      this.explosionDuration -= deltaTime;
      if (this.explosionDuration <= 0) {
        this.finished = true; // La bomba ya no se dibuja.
      }
    }
    
    // Si la bomba explota y no se ha descontado la vida, descuenta una (solo una vez).
    if (this.exploded && !this.counted) {
      lives--;
      this.counted = true;
      checkGameOver();
    }
    
    // Si la bomba se marca como segura y no se ha contado, incrementa el contador.
    if (this.insideSafeZone && !this.safeCounted) {
      safeBombs++;
      this.safeCounted = true;
    }
    
    checkGameOver();
  }
  
  draw(ctx) {
    if (this.finished) return; // No dibuja si ya terminó la animación de explosión.
    
    if (this.exploded) {
      // Dibujar la animación de explosión.
      let explosionSprite = (this.explosionCurrentFrame === 0)
                              ? explosion1Sprite
                              : explosion2Sprite;
      ctx.drawImage(
        explosionSprite,
        this.x - this.radius,
        this.y - this.radius,
        this.radius * 2,
        this.radius * 2
      );
    } else {
      // Seleccionar el sprite según el estado (zona segura o no) y el color.
      let sprite;
      if (this.insideSafeZone) {
        if (this.color === 'red') {
          sprite = (this.currentFrame === 0) ? saferbomb1Sprite : saferbomb2Sprite;
        } else if (this.color === 'blue') {
          sprite = (this.currentFrame === 0) ? safeabomb1Sprite : safeabomb2Sprite;
        } else if (this.color === 'green') {
          sprite = (this.currentFrame === 0) ? safevbomb1Sprite : safevbomb2Sprite;
        }
      } else {
        if (this.color === 'red') {
          sprite = (this.currentFrame === 0) ? rbomb1Sprite : rbomb2Sprite;
        } else if (this.color === 'blue') {
          sprite = (this.currentFrame === 0) ? abomb1Sprite : abomb2Sprite;
        } else if (this.color === 'green') {
          sprite = (this.currentFrame === 0) ? vbomb1Sprite : vbomb2Sprite;
        }
      }
      ctx.drawImage(
        sprite,
        this.x - this.radius,
        this.y - this.radius,
        this.radius * 2,
        this.radius * 2
      );
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

// -------------------------------------------------
// Funciones de dibujo y actualización del juego
// -------------------------------------------------
function drawZones() {
  zones.forEach(zone => {
    if (zone.color === 'red') {
      ctx.drawImage(safezoneR, zone.x, zone.y, zone.width, zone.height);
    } else if (zone.color === 'green') {
      ctx.drawImage(safezoneV, zone.x, zone.y, zone.width, zone.height);
    } else if (zone.color === 'blue') {
      ctx.drawImage(safezoneA, zone.x, zone.y, zone.width, zone.height);
    }
  });
}
function drawGates() {
  gates.forEach(gate => gate.draw(ctx));
}
// Función para dibujar el fondo
function drawBackground() {
  // Dibuja la imagen abarcando todo el canvas
  ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
}
function updateBombs(deltaTime) {
  bombs.forEach(bomb => bomb.update(deltaTime, bombs, zones, canvas.width, canvas.height));
}
function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground(); // Si tienes un fondo, por ejemplo, floor.svg
  drawZones();      // Dibuja las zonas seguras con sus texturas
  drawGates();
  bombs.forEach(bomb => bomb.draw(ctx));
  drawHUD();
}

// -------------------------------------------------
// Ciclo de juego
// -------------------------------------------------
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

// -------------------------------------------------
// Manejo de eventos: arrastrar/soltar y botones
// -------------------------------------------------
let selectedBomb = null;
canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  
  if (gameState === "playing") {
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
    if (mouseX >= button.x && mouseX <= button.x + button.width &&
        mouseY >= button.y && mouseY <= button.y + button.height) {
      resetGame();
      gameState = "playing";
    }
  } else if (gameState === "gameOver") {
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
    zones.forEach(zone => {
      if (zone.isInside(selectedBomb)) {
        if (zone.color === selectedBomb.color && isBombWellInsideZone(selectedBomb, zone)) {
          selectedBomb.insideSafeZone = true;
          zone.adjustBombPosition(selectedBomb);
        } else {
          selectedBomb.exploded = true;
        }
      }
    });
    selectedBomb = null;
  }
});
