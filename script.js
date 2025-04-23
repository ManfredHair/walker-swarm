// Walker Swarm Simulation - The Walking Dead Themed
// Baseado nas especificações fornecidas

// Constantes e configurações
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const WALKER_RADIUS = 16; // Tamanho do walker (raio)
const SURVIVOR_RADIUS = 16; // Tamanho do sobrevivente (raio)
const OBSTACLE_COUNT = 5; // Número de obstáculos iniciais

// Estados dos walkers
const WALKER_STATE = {
    IDLE: 'idle',
    ALERT: 'alert',
    INVESTIGATE: 'investigate',
    FOLLOW: 'follow',
    ATTACK: 'attack'
};

// Classe principal do jogo
class WalkerSimulation {
    constructor() {
        // Elementos do DOM
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Configurações do jogo
        this.walkers = [];
        this.survivors = [];
        this.obstacles = [];
        this.soundEvents = [];
        this.hordes = [];
        
        // Contadores e estatísticas
        this.hordeCount = 0;
        this.activeWalkers = 0;
        this.survivorCount = 0;
        
        // Controles e configurações
        this.walkerCount = 30;
        this.soundRadius = 150;
        this.walkerSpeed = 1;
        this.flockingStrength = 0.5;
        this.showObstacles = true;
        this.showSurvivors = true;
        
        // Sprites e recursos visuais
        this.sprites = {
            walker: null,
            survivor: null
        };
        
        // Inicialização
        this.init();
    }
    
    // Inicialização do jogo
    init() {
        // Carregar sprites
        this.loadSprites();
        
        // Configurar eventos
        this.setupEventListeners();
        
        // Inicializar elementos do jogo
        this.resetSimulation();
        
        // Iniciar loop do jogo
        this.gameLoop();
    }
    
    // Carregar sprites
    loadSprites() {
        // Carregar sprite do walker
        this.sprites.walker = new Image();
        this.sprites.walker.src = 'images/zombie_skeleton_sprites.png';
        
        // Carregar sprite do sobrevivente
        this.sprites.survivor = new Image();
        this.sprites.survivor.src = 'images/survivor_rifle.png';
    }
    
    // Configurar listeners de eventos
    setupEventListeners() {
        // Evento de clique no canvas (criar evento sonoro)
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.createSoundEvent(x, y);
        });
        
        // Eventos dos controles deslizantes
        document.getElementById('walkerCount').addEventListener('input', (e) => {
            this.walkerCount = parseInt(e.target.value);
            document.getElementById('walkerCountValue').textContent = this.walkerCount;
            this.resetSimulation();
        });
        
        document.getElementById('soundRadius').addEventListener('input', (e) => {
            this.soundRadius = parseInt(e.target.value);
            document.getElementById('soundRadiusValue').textContent = this.soundRadius;
        });
        
        document.getElementById('walkerSpeed').addEventListener('input', (e) => {
            this.walkerSpeed = parseFloat(e.target.value);
            document.getElementById('walkerSpeedValue').textContent = this.walkerSpeed;
        });
        
        document.getElementById('flockingStrength').addEventListener('input', (e) => {
            this.flockingStrength = parseFloat(e.target.value);
            document.getElementById('flockingStrengthValue').textContent = this.flockingStrength;
        });
        
        // Checkboxes
        document.getElementById('showObstacles').addEventListener('change', (e) => {
            this.showObstacles = e.target.checked;
        });
        
        document.getElementById('showSurvivors').addEventListener('change', (e) => {
            this.showSurvivors = e.target.checked;
            if (this.showSurvivors && this.survivors.length === 0) {
                this.createSurvivors(3); // Criar sobreviventes se não existirem
            }
        });
        
        // Botão de reset
        document.getElementById('resetButton').addEventListener('click', () => {
            this.resetSimulation();
        });
    }
    
    // Criar evento sonoro
    createSoundEvent(x, y) {
        const soundEvent = {
            x: x,
            y: y,
            radius: this.soundRadius,
            maxRadius: this.soundRadius,
            age: 0,
            maxAge: 100 // Duração do evento sonoro
        };
        
        this.soundEvents.push(soundEvent);
    }
    
    // Criar walkers
    createWalkers(count) {
        this.walkers = [];
        
        for (let i = 0; i < count; i++) {
            // Posição aleatória, evitando obstáculos
            let x, y;
            let validPosition = false;
            
            while (!validPosition) {
                x = Math.random() * (CANVAS_WIDTH - 2 * WALKER_RADIUS) + WALKER_RADIUS;
                y = Math.random() * (CANVAS_HEIGHT - 2 * WALKER_RADIUS) + WALKER_RADIUS;
                
                validPosition = true;
                
                // Verificar colisão com obstáculos
                for (const obstacle of this.obstacles) {
                    const dx = x - obstacle.x;
                    const dy = y - obstacle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < WALKER_RADIUS + obstacle.radius) {
                        validPosition = false;
                        break;
                    }
                }
            }
            
            // Criar walker
            const walker = {
                id: i,
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * this.walkerSpeed,
                vy: (Math.random() - 0.5) * this.walkerSpeed,
                radius: WALKER_RADIUS,
                state: WALKER_STATE.IDLE,
                target: null,
                frameIndex: Math.floor(Math.random() * 3), // Frame inicial aleatório
                frameDelay: 0,
                frameRate: 10, // Taxa de atualização da animação
                spriteRow: Math.floor(Math.random() * 4), // Linha do sprite (variação de aparência)
                hordeId: null
            };
            
            this.walkers.push(walker);
        }
        
        this.activeWalkers = count;
        document.getElementById('activeWalkers').textContent = count;
    }
    
    // Criar sobreviventes
    createSurvivors(count) {
        this.survivors = [];
        
        if (!this.showSurvivors) return;
        
        for (let i = 0; i < count; i++) {
            // Posição aleatória, evitando obstáculos e walkers
            let x, y;
            let validPosition = false;
            
            while (!validPosition) {
                x = Math.random() * (CANVAS_WIDTH - 2 * SURVIVOR_RADIUS) + SURVIVOR_RADIUS;
                y = Math.random() * (CANVAS_HEIGHT - 2 * SURVIVOR_RADIUS) + SURVIVOR_RADIUS;
                
                validPosition = true;
                
                // Verificar colisão com obstáculos
                for (const obstacle of this.obstacles) {
                    const dx = x - obstacle.x;
                    const dy = y - obstacle.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < SURVIVOR_RADIUS + obstacle.radius) {
                        validPosition = false;
                        break;
                    }
                }
                
                // Verificar colisão com walkers
                if (validPosition) {
                    for (const walker of this.walkers) {
                        const dx = x - walker.x;
                        const dy = y - walker.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        if (distance < SURVIVOR_RADIUS + walker.radius + 50) { // Manter distância dos walkers
                            validPosition = false;
                            break;
                        }
                    }
                }
            }
            
            // Criar sobrevivente
            const survivor = {
                id: i,
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 0.5, // Movimento lento
                vy: (Math.random() - 0.5) * 0.5,
                radius: SURVIVOR_RADIUS,
                health: 100,
                frameIndex: 0,
                frameDelay: 0,
                frameRate: 15,
                lastSoundTime: 0,
                soundInterval: Math.random() * 300 + 200 // Intervalo aleatório para emitir sons
            };
            
            this.survivors.push(survivor);
        }
        
        this.survivorCount = count;
        document.getElementById('survivorCount').textContent = count;
    }
    
    // Criar obstáculos
    createObstacles(count) {
        this.obstacles = [];
        
        if (!this.showObstacles) return;
        
        for (let i = 0; i < count; i++) {
            const radius = Math.random() * 30 + 20; // Tamanho aleatório
            
            // Posição aleatória
            const x = Math.random() * (CANVAS_WIDTH - 2 * radius) + radius;
            const y = Math.random() * (CANVAS_HEIGHT - 2 * radius) + radius;
            
            // Criar obstáculo
            const obstacle = {
                x: x,
                y: y,
                radius: radius,
                type: Math.floor(Math.random() * 3) // Tipo de obstáculo (para variação visual)
            };
            
            this.obstacles.push(obstacle);
        }
    }
    
    // Resetar simulação
    resetSimulation() {
        // Limpar arrays
        this.walkers = [];
        this.survivors = [];
        this.obstacles = [];
        this.soundEvents = [];
        this.hordes = [];
        this.hordeCount = 0;
        
        // Criar elementos do jogo
        this.createObstacles(OBSTACLE_COUNT);
        this.createWalkers(this.walkerCount);
        if (this.showSurvivors) {
            this.createSurvivors(3);
        }
        
        // Atualizar estatísticas
        document.getElementById('hordeCount').textContent = this.hordeCount;
    }
    
    // Loop principal do jogo
    gameLoop() {
        // Limpar canvas
        this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Atualizar e desenhar elementos
        this.update();
        this.draw();
        
        // Continuar loop
        requestAnimationFrame(() => this.gameLoop());
    }
    
    // Atualizar estado do jogo
    update() {
        // Atualizar eventos sonoros
        this.updateSoundEvents();
        
        // Atualizar sobreviventes
        this.updateSurvivors();
        
        // Atualizar walkers
        this.updateWalkers();
        
        // Identificar hordas
        this.identifyHordes();
        
        // Atualizar estatísticas
        document.getElementById('hordeCount').textContent = this.hordeCount;
    }
    
    // Atualizar eventos sonoros
    updateSoundEvents() {
        for (let i = this.soundEvents.length - 1; i >= 0; i--) {
            const sound = this.soundEvents[i];
            
            // Envelhecer o evento sonoro
            sound.age++;
            
            // Reduzir o raio com o tempo
            sound.radius = sound.maxRadius * (1 - sound.age / sound.maxAge);
            
            // Remover eventos expirados
            if (sound.age >= sound.maxAge) {
                this.soundEvents.splice(i, 1);
            }
        }
    }
    
    // Atualizar sobreviventes
    updateSurvivors() {
        if (!this.showSurvivors) return;
        
        for (let i = this.survivors.length - 1; i >= 0; i--) {
            const survivor = this.survivors[i];
            
            // Movimento aleatório
            if (Math.random() < 0.01) {
                survivor.vx = (Math.random() - 0.5) * 0.5;
                survivor.vy = (Math.random() - 0.5) * 0.5;
            }
            
            // Atualizar posição
            survivor.x += survivor.vx;
            survivor.y += survivor.vy;
            
            // Manter dentro do canvas
            if (survivor.x < survivor.radius) {
                survivor.x = survivor.radius;
                survivor.vx *= -1;
            } else if (survivor.x > CANVAS_WIDTH - survivor.radius) {
                survivor.x = CANVAS_WIDTH - survivor.radius;
                survivor.vx *= -1;
            }
            
            if (survivor.y < survivor.radius) {
                survivor.y = survivor.radius;
                survivor.vy *= -1;
            } else if (survivor.y > CANVAS_HEIGHT - survivor.radius) {
                survivor.y = CANVAS_HEIGHT - survivor.radius;
                survivor.vy *= -1;
            }
            
            // Evitar obstáculos
            for (const obstacle of this.obstacles) {
                const dx = survivor.x - obstacle.x;
                const dy = survivor.y - obstacle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < survivor.radius + obstacle.radius) {
                    // Calcular vetor de repulsão
                    const angle = Math.atan2(dy, dx);
                    const pushX = Math.cos(angle);
                    const pushY = Math.sin(angle);
                    
                    // Aplicar repulsão
                    survivor.x = obstacle.x + (obstacle.radius + survivor.radius) * pushX;
                    survivor.y = obstacle.y + (obstacle.radius + survivor.radius) * pushY;
                    
                    // Refletir velocidade
                    const dot = survivor.vx * pushX + survivor.vy * pushY;
                    survivor.vx -= 2 * dot * pushX;
                    survivor.vy -= 2 * dot * pushY;
                }
            }
            
            // Verificar colisão com walkers (dano)
            for (const walker of this.walkers) {
                const dx = survivor.x - walker.x;
                const dy = survivor.y - walker.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < survivor.radius + walker.radius) {
                    // Sobrevivente sofre dano
                    survivor.health -= 1;
                    
                    // Empurrar para trás
                    const angle = Math.atan2(dy, dx);
                    survivor.x += Math.cos(angle) * 2;
                    survivor.y += Math.sin(angle) * 2;
                }
            }
            
            // Emitir sons periodicamente
            survivor.lastSoundTime++;
            if (survivor.lastSoundTime > survivor.soundInterval) {
                this.createSoundEvent(survivor.x, survivor.y);
                survivor.lastSoundTime = 0;
                survivor.soundInterval = Math.random() * 300 + 200; // Novo intervalo aleatório
            }
            
            // Animação
            survivor.frameDelay++;
            if (survivor.frameDelay > survivor.frameRate) {
                survivor.frameIndex = (survivor.frameIndex + 1) % 4; // 4 frames de animação
                survivor.frameDelay = 0;
            }
            
            // Remover sobreviventes mortos
            if (survivor.health <= 0) {
                this.survivors.splice(i, 1);
                this.survivorCount--;
                document.getElementById('survivorCount').textContent = this.survivorCount;
            }
        }
    }
    
    // Atualizar walkers
    updateWalkers() {
        for (const walker of this.walkers) {
            // Comportamento baseado no estado
            switch (walker.state) {
                case WALKER_STATE.IDLE:
                    this.updateWalkerIdle(walker);
                    break;
                    
                case WALKER_STATE.ALERT:
                    this.updateWalkerAlert(walker);
                    break;
                    
                case WALKER_STATE.INVESTIGATE:
                    this.updateWalkerInvestigate(walker);
                    break;
                    
                case WALKER_STATE.FOLLOW:
                    this.updateWalkerFollow(walker);
                    break;
                    
                case WALKER_STATE.ATTACK:
                    this.updateWalkerAttack(walker);
                    break;
            }
            
            // Verificar eventos sonoros
            this.checkSoundEvents(walker);
            
            // Verificar sobreviventes próximos
            if (this.showSurvivors) {
                this.checkSurvivorsNearby(walker);
            }
            
            // Aplicar comportamento de bando (flocking)
            this.applyFlockingBehavior(walker);
            
            // Atualizar posição
            walker.x += walker.vx * this.walkerSpeed;
            walker.y += walker.vy * this.walkerSpeed;
            
            // Manter dentro do canvas
            if (walker.x < walker.radius) {
                walker.x = walker.radius;
                walker.vx *= -1;
            } else if (walker.x > CANVAS_WIDTH - walker.radius) {
                walker.x = CANVAS_WIDTH - walker.radius;
                walker.vx *= -1;
            }
            
            if (walker.y < walker.radius) {
                walker.y = walker.radius;
                walker.vy *= -1;
            } else if (walker.y > CANVAS_HEIGHT - walker.radius) {
                walker.y = CANVAS_HEIGHT - walker.radius;
                walker.vy *= -1;
            }
            
            // Evitar obstáculos
            for (const obstacle of this.obstacles) {
                const dx = walker.x - obstacle.x;
                const dy = walker.y - obstacle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < walker.radius + obstacle.radius) {
                    // Calcular vetor de repulsão
                    const angle = Math.atan2(dy, dx);
                    const pushX = Math.cos(angle);
                    const pushY = Math.sin(angle);
                    
                    // Aplicar repulsão
                    walker.x = obstacle.x + (obstacle.radius + walker.radius) * pushX;
                    walker.y = obstacle.y + (obstacle.radius + walker.radius) * pushY;
                    
                    // Refletir velocidade
                    const dot = walker.vx * pushX + walker.vy * pushY;
                    walker.vx -= 2 * dot * pushX;
                    walker.vy -= 2 * dot * pushY;
                }
            }
            
            // Animação
            walker.frameDelay++;
            if (walker.frameDelay > walker.frameRate) {
                walker.frameIndex = (walker.frameIndex + 1) % 3; // 3 frames de animação
                walker.frameDelay = 0;
            }
        }
    }
    
    // Atualizar walker em estado IDLE
    updateWalkerIdle(walker) {
        // Movimento aleatório ocasional
        if (Math.random() < 0.01) {
            walker.vx = (Math.random() - 0.5) * 0.5;
            walker.vy = (Math.random() - 0.5) * 0.5;
            
            // Normalizar velocidade
            const speed = Math.sqrt(walker.vx * walker.vx + walker.vy * walker.vy);
            if (speed > 0) {
                walker.vx = walker.vx / speed * 0.5;
                walker.vy = walker.vy / speed * 0.5;
            }
        }
    }
    
    // Atualizar walker em estado ALERT
    updateWalkerAlert(walker) {
        // Transição para INVESTIGATE
        walker.state = WALKER_STATE.INVESTIGATE;
    }
    
    // Atualizar walker em estado INVESTIGATE
    updateWalkerInvestigate(walker) {
        if (walker.target) {
            // Mover em direção ao alvo
            const dx = walker.target.x - walker.x;
            const dy = walker.target.y - walker.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 5) {
                // Normalizar e aplicar velocidade
                walker.vx = dx / distance * 0.8;
                walker.vy = dy / distance * 0.8;
            } else {
                // Chegou ao destino, voltar para IDLE
                walker.state = WALKER_STATE.IDLE;
                walker.target = null;
            }
        } else {
            // Sem alvo, voltar para IDLE
            walker.state = WALKER_STATE.IDLE;
        }
    }
    
    // Atualizar walker em estado FOLLOW
    updateWalkerFollow(walker) {
        // Seguir outros walkers (implementado em applyFlockingBehavior)
    }
    
    // Atualizar walker em estado ATTACK
    updateWalkerAttack(walker) {
        if (walker.target) {
            // Mover em direção ao alvo (sobrevivente)
            const dx = walker.target.x - walker.x;
            const dy = walker.target.y - walker.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 5) {
                // Normalizar e aplicar velocidade
                walker.vx = dx / distance;
                walker.vy = dy / distance;
            }
        } else {
            // Sem alvo, voltar para IDLE
            walker.state = WALKER_STATE.IDLE;
        }
    }
    
    // Verificar eventos sonoros próximos ao walker
    checkSoundEvents(walker) {
        for (const sound of this.soundEvents) {
            const dx = sound.x - walker.x;
            const dy = sound.y - walker.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < sound.radius) {
                // Som detectado, ficar alerta
                walker.state = WALKER_STATE.ALERT;
                walker.target = { x: sound.x, y: sound.y };
                break;
            }
        }
    }
    
    // Verificar sobreviventes próximos ao walker
    checkSurvivorsNearby(walker) {
        for (const survivor of this.survivors) {
            const dx = survivor.x - walker.x;
            const dy = survivor.y - walker.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Detecção visual (campo de visão)
            if (distance < 80) {
                walker.state = WALKER_STATE.ATTACK;
                walker.target = survivor;
                break;
            }
        }
    }
    
    // Aplicar comportamento de bando (flocking)
    applyFlockingBehavior(walker) {
        // Só aplicar se a força de bando for maior que zero
        if (this.flockingStrength <= 0) return;
        
        // Encontrar walkers próximos
        const neighbors = this.walkers.filter(other => {
            if (other.id === walker.id) return false;
            
            const dx = other.x - walker.x;
            const dy = other.y - walker.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            return distance < 100; // Raio de percepção
        });
        
        if (neighbors.length === 0) return;
        
        // Regras de bando
        const separation = this.calculateSeparation(walker, neighbors);
        const alignment = this.calculateAlignment(walker, neighbors);
        const cohesion = this.calculateCohesion(walker, neighbors);
        
        // Aplicar forças com pesos
        walker.vx += separation.x * 0.05 * this.flockingStrength;
        walker.vy += separation.y * 0.05 * this.flockingStrength;
        
        walker.vx += alignment.x * 0.03 * this.flockingStrength;
        walker.vy += alignment.y * 0.03 * this.flockingStrength;
        
        walker.vx += cohesion.x * 0.01 * this.flockingStrength;
        walker.vy += cohesion.y * 0.01 * this.flockingStrength;
        
        // Normalizar velocidade
        const speed = Math.sqrt(walker.vx * walker.vx + walker.vy * walker.vy);
        if (speed > 1) {
            walker.vx = walker.vx / speed;
            walker.vy = walker.vy / speed;
        }
        
        // Marcar como parte de um bando
        if (neighbors.length >= 3) {
            walker.state = WALKER_STATE.FOLLOW;
            
            // Atribuir ID de horda se não tiver
            if (walker.hordeId === null) {
                walker.hordeId = neighbors[0].hordeId || Date.now();
                
                // Propagar ID para vizinhos
                for (const neighbor of neighbors) {
                    if (neighbor.hordeId === null) {
                        neighbor.hordeId = walker.hordeId;
                    }
                }
            }
        }
    }
    
    // Calcular separação (evitar aglomeração)
    calculateSeparation(walker, neighbors) {
        let steerX = 0;
        let steerY = 0;
        
        for (const other of neighbors) {
            const dx = walker.x - other.x;
            const dy = walker.y - other.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Quanto mais próximo, maior a força de repulsão
            if (distance < walker.radius * 3) {
                steerX += dx / distance;
                steerY += dy / distance;
            }
        }
        
        return { x: steerX, y: steerY };
    }
    
    // Calcular alinhamento (alinhar direção com vizinhos)
    calculateAlignment(walker, neighbors) {
        let avgVX = 0;
        let avgVY = 0;
        
        for (const other of neighbors) {
            avgVX += other.vx;
            avgVY += other.vy;
        }
        
        avgVX /= neighbors.length;
        avgVY /= neighbors.length;
        
        return { x: avgVX - walker.vx, y: avgVY - walker.vy };
    }
    
    // Calcular coesão (mover em direção ao centro do grupo)
    calculateCohesion(walker, neighbors) {
        let centerX = 0;
        let centerY = 0;
        
        for (const other of neighbors) {
            centerX += other.x;
            centerY += other.y;
        }
        
        centerX /= neighbors.length;
        centerY /= neighbors.length;
        
        const dx = centerX - walker.x;
        const dy = centerY - walker.y;
        
        return { x: dx, y: dy };
    }
    
    // Identificar hordas de walkers
    identifyHordes() {
        // Mapear walkers por hordeId
        const hordeMap = new Map();
        
        for (const walker of this.walkers) {
            if (walker.hordeId !== null) {
                if (!hordeMap.has(walker.hordeId)) {
                    hordeMap.set(walker.hordeId, []);
                }
                
                hordeMap.get(walker.hordeId).push(walker);
            }
        }
        
        // Filtrar hordas com pelo menos 3 walkers
        this.hordes = Array.from(hordeMap.values()).filter(horde => horde.length >= 3);
        this.hordeCount = this.hordes.length;
    }
    
    // Desenhar todos os elementos
    draw() {
        // Desenhar fundo
        this.drawBackground();
        
        // Desenhar obstáculos
        if (this.showObstacles) {
            this.drawObstacles();
        }
        
        // Desenhar eventos sonoros
        this.drawSoundEvents();
        
        // Desenhar sobreviventes
        if (this.showSurvivors) {
            this.drawSurvivors();
        }
        
        // Desenhar walkers
        this.drawWalkers();
    }
    
    // Desenhar fundo
    drawBackground() {
        this.ctx.fillStyle = '#2c2416'; // Cor de fundo escura
        this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Grade sutil
        this.ctx.strokeStyle = 'rgba(90, 77, 65, 0.2)';
        this.ctx.lineWidth = 1;
        
        // Linhas horizontais
        for (let y = 0; y < CANVAS_HEIGHT; y += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(CANVAS_WIDTH, y);
            this.ctx.stroke();
        }
        
        // Linhas verticais
        for (let x = 0; x < CANVAS_WIDTH; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, CANVAS_HEIGHT);
            this.ctx.stroke();
        }
    }
    
    // Desenhar obstáculos
    drawObstacles() {
        for (const obstacle of this.obstacles) {
            // Cores diferentes para tipos diferentes
            switch (obstacle.type) {
                case 0:
                    this.ctx.fillStyle = '#5a4d41'; // Marrom médio
                    break;
                case 1:
                    this.ctx.fillStyle = '#4a5a4a'; // Verde médio
                    break;
                case 2:
                    this.ctx.fillStyle = '#4d4d4d'; // Cinza
                    break;
            }
            
            // Desenhar círculo
            this.ctx.beginPath();
            this.ctx.arc(obstacle.x, obstacle.y, obstacle.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Borda
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Detalhes internos
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(obstacle.x - obstacle.radius * 0.2, obstacle.y - obstacle.radius * 0.2, obstacle.radius * 0.3, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    // Desenhar eventos sonoros
    drawSoundEvents() {
        for (const sound of this.soundEvents) {
            // Gradiente radial
            const gradient = this.ctx.createRadialGradient(
                sound.x, sound.y, 0,
                sound.x, sound.y, sound.radius
            );
            
            // Cores do gradiente
            gradient.addColorStop(0, 'rgba(139, 0, 0, 0.3)');
            gradient.addColorStop(1, 'rgba(139, 0, 0, 0)');
            
            // Desenhar círculo
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(sound.x, sound.y, sound.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Círculo central
            this.ctx.fillStyle = 'rgba(139, 0, 0, 0.5)';
            this.ctx.beginPath();
            this.ctx.arc(sound.x, sound.y, 5, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    // Desenhar sobreviventes
    drawSurvivors() {
        for (const survivor of this.survivors) {
            if (this.sprites.survivor.complete) {
                // Desenhar sprite
                const frameWidth = 313; // Largura do frame no sprite
                const frameHeight = 207; // Altura do frame no sprite
                
                this.ctx.drawImage(
                    this.sprites.survivor,
                    0, 0, frameWidth, frameHeight,
                    survivor.x - survivor.radius, survivor.y - survivor.radius,
                    survivor.radius * 2, survivor.radius * 2
                );
                
                // Barra de vida
                const healthBarWidth = survivor.radius * 2;
                const healthBarHeight = 4;
                const healthPercent = survivor.health / 100;
                
                // Fundo da barra
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                this.ctx.fillRect(
                    survivor.x - survivor.radius,
                    survivor.y - survivor.radius - 10,
                    healthBarWidth,
                    healthBarHeight
                );
                
                // Barra de vida
                this.ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
                this.ctx.fillRect(
                    survivor.x - survivor.radius,
                    survivor.y - survivor.radius - 10,
                    healthBarWidth * healthPercent,
                    healthBarHeight
                );
            } else {
                // Fallback se o sprite não estiver carregado
                this.ctx.fillStyle = '#00ff00';
                this.ctx.beginPath();
                this.ctx.arc(survivor.x, survivor.y, survivor.radius, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Borda
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
        }
    }
    
    // Desenhar walkers
    drawWalkers() {
        for (const walker of this.walkers) {
            if (this.sprites.walker.complete) {
                // Desenhar sprite
                const frameWidth = 32; // Largura do frame no sprite
                const frameHeight = 32; // Altura do frame no sprite
                const spriteX = walker.frameIndex * frameWidth;
                const spriteY = walker.spriteRow * frameHeight;
                
                this.ctx.drawImage(
                    this.sprites.walker,
                    spriteX, spriteY, frameWidth, frameHeight,
                    walker.x - walker.radius, walker.y - walker.radius,
                    walker.radius * 2, walker.radius * 2
                );
            } else {
                // Fallback se o sprite não estiver carregado
                // Cor baseada no estado
                switch (walker.state) {
                    case WALKER_STATE.IDLE:
                        this.ctx.fillStyle = '#8c7a6b'; // Marrom claro
                        break;
                    case WALKER_STATE.ALERT:
                    case WALKER_STATE.INVESTIGATE:
                        this.ctx.fillStyle = '#ffcc00'; // Amarelo
                        break;
                    case WALKER_STATE.FOLLOW:
                        this.ctx.fillStyle = '#ff9900'; // Laranja
                        break;
                    case WALKER_STATE.ATTACK:
                        this.ctx.fillStyle = '#8b0000'; // Vermelho escuro
                        break;
                }
                
                // Desenhar círculo
                this.ctx.beginPath();
                this.ctx.arc(walker.x, walker.y, walker.radius, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Borda
                this.ctx.strokeStyle = '#000000';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            }
            
            // Indicador de horda (opcional)
            if (walker.hordeId !== null) {
                this.ctx.strokeStyle = '#ff0000';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(walker.x, walker.y, walker.radius + 3, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        }
    }
}

// Iniciar simulação quando a página carregar
window.addEventListener('load', () => {
    const simulation = new WalkerSimulation();
});
