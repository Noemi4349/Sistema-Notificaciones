import { Routes } from '@angular/router';
import { AppLayout } from './app/componet/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { LoginComponent } from './app/componet/login/login.component';
import { AuthGuard } from './guards/auth.guard';
import { CreditosComponent } from '@/componet/creditos/creditos.component';
import { RegistrosComponent } from '@/componet/registros/registros.component';
import { HistorialEnviosComponent } from '@/componet/historial-envios/historial-envios.component';
import { ExcelComponent } from '@/componet/excel/excel.component';
export const appRoutes: Routes = [
    { path: '', component: LoginComponent },
 
    { path: 'layout', component: AppLayout, canActivate: [AuthGuard],
 
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard},
      { path: 'creditos', component: CreditosComponent },
      { 
                path: 'registros', 
                component: RegistrosComponent,
                data: { title: 'Registros de Envíos' }
            },
      { path: 'historial-envios', component: HistorialEnviosComponent, data: { title: 'Historial de Envíos' } },
      { path: "excel", component: ExcelComponent },

    ]
  },
];



