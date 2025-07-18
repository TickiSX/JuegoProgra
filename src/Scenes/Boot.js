class Bootloader extends Phaser.Scene {
    constructor() {
        super({ key: 'Bootloader' });
        this.lastBlackHoleDamage = {}; // Controla cuándo se aplicó el último daño por hoyo negro a cada jugador
        this.juegoTerminado = false; // Bandera para saber si el juego ya terminó y detener lógica
        this.sonidoHoyonegroActivo = { player1: false, player2: false }; // Controla si el sonido del hoyo negro está activo para cada jugador para evitar repeticiones
    }

    preload() {
        this.load.path = './src/Assets/';
        this.load.image('player', 'Nave1.png');         // Nave jugador 1
        this.load.image('player2', 'Nave2.png');        // Nave jugador 2
        this.load.image('fondo', 'Espacio.jpg');        // Fondo espacial
        this.load.image('asteroide', 'asteroide.png');  // Asteroide
        this.load.image('obstaculo1', 'satelite1.png'); // Obstáculo tipo satélite 1
        this.load.image('obstaculo2', 'satelite2.png'); // Obstáculo tipo satélite 2
        this.load.image('blackhole', 'hoyo_negro.png'); // Hoyo negro
        this.load.audio('musicaFondo', 'musica.mp3');   // Música de fondo
        this.load.audio('Casteroide', 'Golpe.mp3');     // Sonido de choque con asteroide
        this.load.audio('Cplayer', 'Metal.mp3');        // Sonido de choque entre jugadores
        this.load.audio('Shoyonegro', 'Shoyonegro.mp3');// Sonido de estar en hoyo negro (loop)
    }

    create() {
        // Fondo en movimiento
        this.fondo = this.add.tileSprite(0, 0, this.cameras.main.width, this.cameras.main.height, 'fondo').setOrigin(0);

        // Música de fondo que se reproduce en bucle con volumen moderado
        this.musica = this.sound.add('musicaFondo', { loop: true, volume: 0.3 });
        this.musica.play();

        // Pausa la música al perder foco y la reanuda al recuperar foco en la ventana
        window.addEventListener('blur', () => {
            if (this.musica && this.musica.isPlaying) {
                this.musica.pause();
            }
        });
        window.addEventListener('focus', () => {
            if (this.musica && this.musica.isPaused) {
                this.musica.resume();
            }
        });

        // Creación de las naves jugadores con posición, escala, orientación y profundidad
        this.player = this.add.image(130, 170, 'player').setScale(0.05).setOrigin(0).setFlipX(true).setRotation(Math.PI / 2);
        this.player2 = this.add.image(300, 170, 'player2').setScale(0.05).setOrigin(0).setFlipX(true).setRotation(Math.PI / 2);
        this.player.setDepth(1);
        this.player2.setDepth(1);

        // Vida inicial de cada jugador
        this.vida1 = 50;
        this.vida2 = 50;

        // Tamaño de las barras de vida
        this.anchoBarra = 300;
        this.altoBarra = 25;

        // Gráficos para las barras de vida
        this.barra1 = this.add.graphics();
        this.barra2 = this.add.graphics();
        this.dibujarBarrasVida(); // Dibuja las barras con vida inicial

        // Teclado para controlar ambos jugadores
        this.keys = this.input.keyboard.addKeys({
            a: 'A', s: 'S', w: 'W', d: 'D',         // Jugador 1
            left: 'LEFT', right: 'RIGHT', up: 'UP', down: 'DOWN' // Jugador 2
        });

        // Control de tiempo para evitar daños múltiples en colisiones seguidas
        this.tiempoUltimaColision = 0;
        this.intervaloColision = 1000; // En milisegundos

        // Velocidad a la que se mueve el fondo para dar sensación de movimiento
        this.velocidadFondo = 2.5;

        // Definición de límites para que las naves no se salgan de la pantalla
        const margenBarraVida = 30;
        const alturaBarras = 20 + this.altoBarra;
        this.limiteMovimiento = {
            minX: 80,
            maxX: this.cameras.main.width + 80,
            minY: alturaBarras + margenBarraVida,
            maxY: this.cameras.main.height - 20
        };

        // Grupos para manejar asteroides, obstáculos y hoyos negros
        this.asteroides = this.add.group();
        this.obstaculos = this.add.group();
        this.blackHoles = this.add.group();

        // Eventos temporizados para generar objetos en pantalla
        this.time.addEvent({ delay: 2000, loop: true, callback: this.generarAsteroide, callbackScope: this });
        this.time.addEvent({ delay: 3000, loop: true, callback: this.generarObstaculo, callbackScope: this });
        this.time.addEvent({ delay: 15000, loop: true, callback: this.generarBlackHole, callbackScope: this });

        // Sonidos de efectos para colisiones y hoyo negro
        this.sfxCasteroide = this.sound.add('Casteroide', { volume: 0.5 });
        this.sfxCplayer = this.sound.add('Cplayer', { volume: 0.7 });
        this.sfxHoyonegro = this.sound.add('Shoyonegro', { loop: true, volume: 1.5 });
    }

    update(time) {
        // Si el juego terminó no se actualiza la lógica
        if (this.juegoTerminado) return;

        // Mueve el fondo para simular movimiento hacia la izquierda
        this.fondo.tilePositionX += this.velocidadFondo;

        // Actualiza posición y rotación de cada hoyo negro y los destruye si salen de la pantalla
        this.blackHoles.getChildren().forEach(hole => {
            hole.x -= this.velocidadFondo;
            hole.rotation += hole.velRot;
            if (hole.x < -50) hole.destroy();
        });

        // Lógica de interacción jugador 1 con hoyos negros
        const player1InHole = this.blackHoles.getChildren().some(hole => Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), hole.getBounds()));
        if (player1InHole) {
            const hole = this.blackHoles.getChildren().find(hole => Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), hole.getBounds()));
            this.aplicarFuerza(this.player, hole);    // Atracción hacia el hoyo negro
            this.danoBlackHole(this.player, 'vida1'); // Aplica daño progresivo
            if (!this.sonidoHoyonegroActivo.player1) {
                this.sfxHoyonegro.stop();
                this.sfxHoyonegro.play({ seek: 0 });
                this.sonidoHoyonegroActivo.player1 = true;
            }
        } else {
            if (this.sonidoHoyonegroActivo.player1) {
                this.sfxHoyonegro.stop();
                this.sonidoHoyonegroActivo.player1 = false;
            }
        }

        // Mismo comportamiento para jugador 2
        const player2InHole = this.blackHoles.getChildren().some(hole => Phaser.Geom.Intersects.RectangleToRectangle(this.player2.getBounds(), hole.getBounds()));
        if (player2InHole) {
            const hole = this.blackHoles.getChildren().find(hole => Phaser.Geom.Intersects.RectangleToRectangle(this.player2.getBounds(), hole.getBounds()));
            this.aplicarFuerza(this.player2, hole);
            this.danoBlackHole(this.player2, 'vida2');
            if (!this.sonidoHoyonegroActivo.player2) {
                this.sfxHoyonegro.stop();
                this.sfxHoyonegro.play({ seek: 0 });
                this.sonidoHoyonegroActivo.player2 = true;
            }
        } else {
            if (this.sonidoHoyonegroActivo.player2) {
                this.sfxHoyonegro.stop();
                this.sonidoHoyonegroActivo.player2 = false;
            }
        }

        // Actualiza posición, rotación y destrucción de asteroides, además detecta colisiones con jugadores
        this.asteroides.getChildren().forEach(ast => {
            ast.y += ast.velY;
            ast.rotation += ast.velRot;
            if (ast.y < -50 || ast.y > this.cameras.main.height + 50) ast.destroy();

            if (this.player && Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), ast.getBounds())) {
                this.vida1 = Math.max(0, this.vida1 - ast.danio);
                this.dibujarBarrasVida();
                this.verificarMuerte();
                ast.destroy();
                this.sfxCasteroide.play();
            }
            if (this.player2 && Phaser.Geom.Intersects.RectangleToRectangle(this.player2.getBounds(), ast.getBounds())) {
                this.vida2 = Math.max(0, this.vida2 - ast.danio);
                this.dibujarBarrasVida();
                this.verificarMuerte();
                ast.destroy();
                this.sfxCasteroide.play();
            }
        });

        // Actualiza posición y destrucción de obstáculos, detecta colisiones con jugadores
        this.obstaculos.getChildren().forEach(ob => {
            ob.x -= this.velocidadFondo;
            if (ob.x < -50) ob.destroy();
            if (this.player && Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), ob.getBounds())) {
                this.vida1 = Math.max(0, this.vida1 - ob.danio);
                this.dibujarBarrasVida();
                this.verificarMuerte();
                ob.destroy();
                this.sfxCasteroide.play();
            }
            if (this.player2 && Phaser.Geom.Intersects.RectangleToRectangle(this.player2.getBounds(), ob.getBounds())) {
                this.vida2 = Math.max(0, this.vida2 - ob.danio);
                this.dibujarBarrasVida();
                this.verificarMuerte();
                ob.destroy();
                this.sfxCasteroide.play();
            }
        });

        // Movimiento de jugador 1 usando teclas WASD
        const v = 5;
        if (this.player && this.keys.a.isDown) this.player.x -= v, this.player.flipX = true;
        if (this.player && this.keys.d.isDown) this.player.x += v, this.player.flipX = false;
        if (this.player && this.keys.w.isDown) this.player.y -= v;
        if (this.player && this.keys.s.isDown) this.player.y += v;

        // Movimiento de jugador 2 usando flechas del teclado
        if (this.player2 && this.keys.left.isDown) this.player2.x -= v, this.player2.flipX = true;
        if (this.player2 && this.keys.right.isDown) this.player2.x += v, this.player2.flipX = false;
        if (this.player2 && this.keys.up.isDown) this.player2.y -= v;
        if (this.player2 && this.keys.down.isDown) this.player2.y += v;

        // Limitar movimiento para que las naves no salgan de la pantalla
        if (this.player) this.limitarMovimiento(this.player);
        if (this.player2) this.limitarMovimiento(this.player2);

        // Detecta colisión entre las dos naves y aplica daño con intervalo para evitar daño continuo
        if (this.player && this.player2 && Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), this.player2.getBounds())) {
            if (time - this.tiempoUltimaColision > this.intervaloColision) {
                this.vida1 = Math.max(0, this.vida1 - 3);
                this.vida2 = Math.max(0, this.vida2 - 3);
                this.dibujarBarrasVida();
                this.tiempoUltimaColision = time;
                this.verificarMuerte();
                this.sfxCplayer.play();
            }
        }
    }

    // Crea un asteroide con posición horizontal aleatoria y velocidad vertical que puede salir arriba o abajo
    generarAsteroide() {
        const x = Phaser.Math.Between(100, this.cameras.main.width - 100);
        const saleDesdeArriba = Phaser.Math.Between(0, 1) === 0;
        const y = saleDesdeArriba ? -50 : this.cameras.main.height + 50;
        const escalaBase = Phaser.Math.FloatBetween(0.03, 0.08);
        const escala = escalaBase * 2;

        const asteroide = this.add.image(x, y, 'asteroide').setScale(escala);
        asteroide.velY = saleDesdeArriba ? Phaser.Math.Between(2, 4) : Phaser.Math.Between(-4, -2);
        asteroide.velRot = Phaser.Math.FloatBetween(0.01, 0.05);
        asteroide.danio = escalaBase < 0.05 ? 4 : escalaBase < 0.07 ? 5 : 6;

        asteroide.setDepth(0);
        this.asteroides.add(asteroide);
    }

    // Genera un obstáculo tipo satélite que se mueve de derecha a izquierda
    generarObstaculo() {
        const tipo = Phaser.Math.Between(1, 2);
        const key = tipo === 1 ? 'obstaculo1' : 'obstaculo2';
        const x = this.cameras.main.width + 50;
        const y = Phaser.Math.Between(50, this.cameras.main.height - 50);

        const ob = this.add.image(x, y, key).setScale(0.1);
        ob.danio = 5; // Daño fijo al chocar
        ob.setDepth(0);
        this.obstaculos.add(ob);
    }

    // Genera un hoyo negro que se mueve de derecha a izquierda con rotación
    generarBlackHole() {
        const x = this.cameras.main.width + 50;
        const y = Phaser.Math.Between(50, this.cameras.main.height - 50);
        const escala = 0.07 * 2;
        const hole = this.add.image(x, y, 'blackhole').setScale(escala);
        hole.velRot = Phaser.Math.FloatBetween(0.01, 0.05);
        hole.setDepth(0);
        this.blackHoles.add(hole);
    }

    // Aplica fuerza de atracción desde el hoyo negro hacia la nave
    aplicarFuerza(player, hole) {
        const dx = hole.x - player.x;
        const dy = hole.y - player.y;
        const dist = Math.hypot(dx, dy);
        const fuerza = 80 / (dist || 1);
        player.x += dx * fuerza * 0.05;
        player.y += dy * fuerza * 0.05;
    }

    // Aplica daño progresivo por estar dentro del hoyo negro, con delay para no aplicar daño cada frame
    danoBlackHole(player, vidaProp) {
        if (this.juegoTerminado) return; // No aplica daño si el juego terminó
        const now = this.time.now;
        if (!this.lastBlackHoleDamage[player.texture.key] || now - this.lastBlackHoleDamage[player.texture.key] >= 1000) {
            this[vidaProp] = Math.max(0, this[vidaProp] - 1); // Reduce vida en 1 unidad
            this.dibujarBarrasVida();
            this.verificarMuerte();
            this.lastBlackHoleDamage[player.texture.key] = now; // Marca el tiempo del último daño aplicado
        }
    }

    // Limita el movimiento del jugador dentro de los límites definidos para que no salga de pantalla
    limitarMovimiento(player) {
        if (player.x < this.limiteMovimiento.minX) player.x = this.limiteMovimiento.minX;
        if (player.x > this.limiteMovimiento.maxX - player.displayWidth) player.x = this.limiteMovimiento.maxX - player.displayWidth;
        if (player.y < this.limiteMovimiento.minY) player.y = this.limiteMovimiento.minY;
        if (player.y > this.limiteMovimiento.maxY - player.displayHeight) player.y = this.limiteMovimiento.maxY - player.displayHeight;
    }

    // Dibuja o actualiza las barras de vida de los jugadores según la vida restante
    dibujarBarrasVida() {
        this.barra1.clear();
        this.barra2.clear();

        // Barra negra de fondo jugador 1
        this.barra1.fillStyle(0x000000);
        this.barra1.fillRect(20, 20, this.anchoBarra, this.altoBarra);

        // Barra roja con vida restante jugador 1
        this.barra1.fillStyle(0xff0000);
        this.barra1.fillRect(20, 20, (this.vida1 / 50) * this.anchoBarra, this.altoBarra);

        // Posición barra jugador 2 (derecha)
        const posX2 = this.cameras.main.width - this.anchoBarra - 20;

        // Barra negra de fondo jugador 2
        this.barra2.fillStyle(0x000000);
        this.barra2.fillRect(posX2, 20, this.anchoBarra, this.altoBarra);

        // Barra azul con vida restante jugador 2
        this.barra2.fillStyle(0x0000ff);
        this.barra2.fillRect(posX2, 20, (this.vida2 / 50) * this.anchoBarra, this.altoBarra);
    }

    // Verifica si alguno de los jugadores perdió toda su vida y finaliza el juego mostrando resultado
    verificarMuerte() {
        if (this.vida1 <= 0 && this.player) {
            this.player.destroy();
            this.player = null;
            this.mostrarFinDelJuego(this.vida2 > 0 ? "¡Jugador 2 gana!" : "¡Empate!");
            this.juegoTerminado = true;
        }
        if (this.vida2 <= 0 && this.player2) {
            this.player2.destroy();
            this.player2 = null;
            this.mostrarFinDelJuego(this.vida1 > 0 ? "¡Jugador 1 gana!" : "¡Empate!");
            this.juegoTerminado = true;
        }
    }

    // Muestra pantalla de fin del juego con mensaje y botones para reiniciar o salir
    mostrarFinDelJuego(msg) {
        if (this.musica) {
            this.musica.stop(); // Detiene la música al terminar el juego
        }

        // Fondo semi-transparente negro cubriendo toda la pantalla
        this.add.rectangle(this.cameras.main.centerX, this.cameras.main.centerY, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.6).setDepth(100);

        // Texto del mensaje de resultado
        this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 100, msg, { fontSize: '32px', fill: '#fff' }).setOrigin(0.5).setDepth(100);

        // Botón para reiniciar el juego
        const btnReiniciar = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 'Volver a jugar', {
            fontSize: '28px',
            fill: '#0f0',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive().setDepth(100);
        btnReiniciar.on('pointerdown', () => this.scene.restart());

        // Botón para salir de la escena
        const btnSalir = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 60, 'Salir', {
            fontSize: '28px',
            fill: '#f00',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive().setDepth(100);
        btnSalir.on('pointerdown', () => this.scene.stop());
    }
}

export default Bootloader;