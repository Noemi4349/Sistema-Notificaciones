import { Routes } from '@angular/router';
import { AppLayout } from './app/componet/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { LoginComponent } from './app/componet/login/login.component';
import { AuthGuard } from './guards/auth.guard';
import { CreditosComponent } from '@/componet/creditos/creditos.component';

export const appRoutes: Routes = [
    { path: '', component: LoginComponent },
 
    { path: 'layout', component: AppLayout, canActivate: [AuthGuard],
 
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: Dashboard},
      { path: 'creditos', component: CreditosComponent },
    ]
  },
];



