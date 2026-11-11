
const express = require('express');
const router = express.Router();

const juegoCtrl = require('../controllers/juego.controller');
const auditoriaMiddleware = require('../middlewares/audit.middleware');

router.get('/', juegoCtrl.getJuegos);

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
