import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { JuegosService } from '../../services/juegos.service'; // Importamos el servicio de juegos
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true, 
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit { 
  esModoOscuro: boolean = true;

  // --- NUEVAS VARIABLES PARA EL BUSCADOR DEL NAVBAR ---
  sugerenciasBusqueda: any[] = [];
  mostrarSugerencias: boolean = false;
  private buscadorSubject = new Subject<string>();

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

  constructor(public router: Router,
              private juegosService: JuegosService,
              private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {  
    document.documentElement.setAttribute('data-bs-theme', 'dark');
    
    // <-- CORREGIDO: Todo esto ahora está ADENTRO del ngOnInit
    // NUEVO: Configuramos el freno de 200ms para el buscador del navbar
    this.buscadorSubject.pipe(
      debounceTime(200),
      distinctUntilChanged()
    ).subscribe(termino => {
      this.ejecutarBusquedaReal(termino);
    });
  }

  // --- NUEVAS FUNCIONES PARA LA BÚSQUEDA DEL NAVBAR ---
  buscarSugerencias(termino: string) {
    if (!termino.trim()) {
      this.sugerenciasBusqueda = [];
      this.mostrarSugerencias = false;
      this.cdr.detectChanges();
    } else {
      this.buscadorSubject.next(termino);
    }
  }

  ejecutarBusquedaReal(termino: string) {
    this.juegosService.obtenerSugerencias(termino).subscribe({
      next: (datosQueLlegan: any) => {
        this.sugerenciasBusqueda = datosQueLlegan.data || datosQueLlegan || [];
        this.sugerenciasBusqueda = this.sugerenciasBusqueda.slice(0, 5); // Máximo 5 resultados
        this.mostrarSugerencias = true;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error al buscar en navbar:', error);
      }
    });
  }

  seleccionarSugerencia(juego: any) {
    this.mostrarSugerencias = false;
    this.sugerenciasBusqueda = [];

    // Como el router navega a la misma pantalla de detalle, Angular actualiza el ID automáticamente.
    this.router.navigate(['/JuegoDetalle', juego.id]);
    this.cdr.detectChanges();
  }

  obtenerIconosPlataformas(plataformas: any[]): string[] {
    if (!plataformas || plataformas.length === 0) return [];
    const iconos = new Set<string>();
    plataformas.forEach((plat: any) => {
      const p = plat.toLowerCase();
      if (p.includes('pc') || (p.includes('windows') && !p.includes('phone'))) iconos.add('bi-windows');
      if (p.includes('playstation')) iconos.add('bi-playstation');
      if (p.includes('xbox')) iconos.add('bi-xbox');
      if (p.includes('android')) iconos.add('bi-android2');
      if (p.includes('ios') || p.includes('mac')) iconos.add('bi-apple');
    });
    return Array.from(iconos);
  }
  
  ModoOscuro() {
    this.esModoOscuro = !this.esModoOscuro;
    const tema = this.esModoOscuro ? 'dark' : 'light';
    document.documentElement.setAttribute('data-bs-theme', tema);
  }

  estaLogueado(): boolean {
    return !!localStorage.getItem('token');
  }

  cerrarSesion() {
    localStorage.removeItem('token');
    this.router.navigate(['/home']);
  }

  obtenerNombreUsuario(): string {
    return this.usuarioActual.nombre;
  }
  // Funcion para el nuevo componente de resultados, que se llama desde el buscador del navbar
  irAResultados(termino: string) {
    if (termino.trim()) {
      this.mostrarSugerencias = false; // Cierra el flotante
      this.router.navigate(['/Resultados', termino.trim()]); // Redirige a la nueva página
    }
  }
}