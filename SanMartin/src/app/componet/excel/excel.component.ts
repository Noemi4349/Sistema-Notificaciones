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
  archivoExcel: File | null = null;
  fileName: string = '';


  constructor(
    private excelService: ExcelService,
    private messageService: MessageService
  ) {}

  // ------------------------------------------------
  // Leer Excel
  // ------------------------------------------------
  onFileSelected(event: any) {
    const file = event.target.files[0];

    if (!file) return;

    this.archivoExcel = file;
    this.fileName = file.name; 

    const reader = new FileReader();

    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);

      this.excelData = json.map((item: any) => {
        const numero = (item["Numero Telefono"] || item.telefono || "").toString().replace(/\D/g, '');

        return {
          numeroSocio: item["Numero Socio"] || item.numeroSocio || "",
          nombres: item["Nombre Completo"] || item.nombres || "",
          numeroTelefono: numero,
          valido: numero.length === 8
        };
      });
    };

    reader.readAsArrayBuffer(file);
  }

  // ------------------------------------------------
  // Enviar archivo + mensaje al backend
  // ------------------------------------------------
 //enviarMensajes() {
 // if (!this.archivoExcel || !this.mensaje.trim()) {
  //  this.messageService.add({
  //    severity: 'warn',
  //    summary: 'Faltan datos',
  //    detail: 'Selecciona un archivo y escribe un mensaje.'
  //  });
  //  return;
  //}

  //const formData = new FormData();
  //formData.append('file', this.archivoExcel);
  //formData.append('mensaje', this.mensaje);

  //this.excelService.enviarExcel(this.archivoExcel, this.mensaje).subscribe({
  //  next: (res) => {
  //    this.messageService.add({
  //      severity: 'success',
  //      summary: 'Éxito',
  //      detail: res
  //    });

  //    this.mensaje = '';
 //     this.excelData = [];
 //     this.archivoExcel = null;
  //  },
  //  error: (err) => {
  //    this.messageService.add({
  //      severity: 'error',
  //      summary: 'Error',
  //      detail: err.error
  //    });
  //  }
  //});
//}
   enviarMensajes() {
  if (!this.archivoExcel || !this.mensaje.trim()) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Faltan datos',
      detail: 'Selecciona un archivo y escribe un mensaje.'
    });
    return;
  }

  const formData = new FormData();
  formData.append('file', this.archivoExcel);
  formData.append('mensaje', this.mensaje);

 this.excelService.enviarExcel(formData).subscribe({
  next: (resp) => {
    console.log("✔ Envíos completos:", resp);
    this.messageService.add({ severity: 'success', summary: 'Éxito', detail: resp });
  },

     
    error: (err) => {
    console.error(err);
    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo enviar' });
  }
});
  
}

  tieneNumerosInvalidos(): boolean {
  return this.excelData && this.excelData.some(s => !s.valido);
}

guardarMensaje() {
  if (!this.mensaje.trim()) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Mensaje vacío',
      detail: 'Escribe un mensaje antes de guardar.'
    });
    return;
  }

  if (!this.archivoExcel) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Archivo faltante',
      detail: 'Sube un archivo Excel primero.'
    });
    return;
  }

  // Llamamos a enviarMensajes porque ya guarda todo en el backend
  this.enviarMensajes();
}

cancelarMensaje() {
  this.mensaje = '';
  this.messageService.add({
    severity: 'info',
    summary: 'Cancelado',
    detail: 'El mensaje fue cancelado.'
  });
}

}
