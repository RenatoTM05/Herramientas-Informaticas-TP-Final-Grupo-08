import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { DashboardService } from '../../services/dashboard.service';
import { JuegosService } from '../../services/juegos.service';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  estadisticas: any = {
    totalUsuarios: 0,
    usuariosNuevos: 0,
    loginsHoy: 0,
    totalAcciones: 0
  };

  // Arrays para los gráficos
  loginsPorDia: any[] = [];
  accionesPorTipo: any[] = [];
  usuariosActivos: any[] = [];
  juegosBuscados: any[] = [];

  registrosAuditoria: any[] = [];
  totalRegistros = 0;
  paginaActual = 1;
  registrosPorPagina = 10;
  terminoBusqueda: string = '';
  totalPaginas = 1;

  configGraficoLinea: any = { labels: [], datasets: [] };
  opcionesDeLinea = { responsive: true };

  configGraficoTorta: any = { labels: [], datasets: [] };
  opcionesTorta = { responsive: true };

  configGraficoBarras: any = { labels: [], datasets: [] };
  opcionesBarras = { responsive: true };

  configGraficoJuegos: any = { labels: [], datasets: [] };
  opcionesJuegos = {
    responsive: true,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { precision: 0 }
      }
    }
  };

  // Modal para Crear Juego
  mostrarModalCrearJuego = false;
  guardandoJuego = false;
  nuevoJuego = {
    titulo: '',
    descripcion: '',
    desarrolladora: '',
    fecha_lanzamiento: '',
    calificacion: 85,
    imagen_portada: '',
    plataformas: 'PC, PlayStation 5, Xbox Series X',
    generos: 'Acción, Aventura',
    trailer_id: ''
  };

  constructor(
    private serviciosDashboard: DashboardService,
    private juegosService: JuegosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarTodo()
  }

  cargarTodo():void{
    this.obtenerEstadisticas()
    this.obtenerIngresosPorDia()
    this.obtenerAccionesPorTipo()
    this.obtenerUsuariosActivos()
    this.obtenerAuditoria()
    this.obtenerJuegosBuscados()
  }
   
  //obtengo las estadisticas principales
  obtenerEstadisticas():void{
    this.serviciosDashboard.getMetricas().subscribe({
     next:(respuesta)=>{
        if(respuesta.status==='1'){
          this.estadisticas=respuesta.data
          this.cdr.detectChanges();
        }
     },
     error:(error)=>console.error('Error al cargar estadisticas',error)
    })
  }

  //obtengo ingresos por dia (grafico de línea)
 
  obtenerIngresosPorDia(): void {
    this.serviciosDashboard.getLoginsPorDia().subscribe({
      next: (respuesta) => {
        if (respuesta.status === '1') {
          this.loginsPorDia = respuesta.data
          this.actualizarGraficoLinea()
          this.cdr.detectChanges();
        }
      },
      error: (error) => console.error('Error al cargar ingresos:', error)
    })
  }

  //obtengo las actividades por tipo (busqueda,eliminar usuario,etc) (Grafico de torta)

  obtenerAccionesPorTipo(): void {
    this.serviciosDashboard.getAccionesPorTipo().subscribe({
      next: (respuesta) => {
        if (respuesta.status === '1') {
          this.accionesPorTipo = respuesta.data
          this.actualizarGraficoTorta()
          this.cdr.detectChanges();
        }
      },
      error: (error) => console.error('Error al cargar actividades:', error)
    })
  }

  //obtener usuariosActivos ( grafico de barras)
    obtenerUsuariosActivos(): void {
    this.serviciosDashboard.getUsuariosActivos().subscribe({
      next: (respuesta) => {
        if (respuesta.status === '1') {
          this.usuariosActivos = respuesta.data
          this.actualizarGraficoBarras()
          this.cdr.detectChanges();
        }
      },
      error: (error) => console.error('Error al cargar usuarios top:', error)
    })
  }

//obtener la auditoria de acciones (DataTable)
obtenerAuditoria():void{
  this.serviciosDashboard.getAuditoria(
    this.paginaActual,
    this.registrosPorPagina,
    this.terminoBusqueda
  ).subscribe({
    next:(respuesta)=>{
      if(respuesta.status === '1'){
        this.registrosAuditoria = respuesta.data || [];
        this.totalRegistros = respuesta.total || 0;
        this.totalPaginas = respuesta.totalPaginas || respuesta.totalPages || 1;
        this.cdr.detectChanges();
      }
    },
    error:(error)=>console.error('Error al cargar auditoria',error)
  })
}



//obtengo los juegos mas buscados
obtenerJuegosBuscados(): void {
    this.serviciosDashboard.getJuegosBuscados().subscribe({
      next: (respuesta) => {
        if (respuesta.status === '1') {
          this.juegosBuscados = respuesta.data || [];
          this.actualizarGraficoJuegos();
          this.cdr.detectChanges();
        }
      },
      error: (error) => console.error('Error al cargar juegos top:', error)
    })
  }

//esta seccion es para actualizar los graficos

//actualizar grafico de linea
actualizarGraficoLinea():void{
  const dias=this.loginsPorDia.map(d=>d.dia)
  const exitosos=this.loginsPorDia.map(d=>d.exitosos)
  const fallidos=this.loginsPorDia.map(d=>d.fallidos)
    this.configGraficoLinea={
      labels:dias,
      datasets:[
        {
          label:'ingresos exitosos',
          data:exitosos,
           borderColor: '#0dcaf0', 
          backgroundColor: 'rgba(13, 202, 240, 0.1)',
          fill: true,
          tension: 0.4
        },
        {  label: 'Ingresos fallidos', 
          data: fallidos, 
          borderColor: '#dc3545', 
          backgroundColor: 'rgba(220, 53, 69, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    }
  }


  //actualizar el grafico de torta

  actualizarGraficoTorta():void{
    const etiquetas=this.accionesPorTipo.map(a=>this.traducirAccion(a.accion))
    const valores=this.accionesPorTipo.map(a=>a.cantidad)
    const colores=['#0dcaf0', '#ffc107', '#dc3545', '#198754', '#6f42c1', '#fd7e14', '#20c997']

    this.configGraficoTorta={
      labels:etiquetas,
      datasets:[{
        data:valores,
        backgroundColor: colores.slice(0, etiquetas.length),
        borderColor: '#1a1a1a',
        borderWidth: 2
      }]
    }
  }
  //esto es para traducir lo que el usuario quiera hacer para la BD y se vea mejor
  traducirAccion(accion: string):string{
    const tradduciones:{[key:string]:string} ={
      'VER_USUARIOS':'ver usuarios',
      'ELIMINAR_USUARIO': 'eliminar usuario',
      'MODIFICAR_USUARIO': 'Modificar usuario',
      'LOGIN': 'Iniciar sesión',
      'REGISTRO': 'Registrarse',
      'BUSCAR_JUEGO': 'Buscar juego',
      'COMPRAR_JUEGO': 'Comprar juego',
      'ELIMINAR_JUEGO': '🗑️ Eliminar juego'
    }
    return tradduciones[accion] || accion
  }


  //actualizar el grafico de barra
  actualizarGraficoBarras():void{
    const usuarios=this.usuariosActivos.map(u=>u.usuario)
    const cantidades=this.usuariosActivos.map(u=>u.total)
  
  this.configGraficoBarras={
    labels:usuarios,
    datasets: [{ 
        label: '📊 Actividades realizadas', 
        data: cantidades, 
        backgroundColor: '#0dcaf0',
        borderRadius: 8
      }]
  }
  }

  //paginaciones para el DataTables
  irAPagina(pagina:number):void{
    this.paginaActual=pagina
    this.obtenerAuditoria()
  }
  paginaAnterior():void{
    if(this.paginaActual>1){
      this.paginaActual--
      this.obtenerAuditoria()
    }
  }

  paginaSiguiente():void{
    if(this.paginaActual<this.totalPaginas){
      this.paginaActual++
      this.obtenerAuditoria()
    }
  }

  //esto es para el buscador del DataTable
  buscarRegistros():void{
    this.paginaActual=1
    this.obtenerAuditoria()
  }

  //funcion para exportar a Excel
  exportarExcel(): void {
    const datos = this.registrosAuditoria.map(r => ({
      'Usuario': r.usuario,
      'Accion': this.traducirAccion(r.accion),
      'Metodo': r.metodo,
      'Ruta': r.ruta,
      'Fecha': new Date(r.fecha).toLocaleString(),
      'Estado': r.statusCode
    }));

    const libro = XLSX.utils.book_new()
    const hoja = XLSX.utils.json_to_sheet(datos)
    XLSX.utils.book_append_sheet(libro, hoja, 'Auditoria')
    XLSX.writeFile(libro, `auditoria_${new Date().toISOString().split('T')[0]}.xlsx`)
 }

// ✅ VERSIÓN CORREGIDA (sin emojis)
exportarPDF(): void {
       const doc = new jsPDF as any
      const fecha = new Date().toLocaleDateString()

      doc.setFontSize(18)
      doc.text('Reporte de Auditoria', 14, 20)
      doc.setFontSize(12)
      doc.text(`Fecha: ${fecha}`, 14, 30)

      const columnas = ['Usuario', 'Accion', 'Metodo', 'Ruta', 'Fecha']
      const filas = this.registrosAuditoria.map(r => [
        r.usuario,
        this.traducirAccion(r.accion),
        r.metodo,
        r.ruta,
        new Date(r.fecha).toLocaleString()
      ])

      doc.autoTable({
        head: [columnas],
        body: filas,
        startY: 40,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [13, 202, 240] }
      });

      doc.save(`auditoria_${new Date().toISOString().split('T')[0]}.pdf`)
    }

  actualizarGraficoJuegos(): void {
    const etiquetas = this.juegosBuscados.map(j => j.resultado || 'Sin término');
    const cantidades = this.juegosBuscados.map(j => Number(j.cantidad) || 0);
    const colores = ['#dc3545', '#0dcaf0', '#ffc107', '#198754', '#6f42c1', '#fd7e14', '#20c997', '#d63384'];

    this.configGraficoJuegos = {
      labels: etiquetas,
      datasets: [{
        label: '🎮 Búsquedas / Consultas',
        data: cantidades,
        backgroundColor: colores.slice(0, etiquetas.length),
        borderRadius: 8
      }]
    };
  }

  abrirModalCrearJuego(): void {
    this.nuevoJuego = {
      titulo: '',
      descripcion: '',
      desarrolladora: '',
      fecha_lanzamiento: new Date().toISOString().split('T')[0],
      calificacion: 85,
      imagen_portada: '',
      plataformas: 'PC, PlayStation 5, Xbox Series X',
      generos: 'Acción, Aventura',
      trailer_id: ''
    };
    this.mostrarModalCrearJuego = true;
  }

  cerrarModalCrearJuego(): void {
    this.mostrarModalCrearJuego = false;
  }

  guardarJuego(): void {
    if (!this.nuevoJuego.titulo.trim()) {
      Swal.fire({
        title: 'Campo Requerido',
        text: 'Por favor, ingresá el título del juego.',
        icon: 'warning',
        background: '#1a1a1a',
        color: '#fff',
        confirmButtonColor: '#ffc107'
      });
      return;
    }

    this.guardandoJuego = true;
    this.juegosService.crearJuego(this.nuevoJuego).subscribe({
      next: (res: any) => {
        this.guardandoJuego = false;
        this.cerrarModalCrearJuego();
        Swal.fire({
          title: '¡Juego Creado!',
          text: `"${this.nuevoJuego.titulo}" se agregó correctamente al catálogo.`,
          icon: 'success',
          background: '#1a1a1a',
          color: '#fff',
          confirmButtonColor: '#0dcaf0'
        });
        this.obtenerEstadisticas();
        this.obtenerAuditoria();
      },
      error: (err: any) => {
        this.guardandoJuego = false;
        console.error('Error al crear juego:', err);
        Swal.fire({
          title: 'Error al Guardar',
          text: err.error?.msg || 'Ocurrió un error al intentar crear el juego.',
          icon: 'error',
          background: '#1a1a1a',
          color: '#fff',
          confirmButtonColor: '#fe4c55'
        });
      }
    });
  }

  cambiarRegistrosPorPagina(cantidad: number): void {
    this.registrosPorPagina = cantidad;
    this.paginaActual = 1;
    this.obtenerAuditoria();
  }

}
