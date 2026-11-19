
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { JuegosService } from '../../services/juegos.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-juego-detalle',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
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

  // Nueva reseña
  textoNuevaResena: string = '';
  enviandoResena: boolean = false;

  get usuarioLogueado(): any {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  get miUsuarioId(): number | null {
    return this.usuarioLogueado?.id ? Number(this.usuarioLogueado.id) : null;
  }

  get yaHizoResena(): boolean {
    if (!this.miUsuarioId) return false;
    return this.resenas.some(r => Number(r.loginId) === this.miUsuarioId);
  }

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
      this.limiteResenas,
      this.miUsuarioId || undefined
    ).subscribe({
      next: (res: any) => {
        const lista = res.data || [];
        if (this.miUsuarioId) {
          lista.sort((a: any, b: any) => {
            const aEsMio = Number(a.loginId) === this.miUsuarioId;
            const bEsMio = Number(b.loginId) === this.miUsuarioId;
            if (aEsMio && !bEsMio) return -1;
            if (!aEsMio && bEsMio) return 1;
            return 0;
          });
        }
        this.resenas = lista;
        this.paginaResenas = res.pagina || pagina;
        this.totalResenas = res.total || lista.length;
        this.totalPaginasResenas = res.totalPaginas || 1;

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

  enviarResena(): void {
    if (!this.usuarioLogueado) {
      Swal.fire({
        title: 'Inicio de Sesión Requerido',
        text: 'Debés iniciar sesión para poder publicar una reseña.',
        icon: 'info',
        background: '#1a1a1a',
        color: '#fff',
        confirmButtonColor: '#0dcaf0'
      });
      return;
    }

    const textoLimpio = this.textoNuevaResena.trim();
    if (!textoLimpio) {
      Swal.fire({
        title: 'Reseña vacía',
        text: 'Por favor, escribí un comentario para tu reseña.',
        icon: 'warning',
        background: '#1a1a1a',
        color: '#fff',
        confirmButtonColor: '#ffc107'
      });
      return;
    }

    if (!this.juego || !this.juego.id) return;

    this.enviandoResena = true;
    this.juegosService.crearResena({
      juegoId: Number(this.juego.id),
      texto: textoLimpio,
      loginId: this.miUsuarioId || undefined
    }).subscribe({
      next: (res: any) => {
        this.enviandoResena = false;
        this.textoNuevaResena = '';
        Swal.fire({
          title: '¡Reseña Publicada!',
          text: 'Tu reseña fue agregada exitosamente y ahora aparece primera.',
          icon: 'success',
          background: '#1a1a1a',
          color: '#fff',
          confirmButtonColor: '#0dcaf0'
        });
        this.cargarResenas(Number(this.juego.id), 1);
      },
      error: (err: any) => {
        this.enviandoResena = false;
        console.error('Error al publicar reseña:', err);
        Swal.fire({
          title: 'Error al Publicar',
          text: err.error?.msg || err.error?.motivo || 'No se pudo publicar la reseña.',
          icon: 'error',
          background: '#1a1a1a',
          color: '#fff',
          confirmButtonColor: '#fe4c55'
        });
      }
    });
  }

}
