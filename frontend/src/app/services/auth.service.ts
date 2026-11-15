import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Endpoint de autenticación relativo para soportar local y reverse proxy
  private API_URL = '/api/login';

  constructor(private http: HttpClient) {}

  // Método reactivo que envía las credenciales reales
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.API_URL}/loginUser`, credentials);
  }
  registro(userData: any): Observable<any> {
    return this.http.post(`${this.API_URL}/`, userData); 
  }
}