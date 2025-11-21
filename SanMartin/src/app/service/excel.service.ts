import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExcelService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  enviarMensajes(payload: any) {
    return this.http.post(`${this.apiUrl}/api/mensajeria/enviar`, payload);
  }
}

