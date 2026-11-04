import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
//Importá tu servicio de pagos (ajustá la ruta según tus carpetas)
import { PagoService } from '../../services/pago';

@Component({
  selector: 'app-pago-exitoso',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pago-exitoso.html',
  styleUrls: ['./pago-exitoso.css']
})
export class PagoExitosoComponent implements OnInit {

  paymentId: string | null = null;
  status: string | null = null;
  preferenceId: string | null = null;

  // Inyectamos el PagoService en el constructor
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pagoService: PagoService
  ) { }

  ngOnInit(): void {
    // Adentro de tu subscribe en pago-exitoso.ts:
    this.route.queryParams.subscribe(params => {
      this.paymentId = params['payment_id'];
      this.status = params['status'];

      if (this.status === 'approved' && this.paymentId) {

        // 🕵️‍♂️ Rescatamos el token y el juego pendiente
        const token = localStorage.getItem('token');
        const juegoPendiente = sessionStorage.getItem('juego_pendiente');

        // 🔬 CONSOLE.LOGS DE CONTROL: Te van a cantar la verdad en el navegador (F12)
        console.log("🔍 CONTROL FRONTEND - Token recuperado:", token ? "SÍ (Existe)" : "NO (Es null o vacío)");
        console.log("🔍 CONTROL FRONTEND - Payment ID de la URL:", this.paymentId);

        if (!token) {
          console.error("❌ ERROR: No hay sesión activa. Iniciá sesión de nuevo.");
          return;
        }

        // Datos por defecto si entraste pegando la URL manual
        let juego = { juegoId: '999', titulo: 'Juego de Prueba Web', precio: 2500 };

        if (juegoPendiente) {
          juego = JSON.parse(juegoPendiente);
        }

        console.log("🚀 LIDERANDO PETICIÓN HTTP AL BACKEND CON LOS DATOS:", {
          id: juego.juegoId,
          titulo: juego.titulo,
          precio: juego.precio,
          payment: this.paymentId
        });

        // ⚠️ MUCHA ATENCIÓN AL ORDEN ACÁ:
        this.pagoService.confirmarCompraEnBaseDeDatos(
          String(juego.juegoId),
          juego.titulo,
          Number(juego.precio),
          this.paymentId,
          token // 🔑 El token va al final como 5to parámetro
        ).subscribe({
          next: (res) => {
            console.log('✅ ¡Respuesta del servidor con éxito!', res);
            sessionStorage.removeItem('juego_pendiente');
          },
          error: (err) => {
            console.error('❌ Error en la respuesta del backend:', err);
          }
        });
      }
    });
  }

  volverAlHome() {
    this.router.navigate(['/home']);
  }
}