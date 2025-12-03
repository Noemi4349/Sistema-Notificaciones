import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreditosService, RegistroEnvio } from 'src/app/service/creditos.service';
import { ExcelService } from 'src/app/service/excel.service';
import { MessageService } from 'primeng/api';
import * as XLSX from 'xlsx';

// PrimeNG Imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
//import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ChipModule } from 'primeng/chip';

interface ModuloRegistro {
  nombre: string;
  codigo: string;
  icono: string;
  color: string;
}

interface RegistroExtendido extends RegistroEnvio {
  nombreSocio?: string;
  modulo?: string;
}

interface SocioExcel {
  numeroSocio: string;
  nombres: string;
  numeroTelefono: string;
  valido: boolean;
}

@Component({
  selector: 'app-registros',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    //DropdownModule,
    TagModule,
    CardModule,
    ToastModule,
    DatePickerModule,
    SelectButtonModule,
    DividerModule,
    TooltipModule,
    ProgressSpinnerModule,
    ChipModule
  ],
  templateUrl: './registros.component.html',
  styleUrls: ['./registros.component.scss'],
  providers: [MessageService]
})
export class RegistrosComponent implements OnInit, OnDestroy {
  // Datos principales
  todosLosRegistros: RegistroExtendido[] = [];
  registrosFiltrados: RegistroExtendido[] = [];
  
  // Módulos disponibles
  modulosDisponibles: ModuloRegistro[] = [
    { nombre: 'Todos los Módulos', codigo: 'TODOS', icono: 'pi-list', color: '#6366f1' },
    { nombre: 'Créditos y Pagos', codigo: 'CREDITOS', icono: 'pi-credit-card', color: '#10b981' },
   // { nombre: 'Notificaciones', codigo: 'NOTIFICACIONES', icono: 'pi-bell', color: '#f59e0b' },
    { nombre: 'Mensajería', codigo: 'MENSAJERIA', icono: 'pi-comments', color: '#3b82f6' },
    { nombre: 'Recordatorios', codigo: 'RECORDATORIOS', icono: 'pi-clock', color: '#ec4899' },
    //{ nombre: 'Sistema', codigo: 'SISTEMA', icono: 'pi-cog', color: '#8b5cf6' }
  ];

  moduloSeleccionado: ModuloRegistro = this.modulosDisponibles[0];
  
  // Filtros
  filtroEstadoRegistro: string = 'TODOS';
  busquedaRegistro: string = '';
  rangoFechas: Date[] = [];
  
  // Estados
  loading: boolean = false;
  
  // Estadísticas en tiempo real
  estadisticas = {
    total: 0,
    exitosos: 0,
    fallidos: 0,
    pendientes: 0,
    tasaExito: 0
  };
  
  // Opciones de filtro de estado
  opcionesEstado = [
    { label: '📋 Todos', value: 'TODOS' },
    { label: '✅ Exitosos', value: 'EXITOSO' },
    { label: '❌ Fallidos', value: 'FALLIDO' },
    { label: '⏳ Pendientes', value: 'PENDIENTE' }
  ];

  // Intervalo de actualización automática
  intervaloActualizacion: any = null;

    // ========== NUEVAS PROPIEDADES PARA EXCEL ==========
  excelData: SocioExcel[] = [];
  mensaje: string = '';
  archivoExcel: File | null = null;
  fileName: string = '';
  enviandoMensajes: boolean = false;
  activeTabIndex: number = 0; // 0 = Registros, 1 = Enviar Mensajes

  // ========== Detalles de Registro ==========
  registroSeleccionado: RegistroExtendido | null = null;
  mostrarDialogoDetalle: boolean = false;

  private modulosCargados = {
    creditos: false,
    mensajeria: false
  };

  constructor(
    private creditosService: CreditosService,
    private excelService: ExcelService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    console.log('📊 Inicializando componente de Registros...');
    this.cargarRegistros();
    this.iniciarActualizacionAutomatica();
  }

  ngOnDestroy() {
    this.detenerActualizacionAutomatica();
  }

  // ========== Carga de Datos ==========

  cargarRegistros() {
    console.log('🔄 Cargando registros...');
    this.loading = true;
    
    this.creditosService.obtenerTodosSocios().subscribe({
      next: (socios) => {
        console.log('👥 Socios obtenidos:', socios.length);
        
        if (socios.length === 0) {
          this.todosLosRegistros = [];
          this.registrosFiltrados = [];
          this.actualizarEstadisticas();
          this.loading = false;
          return;
        }

        let registrosCompletos: RegistroExtendido[] = [];
        let sociosProcesados = 0;

        socios.forEach(socio => {
          if (!socio.id) {
            sociosProcesados++;
            return;
          }

          this.creditosService.obtenerHistorialEnvios(socio.id).subscribe({
            next: (historial) => {
              const registrosConInfo = historial.map(reg => ({
                ...reg,
                nombreSocio: `${socio.nombre} ${socio.apellidoPaterno}`,
                modulo: this.determinarModulo(reg)
              }));
              
              registrosCompletos = [...registrosCompletos, ...registrosConInfo];
              sociosProcesados++;

              if (sociosProcesados === socios.length) {
                this.todosLosRegistros = registrosCompletos.sort((a, b) => 
                  new Date(b.fechaEnvio).getTime() - new Date(a.fechaEnvio).getTime()
                );
                
                console.log('✅ Total registros cargados:', this.todosLosRegistros.length);
                this.aplicarFiltros();
                this.actualizarEstadisticas();
                this.loading = false;
              }
            },
            error: (error) => {
              console.error(`❌ Error al cargar historial de ${socio.nombre}:`, error);
              sociosProcesados++;
              
              if (sociosProcesados === socios.length) {
                this.todosLosRegistros = registrosCompletos.sort((a, b) => 
                  new Date(b.fechaEnvio).getTime() - new Date(a.fechaEnvio).getTime()
                );
                this.aplicarFiltros();
                this.actualizarEstadisticas();
                this.loading = false;
              }
            }
          });
        });
      },
      error: (error) => {
        console.error('❌ Error al cargar socios:', error);
        this.mostrarError('Error al cargar registros');
        this.todosLosRegistros = [];
        this.registrosFiltrados = [];
        this.actualizarEstadisticas();
        this.loading = false;
      }
    });
  }

  determinarModulo(registro: RegistroEnvio): string {
    // Lógica para determinar el módulo basado en el contenido del mensaje
    if (registro.mensaje?.toLowerCase().includes('pago') || 
        registro.mensaje?.toLowerCase().includes('crédito')) {
      return 'CREDITOS';
    } else if (registro.mensaje?.toLowerCase().includes('recordatorio') ||
               registro.mensaje?.toLowerCase().includes('vencimiento')) {
      return 'RECORDATORIOS';
    } else if (registro.mensaje?.toLowerCase().includes('notificación')) {
      return 'NOTIFICACIONES';
    } else {
      return 'MENSAJERIA';
    }
  }

  // ========== Filtros ==========

  aplicarFiltros() {
    let resultado = [...this.todosLosRegistros];

    // Filtro por módulo
    if (this.moduloSeleccionado.codigo !== 'TODOS') {
      resultado = resultado.filter(r => r.modulo === this.moduloSeleccionado.codigo);
    }

    // Filtro por estado
    if (this.filtroEstadoRegistro !== 'TODOS') {
      resultado = resultado.filter(r => r.estado === this.filtroEstadoRegistro);
    }

    // Filtro por búsqueda
    if (this.busquedaRegistro) {
      const busqueda = this.busquedaRegistro.toLowerCase();
      resultado = resultado.filter(r =>
        r.numeroDestino.includes(busqueda) ||
        (r.nombreSocio && r.nombreSocio.toLowerCase().includes(busqueda)) ||
        (r.mensaje && r.mensaje.toLowerCase().includes(busqueda)) ||
        (r.mensajeError && r.mensajeError.toLowerCase().includes(busqueda))
      );
    }

    // Filtro por rango de fechas
    if (this.rangoFechas && this.rangoFechas.length === 2 && 
        this.rangoFechas[0] && this.rangoFechas[1]) {
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
    this.actualizarEstadisticas();
  }

  limpiarFiltros() {
    this.moduloSeleccionado = this.modulosDisponibles[0];
    this.filtroEstadoRegistro = 'TODOS';
    this.busquedaRegistro = '';
    this.rangoFechas = [];
    this.aplicarFiltros();
    this.mostrarExito('Filtros limpiados correctamente');
  }

  onModuloChange() {
    console.log('🔄 Módulo cambiado a:', this.moduloSeleccionado.nombre);
    this.aplicarFiltros();
  }

  // ========== Estadísticas ==========

  actualizarEstadisticas() {
    const registros = this.registrosFiltrados;
    
    this.estadisticas.total = registros.length;
    this.estadisticas.exitosos = registros.filter(r => r.estado === 'EXITOSO').length;
    this.estadisticas.fallidos = registros.filter(r => r.estado === 'FALLIDO').length;
    this.estadisticas.pendientes = registros.filter(r => r.estado === 'PENDIENTE').length;
    
    this.estadisticas.tasaExito = this.estadisticas.total > 0
      ? (this.estadisticas.exitosos / this.estadisticas.total) * 100
      : 0;
  }

  // ========== Exportación ==========

  exportarRegistrosCSV() {
    if (this.registrosFiltrados.length === 0) {
      this.mostrarAdvertencia('No hay registros para exportar');
      return;
    }

    const headers = ['Fecha/Hora', 'Módulo', 'Socio', 'Número', 'Estado', 'Mensaje', 'Error'];
    const csvData = this.registrosFiltrados.map(r => [
      this.formatearFechaHora(r.fechaEnvio),
      r.modulo || 'N/A',
      r.nombreSocio || 'N/A',
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
    link.setAttribute('download', `registros_${this.moduloSeleccionado.codigo}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.mostrarExito('Registros exportados correctamente');
  }

  exportarRegistrosJSON() {
    if (this.registrosFiltrados.length === 0) {
      this.mostrarAdvertencia('No hay registros para exportar');
      return;
    }

    const jsonData = JSON.stringify(this.registrosFiltrados, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `registros_${this.moduloSeleccionado.codigo}_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.mostrarExito('Registros exportados en formato JSON');
  }

  // ========== Actualización Automática ==========

  iniciarActualizacionAutomatica() {
    // Actualizar cada 5 minutos
    this.intervaloActualizacion = setInterval(() => {
      console.log('🔄 Actualización automática de registros...');
      this.cargarRegistros();
    }, 300000); // 5 minutos
  }

  detenerActualizacionAutomatica() {
    if (this.intervaloActualizacion) {
      clearInterval(this.intervaloActualizacion);
      this.intervaloActualizacion = null;
    }
  }

  actualizarManual() {
    this.mostrarExito('Actualizando registros...');
    this.cargarRegistros();
  }

  // ========== Helpers ==========

  getEstadoEnvioBadge(estado: string): 'success' | 'danger' | 'warn' | 'info' {
    switch (estado) {
      case 'EXITOSO': return 'success';
      case 'FALLIDO': return 'danger';
      case 'PENDIENTE': return 'warn';
      default: return 'info';
    }
  }

  getModuloInfo(codigoModulo: string): ModuloRegistro {
    return this.modulosDisponibles.find(m => m.codigo === codigoModulo) 
      || this.modulosDisponibles[0];
  }

  formatearFechaHora(fecha: string): string {
    if (!fecha) return '';
    try {
      return new Date(fecha).toLocaleString('es-BO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      return fecha;
    }
  }

  formatearFechaRelativa(fecha: string): string {
    if (!fecha) return '';
    
    const ahora = new Date();
    const fechaRegistro = new Date(fecha);
    const diffMs = ahora.getTime() - fechaRegistro.getTime();
    const diffMinutos = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);
    const diffDias = Math.floor(diffMs / 86400000);

    if (diffMinutos < 1) return 'Hace un momento';
    if (diffMinutos < 60) return `Hace ${diffMinutos} minuto${diffMinutos > 1 ? 's' : ''}`;
    if (diffHoras < 24) return `Hace ${diffHoras} hora${diffHoras > 1 ? 's' : ''}`;
    if (diffDias < 7) return `Hace ${diffDias} día${diffDias > 1 ? 's' : ''}`;
    
    return this.formatearFechaHora(fecha);
  }

  obtenerIniciales(nombreSocio: string | undefined): string {
  if (!nombreSocio) return 'NA';
  return nombreSocio
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

obtenerConteoModulo(modulo: ModuloRegistro): number {
  if (this.moduloSeleccionado.codigo === modulo.codigo) {
    return this.registrosFiltrados.length;
  }
  
  if (modulo.codigo === 'TODOS') {
    return this.todosLosRegistros.length;
  }
  
  return this.todosLosRegistros.filter(r => r.modulo === modulo.codigo).length;
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