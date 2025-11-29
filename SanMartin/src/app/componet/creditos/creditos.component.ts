import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreditosService, Socio, RegistroEnvio, EstadisticasEnvio, ConfiguracionScheduler } from 'src/app/service/creditos.service';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Router } from '@angular/router';

// PrimeNG Imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ToolbarModule } from 'primeng/toolbar';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { CheckboxModule } from 'primeng/checkbox';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DividerModule } from 'primeng/divider';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';

@Component({
  selector: 'app-creditos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DialogModule,
    ToolbarModule,
    ToastModule,
    ConfirmDialogModule,
    TagModule,
    TooltipModule,
    CheckboxModule,
    DatePickerModule,
    TextareaModule,
    SelectButtonModule,
    MessageModule,
    DividerModule,
    CardModule
  ],
  templateUrl: './creditos.component.html',
  styleUrls: ['./creditos.component.scss'],
  providers: [MessageService, ConfirmationService]
})
export class CreditosComponent implements OnInit, OnDestroy {
  // Datos principales
  socios: Socio[] = [];
  sociosFiltrados: Socio[] = [];
  socioSeleccionado: Socio | null = null;
  
  // Dialogs
  displayDialog: boolean = false;
  displayHistorialDialog: boolean = false;
  displayEnvioMasivoDialog: boolean = false;
  displayTestDialog: boolean = false;
  displayConfiguracionDialog: boolean = false;
  
  // Formulario
  socioForm: Socio = this.nuevoSocio();
  fechaVencimientoDate: Date | null = null;
  esEdicion: boolean = false;
  
  // Historial de envíos
  historialEnvios: RegistroEnvio[] = [];
  
  // Estadísticas
  estadisticas: EstadisticasEnvio | null = null;
  
  // Próximos envíos
  proximosEnvios: any = null;
  
  // Test de mensaje
  numeroTest: string = '';
  mensajeTest: string = 'Este es un mensaje de prueba del sistema de recordatorios.';
  
  // Loading states
  loading: boolean = false;
  loadingEnvio: boolean = false;
  loadingConfiguracion: boolean = false;
  
  // Filtros
  filtroEstado: string = 'TODOS';
  busquedaGlobal: string = '';

  // Configuración del Scheduler
  configuracionScheduler: ConfiguracionScheduler | null = null;
  horaEnvio: number = 9;
  minutoEnvio: number = 0;
  schedulerActivo: boolean = false;
  diasAnticipacion: number = 1;
  intervaloMonitoreo: any = null;
  tiempoRestante: string = '';

  constructor(
    private creditosService: CreditosService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router
  ) {}

  ngOnInit() {
    console.log('🚀 Inicializando componente...');
    this.cargarSocios();
    this.cargarEstadisticas();
    this.cargarProximosEnvios();
    this.cargarConfiguracionScheduler();
  }

  ngOnDestroy() {
    this.detenerMonitoreoTiempo();
  }

  // ========== Funciones de Configuración del Scheduler ==========

  cargarConfiguracionScheduler() {
    console.log('⚙️ Cargando configuración del scheduler...');
    this.loadingConfiguracion = true;
    
    this.creditosService.obtenerConfiguracionScheduler().subscribe({
      next: (config) => {
        console.log('✅ Configuración cargada:', config);
        this.configuracionScheduler = config;
        this.horaEnvio = config.hora;
        this.minutoEnvio = config.minuto;
        this.schedulerActivo = config.activo;
        this.diasAnticipacion = config.diasAnticipacion || 1;
        this.loadingConfiguracion = false;
        
        if (this.schedulerActivo) {
          this.iniciarMonitoreoTiempo();
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar configuración:', error);
        this.mostrarError('Error al cargar configuración del scheduler');
        this.loadingConfiguracion = false;
      }
    });
  }

  abrirConfiguracionScheduler() {
    this.cargarConfiguracionScheduler();
    this.displayConfiguracionDialog = true;
  }

  guardarConfiguracionScheduler() {
    if (this.horaEnvio < 0 || this.horaEnvio > 23) {
      this.mostrarAdvertencia('La hora debe estar entre 0 y 23');
      return;
    }
    
    if (this.minutoEnvio < 0 || this.minutoEnvio > 59) {
      this.mostrarAdvertencia('Los minutos deben estar entre 0 y 59');
      return;
    }

    console.log('💾 Guardando configuración del scheduler...');
    this.loadingConfiguracion = true;

    const configuracion: ConfiguracionScheduler = {
      hora: this.horaEnvio,
      minuto: this.minutoEnvio,
      activo: this.schedulerActivo,
      diasAnticipacion: this.diasAnticipacion,
      modificadoPor: 'USUARIO'
    };

    this.creditosService.actualizarConfiguracionScheduler(configuracion).subscribe({
      next: (response) => {
        console.log('✅ Configuración guardada:', response);
        this.configuracionScheduler = response;
        this.loadingConfiguracion = false;
        this.displayConfiguracionDialog = false;
        
        const horaFormateada = this.formatearHora(response.hora, response.minuto);
        const dias = response.diasAnticipacion ?? 1;
        
        if (response.activo) {
          this.mostrarExito(
            `✅ Scheduler configurado correctamente.\n` +
            `📅 Los recordatorios se enviarán automáticamente a las ${horaFormateada} ` +
            `(${dias} día${dias > 1 ? 's' : ''} antes del vencimiento)`
          );
          this.iniciarMonitoreoTiempo();
        } else {
          this.mostrarAdvertencia('⏸️ Scheduler desactivado. Los envíos NO se ejecutarán automáticamente.');
          this.detenerMonitoreoTiempo();
        }
        
        this.cargarProximosEnvios();
      },
      error: (error) => {
        console.error('❌ Error al guardar configuración:', error);
        this.mostrarError('Error al guardar configuración: ' + (error.error?.error || error.message));
        this.loadingConfiguracion = false;
      }
    });
  }

  ejecutarEnvioInmediato() {
    this.confirmationService.confirm({
      message: '¿Desea ejecutar el envío de recordatorios AHORA (sin esperar al horario programado)?',
      header: 'Confirmación de Envío Inmediato',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, Ejecutar',
      rejectLabel: 'Cancelar',
      accept: () => {
        console.log('🚀 Ejecutando envío inmediato...');
        this.loadingEnvio = true;
        
        this.creditosService.ejecutarEnvioInmediato().subscribe({
          next: (response) => {
            console.log('✅ Envío ejecutado:', response);
            this.mostrarExito(response.mensaje);
            this.loadingEnvio = false;
            this.cargarEstadisticas();
            this.cargarProximosEnvios();
          },
          error: (error) => {
            console.error('❌ Error al ejecutar envío:', error);
            this.mostrarError('Error al ejecutar envío: ' + (error.error?.error || error.message));
            this.loadingEnvio = false;
          }
        });
      }
    });
  }

  iniciarMonitoreoTiempo() {
    this.detenerMonitoreoTiempo();
    
    this.intervaloMonitoreo = setInterval(() => {
      this.calcularTiempoRestante();
    }, 60000);
    
    this.calcularTiempoRestante();
    console.log('⏰ Monitoreo de tiempo iniciado');
  }

  detenerMonitoreoTiempo() {
    if (this.intervaloMonitoreo) {
      clearInterval(this.intervaloMonitoreo);
      this.intervaloMonitoreo = null;
      this.tiempoRestante = '';
      console.log('⏸️ Monitoreo de tiempo detenido');
    }
  }

  calcularTiempoRestante() {
    if (!this.schedulerActivo || !this.configuracionScheduler) {
      this.tiempoRestante = '';
      return;
    }

    const ahora = new Date();
    const horaEnvioDate = new Date();
    horaEnvioDate.setHours(this.horaEnvio, this.minutoEnvio, 0, 0);

    if (horaEnvioDate <= ahora) {
      horaEnvioDate.setDate(horaEnvioDate.getDate() + 1);
    }

    const diferencia = horaEnvioDate.getTime() - ahora.getTime();
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));

    this.tiempoRestante = `${horas}h ${minutos}m`;
  }

  formatearHora(hora: number, minuto: number): string {
    return `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`;
  }

  getTextoVencimiento(fechaVencimiento: string): string {
    const hoy = new Date();
    const fecha = new Date(fechaVencimiento);

    hoy.setHours(0, 0, 0, 0);
    fecha.setHours(0, 0, 0, 0);

    const diffMs = fecha.getTime() - hoy.getTime();
    const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDias === 0) return "¡Vence HOY!";
    if (diffDias === 1) return "Vence mañana";
    if (diffDias > 1) return `Vence en ${diffDias} días`;
    if (diffDias === -1) return "Vencido ayer";
    return `Vencido hace ${Math.abs(diffDias)} días`;
  }

  // ========== Carga de datos ==========

  cargarSocios() {
    console.log('📥 Cargando socios...');
    this.loading = true;
    
    this.creditosService.obtenerTodosSocios().subscribe({
      next: (data) => {
        console.log('✅ Socios cargados:', data);
        this.socios = data;
        this.aplicarFiltros();
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar socios:', error);
        this.mostrarError('Error al cargar socios: ' + (error.error?.error || error.message || 'Error desconocido'));
        this.loading = false;
      }
    });
  }

  cargarEstadisticas() {
    this.creditosService.obtenerEstadisticasEnvios().subscribe({
      next: (data) => {
        this.estadisticas = data;
        console.log('📊 Estadísticas cargadas:', data);
      },
      error: (error) => {
        console.error('Error al cargar estadísticas', error);
      }
    });
  }

  cargarProximosEnvios() {
    this.creditosService.obtenerProximosEnvios().subscribe({
      next: (data) => {
        this.proximosEnvios = data;
        console.log('📅 Próximos envíos:', data);
      },
      error: (error) => {
        console.error('Error al cargar próximos envíos', error);
      }
    });
  }

  // ========== CRUD Operations ==========

  abrirDialogNuevo() {
    this.socioForm = this.nuevoSocio();
    this.fechaVencimientoDate = null;
    this.esEdicion = false;
    this.displayDialog = true;
  }

  abrirDialogEditar(socio: Socio) {
    this.socioForm = { ...socio };
    
    if (socio.fechaVencimientoPago) {
      const [year, month, day] = socio.fechaVencimientoPago.split('-').map(Number);
      this.fechaVencimientoDate = new Date(year, month - 1, day);
    }
    
    this.esEdicion = true;
    this.displayDialog = true;
  }

  guardarSocio() {
    if (!this.validarFormulario()) {
      return;
    }

    if (this.fechaVencimientoDate) {
      this.socioForm.fechaVencimientoPago = this.formatearFechaParaBackend(this.fechaVencimientoDate);
    }

    this.loading = true;

    if (this.esEdicion && this.socioForm.id) {
      this.creditosService.actualizarSocio(this.socioForm.id, this.socioForm).subscribe({
        next: () => {
          this.mostrarExito('Socio actualizado correctamente');
          this.cerrarDialog();
          this.cargarSocios();
        },
        error: (error) => {
          this.mostrarError(error.error?.error || error.message || 'Error al actualizar socio');
          this.loading = false;
        }
      });
    } else {
      this.creditosService.registrarSocio(this.socioForm).subscribe({
        next: () => {
          this.mostrarExito('Socio registrado correctamente');
          this.cerrarDialog();
          this.cargarSocios();
        },
        error: (error) => {
          this.mostrarError(error.error?.error || error.message || 'Error al registrar socio');
          this.loading = false;
        }
      });
    }
  }

  cambiarEstado(socio: Socio) {
    const nuevoEstado = !socio.estado;
    const mensaje = nuevoEstado ? 'activar' : 'desactivar';

    this.confirmationService.confirm({
      message: `¿Está seguro de ${mensaje} este socio?`,
      header: 'Confirmación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.creditosService.cambiarEstadoSocio(socio.id!, nuevoEstado).subscribe({
          next: () => {
            this.mostrarExito(`Socio ${mensaje}do correctamente`);
            this.cargarSocios();
          },
          error: (error) => {
            this.mostrarError('Error al cambiar estado: ' + (error.error?.error || error.message));
          }
        });
      }
    });
  }

  eliminarSocio(socio: Socio) {
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar al socio ${socio.nombre} ${socio.apellidoPaterno}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.creditosService.eliminarSocio(socio.id!).subscribe({
          next: () => {
            this.mostrarExito('Socio eliminado correctamente');
            this.cargarSocios();
          },
          error: (error) => {
            this.mostrarError('Error al eliminar socio: ' + (error.error?.error || error.message));
          }
        });
      }
    });
  }

  // ========== Mensajería ==========

  enviarRecordatorio(socio: Socio) {
    this.loadingEnvio = true;
    
    this.creditosService.enviarRecordatorioManual(socio.id!).subscribe({
      next: (registro) => {
        if (registro.estado === 'EXITOSO') {
          this.mostrarExito(`Recordatorio enviado a ${socio.nombre}`);
        } else {
          this.mostrarAdvertencia(`Envío fallido: ${registro.mensajeError}`);
        }
        this.loadingEnvio = false;
        this.cargarEstadisticas();
      },
      error: (error) => {
        this.mostrarError('Error al enviar recordatorio: ' + (error.error?.error || error.message));
        this.loadingEnvio = false;
      }
    });
  }

  verHistorial(socio: Socio) {
    this.socioSeleccionado = socio;
    
    this.creditosService.obtenerHistorialEnvios(socio.id!).subscribe({
      next: (data) => {
        this.historialEnvios = data;
        this.displayHistorialDialog = true;
      },
      error: (error) => {
        this.mostrarError('Error al cargar historial');
      }
    });
  }

  ejecutarEnvioMasivo() {
    this.confirmationService.confirm({
      message: '¿Desea ejecutar el envío masivo de recordatorios?',
      header: 'Confirmación de Envío Masivo',
      icon: 'pi pi-send',
      accept: () => {
        this.loadingEnvio = true;
        
        this.creditosService.ejecutarEnvioManualScheduler().subscribe({
          next: () => {
            this.mostrarExito('Proceso de envío iniciado correctamente');
            this.loadingEnvio = false;
            this.displayEnvioMasivoDialog = false;
            this.cargarEstadisticas();
            this.cargarProximosEnvios();
          },
          error: (error) => {
            this.mostrarError('Error al ejecutar envío masivo: ' + (error.error?.error || error.message));
            this.loadingEnvio = false;
          }
        });
      }
    });
  }

  abrirDialogTest() {
    this.numeroTest = '';
    this.mensajeTest = 'Este es un mensaje de prueba del sistema de recordatorios.';
    this.displayTestDialog = true;
  }

  enviarMensajePrueba() {
    if (!this.numeroTest) {
      this.mostrarAdvertencia('Ingrese un número de teléfono');
      return;
    }

    this.loadingEnvio = true;
    
    this.creditosService.enviarMensajePrueba(this.numeroTest, this.mensajeTest).subscribe({
      next: () => {
        this.mostrarExito('Mensaje de prueba enviado correctamente');
        this.loadingEnvio = false;
        this.displayTestDialog = false;
        this.cargarEstadisticas(); 
      },
      error: (error) => {
        this.mostrarError('Error al enviar mensaje de prueba: ' + (error.error?.error || error.message));
        this.loadingEnvio = false;
      }
    });
  }

  // Navegar al historial completo
  abrirHistorialCompleto() {
    this.router.navigate(['/creditos/historial']);
  }

  // ========== Filtros ==========

  aplicarFiltros() {
    let resultado = [...this.socios];

    if (this.filtroEstado === 'ACTIVOS') {
      resultado = resultado.filter(s => s.estado);
    } else if (this.filtroEstado === 'INACTIVOS') {
      resultado = resultado.filter(s => !s.estado);
    }

    if (this.busquedaGlobal) {
      const busqueda = this.busquedaGlobal.toLowerCase();
      resultado = resultado.filter(s =>
        s.nombre.toLowerCase().includes(busqueda) ||
        s.apellidoPaterno.toLowerCase().includes(busqueda) ||
        (s.apellidoMaterno || '').toLowerCase().includes(busqueda) ||
        s.numeroSocio.toLowerCase().includes(busqueda) ||
        s.telefono.includes(busqueda) ||
        s.email.toLowerCase().includes(busqueda)
      );
    }

    this.sociosFiltrados = resultado;
  }

  // ========== Helpers ==========

  nuevoSocio(): Socio {
    return {
      estado: true,
      nombre: '',
      apellidoPaterno: '',
      apellidoMaterno: '',
      email: '',
      fechaVencimientoPago: '',
      numeroSocio: '',
      telefono: ''
    };
  }

  validarFormulario(): boolean {
    if (!this.socioForm.nombre || !this.socioForm.apellidoPaterno || 
        !this.socioForm.email || !this.socioForm.numeroSocio || 
        !this.socioForm.telefono || !this.fechaVencimientoDate) {
      this.mostrarAdvertencia('Complete todos los campos obligatorios');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.socioForm.email)) {
      this.mostrarAdvertencia('El email no tiene un formato válido');
      return false;
    }

    if (this.socioForm.telefono.length < 10) {
      this.mostrarAdvertencia('El teléfono debe incluir el código de país (ej: 59175123456)');
      return false;
    }

    return true;
  }

  cerrarDialog() {
    this.displayDialog = false;
    this.socioForm = this.nuevoSocio();
    this.fechaVencimientoDate = null;
    this.loading = false;
  }

  formatearFechaParaBackend(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getEstadoBadge(estado: boolean): 'success' | 'danger' {
    return estado ? 'success' : 'danger';
  }

  getEstadoTexto(estado: boolean): string {
    return estado ? 'Activo' : 'Inactivo';
  }

  getEstadoEnvioBadge(estado: string): 'success' | 'danger' | 'warn' {
    switch (estado) {
      case 'EXITOSO': return 'success';
      case 'FALLIDO': return 'danger';
      case 'PENDIENTE': return 'warn';
      default: return 'warn';
    }
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    try {
      const [year, month, day] = fecha.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('es-BO');
    } catch (e) {
      return fecha;
    }
  }

  formatearFechaHora(fecha: string): string {
    if (!fecha) return '';
    try {
      return new Date(fecha).toLocaleString('es-BO');
    } catch (e) {
      return fecha;
    }
  }

  // ========== Mensajes ==========

  mostrarExito(mensaje: string) {
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: mensaje,
      life: 3000
    });
  }

  mostrarError(mensaje: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: mensaje,
      life: 4000
    });
  }

  mostrarAdvertencia(mensaje: string) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Advertencia',
      detail: mensaje,
      life: 3000
    });
  }

  getDiasRestantes(fechaVencimiento: string): number {
    const hoy = new Date();
    const fecha = new Date(fechaVencimiento);

    hoy.setHours(0, 0, 0, 0);
    fecha.setHours(0, 0, 0, 0);

    const diff = fecha.getTime() - hoy.getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
  }

  abrirCalendario() {
    this.mostrarAdvertencia('Función de calendario en desarrollo');
  }

  getInitials(nombre: string, apellido: string): string {
    return (nombre?.charAt(0) + apellido?.charAt(0)).toUpperCase();
  }
}