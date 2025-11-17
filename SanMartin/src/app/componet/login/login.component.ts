
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { AuthService, LoginRequest } from '../../service/auth.service';

import { AppFloatingConfigurator } from '@/componet/layout/component/app.floatingconfigurator';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, 
    ButtonModule,
    CheckboxModule,
    InputTextModule,
    PasswordModule,
    FormsModule,
    RouterModule,
    RippleModule,
    AppFloatingConfigurator
    
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  // Credenciales
  username: string = ''; //  Cambiado de 'email' a 'username'
  password: string = '';
  checked: boolean = false;

  // Estados
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onLogin(): void {
    // Validación básica
    if (!this.username || !this.password) {
      this.errorMessage = 'Por favor, complete todos los campos';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const credentials: LoginRequest = {
      username: this.username,
      password: this.password
    };

    console.log('🔄 Intentando login con:', credentials);

    this.authService.login(credentials).subscribe({
      next: (response) => {
        console.log('✅ Login exitoso:', response);

        // ✅ Guarda el token en sessionStorage
      if (response.token) {
        sessionStorage.setItem('auth_9i/////////////////////////////////////////////////////////////9/token', response.token);
      } else {
        console.warn('⚠️ No se recibió token del backend');
      }
        
        // Guardar información adicional si es necesario
        if (this.checked) {
          localStorage.setItem('rememberMe', 'true');
        }
        
        // Redirigir al dashboard o página principal
        this.router.navigate(['/layout/dashboard']); // Cambia a tu ruta deseada
      },
      error: (error) => {
        console.error('❌ Error en login:', error);
        
        // Manejar diferentes tipos de errores
        if (error.status === 401) {
          this.errorMessage = 'Usuario o contraseña incorrectos';
        } else if (error.status === 0) {
          this.errorMessage = 'No se puede conectar con el servidor. Verifica que el backend esté ejecutándose.';
        } else if (error.status === 403) {
          this.errorMessage = 'Acceso denegado';
        } else {
          this.errorMessage = error.error?.message || 'Error al iniciar sesión';
        }
        
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  clearError(): void {
    this.errorMessage = '';
  }
}