import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JuegosService } from '../../services/juegos.service'; 
import { PagoService } from '../../services/pago'; // 1. PASO 1: IMPORTAMOS EL NUEVO SERVICIO
import { Subject } from 'rxjs'; 
import { Router } from '@angular/router'; // Importamos Router para poder redirigir a la página de detalle
//import { JuegosService } from '../../services/juegos.service'; // Ajustado al nombre correcto del servicio
//import { Subject } from 'rxjs'; // Importamos Subject para el buscador
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import Swal from 'sweetalert2';
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
  esPremiumSticky: boolean = false;
  private buscadorSubject = new Subject<string>();

  // 2. PASO 2: INYECTAMOS EL PagoService EN EL CONSTRUCTOR (Separado por coma)
  constructor(
    private juegosService: JuegosService, 
    private pagoService: PagoService, 
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
      next: (datosQueLlegan: any) => {
        let historialJuegos = datosQueLlegan.data || datosQueLlegan || [];
        this.juegosDestacados = historialJuegos.reverse().slice(0, 5);
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
    console.log('ID que viaja al detalle:', id); // Log para ver el ID
    this.router.navigate(['/JuegoDetalle', id]);
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

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const pixelesRecorridos = window.scrollY || document.documentElement.scrollTop;
    this.esPremiumSticky = pixelesRecorridos > 1000;
    this.cdr.detectChanges();
  }

  juegosPremium: any[] = [
    { juegoId: 'p1', titulo: 'GTA VI (Alpha Build)', precio: 2500, imagen_portada: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=400' },
    { juegoId: 'p2', titulo: 'Hades II (Early Access)', precio: 1800, imagen_portada: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=400' },
    { juegoId: 'p3', titulo: 'Silksong (Beta Test)', precio: 1500, imagen_portada: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=400' },
    { juegoId: 'p4', titulo: 'Witcher 4 (Tech Demo)', precio: 3000, imagen_portada: 'https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?q=80&w=400' },
    { juegoId: 'p5', titulo: 'Cyberpunk 2 (Concept Dev)', precio: 2200, imagen_portada: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=400' }
  ];

  // 3. PASO 3: CONECTAMOS LA LÓGICA DE MERCADO PAGO REAL
  comprarAcceso(juego: any) {
    const token = localStorage.getItem('token'); 

    if (!token) {
      Swal.fire({
        title: '¡Acceso Restringido!',
        text: 'Para adquirir pases de pre-lanzamiento e ingresar al simulador debés iniciar sesión.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#0dcaf0',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ir al Login',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          // Acá podés poner la redirección si tenés el router activo
          this.router.navigate(['./Login']);
        }
      });
      return;
    }

    console.log("Generando preferencia para:", juego.titulo);
    
    // Mostramos la alerta de carga
    Swal.fire({
      title: 'Procesando con Mercado Pago...',
      text: `Preparando tu orden para ${juego.titulo}`,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });


    // Llamamos al servicio para pedirle la preferencia al backend
    this.pagoService.crearPreferencia(juego.juegoId, juego.titulo, juego.precio).subscribe({
      next: (res:any) => {
        Swal.close(); // Cerramos el loading
        if (res.status === "1" && res.init_point) {
          // ¡REDIRECCIÓN! Viajamos a la pasarela de Mercado Pago de verdad
          window.location.href = res.init_point;
        } else {
          Swal.fire('Error', 'No se pudo generar el enlace de pago.', 'error');
        }
      },
      error: (err:any) => {
        Swal.close();
        console.error('Error al conectar con el backend:', err);
        Swal.fire('Error', 'Hubo un problema al procesar el pago. Comprobá que el backend esté encendido.', 'error');
      }
    });
  }
}
