import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Socio {
  id: number;
  numeroCredito?: string;
  nombreCompleto: string;
  telefono: string;
  email: string;
  montoPendiente: number;
  fechaVencimiento: string;
  numeroSocio: string;
  activo: boolean;
}

export interface RecordatorioResponse {
  success: boolean;
  message: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class RecordatorioService {
  base = '/api/whatsapp';
  private apiUrl = 'http://localhost:8081/api';

  constructor(private http: HttpClient) {}


  sendNow(payload: { socio_id: string, credito_id?: string, telefono: string, mensaje: string }) {
    return this.http.post(`${this.base}/send-now`, payload);
  }
  /**
   * Obtiene la lista de socios DESDE EL BACKEND REAL
   */
  getClientesPendientes(): Observable<Socio[]> {
    console.log('📋 Obteniendo socios REALES desde backend...');
    return this.http.get<Socio[]>(`${this.apiUrl}/recordatorios/socios`);
  }

  /**
   * Envía un recordatorio individual a un cliente específico
   */
  enviarRecordatorio(socioId: number, mensaje: string): Observable<RecordatorioResponse> {
    console.log(`📤 Enviando recordatorio a socio ID: ${socioId}`);
    
    return new Observable(observer => {
      this.getClientesPendientes().subscribe({
        next: (socios) => {
          const socio = socios.find(s => s.id === socioId);
          
          if (!socio) {
            observer.next({ success: false, message: 'Socio no encontrado' });
            observer.complete();
            return;
          }

          console.log(`📞 Enviando WhatsApp a: ${socio.telefono}`);
          console.log(`💬 Mensaje: ${mensaje}`);

          this.http.post<any>(
            `${this.apiUrl}/whatsapp/send-text`,
            { numero: socio.telefono, message: mensaje }
          ).subscribe({
            next: (response) => {
              console.log('✅ Respuesta del servidor:', response);
              observer.next({
                success: response.ok || false,
                message: response.error ?? 'Mensaje enviado'
              });
              observer.complete();
            },
            error: (error) => {
              console.error('❌ Error en petición:', error);
              observer.next({
                success: false,
                message: 'Error de conexión con el servidor'
              });
              observer.complete();
            }
          });
        },
        error: (error) => {
          console.error('❌ Error al obtener socios:', error);
          observer.next({
            success: false,
            message: 'Error al cargar datos de socios'
          });
          observer.complete();
        }
      });
    });
  }

  /**
   * Ejecuta el envío automático masivo de recordatorios
   */
  ejecutarAutomatico(): Observable<RecordatorioResponse> {
    console.log('🤖 Ejecutando envío automático...');
    return this.http.get<any>(`${this.apiUrl}/recordatorios/enviar`);
  }

  /**
   * Obtiene el reporte de recordatorios enviados DESDE EL BACKEND REAL
   */
  getReporteEnvios(fechaInicio?: string, fechaFin?: string): Observable<any[]> {
    console.log('📊 Obteniendo reporte REAL desde backend...');
    
    let url = `${this.apiUrl}/recordatorios/reporte`;
    
    if (fechaInicio && fechaFin) {
      url += `?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
    }

    return this.http.get<any[]>(url);
  }

  /**
   * Obtiene el historial de recordatorios de un cliente específico
   */
  getHistorialSocio(socioId: number): Observable<any[]> {
    console.log(`📜 Obteniendo historial del socio ${socioId}`);
    // Por ahora retornamos vacío hasta que crees el endpoint
    return this.http.get<any[]>(`${this.apiUrl}/recordatorios/historial/${socioId}`);
  }

  /**
   * Obtiene las estadísticas de envíos
   */
  getEstadisticas(): Observable<any> {
    console.log('📈 Obteniendo estadísticas');
    // Por ahora retornamos vacío hasta que crees el endpoint
    return this.http.get<any>(`${this.apiUrl}/recordatorios/estadisticas`);
  }
 //agregar usuario modal
  guardarUsuario(data: any) {
  return this.http.post(`${this.apiUrl}/guardar-usuario`, data);
}


  /**
   * Verificar salud del servicio
   */
  checkHealth(): Observable<any> {
    return this.http.get(`${this.apiUrl}/whatsapp/health`);
  }
}