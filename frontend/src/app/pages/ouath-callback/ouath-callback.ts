//este componente sirve para que cuando al iniciar sesion con google y me redirija a mi backend
//voy a tener el token directamente dado en la URL por medio de este component
import { ActivatedRoute,Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Component,OnInit} from '@angular/core';
@Component({
  selector: 'app-ouath-callback',
  imports: [CommonModule],
  templateUrl: './ouath-callback.html',
 })
export class OuathCallback implements OnInit{
  constructor(private route:ActivatedRoute,private router:Router){}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params =>{
      const token = params['token'];
      if(token){
        localStorage.setItem('token',token);
    //esto redirige al home v
        this.router.navigate(['/home']);
      }else{
        //si no hay token, hubo error, redirigir al login
        this.router.navigate(['/login'])
      }
    })
  }
}
