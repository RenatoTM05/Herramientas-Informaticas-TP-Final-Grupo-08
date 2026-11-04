const express=require('express')
const router=express.Router()
const passport= require('../../config/passport')
const authcontroller= require ('../controllers/auth.controller')

router.get('/google',passport.authenticate('google',{scope:['profile','email']}))
router.get('/google/callback',passport.authenticate('google',{failureRedirect:'/api/auth/google/failure',session:false}),authcontroller.googleAceptado)
router.get('/google/failure',authcontroller.falloGoogle)
router.get('/logout',(req,res)=>{
    req.logout((err) =>{
        if(err){
            return res.status(500).json({msg: ' Error al cerrar sesión'})
        }
        res.json({msg:'Sesión cerrada correctamente'})
    })
})
module.exports=router