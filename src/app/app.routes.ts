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
        loadChildren: () => 
            loadRemoteModule({
                type: 'module',
                remoteEntry: 'http://localhost:4201/remoteEntry.js',
                exposedModule: './Routes'
            }).then(m => m.routes)
    },
    {
        path: 'real-time-collaboration',
        loadComponent: () => 
            loadRemoteModule({
                type: 'module',
                remoteEntry: 'http://localhost:4202/remoteEntry.js',
                exposedModule: './RealTimeCollaborationComponent'
            }).then(m => {
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
                return m.AppFunctionalComponent || m.AppComponent;
            })
    },
];
