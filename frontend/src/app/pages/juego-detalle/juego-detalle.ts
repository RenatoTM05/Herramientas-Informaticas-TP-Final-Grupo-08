
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { JuegosService } from '../../services/juegos.service';

@Component({
  selector: 'app-juego-detalle',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './juego-detalle.html',
  styleUrls: ['./juego-detalle.css']
})
export class JuegoDetalle implements OnInit {
  juego: any = null;
  cargando = true;
  error = false;
  trailerUrl: SafeResourceUrl | null = null;

    // Reseñas
  resenas: any[] = [];
  paginaResenas = 1;
  limiteResenas = 10;
  totalResenas = 0;
  totalPaginasResenas = 0;
  cargandoResenas = false;
  errorResenas = false;

  constructor(
    private route: ActivatedRoute,
    private juegosService: JuegosService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');

      if (id) {
        this.cargarDetalle(id);
      }
    });
  }

  cargarDetalle(id: string): void {
    this.cargando = true;
    this.error = false;
    this.juego = null;
    this.trailerUrl = null;

    window.scrollTo(0, 0);

    this.juegosService.getDetalleJuego(id).subscribe({
      next: (res: any) => {
        if (res.status === '1' && res.data) {
          this.juego = res.data;
          this.cargarResenas(Number(id));

          if (this.juego.trailer_id) {
            const url = `https://www.youtube.com/embed/${this.juego.trailer_id}`;
            this.trailerUrl =
              this.sanitizer.bypassSecurityTrustResourceUrl(url);
          }
        } else {
          this.error = true;
        }

        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al cargar el detalle:', err);
        this.error = true;
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

    cargarResenas(juegoId: number, pagina: number = 1): void {
    this.cargandoResenas = true;
    this.errorResenas = false;

    this.juegosService.obtenerResenas(
      juegoId,
      pagina,
      this.limiteResenas
    ).subscribe({
      next: (res: any) => {
        this.resenas = res.data || [];
        this.paginaResenas = res.pagina;
        this.totalResenas = res.total;
        this.totalPaginasResenas = res.totalPaginas;

        this.cargandoResenas = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al cargar reseñas:', err);
        this.errorResenas = true;
        this.cargandoResenas = false;
        this.cdr.detectChanges();
      }
    });
  }

}
