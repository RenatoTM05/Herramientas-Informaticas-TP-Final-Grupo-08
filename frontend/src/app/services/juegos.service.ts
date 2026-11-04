import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class JuegosService {
  private baseUrl = 'http://localhost:3000/juego'; 

  constructor(private http: HttpClient) { }

  obtenerTodosLosJuegos(): Observable<any> {
    return this.http.get(`${this.baseUrl}/`);
  }

  obtenerMasJugados(): Observable<any> {
    return this.http.get(`${this.baseUrl}/mas-jugados`);
  }

  // --- NUEVAS RUTAS  ---

  // 1. Para el buscador gigante del Home
  obtenerSugerencias(nombre: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/sugerencias/${nombre}`);
  }

  // 2. Para cuando hagan clic en una tarjeta y quieran ver la info completa
  obtenerDetalle(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/detalle/${id}`);
  }

  // Método para obtener el detalle de un juego por su ID
  getDetalleJuego(id: string) {
    // Le quitamos el '/api' a la URL para que coincida con el index.js del backend
    return this.http.get(`http://localhost:3000/juego/detalle/${id}`);
  }
}