
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

  // Búsqueda con filtros, ordenamiento y paginación
  buscarJuegos(filtros: {
    termino?: string;
    desarrolladora?: string;
    calificacionMin?: number | null;
    calificacionMax?: number | null;
    pagina?: number;
    limite?: number;
    orden?: string;
    direccion?: string;
  }): Observable<any> {

    let params = new HttpParams();

    if (filtros.termino) {
      params = params.set('termino', filtros.termino);
    }

    if (filtros.desarrolladora) {
      params = params.set('desarrolladora', filtros.desarrolladora);
    }

    if (filtros.calificacionMin != null) {
      params = params.set('calificacionMin', filtros.calificacionMin);
    }

    if (filtros.calificacionMax != null) {
      params = params.set('calificacionMax', filtros.calificacionMax);
    }

    params = params
      .set('pagina', filtros.pagina ?? 1)
      .set('limite', filtros.limite ?? 20)
      .set('orden', filtros.orden ?? 'titulo')
      .set('direccion', filtros.direccion ?? 'ASC');

    return this.http.get(`${this.baseUrl}/buscar`, { params });
  }

  // Sugerencias para el buscador del Home y Navbar
  obtenerSugerencias(nombre: string): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/sugerencias/${encodeURIComponent(nombre)}`
    );
  }

  // Detalle de un juego
  obtenerDetalle(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/detalle/${id}`);
  }

  getDetalleJuego(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/detalle/${id}`);
  }
}
