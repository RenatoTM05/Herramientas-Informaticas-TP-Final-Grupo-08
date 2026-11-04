import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; // Importamos el enrutador para redirigir
import { AuthService } from '../../services/auth.service'; // Importamos tu nuevo servicio
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;

  // Inyectamos el servicio de autenticación y el router de Angular
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initForm();
  }

  loguearConGoogle():void{
    window.location.href ='http://localhost:3000/api/auth/google'
  }

  initForm(): void {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(4)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onLogin(): void {
    if (this.loginForm.valid) {
      const credenciales = this.loginForm.value;

      // 🚀 Llamamos al servicio HTTP asíncrono
      this.authService.login(credenciales).subscribe({
        next: (response) => {
          console.log('¡Respuesta del servidor exitosa!', response);
          if (response.status === '1') {
            // Guardamos el token JWT en el almacenamiento del navegador
            localStorage.setItem('token', response.token);

            Swal.fire({
              title: '¡Bienvenido de nuevo!',
              text: 'Inicio de sesión exitoso. Preparando tu catálogo...',
              icon: 'success',
              background: '#1a1a1a', // Fondo oscuro gamer
              color: '#fff',
              confirmButtonColor: '#0dcaf0', // Botón cian
              timer: 2500,
              timerProgressBar: true
            }).then(() => {
              this.router.navigate(['/home']);
            });
          }
        },
        error: (err) => {
          console.error('Error al conectar:', err);
          
          // 🚀 ADVERTENCIA 1: Cambiamos el alert() feo por un SweetAlert impecable
          Swal.fire({
            title: 'Error de Autenticación',
            text: err.error?.msg || 'Usuario o contraseña incorrectos. Intentá de nuevo.',
            icon: 'error',
            background: '#1a1a1a',
            color: '#fff',
            confirmButtonColor: '#fe4c55' // Rojo/Naranja para errores
          });
        }
      });

    } else {
      this.loginForm.markAllAsTouched();

      // 🚀 ADVERTENCIA 2: Si intenta enviar el formulario vacío o incompleto
      Swal.fire({
        title: 'Campos Incompletos',
        text: 'Por favor, completá correctamente el usuario y la contraseña antes de ingresar.',
        icon: 'warning',
        background: '#1a1a1a',
        color: '#fff',
        confirmButtonColor: '#ffc107' // Amarillo de advertencia
      });
    }
  }
  
}