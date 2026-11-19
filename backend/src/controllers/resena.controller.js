const Resena = require('../models/resena.model');
const Juego = require('../models/juego.model');
const Login = require('../models/login.model');
const geminiService = require('../services/gemini.service');

const resenaCtrl = {};

resenaCtrl.createResena = async (req, res) => {
    try {
        let loginId = req.body.loginId;

        // Si se envía el token en el header, obtener el ID del usuario autenticado
        if (req.headers.authorization) {
            try {
                const jwt = require('jsonwebtoken');
                const token = req.headers.authorization.split(' ')[1];
                if (token) {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'token_pal_usuario');
                    if (decoded && decoded.id) {
                        loginId = decoded.id;
                    }
                }
            } catch (tokenErr) {
                console.warn('Aviso: Token no verificado en createResena:', tokenErr.message);
            }
        }

        const { juegoId, texto } = req.body;

        if (!juegoId || !texto || !texto.trim() || !loginId) {
            return res.status(400).json({ status: '0', msg: 'Faltan datos requeridos (juegoId, texto o usuario no identificado).' });
        }

        // Validar contenido con Gemini
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
            texto: texto.trim(),
            juegoId,
            loginId
        });

        // Obtener la reseña creada con los datos del usuario para el retorno
        const resenaConUsuario = await Resena.findByPk(nuevaResena.id, {
            include: [{
                model: Login,
                as: 'usuario',
                attributes: ['id', 'username', 'nombre', 'foto']
            }]
        });

        res.status(201).json({ status: '1', msg: 'Reseña publicada con éxito', data: resenaConUsuario || nuevaResena });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: '0', msg: 'Error al publicar reseña', error: error.message });
    }
};

resenaCtrl.getResenasByJuego = async (req, res) => {
    try {
        const { juegoId } = req.params;

        const pagina = Math.max(parseInt(req.query.pagina) || 1, 1);
        const limite = Math.min(Math.max(parseInt(req.query.limite) || 10, 1), 50);
        const offset = (pagina - 1) * limite;

        // Detectar si hay un usuario autenticado para priorizar sus reseñas primero
        let currentUserId = req.query.usuarioId ? parseInt(req.query.usuarioId, 10) : null;
        if (!currentUserId && req.headers.authorization) {
            try {
                const jwt = require('jsonwebtoken');
                const token = req.headers.authorization.split(' ')[1];
                if (token) {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'token_pal_usuario');
                    if (decoded && decoded.id) {
                        currentUserId = decoded.id;
                    }
                }
            } catch (tokenErr) {}
        }

        const { Sequelize } = require('sequelize');
        const orderClausula = [];

        if (currentUserId && !isNaN(currentUserId)) {
            // Reseñas del usuario conectado primero
            orderClausula.push([
                Sequelize.literal(`CASE WHEN "Resena"."loginId" = ${currentUserId} THEN 0 ELSE 1 END`),
                'ASC'
            ]);
        }
        orderClausula.push(['likes', 'DESC']);
        orderClausula.push(['createdAt', 'DESC']);

        const { count, rows } = await Resena.findAndCountAll({
            where: { juegoId },
            attributes: ['id', 'juegoId', 'loginId', 'texto', 'likes', 'createdAt'],
            include: [
                {
                    model: Login,
                    as: 'usuario',
                    attributes: ['id', 'username', 'nombre', 'foto']
                }
            ],
            order: orderClausula,
            limit: limite,
            offset: offset
        });

        res.json({
            status: '1',
            data: rows,
            total: count,
            pagina,
            limite,
            totalPaginas: Math.ceil(count / limite)
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: '0',
            msg: 'Error al obtener reseñas',
            error: error.message
        });
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