import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
    {
       path: '',
       component: HomeComponent,
       pathMatch: 'full'
     },
    //  {
    //    path: 'Gerenciamento de Projetos',
    //    loadChildren: () => import('taskflow-component/component').then(c => c.ProjectManagementComponent)
    //  },
    //  {
    //    path: 'Colaboração em Tempo Real',
    //    loadChildren: () => import('taskflow-reactive/component').then(c => c.RealTimeCollaborationComponent)
    //  },
    //  {
    //    path: 'Análise e Relatórios',
    //    loadChildren: () => import('taskflow-functional/component').then(c => c.AnalyticsReportComponent)
    //  },
];
