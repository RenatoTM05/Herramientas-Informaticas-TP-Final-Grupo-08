const Resena = require('../models/resena.model');
const Juego = require('../models/juego.model');
const Login = require('../models/login.model');
const geminiService = require('../services/gemini.service');

const resenaCtrl = {};

resenaCtrl.createResena = async (req, res) => {
    try {
        // NOTA: Se saco la autentificacion para pruebas. El loginId ahora debe ir en el body
        // Cuando se reactive la seguridad, la linea debe ser: const loginId = req.user.id;
        const { juegoId, texto, loginId } = req.body;

        // Se agrega loginId a la validación para testing
        if (!juegoId || !texto || !loginId) {
            return res.status(400).json({ status: '0', msg: 'Faltan datos (juegoId, texto, loginId)' });
        }

        //Validar contenido con Gemini
        try {
            const validacion = await geminiService.validarResenaConGemini(texto);

            if (!validacion.aprobada) {
                return res.status(400).json({
                    status: '0',
                    msg: 'La reseña no cumple con las políticas de la comunidad.',
                    motivo: validacion.motivo
                });
            }
        } catch (geminiError) {
            console.error('Error de validación con Gemini:', geminiError.message);
            return res.status(503).json({ status: '0', msg: 'El servicio de moderación no está disponible en este momento. Inténtalo más tarde.' });
        }

        // Verificar que el usuario no haya reseñado este juego antes
        const existingResena = await Resena.findOne({ where: { loginId, juegoId } });
        if (existingResena) {
            return res.status(409).json({ status: '0', msg: 'Ya has publicado una reseña para este juego.' });
        }

        const nuevaResena = await Resena.create({
            texto,
            juegoId,
            loginId
        });
        res.status(201).json({ status: '1', msg: 'Reseña publicada', data: nuevaResena });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: '0', msg: 'Error al publicar reseña', error: error.message });
    }
};

resenaCtrl.getResenasByJuego = async (req, res) => {
    try {
        const { juegoId } = req.params;
        const resenas = await Resena.findAll({
            where: { juegoId },
            include: [
                { 
                    model: Login, 
                    as: 'usuario', // Usamos el alias que definimos en index.js
                    attributes: ['id', 'username', 'nombre', 'foto'] // Excluimos datos sensibles
                },
            ],
            order: [['likes', 'DESC']]
        });
        res.json(resenas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: '0', msg: 'Error al obtener reseñas', error: error.message });
    }
};

// para sumar likes
resenaCtrl.addLike = async (req, res) => {
    try {
        const { id } = req.params; // Asumimos que el ID de la reseña viene en la URL
        const resena = await Resena.findByPk(id);
        if (!resena) {
            return res.status(404).json({ status: '0', msg: 'Reseña no encontrada' });
        }
        
        // increment actualiza la BD y devuelve la instancia actualizada
        const resenaActualizada = await resena.increment('likes', { by: 1 });
        
        res.json({ status: '1', msg: 'Like agregado', likes: resenaActualizada.likes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: '0', msg: 'Error al dar like', error: error.message });
    }
};

module.exports = resenaCtrl;