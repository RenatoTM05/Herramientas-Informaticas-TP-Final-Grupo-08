const {DataTypes}= require ('sequelize')
const ConexionABd=require ('../../config/database')
const Login=require('./login.model')
const Usuarios=ConexionABd.define('Usuario',{
      id: {  //neceista llevar al menos un campo para que sequlize lo cree
        type:DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    }
    

})

Usuarios.belongsTo(Login,{
    foreignKey:{
    name:'loginId',
    allowNull: false},
    as: 'login'
})

Login.hasOne(Usuarios,{
    foreignKey:'loginId',
    as:'usuario'
})

module.exports=Usuarios