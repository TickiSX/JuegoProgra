import Boot from './Scenes/Boot.js';

const config = {
    title: 'Web Game',
    url: 'https://google.com.mx',
    version: '0.0.1',

    type: Phaser.AUTO,
    width: window.innerWidth,   // Ancho total de la ventana
    height: window.innerHeight, // Alto total de la ventana
    parent: 'contenedor',
    pixelArt: true,
    backgroundColor: '#37861e',

    banner: {
        hidePhaser: true,
        text: '#fff00f',
        background: ['#16a085', '#2ecc71', '#e74c3c', '#000000']
    },

    scene: [Boot],

    scale: {
        mode: Phaser.Scale.RESIZE, // Permite que el juego se ajuste dinámicamente
        autoCenter: Phaser.Scale.CENTER_BOTH // Centra el canvas en la pantalla
    }
};

const game = new Phaser.Game(config);

// Opcional: Actualizar tamaño del juego cuando cambie la ventana
window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});