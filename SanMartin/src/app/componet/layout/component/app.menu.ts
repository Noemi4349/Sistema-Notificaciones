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

            {
                label: 'Recordatorio',
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
                        label: 'Registros de Envíos',
                        icon: 'pi pi-history',
                        routerLink: ['/layout/registros'],
                        command: () => {
                            console.log('Navegando a /layout/registros');
                        }
                    },
                ]
            },
            {
                label: 'Mensajería',
                items: [
                    {
                        label: 'Enviar Mensajes Excel',
                        icon: 'pi pi-send',
                        routerLink: ['/layout/excel'],
                        command: () => {
                            console.log('Navegando a /layout/excel');
                        }
                    }
                ]
            }
           
        ];
    }
}
