import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistorialEnviosComponent } from './historial-envios.component';

describe('HistorialEnviosComponent', () => {
  let component: HistorialEnviosComponent;
  let fixture: ComponentFixture<HistorialEnviosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistorialEnviosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistorialEnviosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
