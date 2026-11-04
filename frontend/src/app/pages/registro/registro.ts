import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-registro',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './registro.html',
    styleUrls: ['./registro.css']
})
export class RegistroComponent implements OnInit {
    registroForm!: FormGroup;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.initForm();
    }

    initForm(): void {
        this.registroForm = this.fb.group({
            nombre: ['', Validators.required],
            apellido: ['', Validators.required],
            username: ['', [Validators.required, Validators.minLength(4)]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            perfil: ['Usuario Normal', Validators.required], // Por defecto toma "Usuario Normal" como en Postman
            email: ['', [Validators.required, Validators.email]], // 🚀 Nuevo
            foto: [this.avatarSeleccionado] // 🚀 Nuevo (opcional, sin Validators.required)
        });
    }

    onRegistro(): void {
        if (this.registroForm.valid) {
            const datosUsuario = this.registroForm.value;

            // Llamamos al método que agregaremos en el servicio de autenticación
            this.authService.registro(datosUsuario).subscribe({
                next: (response: any) => {
                    //console.log('Usuario registrado con éxito:', response);
                    Swal.fire({
                        title: '¡Registro Completado!',
                        text: 'Tu cuenta gamer fue creada con éxito.',
                        icon: 'success',
                        background: '#1a1a1a',
                        color: '#fff',
                        confirmButtonColor: '#0dcaf0'
                    }).then(() => {
                        this.router.navigate(['/Login']);
                    }); // Redirige al Login para que use su cuenta nueva
                },
                error: (err: any) => {
                    Swal.fire({
                        title: 'Error al registrar',
                        text: err.error?.msg || 'El usuario ya se encuentra registrado.',
                        icon: 'error',
                        background: '#1a1a1a',
                        color: '#fff',
                        confirmButtonColor: '#dc3545' // Botón rojo Bootstrap
                    });
                }
            });
        } else {
            this.registroForm.markAllAsTouched();
        }
    }
    // 1. Definimos la propiedad para guardar el avatar elegido (dejamos el primero por defecto)
    avatarSeleccionado: string = 'https://api.dicebear.com/7.x/bottts/svg?seed=Shadow';

    // 2. Armamos la galería de opciones fijas con diferentes semillas (seeds) divertidas
    listaAvatares: string[] = [
        'https://api.dicebear.com/7.x/bottts/svg?seed=Shadow',
        'https://api.dicebear.com/7.x/bottts/svg?seed=Neon',
        'https://api.dicebear.com/7.x/bottts/svg?seed=Pixel',
        'https://api.dicebear.com/7.x/bottts/svg?seed=Ghost',
        'https://api.dicebear.com/7.x/bottts/svg?seed=Viper'
    ];

    // 3. Función para cambiar la selección activa cuando el usuario hace clic
    seleccionarAvatar(url: string) {
        this.avatarSeleccionado = url;
        this.registroForm.patchValue({
            foto:url
        });
    }
}