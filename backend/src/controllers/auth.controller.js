const JWT = require('jsonwebtoken') //para crear nuestro token despues del login con google
const Login =require('../models/login.model')

const funcionesAuthcontroller={}

funcionesAuthcontroller.googleAceptado = async(req,res)=>{
    try{
        const user=req.user  //este usuario viene de Passport (despues de ser autenticado con Google)
                            //passport automaticamente pone el usuario en req.user
        const token = JWT.sign({ //creamos nuestro propio JWT (igual q en el login normal)
            id:user.id, //le mando los datos reales del usuario q quiero guardar
            username:user.username, 
            perfil:user.perfil
        },
        process.env.JWT_SECRET || 'token_pal_usuario',
        {expiresIn:'2h'}
        )  
        const frontendUrl=process.env.FRONTEND_URL || 'http://localhost:4200';
        res.redirect(`${frontendUrl}/oauth-callback?token=${token}`) //al no ser una peticion normal como veniamos manejando por AJAX/Fetch no se puede hacer res.json()
                                                                                  //se tiene que redireccionar al user a la aplicacion del front pasandole el token en la barra de direcciones (URL Query)
                                                                                  //El front tiene q leer la URL y guardar el token en su localStorage
    }
    catch(error){
        res.status(500).json({
            status:'0',
            msg:'Error en login con Google',
            error:error.message
        })
    }
}

funcionesAuthcontroller.falloGoogle = async (req,res)=>{
           const frontendUrl=process.env.FRONTEND_URL || 'http://localhost:4200';
    res.redirect(`${frontendUrl}/login?error=google_auth_failed`)//si el user canceló el login en la pantalla de google o credenciales fallan lo mandamos a la pantalla de login
}
module.exports=funcionesAuthcontroller