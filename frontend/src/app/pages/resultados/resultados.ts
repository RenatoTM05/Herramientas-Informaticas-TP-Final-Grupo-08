
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { JuegosService } from '../../services/juegos.service';

@Component({
  selector: 'app-resultados',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './resultados.html',
  styleUrls: ['./resultados.css']
})
export class ResultadosComponent implements OnInit {

  terminoBusqueda: string = '';
  resultados: any[] = [];
  cargando: boolean = true;

  // Filtros
  desarrolladora: string = '';
  calificacionMin: number | null = null;
  calificacionMax: number | null = null;

  // Ordenamiento
  orden: string = 'titulo';
  direccion: string = 'ASC';

  // Paginación
  pagina: number = 1;
  limite: number = 20;
  total: number = 0;
  totalPaginas: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private juegosService: JuegosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.terminoBusqueda = params.get('termino') || '';
      this.pagina = 1;
      this.ejecutarBusqueda();
    });
  }

  ejecutarBusqueda(): void {
    this.cargando = true;
    this.cdr.detectChanges();

    this.juegosService.buscarJuegos({
      termino: this.terminoBusqueda,
      desarrolladora: this.desarrolladora,
      calificacionMin: this.calificacionMin,
      calificacionMax: this.calificacionMax,
      pagina: this.pagina,
      limite: this.limite,
      orden: this.orden,
      direccion: this.direccion
    }).subscribe({
      next: (respuesta: any) => {
        this.resultados = respuesta.data || [];

        this.total = respuesta.paginacion.total;
        this.pagina = respuesta.paginacion.pagina;
        this.limite = respuesta.paginacion.limite;
        this.totalPaginas = respuesta.paginacion.totalPaginas;

        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error en la búsqueda:', err);
        this.resultados = [];
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  aplicarFiltros(): void {
    this.pagina = 1;
    this.ejecutarBusqueda();
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina < 1 || nuevaPagina > this.totalPaginas) {
      return;
    }

    this.pagina = nuevaPagina;
    this.ejecutarBusqueda();
  }

  cambiarLimite(): void {
    this.pagina = 1;
    this.ejecutarBusqueda();
  }

  verDetalle(id: number) {
    this.router.navigate(['/juego', id]);
  }

  obtenerIconosPlataformas(plataformas: any[]): string[] {
    if (!plataformas || plataformas.length === 0) return [];

    const iconos = new Set<string>();

    plataformas.forEach((plat: any) => {
      const p = plat.toLowerCase();

      if (p.includes('pc') || (p.includes('windows') && !p.includes('phone'))) {
        iconos.add('bi-windows');
      }

      if (p.includes('playstation')) iconos.add('bi-playstation');
      if (p.includes('xbox')) iconos.add('bi-xbox');
      if (p.includes('android')) iconos.add('bi-android2');

      if (p.includes('ios') || p.includes('mac')) {
        iconos.add('bi-apple');
      }
    });

    return Array.from(iconos);
  }
}
