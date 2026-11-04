import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PagoService {
  // La URL base de tu backend de Node.js
  private URL_API = 'http://localhost:3000/api/pagos';

  constructor(private http: HttpClient) { }

  // Método para pedirle al backend la URL de Mercado Pago
  crearPreferencia(juegoId: string, titulo: string, precio: number): Observable<any> {
    const body = { juegoId, titulo, precio };
    return this.http.post(`${this.URL_API}/crear-preferencia`, body);
  }
  // Método nuevo para avisarle al backend que guarde la compra exitosa en Postgres
  confirmarCompraEnBaseDeDatos(juegoId: string, tituloJuego: string, precioPagado: number, paymentId: string, token: string): Observable<any> {
    const body = { juegoId, tituloJuego, precioPagado, paymentIdMercadoPago: paymentId };

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post(`${this.URL_API}/confirmar-compra`, body, { headers });
  }
}