
const { Op } = require('sequelize');
const Juego = require('../models/juego.model');

const juegoCtrl = {};

// Obtener juegos locales
juegoCtrl.getJuegos = async (req, res) => {
    try {
        const juegos = await Juego.findAll({
            order: [['id', 'DESC']]
        });

        res.json(juegos);
    } catch (error) {
        console.error('Error al obtener los juegos:', error);
        res.status(500).json({
            status: '0',
            msg: 'Error al obtener los juegos.'
        });
    }
};

// Obtener los juegos mejor calificados
juegoCtrl.getMasJugados = async (req, res) => {
    try {
        const juegos = await Juego.findAll({
            order: [['calificacion', 'DESC']],
            limit: 10
        });

        res.json({
            status: '1',
            data: juegos
        });
    } catch (error) {
        console.error('Error al obtener juegos destacados:', error);
        res.status(500).json({
            status: '0',
            msg: 'Error al obtener los juegos destacados.'
        });
    }
};

// Buscar sugerencias por título en PostgreSQL
juegoCtrl.getSugerencias = async (req, res) => {
    try {
        const { nombre } = req.params;

        const resultados = await Juego.findAll({
            where: {
                titulo: {
                    [Op.iLike]: `%${nombre}%`
                }
            },
            order: [['calificacion', 'DESC']],
            limit: 10
        });

        res.json({
            status: '1',
            data: resultados
        });
    } catch (error) {
        console.error('Error en sugerencias:', error);
        res.status(500).json({
            status: '0',
            msg: 'Error al buscar juegos.'
        });
    }
};

// Obtener detalle exclusivamente desde PostgreSQL
juegoCtrl.getDetalleJuego = async (req, res) => {
    try {
        const juegoId = Number.parseInt(req.params.id, 10);

        if (!Number.isInteger(juegoId) || juegoId <= 0) {
            return res.status(400).json({
                status: '0',
                msg: 'ID de juego inválido.'
            });
        }

        const juego = await Juego.findByPk(juegoId);

        if (!juego) {
            return res.status(404).json({
                status: '0',
                msg: 'Juego no encontrado en la base de datos.'
            });
        }

        res.json({
            status: '1',
            data: juego
        });
    } catch (error) {
        console.error('Error al obtener detalle del juego:', error);
        res.status(500).json({
            status: '0',
            msg: 'Error al obtener el detalle del juego.'
        });
    }
};

// Búsqueda con filtros y paginación para HU21
juegoCtrl.buscarJuegos = async (req, res) => {
    try {
        const {
            termino = '',
            desarrolladora,
            calificacionMin,
            calificacionMax,
            pagina = 1,
            limite = 20,
            orden = 'titulo',
            direccion = 'ASC'
        } = req.query;

        const numeroPagina = Math.max(1, Number.parseInt(pagina, 10) || 1);
        const limiteResultados = Math.min(
            100,
            Math.max(1, Number.parseInt(limite, 10) || 20)
        );

        const ordenesPermitidos = [
            'titulo',
            'calificacion',
            'fecha_lanzamiento',
            'desarrolladora'
        ];

        const campoOrden = ordenesPermitidos.includes(orden)
            ? orden
            : 'titulo';

        const direccionOrden = direccion.toUpperCase() === 'DESC'
            ? 'DESC'
            : 'ASC';

        const where = {};

        if (termino.trim()) {
            where.titulo = {
                [Op.iLike]: `%${termino.trim()}%`
            };
        }

        if (desarrolladora) {
            where.desarrolladora = {
                [Op.iLike]: `%${desarrolladora}%`
            };
        }

        if (calificacionMin !== undefined || calificacionMax !== undefined) {
            where.calificacion = {};

            if (calificacionMin !== undefined) {
                where.calificacion[Op.gte] = Number(calificacionMin);
            }

            if (calificacionMax !== undefined) {
                where.calificacion[Op.lte] = Number(calificacionMax);
            }
        }

        const resultado = await Juego.findAndCountAll({
            where,
            limit: limiteResultados,
            offset: (numeroPagina - 1) * limiteResultados,
            order: [[campoOrden, direccionOrden]]
        });

        res.json({
            status: '1',
            data: resultado.rows,
            paginacion: {
                total: resultado.count,
                pagina: numeroPagina,
                limite: limiteResultados,
                totalPaginas: Math.ceil(resultado.count / limiteResultados)
            }
        });
    } catch (error) {
        console.error('Error en búsqueda avanzada:', error);
        res.status(500).json({
            status: '0',
            msg: 'Error al realizar la búsqueda.'
        });
    }
};

module.exports = juegoCtrl;
