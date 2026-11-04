const {DataTypes}=require ('sequelize')
const ConexionABd=require('../../config/database')
const Login = ConexionABd.define('Login',{
    username:{type:DataTypes.STRING,allowNull:false},
    password:{type:DataTypes.STRING,allowNull:false},
    nombre:{type:DataTypes.STRING,allowNull:false},
    apellido:{type:DataTypes.STRING,allowNull:false},
    perfil:{type:DataTypes.STRING,allowNull:false},
    //se crean todos estos campos pq cuando se inicializa con google NO TIENEN CONTRA y se usan los datos al usuario de google q ya tenia
    googleId:{type:DataTypes.STRING,allowNull:true,unique:true},
    foto:{type:DataTypes.STRING,allowNull:true},
    email:{type:DataTypes.STRING,allowNull:true}
},{
    tableName:'logins',
    timestamps:true,
})

module.exports=Login