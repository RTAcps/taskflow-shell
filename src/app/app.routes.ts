import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { loadRemoteModule } from '@angular-architects/module-federation';
import { environment } from '../environments/environment';

// Define a helper function for safe remote loading with proper error handling
const safeLoadRemoteModule = (remoteEntry: string, exposedModule: string) => {
  return () => loadRemoteModule({
    type: 'module',
    remoteEntry: remoteEntry,
    exposedModule: exposedModule
  }).catch(err => {
    console.error(`Failed to load remote module: ${exposedModule}`, err);
    throw new Error(`Failed to load remote module: ${exposedModule}`);
  });
};

export const routes: Routes = [
    {
        path: '',
        component: HomeComponent,
        pathMatch: 'full'
    },
    {
        path: 'project-management',
        children: [
            {
                path: '',
                loadComponent: () => 
                    safeLoadRemoteModule(
                        environment.remoteUrls['taskflow-component'],
                        './ProjectListComponent'
                    )()
                    .then(m => m.ProjectListComponent)
            },
            {
                path: 'projects/new',
                loadComponent: () => 
                    safeLoadRemoteModule(
                        environment.remoteUrls['taskflow-component'],
                        './ProjectFormComponent'
                    )()
                    .then(m => m.ProjectFormComponent)
            },
            {
                path: 'projects/edit/:id',
                loadComponent: () => 
                    safeLoadRemoteModule(
                        environment.remoteUrls['taskflow-component'],
                        './ProjectFormComponent'
                    )()
                    .then(m => m.ProjectFormComponent)
            },
            {
                path: 'projects/:id/board',
                loadComponent: () => 
                    safeLoadRemoteModule(
                        environment.remoteUrls['taskflow-component'],
                        './KanbanBoardComponent'
                    )()
                    .then(m => m.KanbanBoardComponent)
            }
        ]
    },
    {
        path: 'real-time-collaboration',
        loadComponent: () => 
            safeLoadRemoteModule(
                environment.remoteUrls['taskflow-reactive'],
                './RealTimeCollaborationComponent'
            )()
            .then(m => m.RealtimeCollaborationComponent)
    },
    {
        path: 'analytics-report',
        loadComponent: () => import('./analytics-report-wrapper.component').then(m => m.AnalyticsReportWrapperComponent)
    },
];
