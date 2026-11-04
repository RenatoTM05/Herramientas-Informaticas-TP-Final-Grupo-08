import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { JuegosService } from '../../services/juegos.service';

@Component({
  selector: 'app-resultados',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './resultados.html',
  styleUrls: ['./resultados.css']
})
export class ResultadosComponent implements OnInit {
  terminoBusqueda: string = '';
  resultados: any[] = [];
  cargando: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private juegosService: JuegosService,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit(): void {
    // Esto se queda "escuchando" la URL. Si buscás algo nuevo desde el Navbar
    // estando ya en esta pantalla, se actualiza sola sin recargar la página.
    this.route.paramMap.subscribe(params => {
      this.terminoBusqueda = params.get('termino') || '';
      if (this.terminoBusqueda) {
        this.ejecutarBusqueda();
      }
    });
  }

  ejecutarBusqueda() {
    this.cargando = true;
    this.cdr.detectChanges(); // Forzamos la actualización de la vista antes de hacer la llamada HTTP

    this.juegosService.obtenerSugerencias(this.terminoBusqueda).subscribe({
      next: (datos: any) => {
        let lista = datos.data || datos || [];
        // Ordenamos de más nuevo a más viejo
        this.resultados = lista.sort((a: any, b: any) => {
          // Convertimos los strings de fecha a milisegundos para poder compararlos matemáticamente
          const fechaA = a.fecha_lanzamiento ? new Date(a.fecha_lanzamiento).getTime() : 0;
          const fechaB = b.fecha_lanzamiento ? new Date(b.fecha_lanzamiento).getTime() : 0;
          
          return fechaB - fechaA; 
        });
        
        this.cargando = false;
        this.cdr.detectChanges(); // Forzamos la actualización de la vista para ocultar el spinner
      },
      error: (err: any) => {
        console.error('Error en la búsqueda:', err);
        this.cargando = false;
      }
    });
  }

  verDetalle(id: number) {
    this.router.navigate(['/JuegoDetalle', id]);
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
}