import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
// importamos componente de uriel
import { Navbar } from './layout/navbar/navbar';

@Component({
  selector: 'app-root',
  standalone: true,
  // Le avisamos a Angular que acá vamos a usar el router y el navbar
  imports: [RouterOutlet, Navbar], 
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  title = 'proyfrontendgrupo10';
}