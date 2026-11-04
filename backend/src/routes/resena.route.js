const express = require('express');
const router = express.Router();
const resenaCtrl = require('../controllers/resena.controller');
const autenticar = require('../middlewares/auth.middleware'); // Asumo que este es tu middleware

// Obtener todas las reseñas de un juego especifico (publico)
router.get('/juego/:juegoId', resenaCtrl.getResenasByJuego);

// Crear una nueva reseña (temporalmente sin autenticacion para pruebas)
router.post('/', resenaCtrl.createResena);

// Dar like a una reseña (temporalmente sin autenticación para pruebas)
router.patch('/:id/like', resenaCtrl.addLike);

module.exports = router;