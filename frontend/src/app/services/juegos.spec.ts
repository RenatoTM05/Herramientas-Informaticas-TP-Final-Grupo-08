import { TestBed } from '@angular/core/testing';

import { JuegosService } from './juegos.service';

describe('JuegosService', () => {
  // Aviso a la variable que va a usar el JuegosService
  let service: JuegosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    // Inyecto la clase 
    service = TestBed.inject(JuegosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});