class Bootloader extends Phaser.Scene {
    constructor() {
        super({ key: 'Bootloader' });
    }

    init() {
        console.log('Soy Init');
    }

    preload() {
        console.log('Soy Preload');
        this.load.path = './src/Assets/';
        this.load.image('player', 'Nave1.png');
        this.load.image('player2', 'Nave2.png');
        this.load.image('fondo', 'Espacio.jpg');
        this.load.image('asteroide', 'asteroide.png');
    }

    create() {
        console.log('Soy Create');

        // Fondo como tileSprite para que ocupe toda la pantalla y se repita
        this.fondo = this.add.tileSprite(0, 0, this.cameras.main.width, this.cameras.main.height, 'fondo');
        this.fondo.setOrigin(0, 0);

        this.player = this.add.image(130, 170, 'player');
        this.player.setScale(0.05).setOrigin(0, 0).setFlipX(true).setRotation(Math.PI / 2);

        this.player2 = this.add.image(300, 170, 'player2');
        this.player2.setScale(0.05).setOrigin(0, 0).setFlipX(true).setRotation(Math.PI / 2);

        this.anchoBarra = 300;
        this.altoBarra = 25;

        const margenBarraVida = 30;
        const alturaBarras = 20 + this.altoBarra;

        this.limiteMovimiento = {
            minX: 80,
            maxX: this.cameras.main.width + 80,
            minY: alturaBarras + margenBarraVida,
            maxY: this.cameras.main.height - 20
        };

        const keyCodes = Phaser.Input.Keyboard.KeyCodes;
        this.keys = this.input.keyboard.addKeys({
            a: keyCodes.A,
            s: keyCodes.S,
            w: keyCodes.W,
            d: keyCodes.D,
            up: keyCodes.UP,
            down: keyCodes.DOWN,
            left: keyCodes.LEFT,
            right: keyCodes.RIGHT
        });

        this.vida1 = 50;
        this.vida2 = 50;

        this.barra1 = this.add.graphics();
        this.barra2 = this.add.graphics();
        this.dibujarBarrasVida();

        this.tiempoUltimaColision = 0;
        this.intervaloColision = 1000;

        this.asteroides = this.add.group();

        this.time.addEvent({
            delay: 2000,
            loop: true,
            callback: this.generarAsteroide,
            callbackScope: this
        });
    }

    update(time) {
        const velocidad = 5;

        // Mover fondo solo si ambos jugadores están vivos
        const velocidadFondo = 0.5;
        if (this.player && this.player2) {
            this.fondo.tilePositionX += velocidadFondo;
        }

        if (this.player && this.keys.a.isDown) this.player.x -= velocidad, this.player.flipX = true;
        if (this.player && this.keys.d.isDown) this.player.x += velocidad, this.player.flipX = false;
        if (this.player && this.keys.w.isDown) this.player.y -= velocidad;
        if (this.player && this.keys.s.isDown) this.player.y += velocidad;

        if (this.player2 && this.keys.left.isDown) this.player2.x -= velocidad, this.player2.flipX = true;
        if (this.player2 && this.keys.right.isDown) this.player2.x += velocidad, this.player2.flipX = false;
        if (this.player2 && this.keys.up.isDown) this.player2.y -= velocidad;
        if (this.player2 && this.keys.down.isDown) this.player2.y += velocidad;

        if (this.player) this.limitarMovimiento(this.player);
        if (this.player2) this.limitarMovimiento(this.player2);

        // Colisión entre jugadores (daño 3)
        if (this.player && this.player2) {
            if (Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), this.player2.getBounds())) {
                if (time - this.tiempoUltimaColision > this.intervaloColision) {
                    this.vida1 = Math.max(0, this.vida1 - 3);
                    this.vida2 = Math.max(0, this.vida2 - 3);
                    this.dibujarBarrasVida();
                    this.tiempoUltimaColision = time;
                    console.log(`¡Colisión entre jugadores! Vida P1: ${this.vida1}, Vida P2: ${this.vida2}`);
                    this.verificarMuerte();
                }
            }
        }

        // Movimiento, rotación y colisiones de asteroides
        this.asteroides.getChildren().forEach((asteroide) => {
            asteroide.y += asteroide.velocidadY;
            asteroide.rotation += asteroide.velocidadRotacion;

            if (asteroide.y > this.cameras.main.height + 50 || asteroide.y < -50) {
                asteroide.destroy();
            }

            if (this.player && Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), asteroide.getBounds())) {
                this.vida1 = Math.max(0, this.vida1 - asteroide.danio);
                this.dibujarBarrasVida();
                this.verificarMuerte();
                asteroide.destroy();
                console.log('P1 golpeado por asteroide, daño:', asteroide.danio);
            }

            if (this.player2 && Phaser.Geom.Intersects.RectangleToRectangle(this.player2.getBounds(), asteroide.getBounds())) {
                this.vida2 = Math.max(0, this.vida2 - asteroide.danio);
                this.dibujarBarrasVida();
                this.verificarMuerte();
                asteroide.destroy();
                console.log('P2 golpeado por asteroide, daño:', asteroide.danio);
            }
        });
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

        // Barra jugador 1 (izquierda)
        this.barra1.fillStyle(0x000000);
        this.barra1.fillRect(20, 20, this.anchoBarra, this.altoBarra);
        this.barra1.fillStyle(0xff0000);
        this.barra1.fillRect(20, 20, (this.vida1 / 50) * this.anchoBarra, this.altoBarra);

        // Barra jugador 2 (derecha)
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
            console.log("Jugador 1 destruido por daño.");
        }
        if (this.vida2 <= 0 && this.player2) {
            this.player2.destroy();
            this.player2 = null;
            console.log("Jugador 2 destruido por daño.");
        }
    }

    generarAsteroide() {
        const x = Phaser.Math.Between(100, this.cameras.main.width - 100);

        const saleDesdeArriba = Phaser.Math.Between(0, 1) === 0;

        const y = saleDesdeArriba ? -50 : this.cameras.main.height + 50;

        const escalaBase = Phaser.Math.FloatBetween(0.03, 0.08);
        const escala = escalaBase * 2;

        const asteroide = this.add.image(x, y, 'asteroide').setScale(escala);

        asteroide.velocidadY = saleDesdeArriba
            ? Phaser.Math.Between(2, 4)
            : Phaser.Math.Between(-4, -2);

        asteroide.velocidadRotacion = Phaser.Math.FloatBetween(0.01, 0.05);

        if (escalaBase < 0.05) {
            asteroide.danio = 4;
        } else if (escalaBase < 0.07) {
            asteroide.danio = 5;
        } else {
            asteroide.danio = 6;
        }

        this.asteroides.add(asteroide);

        this.time.delayedCall(5000, () => {
            if (asteroide && asteroide.active) {
                asteroide.destroy();
            }
        });
    }
}

export default Bootloader;
