import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

// ============================================
// INTERFACES (DTOs del backend)
// ============================================

export interface Socio {
  id: number;
  nombreCompleto: string;
  telefono: string;
  fechaNacimiento: string;
  email?: string;
  edad?: number;
  mensajeEnviado?: boolean;
}

export interface ConfiguracionMensaje {
  id?: number;
  mensaje: string;
  horaEnvio: string;
  activo: boolean;
}

export interface RegistroEnvio {
  id: number;
  socio: Socio;
  fechaEnvio: string;
  estado: 'ENVIADO' | 'FALLIDO' | 'PENDIENTE';
  mensajeError?: string;
  intentos: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface MediaContenido {
  id: number;
  nombreArchivo: string;
  rutaArchivo: string;
  tipoMime: string;
  tamanio: number;
  tipoMedia?: string;
  urlAcceso?: string;
  fechaSubida?: string;
}

// 👇 NUEVO: Interface para configuración actual completa
export interface ConfiguracionActual {
  mensaje: string;
  horaEnvio: string;
  archivoMultimedia: MediaContenido | null;
  configuracionId: number;
}

// 👇 NUEVO: Interface para historial
export interface HistorialMultimedia {
  total: number;
  data: MediaContenido[];
}

export interface MensajePersonalizado {
  id: number;
  contenido: string;
  fechaCreacion: string;
  activo: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CumpleanosService {
  private apiUrl = 'http://localhost:8081/api/cumpleanos';
  private historialUrl = 'http://localhost:8081/api/historial'; // 👈 NUEVO

  constructor(private http: HttpClient) {
    console.log('🔧 CumpleanosService inicializado');
    console.log('📡 API URL:', this.apiUrl);
    console.log('📁 Historial URL:', this.historialUrl);
  }

  // ============================================
  // 🔑 HEADERS
  // ============================================

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  private getHeadersForFormData(): HttpHeaders {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  }

  // ============================================
  // 🚨 MANEJO DE ERRORES
  // ============================================

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('❌ Error HTTP completo:', error);
    
    let errorMessage = 'Error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error del cliente: ${error.error.message}`;
      console.error('🖥️ Error del cliente:', error.error.message);
    } else {
      errorMessage = `Código ${error.status}: ${error.message}`;
      console.error(`🔴 Backend retornó código ${error.status}`);
      console.error('📄 Body del error:', error.error);
      
      switch (error.status) {
        case 0:
          errorMessage = 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.';
          break;
        case 401:
          errorMessage = 'No autorizado. Por favor inicia sesión.';
          break;
        case 403:
          errorMessage = 'Acceso prohibido.';
          break;
        case 404:
          errorMessage = 'Recurso no encontrado.';
          break;
        case 500:
          errorMessage = 'Error interno del servidor.';
          break;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }

  // ============================================
  // 🎂 CUMPLEAÑEROS
  // ============================================

  getCumpleanosHoy(): Observable<Socio[]> {
    const url = `${this.apiUrl}/hoy`;
    console.log('📡 GET:', url);
    
    return this.http.get<Socio[]>(url, { headers: this.getHeaders() }).pipe(
      tap(data => {
        console.log('✅ Cumpleañeros recibidos:', data.length);
        console.log('📋 Datos:', data);
      }),
      catchError(this.handleError)
    );
  }

  // ============================================
  // ⚙️ CONFIGURACIÓN
  // ============================================

  // 👇 NUEVO: Obtener configuración actual completa (mensaje + archivo)
  obtenerConfiguracionActual(): Observable<ApiResponse<ConfiguracionActual>> {
    const url = `${this.apiUrl}/configuracion-actual`;
    console.log('📡 GET:', url);
    
    return this.http.get<ApiResponse<ConfiguracionActual>>(url, { headers: this.getHeaders() }).pipe(
      tap(response => {
        console.log('✅ Configuración actual recibida:', response);
        if (response.data) {
          console.log('💬 Mensaje:', response.data.mensaje?.substring(0, 50) + '...');
          console.log('⏰ Hora:', response.data.horaEnvio);
          console.log('📎 Archivo:', response.data.archivoMultimedia ? 'SÍ' : 'NO');
        }
      }),
      catchError(this.handleError)
    );
  }

  obtenerConfiguracion(): Observable<ConfiguracionMensaje> {
    const url = `${this.apiUrl}/configuracion`;
    console.log('📡 GET:', url);
    
    return this.http.get<ConfiguracionMensaje>(url, { headers: this.getHeaders() }).pipe(
      tap(data => console.log('✅ Configuración recibida:', data)),
      catchError(this.handleError)
    );
  }

  guardarConfiguracion(config: {
    mensaje: string;
    horaEnvio: string;
  }): Observable<ApiResponse<ConfiguracionMensaje>> {
    const url = `${this.apiUrl}/configuracion`;
    console.log('📡 POST:', url);
    console.log('📝 Config:', config);
    
    return this.http.post<ApiResponse<ConfiguracionMensaje>>(
      url,
      config,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => console.log('✅ Configuración guardada:', response)),
      catchError(this.handleError)
    );
  }

  // 👇 NUEVO: Guardar mensaje personalizado
  guardarMensajePersonalizado(contenido: string): Observable<ApiResponse<any>> {
    const url = `${this.apiUrl}/guardar-mensaje`;
    console.log('📡 POST:', url);
    console.log('💬 Mensaje:', contenido.substring(0, 50) + '...');
    
    return this.http.post<ApiResponse<any>>(
      url,
      { contenido },
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        console.log('✅ Mensaje guardado:', response);
        if (response.success) {
          console.log('🆔 ID:', response.data?.id);
        }
      }),
      catchError(this.handleError)
    );
  }

  // ============================================
  // 📤 ENVÍO DE MENSAJES
  // ============================================

  enviarFelicitacion(socioId: number, mensaje?: string): Observable<ApiResponse<RegistroEnvio>> {
    const url = `${this.apiUrl}/enviar-ahora/${socioId}`;
    console.log('📡 POST:', url);
    console.log('🎂 Enviando a socio ID:', socioId);
    
    const body = mensaje ? { mensaje } : {};
    
    return this.http.post<ApiResponse<RegistroEnvio>>(
      url,
      body,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        console.log('✅ Felicitación enviada:', response);
        if (response.success) {
          console.log('🎉 Estado:', response.data?.estado);
        }
      }),
      catchError(this.handleError)
    );
  }

  enviarATodos(): Observable<ApiResponse<RegistroEnvio[]>> {
    const url = `${this.apiUrl}/enviar-ahora-todos`;
    console.log('📡 POST:', url);
    console.log('🎂 Enviando a TODOS los cumpleañeros');
    
    return this.http.post<ApiResponse<RegistroEnvio[]>>(
      url,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        console.log('✅ Mensajes enviados:', response);
        if (response.success && response.data) {
          console.log(`📊 Enviados: ${response.data.length} mensajes`);
        }
      }),
      catchError(this.handleError)
    );
  }

  ejecutarAutomatico(): Observable<ApiResponse<RegistroEnvio[]>> {
    console.log('🤖 Ejecutando envío automático...');
    return this.enviarATodos();
  }

  // ============================================
  // 🕒 PROGRAMACIÓN
  // ============================================

  programarEnvio(horaEnvio: string): Observable<ApiResponse<ConfiguracionMensaje>> {
    const url = `${this.apiUrl}/programar`;
    console.log('📡 POST:', url, '⏰', horaEnvio);
    
    return this.http.post<ApiResponse<ConfiguracionMensaje>>(
      url,
      { horaEnvio },
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => console.log('✅ Programado:', response)),
      catchError(this.handleError)
    );
  }

  // ============================================
  // 📁 MULTIMEDIA
  // ============================================

  subirMedia(archivo: File, configuracionId?: number): Observable<ApiResponse<MediaContenido>> {
    const url = `${this.apiUrl}/multimedia`;
    console.log('📡 POST (FormData):', url);
    console.log('📎 Archivo:', archivo.name);
    console.log('📏 Tamaño:', (archivo.size / 1024).toFixed(2), 'KB');
    
    const formData = new FormData();
    formData.append('file', archivo);
    
    if (configuracionId) {
      formData.append('configuracionId', configuracionId.toString());
    }

    return this.http.post<ApiResponse<MediaContenido>>(
      url,
      formData,
      { headers: this.getHeadersForFormData() }
    ).pipe(
      tap(response => {
        console.log('✅ Media subida:', response);
        if (response.success && response.data) {
          console.log('🆔 ID:', response.data.id);
          console.log('📁 Nombre:', response.data.nombreArchivo);
        }
      }),
      catchError(this.handleError)
    );
  }

  obtenerUrlDescarga(nombreArchivo: string): string {
    return `${this.apiUrl}/multimedia/descargar/${nombreArchivo}`;
  }

  // ============================================
  // 📊 REPORTES Y HISTORIAL
  // ============================================

  obtenerReporte(fechaInicio?: string, fechaFin?: string): Observable<RegistroEnvio[]> {
    let url = `${this.apiUrl}/reporte`;
    const params: string[] = [];

    if (fechaInicio) params.push(`fechaInicio=${fechaInicio}`);
    if (fechaFin) params.push(`fechaFin=${fechaFin}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    console.log('📡 GET:', url);

    return this.http.get<RegistroEnvio[]>(url, { headers: this.getHeaders() }).pipe(
      tap(data => console.log('✅ Reporte:', data.length, 'registros')),
      catchError(this.handleError)
    );
  }

  // 👇 NUEVO: Obtener historial de multimedia
  obtenerHistorialMultimedia(): Observable<ApiResponse<HistorialMultimedia>> {
    const url = `${this.historialUrl}/multimedia`;
    console.log('📡 GET:', url);

    return this.http.get<ApiResponse<HistorialMultimedia>>(url, { headers: this.getHeaders() }).pipe(
      tap(response => {
        console.log('✅ Historial multimedia:', response);
        if (response.success) {
          console.log('📊 Total archivos:', response.data?.total);
        }
      }),
      catchError(this.handleError)
    );
  }

  // 👇 NUEVO: Obtener último archivo subido
  obtenerUltimoArchivo(): Observable<ApiResponse<MediaContenido>> {
    const url = `${this.historialUrl}/multimedia/ultimo`;
    console.log('📡 GET:', url);

    return this.http.get<ApiResponse<MediaContenido>>(url, { headers: this.getHeaders() }).pipe(
      tap(response => {
        console.log('✅ Último archivo:', response);
        if (response.data) {
          console.log('📁', response.data.nombreArchivo);
        }
      }),
      catchError(this.handleError)
    );
  }

  // 👇 NUEVO: Obtener historial de mensajes personalizados
  obtenerHistorialMensajes(): Observable<ApiResponse<{ total: number, data: MensajePersonalizado[] }>> {
    const url = `${this.historialUrl}/mensajes`;
    console.log('📡 GET:', url);

    return this.http.get<ApiResponse<{ total: number, data: MensajePersonalizado[] }>>(
      url, 
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        console.log('✅ Historial mensajes:', response);
        if (response.success) {
          console.log('📊 Total mensajes:', response.data?.total);
        }
      }),
      catchError(this.handleError)
    );
  }

  // ============================================
  // 🔐 UTILIDADES
  // ============================================

  hasValidToken(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  clearToken(): void {
    localStorage.removeItem('token');
    console.log('🚪 Token eliminado');
  }
}