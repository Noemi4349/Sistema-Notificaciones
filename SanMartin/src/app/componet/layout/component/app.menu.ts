import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `
})
export class AppMenu {
    model: MenuItem[] = [];

    ngOnInit() {
        this.model = [
            {
                label: 'Home',
                items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/layout/dashboard'] }]
            },
            // app.menu.ts
{
    label: 'Cumpleaños',
    items: [
        {
            label: 'Cumpleaños',
            icon: 'pi pi-fw pi-gift',
            routerLink: ['/layout/cumpleanos'],
            command: () => {
                console.log('Navegando a /layout/cumpleanos');
            }
        }
    ]
},

{
    label: 'Recordatorio',
    items: [
        {
            label: 'Recordatorio',
            icon: 'pi pi-bell',
            routerLink: ['/layout/recordatorio'],
            command: () => {
                console.log('Navegando a /layout/recordatorio');
            }
        }
    ]
},


{
    label: 'Recordatorio Creditos',
    items: [
        {
            label: 'Recordatorio Creditos',
            icon: 'pi pi-bell',
            routerLink: ['/layout/creditos'],
            command: () => {
                console.log('Navegando a /layout/creditos');
            }
        },
        {
            label: 'Programacion Horario',
            icon: 'pi pi-bell',
            routerLink: ['/layout/scheduler-config'],
            command: () => {
                console.log('Navegando a /layout/scheduler-config');
            }
        }
    ]
},
           
            {
                label: 'Pages',
                icon: 'pi pi-fw pi-briefcase',
                routerLink: ['/pages'],
                items: [
                    {
                        label: 'Landing',
                        icon: 'pi pi-fw pi-globe',
                        routerLink: ['/landing']
                    },
                    {
                        label: 'Auth',
                        icon: 'pi pi-fw pi-user',
                        items: [
                            {
                                label: 'Login',
                                icon: 'pi pi-fw pi-sign-in',
                                routerLink: ['/auth/login']
                            },
                            {
                                label: 'Error',
                                icon: 'pi pi-fw pi-times-circle',
                                routerLink: ['/auth/error']
                            },
                            {
                                label: 'Access Denied',
                                icon: 'pi pi-fw pi-lock',
                                routerLink: ['/auth/access']
                            }
                        ]
                    },
                    {
                        label: 'Crud',
                        icon: 'pi pi-fw pi-pencil',
                        routerLink: ['/pages/crud']
                    },
                    {
                        label: 'Not Found',
                        icon: 'pi pi-fw pi-exclamation-circle',
                        routerLink: ['/pages/notfound']
                    },
                    {
                        label: 'Empty',
                        icon: 'pi pi-fw pi-circle-off',
                        routerLink: ['/pages/empty']
                    }
                ]
            },
           
            {
                label: 'Get Started',
                items: [
                    {
                        label: 'Documentation',
                        icon: 'pi pi-fw pi-book',
                        routerLink: ['/documentation']
                    },
                    {
                        label: 'View Source',
                        icon: 'pi pi-fw pi-github',
                        url: 'https://github.com/primefaces/sakai-ng',
                        target: '_blank'
                    }
                ]
            }
        ];
    }
}
