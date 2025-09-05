import { loadRemoteModule } from '@angular-architects/module-federation';
import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { MfeDiagnosticsComponent } from './shared/diagnostics/mfe-diagnostics.component';

export const routes: Routes = [
    {
        path: '',
        component: HomeComponent,
        pathMatch: 'full'
    },
    {
        path: 'diagnostics',
        component: MfeDiagnosticsComponent
    },
    {
        path: 'project-management',
        loadComponent: () =>
            loadRemoteModule({
                remoteName: 'taskflow-component',
                exposedModule: './ProjectListComponent',
            }).then((c) => c.ProjectListComponent),
    },
    {
        path: 'real-time-collaboration',
        loadChildren: () =>
            loadRemoteModule({
                remoteName: 'taskflow-reactive',
                exposedModule: './Routes',
            }).then((c) => c.routes), 
    },
    {
        path: 'analytics-report',
        loadChildren: () =>
            loadRemoteModule({
                remoteName: 'taskflow-functional',
                exposedModule: './Routes',
            }).then((c) => c.routes), 
    },
    {
        path: '**',
        redirectTo: ''
    }
];
