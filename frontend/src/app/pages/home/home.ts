import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JuegosService } from '../../services/juegos.service'; 
import { Subject } from 'rxjs'; 
import { Router } from '@angular/router'; // Importamos Router para poder redirigir a la página de detalle
//import { JuegosService } from '../../services/juegos.service'; // Ajustado al nombre correcto del servicio
//import { Subject } from 'rxjs'; // Importamos Subject para el buscador
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
//import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {

  juegosDestacados: any[] = [];
  catalogoGeneral: any[] = [];

  // --- VARIABLES PARA EL BUSCADOR DESPLEGABLE ---
  sugerenciasBusqueda: any[] = [];
  mostrarSugerencias: boolean = false;
  private buscadorSubject = new Subject<string>();

  constructor(
    private juegosService: JuegosService, 
    private cdr: ChangeDetectorRef,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarCatalogoGeneral();
    this.cargarJuegosDestacados();

    this.buscadorSubject.pipe(
      debounceTime(200),
      distinctUntilChanged()
    ).subscribe(termino => {
      // Cuando pasen los 200ms, recién se ejecuta la búsqueda real
      this.ejecutarBusquedaReal(termino);
    });
  }

  cargarCatalogoGeneral() {
    this.juegosService.obtenerMasJugados().subscribe({
      next: (datosQueLlegan: any) => {
        this.catalogoGeneral = datosQueLlegan.data || datosQueLlegan || [];
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error al cargar el catálogo:', error);
      }
    });
  }

  cargarJuegosDestacados() {
    this.juegosService.obtenerTodosLosJuegos().subscribe({
      next: (datos: any) => {
        const juegos = datos.data || datos || [];
        this.juegosDestacados = juegos.slice(0, 5);
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error al cargar destacados:', error);
      }
    });
  }

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
        this.sugerenciasBusqueda = this.sugerenciasBusqueda.slice(0, 5);
        this.mostrarSugerencias = true;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error al buscar sugerencias:', error);
      }
    });
  }

  // --- FUNCIÓN PARA CUANDO HACEN CLIC EN UNA SUGERENCIA DEL DESPLEGABLE ---
seleccionarSugerencia(juego: any) {
    console.log('Sugerencia clickeada:', juego); // Log para ver qué juego se selecciona
    // Cerramos el menú
    this.mostrarSugerencias = false;
    this.sugerenciasBusqueda = [];
    
    // Pasamos a la pag de detalle con el ID
    // Asegurar si el backend devuelve el ID
    this.router.navigate(['/juego', juego.id]); 
  }

  // --- NUEVA FUNCIÓN PARA LAS TARJETAS DEL CATÁLOGO ---
  verDetalle(id: number) {
    this.router.navigate(['/juego', id]);
  }

// --- NUEVA FUNCIÓN PARA LAS TARJETAS DEL CATÁLOGO ---

obtenerIconosPlataformas(plataformas: any[]): string[] {
    // Si viene vacío o nulo (juegos como Subway Surfers Blast), devolvemos un array vacío
    if (!plataformas || plataformas.length === 0) return [];
    
    // Usamos un Set para que no se repitan íconos (ej: si tiene PS4 y PS5, que salga un solo logo)
    const iconos = new Set<string>();

      plataformas.forEach((plat: any) => {
      const p = plat.toLowerCase();
      
      // Filtramos las 5 categorías principales
      if (p.includes('pc') || (p.includes('windows') && !p.includes('phone'))) iconos.add('bi-windows');
      if (p.includes('playstation')) iconos.add('bi-playstation');
      if (p.includes('xbox')) iconos.add('bi-xbox');
      if (p.includes('android')) iconos.add('bi-android2');
      if (p.includes('ios') || p.includes('mac')) iconos.add('bi-apple');
    });

    return Array.from(iconos);
  }
    // Funcion para el nuevo componente de resultados, que se llama desde el buscador del navbar

  irAResultados(termino: string) {
    if (termino.trim()) {
      this.mostrarSugerencias = false;
      this.router.navigate(['/Resultados', termino.trim()]);
    }
  }
}
