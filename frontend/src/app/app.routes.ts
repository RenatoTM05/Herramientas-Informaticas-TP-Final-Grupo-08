import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';
import { LoginComponent } from './pages/login/login';
import { JuegoDetalle } from './pages/juego-detalle/juego-detalle';
import { RegistroComponent } from './pages/registro/registro';
import { OuathCallback } from './pages/ouath-callback/ouath-callback';
import { PagoExitosoComponent } from './pages/pago-exitoso/pago-exitoso';
import { ResultadosComponent } from './pages/resultados/resultados';
// Componente de Uriel
import { Dashboard } from './pages/dashboard/dashboard';

export const routes: Routes = [
  { path: '', component: HomeComponent }, 
  { path: 'Login', component: LoginComponent },
  { path: 'oauth-callback', component: OuathCallback },
  { path: 'Registro', component: RegistroComponent },
  { path: 'pago-exitoso', component: PagoExitosoComponent },
  { path: 'Resultados/:termino', component: ResultadosComponent },
  
  // Ponemos las rutas con ID bien arriba para que Angular las lea primero
  // Soporte para ruta de tarjeta del catálogo y para ruta de sugerencia del buscador
  { path: 'JuegoDetalle/:id', component: JuegoDetalle }, 
  { path: 'juego/:id', component: JuegoDetalle },

  // Ruta boton del navbar para ir al dashboard de admin
  { path: 'Admin', component: Dashboard },

  // El comodín comodín va ÚNICAMENTE al final de todo el archivo
  { path: '**', redirectTo: '' } 
];