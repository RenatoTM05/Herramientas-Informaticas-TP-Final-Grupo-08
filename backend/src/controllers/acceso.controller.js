const AccesoModal=require('../models/acceso.model')
const funcionesDelAcceso={}

funcionesDelAcceso.getHistorialAccesos=async(req,res)=>{
    try{
const accesos= await Acceso.findAll({
    order:[['fecha', 'DESC']],
        limit:100 //ultimos 50 accesos
    })
    res.json(accesos);
    }catch(Error){
        res.status(500).json({
            status:'0',
            msg:'Error al obtener historial de accesos',
            error:Error.message
        })
    }
}
 module.export=funcionesDelAcceso