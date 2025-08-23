import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { loadRemoteModule } from '@angular-architects/module-federation';

export const routes: Routes = [
    {
        path: '',
        component: HomeComponent,
        pathMatch: 'full'
    },
    {
        path: 'project-management',
        // Usar loadRemoteModule diretamente sem injeção de dependência
        loadComponent: () => 
            loadRemoteModule({
                type: 'module',
                remoteEntry: 'http://localhost:4201/remoteEntry.js',
                exposedModule: './Module'
            }).then(m => m.AppComponent)
    },
    {
        path: 'real-time-collaboration',
        loadComponent: () => 
            loadRemoteModule({
                type: 'module',
                remoteEntry: 'http://localhost:4202/remoteEntry.js',
                exposedModule: './RealTimeCollaborationComponent'
            }).then(m => {
                // O componente pode ter um nome diferente no MFE
                return m.ReactiveRootComponent || m.AppComponent;
            })
    },
    {
        path: 'analytics-report',
        loadComponent: () => 
            loadRemoteModule({
                type: 'module',
                remoteEntry: 'http://localhost:4203/remoteEntry.js',
                exposedModule: './AnalyticsReportComponent'
            }).then(m => {
                // O componente pode ter um nome diferente no MFE
                return m.AppFunctionalComponent || m.AppComponent;
            })
    },
];
