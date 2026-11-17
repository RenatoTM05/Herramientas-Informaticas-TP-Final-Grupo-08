import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true, 
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  menuAbierto = false;

  // En lugar de ser un true fijo, ahora responde dinámicamente a si hay token o no
  get usuarioAutenticado(): boolean {
    return this.estaLogueado();
  }

  // Función mágica para obtener todos los datos del usuario logueado en tiempo real
  get usuarioActual() {
    const token = localStorage.getItem('token');
    if (!token) return { nombre: 'Jugador', fotoPerfil: 'assets/default-avatar.png', rol: 'usuario' };

    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      );
      const payload = JSON.parse(jsonPayload);
      
      // Mapeamos los datos reales que inyecta tu backend en el token
      return {
        nombre: payload.username || payload.nombre || 'Jugador',
        fotoPerfil: payload.foto || 'https://api.dicebear.com/7.x/bottts/svg?seed=default',
        rol: payload.perfil || payload.rol || 'usuario' // Evaluamos tu columna 'perfil' de Sequelize
      };
    } catch (error) {
      return { nombre: 'Jugador', fotoPerfil: 'https://api.dicebear.com/7.x/bottts/svg?seed=default', rol: 'usuario' };
    }
  }

  constructor(private router: Router) {}

  estaLogueado(): boolean {
    return !!localStorage.getItem('token');
  }

  cerrarSesion() {
    this.menuAbierto = false;
    localStorage.removeItem('token');
    this.router.navigate(['/']);
  }

  obtenerNombreUsuario(): string {
    return this.usuarioActual.nombre;
  }
}
