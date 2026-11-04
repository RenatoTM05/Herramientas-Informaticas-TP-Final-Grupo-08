const express=require('express')
const router=express.Router()
const juegoCtrl = require('../controllers/juego.controller');
const auditoriaMiddleware=require('../middlewares/audit.middleware')

// obtener TODOS los juegos locales cache (GET)
router.get('/', juegoCtrl.getJuegos);

router.get('/mas-jugados', juegoCtrl.getMasJugados);

// autocompletado (mientras el usuario escribe)
router.get('/sugerencias/:nombre',auditoriaMiddleware('BUSCAR_JUEGO'), juegoCtrl.getSugerencias);

// Ruta para ver la pagina de detalle de un juego con sus DLCs y Similares
router.get('/detalle/:id', auditoriaMiddleware('DETALLE_JUEGO'),juegoCtrl.getDetalleJuego);

//ruta para testear juegos 
router.get('/test/:id',juegoCtrl.getTest);

module.exports = router;