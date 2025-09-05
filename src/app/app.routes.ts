import { loadRemoteModule } from '@angular-architects/module-federation';
import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { MfeDiagnosticsComponent } from './shared/diagnostics/mfe-diagnostics.component';
import { ModuleUnavailableComponent } from './shared/module-unavailable/module-unavailable.component';

const loadRemoteComponent = (remoteName: string, exposedModule: string) => {
  return loadRemoteModule({
      remoteName: remoteName, 
      exposedModule: exposedModule
    })
    .then(m => m[exposedModule.replace('./', '')]) 
    .catch(err => {
      console.error(`Erro ao carregar ${remoteName}/${exposedModule}`, err);
      return ModuleUnavailableComponent; 
    });
};

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
        children: [
            {
                path: '',
                redirectTo: 'projects',
                pathMatch: 'full'
            },
            {
                path: 'projects',
                loadComponent: () => loadRemoteComponent('taskflow-component', './ProjectListComponent')
            },
            {
                path: 'projects/new',
                loadComponent: () => loadRemoteComponent('taskflow-component', './ProjectFormComponent')
            },
            {
                path: 'projects/edit/:id',
                loadComponent: () => loadRemoteComponent('taskflow-component', './ProjectFormComponent')
            },
            {
                path: 'projects/:id/board',
                loadComponent: () => loadRemoteComponent('taskflow-component', './KanbanBoardComponent')
            }
        ]
    },
    {
        path: 'real-time-collaboration',
        loadComponent: () => loadRemoteComponent('taskflow-reactive', './RealTimeCollaborationComponent')
    },
    {
        path: 'analytics-report',
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },
            {
                path: 'dashboard',
                loadComponent: () => loadRemoteComponent('taskflow-functional', './AnalyticsReportComponent')
            },
            {
                path: 'reports/new',
                loadComponent: () => loadRemoteComponent('taskflow-functional', './ReportFormComponent')
            },
            {
                path: 'reports/:id',
                loadComponent: () => loadRemoteComponent('taskflow-functional', './ReportDetailComponent')
            }
        ]
    },
    {
        path: '**',
        redirectTo: ''
    }
];
