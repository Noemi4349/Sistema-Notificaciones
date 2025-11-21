import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { FileUploadModule } from 'primeng/fileupload';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';

import * as XLSX from 'xlsx';
import { ExcelService } from '../../service/excel.service';

@Component({
  selector: 'app-excel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FileUploadModule,
    TableModule,
    InputTextModule,
    ButtonModule
  ],
  templateUrl: './excel.component.html',
  styleUrls: ['./excel.component.scss'],
  providers: [MessageService]
})
export class ExcelComponent {

  excelData: any[] = [];
  mensaje: string = '';

  constructor(
    private excelService: ExcelService,
    private messageService: MessageService
  ) {}

  // -----------------------------
  // Cargar archivo Excel
  // -----------------------------
  onFileSelected(event: any) {
    const file = event.currentFiles[0];

    if (!file) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se seleccionó ningún archivo.'
      });
      return;
    }

    const reader = new FileReader();

    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);

      // Mapear columnas dinámicamente
      this.excelData = json.map((item: any) => ({
        numeroSocio:
          item.numeroSocio || item.NUMERO || item.Numero || item.SOCIO || '',
        nombres:
          item.nombres || item.Nombres || item.Nombre || item.NOMBRE || ''
      }));

      if (this.excelData.length === 0) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Advertencia',
          detail: 'El Excel no contiene datos válidos.'
        });
      }
    };

    reader.readAsArrayBuffer(file);
  }

  // -----------------------------
  // Enviar Mensajes al Backend
  // -----------------------------
  enviarMensajes() {
    if (!this.mensaje || this.excelData.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos incompletos',
        detail: 'Debe cargar un mensaje y un Excel.'
      });
      return;
    }

    const payload = {
      mensaje: this.mensaje,
      socios: this.excelData
    };

    this.excelService.enviarMensajes(payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Enviado',
          detail: 'Mensajes enviados correctamente.'
        });

        // Limpieza luego del envío
        this.mensaje = '';
        this.excelData = [];
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Ocurrió un error al enviar los mensajes.'
        });
      }
    });
  }
}
