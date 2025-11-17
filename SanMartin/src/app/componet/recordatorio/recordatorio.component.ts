import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';

import { RecordatorioService, Socio } from 'src/app/service/recordatorio.service';

@Component({
  selector: 'app-recordatorio',
  standalone: true,
  templateUrl: './recordatorio.component.html',
  styleUrls: ['./recordatorio.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    TableModule,
    DialogModule,
    CardModule
  ],
  providers: [MessageService, RecordatorioService]
})
export class RecordatorioComponent implements OnInit, OnDestroy {
  socios: Socio[] = [];
  reporteEnvios: any[] = [];
  loading = false;

  // Estados de UI
  mostrarCampoMensaje = false;
  verReporte = false;

mostrarModalAgregar = false;

nuevoUsuario: any = {
  numeroSocio: "",
  nombreCompleto: "",
  telefono: "",
  numeroCredito: "",
  fechaVencimiento: ""
};

guardarNuevoUsuario() {

  const nuevo: Socio = {
    id: this.socios.length + 1,
    numeroSocio: this.nuevoUsuario.numeroSocio,
    nombreCompleto: this.nuevoUsuario.nombreCompleto,
    telefono: this.nuevoUsuario.telefono,
    numeroCredito: this.nuevoUsuario.numeroCredito,
    fechaVencimiento: this.nuevoUsuario.fechaVencimiento,
    email: "no-registrado@mail.com",
    montoPendiente: 0,
    activo: true
  };

  this.socios.push(nuevo);

  this.mostrarModalAgregar = false;

  // Limpia formulario
  this.nuevoUsuario = {
    numeroSocio: "",
    nombreCompleto: "",
    telefono: "",
    numeroCredito: "",
    fechaVencimiento: ""
  };
}





  // Campos de configuración
  mensajePersonalizado: string = `📢 RECORDATORIO DE CRÉDITO

Estimado socio, le recordamos que su crédito está próxima a vencer.

Por favor, realice su pago a la brevedad posible.

¡Gracias por su puntualidad! 💙`;

  selectedSocio: Socio | null = null;

  // Programación automática
  horaProgramada: string = '';
  horaGuardada: string | null = null;
  intervaloVerificacion: any = null;
  
  // Contador regresivo
  tiempoRestante: {
    dias: number;
    horas: number;
    minutos: number;
    segundos: number;
  } | null = null;
  
  intervaloContador: any = null;

  constructor(
    private recordatorioService: RecordatorioService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.cargarSociosPendientes();
    // 🔥 NUEVO: Cargar reporte al iniciar
    this.cargarReporte();
  }

  ngOnDestroy(): void {
    if (this.intervaloVerificacion) clearInterval(this.intervaloVerificacion);
    if (this.intervaloContador) clearInterval(this.intervaloContador);
  }

  // 📋 Cargar lista de socios con cuotas pendientes
  cargarSociosPendientes(): void {
    this.loading = true;
    this.recordatorioService.getClientesPendientes().subscribe({
      next: (data) => {
        this.socios = data;
        this.loading = false;
        console.log('✅ Socios cargados desde JSON:', data);
      },
      error: (error) => {
        console.error('❌ Error al cargar socios:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los socioss'
        });
        this.loading = false;
      }
    });
  }

  // 📊 🔥 NUEVO: Cargar reporte desde el backend
  cargarReporte(): void {
    this.recordatorioService.getReporteEnvios().subscribe({
      next: (data) => {
        this.reporteEnvios = data;
        console.log('📊 Reporte cargado desde BD:', data);
      },
      error: (error) => {
        console.error('❌ Error al cargar reporte:', error);
      }
    });
  }

  // 📤 Enviar recordatorio individual
  enviarRecordatorio(socio: Socio): void {
    const mensaje = this.mensajePersonalizado.trim();
    if (!mensaje) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Mensaje vacío',
        detail: 'Debes escribir un mensaje antes de enviar.'
      });
      return;
    }

    this.loading = true;
    this.recordatorioService.enviarRecordatorio(socio.id, mensaje).subscribe({
      next: (response) => {
        console.log('✅ Respuesta del servidor:', response);
        
        // 🔥 IMPORTANTE: Recargar el reporte después de enviar
        this.cargarReporte();

        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Recordatorio enviado a ${socio.nombreCompleto}`
        });

        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error al enviar:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `No se pudo enviar el recordatorio a ${socio.nombreCompleto}`
        });
        this.loading = false;
      }
    });
  }

  // 🕒 Programar hora automática con contador regresivo
  guardarHoraProgramada(): void {
    if (!this.horaProgramada) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Debes seleccionar una hora para programar el envío automático'
      });
      return;
    }

    this.horaGuardada = this.horaProgramada;
    this.messageService.add({
      severity: 'success',
      summary: 'Hora guardada',
      detail: `El envío automático se ejecutará a las ${this.horaGuardada}`
    });

    if (this.intervaloVerificacion) clearInterval(this.intervaloVerificacion);
    if (this.intervaloContador) clearInterval(this.intervaloContador);

    this.actualizarContador();
    this.intervaloContador = setInterval(() => {
      this.actualizarContador();
    }, 1000);

    this.intervaloVerificacion = setInterval(() => {
      const ahora = new Date();
      const horaActual = ahora.toTimeString().slice(0, 5);
      if (horaActual === this.horaGuardada) {
        this.ejecutarAutomatico();
        clearInterval(this.intervaloVerificacion);
        clearInterval(this.intervaloContador);
        this.tiempoRestante = null;
      }
    }, 60000);
  }



  // ⏱️ Actualizar contador regresivo
  private actualizarContador(): void {
    if (!this.horaGuardada) return;

    const ahora = new Date();
    const [horaTarget, minutoTarget] = this.horaGuardada.split(':').map(Number);
    
    const targetTime = new Date();
    targetTime.setHours(horaTarget, minutoTarget, 0, 0);

    if (targetTime <= ahora) {
      targetTime.setDate(targetTime.getDate() + 1);
    }

    const diferencia = targetTime.getTime() - ahora.getTime();

    if (diferencia > 0) {
      this.tiempoRestante = {
        dias: Math.floor(diferencia / (1000 * 60 * 60 * 24)),
        horas: Math.floor((diferencia / (1000 * 60 * 60)) % 24),
        minutos: Math.floor((diferencia / (1000 * 60)) % 60),
        segundos: Math.floor((diferencia / 1000) % 60)
      };
    } else {
      this.tiempoRestante = null;
    }
  }
  // 🤖 Envío automático masivo
  ejecutarAutomatico(): void {
    this.loading = true;
    this.recordatorioService.ejecutarAutomatico().subscribe({
      next: (response) => {
        console.log('✅ Envío automático completado:', response);
        this.messageService.add({
          severity: 'success',
          summary: 'Automático',
          detail: response.message || 'Envío automático realizado correctamente'
        });
        this.cargarSociosPendientes();
        this.cargarReporte(); // 🔥 Recargar el reporte
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error en envío automático:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo ejecutar el envío automático'
        });
        this.loading = false;
      }
    });
  }

  // 🖨️ Imprimir reporte
  imprimirReporte(): void {
    window.print();
  }

  // 📅 Calcular diferencia en días
  getDiasRestantes(fechaVencimiento: string): number {
    const hoy = new Date();
    const fecha = new Date(fechaVencimiento);
    hoy.setHours(0, 0, 0, 0);
    fecha.setHours(0, 0, 0, 0);
    const diferenciaMs = fecha.getTime() - hoy.getTime();
    return Math.round(diferenciaMs / (1000 * 60 * 60 * 24));
  }

  // 📝 Texto descriptivo de días restantes
  getDiasRestantesTexto(fechaVencimiento: string): string {
    const dias = this.getDiasRestantes(fechaVencimiento);
    
    if (dias < 0) {
      return `Vencido hace ${Math.abs(dias)} día${Math.abs(dias) !== 1 ? 's' : ''}`;
    } else if (dias === 0) {
      return '¡Vence HOY!';
    } else if (dias === 1) {
      return 'Vence mañana';
    } else if (dias <= 2) {
      return `🔶 Vence en ${dias} días`;
    } else if (dias <= 7) {
      return `Vence en ${dias} días`;
    } else {
      return `${dias} días restantes`;
    }
  }

  // 💰 Calcular monto total del reporte
  calcularMontoTotal(): number {
    return this.reporteEnvios.reduce((total, registro) => {
      return total + (registro.montoPendiente || 0);
    }, 0);
  }

  // 💾 Guardar mensaje personalizado
  guardarMensajePersonalizado(): void {
    if (!this.mensajePersonalizado || this.mensajePersonalizado.trim() === '') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Por favor escribe un mensaje antes de guardar'
      });
      return;
    }

    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Mensaje de recordatorio guardado correctamente'
    });

     // ✅ CERRAR la ventana después de guardar (pequeño delay para que se vea el toast)
  setTimeout(() => {
    this.mostrarCampoMensaje = false;
  }, 100);
  }

  // ❌ Cancelar edición del mensaje
  cancelarMensaje(): void {
    this.mensajePersonalizado = `📢 RECORDATORIO DE CRÉDITO

Estimado socio, le recordamos que su crédito está próxima a vencer.

Por favor, realice su pago a la brevedad posible.

¡Gracias por su puntualidad! 💙`;
    
    this.mostrarCampoMensaje = false;
  }
}