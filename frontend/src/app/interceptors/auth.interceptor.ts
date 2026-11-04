import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthInterceptor implements HttpInterceptor{
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
  //req es la peticion HTTP original
  //next es el siguiente manejador en la cadenade interceptores
  //retorna un Observable con el evento HTTP
    const token=localStorage.getItem('token'); //obtengo el token del localStorage
    if(token){ //si existe el token
      const cloned = req.clone({ //clono la peticion original pq no se puede modificar directamente
        headers: req.headers.set('Authorization',`Bearer $(token)`) //le agrego el header Authorization
      });
      return next.handle(cloned); //continuo con la peticion ya modificada
    }
    return  next.handle(req) //si no habia token continuo con la peticion original
  }
}
