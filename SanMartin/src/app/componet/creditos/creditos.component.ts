// src/app/component/creditos/creditos.component.ts - SIN TABVIEW

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreditosService, Socio, RegistroEnvio, EstadisticasEnvio, SchedulerStatus } from 'src/app/service/creditos.service';
import { MessageService, ConfirmationService } from 'primeng/api';

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

@Component({
  selector: 'app-creditos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
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
  displayRegistrosDialog: boolean = false;
  
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
  loadingRegistros: boolean = false;
  
  // Filtros
  filtroEstado: string = 'TODOS';
  busquedaGlobal: string = '';

  // ========== NUEVO: Programación automática ==========
  schedulerStatus: SchedulerStatus | null = null;
  schedulerActivo: boolean = false;
  horaEnvio: number = 9;
  minutoEnvio: number = 0;
  intervaloChequeo: any = null;
  tiempoRestante: string = '';
  
  // ========== NUEVO: Registros de envío ==========
  todosLosRegistros: RegistroEnvio[] = [];
  registrosFiltrados: RegistroEnvio[] = [];
  filtroEstadoRegistro: string = 'TODOS';
  busquedaRegistro: string = '';
  rangoFechas: Date[] = [];

  constructor(
    private creditosService: CreditosService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit() {
    console.log('🚀 Inicializando componente...');
    this.cargarSocios();
    this.cargarEstadisticas();
    this.cargarProximosEnvios();
    this.cargarSchedulerStatus();
    this.cargarTodosLosRegistros();
  }

  ngOnDestroy() {
    this.detenerMonitoreoAutomatico();
  }

  // ========== NUEVO: Funciones de Programación Automática ==========

  cargarSchedulerStatus() {
    this.creditosService.obtenerStatusScheduler().subscribe({
      next: (status) => {
        this.schedulerStatus = status;
        console.log('⏰ Status del scheduler:', status);
      },
      error: (error) => {
        console.error('Error al cargar status del scheduler', error);
      }
    });
  }

  abrirConfiguracion() {
    this.displayConfiguracionDialog = true;
  }

  guardarConfiguracion() {
    console.log('💾 Configuración guardada:', { hora: this.horaEnvio, minuto: this.minutoEnvio });
    this.mostrarExito('Configuración actualizada. Los envíos se realizarán a las ' + 
                      this.formatearHora(this.horaEnvio, this.minutoEnvio));
    this.displayConfiguracionDialog = false;
    
    if (this.schedulerActivo) {
      this.detenerMonitoreoAutomatico();
      this.iniciarMonitoreoAutomatico();
    }
  }

  iniciarMonitoreoAutomatico() {
    if (this.intervaloChequeo) {
      return;
    }

    this.schedulerActivo = true;
    console.log('▶️ Iniciando monitoreo automático...');
    
    this.intervaloChequeo = setInterval(() => {
      this.verificarHoraEnvio();
      this.calcularTiempoRestante();
    }, 60000);

    this.calcularTiempoRestante();
    
    this.mostrarExito('Monitoreo automático iniciado. Envíos programados a las ' + 
                     this.formatearHora(this.horaEnvio, this.minutoEnvio));
  }

  detenerMonitoreoAutomatico() {
    if (this.intervaloChequeo) {
      clearInterval(this.intervaloChequeo);
      this.intervaloChequeo = null;
      this.schedulerActivo = false;
      this.tiempoRestante = '';
      console.log('⏸️ Monitoreo automático detenido');
      this.mostrarAdvertencia('Monitoreo automático detenido');
    }
  }

  verificarHoraEnvio() {
    const ahora = new Date();
    const horaActual = ahora.getHours();
    const minutoActual = ahora.getMinutes();

    console.log(`🕐 Verificando hora: ${horaActual}:${minutoActual} vs ${this.horaEnvio}:${this.minutoEnvio}`);

    if (horaActual === this.horaEnvio && minutoActual === this.minutoEnvio) {
      console.log('⏰ ¡HORA DE ENVÍO ALCANZADA! Ejecutando envío automático...');
      this.ejecutarEnvioAutomatico();
    }
  }

  ejecutarEnvioAutomatico() {
    console.log('📤 Ejecutando envío automático...');
    this.loadingEnvio = true;
    
    this.creditosService.ejecutarEnvioManualScheduler().subscribe({
      next: (response) => {
        console.log('✅ Envío automático ejecutado:', response);
        this.mostrarExito('¡Envío automático ejecutado! Recordatorios enviados correctamente.');
        this.loadingEnvio = false;
        this.cargarEstadisticas();
        this.cargarProximosEnvios();
        this.cargarTodosLosRegistros();
      },
      error: (error) => {
        console.error('❌ Error en envío automático:', error);
        this.mostrarError('Error en envío automático: ' + (error.error?.error || error.message));
        this.loadingEnvio = false;
      }
    });
  }

  calcularTiempoRestante() {
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

  // ========== NUEVO: Funciones de Registros ==========

  cargarTodosLosRegistros() {
    this.loadingRegistros = true;
    
    this.creditosService.obtenerTodosSocios().subscribe({
      next: (socios) => {
        const promesas = socios.map(socio => 
          this.creditosService.obtenerHistorialEnvios(socio.id!).toPromise()
        );

        Promise.all(promesas).then(resultados => {
          this.todosLosRegistros = resultados
            .filter(r => r !== undefined)
            .flat() as RegistroEnvio[];
          
          this.todosLosRegistros.sort((a, b) => 
            new Date(b.fechaEnvio).getTime() - new Date(a.fechaEnvio).getTime()
          );

          console.log('📋 Total registros cargados:', this.todosLosRegistros.length);
          this.aplicarFiltrosRegistros();
          this.loadingRegistros = false;
        }).catch(error => {
          console.error('Error al cargar registros:', error);
          this.loadingRegistros = false;
        });
      },
      error: (error) => {
        console.error('Error al cargar socios para registros:', error);
        this.loadingRegistros = false;
      }
    });
  }

  abrirRegistros() {
    this.cargarTodosLosRegistros();
    this.displayRegistrosDialog = true;
  }

  aplicarFiltrosRegistros() {
    let resultado = [...this.todosLosRegistros];

    if (this.filtroEstadoRegistro !== 'TODOS') {
      resultado = resultado.filter(r => r.estado === this.filtroEstadoRegistro);
    }

    if (this.busquedaRegistro) {
      const busqueda = this.busquedaRegistro.toLowerCase();
      resultado = resultado.filter(r =>
        r.numeroDestino.includes(busqueda) ||
        (r.mensaje && r.mensaje.toLowerCase().includes(busqueda)) ||
        (r.mensajeError && r.mensajeError.toLowerCase().includes(busqueda))
      );
    }

    if (this.rangoFechas && this.rangoFechas.length === 2 && this.rangoFechas[0] && this.rangoFechas[1]) {
      const fechaInicio = new Date(this.rangoFechas[0]);
      fechaInicio.setHours(0, 0, 0, 0);
      
      const fechaFin = new Date(this.rangoFechas[1]);
      fechaFin.setHours(23, 59, 59, 999);

      resultado = resultado.filter(r => {
        const fechaEnvio = new Date(r.fechaEnvio);
        return fechaEnvio >= fechaInicio && fechaEnvio <= fechaFin;
      });
    }

    this.registrosFiltrados = resultado;
    console.log('🔍 Registros filtrados:', this.registrosFiltrados.length);
  }

  limpiarFiltrosRegistros() {
    this.filtroEstadoRegistro = 'TODOS';
    this.busquedaRegistro = '';
    this.rangoFechas = [];
    this.aplicarFiltrosRegistros();
  }

  exportarRegistrosCSV() {
    if (this.registrosFiltrados.length === 0) {
      this.mostrarAdvertencia('No hay registros para exportar');
      return;
    }

    const headers = ['Fecha/Hora', 'Número', 'Estado', 'Mensaje', 'Error'];
    const csvData = this.registrosFiltrados.map(r => [
      this.formatearFechaHora(r.fechaEnvio),
      r.numeroDestino,
      r.estado,
      r.mensaje ? r.mensaje.replace(/\n/g, ' ') : '',
      r.mensajeError || ''
    ]);

    const csv = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `registros_envios_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.mostrarExito('Registros exportados correctamente');
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
    console.log('➕ Abriendo diálogo nuevo socio');
    this.socioForm = this.nuevoSocio();
    this.fechaVencimientoDate = null;
    this.esEdicion = false;
    this.displayDialog = true;
  }

  abrirDialogEditar(socio: Socio) {
    console.log('✏️ Abriendo diálogo editar socio:', socio);
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
        next: (response) => {
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
        next: (response) => {
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
        this.cargarTodosLosRegistros();
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
          next: (response) => {
            this.mostrarExito('Proceso de envío iniciado correctamente');
            this.loadingEnvio = false;
            this.displayEnvioMasivoDialog = false;
            this.cargarEstadisticas();
            this.cargarProximosEnvios();
            this.cargarTodosLosRegistros();
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
      },
      error: (error) => {
        this.mostrarError('Error al enviar mensaje de prueba: ' + (error.error?.error || error.message));
        this.loadingEnvio = false;
      }
    });
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
}