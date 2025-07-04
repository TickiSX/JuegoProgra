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
        this.load.image('fondo', 'FondoE.jpg');
    }

    create() {
        console.log('Soy Create');

        // Fondo con reducción vertical
        this.fondo = this.add.image(0, 0, 'fondo');
        this.fondo.setOrigin(0, 0);
        this.fondo.setScale(0.53, 0.47);

        // Player con rotación 90 grados a la derecha
        this.player = this.add.image(130, 170, 'player');
        this.player.setScale(0.05);
        this.player.setOrigin(0, 0);
        this.player.flipX = true;
        this.player.rotation = Math.PI / 2;  // Rota 90 grados a la derecha

        // Definir límites personalizados con ajustes: más separado de la izquierda y un poquito menos a la derecha
        this.limiteMovimiento = {
            minX: 80,                             // más alejado del borde izquierdo
            maxX: this.cameras.main.width + 80,   // un poco menos a la derecha
            minY: 20,                             // límite superior
            maxY: this.cameras.main.height - 20   // límite inferior
        };

        const keyCodes = Phaser.Input.Keyboard.KeyCodes;
        this.keys = this.input.keyboard.addKeys({
            a: keyCodes.A,
            s: keyCodes.S,
            w: keyCodes.W,
            d: keyCodes.D
        });

        this.input.keyboard.on('keydown', (evento) => {
            if (evento.key === 'e') {
                console.log('Se ha tocado la tecla:', evento);
            }
        });
    }

    update() {
        const velocidad = 5;

        if (this.keys.a.isDown) {
            this.player.x -= velocidad;
            this.player.flipX = true;
        }
        if (this.keys.d.isDown) {
            this.player.x += velocidad;
            this.player.flipX = false;
        }
        if (this.keys.w.isDown) {
            this.player.y -= velocidad;
        }
        if (this.keys.s.isDown) {
            this.player.y += velocidad;
        }

        // Aplicar límites personalizados
        if (this.player.x < this.limiteMovimiento.minX) this.player.x = this.limiteMovimiento.minX;
        if (this.player.x > this.limiteMovimiento.maxX - this.player.displayWidth) this.player.x = this.limiteMovimiento.maxX - this.player.displayWidth;

        if (this.player.y < this.limiteMovimiento.minY) this.player.y = this.limiteMovimiento.minY;
        if (this.player.y > this.limiteMovimiento.maxY - this.player.displayHeight) this.player.y = this.limiteMovimiento.maxY - this.player.displayHeight;
    }
}

export default Bootloader;
