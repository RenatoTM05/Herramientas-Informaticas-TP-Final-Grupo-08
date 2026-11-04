const sanitizador = require ('xss') //xss es libreria que limpia texto para prevenir ataques de XSS

//este middleware recibe req,res,next
const sanitizeInput = (req,res,next) =>{
   
    if(req.body){//si hay datos en el body (POST,PUT,etc)
        for (let key in req.body){ //recorre cada propiedad del objeto(username,password...)
            if(typeof req.body[key]==='string'){ //si el valor es texto...
                req.body[key] = sanitizador(req.body[key].trim())//elimino espacios con el trim y sanitizo (filtro los datos q el user envia)
            }
        }
    }

    //hace lo mismo para las respuestas q viene de query osea de la BD
    if(req.query){
        for(let key in req.query){
            if(typeof req.query[key]==='string'){
                req.query[key]=sanitizador(req.query[key].trim())
            }
        }
    }

        //hace lo mismo para las respuestas q viene de query osea de la BD
    if(req.params){
        for(let key in req.params){
            if(typeof req.params[key]==='string'){
                req.params[key]=sanitizador(req.params[key].trim())
            }
        }
    }
    //continuo con el siguiente middleware si esq lo hay o directamente el controller
    next()
}
module.exports=sanitizeInput