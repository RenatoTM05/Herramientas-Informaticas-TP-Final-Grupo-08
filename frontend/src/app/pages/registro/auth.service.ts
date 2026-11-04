import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // URL base modificada
  private API_URL = 'http://localhost:3000/api/login';

  constructor(private http: HttpClient) {}

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.API_URL}/loginUser`, credentials);
  }

  // Apunta directamente al guardado en tu base de datos PostgreSQL
  registro(userData: any): Observable<any> {
    return this.http.post(`${this.API_URL}/`, userData); 
  }
}