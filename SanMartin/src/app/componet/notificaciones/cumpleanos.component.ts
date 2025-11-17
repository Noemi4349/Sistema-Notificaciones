import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { FileUploadModule } from 'primeng/fileupload';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { CumpleanosService, Socio } from 'src/app/service/cumpleanos.service';

@Component({
  selector: 'app-cumpleanos',
  standalone: true,
  templateUrl: './cumpleanos.component.html',
  styleUrls: ['./cumpleanos.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    TableModule,
    CardModule,
    DialogModule,
    FileUploadModule,
    CheckboxModule
  ],
  providers: [MessageService, CumpleanosService]
})
export class CumpleanosComponent implements OnInit, OnDestroy {
  enviarMensaje() {
    throw new Error('Method not implemented.');
  }
  socios: Socio[] = [];
  reporteEnvios: any[] = [];
  loading = false;

  // Estados de UI
  displaySubirDialog = false;
  displayEnviarDialog = false;
  mostrarCampoMensaje = false;
  verReporte = false;

  // Campos de configuración
  mensajePersonalizado: string = `🎉 ¡FELIZ CUMPLEAÑOS! 🎂
Te deseamos un día maravilloso lleno de alegría y buenos momentos.`;
  archivoSeleccionado: File | null = null;
  mediaURL: string | null = null;

  incluirImagen = false;
  incluirVideo = false;

  selectedSocio: Socio | null = null;

  // Programación automática
  horaProgramada: string = '';
  horaGuardada: string | null = null;
  intervaloVerificacion: any = null;
  
  tiempoRestante: {
    dias: number;
    horas: number;
    minutos: number;
    segundos: number;
  } | null = null;
  
  intervaloContador: any = null;

  constructor(
    private cumpleanosService: CumpleanosService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    console.log('🚀 Componente inicializado');
    
    // 👇 NUEVO: Cargar configuración actual al iniciar
    this.cargarConfiguracionActual();
    
    // Cargar cumpleañeros
    this.cargarCumpleanosHoy();
  }

  ngOnDestroy(): void {
    if (this.intervaloVerificacion) clearInterval(this.intervaloVerificacion);
    if (this.intervaloContador) clearInterval(this.intervaloContador);
  }

  // 👇 NUEVO: Cargar configuración guardada (mensaje + archivo + hora)
  cargarConfiguracionActual(): void {
    console.log('📥 Cargando configuración actual...');
    
    this.cumpleanosService.obtenerConfiguracionActual().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const config = response.data;
          
          // Restaurar mensaje
          if (config.mensaje) {
            this.mensajePersonalizado = config.mensaje;
            console.log('💬 Mensaje restaurado:', config.mensaje.substring(0, 50) + '...');
          }
          
          // Restaurar hora programada
          if (config.horaEnvio) {
            this.horaProgramada = config.horaEnvio;
            this.horaGuardada = config.horaEnvio;
            console.log('⏰ Hora restaurada:', config.horaEnvio);
            
            // Iniciar contador si hay hora guardada
            this.actualizarContador();
            this.intervaloContador = setInterval(() => {
              this.actualizarContador();
            }, 1000);
          }
          
          // Restaurar archivo multimedia (si existe)
          if (config.archivoMultimedia) {
            const media = config.archivoMultimedia;
            console.log('📎 Archivo encontrado:', media.nombreArchivo);
            
            // Construir URL del archivo
            if (media.urlAcceso) {
              this.mediaURL = `http://localhost:8081${media.urlAcceso}`;
              console.log('🖼️ URL del archivo:', this.mediaURL);
              
              // Crear un File object simulado para la vista previa
              // (esto permite que se muestre en la UI sin tener que re-subirlo)
              const tipoMime = media.tipoMedia === 'IMAGEN' ? 'image/jpeg' : 'video/mp4';
              this.archivoSeleccionado = new File([], media.nombreArchivo, { type: tipoMime });
            }
          }
          
          this.messageService.add({
            severity: 'info',
            summary: 'Configuración cargada',
            detail: 'Se restauró la última configuración guardada',
            life: 3000
          });
          
        } else {
          console.log('ℹ️ No hay configuración guardada previamente');
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar configuración:', error);
        // No mostrar error al usuario si no hay configuración previa
      }
    });
  }

  // 🎂 Cargar lista desde la base de datos
  cargarCumpleanosHoy(): void {
    this.loading = true;
    this.cumpleanosService.getCumpleanosHoy().subscribe({
      next: (data) => {
        this.socios = data;
        this.loading = false;
        console.log('✅ Cumpleañeros cargados:', data.length);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los cumpleaños'
        });
        this.loading = false;
        console.error('❌ Error:', error);
      }
    });
  }

  // 📤 Abrir diálogo para enviar mensaje
  abrirEnviarDialog(socio: Socio): void {
    this.selectedSocio = socio;
    this.displayEnviarDialog = true;
  }

  // ✅ Enviar mensaje personalizado
  enviarFelicitacion(): void {
    if (!this.selectedSocio) return;

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
    console.log('📧 Enviando mensaje a:', this.selectedSocio.nombreCompleto);
    
    this.cumpleanosService.enviarFelicitacion(this.selectedSocio.id, mensaje).subscribe({
      next: (response) => {
        console.log('✅ Respuesta:', response);
        
        // Agregar al reporte local
        const registro = {
          id: `MSG-${Date.now()}`,
          nombre: this.selectedSocio!.nombreCompleto,
          telefono: this.selectedSocio!.telefono,
          fecha: new Date(),
          estado: response.success ? 'ENVIADO' : 'ERROR',
          tipoMensaje: this.archivoSeleccionado ? 
            (this.archivoSeleccionado.type.startsWith('image/') ? 'Imagen + Texto' : 'Video + Texto') : 
            'Texto'
        };
        this.reporteEnvios.push(registro);

        this.messageService.add({
          severity: 'success',
          summary: '✅ Éxito',
          detail: response.message || `Felicitación enviada a ${this.selectedSocio!.nombreCompleto}`,
          life: 4000
        });

        this.displayEnviarDialog = false;
        this.selectedSocio = null;
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error:', error);
        
        this.messageService.add({
          severity: 'error',
          summary: '❌ Error',
          detail: error.message || 'No se pudo enviar la felicitación'
        });
        this.loading = false;
      }
    });
  }

  // 📁 Subida de archivo
  abrirSubirDialog(): void {
    this.displaySubirDialog = true;
  }

  onFileSelect(event: any): void {
    if (event.files && event.files.length > 0) {
      this.archivoSeleccionado = event.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        this.mediaURL = reader.result as string;
      };

      if (this.archivoSeleccionado) {
        reader.readAsDataURL(this.archivoSeleccionado);
        
        console.log('📎 Archivo seleccionado:', this.archivoSeleccionado.name);
        console.log('📏 Tamaño:', (this.archivoSeleccionado.size / 1024).toFixed(2), 'KB');
        
        this.messageService.add({
          severity: 'info',
          summary: 'Archivo seleccionado',
          detail: `${this.archivoSeleccionado.name} (${(this.archivoSeleccionado.size / 1024).toFixed(2)} KB)`,
          life: 3000
        });
      }
    }
  }

  // 👇 MEJORADO: Subir archivo con notificación de éxito del backend
  subirMedia(): void {
    if (!this.archivoSeleccionado) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Selecciona un archivo primero'
      });
      return;
    }

    this.loading = true;
    console.log('📤 Subiendo archivo:', this.archivoSeleccionado.name);
    
    this.cumpleanosService.subirMedia(this.archivoSeleccionado).subscribe({
      next: (response) => {
        console.log('✅ Respuesta del servidor:', response);
        
        // Mostrar el mensaje de éxito del backend
        this.messageService.add({
          severity: 'success',
          summary: '✅ Archivo subido con éxito',
          detail: response.message || `Archivo "${this.archivoSeleccionado!.name}" guardado correctamente`,
          life: 4000
        });
        
        // Agregar al reporte
        const registro = {
          id: `FILE-${Date.now()}`,
          nombre: 'Archivo multimedia',
          telefono: '-',
          fecha: new Date(),
          estado: 'SUBIDO',
          tipoMensaje: this.archivoSeleccionado!.type.startsWith('image/') ? 'Imagen' : 'Video'
        };
        this.reporteEnvios.push(registro);
        
        this.displaySubirDialog = false;
        this.loading = false;
        
        // NO limpiamos archivoSeleccionado para que se mantenga en vista previa
        console.log('✅ Archivo guardado con ID:', response.data?.id);
      },
      error: (error) => {
        console.error('❌ Error al subir:', error);
        
        this.messageService.add({
          severity: 'error',
          summary: '❌ Error al subir archivo',
          detail: error.message || 'No se pudo subir el archivo'
        });
        this.loading = false;
      }
    });
  }

  cancelarSubida(): void {
    this.displaySubirDialog = false;
    this.archivoSeleccionado = null;
    this.mediaURL = null;
  }

  // 👇 MEJORADO: Guardar mensaje con notificación del backend
  guardarMensajePersonalizado(): void {
    const mensaje = this.mensajePersonalizado.trim();
    
    if (!mensaje) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Mensaje vacío',
        detail: 'Debes escribir un mensaje antes de guardarlo.'
      });
      return;
    }

    console.log('💾 Guardando mensaje:', mensaje.substring(0, 50) + '...');
    this.loading = true;
    
    // 👇 AHORA USA EL ENDPOINT DEL BACKEND
    this.cumpleanosService.guardarMensajePersonalizado(mensaje).subscribe({
      next: (response) => {
        console.log('✅ Respuesta:', response);
        
        // Mostrar el mensaje de éxito del backend
        this.messageService.add({
          severity: 'success',
          summary: '✅ Mensaje guardado con éxito',
          detail: response.message || 'El mensaje se guardó correctamente en la base de datos',
          life: 4000
        });
        
        // Agregar al reporte
        const registro = {
          id: response.data?.id || `MSG-${Date.now()}`,
          nombre: 'Mensaje personalizado',
          telefono: '-',
          fecha: new Date(),
          estado: 'GUARDADO',
          tipoMensaje: 'Texto personalizado'
        };
        this.reporteEnvios.push(registro);
        
        this.loading = false;
        
        // Opcional: cerrar el campo
        // this.mostrarCampoMensaje = false;
      },
      error: (error) => {
        console.error('❌ Error:', error);
        
        this.messageService.add({
          severity: 'error',
          summary: '❌ Error al guardar',
          detail: error.message || 'No se pudo guardar el mensaje'
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
    
    console.log('⏰ Guardando hora:', this.horaProgramada);
    
    this.messageService.add({
      severity: 'success',
      summary: '⏰ Hora guardada',
      detail: `El envío automático se ejecutará a las ${this.horaGuardada}`,
      life: 4000
    });

    // Limpiar intervalos previos
    if (this.intervaloVerificacion) clearInterval(this.intervaloVerificacion);
    if (this.intervaloContador) clearInterval(this.intervaloContador);

    // Iniciar contador regresivo
    this.actualizarContador();
    this.intervaloContador = setInterval(() => {
      this.actualizarContador();
    }, 1000);

    // Verificar hora de ejecución
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
    console.log('🤖 Ejecutando envío automático...');
    
    this.cumpleanosService.ejecutarAutomatico().subscribe({
      next: (response) => {
        console.log('✅ Respuesta:', response);
        
        this.messageService.add({
          severity: 'success',
          summary: '✅ Automático completado',
          detail: response.message || 'Envío automático realizado correctamente'
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error:', error);
        
        this.messageService.add({
          severity: 'error',
          summary: '❌ Error',
          detail: error.message || 'No se pudo ejecutar el envío automático'
        });
        this.loading = false;
      }
    });
  }

  // 🖨️ Imprimir reporte
  imprimirReporte(): void {
    window.print();
  }
}