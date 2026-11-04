import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JuegoDetalle } from './juego-detalle';

describe('JuegoDetalle', () => {
  let component: JuegoDetalle;
  let fixture: ComponentFixture<JuegoDetalle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JuegoDetalle],
    }).compileComponents();

    fixture = TestBed.createComponent(JuegoDetalle);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
