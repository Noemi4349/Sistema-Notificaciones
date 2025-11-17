import { Injectable } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import { Cliente, RecordatorioResponse } from './recordatorio.service';

/**
 * Mock service para pruebas y desarrollo sin backend
 */
@Injectable({
  providedIn: 'root'
})
export class RecordatorioServiceMock {
  
  private mockClientes: Cliente[] = [
    {
      id: 1,
      nombreCompleto: 'María García López',
      telefono: '59170123456',
      email: 'maria.garcia@email.com',
      montoPendiente: 250.50,
      fechaVencimiento: this.getFechaFutura(3),
      numeroSocio: 'SOC-001',
      activo: true
    },
    {
      id: 2,
      nombreCompleto: 'Juan Pérez Rodríguez',
      telefono: '59171234567',
      email: 'juan.perez@email.com',
      montoPendiente: 180.00,
      fechaVencimiento: this.getFechaFutura(1),
      numeroSocio: 'SOC-002',
      activo: true
    },
    {
      id: 3,
      nombreCompleto: 'Ana Martínez Flores',
      telefono: '59172345678',
      email: 'ana.martinez@email.com',
      montoPendiente: 320.75,
      fechaVencimiento: this.getFechaFutura(7),
      numeroSocio: 'SOC-003',
      activo: true
    },
    {
      id: 4,
      nombreCompleto: 'Carlos Sánchez Torres',
      telefono: '59173456789',
      email: 'carlos.sanchez@email.com',
      montoPendiente: 150.00,
      fechaVencimiento: this.getFechaFutura(-2), // Vencido
      numeroSocio: 'SOC-004',
      activo: true
    },
    {
      id: 5,
      nombreCompleto: 'Laura Fernández Ruiz',
      telefono: '59174567890',
      email: 'laura.fernandez@email.com',
      montoPendiente: 420.25,
      fechaVencimiento: this.getFechaFutura(0), // Vence hoy
      numeroSocio: 'SOC-005',
      activo: true
    }
  ];

  private reporteEnvios: any[] = [
    {
      id: 'REC-001',
      nombre: 'Pedro González',
      telefono: '59175678901',
      fecha: new Date('2025-10-25T10:30:00'),
      estado: 'ENVIADO',
      tipoMensaje: 'Texto',
      montoPendiente: 200.00
    },
    {
      id: 'REC-002',
      nombre: 'Sofía Ramírez',
      telefono: '59176789012',
      fecha: new Date('2025-10-26T14:15:00'),
      estado: 'ENVIADO',
      tipoMensaje: 'Texto',
      montoPendiente: 150.50
    },
    {
      id: 'REC-003',
      nombre: 'Diego Morales',
      telefono: '59177890123',
      fecha: new Date('2025-10-27T09:00:00'),
      estado: 'ERROR',
      tipoMensaje: 'Texto',
      montoPendiente: 300.00
    }
  ];

  /**
   * Simula obtener clientes con cuotas pendientes
   */
  getClientesPendientes(): Observable<Cliente[]> {
    console.log('🔍 Mock: Obteniendo clientes pendientes...');
    // Simula delay de red
    return of(this.mockClientes).pipe(delay(500));
  }

  /**
   * Simula enviar recordatorio a un cliente
   */
  enviarRecordatorio(clienteId: number, mensaje: string): Observable<RecordatorioResponse> {
    console.log(`📤 Mock: Enviando recordatorio a cliente ${clienteId}`);
    console.log(`💬 Mensaje: ${mensaje}`);
    
    // Simula 90% de éxito
    const exito = Math.random() > 0.1;
    
    return of({
      success: exito,
      message: exito ? 'Recordatorio enviado correctamente' : 'Error al enviar recordatorio',
      data: {
        clienteId,
        fechaEnvio: new Date().toISOString(),
        estado: exito ? 'ENVIADO' : 'ERROR'
      }
    }).pipe(delay(800));
  }

  /**
   * Simula envío automático masivo
   */
  ejecutarAutomatico(): Observable<RecordatorioResponse> {
    console.log('🤖 Mock: Ejecutando envío automático...');
    
    const cantidadEnviados = this.mockClientes.length;
    
    return of({
      success: true,
      message: `${cantidadEnviados} recordatorios enviados automáticamente`,
      data: {
        total: cantidadEnviados,
        enviados: cantidadEnviados,
        errores: 0,
        fechaEjecucion: new Date().toISOString()
      }
    }).pipe(delay(1500));
  }

  /**
   * Simula obtener reporte de envíos
   */
  getReporteEnvios(fechaInicio?: string, fechaFin?: string): Observable<any[]> {
    console.log('📊 Mock: Obteniendo reporte de envíos...');
    return of(this.reporteEnvios).pipe(delay(600));
  }

  /**
   * Simula obtener historial de un cliente
   */
  getHistorialCliente(clienteId: number): Observable<any[]> {
    console.log(`📜 Mock: Obteniendo historial del cliente ${clienteId}...`);
    
    const historial = [
      {
        id: 'HIST-001',
        fecha: new Date('2025-09-15T10:00:00'),
        tipo: 'RECORDATORIO',
        estado: 'ENVIADO',
        mensaje: 'Recordatorio de cuota mensual'
      },
      {
        id: 'HIST-002',
        fecha: new Date('2025-08-15T10:00:00'),
        tipo: 'RECORDATORIO',
        estado: 'ENVIADO',
        mensaje: 'Recordatorio de cuota mensual'
      }
    ];
    
    return of(historial).pipe(delay(500));
  }

  /**
   * Simula obtener estadísticas
   */
  getEstadisticas(): Observable<any> {
    console.log('📈 Mock: Obteniendo estadísticas...');
    
    return of({
      totalClientes: this.mockClientes.length,
      totalPendiente: this.mockClientes.reduce((sum, c) => sum + c.montoPendiente, 0),
      enviadosHoy: 12,
      enviadosMes: 245,
      tasaExito: 94.5,
      proximosVencimientos: this.mockClientes.filter(c => {
        const dias = this.getDiasRestantes(c.fechaVencimiento);
        return dias >= 0 && dias <= 7;
      }).length
    }).pipe(delay(700));
  }

  /**
   * Genera una fecha futura o pasada basada en días
   */
  private getFechaFutura(dias: number): string {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + dias);
    return fecha.toISOString().split('T')[0];
  }

  /**
   * Calcula días restantes
   */
  private getDiasRestantes(fechaVencimiento: string): number {
    const hoy = new Date();
    const vencimiento = new Date(fechaVencimiento);
    const diferencia = vencimiento.getTime() - hoy.getTime();
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  }

  /**
   * Simula error para testing
   */
  simularError(): Observable<never> {
    return throwError(() => new Error('Error simulado para testing'));
  }
}

/**
 * Provider para usar en módulos de testing
 */
export const RECORDATORIO_SERVICE_MOCK_PROVIDER = {
  provide: 'RecordatorioService',
  useClass: RecordatorioServiceMock
};