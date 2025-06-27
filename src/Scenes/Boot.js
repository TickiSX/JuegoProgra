class Bootloader extends Phaser.Scene {
    constructor() {
        super({
            key: 'Bootloader'
        });
    }

    init() {
        console.log('Soy Init');
    }

    preload() {
        console.log('Soy Preload');
        this.load.path = './src/Assets/';
        //Player
        this.load.image('player', 'Soul-Photoroom.png');
        //Fondo
        this.load.image('fondo', 'fondo.jpg');
        //Plataformas
        this.load.image('Plataformas', 'plataforma.png');
    }

    create() {
        console.log('Soy Create');

        //Fondo
        this.fondo = this.add.image(0, 0, 'fondo');
        this.fondo.setOrigin(0, 0);
        this.fondo.setScale(2.8);

        //Player
        this.player = this.add.image(130, 170, 'player');
        this.player.setScale(0.09, 0.09);
        this.player.setOrigin(0, 0);
        this.player.flipX = true;
        this.player.flipY = false;
        this.player.setVisible(1);

        //Plataformas
        this.plataforma1 = this.add.image(1300, 525, 'Plataformas');
        this.plataforma1.setOrigin(0, 0);
        this.plataforma1.setScale(0.09);

        this.plataforma2 = this.add.image(1800, 350, 'Plataformas');
        this.plataforma2.setOrigin(0, 0);
        this.plataforma2.setScale(0.09);

        this.plataforma3 = this.add.image(2100, 400, 'Plataformas');
        this.plataforma3.setOrigin(0, 0);
        this.plataforma3.setScale(0.09);
    }

    update() {
        //console.log('Soy Updtade');
    }
}

export default Bootloader;