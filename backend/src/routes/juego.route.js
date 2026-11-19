
const express = require('express');
const router = express.Router();

const juegoCtrl = require('../controllers/juego.controller');
const auditoriaMiddleware = require('../middlewares/audit.middleware');
const autenticar = require('../middlewares/auth.middleware');
const soloAdmin = require('../middlewares/role.middlewares');

router.get('/', juegoCtrl.getJuegos);
router.post(
    '/',
    autenticar,
    soloAdmin,
    auditoriaMiddleware('CREAR_JUEGO'),
    juegoCtrl.crearJuego
);

router.get('/mas-jugados', juegoCtrl.getMasJugados);

router.get('/buscar', juegoCtrl.buscarJuegos);

router.get(
    '/sugerencias/:nombre',
    auditoriaMiddleware('BUSCAR_JUEGO'),
    juegoCtrl.getSugerencias
);

router.get(
    '/detalle/:id',
    auditoriaMiddleware('DETALLE_JUEGO'),
    juegoCtrl.getDetalleJuego
);

module.exports = router;
