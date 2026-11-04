const LoginModel=require('../models/login.model')
const UsuarioModel=require('../models/usuario.model')
const AccesoModal=require('../models/acceso.model')
const encriptador= require ('bcrypt')
const jwt = require('jsonwebtoken')
const funcionesLogin={}

funcionesLogin.createUsuario= async(req,res) =>{
    try{
        const body=req.body

        if(!body.username || !body.password || !body.nombre || !body.apellido){
            return res.status(404).json({ // Agregamos return para cortar la ejecución aquí
                status:'0',
                msg:'complete los campos correspondientes'
            })
        }
        const sameUser=await LoginModel.findOne({
            where:{username: body.username}
        })

        if(sameUser){
            return res.status(404).json({
                status:'0',
                msg:'este username ya esta usado ingrese otro'
            })
        }
        const cifrado = 10
        const contraseñaCifrada= await encriptador.hash(body.password,cifrado)

        const bodyDelNuevoUsuario={ 
            username:body.username,
            password:contraseñaCifrada,
            nombre:body.nombre,
            apellido:body.apellido,
            perfil:body.perfil
        }

        // Aquí se crea el usuario en la base de datos:
        const usuarioCreado = await LoginModel.create(bodyDelNuevoUsuario)
        
        await UsuarioModel.create({
                loginId: usuarioCreado.id
            })
         
        console.log(` Usuario y Login creados para: ${body.username}`)

        return res.status(201).json({
            status: '1',
            msg: 'Usuario creado con éxito pa',
            data: {
                id: usuarioCreado.id,
                username: usuarioCreado.username
            }
        });

    }
    catch(error)
    {   console.error('Error al crear usuario:', error)
        res.status(500).json({
        status:'0',
        msg:'no se pudo crear el usuario',error
    })}
}

funcionesLogin.loginUsuario= async(req,res) =>{
    try{
        const body=req.body
        if(!body.username || !body.password){
            return res.status(404).json({
                status:'0',
                msg:'complete los campos correspondientes'
            })
        }

        const userIdentico= await LoginModel.findOne({
            where:{
                username:body.username  }
        })

        if(!userIdentico){
            return res.status(404).json({
                status:'0',
                msg:'este usuario no existe'
            })
        }

        const compararContras= await encriptador.compare(body.password,userIdentico.password)

        if(!compararContras){
            return res.status(404).json({
                status:'0',
                msg:'contraseña incorrecta pa'
            })
        }else{
            await AccesoModal.create({
                usuarioId:userIdentico.id,
                username:userIdentico.username,
                fecha:new Date(),
                ip:req.ip,
                userAgent:req.headers['user-agent'],
                exito:true
            })
        }
        const JWT_SECRET = process.env.JWT_SECRET || 'token_pal_usuario'
        const token= jwt.sign(
            {
                id:userIdentico.id,
                username:userIdentico.username,
                perfil:userIdentico.perfil
            },
            'token_pal_usuario',
            {expiresIn:'2h'} //el token expira en 2 horas
        )
       
                return res.json({
                    status:'1',
                    msg:'se pudo loguear correctamente',
                    token: token,
                    username:userIdentico.username,
                    password:userIdentico.password,
                    userId:userIdentico._id
            })
        

    }
    catch(error){
       await AccesoModal.create({
                usuarioId:userIdentico.id,
                username:userIdentico.username,
                fecha:new Date(),
                ip:req.ip,
                userAgent:req.headers['user-agente'],
                exito:false,
                error:error.message

            })
        res.status(505).json({
            status:'0',
            msg:'error en el logueo',error
        })
    }
}

module.exports=funcionesLogin