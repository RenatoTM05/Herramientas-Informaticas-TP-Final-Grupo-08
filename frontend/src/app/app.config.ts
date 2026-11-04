import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
 
export const authInterceptor=(req:any, next: any)=>{
  //otra vez el req es la peticion HTTP entrante
  //next: funcion que continua con el flujo de la peticion
  const token= localStorage.getItem('token'); //obtengo el token
  if(token){ //si  hay token
    req=req.clone({ //clono
      setHeaders:{// es la forma al ternativa de agregar los headers
        Authorization:`Bearer ${token}`
      }
    });
  }
  return next(req)//continuo la peticion modificada o no
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(//configura el cliente HTTP
      withInterceptors([authInterceptor]) //Registra el interceptor
    )
  ]
};