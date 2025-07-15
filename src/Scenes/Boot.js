class Bootloader extends Phaser.Scene {
    constructor() {
        super({ key: 'Bootloader' });
        this.lastBlackHoleDamage = {};
        this.juegoTerminado = false; // bandera para detener el juego al morir un jugador
    }

    preload() {
        this.load.path = './src/Assets/';
        this.load.image('player', 'Nave1.png');
        this.load.image('player2', 'Nave2.png');
        this.load.image('fondo', 'Espacio.jpg');
        this.load.image('asteroide', 'asteroide.png');
        this.load.image('obstaculo1', 'satelite1.png');
        this.load.image('obstaculo2', 'satelite2.png');
        this.load.image('blackhole', 'hoyo_negro.png');
    }

    create() {
        this.fondo = this.add.tileSprite(0, 0, this.cameras.main.width, this.cameras.main.height, 'fondo').setOrigin(0);

        this.player = this.add.image(130, 170, 'player').setScale(0.05).setOrigin(0).setFlipX(true).setRotation(Math.PI / 2);
        this.player2 = this.add.image(300, 170, 'player2').setScale(0.05).setOrigin(0).setFlipX(true).setRotation(Math.PI / 2);

        this.player.setDepth(1);
        this.player2.setDepth(1);

        this.vida1 = 50;
        this.vida2 = 50;

        this.anchoBarra = 300;
        this.altoBarra = 25;

        this.barra1 = this.add.graphics();
        this.barra2 = this.add.graphics();
        this.dibujarBarrasVida();

        this.keys = this.input.keyboard.addKeys({
            a: 'A', s: 'S', w: 'W', d: 'D',
            left: 'LEFT', right: 'RIGHT', up: 'UP', down: 'DOWN'
        });

        this.tiempoUltimaColision = 0;
        this.intervaloColision = 1000;
        this.velocidadFondo = 2.5;

        const margenBarraVida = 30;
        const alturaBarras = 20 + this.altoBarra;
        this.limiteMovimiento = {
            minX: 80,
            maxX: this.cameras.main.width + 80,
            minY: alturaBarras + margenBarraVida,
            maxY: this.cameras.main.height - 20
        };

        this.asteroides = this.add.group();
        this.obstaculos = this.add.group();
        this.blackHoles = this.add.group();

        this.time.addEvent({ delay: 2000, loop: true, callback: this.generarAsteroide, callbackScope: this });
        this.time.addEvent({ delay: 3000, loop: true, callback: this.generarObstaculo, callbackScope: this });
        this.time.addEvent({ delay: 15000, loop: true, callback: this.generarBlackHole, callbackScope: this });
    }

    update(time) {
        if (this.juegoTerminado) return; // detiene todo si el juego terminó

        this.fondo.tilePositionX += this.velocidadFondo;

        this.blackHoles.getChildren().forEach(hole => {
            hole.x -= this.velocidadFondo;
            hole.rotation += hole.velRot;

            if (hole.x < -50) hole.destroy();

            if (this.player && Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), hole.getBounds())) {
                this.aplicarFuerza(this.player, hole);
                this.danoBlackHole(this.player, 'vida1');
            }
            if (this.player2 && Phaser.Geom.Intersects.RectangleToRectangle(this.player2.getBounds(), hole.getBounds())) {
                this.aplicarFuerza(this.player2, hole);
                this.danoBlackHole(this.player2, 'vida2');
            }
        });

        this.asteroides.getChildren().forEach(ast => {
            ast.y += ast.velY;
            ast.rotation += ast.velRot;

            if (ast.y < -50 || ast.y > this.cameras.main.height + 50) ast.destroy();

            if (this.player && Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), ast.getBounds())) {
                this.vida1 = Math.max(0, this.vida1 - ast.danio);
                this.dibujarBarrasVida();
                this.verificarMuerte();
                ast.destroy();
            }
            if (this.player2 && Phaser.Geom.Intersects.RectangleToRectangle(this.player2.getBounds(), ast.getBounds())) {
                this.vida2 = Math.max(0, this.vida2 - ast.danio);
                this.dibujarBarrasVida();
                this.verificarMuerte();
                ast.destroy();
            }
        });

        this.obstaculos.getChildren().forEach(ob => {
            ob.x -= this.velocidadFondo;

            if (ob.x < -50) ob.destroy();

            if (this.player && Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), ob.getBounds())) {
                this.vida1 = Math.max(0, this.vida1 - ob.danio);
                this.dibujarBarrasVida();
                this.verificarMuerte();
                ob.destroy();
            }
            if (this.player2 && Phaser.Geom.Intersects.RectangleToRectangle(this.player2.getBounds(), ob.getBounds())) {
                this.vida2 = Math.max(0, this.vida2 - ob.danio);
                this.dibujarBarrasVida();
                this.verificarMuerte();
                ob.destroy();
            }
        });

        const v = 5;
        if (this.player && this.keys.a.isDown) this.player.x -= v, this.player.flipX = true;
        if (this.player && this.keys.d.isDown) this.player.x += v, this.player.flipX = false;
        if (this.player && this.keys.w.isDown) this.player.y -= v;
        if (this.player && this.keys.s.isDown) this.player.y += v;
        if (this.player2 && this.keys.left.isDown) this.player2.x -= v, this.player2.flipX = true;
        if (this.player2 && this.keys.right.isDown) this.player2.x += v, this.player2.flipX = false;
        if (this.player2 && this.keys.up.isDown) this.player2.y -= v;
        if (this.player2 && this.keys.down.isDown) this.player2.y += v;

        if (this.player) this.limitarMovimiento(this.player);
        if (this.player2) this.limitarMovimiento(this.player2);

        if (this.player && this.player2 && Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), this.player2.getBounds())) {
            if (time - this.tiempoUltimaColision > this.intervaloColision) {
                this.vida1 = Math.max(0, this.vida1 - 3);
                this.vida2 = Math.max(0, this.vida2 - 3);
                this.dibujarBarrasVida();
                this.tiempoUltimaColision = time;
                this.verificarMuerte();
            }
        }
    }

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

    generarObstaculo() {
        const tipo = Phaser.Math.Between(1, 2);
        const key = tipo === 1 ? 'obstaculo1' : 'obstaculo2';
        const x = this.cameras.main.width + 50;
        const y = Phaser.Math.Between(50, this.cameras.main.height - 50);

        const ob = this.add.image(x, y, key).setScale(0.1);
        ob.danio = 5;
        ob.setDepth(0);
        this.obstaculos.add(ob);
    }

    generarBlackHole() {
        const x = this.cameras.main.width + 50;
        const y = Phaser.Math.Between(50, this.cameras.main.height - 50);
        const escala = 0.07 * 2;
        const hole = this.add.image(x, y, 'blackhole').setScale(escala);
        hole.velRot = Phaser.Math.FloatBetween(0.01, 0.05);
        hole.setDepth(0);
        this.blackHoles.add(hole);
    }

    aplicarFuerza(player, hole) {
        const dx = hole.x - player.x;
        const dy = hole.y - player.y;
        const dist = Math.hypot(dx, dy);
        const fuerza = 80 / (dist || 1);
        player.x += dx * fuerza * 0.05;
        player.y += dy * fuerza * 0.05;
    }

    danoBlackHole(player, vidaProp) {
        if (this.juegoTerminado) return; // no hacer daño si juego terminó
        const now = this.time.now;
        if (!this.lastBlackHoleDamage[player.texture.key] || now - this.lastBlackHoleDamage[player.texture.key] >= 1000) {
            this[vidaProp] = Math.max(0, this[vidaProp] - 1);
            this.dibujarBarrasVida();
            this.verificarMuerte();
            this.lastBlackHoleDamage[player.texture.key] = now;
        }
    }

    limitarMovimiento(player) {
        if (player.x < this.limiteMovimiento.minX) player.x = this.limiteMovimiento.minX;
        if (player.x > this.limiteMovimiento.maxX - player.displayWidth) player.x = this.limiteMovimiento.maxX - player.displayWidth;
        if (player.y < this.limiteMovimiento.minY) player.y = this.limiteMovimiento.minY;
        if (player.y > this.limiteMovimiento.maxY - player.displayHeight) player.y = this.limiteMovimiento.maxY - player.displayHeight;
    }

    dibujarBarrasVida() {
        this.barra1.clear();
        this.barra2.clear();

        this.barra1.fillStyle(0x000000);
        this.barra1.fillRect(20, 20, this.anchoBarra, this.altoBarra);
        this.barra1.fillStyle(0xff0000);
        this.barra1.fillRect(20, 20, (this.vida1 / 50) * this.anchoBarra, this.altoBarra);

        const posX2 = this.cameras.main.width - this.anchoBarra - 20;
        this.barra2.fillStyle(0x000000);
        this.barra2.fillRect(posX2, 20, this.anchoBarra, this.altoBarra);
        this.barra2.fillStyle(0x0000ff);
        this.barra2.fillRect(posX2, 20, (this.vida2 / 50) * this.anchoBarra, this.altoBarra);
    }

    verificarMuerte() {
        if (this.vida1 <= 0 && this.player) {
            this.player.destroy();
            this.player = null;
            this.mostrarFinDelJuego(this.vida2 > 0 ? "¡Jugador 2 gana!" : "¡Empate!");
            this.juegoTerminado = true; // bloquear juego
        }
        if (this.vida2 <= 0 && this.player2) {
            this.player2.destroy();
            this.player2 = null;
            this.mostrarFinDelJuego(this.vida1 > 0 ? "¡Jugador 1 gana!" : "¡Empate!");
            this.juegoTerminado = true; // bloquear juego
        }
    }

    mostrarFinDelJuego(msg) {
        // Fondo oscuro
        this.add.rectangle(this.cameras.main.centerX, this.cameras.main.centerY, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.6).setDepth(100);

        // Texto de ganador
        this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 100, msg, { fontSize: '32px', fill: '#fff' }).setOrigin(0.5).setDepth(100);

        // Botón reiniciar
        const btnReiniciar = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 'Volver a jugar', {
            fontSize: '28px',
            fill: '#0f0',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive().setDepth(100);
        btnReiniciar.on('pointerdown', () => this.scene.restart());

        // Botón salir
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
