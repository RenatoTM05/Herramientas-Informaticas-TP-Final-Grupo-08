import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // URL de tu backend local de Node.js que probamos con Postman
  private API_URL = 'http://localhost:3000/api/login';

  constructor(private http: HttpClient) {}

  // Método reactivo que envía las credenciales reales
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.API_URL}/loginUser`, credentials);
  }
  registro(userData: any): Observable<any> {
    return this.http.post(`${this.API_URL}/`, userData); 
  }
}