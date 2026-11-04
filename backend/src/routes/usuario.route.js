const express=require('express')
const router=express.Router()
const usuarioController=require('../controllers/usuario.controller')
const autenticar=require('../middlewares/auth.middleware')
const soloAdmin= require('../middlewares/role.middlewares')
const auditoriaMiddleware= require('../middlewares/audit.middleware')
router.use(autenticar)
router.use(soloAdmin)

//para cada uno de estos endpoints el admin va a ser el unico que pueda usarlos
router.get('/',usuarioController.getAllUsers)
router.delete('/:id',auditoriaMiddleware('ELIMINAR_USUARIO'),usuarioController.deleteUser)
 router.get('/username/:username',usuarioController.getOneUser)
router.put('/',auditoriaMiddleware('MODIFICAR_USUARIO'),usuarioController.modifUser)

 module.exports=router