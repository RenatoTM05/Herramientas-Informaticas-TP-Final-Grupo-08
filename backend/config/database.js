const { Sequelize } = require('sequelize');

const dbName = process.env.DB_NAME || 'tpfinalbackend';
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || '';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || 5432;

// (Base de datos, Usuario, Pass, Opciones)
const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect: 'postgres',
    logging: false, // evita que la consola se llene de mensajes SQL molestos
});

// Probar conexion
sequelize.authenticate()
    .then(() => console.log(`DB conectada con PostgreSQL (${dbHost}:${dbPort}/${dbName})`))
    .catch(err => console.error('Error al conectar a PostgreSQL:', err));

module.exports = sequelize;
