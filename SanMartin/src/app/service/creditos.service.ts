// src/app/service/creditos.service.ts - ACTUALIZADO CON REPORTES

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface Socio {
  id?: number;
  estado: boolean;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  email: string;
  fechaVencimientoPago: string;
  numeroSocio: string;
  telefono: string;
}

export interface RegistroEnvio {
  id?: number;
  socioId?: number;
  nombreSocio?: string;
  fechaEnvio: string;
  numeroDestino: string;
  mensaje: string;
  estado: 'EXITOSO' | 'FALLIDO' | 'PENDIENTE';
  mensajeError?: string;
  idExterno?: string;
}

export interface EstadisticasEnvio {
  totalEnvios: number;
  enviosExitosos: number;
  enviosFallidos: number;
  tasaExito: number;
}

export interface EstadisticasDia {
  fecha: string;
  total: number;
  exitosos: number;
  fallidos: number;
  pendientes: number;
}

export interface SchedulerStatus {
  schedulerActivo: boolean;
  proximaEjecucion: string;
  sociosConVencimientoManana: number;
  whatsappServiceUrl: string;
  qrUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class CreditosService {
  private apiUrl = 'http://localhost:8082/api';

  constructor(private http: HttpClient) {
    console.log('🔧 CreditosService inicializado. API URL:', this.apiUrl);
  }

  // ========== CRUD de Socios ==========
  
  registrarSocio(socio: Socio): Observable<Socio> {
    console.log('📤 POST /socios - Datos a enviar:', socio);
    
    const socioLimpio = {
      numeroSocio: socio.numeroSocio?.trim(),
      nombre: socio.nombre?.trim(),
      apellidoPaterno: socio.apellidoPaterno?.trim(),
      apellidoMaterno: socio.apellidoMaterno?.trim() || null,
      email: socio.email?.trim(),
      telefono: socio.telefono?.trim(),
      fechaVencimientoPago: socio.fechaVencimientoPago,
      estado: socio.estado ?? true
    };

    return this.http.post<Socio>(`${this.apiUrl}/socios`, socioLimpio, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    }).pipe(
      tap({
        next: (response) => console.log('✅ Socio registrado:', response),
        error: (error) => console.error('❌ Error al registrar socio:', error)
      })
    );
  }

  obtenerTodosSocios(): Observable<Socio[]> {
    console.log('📥 GET /socios');
    return this.http.get<Socio[]>(`${this.apiUrl}/socios`).pipe(
      tap({
        next: (response) => console.log('✅ Socios obtenidos:', response.length, 'registros'),
        error: (error) => console.error('❌ Error al obtener socios:', error)
      })
    );
  }

  obtenerSocioPorId(id: number): Observable<Socio> {
    return this.http.get<Socio>(`${this.apiUrl}/socios/${id}`);
  }

  obtenerSocioPorNumero(numeroSocio: string): Observable<Socio> {
    return this.http.get<Socio>(`${this.apiUrl}/socios/numero/${numeroSocio}`);
  }

  obtenerSociosActivos(): Observable<Socio[]> {
    return this.http.get<Socio[]>(`${this.apiUrl}/socios/activos`);
  }

  obtenerSociosConVencimientoManana(): Observable<Socio[]> {
    return this.http.get<Socio[]>(`${this.apiUrl}/socios/vencimiento-manana`);
  }

  actualizarSocio(id: number, socio: Socio): Observable<Socio> {
    const socioLimpio = {
      numeroSocio: socio.numeroSocio?.trim(),
      nombre: socio.nombre?.trim(),
      apellidoPaterno: socio.apellidoPaterno?.trim(),
      apellidoMaterno: socio.apellidoMaterno?.trim() || null,
      email: socio.email?.trim(),
      telefono: socio.telefono?.trim(),
      fechaVencimientoPago: socio.fechaVencimientoPago,
      estado: socio.estado
    };

    return this.http.put<Socio>(`${this.apiUrl}/socios/${id}`, socioLimpio);
  }

  cambiarEstadoSocio(id: number, estado: boolean): Observable<any> {
    const params = new HttpParams().set('estado', estado.toString());
    return this.http.patch(`${this.apiUrl}/socios/${id}/estado`, null, { params });
  }

  eliminarSocio(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/socios/${id}`);
  }

  // ========== Mensajería WhatsApp ==========

  enviarRecordatorioManual(socioId: number): Observable<RegistroEnvio> {
    return this.http.post<RegistroEnvio>(`${this.apiUrl}/socios/${socioId}/enviar-recordatorio`, {});
  }

  ejecutarEnvioProgramadoManual(): Observable<any> {
    return this.http.post(`${this.apiUrl}/socios/ejecutar-envio-programado`, {});
  }

  obtenerHistorialEnvios(socioId: number): Observable<RegistroEnvio[]> {
    return this.http.get<RegistroEnvio[]>(`${this.apiUrl}/socios/${socioId}/historial-envios`);
  }

  obtenerEstadisticasEnvios(): Observable<EstadisticasEnvio> {
    return this.http.get<EstadisticasEnvio>(`${this.apiUrl}/socios/estadisticas-envios`);
  }

  // ========== Scheduler ==========

  ejecutarEnvioManualScheduler(): Observable<any> {
    return this.http.post(`${this.apiUrl}/scheduler/ejecutar-manual`, {});
  }

  obtenerProximosEnvios(): Observable<any> {
    return this.http.get(`${this.apiUrl}/scheduler/proximos-envios`);
  }

  enviarMensajePrueba(numero: string, mensaje?: string): Observable<any> {
    let params = new HttpParams().set('numero', numero);
    if (mensaje) {
      params = params.set('mensaje', mensaje);
    }
    return this.http.post(`${this.apiUrl}/scheduler/test-mensaje`, null, { params });
  }

  obtenerStatusScheduler(): Observable<SchedulerStatus> {
    return this.http.get<SchedulerStatus>(`${this.apiUrl}/scheduler/status`);
  }

  // ========== REPORTES (NUEVOS) ==========

  obtenerEnviosPorFechas(
    fechaInicio: Date, 
    fechaFin: Date, 
    estado?: string
  ): Observable<RegistroEnvio[]> {
    console.log('📊 GET /reportes/envios');
    
    let params = new HttpParams()
      .set('fechaInicio', this.formatearFecha(fechaInicio))
      .set('fechaFin', this.formatearFecha(fechaFin));
    
    if (estado && estado !== 'TODOS') {
      params = params.set('estado', estado);
    }

    return this.http.get<RegistroEnvio[]>(`${this.apiUrl}/reportes/envios`, { params }).pipe(
      tap({
        next: (response) => console.log('✅ Envíos obtenidos:', response.length),
        error: (error) => console.error('❌ Error al obtener envíos:', error)
      })
    );
  }

  obtenerEstadisticasPorDia(
    fechaInicio: Date, 
    fechaFin: Date
  ): Observable<EstadisticasDia[]> {
    console.log('📊 GET /reportes/estadisticas-por-dia');
    
    const params = new HttpParams()
      .set('fechaInicio', this.formatearFecha(fechaInicio))
      .set('fechaFin', this.formatearFecha(fechaFin));

    return this.http.get<EstadisticasDia[]>(`${this.apiUrl}/reportes/estadisticas-por-dia`, { params }).pipe(
      tap({
        next: (response) => console.log('✅ Estadísticas obtenidas:', response.length, 'días'),
        error: (error) => console.error('❌ Error al obtener estadísticas:', error)
      })
    );
  }

  obtenerResumenGeneral(): Observable<any> {
    return this.http.get(`${this.apiUrl}/reportes/resumen`);
  }

  // ========== Helpers ==========

  private formatearFecha(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}