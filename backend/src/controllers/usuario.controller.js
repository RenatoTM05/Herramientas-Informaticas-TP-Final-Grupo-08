const UsuarioModel=require('../models/usuario.model')
const Login=require('../models/login.model')
 const funcionesUsuario={}

funcionesUsuario.getAllUsers= async(req,res)=>{
    try{
        const allUser= await Login.findAll({
            attributes:{exclude:['password']}
        })
        if(allUser.length === 0){
            return res.status(404).json({
                status:'0',
                msg:'no hay ningun usuario logueado'
            })
        }
        res.json(allUser)
    }
    catch(error){
        res.status(500).json({
                status: '0',
                msg: 'Error al obtener usuarios',
                error: error.message
        })
    }
}

funcionesUsuario.deleteUser=async(req,res)=>{ //este va a ser para que al lado de cada usuario haya un boton para eliminar por eso no verifico que exista
    try{
        const findUser= await Login.findOne({
            where:{username:req.params.id}
            })
        findUser.destroy()//elimino en base al objeto encontrado
    return res.json({
        status:'1',
        msg:'usuario eliminado correctamente'
    })    
    }
    
    catch(error){
        res.status(505).json({
            status:'0',
            msg:'no se pudo eliminar ocurrió un error',error
        })
    }
}

funcionesUsuario.getOneUser=async (req,res) =>{ //va a haber un buscador para encontrar un usuario y poder editarlo o eliminarlo
    try{
        const findUser=await Login.findOne(
            {where:{
                username:req.params.username},
            attributes:{exclude:['password']}
            } )
        if(!findUser){
            return res.status(404).json({
                status:'0',
                msg:'no existe el usuario'
            })
        }
        res.json(findUser)
    }
    catch(error){
        res.status(505).json({
            status:'0',
            msg:'no pude encontrar el usuario pa'
        })
    }
}



funcionesUsuario.modifUser= async(req,res)=>{ //este va a ser un boton para modificar al usuario por eso no verifico si existe
    try{ const {id} = req.body
        const updateUser= await Login.update(req.body,{
            where:{id:id}
        })
    }
    catch(error){
        res.status(505).json({
            status:'0',
            msg:'algo salió mal',error
        })
    }
}

module.exports=funcionesUsuario