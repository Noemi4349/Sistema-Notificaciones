import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  email?: string;
  message?: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8081/api/auth';
  private tokenKey = 'auth_token';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // ⭐ LIMPIAR localStorage al iniciar
    this.clearLocalStorage();
    
    // Cargar token solo de sessionStorage
    const token = this.getToken();
    if (token) {
      console.log('🔑 Token encontrado en sessionStorage');
      this.currentUserSubject.next({ token });
    } else {
      console.log('⚠️ No hay token en sessionStorage');
    }
  }

  // ⭐ NUEVO: Método para limpiar localStorage
  private clearLocalStorage(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('rememberMe');
    console.log('🧹 localStorage limpiado');
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    console.log('📡 Enviando petición POST a:', `${this.apiUrl}/login`);
    console.log('📤 Credenciales:', { username: credentials.username, password: '*' });
    
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          console.log('✅ Respuesta del servidor:', response);
          
          if (response.token) {
            console.log('🔐 Token recibido, guardando en sessionStorage...');
            this.setToken(response.token);
            this.currentUserSubject.next(response);
            console.log('✅ Token guardado exitosamente en sessionStorage');
          } else {
            console.warn('⚠️ Respuesta sin token');
          }
        }),
        catchError(error => {
          console.error('❌ Error en login:', error);
          console.error('📋 Detalles del error:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            error: error.error
          });
          throw error;
        })
      );
  }

  register(userData: RegisterRequest): Observable<any> {
    console.log('📡 Enviando petición de registro a:', `${this.apiUrl}/login`);
    return this.http.post(`${this.apiUrl}/login`, userData)
      .pipe(
        tap(response => console.log('✅ Registro exitoso:', response)),
        catchError(error => {
          console.error('❌ Error en registro:', error);
          throw error;
        })
      );
  }

  logout(): void {
    console.log('🚪 Cerrando sesión...');
    sessionStorage.removeItem(this.tokenKey); // ⭐ Usar sessionStorage
    sessionStorage.removeItem('rememberMe');
    this.currentUserSubject.next(null);
    console.log('✅ Sesión cerrada');
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.tokenKey); // ⭐ Usar sessionStorage
  }

  private setToken(token: string): void {
    sessionStorage.setItem(this.tokenKey, token); // ⭐ Usar sessionStorage
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const isAuth = !!token;
    console.log('🔍 Usuario autenticado:', isAuth);
    return isAuth;
  }

  // Método para obtener headers con el token
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Método adicional para obtener información del usuario actual
  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  // Método para verificar si el token ha expirado (si usas JWT)
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      // Decodificar JWT (payload es la parte del medio)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convertir a milisegundos
      const now = Date.now();
      
      const expired = now >= exp;
      if (expired) {
        console.warn('⚠️ Token expirado');
      }
      return expired;
    } catch (e) {
      console.error('❌ Error al decodificar token:', e);
      return true;
    }
  }
}