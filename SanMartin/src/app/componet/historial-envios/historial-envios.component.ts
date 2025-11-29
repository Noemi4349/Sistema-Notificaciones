import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CreditosService, RegistroEnvio, Socio } from 'src/app/service/creditos.service';
import { MessageService } from 'primeng/api';

// PrimeNG Imports
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DatePickerModule } from 'primeng/datepicker';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-historial-envios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    TagModule,
    SelectButtonModule,
    DatePickerModule,
    CardModule,
    ProgressSpinnerModule
  ],
  templateUrl: './historial-envios.component.html',
  styleUrls: ['./historial-envios.component.scss'],
  providers: [MessageService]
})
export class HistorialEnviosComponent implements OnInit {
  // Registros de envío
  todosLosRegistros: RegistroEnvio[] = [];
  registrosFiltrados: RegistroEnvio[] = [];
  
  // Filtros
  filtroEstadoRegistro: string = 'TODOS';
  busquedaRegistro: string = '';
  rangoFechas: Date[] = [];
  
  // Loading states
  loadingRegistros: boolean = false;

  constructor(
    private creditosService: CreditosService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit() {
    console.log('📊 Inicializando componente de historial...');
    this.cargarTodosLosRegistros();
  }

  // ========== Funciones de Carga ==========

  cargarTodosLosRegistros() {
    console.log('🔄 Iniciando carga de todos los registros...');
    this.loadingRegistros = true;
    
    this.creditosService.obtenerTodosSocios().subscribe({
      next: (socios) => {
        console.log('👥 Socios obtenidos para registros:', socios.length);
        
        if (socios.length === 0) {
          this.todosLosRegistros = [];
          this.registrosFiltrados = [];
          this.loadingRegistros = false;
          return;
        }

        let registrosCompletos: RegistroEnvio[] = [];
        let sociosProcesados = 0;

        socios.forEach(socio => {
          if (!socio.id) {
            sociosProcesados++;
            return;
          }

          this.creditosService.obtenerHistorialEnvios(socio.id).subscribe({
            next: (historial) => {
              const registrosConNombre = historial.map(reg => ({
                ...reg,
                nombreSocio: `${socio.nombre} ${socio.apellidoPaterno}`
              }));
              
              registrosCompletos = [...registrosCompletos, ...registrosConNombre];
              sociosProcesados++;

              if (sociosProcesados === socios.length) {
                this.todosLosRegistros = registrosCompletos.sort((a, b) => 
                  new Date(b.fechaEnvio).getTime() - new Date(a.fechaEnvio).getTime()
                );
                
                console.log('✅ Total registros cargados:', this.todosLosRegistros.length);
                this.aplicarFiltrosRegistros();
                this.loadingRegistros = false;
              }
            },
            error: (error) => {
              console.error(`❌ Error al cargar historial de ${socio.nombre}:`, error);
              sociosProcesados++;
              
              if (sociosProcesados === socios.length) {
                this.todosLosRegistros = registrosCompletos.sort((a, b) => 
                  new Date(b.fechaEnvio).getTime() - new Date(a.fechaEnvio).getTime()
                );
                this.aplicarFiltrosRegistros();
                this.loadingRegistros = false;
              }
            }
          });
        });
      },
      error: (error) => {
        console.error('❌ Error al cargar socios para registros:', error);
        this.mostrarError('Error al cargar registros de envíos');
        this.todosLosRegistros = [];
        this.registrosFiltrados = [];
        this.loadingRegistros = false;
      }
    });
  }

  // ========== Filtros ==========

  aplicarFiltrosRegistros() {
    let resultado = [...this.todosLosRegistros];

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
    this.mostrarExito('Filtros limpiados');
  }

  // ========== Exportación ==========

  exportarRegistrosCSV() {
    if (this.registrosFiltrados.length === 0) {
      this.mostrarAdvertencia('No hay registros para exportar');
      return;
    }

    const headers = ['Fecha/Hora', 'Socio', 'Número', 'Estado', 'Mensaje', 'Error'];
    const csvData = this.registrosFiltrados.map(r => [
      this.formatearFechaHora(r.fechaEnvio),
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
    link.setAttribute('download', `registros_envios_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.mostrarExito('Registros exportados correctamente');
  }

  // ========== Navegación ==========

  volverACreditos() {
    this.router.navigate(['/creditos']);
  }

  // ========== Helpers ==========

  contarPorEstado(estado: string): number {
    return this.registrosFiltrados.filter(r => r.estado === estado).length;
  }

  getEstadoEnvioBadge(estado: string): 'success' | 'danger' | 'warn' {
    switch (estado) {
      case 'EXITOSO': return 'success';
      case 'FALLIDO': return 'danger';
      case 'PENDIENTE': return 'warn';
      default: return 'warn';
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