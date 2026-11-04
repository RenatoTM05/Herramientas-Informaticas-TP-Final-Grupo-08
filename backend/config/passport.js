//el PASSPORT permite que mi app se comunique con google,facebook..
const passport=require('passport') 
const GoogleStrategy= require('passport-google-oauth20').Strategy //strategy es el q le enseña a Passport como conectarse a un sitio web especifico
//passport-google.. es el complemento para Google, redirige al user a google, verficia su contra y devuelve a su sitio con la info de su perfil
const Login =require('../src/models/login.model')
const Usuario=require('../src/models/usuario.model')

//le digo a Passport que agregue una nueva estrategia, y crea una nueva instancia de la estrategia de Google
passport.use(new GoogleStrategy({ //le paso un primer objeto con las credenciales de mi app 
    //todo esto lo obtiene de Google Cloud Console
    clientID:process.env.GOOGLE_CLIENT_ID, //numero de indetnificacion de google (público)
    clientSecret:process.env.GOOGLE_CLIENT_SECRET, //la contraseña secreta de Google (PRIVADO)
callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback'
}, async (accesToken,refreshToken,profile,done) =>{ //le paso una segunda funcion (callback) q se ejecuta automaticamente cuando el user ponga su clave en Google correctamente y vuelva a mi web
    try{ //esto se ejecuta cuando Google responde
        //accesstoken->un "pase" para pedir info de google (Expira)
        //refreshToken->un "pase" para obtener un nuevo accessToken cuando expire
        //profile los datos del usuario
        //done la funcion para devolver el control a Passport
        let user= await Login.findOne({ //busco un usuario q ya tenga ese mismo id de google
            where:{googleId:profile.id}
        })
        if(!user){ //si no encuentro al usuario significa que es su primera vez y lo creo en la BD
            user= await Login.create({
                username:profile.emails[0].value, //guardo su email en el username, EL PRIMERO Q GOOGL NOS DÉ
                password:'oauth_user_' + Math.random().toString(36), //le creo una contraseña aleatoria pq no usa password local

                nombre:profile.name.givenName || 'Usuario',
                apellido:profile.name.familyName || 'Google',
                googleId:profile.id, //guardamos el id de Google para futuros logins
                perfil:'usuario', //rol por defecto
                foto:profile.photos[0].value || null //URL de la foto de perfil de google
            })
            
            await Usuario.create({
                loginId:user.id
            })
            console.log(`usuario y login creados con google: ${user.username}`)
        }
        done(null,user) //llamamos a la funcion done de Passport
        //null= no hubo error user= el usuario q encontramos o creamos
    }
    catch(error){
        done(error,null) //si hubo error
        //error= el que ocurrio null=no hay usuario
    }
}))
//Serialización (guardar usuario en sesión)
passport.serializeUser((user,done)=>{ 
    done(null,user.id)//cuando el usuario inicia sesión guardamos SOLO su ID en la sesión
})

//Desearilación (recuperar usuario de sesión)
passport.deserializeUser(async(id,done)=>{  
    try{
        const user= await Login.findByPk(id) //cuando el user hace otra peticion se usa el Id pa recuperar sus datos
        done(null,user)//convierte el Id guardado en el objeto completo del usuario
    }
    catch(error){
        done(error,null)
    }
})

module.exports=passport