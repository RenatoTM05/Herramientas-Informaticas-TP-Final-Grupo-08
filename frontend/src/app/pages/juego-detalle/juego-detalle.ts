import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // <-- Importamos ChangeDetectorRef
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
  cargando: boolean = true;
  error: boolean = false;
  trailerUrl: SafeResourceUrl | null = null;

  constructor(
    private route: ActivatedRoute,
    private juegosService: JuegosService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef // <-- Lo inyectamos en el constructor
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.cargarDetalle(id);
      }
    });
  }

  cargarDetalle(id: string) {
    this.cargando = true;
    this.error = false;
    window.scrollTo(0, 0);

    this.juegosService.getDetalleJuego(id).subscribe({
      next: (res: any) => {
        if (res.status === '1') {
          this.juego = res.data;
          if (this.juego.trailer_id) {
            const url = `https://www.youtube.com/embed/${this.juego.trailer_id}`;
            this.trailerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
          } else {
            this.trailerUrl = null;
          }
        } else {
          this.error = true;
        }
        this.cargando = false;
        this.cdr.detectChanges(); // <-- FORZAMOS A ANGULAR A MOSTRAR EL JUEGO
      },
      error: (err: any) => {
        console.error('Error al cargar el detalle:', err);
        this.error = true;
        this.cargando = false;
        this.cdr.detectChanges(); // <-- FORZAMOS A ANGULAR A MOSTRAR EL ERROR
      }
    });
  }
}