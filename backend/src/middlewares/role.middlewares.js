
const soloAdmin = (req,res,next)=>{
    if(!req.user || req.user.perfil !== 'admin'){
        return res.status(403).json({
            msg:'esta ruta es solo para admins'
        })
    }
    next()
}
module.exports=soloAdmin