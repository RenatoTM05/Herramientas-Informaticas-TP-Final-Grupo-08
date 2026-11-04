const {DataTypes} =require('sequelize')
const conexionABd=require('../../config/database')

const AuditLog=conexionABd.define('AuditLog',{
    usuario:{type:DataTypes.STRING,allowNull:false}, //quien hizo la acción
    accion:{type:DataTypes.STRING,allowNull:false}, //que acción realizó como eliminar al usuario, comprar algun jueguillo
    metodo:{type:DataTypes.STRING,allowNull:false}, //que tipo de peticion hizo get,post
    ruta:{type:DataTypes.STRING,allowNull:false},   //a que endpoint llamó /api/login/login /api/juego/mas-jugados
    ip:{type:DataTypes.STRING,allowNull:false},   //desde la ip q realizo la accion 192.168.1.100
    userAgent:{type:DataTypes.STRING,allowNull:false},  //que navegador usó chrome, firefox,etc
    fecha:{type:DataTypes.DATE,allowNull:false,defaultValue:DataTypes.NOW},  //cuando se realizó  
    statusCode:{type:DataTypes.INTEGER,allowNull:false},  // si terminó en 404=error 
    resultado:{type:DataTypes.TEXT,allowNull:false}  //que devolvió el servidor
},{
    tableName:'audit_logs',
    timestamps:false
})
module.exports=AuditLog