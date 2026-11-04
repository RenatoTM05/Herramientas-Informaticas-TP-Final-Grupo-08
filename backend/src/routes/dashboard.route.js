const express=require ('express')
const router=express.Router()
const controllDelDashboard=require('../controllers/dashboard.controller')
const autenticar=require('../middlewares/auth.middleware')
const soloAdmin = require('../middlewares/role.middlewares')

router.use(autenticar)
router.use(soloAdmin)

router.get('/metricas',controllDelDashboard.getMetricasGenerales)
router.get('/logins-por-dia',controllDelDashboard.getLoginsPorDia)
router.get('/acciones-por-tipo',controllDelDashboard.getAccionesPorTipo)
router.get('/usuarios-activos',controllDelDashboard.getUsuariosMasActivos)
router.get('/auditoria',controllDelDashboard.getAuditoriaListado)
router.get('/juegos-buscados',controllDelDashboard.getJuegosMasBuscados)
 module.exports=router