const funcionLogin=require('../controllers/login.controller')
 const express=require('express')
const router=express.Router()

router.post('/',funcionLogin.createUsuario)
router.post('/loginUser',funcionLogin.loginUsuario)

module.exports=router
