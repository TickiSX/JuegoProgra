import Boot from './Scenes/Boot.js';

const config = {
    title: 'Web Game',
    url: 'https://google.com.mx',
    version: '0.0.1',

    type: Phaser.AUTO,
    width: 9800,  // ancho igual al de la imagen de fondo
    height: 700,  // alto igual al de la imagen de fondo
    parent: 'contenedor',
    pixelArt: true,
    backgroundColor: '#37861e',

    banner: {
        hidePhaser: true,
        text: '#fff00f',
        background: ['#16a085', '#2ecc71', '#e74c3c', '#000000']
    },

    scene: [Boot]
};

const game = new Phaser.Game(config);