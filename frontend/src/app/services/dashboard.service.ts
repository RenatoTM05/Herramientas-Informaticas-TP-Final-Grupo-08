import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private url_dashboard = 'http://localhost:3000/api/dashboard';
  
  constructor(private apiDashboard: HttpClient) {}

  // Para obtener token
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Para crear headers con el token
  private getHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

   getMetricas(): Observable<any> {
    return this.apiDashboard.get(`${this.url_dashboard}/metricas`, { headers: this.getHeaders() });
  }

  getLoginsPorDia(): Observable<any> {
    return this.apiDashboard.get(`${this.url_dashboard}/logins-por-dia`, { headers: this.getHeaders() });
  }

  getAccionesPorTipo(): Observable<any> {
    return this.apiDashboard.get(`${this.url_dashboard}/acciones-por-tipo`, { headers: this.getHeaders() });
  }

  getUsuariosActivos(): Observable<any> {
    return this.apiDashboard.get(`${this.url_dashboard}/usuarios-activos`, { headers: this.getHeaders() });
  }

  getAuditoria(pagina: number, limite: number, busqueda: string): Observable<any> {
    return this.apiDashboard.get(
      `${this.url_dashboard}/auditoria?pagina=${pagina}&limite=${limite}&busqueda=${busqueda}`,
      { headers: this.getHeaders() }
    );
  }

  getJuegosBuscados(): Observable<any> {
    return this.apiDashboard.get(`${this.url_dashboard}/juegos-buscados`, { headers: this.getHeaders() });
  }
}