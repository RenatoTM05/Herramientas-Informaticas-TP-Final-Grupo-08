const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const Juego = require('./juego.model');

const Resena = sequelize.define('Resena', {
    juegoId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    loginId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    texto: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    likes: {
        type: DataTypes.INTEGER,
        defaultValue: 0 // Arrancan todos con 0 likes
    }
}, {
    tableName: 'resenas',
    timestamps: true
});

module.exports = Resena;