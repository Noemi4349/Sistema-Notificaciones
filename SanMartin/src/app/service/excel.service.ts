import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExcelService {

  private API_URL = 'http://localhost:8083/excel';

  constructor(private http: HttpClient) {}

  //enviarExcel(file: File, mensaje: string): Observable<any> {
  //const formData = new FormData();
  //formData.append('file', file);
  //formData.append('mensaje', mensaje);

  //return this.http.post(`${this.API_URL}/procesar`, formData, {
  //  responseType: 'text'
  //});
//}
// 🔥 ESTE ES EL QUE ENVÍA MENSAJES + PROCESA EXCEL
  enviarExcel(formData: FormData): Observable<any> {
    return this.http.post(`${this.API_URL}/procesar-enviar`, formData, {
      responseType: 'text'
    });
  }

 //lee excel 
  leerExcel(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.API_URL}/leer`, formData);
  }

 // guardarMensaje(formData: FormData) {
 // return this.http.post(`${this.API_URL}/guardar-mensaje`, formData);
//}
//guardarMensaje(formData: FormData) {
  //return this.http.post(`${this.API_URL}/guardar-mensaje`, formData, {
    //responseType: 'text'
  //});
//}
guardarMensaje(formData: FormData) {
  return this.http.post(
    this.API_URL + '/guardar-mensaje',
    formData,
    { responseType: 'text' }
  );
}

}

