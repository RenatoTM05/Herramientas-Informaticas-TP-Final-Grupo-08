const Juego = require('../models/juego.model');
const AuditLog = require('../models/audit.model');
const Resena = require('../models/resena.model');
const sequelize = require('../../config/database');

const dashboardJuegoCtrl = {};

dashboardJuegoCtrl.getEstadisticas = async (req, res) => {
    try {
        // Cantidad de juegos guardados localmente en la cache de la BD
        const totalJuegosGuardados = await Juego.count();

        // Cantidad de busquedas de juegos realizadas (usando el log de auditoria
        const totalBusquedasJuegos = await AuditLog.count({
            where: { accion: 'BUSQUEDA_JUEGO' }
        });

        // Cantidad de imagenes en la base de datos local (portadas + capturas)
        const juegosConImagenes = await Juego.findAll({
            attributes: ['imagen_portada', 'capturas']
        });

        let totalImagenesJuegos = 0;
        juegosConImagenes.forEach(juego => {
            if (juego.imagen_portada) {
                totalImagenesJuegos++;
            }
            if (juego.capturas && Array.isArray(juego.capturas)) {
                totalImagenesJuegos += juego.capturas.length;
            }
        });

        // Cantidad de reseñas publicadas
        const totalResenas = await Resena.count();

        // Juego con mas reseñas
        const resenaMasFrecuente = await Resena.findOne({
            attributes: [
                'juegoId',
                [sequelize.fn('COUNT', sequelize.col('juegoId')), 'cantidad']
            ],
            group: ['juegoId'],
            order: [[sequelize.literal('cantidad'), 'DESC']]
        });
        
        let juegoConMasResenas = null;
        if (resenaMasFrecuente) {
            const juego = await Juego.findByPk(resenaMasFrecuente.juegoId, { attributes: ['titulo'] });
            if (juego) {
                juegoConMasResenas = {
                    titulo: juego.titulo,
                    cantidad: parseInt(resenaMasFrecuente.get('cantidad'), 10)
                };
            }
        }

        res.json({
            status: '1',
            msg: 'Estadísticas del dashboard obtenidas correctamente.',
            data: { totalJuegosGuardados, totalBusquedasJuegos, totalImagenesJuegos, totalResenas, juegoConMasResenas }
        });

    } catch (error) {
        console.error('Error al obtener estadísticas del dashboard:', error);
        res.status(500).json({ status: '0', msg: 'Error interno al procesar las estadísticas.', error: error.message });
    }
};

module.exports = dashboardJuegoCtrl;
