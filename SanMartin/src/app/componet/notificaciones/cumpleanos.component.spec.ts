import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { of, throwError } from 'rxjs';

import { CumpleanosComponent } from './cumpleanos.component';
import { CumpleanosService, Socio } from 'src/app/service/cumpleanos.service';

describe('CumpleanosComponent', () => {
  let component: CumpleanosComponent;
  let fixture: ComponentFixture<CumpleanosComponent>;
  let cumpleanosService: jasmine.SpyObj<CumpleanosService>;

  const mockSocio: Socio = {
    id: 1,
    nombreCompleto: 'Juan Pérez',
    fechaNacimiento: '1990-05-15',
    telefono: '59170000000',
    email: 'juan@email.com',
    activo: true,
    numeroSocio: 'SOC001'
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('CumpleanosService', [
      'getCumpleanosHoy',
      'enviarMensajeManual',
      'subirMedia',
      'ejecutarAutomatico'
    ]);

    spy.getCumpleanosHoy.and.returnValue(of([mockSocio]));

    cumpleanosService = spy;

    await TestBed.configureTestingModule({
      imports: [
        CumpleanosComponent,
        HttpClientTestingModule,
        ReactiveFormsModule,
        FormsModule
      ],
      providers: [
        MessageService,
        { provide: CumpleanosService, useValue: spy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CumpleanosComponent);
    component = fixture.componentInstance;
    cumpleanosService = TestBed.inject(CumpleanosService) as jasmine.SpyObj<CumpleanosService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load socios on init', () => {
    const mockSocios: Socio[] = [mockSocio];
    cumpleanosService.getCumpleanosHoy.and.returnValue(of(mockSocios));

    component.ngOnInit();

    expect(cumpleanosService.getCumpleanosHoy).toHaveBeenCalled();
    expect(component.socios).toEqual(mockSocios);
    expect(component.loading).toBeFalse();
  });

  it('should handle error when loading socios', () => {
    cumpleanosService.getCumpleanosHoy.and.returnValue(throwError(() => new Error('Error')));

    component.ngOnInit();

    expect(cumpleanosService.getCumpleanosHoy).toHaveBeenCalled();
    expect(component.loading).toBeFalse();
  });

  it('should open enviar dialog', () => {
    component.abrirEnviarDialog(mockSocio);

    expect(component.selectedSocio).toEqual(mockSocio);
    expect(component.displayEnviarDialog).toBeTrue();
  });

  it('should open subir dialog', () => {
    component.abrirSubirDialog();

    expect(component.displaySubirDialog).toBeTrue();
  });

  it('should send message', () => {
    component.selectedSocio = mockSocio;
    cumpleanosService.enviarMensajeManual.and.returnValue(of({}));

    component.enviarMensaje();

    expect(cumpleanosService.enviarMensajeManual).toHaveBeenCalled();
  });

  it('should not send message without selected socio', () => {
    component.selectedSocio = null;

    component.enviarMensaje();

    expect(cumpleanosService.enviarMensajeManual).not.toHaveBeenCalled();
  });

  it('should execute automatic process', () => {
    cumpleanosService.ejecutarAutomatico.and.returnValue(of({}));
    spyOn(component, 'cargarCumpleanosHoy');

    component.ejecutarAutomatico();

    expect(cumpleanosService.ejecutarAutomatico).toHaveBeenCalled();
    expect(component.cargarCumpleanosHoy).toHaveBeenCalled();
  });
});