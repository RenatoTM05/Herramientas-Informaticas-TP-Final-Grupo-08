const JWT = require('jsonwebtoken')
require('dotenv').config()
const autenticar =(req,res,next)=>{
    try{
       const JWT_SECRET = process.env.JWT_SECRET || 'token_pal_usuario'
        const tokenHeader = req.headers.authorization
    
    if (!tokenHeader) {
            return res.status(401).json({
                status: '0',
                msg: 'No hay token de autenticación'
            })
        }
        
        // El formato es: "Bearer TOKEN"
        const token = tokenHeader.split(' ')[1]
        
        if (!token) {
            return res.status(401).json({
                status: '0',
                msg: 'Formato de token inválido'
            })
        }
        
        // ✅ Verificar el token
        const decoded = JWT.verify(token, JWT_SECRET)
        
        // ✅ Guardar información del usuario en req para usarla después
        req.user = decoded
        
        next()  // Continúa con la siguiente función
    } catch(error) {
        return res.status(401).json({
            status: '0',
            msg: 'Token inválido o expirado',
            error: error.message
        })
    }
}
module.exports=autenticar