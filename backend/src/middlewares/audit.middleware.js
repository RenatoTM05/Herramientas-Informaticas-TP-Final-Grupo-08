//este middleware va a "escuchar" las peticiones y las registra
const AuditLog= require('../models/audit.model')

const auditMiddleware = (accion)=>{  //recibe el nombre de la accion
    return async(req,res,next)=>{  //retorna el middleware
        //voy a guardar la respuesta original "res.send" que guarda las respuestas qu da laBD al realizar una accion
        const rtaOriginal =res.send
        
        res.send = function(data){//sobreescribimos "res.send" para interceptar la respuesta
            try{ //en este momento la BD ya respondió a la accion que realizaste
                const usuario= req.user ? req.user.username : 'ANONIMO' //si el usuario es autenticado guardamos su nombre
                AuditLog.create({  //creamos el registro de Auditoria
                    usuario:usuario,
                    accion:accion,
                    metodo:req.method,
                    ruta:req.originalUrl,
                    ip:req.ip,
                    userAgent:req.headers['user-agent'], //chrome,firefox...
                    fecha:new Date(),
                    statusCode:res.statusCode, //el status de la rta 404,505,200
                    resultado:data  //lo que devolvió
                }).catch(err => console.error('Error al guardar auditoria',err))
            } catch(err){
              console.error('Error en auditoría:', err)
            }
            //se llama a la funcion original para enviar la respuesta 
            rtaOriginal.call(this,data)
        }
        next() //se continua con el siguiente middleware
    }
}
module.exports=auditMiddleware