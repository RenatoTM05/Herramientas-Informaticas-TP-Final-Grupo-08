const JWT = require('jsonwebtoken') //para crear nuestro token despues del login con google
const Login =require('../models/login.model')

const funcionesAuthcontroller={}

function resolverFrontendUrl(req) {
    // 1. Intentar recuperar la URL del frontend enviada en el parámetro 'state' de OAuth
    if (req.query && req.query.state) {
        try {
            const parsed = JSON.parse(Buffer.from(req.query.state, 'base64').toString('utf-8'));
            if (parsed && parsed.returnUrl) {
                return parsed.returnUrl;
            }
        } catch (e) {
            console.warn('Aviso: no se pudo decodificar el state de OAuth:', e.message);
        }
    }

    // 2. Si vino a través de Nginx/Tailscale con cabeceras de proxy
    const host = req.headers['x-forwarded-host'] || req.headers['host'];
    const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
    if (host && !host.startsWith('backend') && !host.startsWith('127.0.0.1:3000') && !host.startsWith('localhost:3000')) {
        return `${proto}://${host}`;
    }

    // 3. Fallback a la variable de entorno o localhost:4200
    return process.env.FRONTEND_URL || 'http://localhost:4200';
}

funcionesAuthcontroller.googleAceptado = async(req,res)=>{
    try{
        const user=req.user  //este usuario viene de Passport (despues de ser autenticado con Google)
        const token = JWT.sign({ //creamos nuestro propio JWT (igual q en el login normal)
            id:user.id, //le mando los datos reales del usuario q quiero guardar
            username:user.username, 
            perfil:user.perfil
        },
        process.env.JWT_SECRET || 'token_pal_usuario',
        {expiresIn:'2h'}
        )  
        const frontendUrl = resolverFrontendUrl(req);
        res.redirect(`${frontendUrl}/oauth-callback?token=${token}`)
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
    const frontendUrl = resolverFrontendUrl(req);
    res.redirect(`${frontendUrl}/Login?error=google_auth_failed`)
}
module.exports=funcionesAuthcontroller