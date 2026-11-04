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
        const { page = 1, limit = 10, search = '' } = req.query
        const offset = (page - 1) * limit

        const where = {}
        if (search) {
            where[Op.or] = [
                { usuario: { [Op.iLike]: `%${search}%` } },
                { accion: { [Op.iLike]: `%${search}%` } },
                { ruta: { [Op.iLike]: `%${search}%` } }
            ]
        }

        const { count, rows } = await AuditoriaModel.findAndCountAll({
            where,
            order: [['fecha', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        })
        res.json({
            status: '1',
            data: rows,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / limit)
        })
    } catch (error) {
        console.error('❌ ERROR DETALLADO en getAuditoriaListado:', error)
        res.status(500).json({
            status: '0',
            error: error.message
        })
    }
}

funcionesDelDashboard.getJuegosMasBuscados = async (req, res) => {
    try {
        console.log('🔍 getJuegosMasBuscados ejecutándose...')
        // ✅ CORREGIDO: Usar Sequelize (mayúscula)
        const juegosBuscados = await AuditoriaModel.findAll({
            attributes: [
                'resultado',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'cantidad']
            ],
            where: {
                accion: 'BUSCAR_JUEGO'
            },
            group: ['resultado'],
            order: [[Sequelize.literal('cantidad'), 'DESC']],
            limit: 10
        })
        res.json({
            status: '1',
            data: juegosBuscados
        })
    } catch (error) {
        console.error('❌ ERROR DETALLADO en getJuegosBuscados:', error)
        res.status(500).json({
            status: '0',
            error: error.message
        })
    }
}

module.exports = funcionesDelDashboard