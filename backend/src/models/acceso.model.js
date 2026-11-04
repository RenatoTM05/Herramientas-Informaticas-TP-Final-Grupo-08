const {DataTypes}=require('sequelize')
const conexionABd=require('../../config/database')

const Acceso=conexionABd.define('Acceso',{
    usuarioId:{type:DataTypes.INTEGER,allowNull:true},
    username:{type:DataTypes.STRING,allowNull:false},
    fecha:{type:DataTypes.DATE,allowNull:false,defaultValue:DataTypes.NOW},
    ip:{type:DataTypes.STRING,allowNull:true},
    userAgente:{type:DataTypes.STRING,allowNull:true},
    exito:{type:DataTypes.BOOLEAN,allowNull:false,defaultValue:false},
    error:{type:DataTypes.STRING,allowNull:true}
},{
    tableName:'accesos',
    timestamps:false
})

module.exports= Acceso