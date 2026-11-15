const express=require('express')
const router=express.Router()
const passport= require('../../config/passport')
const authcontroller= require ('../controllers/auth.controller')

router.get('/google', (req, res, next) => {
    // Determinar la URL del frontend de origen para preservar el dominio tras OAuth
    const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
    const host = req.headers['x-forwarded-host'] || req.headers['host'];

    let returnUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    if (host && !host.startsWith('backend') && !host.startsWith('127.0.0.1:3000') && !host.startsWith('localhost:3000')) {
        returnUrl = `${proto}://${host}`;
    }

    const state = Buffer.from(JSON.stringify({ returnUrl })).toString('base64');

    passport.authenticate('google', {
        scope: ['profile', 'email'],
        state: state
    })(req, res, next);
});

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