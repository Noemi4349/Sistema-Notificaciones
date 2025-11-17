import { Routes } from '@angular/router';
import { AppLayout } from './app/componet/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Landing } from './app/pages/landing/landing';
import { Notfound } from './app/pages/notfound/notfound';
import { LoginComponent } from './app/componet/login/login.component';
import { AuthGuard } from './guards/auth.guard';
import { CumpleanosComponent } from './app/componet/notificaciones/cumpleanos.component';
import { RecordatorioComponent } from './app/componet/recordatorio/recordatorio.component';
import { CreditosComponent } from '@/componet/creditos/creditos.component';

export const appRoutes: Routes = [
    { path: '', component: LoginComponent },
 
    { path: 'layout', component: AppLayout, canActivate: [AuthGuard],
 
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard},
      { path: 'cumpleanos', component: CumpleanosComponent },
      { path: 'recordatorio', component: RecordatorioComponent },
      { path: 'creditos', component: CreditosComponent },
    ]
  },
 

  { path: 'landing', component: Landing },
  { path: 'notfound', component: Notfound },
  { path: '**', redirectTo: '/notfound' }
];



