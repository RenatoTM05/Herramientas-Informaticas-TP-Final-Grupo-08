require('dotenv').config();
const passport = require('passport');
const express = require('express');
const cors = require('cors');
const session=require('express-session')
const sequelize = require('./config/database');
const swaggerUI = require('swagger-ui-express');
const swaggerFile = require('./swagger-output.json');
const loginRouter=require('./src/routes/login.route')
const usuarioRouter=require('./src/routes/usuario.route')
const authRouter=require('./src/routes/auth.route')
const juegosRouter= require('./src/routes/juego.route')
const sanitizeInput=require('./src/middlewares/sanitize.middleware');
const Juego = require('./src/models/juego.model');
const Resena = require('./src/models/resena.model');
const Usuarios = require('./src/models/usuario.model');
const Login = require('./src/models/login.model');
const dashboardRouter = require('./src/routes/dashboard.route');
const dashboardJuegoRouter=require('./src/routes/dashboardJuego.route')

const app = express();

//Middlewares de sesión 
app.use(session({
    secret:process.env.SESSION_SECRET || 'session_user',
    resave:false,
    saveUninitialized: false,
    cookie:{
        secure:process.env.NODE_ENV === 'production',
        maxAge: 24*60*60*1000 //24 horas
    }
}))
//inicializo el passport
app.use(passport.initialize())
app.use(passport.session())


// MIDDLEWARES GENERALES
app.use(express.json()); // Para que el backend entienda formato JSON
app.use(cors()); // por ahora abierto para desarrollo local. dsp la URL de Netlify
app.use(sanitizeInput)//<---aplica a todas las rutas
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerFile));

//puerto
app.set('port', process.env.PORT || 3000);

//relaciones
//un Juego TIENE MUCHAS Reseñas
Juego.hasMany(Resena, { foreignKey: 'juegoId', as: 'resenas' });
//una Reseña PERTENECE A un Juego
Resena.belongsTo(Juego, { foreignKey: 'juegoId', as: 'juego' });
// un Login (usuario) tiene muchas reseñas
Login.hasMany(Resena, { foreignKey: 'loginId', as: 'resenas' });
// una reseña pertenece a un Login (usuario)
Resena.belongsTo(Login, { foreignKey: 'loginId', as: 'usuario' });

// Rutas
app.use('/juego',require('./src/routes/juego.route'));
app.use('/resenas', require('./src/routes/resena.route'));
app.use('/api/auth',authRouter);
app.use('/api/usuarios',usuarioRouter);
app.use('/api/login',loginRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/dashboardJuego',dashboardJuegoRouter)

// SINCRONIZAR BASE DE DATOS Y ARRANCAR
sequelize.sync({ alter: true })
    .then(() => {
        console.log('Tablas de PostgreSQL sincronizadas');
        app.listen(app.get('port'), () => {
            console.log(`Servidor corriendo en el puerto`, app.get('port'));
        });
    })
    .catch(err => {
        console.error('Error fatal: No se pudo iniciar el servidor o conectar a la BD:', err);
    });