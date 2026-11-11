
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
}
