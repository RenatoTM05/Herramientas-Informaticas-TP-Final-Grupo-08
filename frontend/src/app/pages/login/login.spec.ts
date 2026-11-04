import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { LoginComponent } from './login'; // Cambiado a LoginComponent

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // Importamos el componente y también el módulo de formularios para que el test no falle
      imports: [LoginComponent, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Ejecuta la detección de cambios inicial de Angular
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});