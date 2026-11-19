const { Sequelize } = require('sequelize');
const Op = Sequelize.Op;  // ✅ Op también funciona con Sequelize.Op
const LoginModel = require('../models/login.model')
const AccesoModel = require('../models/acceso.model')
const AuditoriaModel = require('../models/audit.model')

const funcionesDelDashboard = {}

funcionesDelDashboard.getMetricasGenerales = async (req, res) => {
    try {
        const totalUsuarios = await LoginModel.count()

        const hace7Dias = new Date()
        hace7Dias.setDate(hace7Dias.getDate() - 7)
        const usuariosNuevos = await LoginModel.count({
            where: { createdAt: { [Op.gte]: hace7Dias } }
        })

        const hoy = new Date()
        hoy.setHours(0, 0, 0, 0)
        const loginsHoy = await AccesoModel.count({
            where: {
                fecha: { [Op.gte]: hoy },
                exito: true
            }
        })

        const totalAcciones = await AuditoriaModel.count()

        res.json({
            status: '1',
            data: {
                totalUsuarios,
                usuariosNuevos,
                loginsHoy,
                totalAcciones,
            }
        })
    } catch (error) {
        console.error('❌ Error en getMetricasGenerales:', error)
        res.status(500).json({
            status: '0',
            msg: 'Fallo al realizar las metricas',
            error: error.message
        })
    }
}

funcionesDelDashboard.getLoginsPorDia = async (req, res) => {
    try {
        console.log('🔍 getLoginsPorDia ejecutándose...')
        const hace7Dias = new Date();
        hace7Dias.setDate(hace7Dias.getDate() - 7);

        // ✅ CORREGIDO: Usar Sequelize (mayúscula) en TODOS lados
        const results = await AccesoModel.findAll({
            attributes: [
                [Sequelize.fn('DATE', Sequelize.col('fecha')), 'dia'],
                [Sequelize.fn('COUNT', Sequelize.col('*')), 'total'],
                [Sequelize.fn('COUNT', Sequelize.literal("CASE WHEN exito = true THEN 1 END")), 'exitosos'],
                [Sequelize.fn('COUNT', Sequelize.literal("CASE WHEN exito = false THEN 1 END")), 'fallidos'],
            ],
            where: {
                fecha: { [Op.gte]: hace7Dias }
            },
            group: [Sequelize.fn('DATE', Sequelize.col('fecha'))],
            order: [[Sequelize.fn('DATE', Sequelize.col('fecha')), 'ASC']],
            raw: true
        })

        res.json({
            status: '1',
            data: results
        })
    } catch (error) {
        console.error('❌ ERROR DETALLADO en getLoginsPorDia:', error)
        res.status(500).json({
            status: '0',
            error: error.message
        })
    }
}

funcionesDelDashboard.getAccionesPorTipo = async (req, res) => {
    try {
        console.log('🔍 getAccionesPorTipo ejecutándose...')
        // ✅ CORREGIDO: Usar Sequelize (mayúscula)
        const Acciones = await AuditoriaModel.findAll({
            attributes: [
                'accion',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'cantidad']
            ],
            group: ['accion'],
            order: [[Sequelize.literal('cantidad'), 'DESC']],
            limit: 10
        })

        const data = Acciones.map(r => ({
            accion: r.accion,
            cantidad: r.dataValues.cantidad
        }))

        res.json({
            status: '1',
            data
        })
    } catch (error) {
        console.error('❌ ERROR DETALLADO en getAccionesPorTipo:', error)
        res.status(500).json({
            status: '0',
            msg: error.message
        })
    }
}

funcionesDelDashboard.getUsuariosMasActivos = async (req, res) => {
    try {
        console.log('🔍 getUsuariosMasActivos ejecutándose...')
        // ✅ CORREGIDO: Usar Sequelize (mayúscula)
        const usuariosActivos = await AuditoriaModel.findAll({
            attributes: [
                'usuario',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'cantidad']
            ],
            where: {
                usuario: { [Op.ne]: 'ANONIMO' }
            },
            group: ['usuario'],
            order: [[Sequelize.literal('cantidad'), 'DESC']],
            limit: 10
        })
        res.json({
            status: '1',
            data: usuariosActivos
        })
    } catch (error) {
        console.error('❌ ERROR DETALLADO en getUsuariosActivos:', error)
        res.status(500).json({
            status: '0',
            error: error.message
        })
    }
}

funcionesDelDashboard.getAuditoriaListado = async (req, res) => {
    try {
        console.log('🔍 getAuditoriaListado ejecutándose...')
        const page = Math.max(parseInt(req.query.page || req.query.pagina) || 1, 1);
        const limit = Math.max(parseInt(req.query.limit || req.query.limite) || 10, 1);
        const search = (req.query.search || req.query.busqueda || '').trim();
        const offset = (page - 1) * limit;

        const where = {};
        if (search) {
            where[Op.or] = [
                { usuario: { [Op.iLike]: `%${search}%` } },
                { accion: { [Op.iLike]: `%${search}%` } },
                { ruta: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const { count, rows } = await AuditoriaModel.findAndCountAll({
            where,
            order: [['fecha', 'DESC']],
            limit: limit,
            offset: offset
        });

        const totalPages = Math.ceil(count / limit) || 1;

        res.json({
            status: '1',
            data: rows,
            total: count,
            page: page,
            pagina: page,
            totalPages: totalPages,
            totalPaginas: totalPages
        });
    } catch (error) {
        console.error('❌ ERROR DETALLADO en getAuditoriaListado:', error);
        res.status(500).json({
            status: '0',
            error: error.message
        });
    }
};

funcionesDelDashboard.getJuegosMasBuscados = async (req, res) => {
    try {
        console.log('🔍 getJuegosMasBuscados ejecutándose...');
        const JuegoModel = require('../models/juego.model');

        // Consultamos los registros de auditoría de búsquedas o consultas de juegos
        const auditorias = await AuditoriaModel.findAll({
            attributes: ['ruta', 'resultado', 'accion'],
            where: {
                accion: { [Op.in]: ['BUSCAR_JUEGO', 'DETALLE_JUEGO', 'CONSULTAR_JUEGO'] }
            },
            order: [['id', 'DESC']],
            limit: 3000
        });

        const contadores = {};

        for (const log of auditorias) {
            let termino = null;

            if (log.ruta) {
                // Si la ruta contiene /sugerencias/:nombre
                const sugerenciaMatch = log.ruta.match(/sugerencias\/([^/?]+)/i);
                if (sugerenciaMatch) {
                    termino = decodeURIComponent(sugerenciaMatch[1]).trim();
                }

                // Si la ruta contiene /detalles/:id o /detalle/:id
                const detalleMatch = log.ruta.match(/detalle(?:s)?\/(\d+)/i);
                if (!termino && detalleMatch) {
                    termino = `ID_${detalleMatch[1]}`;
                }
            }

            // Si resultado contiene un término textual que no es JSON
            if (!termino && log.resultado && typeof log.resultado === 'string') {
                const trimmed = log.resultado.trim();
                if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
                    termino = trimmed;
                }
            }

            if (termino) {
                contadores[termino] = (contadores[termino] || 0) + 1;
            }
        }

        // Ordenar los términos más buscados
        let topJuegos = Object.keys(contadores)
            .map(nombre => ({ resultado: nombre, cantidad: contadores[nombre] }))
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 8);

        // Si hay IDs en formato ID_XXXX, resolver los títulos desde el modelo Juego
        const idsAResolver = topJuegos
            .filter(j => j.resultado.startsWith('ID_'))
            .map(j => parseInt(j.resultado.replace('ID_', ''), 10))
            .filter(Boolean);

        if (idsAResolver.length > 0) {
            const juegosEncontrados = await JuegoModel.findAll({
                where: { id: { [Op.in]: idsAResolver } },
                attributes: ['id', 'titulo']
            });

            const mapaTitulos = {};
            juegosEncontrados.forEach(j => { mapaTitulos[j.id] = j.titulo; });

            topJuegos = topJuegos.map(j => {
                if (j.resultado.startsWith('ID_')) {
                    const id = j.resultado.replace('ID_', '');
                    return {
                        resultado: mapaTitulos[id] || `Juego #${id}`,
                        cantidad: j.cantidad
                    };
                }
                return j;
            });
        }

        // Si no hay datos suficientes de auditoría, tomar juegos destacados como base
        if (topJuegos.length === 0) {
            const juegosDestacados = await JuegoModel.findAll({
                order: [['calificacion', 'DESC']],
                limit: 6,
                attributes: ['titulo', 'calificacion']
            });
            topJuegos = juegosDestacados.map(j => ({
                resultado: j.titulo,
                cantidad: Math.round((j.calificacion || 80) / 10)
            }));
        }

        res.json({
            status: '1',
            data: topJuegos
        });
    } catch (error) {
        console.error('❌ ERROR DETALLADO en getJuegosBuscados:', error);
        res.status(500).json({
            status: '0',
            error: error.message
        });
    }
};

module.exports = funcionesDelDashboard