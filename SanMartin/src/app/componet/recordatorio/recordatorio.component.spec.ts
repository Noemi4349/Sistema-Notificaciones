import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { RecordatorioComponent } from './recordatorio.component';
import { RecordatorioService, Socio } from 'src/app/service/recordatorio.service';
import { MessageService } from 'primeng/api';

// 🚩 Datos simulados: declarar UNA sola vez y con tipo
const mockSocios: Socio[] = [
  {
    id: 1,
    nombreCompleto: 'Juan Pérez',
    telefono: '70000001',
    email: 'juan.perez@example.com',
    montoPendiente: 150,
    fechaVencimiento: '2025-10-30',
    numeroSocio: 'SOC-001',
    activo: true
  },
  {
    id: 2,
    nombreCompleto: 'Ana López',
    telefono: '70000002',
    email: 'ana.lopez@example.com',
    montoPendiente: 200,
    fechaVencimiento: '2025-10-31',
    numeroSocio: 'SOC-002',
    activo: true
  }
];

describe('RecordatorioComponent', () => {
  let component: RecordatorioComponent;
  let fixture: ComponentFixture<RecordatorioComponent>;
  let mockService: jasmine.SpyObj<RecordatorioService>;

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('RecordatorioService', [
      'getSociosPendientes',
      'enviarRecordatorio',
      'ejecutarAutomatico'
    ]);

    await TestBed.configureTestingModule({
      imports: [RecordatorioComponent],
      providers: [
        MessageService,
        { provide: RecordatorioService, useValue: mockService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RecordatorioComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load socios pendientes on init', () => {
    mockService.getClientesPendientes.and.returnValue(of(mockSocios));

    component.ngOnInit();

    expect(mockService.getClientesPendientes).toHaveBeenCalled();
    expect(component.socios.length).toBe(2);
    expect(component.socios[0].nombreCompleto).toBe('Juan Pérez');
  });

  it('should calculate dias restantes correctly', () => {
    const hoy = new Date();
    const fechaFutura = new Date(hoy);
    fechaFutura.setDate(hoy.getDate() + 5);

    const dias = component.getDiasRestantes(fechaFutura.toISOString().split('T')[0]);
    expect(dias).toBe(5);
  });

  it('should return negative dias for past dates', () => {
    const hoy = new Date();
    const fechaPasada = new Date(hoy);
    fechaPasada.setDate(hoy.getDate() - 3);

    const dias = component.getDiasRestantes(fechaPasada.toISOString().split('T')[0]);
    expect(dias).toBe(-3);
  });

  it('should generate correct texto for dias restantes', () => {
    const hoy = new Date();
    const fechaHoy = hoy.toISOString().split('T')[0];
    const fechaFutura = new Date(hoy);
    fechaFutura.setDate(hoy.getDate() + 2);

    expect(component.getDiasRestantesTexto(fechaFutura.toISOString().split('T')[0])).toContain('Vence en 2 días');
    expect(component.getDiasRestantesTexto(fechaHoy)).toBe('¡Vence HOY!');
  });
});
