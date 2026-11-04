const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database'); 

const Juego = sequelize.define('Juego', {
    id: { // id de IGDB
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    titulo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT, // TEXT por que las descripciones son largas
        allowNull: true
    },
    imagen_portada: {
        type: DataTypes.STRING, 
        allowNull: true
    },
    plataformas: {
        type: DataTypes.JSON,
        allowNull: true
    },
    generos: {
        type: DataTypes.JSON,
        allowNull:true
    },
    trailer_id: {
        type: DataTypes.STRING, // ID de YouTube
        allowNull: true
    },
    fecha_lanzamiento: {
        type: DataTypes.STRING, // Guardamos la fecha convertida a texto (ej: "2020-12-10")
        allowNull: true
    },
    calificacion: {
        type: DataTypes.INTEGER, // Nota de 0 a 100
        allowNull: true
    },
    desarrolladora: {
        type: DataTypes.STRING,
        allowNull: true
    },
    capturas: {
        type: DataTypes.JSON, // Array con URLs de las fotos 1080p
        allowNull: true
    },
    juegos_similares: {
        type: DataTypes.JSON, // Array de objetos (id, titulo, imagen_portada)
        allowNull: true
    },
    dlcs: {
        type: DataTypes.JSON,
        allowNull: true
    },
    expansiones: {
        type: DataTypes.JSON,
        allowNull: true
    },
    saga: {
        type: DataTypes.JSON,
        allowNull: true
    }
}, {
    tableName: 'juegos',
    timestamps: true // saber cuando guardamos el juego en local
});

module.exports = Juego;