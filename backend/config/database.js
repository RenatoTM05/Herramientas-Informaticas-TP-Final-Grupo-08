const { Sequelize } = require('sequelize');
//variables de entorno para contraseña y usuario de la db para no estar cambiando siempre
//en sus .env creen esto: 
// DB_PASSWORD=LaContraseñaDePg
// DB_USER=postgres
const password = process.env.DB_PASSWORD;
const user = process.env.DB_USER;
// (Base de datos, Usuario, Pass)
const sequelize = new Sequelize('tpfinalbackend', user, password, {
    host: 'localhost',
    dialect: 'postgres',
    logging: false, // evita que la consola se llene de mensajes SQL molestos
});

// Probar conexion
sequelize.authenticate()
    .then(() => console.log('DB conectada con PostgreSQL'))
    .catch(err => console.error('Error al conectar a PostgreSQL:', err));

module.exports = sequelize;