const express = require('express');
const router = express.Router();
const dashboardJuegoCtrl = require('../controllers/dashboardJuego.controller');

// Ruta publica para obtener las estadisticas
router.get('/estadisticas', dashboardJuegoCtrl.getEstadisticas);

module.exports = router;
